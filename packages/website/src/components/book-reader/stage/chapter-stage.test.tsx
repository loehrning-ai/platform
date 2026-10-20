import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./stage-enhancer", () => ({
  StageEnhancer: ({ stageId }: { stageId: string }) => <span data-testid="enhancer" data-stage-runtime={stageId} />,
}));

import { ChapterStage, numeralEm, stepAnchor } from "./chapter-stage";
import type { StageStepCopy } from "./stage-protocol";

const STEPS: StageStepCopy[] = [
  { id: "bars", label: "Fünftel", text: "Das längste Fünftel schreibt 62-mal so oft KI.", numeral: "62x", claim: "Wer viel schreibt, schreibt KI", unit: "1 Quadrat = 21 Startseiten" },
  { id: "flat", label: "Gleiche Textmenge", text: "Bei gleicher Textmenge bleibt davon kaum etwas.", numeral: "224", claim: "Die Hälfte der Verbindungen fällt weg", unit: "1 Quadrat = 21 Startseiten" },
  { id: "kern", label: "Was bleibt", text: "Drei Wörter bleiben stark mit KI verbunden.", numeral: "3", claim: "Drei Verbindungen halten" },
];

const SOURCE = {
  id: "h01",
  n: 21402,
  asOf: "2026-10-18",
  limitation: "Zusammenhang, keine Ursache.",
  sourceLine: "n = 21.402 Startseiten mit eigener Domain · Scan 2026-03 bis 05 · Grenze: Zusammenhang, keine Ursache",
};

function stage() {
  return render(
    <ChapterStage id="h01" label="Textmenge" steps={STEPS} source={SOURCE} csv={[{ href: "/books/x/data/h01.csv", label: "Daten als CSV", fileName: "h01.csv" }]}>
      <svg data-testid="figure" role="img" aria-label="Figur" />
    </ChapterStage>,
  );
}

describe("ChapterStage markup", () => {
  it("is one labelled section with the figure inside the pinned view and the steps as an ordered list", () => {
    const { container } = stage();
    const root = container.querySelector<HTMLElement>("[data-chapter-stage='h01']")!;
    expect(root.tagName).toBe("SECTION");
    expect(root).toHaveAttribute("aria-label", "Textmenge");
    expect(root).toHaveAttribute("id", "stage-h01");
    expect(root.querySelector(".cs-pin [data-chapter-stage-view]")).toContainElement(screen.getByTestId("figure"));
    expect(within(root).getAllByRole("listitem")).toHaveLength(3);
    // The finished state is the server markup: the last step is the active one, static until the script runs.
    expect(root).toHaveAttribute("data-step", "2");
    expect(root).toHaveAttribute("data-mode", "static");
    expect(screen.getByTestId("enhancer")).toHaveAttribute("data-stage-runtime", "h01");
  });

  it("puts the words of a step in its card (claim, sentence, unit line) and only the numeral in the pin", () => {
    const { container } = stage();
    const pin = container.querySelector<HTMLElement>(".cs-pin")!;
    expect(pin.querySelector("[data-cs-numeral]")).not.toBeNull();
    expect(pin).not.toHaveTextContent("Wer viel schreibt, schreibt KI");
    expect(pin).not.toHaveTextContent("1 Quadrat = 21 Startseiten");
    const card = container.querySelector<HTMLElement>(".cs-step[data-step-index='0'] .cs-card")!;
    expect(card.querySelector("[data-cs-claim]")).toHaveTextContent("Wer viel schreibt, schreibt KI");
    expect(card.querySelector("[data-cs-unit]")).toHaveTextContent("1 Quadrat = 21 Startseiten");
    // The third step has no unit line: its card has none either.
    expect(container.querySelector(".cs-step[data-step-index='2'] [data-cs-unit]")).toBeNull();
  });

  it("hands the strip its figure's measure, and marks a figure that does not fit the strip as inline", () => {
    const fits = render(
      <ChapterStage id="a" label="A" steps={STEPS} source={SOURCE} strip={{ fits: true, ratio: 0.441, controlPx: 46 }}>
        <svg />
      </ChapterStage>,
    ).container.querySelector<HTMLElement>("[data-chapter-stage]")!;
    expect(fits).not.toHaveAttribute("data-strip");
    expect(fits.style.getPropertyValue("--cs-fig-ratio")).toBe("0.441");
    expect(fits.style.getPropertyValue("--cs-fig-control")).toBe("46px");
    const inline = render(
      <ChapterStage id="b" label="B" steps={STEPS} source={SOURCE} strip={{ fits: false, ratio: 0.976, controlPx: 50 }}>
        <svg />
      </ChapterStage>,
    ).container.querySelector<HTMLElement>("[data-chapter-stage]")!;
    expect(inline).toHaveAttribute("data-strip", "inline");
    const field = render(
      <ChapterStage id="c" label="C" steps={STEPS} source={SOURCE} strip={{ fits: true, ratio: null, controlPx: 0 }}>
        <svg />
      </ChapterStage>,
    ).container.querySelector<HTMLElement>("[data-chapter-stage]")!;
    expect(field.style.getPropertyValue("--cs-fig-ratio")).toBe("");
  });

  it("states every step as text: Schritt n von N, the numeral, the claim and the one-sentence card", () => {
    const { container } = stage();
    const items = container.querySelectorAll<HTMLElement>(".cs-step");
    expect(items[0]).toHaveTextContent("Schritt 1 von 3");
    expect(items[0]).toHaveTextContent("62x");
    expect(items[0]).toHaveTextContent("Wer viel schreibt, schreibt KI");
    expect(items[0]).toHaveTextContent("Das längste Fünftel schreibt 62-mal so oft KI.");
    expect(items[2]).toHaveTextContent("Schritt 3 von 3");
    expect(items[0]).toHaveAttribute("id", stepAnchor("h01", 0));
    expect(container.querySelector("[data-cs-count]")).toHaveTextContent("Schritt 3 von 3");
    expect(container.querySelector("[data-cs-count]")).toHaveAttribute("aria-live", "polite");
  });

  it("gives Weiter and Zurück as real buttons, so Enter and Space both work", () => {
    const { container } = stage();
    const prev = container.querySelector<HTMLButtonElement>("[data-cs='prev']")!;
    const next = container.querySelector<HTMLButtonElement>("[data-cs='next']")!;
    expect(prev.tagName).toBe("BUTTON");
    expect(prev).toHaveAttribute("type", "button");
    expect(prev).toHaveTextContent("Zurück");
    expect(next).toHaveTextContent("Weiter");
    // At the last (finished) step there is nothing further.
    expect(next).toHaveAttribute("aria-disabled", "true");
    expect(prev).not.toHaveAttribute("aria-disabled", "true");
    expect(container.querySelector(".cs-ctl")).toHaveAttribute("role", "group");
  });

  it("prints one head per step with its numeral, shown by data-step in CSS", () => {
    const { container } = stage();
    const heads = container.querySelectorAll(".cs-head");
    expect(heads).toHaveLength(3);
    expect(heads[1]?.querySelector(".cs-numeral")).toHaveTextContent("224");
    expect(heads[2]?.getAttribute("data-for")).toBe("2");
  });

  it("ends with the visible source line and a plain CSV link, and never collapses", () => {
    const { container } = stage();
    const line = container.querySelector("[data-source-line='h01']")!;
    expect(line).toHaveTextContent("n = 21.402 Startseiten mit eigener Domain · Scan 2026-03 bis 05 · Grenze: Zusammenhang, keine Ursache");
    expect(within(line as HTMLElement).getByRole("link", { name: "Daten als CSV" })).toHaveAttribute("download", "h01.csv");
    expect(container.querySelector("details, summary, [aria-expanded]")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
  });
});

describe("chapter-stage.css contract", () => {
  const css = readFileSync(join(__dirname, "chapter-stage.css"), "utf8");

  it("pins a strip of at most 44 % minus header and reader bar below lg (no taller than its figure needs), one variable shared with the step blocks, which fill the text window above the reader bar", () => {
    expect(css).toMatch(/--cs-bar:\s*calc\(3\.25rem \+ 2px \+ env\(safe-area-inset-bottom, 0px\)\)/);
    expect(css).toMatch(/--cs-pin-h:\s*min\(\s*clamp\(12rem, calc\(44svh - var\(--cs-top\) - var\(--cs-bar\)\), 20rem\),\s*calc\(min\(100cqw, 34rem\) \* var\(--cs-fig-ratio, 9\) \+ var\(--cs-fig-control, 0px\) \+ 4px\)\s*\)/);
    expect(css).toMatch(/\.cs\s*\{[^}]*container-type:\s*inline-size/);
    expect(css).toMatch(/\.cs-pin\s*\{[^}]*height:\s*var\(--cs-pin-h\)/);
    expect(css).toMatch(/\.cs-pin\s*\{[^}]*background:\s*var\(--cs-paper\)/);
    expect(css).toMatch(/\.cs-pin\s*\{[^}]*border-block:\s*2px solid var\(--cs-ink\)/);
    expect(css).toMatch(/\.cs-step\s*\{[^}]*min-height:\s*max\(10rem, calc\(100svh - var\(--cs-top\) - var\(--cs-pin-h\) - var\(--cs-bar\)\)\)/);
  });

  it("stands the pin beside a 62ch text column from lg, never taller than the window under the header", () => {
    const wide = css.slice(css.indexOf("@media (min-width: 1024px)"));
    expect(wide).toMatch(/--cs-pin-h:\s*calc\(100svh - var\(--cs-top\) - 1rem\)/);
    expect(wide).toMatch(/grid-template-areas:\s*"steps pin"\s*"source source"/);
    expect(wide).toMatch(/\.cs-steps\s*\{[^}]*max-width:\s*62ch/);
    expect(wide).toMatch(/\.cs-step\s*\{[^}]*min-height:\s*70svh/);
    expect(wide).toMatch(/\.cs-step:last-child\s*\{[^}]*min-height:\s*var\(--cs-pin-h\)/);
  });

  it("stands a stage inline below lg when its figure does not fit the strip", () => {
    expect(css).toMatch(/@media \(max-width: 1023px\) \{\s*\.cs\[data-strip="inline"\] \.cs-pin \{[^}]*position:\s*static/);
  });

  it("decides the static layout in CSS only: reduced motion, no script, short screens, print and the pause switch", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\), \(scripting: none\), \(max-height: 559px\), print/);
    expect(css).toMatch(/\.cs-chapter:has\(\.cs-pause-input:checked\) \.cs-pin/);
  });

  it("uses hard edges and the anti colours: no radius, gradient or shadow; hover only on fine pointers; a fixed 3px Mennige focus ring", () => {
    expect(css).not.toMatch(/border-radius:\s*[1-9]/);
    expect(css).not.toMatch(/gradient\(|box-shadow|text-shadow/);
    expect(css).not.toMatch(/font-family:\s*[^;]*mono/i);
    expect(css).not.toMatch(/100vh/);
    for (const block of css.match(/:hover[^{]*\{/g) ?? []) expect(block).toBeTruthy();
    const hoverRules = css.split("@media (hover: hover) and (pointer: fine)").slice(1);
    expect(hoverRules.length).toBeGreaterThanOrEqual(2);
    expect(css).toMatch(/\.cs-btn:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--cs-accent\)/);
    expect(css).toMatch(/\.cs-pause:has\(\.cs-pause-input:focus-visible\)\s*\{[^}]*outline:\s*3px solid/);
    // Every :hover sits inside a hover-capable media block.
    const outsideHover = css.replace(/@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\n\}\n/g, "");
    expect(outsideHover).not.toMatch(/:hover/);
  });

  it("keeps targets at 44px or more and text at 13px or more", () => {
    expect(css).toMatch(/\.cs-btn\s*\{[^}]*min-height:\s*3rem/);
    expect(css).toMatch(/\.cs-pause\s*\{[^}]*min-height:\s*3rem/);
    for (const [, rem] of css.matchAll(/font-size:\s*([\d.]+)rem/g)) expect(Number(rem)).toBeGreaterThanOrEqual(0.8125);
  });

  it("animates nothing itself: the figure inside moves, the shell does not", () => {
    expect(css).not.toMatch(/animation|@keyframes|transition/);
  });
});

describe("the stage numeral keeps its whole string inside its box (the clipped \"46 %\")", () => {
  const css = readFileSync(join(__dirname, "chapter-stage.css"), "utf8");

  it("counts the unit sign: \"46 %\" is wider than \"46\" and a long numeral is wider still", () => {
    expect(numeralEm("46 %")).toBeGreaterThan(numeralEm("46") + 0.7);
    expect(numeralEm("35 bis 49")).toBeGreaterThan(numeralEm("46 %"));
    // Roughly what Figtree 700 sets: two digits and a percent sign take about 2,1 em at its tracking.
    expect(numeralEm("46 %")).toBeGreaterThan(1.9);
    expect(numeralEm("46 %")).toBeLessThan(2.8);
  });

  it("hands every step's numeral width to the stylesheet as --cs-em on its head and on its static card numeral", () => {
    const { container } = stage();
    const head = container.querySelector<HTMLElement>(".cs-head[data-for='0']")!;
    expect(head.style.getPropertyValue("--cs-em")).toBe(String(numeralEm("62x")));
    const card = container.querySelector<HTMLElement>(".cs-step-numeral")!;
    expect(card.style.getPropertyValue("--cs-em")).toBe(String(numeralEm("62x")));
  });

  it("sizes the pinned numeral by the width of its own box (cqw / em) and by the window height", () => {
    expect(css).toMatch(/\.cs-heads\s*\{[^}]*container-type:\s*inline-size/);
    expect(css).toMatch(/--n:\s*min\(clamp\(88px, 9vw, 160px\), 12svh, calc\(100cqw \/ var\(--cs-em, 3\)\)\)/);
    expect(css).toMatch(/\.cs-numeral\s*\{\s*font-size:\s*var\(--n\)/);
  });

  it("fits the card numeral to its card: 56px in the phone card, 64px in the static layout", () => {
    expect(css).toMatch(/\.cs-step-numeral\s*\{[^}]*font-size:\s*min\(3\.5rem, calc\(100cqw \/ var\(--cs-em, 3\)\)\)/);
    expect(css).toMatch(/\.cs-card\s*\{[^}]*container-type:\s*inline-size/);
    expect(css.match(/\.cs-step-numeral\s*\{\s*font-size:\s*min\(4rem, calc\(100cqw \/ var\(--cs-em, 3\)\)\)/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
});

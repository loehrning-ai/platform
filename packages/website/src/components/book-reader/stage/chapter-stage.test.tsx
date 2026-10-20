import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./stage-enhancer", () => ({
  StageEnhancer: ({ stageId }: { stageId: string }) => <span data-testid="enhancer" data-stage-runtime={stageId} />,
}));

import { ChapterStage, stepAnchor } from "./chapter-stage";
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

  it("prints one head per step with its numeral and claim, shown by data-step in CSS", () => {
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

  it("pins a 58svh stage on a phone (one variable shared with the step blocks) and 60svh on wide screens, with step blocks that fill the gap above the reader bar on a phone and 70svh wide", () => {
    expect(css).toMatch(/--cs-pin-h:\s*58svh/);
    expect(css).toMatch(/\.cs-pin\s*\{[^}]*height:\s*var\(--cs-pin-h\)/);
    expect(css).toMatch(/\.cs-pin\s*\{[^}]*height:\s*60svh/);
    expect(css).toMatch(/\.cs-step\s*\{[^}]*min-height:\s*max\(10rem, calc\(100svh/);
    expect(css).toMatch(/\.cs-step\s*\{[^}]*min-height:\s*70svh/);
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

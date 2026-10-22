import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import NumberThatHoldsDemo from "./index";

function setReducedMotion(reduce: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: reduce && query.includes("reduce"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

const de = COPY.de;
const en = COPY.en;

describe("Die Zahl, die trägt: server render", () => {
  it("renders every station, every option, the workshop answer and the take-aways before any interaction", () => {
    const html = renderToString(<NumberThatHoldsDemo locale="de" />);
    for (const id of ["bericht", "vergleichen", "maengel", "pruefen", "entscheiden", "mitnehmen"]) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(html.match(/type="radio"/g)).toHaveLength(42);
    for (const option of Object.values(de.compare.options)) expect(html).toContain(option.label);
    for (const field of Object.values(de.decide.options)) {
      for (const option of Object.values(field)) expect(html).toContain(option.label.replace(/&/g, "&amp;"));
    }
    expect(html).toContain(de.decide.workshopHeading);
    expect(html).toContain("Erst nacharbeiten. Das zusätzliche Q3-Marketing einen Monat halten.");
    expect(html).toContain("Lies zuerst, was der Bericht nicht sagen kann");
    expect(html).toContain(de.takeaways.check.text);
    expect(html).toContain("Gegenargument: … (das stärkste, aus den Daten)");
    // The report's state of the strip: monthly stacks.
    expect(html).toContain('data-strip-p="0.00"');
    expect(html).toContain('data-scale="count"');
  });

  it("keeps a choice made before hydration: the result appears once the page hydrates", async () => {
    setReducedMotion(true);
    const { hydrateRoot } = await import("react-dom/client");
    const container = document.createElement("div");
    container.innerHTML = renderToString(<NumberThatHoldsDemo locale="de" />);
    document.body.appendChild(container);
    // A tap on the server HTML checks the radio natively, with no React yet.
    const early = container.querySelector<HTMLInputElement>(
      '[data-testid="compare-choices"] input[value="line-week"]',
    )!;
    early.click();
    expect(early.checked).toBe(true);
    expect(container.querySelector('[data-testid="compare-result"] [data-verdict]')).toBeNull();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(container, <NumberThatHoldsDemo locale="de" />);
    });
    expect(container.querySelector('[data-testid="compare-result"] [data-verdict="holds"]')).not.toBeNull();
    // Every other group stays untouched.
    expect(container.querySelectorAll("input:checked")).toHaveLength(1);
    act(() => root!.unmount());
    container.remove();
  });

  it("has no collapsible UI and no sticky or fixed element", () => {
    const html = renderToString(<NumberThatHoldsDemo locale="de" />);
    expect(html).not.toMatch(/<details|<summary|aria-expanded/);
    expect(html).not.toMatch(/\b(?:sticky|fixed)\b/);
  });

  it("renders the same controls in English", () => {
    const deHtml = renderToString(<NumberThatHoldsDemo locale="de" />);
    const enHtml = renderToString(<NumberThatHoldsDemo locale="en" />);
    const count = (html: string, pattern: RegExp) => html.match(pattern)?.length ?? 0;
    expect(count(enHtml, /type="radio"/g)).toBe(count(deHtml, /type="radio"/g));
    expect(count(enHtml, /<button/g)).toBe(count(deHtml, /<button/g));
    expect(enHtml).toContain("How the workshop decides");
  });
});

describe("Die Zahl, die trägt: interaction", () => {
  it("gives every control an accessible name", () => {
    setReducedMotion(true);
    render(<NumberThatHoldsDemo locale="de" />);
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveAccessibleName();
    }
    for (const button of screen.getAllByRole("button")) expect(button).toHaveAccessibleName();
  });

  it("announces the verdict of a comparison and moves the strip to its end state under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<NumberThatHoldsDemo locale="de" />);
    fireEvent.click(screen.getByRole("radio", { name: de.compare.options["line-week"].label }));
    const result = screen.getByTestId("compare-result");
    expect(within(result).getByText(/^trägt\./, { selector: "[aria-live]" })).toBeInTheDocument();
    expect(result).toHaveTextContent("−2,1");
    expect(container.querySelector("[data-strip-p]")).toHaveAttribute("data-strip-p", "1.00");
  });

  it("shows the cross-row rule when the number argues for the other decision", () => {
    setReducedMotion(true);
    render(<NumberThatHoldsDemo locale="de" />);
    const decision = screen.getByRole("group", { name: /Entscheidung/ });
    fireEvent.click(within(decision).getByRole("radio", { name: de.decide.options.decision.marketing.label }));
    const number = screen.getByRole("group", { name: /Die Zahl, die trägt/ });
    fireEvent.click(within(number).getByRole("radio", { name: de.decide.options.number["rate-251"].label }));
    expect(screen.getAllByText(de.decide.against.marketing).length).toBeGreaterThan(0);
    expect(screen.getByTestId("sheet-summary")).toHaveTextContent("0 von 6 Zeilen tragen. 4 Zeilen offen.");
  });

  const AGAINST_DE_MARKETING =
    "Deine Zahl spricht gegen deine Entscheidung: sie spricht fürs Nacharbeiten, denn sie zeigt, was das Zusatzbudget an Mängeln mitkaufen würde.";
  const AGAINST_DE_REWORK =
    "Deine Zahl spricht gegen deine Entscheidung: sie ist ein Argument für mehr Budget, nicht fürs Nacharbeiten, und selbst dafür trägt sie nicht.";
  const AGAINST_EN_MARKETING =
    "Your number argues against your decision: it argues for rework first, because it shows the defects the extra budget would pay for too.";
  const AGAINST_EN_REWORK =
    "Your number argues against your decision: it is an argument for more budget, not for rework first, and it does not even hold for that.";

  it.each([
    ["de", "marketing", "rate-251", AGAINST_DE_MARKETING, "Gilt, egal wie viele Wochen der Monat hat (Bericht, Abschnitt 7)."],
    ["de", "marketing", "scrap-691", AGAINST_DE_MARKETING, "Die Grenze steht im selben Satz: bewertet zum Listenpreis."],
    ["de", "rework", "craft-mom", AGAINST_DE_REWORK, "Eine Woche mehr allein macht +25\u00a0%. Je Lieferwoche gerechnet: CRAFT\u00a0−2,1\u00a0%."],
    ["de", "rework", "rev-412", AGAINST_DE_REWORK, "Umsatz ist hier Menge × Listenpreis, keine Marge: Stückkosten stehen in keiner Datei."],
    ["en", "marketing", "rate-251", AGAINST_EN_MARKETING, "True however many weeks the month has (report, section 7)."],
    ["en", "marketing", "scrap-691", AGAINST_EN_MARKETING, "The limit sits in the same sentence: valued at list price."],
    ["en", "rework", "craft-mom", AGAINST_EN_REWORK, "One extra week alone makes +25%. Per shipping week: CRAFT\u00a0−2.1%."],
    ["en", "rework", "rev-412", AGAINST_EN_REWORK, "Revenue here is quantity × list price, not margin: unit costs are in no file."],
  ] as const)(
    "%s: decision %s with number %s shows the against text for that direction above the option's own fact",
    (locale, decision, number, text, factStart) => {
      setReducedMotion(true);
      render(<NumberThatHoldsDemo locale={locale} />);
      const c = locale === "de" ? de : en;
      const decisionGroup = screen.getByRole("group", { name: new RegExp(c.decide.rows.decision) });
      fireEvent.click(within(decisionGroup).getByRole("radio", { name: c.decide.options.decision[decision].label }));
      const numberGroup = screen.getByRole("group", { name: new RegExp(c.decide.rows.number) });
      fireEvent.click(within(numberGroup).getByRole("radio", { name: c.decide.options.number[number].label }));
      const row = document.querySelector('[data-sheet-row="number"]') as HTMLElement;
      expect(row).toHaveAttribute("data-verdict", "misleads");
      // Exact text, non-breaking spaces included, and only this direction's text.
      expect(c.decide.against[decision]).toBe(text);
      const against = row.querySelector("[data-against]") as HTMLElement;
      expect(against).toHaveAttribute("data-against", decision);
      expect(against.textContent).toBe(text);
      const other = decision === "marketing" ? "rework" : "marketing";
      expect(row.textContent).not.toContain(c.decide.against[other]);
      // The option's own fact stays visible, labelled as what the data says.
      const fact = row.querySelector("[data-row-fact]") as HTMLElement;
      expect(fact.textContent).toBe(`${c.decide.dataLabel}: ${c.decide.options.number[number].fact}`);
      expect(c.decide.options.number[number].fact.startsWith(factStart)).toBe(true);
      // The rework text never says a demand or revenue number measures defects.
      if (decision === "rework") expect(text).not.toMatch(/Mängel|defect|misst|measures/i);
      // The live region announces the verdict, the against text and the fact's first sentence.
      const live = Array.from(document.querySelectorAll("[aria-live]")).map((node) => node.textContent ?? "");
      const expected = `${c.decide.rows.number}: ${c.verdict.misleads}. ${text} ${factStart.split(/(?<=[.!?])\s+/)[0]}`;
      expect(live).toContain(expected);
    },
  );

  it("checks a claim: rows appear after the prediction, the echo repeats it, the counter counts", () => {
    setReducedMotion(true);
    const { container } = render(<NumberThatHoldsDemo locale="de" />);
    const card = container.querySelector('[data-claim="nest-ncr"]') as HTMLElement;
    expect(card.querySelector("[data-claim-rows]")).toBeNull();
    fireEvent.click(within(card).getByRole("radio", { name: "stimmt" }));
    expect(card.querySelector("[data-claim-rows]")).not.toBeNull();
    expect(card).toHaveTextContent("Quelle zeigt 19");
    expect(card).toHaveTextContent("Du hast gesagt: stimmt. Die Quelle zeigt: weicht ab.");
    // A wrong prediction gets the mark and ink weight; a right one stays quiet.
    expect(card.querySelector("[data-echo]")).toHaveAttribute("data-echo-mismatch", "true");
    fireEvent.click(within(card).getByRole("radio", { name: "weicht ab" }));
    expect(card).toHaveTextContent("Du hast gesagt: weicht ab. Die Quelle bestätigt das.");
    expect(card.querySelector("[data-echo]")).not.toHaveAttribute("data-echo-mismatch");
    expect(screen.getByTestId("check-counter")).toHaveTextContent("Geprüft: 1 von 4");
  });

  it("copies exactly the visible text", async () => {
    setReducedMotion(true);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<NumberThatHoldsDemo locale="de" />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-check"));
    });
    expect(writeText).toHaveBeenCalledWith(screen.getByTestId("text-check").textContent);
    expect(screen.getByTestId("copy-check").parentElement).toHaveTextContent("Kopiert");
    // While it shows "Kopiert", the button keeps its name.
    expect(screen.getByTestId("copy-check")).toHaveAccessibleName(de.ui.copy);

    // The bridge is disabled until station 1 or 2 is answered.
    expect(screen.getByTestId("copy-bridge")).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: de.compare.options["line-week"].label }));
    expect(screen.getByTestId("copy-bridge")).toBeEnabled();
    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-bridge"));
    });
    expect(writeText).toHaveBeenLastCalledWith(screen.getByTestId("bridge-text").textContent);
    expect(screen.getByTestId("bridge-text").textContent).toMatch(/^Das sind meine eigenen Antworten auf Blank 4\./);
    // The bridge swaps its label inside the button, like every take-away.
    const bridge = screen.getByTestId("copy-bridge");
    const [idle, copied] = Array.from(bridge.querySelectorAll('span[aria-hidden="true"]'));
    expect(idle).toHaveClass("invisible");
    expect(copied).toHaveTextContent("Kopiert");
    expect(copied).not.toHaveClass("invisible");
    expect(bridge).toHaveAccessibleName(de.ui.copy);
    expect(bridge.nextElementSibling).toHaveClass("sr-only");
  });

  it("repeats the ladder's flag marks under the 2b result", () => {
    setReducedMotion(true);
    render(<NumberThatHoldsDemo locale="de" />);
    expect(screen.queryByTestId("flag-marks")).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: de.flag.options.chronic.label }));
    const marks = screen.getByTestId("flag-marks");
    // Spaces between the chips keep the sentence readable for screen readers.
    expect(marks.textContent).toBe(`${de.flag.markedAbove} CRAFT\u00a0${de.defects.flagged}`);
  });

  it("labels the week strip in HTML, not in the scaled SVG", () => {
    const html = renderToString(<NumberThatHoldsDemo locale="de" />);
    const strip = html.slice(html.indexOf("data-strip-p"), html.indexOf("data-strip-p") + 6000);
    expect(strip).not.toContain("<text");
    expect(strip).toContain("data-strip-labels");
    expect(strip).toContain(de.compare.figurePerWeek);
  });

  it("shows a visible failure when copying is impossible", async () => {
    setReducedMotion(true);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    render(<NumberThatHoldsDemo locale="de" />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-traps"));
    });
    expect(screen.getByTestId("copy-traps").parentElement).toHaveTextContent(de.ui.copyFailed);
  });

  it("plays the whole sheet to 6 of 6, turns the gut call, writes the example and resets", () => {
    setReducedMotion(true);
    const { container } = render(<NumberThatHoldsDemo locale="de" />);
    fireEvent.click(within(screen.getByTestId("gut-vote")).getByRole("radio", { name: de.decisionLabel.marketing }));
    const picks: [string, string][] = [
      ["decision", "rework"],
      ["number", "rate-251"],
      ["cost", "both-ways"],
      ["open", "marketing"],
      ["counter", "rate-fell"],
      ["trigger", "rate-and-scrap"],
    ];
    for (const [field, option] of picks) {
      const row = container.querySelector(`[data-sheet-row="${field}"]`) as HTMLElement;
      fireEvent.click(row.querySelector(`input[value="${option}"]`)!);
    }
    expect(screen.getByTestId("sheet-summary")).toHaveTextContent(de.decide.sheetHolds);
    expect(screen.getByTestId("gut-line")).toHaveTextContent("Deine Regeln haben die Entscheidung gedreht.");
    expect(screen.getByTestId("text-sheet-example").textContent?.split("\n")).toHaveLength(6);
    fireEvent.click(screen.getByTestId("reset"));
    expect(screen.queryByTestId("sheet-example")).toBeNull();
    expect(screen.getAllByRole("radio").filter((radio) => (radio as HTMLInputElement).checked)).toHaveLength(0);
    expect(screen.getByTestId("reset")).toBeDisabled();
  });
});

describe("design contract for this folder", () => {
  const dir = __dirname;
  const sources = readdirSync(dir)
    .filter((name) => /\.(?:tsx?|css)$/.test(name) && !/\.test\./.test(name))
    .map((name) => ({ name, text: readFileSync(join(dir, name), "utf8") }));

  it("uses no pills, no transition-all, no timers that loop, no gradient outside the hatch", () => {
    for (const { name, text } of sources) {
      expect(text, name).not.toMatch(/rounded-(?:full|lg|xl|md)\b/);
      expect(text, name).not.toMatch(/transition-all|transition:\s*all/);
      expect(text, name).not.toContain("setInterval(");
      expect(text, name).not.toContain("next/dynamic");
      expect(text, name).not.toMatch(/<details|aria-expanded|position:\s*(?:sticky|fixed)|\b(?:sticky|fixed) /);
      const gradients = text.match(/linear-gradient/g)?.length ?? 0;
      expect(gradients, name).toBe(name === "northwind.module.css" ? 1 : 0);
    }
  });
});

describe("bundle hygiene: the browser loads one locale's copy", () => {
  const lib = join(__dirname, "../../../lib/demo-cases/geschaeftsberichte-mit-ki-lesen");
  const read = (dir: string) =>
    readdirSync(dir)
      .filter((name) => /\.tsx?$/.test(name) && !/\.test\./.test(name))
      .map((name) => ({ name, text: readFileSync(join(dir, name), "utf8") }));
  // A value import of copy.ts, copy-de.ts or copy-en.ts; `import type` is erased.
  const valueImport = /^import\s+(?!type\s)[^;]*?from\s+"[^"]*\/copy(?:-de|-en)?";/m;

  it("only the server entry index.tsx imports copy values; it has no use client", () => {
    for (const { name, text } of read(__dirname)) {
      if (name === "index.tsx") {
        expect(text).not.toMatch(/^"use client"/m);
        expect(text).toMatch(valueImport);
      } else {
        expect(text, name).not.toMatch(valueImport);
      }
    }
  });

  it("no module the client tree imports pulls both locales in", () => {
    for (const { name, text } of read(lib)) {
      if (name === "copy.ts") continue;
      expect(text, name).not.toMatch(valueImport);
    }
  });

  it("the copy is plain data, so the server can pass it as a prop", () => {
    for (const locale of ["de", "en"] as const) {
      const copy = COPY[locale];
      expect(JSON.parse(JSON.stringify(copy))).toEqual(copy);
    }
  });
});

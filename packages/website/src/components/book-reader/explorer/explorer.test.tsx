import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localizeModel, numeralPerHundred, predict, readoutSentence, type ExplorerModel } from "@/lib/explorer/model";
import { syntheticModel } from "@/lib/explorer/synthetic-model";
import { Explorer } from "./explorer";

const MODEL: ExplorerModel = syntheticModel();

beforeEach(() => {
  // Reduced motion: the field jumps, so the assertions need no timers.
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const live = () => document.querySelector<HTMLElement>("[data-explorer-readout]")!;

describe("Explorer, server markup and first render", () => {
  it("shows the worked example of the model's default as one sentence in a polite live region", () => {
    render(<Explorer model={MODEL} />);
    const expected = readoutSentence(predict(MODEL, MODEL.default));
    expect(live()).toHaveTextContent(expected);
    expect(live()).toHaveAttribute("aria-live", "polite");
    expect(live()).toHaveAttribute("role", "status");
    expect(screen.getByText("Das sagt etwas über Sichtbarkeit, nicht über deinen Einsatz.")).toBeVisible();
  });

  it("draws 1.000 squares: filled for the estimate, outlined for the 95 % band, Leinen for the rest", () => {
    const { container } = render(<Explorer model={MODEL} />);
    const svg = container.querySelector("svg.ex-field")!;
    expect(svg).toHaveAttribute("role", "img");
    expect(svg.getAttribute("aria-label")).toMatch(/Feld aus 1\.000 Quadraten/);
    const paths = [...svg.querySelectorAll("path")];
    expect(paths).toHaveLength(4);
    const squares = (cls: string) => ((svg.querySelector(`.${cls}`)?.getAttribute("d") ?? "").match(/M/g) ?? []).length;
    const solid = squares("ex-sq--solid");
    const band = squares("ex-sq--band");
    const rest = squares("ex-sq--rest");
    expect(solid).toBeGreaterThan(0);
    expect(band).toBeGreaterThan(0);
    // Filled whole squares + the partial one + the rest = every square.
    const p = predict(MODEL, MODEL.default).p * 1000;
    expect(Math.floor(p)).toBe(solid);
    expect(rest).toBe(1000 - Math.floor(p) - (p % 1 > 0 ? 1 : 0));
  });

  it("states the unit and that this is a model estimate, never an observed count", () => {
    render(<Explorer model={MODEL} />);
    expect(screen.getByText(/1 Quadrat = 0,1 %, Modellschätzung/)).toBeVisible();
    expect(screen.getByText(/Modellschätzung/)).toBeVisible();
    expect(screen.getByText(/Dein Browser rechnet das allein/)).toBeVisible();
  });

  it("renders the static table of every Branche by every fifth, with the intervals, for no script and print", () => {
    render(<Explorer model={MODEL} />);
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(1 + 8);
    expect(within(table).getAllByRole("columnheader")).toHaveLength(1 + 5);
    expect(table.textContent).toMatch(/[\d,]+ \([\d,]+ bis [\d,]+\)|unter 0,1/);
    expect(screen.getByRole("region", { name: "Tabelle: Branche mal Textmenge" })).toHaveAttribute("tabindex", "0");
  });

  it("prints the source line, and the rescan sentence right under the number it qualifies", () => {
    const { container } = render(<Explorer model={MODEL} />);
    expect(container.querySelector("[data-source-line='explorer']")).toHaveTextContent(MODEL.sourceLine);
    const caveat = container.querySelector("[data-explorer-caveat]")!;
    expect(caveat).toHaveTextContent("Wird mit geprüften Websites neu gerechnet.");
    expect(caveat).toHaveTextContent(/^Grundlage: [\d.]+ Firmen\. Wird mit geprüften Websites neu gerechnet\.$/);
    // The caveat follows the numeral directly, before the field.
    const numeral = container.querySelector(".ex-numeral")!;
    expect(numeral.nextElementSibling).toBe(caveat);
    expect(container.querySelector("#wo-stehe-ich")).not.toBeNull();
  });

  it("never collapses and loads nothing: no disclosure widget, no network call", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { container } = render(<Explorer model={MODEL} />);
    fireEvent.change(screen.getByLabelText("Branche"), { target: { value: "bau" } });
    expect(container.querySelector("details, summary, [aria-expanded]")).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(container.querySelector("form")).toHaveAttribute("aria-label", "Deine Angaben");
  });
});

describe("Explorer, controls", () => {
  it("offers the selects and the five text-volume chips as native elements with every level", () => {
    render(<Explorer model={MODEL} />);
    for (const label of ["Branche", "Bundesland", "Größe"]) {
      const select = screen.getByLabelText(label);
      expect(select.tagName).toBe("SELECT");
    }
    expect(screen.getByLabelText("Branche")).toHaveProperty("length", 8);
    const chips = screen.getAllByRole("radio");
    expect(chips).toHaveLength(5);
    expect(screen.getByRole("group", { name: "Textmenge deiner Startseite" })).toBeInTheDocument();
    // Every stop is labelled in words that are visible, not only a handle on a slider.
    for (const label of ["kurz", "knapp", "mittel", "lang", "sehr lang"]) {
      expect(screen.getByText(label, { selector: ".ex-chip-face" })).toBeVisible();
    }
    expect(screen.getByLabelText("mittel")).toBeChecked();
    expect(document.querySelector("input[type='range']")).toBeNull();
  });

  it("recomputes the sentence from the model when a select changes", () => {
    render(<Explorer model={MODEL} />);
    fireEvent.change(screen.getByLabelText("Branche"), { target: { value: "it" } });
    const expected = readoutSentence(predict(MODEL, { ...MODEL.default, branche: "it" }));
    expect(live()).toHaveTextContent(expected);
    fireEvent.change(screen.getByLabelText("Branche"), { target: { value: "bau" } });
    expect(live()).toHaveTextContent(readoutSentence(predict(MODEL, { ...MODEL.default, branche: "bau" })));
  });

  it("moves the estimate with the five chips of the text volume and names each in plain words", () => {
    render(<Explorer model={MODEL} />);
    const shares: number[] = [];
    [
      ["kurz", "kurz wie eine Visitenkarte"],
      ["knapp", "ein kurzer Absatz"],
      ["mittel", "ein Bildschirm"],
      ["lang", "zwei Bildschirme"],
      ["sehr lang", "mehrere Bildschirme"],
    ].forEach(([chip, example]) => {
      fireEvent.click(screen.getByLabelText(chip as string));
      expect(screen.getByLabelText(chip as string)).toBeChecked();
      expect(screen.getByText(example as string, { selector: "p" })).toBeVisible();
      const text = document.querySelector(".ex-numeral-n")!.textContent ?? "";
      shares.push(Number(text.replaceAll("<", "").replaceAll(",", ".")));
    });
    expect(shares[4]!).toBeGreaterThan(shares[0]!);
    expect(screen.getByText("von 100")).toBeInTheDocument();
  });

  it("says so when the group is pooled and when few firms stand behind a level", () => {
    const thin: ExplorerModel = {
      ...MODEL,
      factors: MODEL.factors.map((f) => (f.id === "size" ? { ...f, levels: f.levels.map((l) => (l.id === "10+" ? { ...l, n: 12 } : l)) } : f)),
    };
    render(<Explorer model={thin} />);
    fireEvent.change(screen.getByLabelText("Bundesland"), { target: { value: "pool" } });
    expect(screen.getByText(/zu wenige Daten für ein eigenes Land/)).toBeVisible();
    fireEvent.change(screen.getByLabelText("Größe"), { target: { value: "10+" } });
    expect(live()).toHaveTextContent("Es gibt nur wenige Startseiten wie deine");
    expect(document.querySelector("[data-explorer-caveat]")).toHaveTextContent("Grundlage: 12 Firmen.");
  });

  it("does not repeat the group size under the select, the caveat under the number carries it once", () => {
    const small: ExplorerModel = {
      ...MODEL,
      factors: MODEL.factors.map((f) => (f.id === "branche" ? { ...f, levels: f.levels.map((l) => (l.id === "bau" ? { ...l, n: 40 } : l)) } : f)),
    };
    render(<Explorer model={small} />);
    fireEvent.change(screen.getByLabelText("Branche"), { target: { value: "bau" } });
    expect(screen.queryByText(/in dieser Gruppe/)).toBeNull();
    fireEvent.change(screen.getByLabelText("Branche"), { target: { value: "it" } });
    expect(screen.queryByText(/in dieser Gruppe/)).toBeNull();
  });

  it("shows the estimate with one decimal in the numeral, the sentence and the interval", () => {
    render(<Explorer model={MODEL} />);
    const numeral = document.querySelector(".ex-numeral-n")!;
    expect(numeral.textContent).toBe(numeralPerHundred(predict(MODEL, MODEL.default).p));
    expect(numeral.textContent).toMatch(/^(<0,1|\d+,\d)$/);
    expect(live().textContent).toMatch(/[\d,]+ bis [\d,]+/);
  });

  it("shows no value when fewer than five firms stand behind the combination (k = 5)", () => {
    const k: ExplorerModel = {
      ...MODEL,
      factors: MODEL.factors.map((f) => (f.id === "size" ? { ...f, levels: f.levels.map((l) => (l.id === "10+" ? { ...l, n: 4 } : l)) } : f)),
    };
    render(<Explorer model={k} />);
    fireEvent.change(screen.getByLabelText("Größe"), { target: { value: "10+" } });
    expect(document.querySelector("[data-explorer-caveat]")).toHaveTextContent("zu wenige Firmen, kein Wert");
    expect(live()).toHaveTextContent("keinen Wert");
  });
});

describe("explorer.css contract", () => {
  const css = readFileSync(join(__dirname, "explorer.css"), "utf8");

  it("has no radius, gradient or shadow, and hover only on fine pointers", () => {
    expect(css).not.toMatch(/border-radius:\s*[1-9]|gradient\(|box-shadow|text-shadow/);
    const outside = css.replace(/@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\n\}\n/g, "");
    expect(outside).not.toMatch(/:hover/);
    expect(css).toMatch(/\.ex-select:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--ex-accent\)/);
    expect(css).toMatch(/\.ex-chip-input:focus-visible \+ \.ex-chip-face\s*\{[^}]*outline:\s*3px solid var\(--ex-accent\)/);
  });

  it("keeps the controls at 44px or more", () => {
    expect(css).toMatch(/\.ex-select\s*\{[^}]*min-height:\s*2\.75rem/);
    expect(css).toMatch(/\.ex-chip-face\s*\{[^}]*min-height:\s*3rem/);
  });
});


describe("Explorer, English", () => {
  const overlay = JSON.parse(readFileSync(join(process.cwd(), "content/books/ki-landschaft/explorer.en.json"), "utf8")) as unknown;
  const real = JSON.parse(readFileSync(join(process.cwd(), "content/books/ki-landschaft/explorer.json"), "utf8")) as unknown;
  const STOP = /\b(von|Firmen|Gruppe|Branche|Bundesland|Größe|wie deiner|deine|Startseite|Quadrat|Wo stehe|Textmenge|Sichtbarkeit|Zählung|geprüften|neu gerechnet|Dein Browser|Auf einen Blick)\b/;

  it("localizeModel names every factor and level of the frozen model in English (a missing key fails)", async () => {
    const { parseExplorerModel } = await import("@/lib/explorer/model");
    const model = parseExplorerModel(real);
    const en = localizeModel(model, overlay, "en");
    for (const factor of en.factors) {
      expect(factor.label).not.toMatch(STOP);
      for (const level of factor.levels) expect(`${level.label} ${level.example ?? ""} ${level.pooledNote ?? ""}`).not.toMatch(STOP);
    }
    expect(en.sourceLine).not.toMatch(/\{n\}|\{draws\}/);
    expect(en.sourceLine).toContain("12,468");
    expect(() => localizeModel(model, { ...(overlay as object), factors: {} }, "en")).toThrow(/missing/);
  });

  it("renders the whole instrument without a German word and with English number marks", async () => {
    const { parseExplorerModel } = await import("@/lib/explorer/model");
    const en = localizeModel(parseExplorerModel(real), overlay, "en");
    const { container } = render(<Explorer model={en} locale="en" />);
    const visible = container.textContent ?? "";
    expect(visible).not.toMatch(STOP);
    expect(screen.getByRole("heading", { name: "Where do I stand?" })).toBeInTheDocument();
    expect(container.querySelector(".ex-numeral-of")).toHaveTextContent("of 100");
    expect(live()).toHaveTextContent(/^About \d+\.\d of 100 GmbH homepages like yours mention AI, probably /);
    expect(container.querySelector("[data-explorer-caveat]")).toHaveTextContent(/^Basis: [\d,]+ firms\. Being recalculated with checked websites\.$/);
    expect(container.querySelector("form")).toHaveAttribute("aria-label", "Your details");
    expect(container.querySelector(".ex-unit")).toHaveTextContent("1 square = 0.1 %, model estimate");
    expect(container.querySelector("svg.ex-field")?.getAttribute("aria-label")).toMatch(/^Field of 1,000 squares/);
  });
});

describe("Explorer, caveat", () => {
  it("shows the rescan caveat for every selection, right above the readout, never only under a choice", () => {
    const { container } = render(<Explorer model={MODEL} />);
    const caveat = () => container.querySelector("[data-explorer-caveat]")!;
    const check = () => {
      expect(caveat().querySelector("[data-rescan-note]")).toHaveTextContent(/neu gerechnet/);
      expect(caveat().compareDocumentPosition(live()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    };
    check();
    for (const value of ["it", "bau", "handel"]) {
      fireEvent.change(screen.getByLabelText("Branche"), { target: { value } });
      check();
    }
    fireEvent.click(screen.getByLabelText("lang"));
    check();
  });
});

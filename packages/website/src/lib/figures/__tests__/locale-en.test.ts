import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderFigureMarkup } from "../export.ts";
import { controlLabelOf, readoutOf, detentsOf } from "../readout.ts";
import { formatDecimal, formatInterval } from "../format.ts";
import type { FigureSpec } from "../types.ts";

const load = (id: string): FigureSpec => JSON.parse(readFileSync(`content/books/ki-landschaft/figures/${id}.json`, "utf8")) as FigureSpec;
const GERMAN = ["Hälfte", "Zufall", "Firmen", "Quadrat", "Teilung", "Beispiel", "Neue Zufallsteilung", "bis ", "Stufen"];

describe("English figures carry no German built-in strings", () => {
  it.each([
    ["h06-slope", "s3"],
    ["h12-null", "n100"],
    ["h02-blocks", undefined],
    ["h01-net", undefined],
  ])("%s", (id, variant) => {
    const spec = { ...load(id), lang: "en" as const };
    const svg = renderFigureMarkup(spec, 1, { width: 340, theme: "web", variant, bare: true });
    // Only drawn text: title and desc come from the spec copy, the stage prints claim and numeral in the page.
    const text = [...svg.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map((m) => m[1]).join(" | ");
    for (const word of GERMAN) expect(text, `${id} ${word}`).not.toContain(word);
    const extra = [controlLabelOf(spec), readoutOf(spec, variant), ...detentsOf(spec).map((d) => d.label)].join(" | ");
    for (const word of GERMAN) expect(extra, `${id} readout ${word}`).not.toContain(word);
  });

  it("uses the English number format", () => {
    expect(formatDecimal(12345.6, 1, false, "en")).toBe("12,345.6");
    expect(formatDecimal(12345.6, 1)).toBe("12.345,6");
    expect(formatInterval({ style: "percent", digits: 1 }, 3.7, 4.2, "en")).toContain("3.7 to 4.2");
  });
});

describe("German figures stay German", () => {
  it("chance label and chips", () => {
    const svg = renderFigureMarkup(load("h12-null"), 1, { width: 340, theme: "web" });
    expect(svg).toContain("Zufall");
    expect(svg).toContain("0 %");
  });
});

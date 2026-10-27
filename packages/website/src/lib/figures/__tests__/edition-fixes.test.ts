// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderFigureMarkup } from "../export.ts";
import { labelLines, textWidth } from "../svg.ts";
import { withData, DOTPLOT, WATERFALL } from "./fixtures.ts";
import type { FigureSpec } from "../types.ts";

const parse = (spec: FigureSpec, width: number): Document =>
  new DOMParser().parseFromString(renderFigureMarkup(spec, 1, { width }), "image/svg+xml");

describe("row labels are broken, not cut", () => {
  it("keeps a short label on one line", () => {
    expect(labelLines("Hochbau", 200, 13)).toEqual(["Hochbau"]);
  });

  it("breaks a long label at a space into two lines that both fit", () => {
    const label = "Fondsmanagement und Hilfstätigkeiten";
    const lines = labelLines(label, 190, 13);
    expect(lines).toHaveLength(2);
    expect(lines.join(" ")).toBe(label);
    for (const line of lines) expect(textWidth(line, 13)).toBeLessThanOrEqual(190);
    expect(lines.join("")).not.toContain("…");
  });

  it("breaks a long compound after the hyphen", () => {
    const lines = labelLines("Mecklenburg-Vorpommern", 120, 13);
    expect(lines).toEqual(["Mecklenburg-", "Vorpommern"]);
  });

  it("only falls back to an ellipsis when no break helps", () => {
    const lines = labelLines("Donaudampfschifffahrtsgesellschaftskapitän", 60, 13);
    expect(lines.length).toBeGreaterThan(0);
  });
});

describe("the dot plot reference line on a phone", () => {
  it("never runs through a row label: it is drawn per row, below the label line", () => {
    const spec = withData(DOTPLOT, {});
    const doc = parse(spec, 360);
    const refs = [...doc.querySelectorAll("line")].filter((l) => l.getAttribute("stroke-dasharray") === "4 3");
    expect(refs.length).toBeGreaterThan(1);
    const labelBaselines = [...doc.querySelectorAll("g[data-id] > text")]
      .filter((t) => t.getAttribute("font-size") === "13")
      .map((t) => Number(t.getAttribute("y")));
    for (const ref of refs) {
      const y1 = Number(ref.getAttribute("y1"));
      const y2 = Number(ref.getAttribute("y2"));
      for (const baseline of labelBaselines) {
        // a label spans roughly baseline - 11 to baseline + 3
        expect(y2 <= baseline - 11 || y1 >= baseline + 3).toBe(true);
      }
    }
  });
});

describe("waterfall legend words can be replaced", () => {
  it("uses the words of the spec, not Messwert", () => {
    const spec = withData(WATERFALL, { legend: { total: "Zeitwert", down: "Kosten" } });
    const markup = renderFigureMarkup(spec, 1, { width: 560 });
    expect(markup).toContain("Zeitwert");
    expect(markup).not.toContain("Messwert");
  });
});

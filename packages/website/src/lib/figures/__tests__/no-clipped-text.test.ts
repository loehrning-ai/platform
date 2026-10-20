import { describe, expect, it } from "vitest";
import { renderFigureMarkup } from "../export.ts";
import { compileFeld } from "../feld/model.ts";
import { numeralSize } from "../hero.ts";
import { textWidth } from "../svg.ts";
import type { CurveData, FieldData, FigureSpec } from "../types.ts";
import { CURVE, FIELD } from "./fixtures-hero.ts";

/**
 * Regressions of the clipped-text sweep of the data book: nothing a figure writes may be cut ("46 %" losing its
 * "%", "kürzes…", a date axis of 18 labels reduced to "0…"), run off its figure or be printed over its neighbour.
 */

const flat = (s: string): string => s.replace(/ /g, " ");

describe("the figure's own numeral keeps its whole string in the margins", () => {
  // The "46 %" of the cover and of chapter 1: the unit sign is part of the string that has to fit.
  it.each([320, 360, 390, 430, 768])("fits \"46 %%\" with its sign into a %ipx view, whatever its wanted size", (width) => {
    const size = numeralSize(width, "46 %");
    expect(size).toBeGreaterThan(0);
    expect(textWidth("46 %", size, 800)).toBeLessThanOrEqual(width - 2 * 16);
  });

  it("fits a long numeral beside the figure's column (a narrow side by side width)", () => {
    // Beside the figure the numeral gets about half of a 1024 window: a 480px column.
    for (const text of ["46 %", "3,8 %", "62x", "35 bis 49", "51.716"]) {
      const size = numeralSize(480, text);
      expect(textWidth(text, size, 800), text).toBeLessThanOrEqual(480);
    }
  });

  it("is smaller for the string with the sign than for the digits alone when the width is the limit", () => {
    expect(numeralSize(200, "46 %")).toBeLessThan(numeralSize(200, "46"));
  });
});

describe("field label type shrinks to the column instead of ending in an ellipsis", () => {
  const long = (FIELD.data as FieldData);
  const withLongLabel: FieldData = {
    ...long,
    scenes: long.scenes.map((scene, i) =>
      i === 0
        ? { ...scene, bins: scene.bins.map((bin, j) => (j === 0 ? { ...bin, label: "kürzestes Fünftel" } : bin)) }
        : scene,
    ),
  };

  it("keeps every word whole at a phone width and sets the label smaller than 13 when a word would not fit", () => {
    const model = compileFeld(withLongLabel, { width: 296, height: 440 });
    const labels = (model.scenes[0]?.labels ?? []).filter((l) => l.role === "label");
    expect(labels.length).toBeGreaterThan(0);
    for (const label of labels) {
      expect(label.text.includes("…")).toBe(false);
      expect(label.text.endsWith("...")).toBe(false);
    }
    const words = labels.map((l) => l.text).join(" ");
    expect(words).toContain("kürzestes");
    expect(Math.min(...labels.map((l) => l.size ?? 13))).toBeLessThan(13);
    // The shrunk word is no wider than its column (a bin of 5 in 296 units).
    const binW = (296 - Math.max(6, 296 * 0.03) * 4) / 5;
    for (const label of labels) expect(textWidth(label.text, label.size ?? 13, 600)).toBeLessThanOrEqual(binW + 0.5);
  });
});

describe("field labels in a box too short for two lines", () => {
  it("still never end in an ellipsis and stay inside their column", () => {
    const tall = FIELD.data as FieldData;
    const data: FieldData = { ...tall, scenes: tall.scenes.map((scene, i) => (i === 0 ? { ...scene, bins: scene.bins.map((bin, j) => (j === 0 ? { ...bin, label: "kürzestes Fünftel" } : bin)) } : scene)) };
    const model = compileFeld(data, { width: 296, height: 300 });
    const binW = (296 - Math.max(6, 296 * 0.03) * 4) / 5;
    for (const label of (model.scenes[0]?.labels ?? []).filter((l) => l.role === "label")) {
      expect(label.text.includes("…")).toBe(false);
      expect(textWidth(label.text, label.size ?? 13, 600)).toBeLessThanOrEqual(binW + 0.5);
    }
  });
});

describe("a date axis wider than its width is thinned, not cut", () => {
  const dates = Array.from({ length: 18 }, (_v, i) => ({
    id: `d${i}`,
    label: `${String(1 + (i % 28)).padStart(2, "0")}.${String(3 + Math.floor(i / 4)).padStart(2, "0")}.`,
    value: 8 + (i % 5),
    lo: 6,
    hi: 14,
    n: 500,
  }));
  const spec = { ...CURVE, id: "t-dates", kind: "curve", data: { ...(CURVE.data as CurveData), points: dates, defaultVariant: "d17", panel: undefined } } as FigureSpec;

  it("writes no ellipsis at 340 and keeps the last date", () => {
    const markup = flat(renderFigureMarkup(spec, 1, { width: 340 }));
    expect(markup).not.toContain("…");
    expect(markup).toContain(dates[17]?.label ?? "never");
  });

  it("writes every date where there is room", () => {
    const markup = flat(renderFigureMarkup(spec, 1, { width: 1100 }));
    for (const d of dates) expect(markup).toContain(d.label);
  });
});

describe("the comparison panel of a curve stays inside the view", () => {
  it("puts bar and value on a second line when the label leaves no room for them", () => {
    const wide = { ...(CURVE.data as CurveData), panel: { title: "zum Vergleich", fmt: { style: "decimal" as const, digits: 1, unit: "%" }, rows: [{ id: "a", label: "Digitalisierung Mittelstand", value: 13.1 }, { id: "b", label: "nachhaltig", value: 2 }] } };
    const markup = renderFigureMarkup({ ...CURVE, id: "t-panel", kind: "curve", data: wide } as FigureSpec, 1, { width: 340 });
    const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
    const box = doc.documentElement.getAttribute("viewBox")?.split(/\s+/).map(Number) ?? [0, 0, 340, 0];
    const rights = Array.from(doc.querySelectorAll("rect[data-id='a'],rect[data-id='b']")).map((r) => Number(r.getAttribute("x")) + Number(r.getAttribute("width")));
    expect(rights.length).toBe(2);
    // The value text starts at the bar end + 6 and is about 40 units wide: it must end inside the view.
    for (const right of rights) expect(right + 6 + textWidth("13,1 %", 14, 700)).toBeLessThanOrEqual((box[2] ?? 340) + 0.5);
  });
});

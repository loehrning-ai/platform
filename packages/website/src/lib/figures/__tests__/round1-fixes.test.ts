// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderFigureMarkup } from "../export.ts";
import { MOTION_VERBS, verbShare } from "../motion.ts";
import { labelLinesFit, textWidth } from "../svg.ts";
import { parseFigureSpec } from "../validate.ts";

const load = (id: string) =>
  parseFigureSpec(JSON.parse(readFileSync(join(process.cwd(), "content/books/ki-landschaft/figures", `${id}.json`), "utf8")));
const parse = (m: string): Document => new DOMParser().parseFromString(m, "image/svg+xml");
const phone = { width: 340, height: 480, bare: true };

describe("H05 waffle: squares that fit and a loss beat", () => {
  const spec = load("h05-dots");
  const at = (p: number, extra = {}) => renderFigureMarkup(spec, p, { ...phone, ...extra });

  it("draws hard-edged squares, no circles", () => {
    const doc = parse(at(1));
    expect(doc.querySelectorAll("circle")).toHaveLength(0);
    expect(doc.querySelectorAll("rect[data-group]")).toHaveLength(89 + 41);
  });

  it("never clips: the last row ends inside the stage height", () => {
    for (const h of [360, 480, 740]) {
      const doc = parse(at(1, { height: h }));
      const vb = (doc.documentElement.getAttribute("viewBox") ?? "").split(" ").map(Number);
      const bottoms = Array.from(doc.querySelectorAll("rect[data-group]")).map((r) => Number(r.getAttribute("y")) + Number(r.getAttribute("height")));
      expect(Math.max(...bottoms)).toBeLessThanOrEqual(h);
      expect(vb[3]).toBeGreaterThan(Math.max(...bottoms));
    }
  });

  it("loses fill one by one: frames at 0, 0.5 and 1 differ and the lost squares end hollow", () => {
    const frames = [0, 0.5, 1].map((p) => at(p));
    expect(new Set(frames).size).toBe(3);
    const mid = parse(at(0.7));
    const end = parse(at(1));
    const hollow = (d: Document) => Array.from(d.querySelectorAll('rect[data-group="lost"][fill="none"]')).filter((r) => r.getAttribute("opacity") === null || Number(r.getAttribute("opacity")) > 0.99).length;
    expect(hollow(end)).toBe(41);
    expect(hollow(mid)).toBeLessThan(41);
  });
});

describe("H02 blocks: labels are whole words", () => {
  it("labelLinesFit never cuts a word and never goes below the 12 px floor", () => {
    const { lines, size } = labelLinesFit("Technische Stellenanzeigen", 100, 13, 600);
    expect(lines.join(" ")).toBe("Technische Stellenanzeigen");
    expect(size).toBeGreaterThanOrEqual(12);
    for (const l of lines) expect(textWidth(l, size, 600)).toBeLessThanOrEqual(100.5);
    expect(labelLinesFit("Stellenanzeigen", 40, 13, 600).size).toBe(12);
  });

  it("no label of the blocks stage carries an ellipsis on a short phone box", () => {
    const spec = load("h02-blocks");
    for (const p of [0.5, 1]) {
      const svg = renderFigureMarkup(spec, p, { width: 340, height: 300, bare: true });
      expect(svg).not.toContain("…");
    }
    const doc = parse(renderFigureMarkup(spec, 1, { width: 340, height: 300, bare: true }));
    const text = Array.from(doc.querySelectorAll("[data-label]")).map((g) => g.textContent ?? "").join(" ");
    expect(text).toContain("Studierende");
    expect(text).toContain("Stellenanzeigen");
  });
});

describe("H12 null: the observed value has an anchor and the axis is not covered", () => {
  const spec = load("h12-null");
  it("draws a leader from the label to the marker", () => {
    const doc = parse(renderFigureMarkup(spec, 1, { width: 340, height: 520, bare: true }));
    expect(doc.querySelector('[data-layer="observed-anchor"]')).not.toBeNull();
    expect(doc.querySelector('[data-layer="observed"] rect[data-id="observed"]')).not.toBeNull();
  });
  it("fits a pinned stage: content ends above the stage height", () => {
    const doc = parse(renderFigureMarkup(spec, 1, { width: 340, height: 520, bare: true }));
    const vb = (doc.documentElement.getAttribute("viewBox") ?? "").split(" ").map(Number);
    expect(vb[3]).toBeLessThanOrEqual(540);
  });
});

describe("motion vocabulary", () => {
  it("has four verbs and a hold with the agreed durations", () => {
    expect(MOTION_VERBS).toEqual({ fill: 700, drain: 500, pour: 900, split: 1200, hold: 600 });
    expect(verbShare("hold", 3000)).toBeCloseTo(0.2, 5);
  });
});

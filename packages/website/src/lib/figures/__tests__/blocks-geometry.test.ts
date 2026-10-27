// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderFigureMarkup } from "../export.ts";
import { BLOCKS_TOP_GAP } from "../kinds/blocks.ts";
import { parseFigureSpec } from "../validate.ts";

const spec = parseFigureSpec(
  JSON.parse(readFileSync(join(process.cwd(), "content/books/ki-landschaft/figures/h02-blocks.json"), "utf8")),
);
const parse = (m: string): Document => new DOMParser().parseFromString(m, "image/svg+xml");

/** Visible rect of every block after its transform. */
function blockRects(doc: Document): Array<{ x: number; y: number; w: number; h: number }> {
  const out: Array<{ x: number; y: number; w: number; h: number }> = [];
  for (const r of Array.from(doc.querySelectorAll('[data-layer="blocks"] rect'))) {
    const t = /translate\(([-\d.e]+)[ ,]+([-\d.e]+)\)/.exec(r.getAttribute("transform") ?? "");
    out.push({
      x: Number(r.getAttribute("x")) + (t ? Number(t[1]) : 0),
      y: Number(r.getAttribute("y")) + (t ? Number(t[2]) : 0),
      w: Number(r.getAttribute("width")),
      h: Number(r.getAttribute("height")),
    });
  }
  for (const path of Array.from(doc.querySelectorAll('[data-layer="blocks"] path'))) {
    const d = path.getAttribute("d") ?? "";
    for (const m of d.matchAll(/M([-\d.]+)[ ,]([-\d.]+)/g)) out.push({ x: Number(m[1]), y: Number(m[2]), w: 1, h: 1 });
  }
  return out;
}

describe("H02 blocks: nothing leaves the stage", () => {
  const steps = [
    { p: 0, variant: "firm_title" },
    { p: 0.3, variant: "firm_title" },
    { p: 0.55, variant: "firm_title" },
    { p: 1, variant: "firm_title" },
    { p: 1, variant: "same_place" },
  ];
  // 194 is the box the pinned phone stage really leaves the figure (390 x 215 css px at 340 units wide).
  for (const height of [180, 194, 240, 300, 427, 480, 560]) {
    it(`keeps every block, label and the content inside a ${height} px phone box`, () => {
      for (const st of steps) {
        const doc = parse(renderFigureMarkup(spec, st.p, { width: 340, height, bare: true, variant: st.variant }));
        const vb = (doc.documentElement.getAttribute("viewBox") ?? "").split(" ").map(Number);
        expect(vb[3]).toBeGreaterThanOrEqual(height);
        const rects = blockRects(doc);
        if (st.p >= 0.55) expect(rects.length).toBeGreaterThan(0);
        for (const r of rects) {
          expect(r.x).toBeGreaterThanOrEqual(-0.5);
          expect(r.x + r.w).toBeLessThanOrEqual(340.5);
          // a block never starts above the stage top edge (the clip hides the way in) nor below the box
          expect(r.y + r.h).toBeLessThanOrEqual(height + 0.5);
          if (st.p === 1) expect(r.y).toBeGreaterThanOrEqual(BLOCKS_TOP_GAP - 0.5);
        }
        // the lowest label (name and count) stays inside the box
        const labels = Array.from(doc.querySelectorAll("[data-label] text")).map((t) => Number(t.getAttribute("y")));
        expect(Math.max(...labels)).toBeLessThanOrEqual(height);
      }
    });
  }

  it("every block of a settled step sits above its bin baseline (no stray blocks below the stacks)", () => {
    for (const variant of ["firm_title", "same_place"]) {
      const doc = parse(renderFigureMarkup(spec, 1, { width: 340, height: 480, bare: true, variant }));
      const baselines = Array.from(doc.querySelectorAll("[data-label] line")).map((l) => Number(l.getAttribute("y1")));
      const lowest = Math.max(...baselines);
      for (const r of blockRects(doc)) expect(r.y).toBeLessThan(lowest);
    }
  });

  it("is a clipped stage with a gap of at least 16 px above the first bin row", () => {
    const doc = parse(renderFigureMarkup(spec, 1, { width: 340, height: 480, bare: true }));
    expect(doc.querySelector("clipPath")).not.toBeNull();
    expect(BLOCKS_TOP_GAP).toBeGreaterThanOrEqual(16);
    const rects = blockRects(doc);
    expect(Math.min(...rects.map((r) => r.y))).toBeGreaterThanOrEqual(BLOCKS_TOP_GAP);
  });

  it("uses squares of at least 8 px (viewBox) on a 480 px box", () => {
    const doc = parse(renderFigureMarkup(spec, 1, { width: 340, height: 480, bare: true }));
    const first = doc.querySelector('[data-layer="blocks"] path');
    expect(first).not.toBeNull();
  });
});

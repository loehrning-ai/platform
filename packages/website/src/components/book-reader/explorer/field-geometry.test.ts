import { describe, expect, it } from "vitest";
import { fieldCounts } from "@/lib/explorer/model";
import { COLS, corner, easeCounts, fieldPaths, ROWS, SQUARES, VIEW_HEIGHT, VIEW_WIDTH } from "./field-geometry";

const count = (d: string): number => (d.match(/M/g) ?? []).length;

describe("field geometry", () => {
  it("is 1.000 squares in 40 columns by 25 rows, filled in reading order from the top left", () => {
    expect(COLS * ROWS).toBe(1000);
    expect(SQUARES).toBe(1000);
    const [x0, y0] = corner(0);
    const [x1, y1] = corner(1);
    const [x2, y2] = corner(COLS);
    expect(y1).toBe(y0);
    expect(x1).toBeGreaterThan(x0);
    expect(x2).toBe(x0);
    expect(y2).toBeGreaterThan(y0);
    expect(corner(SQUARES - 1)[0]).toBeLessThan(VIEW_WIDTH);
    expect(corner(SQUARES - 1)[1]).toBeLessThan(VIEW_HEIGHT);
  });

  it("splits the squares into three batched paths that add up to 1.000", () => {
    const counts = fieldCounts({ p: 0.0372, lo: 0.02, hi: 0.06, support: 100, thin: false, pooledNotes: [] });
    const paths = fieldPaths(counts);
    // 37 whole squares, one partial square (0,2 filled), the rest in Leinen.
    expect(count(paths.solid)).toBe(37);
    expect(count(paths.partial)).toBe(1);
    expect(count(paths.rest)).toBe(1000 - 37 - 1);
    expect(count(paths.band)).toBe(counts.bandTo - counts.bandFrom);
  });

  it("draws a partial square from the bottom, never a full one", () => {
    const { partial } = fieldPaths({ solid: 3, partial: 0.7, bandFrom: 0, bandTo: 0 });
    const [, y] = corner(3);
    const match = /^M[\d.]+ ([\d.]+)h[\d.]+v([\d.]+)h/.exec(partial)!;
    expect(Number(match[2])).toBeCloseTo(8.6 * 0.7, 1);
    expect(Number(match[1]) + Number(match[2])).toBeCloseTo(y + 8.6, 1);
  });

  it("has no partial path on a whole square and fills everything at the top of the scale", () => {
    expect(fieldPaths({ solid: 30, partial: 0, bandFrom: 20, bandTo: 50 }).partial).toBe("");
    expect(count(fieldPaths({ solid: 1000, partial: 0, bandFrom: 1000, bandTo: 1000 }).rest)).toBe(0);
  });

  it("eases between two states without overshoot and lands exactly", () => {
    const a = { solid: 10, partial: 0, bandFrom: 5, bandTo: 20 };
    const b = { solid: 40, partial: 0.5, bandFrom: 30, bandTo: 60 };
    let last = -1;
    for (let t = 0; t <= 1; t += 0.1) {
      const c = easeCounts(a, b, t);
      const filled = c.solid + c.partial;
      expect(filled).toBeLessThanOrEqual(40.5 + 1e-9);
      expect(filled).toBeGreaterThanOrEqual(last);
      last = filled;
    }
    expect(easeCounts(a, b, 1)).toEqual({ solid: 40, partial: 0.5, bandFrom: 30, bandTo: 60 });
    expect(easeCounts(a, b, 0)).toEqual(a);
  });
});

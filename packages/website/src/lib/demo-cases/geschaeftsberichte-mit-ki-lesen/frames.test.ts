import { describe, expect, it } from "vitest";
import {
  clamp01,
  ease,
  LADDER_MAX,
  ladderFrame,
  ladderTicks,
  segmentProgress,
  STRIP,
  STRIP_ENDS,
  stripLabels,
  threadFrame,
  WEEK_COUNT,
  weekStripFrame,
} from "./frames";
import { formatEur, formatInt, formatPct } from "./format";

const rects = (frame: ReturnType<typeof weekStripFrame>) =>
  frame.map(({ x, y, w, h }) => ({ x, y, w, h }));

describe("weekStripFrame (M1)", () => {
  it("frame(0) equals the stacks and frame(1) the columns, exactly", () => {
    expect(rects(weekStripFrame(0))).toEqual(STRIP_ENDS.stacks);
    expect(rects(weekStripFrame(1))).toEqual(STRIP_ENDS.columns);
  });

  it("has nine segments and hatches only the 30.09 week, only at the end", () => {
    expect(weekStripFrame(0)).toHaveLength(9);
    expect(WEEK_COUNT).toBe(9);
    expect(weekStripFrame(0).some((seg) => seg.hatched)).toBe(false);
    expect(weekStripFrame(0.6).some((seg) => seg.hatched)).toBe(false);
    expect(weekStripFrame(1).map((seg) => seg.hatched)).toEqual([
      false, false, false, false, false, false, false, false, true,
    ]);
  });

  it("is deterministic for any call order and clamps outside [0, 1]", () => {
    const a = weekStripFrame(0.37);
    weekStripFrame(0.9);
    weekStripFrame(0.1);
    expect(weekStripFrame(0.37)).toEqual(a);
    expect(weekStripFrame(-2)).toEqual(weekStripFrame(0));
    expect(weekStripFrame(5)).toEqual(weekStripFrame(1));
  });

  it("moves x monotonically per segment and keeps every rect inside the frame", () => {
    const steps = Array.from({ length: 41 }, (_, index) => index / 40);
    for (let index = 0; index < WEEK_COUNT; index += 1) {
      const xs = steps.map((p) => weekStripFrame(p)[index].x);
      const rising = xs[xs.length - 1] >= xs[0];
      for (let step = 1; step < xs.length; step += 1) {
        if (rising) expect(xs[step]).toBeGreaterThanOrEqual(xs[step - 1] - 1e-9);
        else expect(xs[step]).toBeLessThanOrEqual(xs[step - 1] + 1e-9);
      }
    }
    for (const p of steps) {
      for (const seg of weekStripFrame(p)) {
        expect(seg.x).toBeGreaterThanOrEqual(0);
        expect(seg.x + seg.w).toBeLessThanOrEqual(STRIP.width);
        expect(seg.y).toBeGreaterThanOrEqual(0);
        expect(seg.y + seg.h).toBeLessThanOrEqual(STRIP.baseline + 1e-9);
      }
    }
  });

  it("stands every column on the baseline, and stacks a taller September", () => {
    for (const column of STRIP_ENDS.columns) expect(column.y + column.h).toBeCloseTo(STRIP.baseline, 9);
    const top = (month: number) =>
      Math.min(...STRIP_ENDS.stacks.filter((_, index) => (month === 0 ? index < 4 : index >= 4)).map((r) => r.y));
    expect(top(1)).toBeLessThan(top(0));
    // Columns never overlap.
    const cols = STRIP_ENDS.columns;
    for (let index = 1; index < cols.length; index += 1) {
      expect(cols[index].x).toBeGreaterThan(cols[index - 1].x + cols[index - 1].w);
    }
  });

  it("staggers from p, not timers: segment 0 leads, the last segment finishes exactly at 1", () => {
    expect(segmentProgress(0.2, 0)).toBeGreaterThan(segmentProgress(0.2, 8));
    expect(segmentProgress(1, 8)).toBe(1);
    expect(segmentProgress(0, 0)).toBe(0);
  });

  it("labels cross-fade: totals at 0, weekly view at 1", () => {
    expect(stripLabels(0)).toMatchObject({ totals: 1, weekly: 0 });
    expect(stripLabels(1)).toMatchObject({ totals: 0, weekly: 1 });
  });
});

describe("ladderFrame (M2)", () => {
  it("places the four NCR lines on the count and the rate scale", () => {
    const count = Object.fromEntries(ladderFrame(1, "count", "count").map((dot) => [dot.line, dot.x]));
    expect(count.CRAFT).toBeCloseTo(23 / LADDER_MAX.count, 9);
    const rate = ladderFrame(1, "count", "per1000");
    expect(rate.map((dot) => dot.line)).toEqual(["AURA", "CRAFT", "NEST", "PULSE"]);
    const craft = rate.find((dot) => dot.line === "CRAFT")!;
    const nest = rate.find((dot) => dot.line === "NEST")!;
    expect(craft.x / nest.x).toBeCloseTo(2.2157, 3);
    expect(rate.every((dot) => dot.drop === 0)).toBe(true);
  });

  it("widens the CRAFT to NEST gap when it normalises", () => {
    const gap = (p: number) => {
      const frame = ladderFrame(p, "count", "per1000");
      return frame.find((dot) => dot.line === "CRAFT")!.x - frame.find((dot) => dot.line === "NEST")!.x;
    };
    expect(gap(1)).toBeGreaterThan(gap(0));
  });

  it("drops every dot into the absent lane for returns", () => {
    expect(ladderFrame(1, "per1000", "returns").every((dot) => dot.drop === 1)).toBe(true);
    expect(ladderFrame(0, "per1000", "returns").every((dot) => dot.drop === 0)).toBe(true);
    expect(ladderTicks("returns")).toEqual([]);
    expect(ladderTicks("per1000")).toEqual([0, 1, 2, 3]);
  });

  it("is clamped and deterministic", () => {
    expect(ladderFrame(-1, "count", "per1000")).toEqual(ladderFrame(0, "count", "per1000"));
    expect(ladderFrame(3, "count", "per1000")).toEqual(ladderFrame(1, "count", "per1000"));
  });
});

describe("threadFrame (M3)", () => {
  it("draws the thread first, then the ring and the rows", () => {
    expect(threadFrame(0)).toEqual({ dash: 1, ring: 0, rows: 0 });
    expect(threadFrame(0.75)).toEqual({ dash: 0, ring: 0, rows: 0 });
    expect(threadFrame(1)).toEqual({ dash: 0, ring: 1, rows: 1 });
    expect(threadFrame(2)).toEqual(threadFrame(1));
  });
});

describe("helpers", () => {
  it("ease and clamp hold their ends", () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBe(0.5);
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
  });

  it("formats per locale with a true minus", () => {
    expect(formatPct("de", -0.0211)).toBe("−2,1 %");
    expect(formatPct("en", 0.0079)).toBe("+0.8%");
    expect(formatPct("en", -0.0004)).toBe("0.0%");
    expect(formatPct("de", 0.123, { signed: false })).toBe("12,3 %");
    expect(formatInt("de", 9162)).toBe("9.162");
    expect(formatInt("en", 9162)).toBe("9,162");
    expect(formatEur("de", 4_124_238)).toBe("4.124.238 €");
    expect(formatEur("en", 4_124_238)).toBe("€4,124,238");
  });
});

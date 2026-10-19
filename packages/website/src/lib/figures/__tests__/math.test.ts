import { describe, expect, it } from "vitest";
import {
  clamp, easeInOutCubic, easeOutCubic, easeOutQuart, funnelLimits, hashSeed, jitterOffset,
  logExtent, logTicks, mulberry32, niceTicks, scaleBand, scaleLinear, scaleLog, spring,
  springEase, wilson, zForCoverage, r2,
} from "../math.ts";

describe("scales", () => {
  it("maps linearly and inverts", () => {
    const s = scaleLinear([0, 10], [100, 200]);
    expect(s(0)).toBe(100);
    expect(s(5)).toBe(150);
    expect(s(10)).toBe(200);
    expect(s.invert(150)).toBe(5);
  });

  it("supports inverted ranges", () => {
    const s = scaleLinear([0, 100], [300, 0]);
    expect(s(25)).toBe(225);
  });

  it("does not divide by zero for a flat domain", () => {
    expect(scaleLinear([3, 3], [0, 50])(3)).toBe(0);
  });

  it("maps log values and clamps below the domain", () => {
    const s = scaleLog([10, 1000], [0, 200]);
    expect(s(10)).toBeCloseTo(0);
    expect(s(100)).toBeCloseTo(100);
    expect(s(1000)).toBeCloseTo(200);
    expect(s(1)).toBeCloseTo(0);
    expect(s.invert(100)).toBeCloseTo(100);
  });

  it("rejects a non-positive log domain", () => {
    expect(() => scaleLog([0, 10], [0, 1])).toThrow(RangeError);
  });

  it("lays out bands with padding", () => {
    const b = scaleBand(4, [0, 400], 0.2);
    expect(b.step).toBe(100);
    expect(b.bandwidth).toBe(80);
    expect(b.pos(0)).toBe(10);
    expect(b.pos(3)).toBe(310);
    expect(b.pos(1.5)).toBe(160);
  });
});

describe("ticks", () => {
  it("gives round numbers that cover the range", () => {
    expect(niceTicks(0, 11.6, 4)).toEqual([0, 5, 10, 15]);
    expect(niceTicks(0, 100, 4)).toEqual([0, 25, 50, 75, 100]);
    expect(niceTicks(0, 0.81, 4)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it("covers negative ranges", () => {
    const t = niceTicks(-4, 10, 4);
    expect(t[0]).toBeLessThanOrEqual(-4);
    expect(t[t.length - 1]).toBeGreaterThanOrEqual(10);
  });

  it("survives a flat range", () => {
    expect(niceTicks(5, 5)).toEqual([5, 6]);
  });

  it("uses 1-2-5 steps on a log axis", () => {
    expect(logTicks(10, 500)).toEqual([10, 20, 50, 100, 200, 500]);
  });

  it("extends a log extent to cover the data", () => {
    expect(logExtent(9, 380)).toEqual([5, 500]);
    expect(logExtent(10, 100)).toEqual([10, 100]);
  });
});

describe("statistics", () => {
  it("matches the textbook Wilson interval for 20 of 100", () => {
    const w = wilson(20, 100);
    expect(w?.p).toBe(0.2);
    expect(w?.lo).toBeCloseTo(0.1334, 3);
    expect(w?.hi).toBeCloseTo(0.2889, 3);
  });

  it("stays inside 0 and 1 at the edges", () => {
    const zero = wilson(0, 10);
    const all = wilson(10, 10);
    expect(zero?.lo).toBe(0);
    expect(zero?.hi).toBeGreaterThan(0);
    expect(all?.hi).toBeCloseTo(1, 12);
    expect(all?.lo).toBeLessThan(1);
  });

  it("returns null for impossible input", () => {
    expect(wilson(1, 0)).toBeNull();
    expect(wilson(11, 10)).toBeNull();
  });

  it("builds symmetric funnel limits that narrow with n", () => {
    const [lo1, hi1] = funnelLimits(0.04, 100, 1.96);
    const [lo2, hi2] = funnelLimits(0.04, 10000, 1.96);
    expect(hi1 - 0.04).toBeCloseTo(0.04 - lo1, 6);
    expect(hi2 - lo2).toBeLessThan(hi1 - lo1);
  });

  it("accepts only supported coverages", () => {
    expect(zForCoverage(95)).toBeCloseTo(1.96, 2);
    expect(zForCoverage(99.8)).toBeCloseTo(3.09, 2);
    expect(() => zForCoverage(80)).toThrow(RangeError);
  });
});

describe("seeded randomness", () => {
  it("repeats for one seed and differs between seeds", () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    const c = mulberry32(8);
    const seqA = [a(), a(), a()];
    expect(seqA).toEqual([b(), b(), b()]);
    expect(seqA).not.toEqual([c(), c(), c()]);
    seqA.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    });
  });

  it("hashes strings stably", () => {
    expect(hashSeed("c3")).toBe(hashSeed("c3"));
    expect(hashSeed("c3")).not.toBe(hashSeed("c4"));
  });

  it("gives stable jitter inside the radius", () => {
    const [x, y] = jitterOffset(1, 5, 10);
    expect(jitterOffset(1, 5, 10)).toEqual([x, y]);
    expect(Math.hypot(x, y)).toBeLessThanOrEqual(10);
    expect(jitterOffset(1, 6, 10)).not.toEqual([x, y]);
  });
});

describe("easing and spring", () => {
  it("pins every easing to 0 and 1", () => {
    for (const f of [easeOutCubic, easeOutQuart, easeInOutCubic]) {
      expect(f(0)).toBe(0);
      expect(f(1)).toBe(1);
      expect(f(-3)).toBe(0);
      expect(f(4)).toBe(1);
    }
  });

  it("settles a spring on 1", () => {
    expect(spring(0)).toBe(0);
    expect(spring(-1)).toBe(0);
    expect(spring(3, 300, 30)).toBeCloseTo(1, 3);
  });

  it("maps progress onto a spring that ends exactly at 1", () => {
    expect(springEase(0, "soft")).toBe(0);
    expect(springEase(1, "soft")).toBe(1);
    expect(springEase(2, "soft")).toBe(1);
    expect(springEase(0.5, "med")).toBeGreaterThan(0.5);
  });

  it("clamps and rounds", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(r2(1.23456)).toBe(1.23);
  });
});

import { describe, expect, it } from "vitest";
import { CASE_WEEKS, CASE_SUPPLY, LAUNCH_INDEX } from "./case";
import {
  axisDomain,
  computeStats,
  interpolateBand,
  quantile,
  scenarios,
  shortCount,
  type Band,
} from "./quantile";

const LAUNCH: Band = CASE_WEEKS[LAUNCH_INDEX] as Band;
const SAMPLES = scenarios(LAUNCH);
const stats = (cap: number, ratio = 3) =>
  computeStats(SAMPLES, cap, ratio, LAUNCH);

describe("the workshop case", () => {
  it("matches the case study (sdmForecastWeeks, supply 1.050)", () => {
    expect(CASE_SUPPLY).toBe(1050);
    expect(CASE_WEEKS).toHaveLength(7);
    expect(LAUNCH).toMatchObject({ p10: 980, p50: 1180, p90: 1320 });
    expect(CASE_WEEKS[LAUNCH_INDEX]?.request).toBe(1370);
    expect(CASE_WEEKS[LAUNCH_INDEX]?.request).toBeGreaterThan(CASE_SUPPLY);
    for (const week of CASE_WEEKS)
      expect(week.p10 < week.p50 && week.p50 < week.p90).toBe(true);
  });
});

describe("quantile and scenarios", () => {
  it("passes through p10, p50, p90 at u = 0.1, 0.5, 0.9", () => {
    expect(quantile(LAUNCH, 0.1)).toBeCloseTo(980, 9);
    expect(quantile(LAUNCH, 0.5)).toBeCloseTo(1180, 9);
    expect(quantile(LAUNCH, 0.9)).toBeCloseTo(1320, 9);
  });

  it("continues both slopes into the tails and never goes below 0", () => {
    expect(quantile(LAUNCH, 0.005)).toBeCloseTo(1180 - 0.495 * 500, 9);
    expect(quantile(LAUNCH, 0.995)).toBeCloseTo(1180 + 0.495 * 350, 9);
    expect(quantile({ p10: 1, p50: 50, p90: 90 }, 0)).toBe(0);
  });

  it("makes 100 ascending samples", () => {
    expect(SAMPLES).toHaveLength(100);
    for (let k = 1; k < 100; k += 1)
      expect(SAMPLES[k]).toBeGreaterThan(SAMPLES[k - 1] as number);
  });
});

describe("the wow table (launch week)", () => {
  const row = (cap: number, ratio = 3) => {
    const s = stats(cap, ratio);
    return [s.short, Math.round(s.avgShort), Math.round(s.avgLeft)];
  };

  it("pins 1.050, 1.180, 1.268 and 1.320", () => {
    expect(row(1050)).toEqual([76, 126, 14]);
    expect(row(1180)).toEqual([50, 44, 63]);
    expect(row(1268)).toEqual([25, 11, 118]);
    expect(row(1320)).toEqual([10, 2, 161]);
  });

  it("finds the optimum at 1x, 3x and 9x", () => {
    expect(Math.round(stats(1050, 1).optimum)).toBe(1180);
    expect(Math.round(stats(1050, 3).optimum)).toBe(1268);
    expect(Math.round(stats(1050, 9).optimum)).toBe(1320);
    expect(stats(1050, 1).optimumPct).toBe(50);
    expect(stats(1050, 3).optimumPct).toBe(75);
    expect(stats(1050, 9).optimumPct).toBe(90);
  });

  it("counts the shortage at the forecast median", () => {
    expect(stats(1050).shortAtP50).toBe(50);
  });

  it("counts 0, 0, 19, 60, 76, 63, 18 short weeks at the supply cap", () => {
    const counts = CASE_WEEKS.map((week) =>
      shortCount(scenarios(week), CASE_SUPPLY),
    );
    expect(counts).toEqual([0, 0, 19, 60, 76, 63, 18]);
  });

  it("never gets shorter with a lower cap, and avgShort + avgLeft is consistent", () => {
    let previous = 101;
    for (let cap = 500; cap <= 1500; cap += 10) {
      const s = stats(cap);
      expect(s.short).toBeLessThanOrEqual(previous);
      previous = s.short;
      const mean = SAMPLES.reduce((sum, x) => sum + x, 0) / 100;
      expect(s.avgLeft - s.avgShort).toBeCloseTo(cap - mean, 9);
    }
  });

  it("counts only the visible columns while the staircase grows", () => {
    expect(shortCount(SAMPLES, 1050, 0)).toBe(0);
    expect(shortCount(SAMPLES, 1050, 24)).toBe(0);
    expect(shortCount(SAMPLES, 1050, 100)).toBe(76);
  });

  it("clamps the critical ratio for extreme weights", () => {
    expect(stats(1050, 20).optimum).toBeLessThan(1360);
    expect(Number.isFinite(stats(1050, 1e9).optimum)).toBe(true);
  });
});

describe("interpolateBand", () => {
  it("returns the week at integer positions and the mean in between", () => {
    expect(interpolateBand(CASE_WEEKS, 4)).toEqual({
      p10: 980,
      p50: 1180,
      p90: 1320,
      request: 1370,
    });
    const mid = interpolateBand(CASE_WEEKS, 3.5);
    expect(mid.p50).toBeCloseTo((1090 + 1180) / 2, 9);
    expect(mid.request).toBeCloseTo((1180 + 1370) / 2, 9);
  });

  it("keeps p10 < p50 < p90 along the whole way and clamps outside", () => {
    for (let w = -1; w <= 7; w += 0.05) {
      const band = interpolateBand(CASE_WEEKS, w);
      expect(band.p10 < band.p50 && band.p50 < band.p90).toBe(true);
    }
    expect(interpolateBand(CASE_WEEKS, -3).p50).toBe(700);
    expect(interpolateBand(CASE_WEEKS, 99).p50).toBe(930);
  });
});

describe("axisDomain", () => {
  it("rounds to hundreds and keeps at least 200 of range", () => {
    expect(axisDomain(SAMPLES, 1050, 1370)).toEqual([800, 1500]);
    const tight = scenarios({ p10: 990, p50: 1000, p90: 1010 });
    const [lo, hi] = axisDomain(tight, 1000);
    expect(hi - lo).toBeGreaterThanOrEqual(200);
    expect(lo % 100).toBe(0);
  });

  it("does not go below 0", () => {
    expect(axisDomain(scenarios({ p10: 1, p50: 2, p90: 3 }), 2)[0]).toBe(0);
  });
});

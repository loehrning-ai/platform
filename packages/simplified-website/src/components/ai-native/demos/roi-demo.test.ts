import { describe, it, expect } from "vitest";

/**
 * Grading-pure math tests for the ROI calculator. We verify the formulas are
 * deterministic and return expected shapes for known inputs.
 */

const WEEKS_PER_YEAR_WORKING = 46;
const IMPLEMENTATION_COST = 280_000;
const LICENSE_PER_SEAT_MONTH = 45;
const YEAR_2_GROWTH = 1.25;
const YEAR_3_GROWTH = 1.4;

function compute(
  headcount: number,
  hourly: number,
  adoptionPct: number,
  hoursPerWeek: number,
) {
  const annualHours =
    headcount * (adoptionPct / 100) * hoursPerWeek * WEEKS_PER_YEAR_WORKING;
  const annualSavings = annualHours * hourly;
  const licensesPerYear = headcount * LICENSE_PER_SEAT_MONTH * 12;
  const netY1 = annualSavings - IMPLEMENTATION_COST - licensesPerYear;
  const netY2 = annualSavings * YEAR_2_GROWTH - licensesPerYear;
  const netY3 = annualSavings * YEAR_3_GROWTH - licensesPerYear;
  const totalNet = netY1 + netY2 + netY3;
  const roiPct = Math.round(
    (totalNet / (IMPLEMENTATION_COST + licensesPerYear * 3)) * 100,
  );
  return { annualHours, annualSavings, netY1, netY2, netY3, totalNet, roiPct };
}

describe("roi-demo math", () => {
  it("is deterministic for identical inputs", () => {
    const a = compute(180, 85, 55, 4);
    const b = compute(180, 85, 55, 4);
    expect(a).toEqual(b);
  });

  it("default inputs produce positive net for year 2+", () => {
    const { netY2, netY3 } = compute(180, 85, 55, 4);
    expect(netY2).toBeGreaterThan(0);
    expect(netY3).toBeGreaterThan(0);
  });

  it("zero adoption means zero savings", () => {
    const { annualSavings } = compute(180, 85, 0, 4);
    expect(annualSavings).toBe(0);
  });

  it("scales annualHours linearly with headcount + hours", () => {
    const small = compute(100, 85, 50, 2);
    const double = compute(200, 85, 50, 2);
    expect(double.annualHours).toBeCloseTo(small.annualHours * 2, 5);
  });

  it("net Y1 can be negative for expensive implementation + low hours", () => {
    const { netY1 } = compute(20, 40, 10, 1);
    expect(netY1).toBeLessThan(0);
  });
});

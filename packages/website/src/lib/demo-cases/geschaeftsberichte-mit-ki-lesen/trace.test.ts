import { describe, expect, it } from "vitest";
import { REPORT } from "./data";
import { AUGUST_RANGE, clampRange, FOUR_WEEKS_RANGE, landedSum, matchesReport, revenuePerWeek, rowsIn, SEPTEMBER_RANGE, TRACE_ROWS, traceGroups, traceSum } from "./trace";

describe("the trace (L18 to L20)", () => {
  it("has 171 CRAFT rows, 19 per week", () => {
    expect(TRACE_ROWS).toHaveLength(171);
    expect(rowsIn({ from: 0, to: 0 })).toHaveLength(19);
  });

  it("adds 95 rows of the five September weeks to the report's 4.124.238 €", () => {
    expect(rowsIn(SEPTEMBER_RANGE)).toHaveLength(95);
    expect(traceGroups(SEPTEMBER_RANGE).map((group) => [group.code, group.units, group.price])).toEqual([
      ["E1", 3258, 449],
      ["E2", 2973, 699],
      ["G1", 2931, 199],
    ]);
    expect(traceSum(SEPTEMBER_RANGE)).toBe(REPORT.craftRevenueEur);
    expect(matchesReport(SEPTEMBER_RANGE)).toBe(true);
  });

  it("falls 910.965 € short with the four weeks to 23 September", () => {
    expect(rowsIn(FOUR_WEEKS_RANGE)).toHaveLength(76);
    expect(traceSum(FOUR_WEEKS_RANGE)).toBe(3213273);
    expect(REPORT.craftRevenueEur - traceSum(FOUR_WEEKS_RANGE)).toBe(910965);
    expect(matchesReport(FOUR_WEEKS_RANGE)).toBe(false);
  });

  it("takes about the same per shipping week in both months", () => {
    expect(Math.round(revenuePerWeek(SEPTEMBER_RANGE))).toBe(824848);
    expect(Math.round(revenuePerWeek(AUGUST_RANGE))).toBe(825278);
  });

  it("counts only rows that have landed, and all of them by the end", () => {
    expect(landedSum(SEPTEMBER_RANGE, 0)).toBe(0);
    let previous = 0;
    for (let landed = 0; landed <= 95; landed += 1) {
      const now = landedSum(SEPTEMBER_RANGE, landed);
      expect(now).toBeGreaterThanOrEqual(previous);
      previous = now;
    }
    expect(landedSum(SEPTEMBER_RANGE, 95)).toBe(REPORT.craftRevenueEur);
    expect(clampRange({ from: 7, to: 3 })).toEqual({ from: 7, to: 7 });
  });
});

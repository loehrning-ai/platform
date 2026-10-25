import { describe, expect, it } from "vitest";
import { CRAFT_SEP_ROWS, REPORT } from "./data";
import { chipFlight, landedRows, TRACE_MS, weekBlock, railItems, RAIL_W, RAIL_X } from "./timelines";
import { landedSum, traceGroups, traceSum } from "./trace";

describe("the trace", () => {
  it("adds 30, 20 and 45 rows to 4.124.238 €, the report's figure", () => {
    const groups = traceGroups();
    expect(groups.map((group) => [group.code, group.rows, group.units])).toEqual([
      ["E1", 30, 3258],
      ["E2", 20, 2973],
      ["G1", 45, 2931],
    ]);
    expect(traceSum(groups)).toBe(4124238);
    expect(traceSum(groups)).toBe(REPORT.craftRevenueEur);
  });

  it("counts only rows that have landed, and all of them by the end", () => {
    expect(landedRows(0)).toBe(0);
    expect(landedSum(landedRows(0))).toBe(0);
    let previous = 0;
    for (let ms = 0; ms <= TRACE_MS; ms += 50) {
      const now = landedRows(ms);
      expect(now).toBeGreaterThanOrEqual(previous);
      previous = now;
    }
    expect(landedRows(TRACE_MS)).toBe(CRAFT_SEP_ROWS.length);
    expect(landedSum(CRAFT_SEP_ROWS.length)).toBe(REPORT.craftRevenueEur);
    expect(chipFlight(94, 0)).toBe(0);
  });
});

describe("stage geometry", () => {
  it("keeps every rail mark inside the track and the units rails end to end", () => {
    for (const counter of ["records", "affected", "scrapped"] as const) {
      for (const item of railItems(counter)) {
        expect(item.x).toBeGreaterThanOrEqual(RAIL_X);
        expect(item.x + item.w).toBeLessThanOrEqual(RAIL_X + RAIL_W + 1e-9);
      }
    }
    const merged = railItems("records", true);
    expect(new Set(merged.map((item) => item.x)).size).toBe(17);
  });

  it("stacks a month's weeks to its total and collapses them to its mean", () => {
    const aug = [0, 1, 2, 3].map((index) => weekBlock(index, "month"));
    for (let index = 1; index < aug.length; index += 1) {
      expect((aug[index]?.y ?? 0) + (aug[index]?.h ?? 0)).toBeCloseTo(aug[index - 1]?.y ?? 0, 6);
    }
    const mean = [4, 5, 6, 7, 8].map((index) => weekBlock(index, "week"));
    expect(new Set(mean.map((block) => block.h.toFixed(6))).size).toBe(1);
  });
});

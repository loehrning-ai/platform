import { describe, expect, it } from "vitest";
import { REPORT } from "./data";
import {
  addDays,
  companyGrowth,
  daysCovered,
  growth,
  growthWith,
  machines,
  maxMerges,
  meanQty,
  mergeCells,
  mergeStepRate,
  numerator,
  rate,
  reading,
  readingId,
  SAME_BAND,
  unitsShipped,
  verdictOf,
  weekCount,
  weeklyUnits,
  weldCracks,
} from "./definitions";

const pct = (value: number) => (value * 100).toFixed(1);

/** The number ledger of the build contract (L1 to L29), recomputed from data.ts rows. */
describe("the ledger", () => {
  it("L1: records per 1.000 fall from 3,21 to 2,51, −21,7 %, the report's figures", () => {
    const r = reading();
    expect([r.aug.toFixed(2), r.sep.toFixed(2)]).toEqual([REPORT.vpDefectsAug.toFixed(2), REPORT.vpDefectsSep.toFixed(2)]);
    expect(pct(r.change)).toBe("-21.7");
    expect(r.verdict).toBe("better");
  });

  it("L2, L4, L7: the absolute counts", () => {
    expect([numerator("records", "aug"), numerator("records", "sep")]).toEqual([24, 23]);
    expect(pct(reading({ denom: "none" }).change)).toBe("-4.2");
    expect([numerator("affected", "aug"), numerator("affected", "sep")]).toEqual([2324, 2832]);
    expect(pct(reading({ counter: "affected", denom: "none" }).change)).toBe("21.9");
    expect([numerator("scrapped", "aug"), numerator("scrapped", "sep")]).toEqual([924, 1539]);
    expect(pct(reading({ counter: "scrapped", denom: "none" }).change)).toBe("66.6");
  });

  it("L5, L8: affected 310 to 309 (same), scrapped 123 to 168 (worse)", () => {
    const affected = reading({ counter: "affected" });
    expect([Math.round(affected.aug), Math.round(affected.sep), pct(affected.change), affected.verdict]).toEqual([310, 309, "-0.4", "same"]);
    const scrapped = reading({ counter: "scrapped" });
    expect([Math.round(scrapped.aug), Math.round(scrapped.sep), pct(scrapped.change), scrapped.verdict]).toEqual([123, 168, "36.1", "worse"]);
  });

  it("L6: affected units per shipping week 581 to 566, −2,5 %", () => {
    const r = reading({ counter: "affected", denom: "none", period: "week" });
    expect([Math.round(r.aug), Math.round(r.sep), pct(r.change)]).toEqual([581, 566, "-2.5"]);
  });

  it("units shipped and the mean quantity per record", () => {
    expect([unitsShipped("aug"), unitsShipped("sep")]).toEqual([7488, 9162]);
    expect([weekCount("aug"), weekCount("sep")]).toEqual([4, 5]);
    expect([Math.round(meanQty("aug")), Math.round(meanQty("sep"))]).toEqual([97, 123]);
    expect(weeklyUnits("2023-09-30")).toBe(2035);
  });

  it("L10, L11: four cells, six merges, 23 to 17, one rate step per merge", () => {
    expect(mergeCells().map((cell) => [cell.machine, cell.date, cell.rows.length])).toEqual([
      ["M-019", "2023-09-02", 2],
      ["M-024", "2023-09-16", 2],
      ["M-023", "2023-09-23", 3],
      ["M-024", "2023-09-23", 3],
    ]);
    expect(maxMerges()).toBe(6);
    expect(numerator("records", "sep", "oct6", 6)).toBe(17);
    expect([0, 1, 2, 3, 4, 5, 6].map((k) => mergeStepRate(k).toFixed(2))).toEqual(["2.51", "2.40", "2.29", "2.18", "2.07", "1.96", "1.86"]);
    expect(reading({ counter: "affected", merges: 6 }).sep).toBe(reading({ counter: "affected" }).sep);
    expect(numerator("records", "sep", "oct6", 99)).toBe(17);
  });

  it("L13: 28 and 35 days in the file's months", () => {
    expect(daysCovered("aug")).toEqual({
      from: "2023-08-05",
      to: "2023-09-01",
      days: 28,
    });
    expect(daysCovered("sep")).toEqual({
      from: "2023-09-02",
      to: "2023-10-06",
      days: 35,
    });
    expect(daysCovered("sep", "sep29")).toEqual({
      from: "2023-09-02",
      to: "2023-09-29",
      days: 28,
    });
    expect(addDays("2023-08-31", 1)).toBe("2023-09-01");
  });

  it("L14 to L17: +22,4 %, −4,8 %, −2,1 %, company +26,0 % and +0,8 %", () => {
    expect(pct(growth("month"))).toBe((REPORT.unitsGrowthPermille / 10).toFixed(1));
    expect(unitsShipped("sep", "sep29")).toBe(7127);
    expect(pct(growthWith("sep29", "month"))).toBe("-4.8");
    expect(pct(growth("week"))).toBe("-2.1");
    expect(pct(companyGrowth("month"))).toBe("26.0");
    expect(pct(companyGrowth("week"))).toBe((REPORT.companyWeekGrowthPermille / 10).toFixed(1));
  });

  it("L26 to L29: four weeks each, merged, and weld cracks", () => {
    const four = reading({ septemberEnds: "sep29" });
    expect([four.aug.toFixed(2), four.sep.toFixed(2), pct(four.change)]).toEqual(["3.21", "3.09", "-3.7"]);
    const affected = reading({ counter: "affected", septemberEnds: "sep29" });
    expect([Math.round(affected.aug), Math.round(affected.sep), pct(affected.change)]).toEqual([310, 387, "24.6"]);
    expect(numerator("records", "sep", "sep29", 6)).toBe(16);
    expect(reading({ septemberEnds: "sep29", merges: 6 }).sep.toFixed(2)).toBe("2.24");
    expect([weldCracks("aug"), weldCracks("sep"), weldCracks("sep", "sep29")]).toEqual([2, 5, 5]);
    expect(machines()).toEqual(["M-019", "M-020", "M-021", "M-022", "M-023", "M-024"]);
  });
});

describe("reading()", () => {
  it("ignores the period per 1.000 units, so per-1.000 ids never carry a week", () => {
    expect(readingId({ counter: "scrapped", period: "week" })).toBe("scrapped/per1000/month/oct6/0");
    expect(reading({ period: "week" }).sep).toBe(reading().sep);
  });

  it("covers all 24 free-play settings with values inside the scale", () => {
    for (const counter of ["records", "affected", "scrapped"] as const)
      for (const denom of ["none", "per1000"] as const)
        for (const merges of [0, 6])
          for (const septemberEnds of ["oct6", "sep29"] as const) {
            const r = reading({ counter, denom, merges, septemberEnds });
            expect(r.change).toBeGreaterThan(-0.5);
            expect(r.change).toBeLessThan(0.7);
          }
  });

  it("calls a change inside the demo band the same", () => {
    expect(SAME_BAND).toEqual({ value: 0.02, source: "demo" });
    expect(verdictOf(0.019)).toBe("same");
    expect(verdictOf(0.021)).toBe("worse");
    expect(verdictOf(-0.021)).toBe("better");
    expect(rate("records", "sep").toFixed(2)).toBe("2.51");
  });
});

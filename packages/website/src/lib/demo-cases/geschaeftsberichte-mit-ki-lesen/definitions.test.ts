import { describe, expect, it } from "vitest";
import { CRAFT_NCR_SEP, REPORT } from "./data";
import { companyGrowth, count, growth, mergeRecords, rate, trend, unitsShipped, verdict, weekCount } from "./definitions";

describe("the three counters and two periods", () => {
  it("ships 7.488 and 9.162 CRAFT units in four and five weeks", () => {
    expect([unitsShipped("aug"), unitsShipped("sep")]).toEqual([7488, 9162]);
    expect([weekCount("aug"), weekCount("sep")]).toEqual([4, 5]);
  });

  it("counts records, affected and scrapped units", () => {
    expect([count("records", "aug"), count("records", "sep")]).toEqual([24, 23]);
    expect([count("affected", "aug"), count("affected", "sep")]).toEqual([2324, 2832]);
    expect([count("scrapped", "aug"), count("scrapped", "sep")]).toEqual([924, 1539]);
  });

  it("gives 3,21 → 2,51, 310 → 309 and 123 → 168 per 1.000, as the report rounds", () => {
    expect(rate("records", "aug").toFixed(2)).toBe(REPORT.vpDefectsAug.toFixed(2));
    expect(rate("records", "sep").toFixed(2)).toBe(REPORT.vpDefectsSep.toFixed(2));
    expect([Math.round(rate("affected", "aug")), Math.round(rate("affected", "sep"))]).toEqual([310, 309]);
    expect([Math.round(rate("scrapped", "aug")), Math.round(rate("scrapped", "sep"))]).toEqual([123, 168]);
  });

  it("calls the same file better, same and worse", () => {
    expect([verdict("records"), verdict("affected"), verdict("scrapped")]).toEqual(["better", "same", "worse"]);
    expect(trend(100, 101.9)).toBe("same");
    expect(trend(100, 102.1)).toBe("worse");
    expect(trend(100, 97.9)).toBe("better");
  });

  it("merges the same machine on the same week: 23 records become 17, the rate 1,86", () => {
    expect(mergeRecords(CRAFT_NCR_SEP)).toHaveLength(17);
    expect(count("records", "sep", true)).toBe(17);
    expect(count("records", "aug", true)).toBe(15);
    expect(rate("records", "sep", true).toFixed(2)).toBe("1.86");
    // merging leaves the unit counters alone
    expect(count("affected", "sep", true)).toBe(count("affected", "sep"));
  });

  it("grows +22,4 % as a month total and falls 2,1 % per shipping week", () => {
    expect((growth("month") * 100).toFixed(1)).toBe("22.4");
    expect((growth("week") * 100).toFixed(1)).toBe("-2.1");
    expect((companyGrowth("month") * 100).toFixed(1)).toBe("26.0");
    expect((companyGrowth("week") * 100).toFixed(1)).toBe("0.8");
  });
});

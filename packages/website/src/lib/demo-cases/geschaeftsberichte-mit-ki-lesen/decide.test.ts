import { describe, expect, it } from "vitest";
import { checkTrigger, decide, decisionFacts, DEMO_START, FALLBACK_CONDITION, KIT_TRIGGER, SCRAP_PRICE_EUR, scrapValue, startTrigger } from "./decide";
import { COUNTERS, PERIODS } from "./definitions";

describe("decide (L22)", () => {
  const expected = {
    "scrapped month": "rework",
    "scrapped week": "rework",
    "affected month": "holdCause",
    "affected week": "holdCause",
    "records month": "vp",
    "records week": "holdDemand",
  } as const;

  it.each(COUNTERS.flatMap((counter) => PERIODS.map((period) => [counter, period] as const)))("%s, %s", (counter, period) => {
    expect(decide(counter, period).key).toBe(expected[`${counter} ${period}`]);
  });

  it("gives four distinct decisions in six cells", () => {
    const keys = COUNTERS.flatMap((counter) => PERIODS.map((period) => decide(counter, period).key));
    expect(new Set(keys).size).toBe(4);
  });
});

describe("the trigger (L23)", () => {
  it("tags the kit's suggestion and the demo's own start values", () => {
    expect(KIT_TRIGGER.scrapped).toEqual({ value: 80, source: "kit" });
    expect(DEMO_START.affected).toEqual({ value: 250, source: "demo" });
    expect(DEMO_START.records).toEqual({ value: 2.51, source: "demo" });
    expect(FALLBACK_CONDITION).toEqual({ value: 2, source: "demo" });
    expect(COUNTERS.map((counter) => startTrigger(counter).source)).toEqual(["demo", "demo", "kit"]);
  });

  it("passes all three checks for the kit's 80 scrapped units", () => {
    expect(checkTrigger("scrapped", 80)).toMatchObject({
      countsUnits: true,
      notMetToday: true,
      named: true,
      mergeGameable: false,
    });
    expect(checkTrigger("scrapped", 200).notMetToday).toBe(false);
  });

  it("flags a records trigger that merging alone would meet", () => {
    const records = checkTrigger("records", 2.51);
    expect(records.countsUnits).toBe(false);
    expect(records.notMetToday).toBe(true);
    expect(records.mergedToday.toFixed(2)).toBe("1.86");
    expect(records.mergeGameable).toBe(true);
    expect(checkTrigger("records", 1.5).mergeGameable).toBe(false);
    expect(checkTrigger("records", FALLBACK_CONDITION.value).mergeGameable).toBe(true);
  });
});

describe("scrap valuation (L24, L25)", () => {
  it("values scrap at the mean list price: 1.539 × 449 € = 691.011 €, 16,8 % of CRAFT revenue", () => {
    expect(SCRAP_PRICE_EUR).toBe(449);
    expect(scrapValue()).toMatchObject({ units: 1539, eur: 691011 });
    expect((scrapValue().shareOfRevenue * 100).toFixed(1)).toBe("16.8");
    const facts = decisionFacts();
    expect(facts.machines).toEqual(["M-019", "M-020", "M-021", "M-022", "M-023", "M-024"]);
    expect([facts.recordsSepCount, facts.mergedCount]).toEqual([23, 17]);
    expect(facts.verdicts).toEqual({
      records: "better",
      affected: "same",
      scrapped: "worse",
    });
  });
});

import { describe, expect, it } from "vitest";
import { checkTrigger, decide, decisionFacts, SCRAP_PRICE_EUR, scrapValue } from "./decide";
import { BASES, COUNTERS } from "./definitions";

describe("decide", () => {
  const expected = {
    "scrapped month": "rework",
    "scrapped week": "rework",
    "affected month": "holdCause",
    "affected week": "holdCause",
    "records month": "vp",
    "records week": "holdDemand",
  } as const;

  it.each(COUNTERS.flatMap((counter) => BASES.map((basis) => [counter, basis] as const)))("%s, %s", (counter, basis) => {
    const decision = decide(counter, basis);
    expect(decision.key).toBe(expected[`${counter} ${basis}`]);
    // the counter-position is always the other pole
    expect(decision.opposite).toEqual(
      counter === "records" && basis === "month" ? { counter: "scrapped", basis: "week" } : { counter: "records", basis: "month" },
    );
  });

  it("fails check one only for records, met by merging alone", () => {
    expect(checkTrigger("scrapped")).toMatchObject({ countsUnits: true, notMetToday: true, named: true, mergedToday: null });
    expect(checkTrigger("affected")).toMatchObject({ countsUnits: true, notMetToday: true });
    const records = checkTrigger("records");
    expect(records.countsUnits).toBe(false);
    expect(records.notMetToday).toBe(true);
    expect(records.mergedToday?.toFixed(2)).toBe("1.86");
    expect((records.mergedToday ?? 9) < records.threshold).toBe(true);
  });

  it("values scrap at the mean list price: 1.539 × 449 € = 691.011 €, 16,8 % of CRAFT revenue", () => {
    expect(SCRAP_PRICE_EUR).toBe(449);
    expect(scrapValue()).toMatchObject({ units: 1539, eur: 691011 });
    expect((scrapValue().shareOfRevenue * 100).toFixed(1)).toBe("16.8");
    expect(decisionFacts().machines).toEqual(["M-019", "M-020", "M-021", "M-022", "M-023", "M-024"]);
  });
});

import { describe, expect, it } from "vitest";
import { DEFECTS, REVENUES, UNITS, WORKSHOP } from "./data";
import {
  calendarShare,
  compare,
  craftComparison,
  cutSpan,
  groups,
  growth,
  headline,
  leadPct,
  per1000,
  perUnit,
  septemberRates,
  verdict,
  weekdaysInMonth,
} from "./logic";

const pct = (x: number, digits = 1) => Number((x * 100).toFixed(digits));

describe("the month line table (spec section 2)", () => {
  it.each([
    [3, 104.5, 2.3],
    [4, 25.8, 0.7],
    [5, -20.2, -0.2],
    [6, -50.0, -0.0],
  ])("cut %i: headline %f %, per week %f %", (k, head, per) => {
    expect(pct(headline(REVENUES, k))).toBeCloseTo(head, 1);
    expect(pct(perUnit(REVENUES, k))).toBeCloseTo(per, 1);
  });

  it("splits weeks at the line", () => {
    const { a, b } = groups(REVENUES, 4);
    expect([a.n, b.n]).toEqual([4, 5]);
    expect(a.total).toBe(17233647);
    expect(b.total).toBe(21687544);
  });

  it("spans -50,0 to +104,5 as headline and -0,2 to +2,3 per week", () => {
    const span = cutSpan(REVENUES);
    expect(pct(span.head[0])).toBeCloseTo(-50, 1);
    expect(pct(span.head[1])).toBeCloseTo(104.5, 1);
    expect(pct(span.per[0])).toBeCloseTo(-0.2, 1);
    expect(pct(span.per[1])).toBeCloseTo(2.3, 1);
  });

  it("explains 97 % of the report's growth by the calendar", () => {
    const share = calendarShare(headline(REVENUES, 4), perUnit(REVENUES, 4)) as number;
    expect(share).toBeCloseTo(0.974, 3);
    expect(Math.round(share * 100)).toBe(97);
  });

  it("gives the units-based per-week growth the deck prints (+0,8 %)", () => {
    expect(pct(perUnit(UNITS, 4))).toBeCloseTo(0.8, 1);
  });

  it("returns NaN for a base of zero and null for no calendar effect", () => {
    expect(growth(0, 5)).toBeNaN();
    expect(calendarShare(-0.2, -0.01)).toBeNull();
    expect(calendarShare(0.1, 0.12)).toBeNull();
    expect(calendarShare(Number.NaN, 0.1)).toBeNull();
  });
});

describe("verdict thresholds", () => {
  it("is calendar from 80 %, mixed from 30 %, real below", () => {
    expect(verdict(0.258, 0.007)).toBe("calendar");
    expect(verdict(0.1, 0.05)).toBe("mixed");
    expect(verdict(0.1, 0.08)).toBe("real");
    expect(verdict(0.1, -0.01)).toBe("shrinks");
    expect(verdict(-0.2, -0.002)).toBe("down");
    expect(verdict(Number.NaN, 0)).toBe("thin");
  });
});

describe("defects per 1.000 units (Act 2)", () => {
  it("matches the report: CRAFT 2,51, NEST 1,13, PULSE 0,71, AURA 0,43", () => {
    const rate = Object.fromEntries(septemberRates().map((r) => [r.line, r.rate]));
    expect(rate.CRAFT).toBeCloseTo(2.51, 2);
    expect(rate.NEST).toBeCloseTo(1.13, 2);
    expect(rate.PULSE).toBeCloseTo(0.71, 2);
    expect(rate.AURA).toBeCloseTo(0.43, 2);
  });

  it("re-derives CRAFT in August as 3,21 and the only improvement", () => {
    const aug = (line: string) => {
      const row = DEFECTS.find((r) => r.line === line)!;
      return per1000(row.augRecords, row.augUnits);
    };
    expect(aug("CRAFT")).toBeCloseTo(WORKSHOP.craftIntensityAug, 2);
    const improved = DEFECTS.filter((row) => per1000(row.sepRecords, row.sepUnits) < per1000(row.augRecords, row.augUnits));
    expect(improved.map((row) => row.line)).toEqual(["CRAFT"]);
  });

  it("leads NEST by 21 % in records and 2,2 times per 1.000 units", () => {
    expect(leadPct(23, 19)).toBeCloseTo(0.21, 2);
    const c = craftComparison();
    expect(c.nextByRecords.line).toBe("NEST");
    expect(c.nextByRate.line).toBe("NEST");
    expect(c.multiple).toBeCloseTo(WORKSHOP.nextWorstMultiple, 1);
    expect(c.leadRecords).toBeCloseTo(0.2105, 3);
  });
});

describe("working days", () => {
  it("counts Mo-Fr: August 2023 has 23, September 2023 has 21", () => {
    expect(weekdaysInMonth(2023, 8, 0)).toBe(23);
    expect(weekdaysInMonth(2023, 9, 0)).toBe(21);
  });

  it("subtracts holidays but never goes below 1", () => {
    expect(weekdaysInMonth(2023, 8, 1)).toBe(22);
    expect(weekdaysInMonth(2023, 8, 99)).toBe(1);
    expect(weekdaysInMonth(2024, 2, 0)).toBe(21);
  });

  it("shows +37,8 % per day when revenue is read in working days (known, not fixed)", () => {
    const result = compare({ aVal: 17233647, aN: 23, bVal: 21687544, bN: 21 });
    expect(result.ok && pct(result.p)).toBeCloseTo(37.8, 1);
  });
});

describe("compare (Dein Vergleich)", () => {
  it("computes the prefilled example", () => {
    const result = compare({ aVal: 17233647, aN: 4, bVal: 21687544, bN: 5 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(pct(result.h)).toBeCloseTo(25.8, 1);
    expect(pct(result.p)).toBeCloseTo(0.7, 1);
    expect(result.verdict).toBe("calendar");
    expect(result.extra).toBe(1);
  });

  it("names what is missing and never guesses", () => {
    expect(compare({ aVal: null, aN: 4, bVal: 5, bN: 0 })).toEqual({ ok: false, missing: ["aVal", "bN"] });
    expect(compare({ aVal: -3, aN: 4, bVal: 5, bN: 5 })).toEqual({ ok: false, missing: ["aVal"] });
  });

  it("reads equal-length periods as real growth with no calendar share", () => {
    const result = compare({ aVal: 100, aN: 4, bVal: 130, bN: 4 });
    expect(result.ok && result.verdict).toBe("real");
    expect(result.ok && result.s).toBeNull();
  });

  it("refuses absurd inputs by name instead of printing nonsense", () => {
    expect(compare({ aVal: 100, aN: 4, bVal: 130, bN: 9_450_000 })).toEqual({ ok: false, missing: [], implausible: "count", flagged: ["bN"] });
    expect(compare({ aVal: 100, aN: 4, bVal: 100_000_000, bN: 4 })).toEqual({ ok: false, missing: [], implausible: "growth", flagged: ["aVal", "bVal"] });
    expect(compare({ aVal: 100, aN: 400, bVal: 130, bN: 400 }).ok).toBe(true);
  });
});

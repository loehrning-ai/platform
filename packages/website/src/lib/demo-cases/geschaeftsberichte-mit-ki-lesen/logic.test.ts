import { describe, expect, it } from "vitest";
import { TRUTHS, type ClaimId, LINES } from "./data";
import { formatPct, formatDecimal } from "./format";
import {
  assessSheet,
  checkClaim,
  claimSummary,
  craftEvidence,
  extraWeekEffect,
  gutLine,
  INITIAL_STATE,
  isPristine,
  linePerWeekGrowth,
  optionIds,
  per1000,
  rate,
  readCompare,
  readDefects,
  readFlag,
  reducer,
  scrapShare,
  SHEET_FIELDS,
  SHEET_OPTIONS,
  shrinkingLines,
  totalPerWeekGrowth,
  type DemoState,
  type Sheet,
} from "./logic";

const pct = (value: number) => formatPct("de", value).replace(/ /g, " ");
const dec = (value: number | null) => (value === null ? null : formatDecimal("de", value));

describe("per-week growth", () => {
  it("matches the spec: company +0,8 %, CRAFT −2,1 %, PULSE −3,5 %, NEST −0,4 %, BEAM +6,8 %", () => {
    expect(pct(totalPerWeekGrowth())).toBe("+0,8 %");
    expect(pct(linePerWeekGrowth("CRAFT"))).toBe("−2,1 %");
    expect(pct(linePerWeekGrowth("PULSE"))).toBe("−3,5 %");
    expect(pct(linePerWeekGrowth("NEST"))).toBe("−0,4 %");
    expect(pct(linePerWeekGrowth("BEAM"))).toBe("+6,8 %");
    expect(pct(linePerWeekGrowth("ECHO"))).toBe("+2,8 %");
    expect(pct(linePerWeekGrowth("BREW"))).toBe("+2,4 %");
    expect(pct(linePerWeekGrowth("AURA"))).toBe("+0,9 %");
  });

  it("one extra week alone makes +25 %", () => {
    expect(extraWeekEffect()).toBe(0.25);
  });

  it("three lines shrink, smallest first", () => {
    expect(shrinkingLines()).toEqual(["PULSE", "CRAFT", "NEST"]);
  });
});

describe("rates per 1.000 and scrap", () => {
  it("September 2,51 / 1,13 / 0,71 / 0,43 and August 3,21 / 0,89 / 0,70 / 0,33", () => {
    expect(["CRAFT", "NEST", "PULSE", "AURA"].map((line) => dec(rate(line as never, "2023-09")))).toEqual([
      "2,51",
      "1,13",
      "0,71",
      "0,43",
    ]);
    expect(["CRAFT", "NEST", "PULSE", "AURA"].map((line) => dec(rate(line as never, "2023-08")))).toEqual([
      "3,21",
      "0,89",
      "0,70",
      "0,33",
    ]);
  });

  it("CRAFT runs 2,2 times NEST, and CRAFT's rate fell 22 %", () => {
    expect(dec(rate("CRAFT", "2023-09")! / rate("NEST", "2023-09")!)?.slice(0, 3)).toBe("2,2");
    expect(pct(rate("CRAFT", "2023-09")! / rate("CRAFT", "2023-08")! - 1).replace(",0", "")).toMatch(
      /^−21,7 %$|^−22 %$/,
    );
    expect(Math.round((1 - rate("CRAFT", "2023-09")! / rate("CRAFT", "2023-08")!) * 100)).toBe(22);
  });

  it("null stays null", () => {
    expect(per1000(null, 1000)).toBeNull();
    expect(rate("ECHO", "2023-09")).toBeNull();
    expect(scrapShare("BEAM", "2023-08")).toBeNull();
    expect(per1000(0, 1000)).toBe(0);
  });

  it("scrap shares 12,3 % → 16,8 %; 1.539 × 449 = 691.011, 16,8 % of 4.124.238", () => {
    const evidence = craftEvidence();
    expect(pct(evidence.scrapShareAug).replace("+", "")).toBe("12,3 %");
    expect(pct(evidence.scrapShareSep).replace("+", "")).toBe("16,8 %");
    expect(evidence.scrapEur).toBe(691_011);
    expect(pct(evidence.scrapShareOfRevenue).replace("+", "")).toBe("16,8 %");
    expect(evidence.scrapShareOfRevenue).toBeCloseTo(691_011 / 4_124_238, 10);
    // "Ein Euro von sechs"
    expect(Math.round(1 / evidence.scrapShareOfRevenue)).toBe(6);
  });

  it("CRAFT's revenue per week barely moves (−0,05 %): the −2,1 % is units, never revenue", () => {
    const craft = LINES.find((line) => line.id === "CRAFT")!;
    const revenuePerWeek = craft.revenueSepEur / 5 / (3_301_112 / 4) - 1;
    expect(Math.abs(revenuePerWeek)).toBeLessThan(0.001);
  });
});

describe("readCompare", () => {
  it("line-week holds and puts CRAFT at −2,1 %", () => {
    const reading = readCompare("line-week");
    expect(reading.verdict).toBe("holds");
    expect(pct(reading.rows.find((row) => row.line === "CRAFT")!.value)).toBe("−2,1 %");
    expect(pct(reading.headline.value)).toBe("−2,1 %");
    expect(reading.headline.line).toBe("CRAFT");
    expect(reading.rows).toHaveLength(8);
    expect(reading.stripTarget).toBe(1);
  });

  it("line-month misleads with the report's +26,0 % and the report's own MoM figures", () => {
    const reading = readCompare("line-month");
    expect(reading.verdict).toBe("misleads");
    expect(pct(reading.headline.value)).toBe("+26,0 %");
    expect(pct(reading.rows.find((row) => row.line === "CRAFT")!.value)).toBe("+22,4 %");
    expect(reading.stripTarget).toBe(0);
  });

  it("total-week misleads with +0,8 % and one row", () => {
    const reading = readCompare("total-week");
    expect(reading.verdict).toBe("misleads");
    expect(reading.rows).toHaveLength(1);
    expect(pct(reading.headline.value)).toBe("+0,8 %");
  });

  it("sorts rows highest first, and both bases share the same order", () => {
    const month = readCompare("line-month").rows.map((row) => row.line);
    const week = readCompare("line-week").rows.map((row) => row.line);
    expect(week).toEqual(["BEAM", "ECHO", "BREW", "AURA", "TOTAL", "NEST", "CRAFT", "PULSE"]);
    expect(month).toEqual(week);
  });
});

describe("readDefects", () => {
  it("count misleads: 23 / 19 / 18 / 11, the rest null", () => {
    const reading = readDefects("count");
    expect(reading.verdict).toBe("misleads");
    const values = Object.fromEntries(reading.rows.map((row) => [row.line, row.value]));
    expect(values).toEqual({ AURA: 18, CRAFT: 23, ECHO: null, NEST: 19, BREW: null, PULSE: 11, BEAM: null });
  });

  it("per1000 holds", () => {
    const reading = readDefects("per1000");
    expect(reading.verdict).toBe("holds");
    expect(dec(reading.rows.find((row) => row.line === "CRAFT")!.value)).toBe("2,51");
  });

  it("returns is absent everywhere", () => {
    const reading = readDefects("returns");
    expect(reading.verdict).toBe("absent");
    expect(reading.rows.every((row) => row.value === null && row.absent)).toBe(true);
  });

  it("keeps revenue order and always notes the ECHO escalation", () => {
    for (const id of ["count", "per1000", "returns"] as const) {
      const reading = readDefects(id);
      expect(reading.rows.map((row) => row.line)).toEqual(LINES.map((line) => line.id));
      expect(reading.rows.find((row) => row.line === "ECHO")!.note).toBe("echo-escalation");
      expect(reading.rows.filter((row) => row.note)).toHaveLength(1);
    }
  });
});

describe("readFlag", () => {
  it("chronic flags CRAFT and carries the evidence", () => {
    const reading = readFlag("chronic");
    expect(reading).toMatchObject({ flagged: ["CRAFT"], verdict: "holds", noise: [] });
    const evidence = reading.evidence!;
    expect(dec(evidence.rateAug)).toBe("3,21");
    expect(dec(evidence.rateSep)).toBe("2,51");
    expect(evidence.scrapShareAug).toBeCloseTo(0.123, 3);
    expect(evidence.scrapShareSep).toBeCloseTo(0.168, 3);
    expect(evidence.scrapEur).toBe(691_011);
    expect(evidence.scrapShareOfRevenue).toBeCloseTo(0.168, 3);
  });

  it("rising flags exactly AURA, NEST, PULSE with PULSE as noise", () => {
    expect(readFlag("rising")).toEqual({
      flagged: ["AURA", "NEST", "PULSE"],
      verdict: "misleads",
      noise: ["PULSE"],
    });
  });

  it("most-reports flags the right line for the wrong reason", () => {
    expect(readFlag("most-reports")).toMatchObject({ flagged: ["CRAFT"], verdict: "misleads" });
  });
});

describe("checkClaim", () => {
  const expected: Record<ClaimId, string> = {
    "craft-units": "match",
    "nest-ncr": "differs",
    "craft-revenue": "match",
    "craft-marketing": "nowhere",
  };

  it("returns the truth for all 4 × 3 predictions", () => {
    for (const [id, truth] of Object.entries(expected) as [ClaimId, string][]) {
      for (const said of TRUTHS) {
        const check = checkClaim(id, said);
        expect(check.truth).toBe(truth);
        expect(check.said).toBe(said);
        expect(check.same).toBe(said === truth);
      }
    }
    expect(checkClaim("nest-ncr", "match").sourceValue).toBe(19);
    expect(checkClaim("craft-marketing", "nowhere").sourceValue).toBeNull();
    expect(checkClaim("nest-ncr", "differs").more).toBe(15);
  });

  it("counts the checked cards", () => {
    expect(claimSummary({})).toEqual({ checked: 0, of: 4 });
    expect(claimSummary({ "nest-ncr": "match", "craft-units": "match" })).toEqual({ checked: 2, of: 4 });
  });
});

describe("assessSheet", () => {
  it("returns every option's fixed verdict when no cross-row rule applies", () => {
    for (const field of SHEET_FIELDS) {
      for (const option of optionIds(field)) {
        const sheet = { [field]: option } as Sheet;
        const row = assessSheet(sheet).rows.find((entry) => entry.field === field)!;
        const rule = (SHEET_OPTIONS[field] as Record<string, { verdict: string; vp?: true }>)[option as string];
        expect(row.verdict, `${field}.${String(option)}`).toBe(rule.verdict);
        expect(row.vp === true, `${field}.${String(option)} vp`).toBe(rule.vp === true);
        expect(row.against).toBeUndefined();
      }
    }
  });

  it("matches the spec's fixed table", () => {
    const table: [keyof Sheet, string, string][] = [
      ["decision", "rework", "holds"],
      ["decision", "marketing", "misleads"],
      ["number", "craft-mom", "misleads"],
      ["number", "rate-251", "holds"],
      ["number", "rev-412", "misleads"],
      ["number", "scrap-691", "holds"],
      ["number", "ncr-23", "misleads"],
      ["cost", "both-ways", "holds"],
      ["cost", "lost-revenue", "absent"],
      ["cost", "scrap-on-top", "misleads"],
      ["open", "weeks", "misleads"],
      ["open", "marketing", "holds"],
      ["open", "rate", "misleads"],
      ["counter", "price-margin", "absent"],
      ["counter", "count-fell", "misleads"],
      ["counter", "rate-fell", "holds"],
      ["trigger", "rate-only", "misleads"],
      ["trigger", "revenue", "misleads"],
      ["trigger", "rate-and-scrap", "holds"],
    ];
    for (const [field, option, verdict] of table) {
      const row = assessSheet({ [field]: option } as Sheet).rows.find((entry) => entry.field === field)!;
      expect(row.verdict, `${field}.${option}`).toBe(verdict);
    }
    expect(table).toHaveLength(SHEET_FIELDS.reduce((total, field) => total + optionIds(field).length, 0));
  });

  it("the strongest path holds 6 of 6", () => {
    const result = assessSheet({
      decision: "rework",
      number: "rate-251",
      cost: "both-ways",
      open: "marketing",
      counter: "rate-fell",
      trigger: "rate-and-scrap",
    });
    expect(result).toMatchObject({ holding: 6, open: 0, holds: true });
  });

  it("a number that argues for the other decision misleads, both ways", () => {
    const marketing = assessSheet({ decision: "marketing", number: "rate-251" });
    expect(marketing.rows[1]).toMatchObject({ verdict: "misleads", against: "marketing" });
    expect(assessSheet({ decision: "marketing", number: "scrap-691" }).rows[1]).toMatchObject({
      verdict: "misleads",
      against: "marketing",
    });
    const rework = assessSheet({ decision: "rework", number: "craft-mom" });
    expect(rework.rows[1]).toMatchObject({ verdict: "misleads", against: "rework" });
    expect(assessSheet({ decision: "rework", number: "rev-412" }).rows[1]).toMatchObject({
      verdict: "misleads",
      against: "rework",
    });
    const aligned = assessSheet({ decision: "marketing", number: "rev-412" });
    expect(aligned.rows[1]).toMatchObject({ verdict: "misleads" });
    expect(aligned.rows[1].against).toBeUndefined();
    // No side, no rule: 23 NCRs stays its own verdict with the VP's objection.
    expect(assessSheet({ decision: "marketing", number: "ncr-23" }).rows[1]).toMatchObject({
      verdict: "misleads",
      vp: true,
    });
    // Without a decision the rule does not apply.
    expect(assessSheet({ number: "rate-251" }).rows[1].verdict).toBe("holds");
  });

  it("the weakest path holds 0", () => {
    const result = assessSheet({
      decision: "marketing",
      number: "rev-412",
      cost: "lost-revenue",
      open: "weeks",
      counter: "price-margin",
      trigger: "revenue",
    });
    expect(result).toMatchObject({ holding: 0, open: 0, holds: false });
  });

  it("an empty sheet is six open rows", () => {
    expect(assessSheet({})).toMatchObject({ holding: 0, open: 6, holds: false });
  });

  it("the holding option is never the only one of its row", () => {
    for (const field of SHEET_FIELDS) {
      const verdicts = optionIds(field).map(
        (option) => (SHEET_OPTIONS[field] as Record<string, { verdict: string }>)[option as string].verdict,
      );
      expect(verdicts.filter((verdict) => verdict !== "holds").length, field).toBeGreaterThan(0);
      expect(verdicts.filter((verdict) => verdict === "holds").length, field).toBeGreaterThan(0);
    }
  });
});

describe("gutLine", () => {
  it("covers the four cases", () => {
    expect(gutLine(undefined, "rework", true)).toBeNull();
    expect(gutLine("marketing", undefined, false)).toBeNull();
    expect(gutLine("marketing", "rework", true)).toBe("turned");
    expect(gutLine("rework", "rework", true)).toBe("same-holds");
    expect(gutLine("rework", "rework", false)).toBe("same-weak");
  });
});

describe("reducer", () => {
  const deepFreeze = <T,>(value: T): T => {
    if (value && typeof value === "object") {
      Object.freeze(value);
      for (const inner of Object.values(value)) deepFreeze(inner);
    }
    return value;
  };

  it("is pure: frozen input, new objects", () => {
    const start = deepFreeze<DemoState>({ ...INITIAL_STATE, said: {}, sheet: {} });
    const a = reducer(start, { type: "compare", value: "line-week" });
    expect(a).not.toBe(start);
    expect(a.compare).toBe("line-week");
    expect(start.compare).toBeUndefined();

    const b = reducer(deepFreeze(a), { type: "say", claim: "nest-ncr", value: "match" });
    expect(b.said).toEqual({ "nest-ncr": "match" });
    expect(b.said).not.toBe(a.said);

    const c = reducer(deepFreeze(b), { type: "sheet", field: "number", value: "rate-251" });
    expect(c.sheet).toEqual({ number: "rate-251" });
    expect(b.sheet).toEqual({});

    const d = reducer(deepFreeze(c), { type: "say", claim: "nest-ncr", value: "differs" });
    expect(d.said).toEqual({ "nest-ncr": "differs" });
  });

  it("handles every action and resets", () => {
    let state = INITIAL_STATE;
    state = reducer(state, { type: "gut", value: "marketing" });
    state = reducer(state, { type: "defect", value: "per1000" });
    state = reducer(state, { type: "flag", value: "chronic" });
    expect(state).toMatchObject({ gut: "marketing", defect: "per1000", flag: "chronic" });
    expect(isPristine(state)).toBe(false);
    const reset = reducer(state, { type: "reset" });
    expect(reset).toEqual(INITIAL_STATE);
    expect(isPristine(reset)).toBe(true);
  });
});

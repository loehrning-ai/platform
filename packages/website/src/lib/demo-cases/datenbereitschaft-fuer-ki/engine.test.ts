import { describe, expect, it } from "vitest";
import { REQ_01, REQ_02, REQ_03, REQ_05, triageCard, GAPS } from "./cases";
import { DEMO_TEXT, askBackSentence } from "./copy";
import { DERIVED, ENDING_MRR, HEADCOUNT, NET_NEW_MRR, sumQ2, type TableId } from "./data";
import {
  allSolved,
  classifyDefinition,
  computeDefinition,
  contradiction,
  evaluateDefinition,
  evaluateTriage,
  initialState,
  missingBlanks,
  reduce,
  requestStatus,
  type DemoState,
} from "./engine";
import { formatValue, formatValueLong } from "./format";
import { layout, momentFor, seek, seekPath, type Shape } from "./layout";
import type { Definition, DefinitionRequest, Gap, Row, Value } from "./model";
import { liveText, ruleText, triageTexts } from "./text";

const SUMMARY: TableId = "analytics.mrr_summary_monthly";
const ACCOUNT: TableId = "analytics.account_mrr_monthly";
const REVENUE: TableId = "public.monthly_revenue";
const BILLING: TableId = "public.billing_events";
const LOGO: TableId = "analytics.logo_churn_by_segment_quarter";
const HISTORY: TableId = "public.acct_history";
const ATTRITION: TableId = "analytics.attrition_by_department_quarter";
const HC: TableId = "export_lane.hc_monthly";

/** Compact rows: "2026-04 334675", "Enterprise 4/40", "company 9.8%". */
function short(rows: readonly Row[]): string[] {
  return rows.map((row) => `${row.label} ${valueKey(row.value)}`);
}
function valueKey(value: Value): string {
  switch (value.unit) {
    case "eur":
      return String(value.amount);
    case "rate":
      return `${value.num}/${value.den}`;
    case "averagedRate":
      return `${value.pct}%`;
    case "count":
      return `${value.signed && value.n > 0 ? "+" : ""}${value.n} ${value.noun}`;
  }
}

function run(r: DefinitionRequest, d: Definition) {
  const receipt = evaluateDefinition(r, d, 1);
  return { rows: short(receipt.rows), verdict: receipt.verdict, rule: receipt.rule, note: receipt.note, reading: receipt.reading };
}

const LEVELS = ["2026-04 334675", "2026-05 344450", "2026-06 387015"];
const CHANGES = ["2026-04 -19960", "2026-05 9775", "2026-06 42565"];

describe("01 · G01 truth table", () => {
  const cases: [Definition, string[], string, string, string?][] = [
    [{ kind: "level", grain: "perMonth", period: "eachMonth", table: SUMMARY }, LEVELS, "correct", "g01Correct"],
    [{ kind: "level", grain: "perMonth", period: "eachMonth", table: ACCOUNT }, LEVELS, "correct", "g01Correct", "noteSmallestView"],
    [{ kind: "level", grain: "single", period: "sumMonths", table: SUMMARY }, ["Q2 1066140"], "wrong", "levelSummed"],
    [{ kind: "level", grain: "single", period: "sumMonths", table: ACCOUNT }, ["Q2 1066140"], "wrong", "levelSummed"],
    [{ kind: "level", grain: "single", period: "lastMonth", table: SUMMARY }, ["2026-06 387015"], "rightNumberWrongDef", "lastLevelOnly"],
    [{ kind: "level", grain: "single", period: "lastMonth", table: ACCOUNT }, ["2026-06 387015"], "rightNumberWrongDef", "lastLevelOnly"],
    [{ kind: "level", grain: "perMonth", period: "lastMonth", table: SUMMARY }, ["2026-06 387015"], "rightNumberWrongDef", "lastLevelOnly"],
    [{ kind: "level", grain: "perMonth", period: "lastMonth", table: ACCOUNT }, ["2026-06 387015"], "rightNumberWrongDef", "lastLevelOnly"],
    [{ kind: "level", grain: "perMonth", period: "eachMonth", table: REVENUE }, CHANGES, "wrong", "tableStoresChange"],
    [{ kind: "level", grain: "single", period: "sumMonths", table: REVENUE }, ["Q2 32380"], "wrong", "tableStoresChange"],
    [{ kind: "level", grain: "perMonth", period: "lastMonth", table: REVENUE }, ["2026-06 42565"], "wrong", "tableStoresChange"],
    [{ kind: "level", grain: "single", period: "lastMonth", table: REVENUE }, ["2026-06 42565"], "wrong", "tableStoresChange"],
  ];
  for (const table of [SUMMARY, ACCOUNT, REVENUE]) {
    cases.push([{ kind: "change", grain: "perMonth", period: "eachMonth", table }, CHANGES, "wrong", "changeForLevel"]);
    cases.push([{ kind: "change", grain: "single", period: "sumMonths", table }, ["Q2 32380"], "wrong", "changeForLevel"]);
    cases.push([{ kind: "change", grain: "perMonth", period: "lastMonth", table }, ["2026-06 42565"], "wrong", "changeForLevel"]);
    cases.push([{ kind: "change", grain: "single", period: "lastMonth", table }, ["2026-06 42565"], "wrong", "changeForLevel"]);
  }
  it.each(cases)("%o → %o %s %s", (definition, rows, verdict, rule, note) => {
    const result = run(REQ_01, definition);
    expect(result.rows).toEqual(rows);
    expect(result.verdict).toBe(verdict);
    expect(result.rule).toBe(rule);
    expect(result.note).toBe(note);
  });

  it("marks the recorded export answer and reads the figure states", () => {
    const recorded = evaluateDefinition(REQ_01, { kind: "level", grain: "perMonth", period: "eachMonth", table: REVENUE }, 1);
    expect(recorded.origin).toBe("recorded");
    expect(recorded.reading).toBe("changes");
    expect(run(REQ_01, { kind: "level", grain: "single", period: "sumMonths", table: SUMMARY }).reading).toBe("stackLevels");
    expect(run(REQ_01, REQ_01.canonical).reading).toBe("levels");
    expect(run(REQ_01, { kind: "change", grain: "single", period: "sumMonths", table: SUMMARY }).reading).toBe("changeSum");
  });

  it("calls contradictory blanks open, with the grain as the blank to change", () => {
    for (const definition of [
      { kind: "level", grain: "perMonth", period: "sumMonths", table: SUMMARY },
      { kind: "level", grain: "single", period: "eachMonth", table: SUMMARY },
    ] as const) {
      const receipt = evaluateDefinition(REQ_01, definition, 1);
      expect(receipt.verdict).toBe("open");
      expect(receipt.rule).toBe("contradiction");
      expect(receipt.changeBlank).toBe("grain");
      expect(receipt.rows).toEqual([]);
    }
    expect(ruleText(evaluateDefinition(REQ_01, { kind: "level", grain: "perMonth", period: "sumMonths", table: SUMMARY }, 1), REQ_01, DEMO_TEXT.de)).toBe(
      "Passt nicht zusammen: „eine Zeile pro Monat“ und „Monate addieren“ schließen sich aus.",
    );
  });
});

describe("02 · G02 truth table", () => {
  const cases: [Definition, string[], string, string][] = [
    [{ kind: "change", period: "sumMonths", table: SUMMARY }, ["Q2 32380"], "correct", "g02CorrectSum"],
    [{ kind: "level", period: "endMinusStart", table: SUMMARY }, ["Q2 32380"], "correct", "g02CorrectBathtub"],
    [{ kind: "change", period: "endMinusStart", table: SUMMARY }, ["Q2 -17595"], "wrong", "changeDiff"],
    [{ kind: "change", period: "lastMonth", table: SUMMARY }, ["2026-06 42565"], "wrong", "changeLastOnly"],
    [{ kind: "level", period: "lastMonth", table: SUMMARY }, ["2026-06 387015"], "wrong", "levelForChange"],
    [{ kind: "level", period: "sumMonths", table: SUMMARY }, ["Q2 1066140"], "wrong", "levelSummed"],
  ];
  for (const kind of ["level", "change"] as const) {
    cases.push([{ kind, period: "sumMonths", table: REVENUE }, ["Q2 32380"], "rightNumberWrongDef", "exportLucky"]);
    cases.push([{ kind, period: "endMinusStart", table: REVENUE }, ["Q2 -17595"], "wrong", "changeDiff"]);
    cases.push([{ kind, period: "lastMonth", table: REVENUE }, ["2026-06 42565"], "wrong", "changeLastOnly"]);
    cases.push([{ kind, period: "sumMonths", table: BILLING }, ["Q2 27055"], "wrong", "billingDuplicates"]);
    cases.push([{ kind, period: "endMinusStart", table: BILLING }, [], "wrong", "billingDuplicates"]);
    cases.push([{ kind, period: "lastMonth", table: BILLING }, [], "wrong", "billingDuplicates"]);
  }
  it.each(cases)("%o → %o %s %s", (definition, rows, verdict, rule) => {
    const result = run(REQ_02, definition);
    expect(result.rows).toEqual(rows);
    expect(result.verdict).toBe(verdict);
    expect(result.rule).toBe(rule);
  });

  it("marks −17.595\u00a0€ as the recorded answer", () => {
    expect(evaluateDefinition(REQ_02, { kind: "change", period: "endMinusStart", table: REVENUE }, 1).origin).toBe("recorded");
  });
});

describe("03 · G03 truth table", () => {
  const per = (num: number, den: number) => ["Enterprise", "Mid-Market", "SMB"].map((segment) => `${segment} ${num}/${den}`);
  const cases: [Definition, string[], string, string][] = [
    [{ kind: "rate", grain: "perSegment", table: LOGO, base: "startOfQuarter" }, per(4, 40), "correct", "g03Correct"],
    [{ kind: "rate", grain: "perSegment", table: LOGO, base: "startPlusJoiners" }, per(4, 48), "wrong", "baseJoiners"],
    [{ kind: "rate", grain: "perSegment", table: LOGO, base: "endOfQuarter" }, per(4, 44), "wrong", "baseEnd"],
    [{ kind: "rate", grain: "single", table: LOGO, base: "startOfQuarter" }, ["allSegments 12/120"], "rightNumberWrongDef", "singleForSegments"],
    [{ kind: "rate", grain: "single", table: LOGO, base: "startPlusJoiners" }, ["allSegments 12/144"], "wrong", "baseJoiners"],
    [{ kind: "rate", grain: "single", table: LOGO, base: "endOfQuarter" }, ["allSegments 12/132"], "wrong", "baseEnd"],
  ];
  for (const base of ["startOfQuarter", "startPlusJoiners", "endOfQuarter"] as const) {
    cases.push([{ kind: "rate", grain: "perSegment", table: HISTORY, base }, per(0, 0), "wrong", "statusCodes"]);
    cases.push([{ kind: "rate", grain: "single", table: HISTORY, base }, ["allSegments 0/0"], "wrong", "statusCodes"]);
    for (const table of [LOGO, HISTORY]) {
      cases.push([{ kind: "level", grain: "perSegment", table, base }, ["Enterprise", "Mid-Market", "SMB"].map((s) => `${s} 40 accounts`), "wrong", "notARate"]);
      cases.push([{ kind: "level", grain: "single", table, base }, ["allSegments 120 accounts"], "wrong", "notARate"]);
      cases.push([{ kind: "change", grain: "perSegment", table, base }, ["Enterprise", "Mid-Market", "SMB"].map((s) => `${s} +4 accounts`), "wrong", "notARate"]);
      cases.push([{ kind: "change", grain: "single", table, base }, ["allSegments +12 accounts"], "wrong", "notARate"]);
    }
  }
  it.each(cases)("%o → %o %s %s", (definition, rows, verdict, rule) => {
    const result = run(REQ_03, definition);
    expect(result.rows).toEqual(rows);
    expect(result.verdict).toBe(verdict);
    expect(result.rule).toBe(rule);
  });

  it("fills the base rules with the computed rate", () => {
    const joiners = evaluateDefinition(REQ_03, { kind: "rate", grain: "perSegment", table: LOGO, base: "startPlusJoiners" }, 1);
    expect(ruleText(joiners, REQ_03, DEMO_TEXT.de)).toContain("4 von 48 = 8,33\u00a0%");
    const end = evaluateDefinition(REQ_03, { kind: "rate", grain: "single", table: LOGO, base: "endOfQuarter" }, 1);
    expect(ruleText(end, REQ_03, DEMO_TEXT.en)).toContain("12 of 132 = 9.1%");
    expect(evaluateDefinition(REQ_03, { kind: "rate", grain: "single", table: HISTORY, base: "startOfQuarter" }, 1).origin).toBe("recorded");
  });
});

describe("05 · HC01 truth table", () => {
  const cases: [Definition, string[], string, string][] = [
    [{ kind: "rate", table: ATTRITION, combine: "pool", base: "startOfQuarter" }, ["company 19/200"], "correct", "hcCorrect"],
    [{ kind: "rate", table: ATTRITION, combine: "pool", base: "averageHeadcount" }, ["company 19/203.5"], "wrong", "hcBaseUnwritten"],
  ];
  for (const base of ["startOfQuarter", "averageHeadcount"] as const) {
    cases.push([{ kind: "rate", table: ATTRITION, combine: "averageRates", base }, ["company 9.8%"], "wrong", "hcDeptAveraged"]);
    cases.push([{ kind: "rate", table: HC, combine: "averageRates", base }, ["company 3.12%"], "wrong", "hcMonthlyAveraged"]);
    cases.push([{ kind: "rate", table: HC, combine: "pool", base }, [], "wrong", "hcExportNoCounts"]);
    for (const table of [ATTRITION, HC]) {
      for (const combine of ["pool", "averageRates"] as const) {
        cases.push([{ kind: "level", table, combine, base }, ["company 206 people"], "wrong", "notARate"]);
        cases.push([{ kind: "change", table, combine, base }, ["company +6 people"], "wrong", "notARate"]);
      }
    }
  }
  it.each(cases)("%o → %o %s %s", (definition, rows, verdict, rule) => {
    const result = run(REQ_05, definition);
    expect(result.rows).toEqual(rows);
    expect(result.verdict).toBe(verdict);
    expect(result.rule).toBe(rule);
  });

  it("matches the spec example of section 5.6", () => {
    const receipt = evaluateDefinition(
      REQ_05,
      { kind: "rate", table: ATTRITION, combine: "averageRates", base: "startOfQuarter" },
      2,
    );
    expect(receipt).toMatchObject({
      verdict: "wrong",
      rule: "hcDeptAveraged",
      rows: [{ label: "company", value: { unit: "averagedRate", pct: 9.8 } }],
      truth: [{ label: "company", value: { unit: "rate", num: 19, den: 200 } }],
      reading: "deptAveraged",
      changeBlank: "combine",
      params: {},
    });
    expect(ruleText(receipt, REQ_05, DEMO_TEXT.de)).toMatch(
      /^Vier Abteilungsquoten gemittelt: 9,8\u00a0%\. So zählt die Abteilung mit 20 Leuten so viel wie die mit 80\./,
    );
  });

  it("labels the kit's counter-examples as plausible, not recorded", () => {
    expect(evaluateDefinition(REQ_05, { kind: "rate", table: HC, combine: "averageRates", base: "startOfQuarter" }, 1).origin).toBe("plausible");
    expect(evaluateDefinition(REQ_05, REQ_05.canonical, 1).origin).toBeUndefined();
  });
});

describe("order of evaluation", () => {
  it("reports open blanks first, in panel order, and names the first one", () => {
    expect(missingBlanks(REQ_01, {})).toEqual(["kind", "grain", "period", "table"]);
    expect(missingBlanks(REQ_05, { table: ATTRITION })).toEqual(["kind", "combine", "base"]);
    const receipt = evaluateDefinition(REQ_01, { kind: "level", grain: "perMonth", period: "eachMonth" }, 1);
    expect(receipt.verdict).toBe("open");
    expect(receipt.changeBlank).toBe("table");
    expect(ruleText(receipt, REQ_01, DEMO_TEXT.de)).toBe("Noch offen: Welche Tabelle?");
    expect(computeDefinition(REQ_01, {}).rows).toEqual([]);
  });

  it("checks kind → table → period/combine → base → grain", () => {
    // kind before table
    expect(classifyDefinition(REQ_01, { kind: "change", grain: "perMonth", period: "eachMonth", table: REVENUE }).blank).toBe("kind");
    // table before period
    expect(classifyDefinition(REQ_01, { kind: "level", grain: "single", period: "sumMonths", table: REVENUE }).blank).toBe("table");
    expect(classifyDefinition(REQ_02, { kind: "change", period: "endMinusStart", table: REVENUE }).blank).toBe("table");
    // period
    expect(classifyDefinition(REQ_02, { kind: "change", period: "endMinusStart", table: SUMMARY }).blank).toBe("period");
    // table before combine
    expect(classifyDefinition(REQ_05, { kind: "rate", table: HC, combine: "averageRates", base: "averageHeadcount" }).blank).toBe("table");
    // combine before base
    expect(classifyDefinition(REQ_05, { kind: "rate", table: ATTRITION, combine: "averageRates", base: "averageHeadcount" }).blank).toBe("combine");
    // base before grain
    expect(classifyDefinition(REQ_03, { kind: "rate", grain: "single", table: LOGO, base: "startPlusJoiners" }).blank).toBe("base");
    // grain last
    expect(classifyDefinition(REQ_03, { kind: "rate", grain: "single", table: LOGO, base: "startOfQuarter" }).blank).toBe("grain");
  });

  it("sets changeBlank only from attempt 2, never on a correct run", () => {
    const wrong = { kind: "level", grain: "single", period: "sumMonths", table: SUMMARY } as const;
    expect(evaluateDefinition(REQ_01, wrong, 1).changeBlank).toBeUndefined();
    expect(evaluateDefinition(REQ_01, wrong, 2).changeBlank).toBe("period");
    expect(evaluateDefinition(REQ_01, REQ_01.canonical, 3).changeBlank).toBeUndefined();
  });

  it("detects contradictions only for perMonth + sumMonths and single + eachMonth", () => {
    expect(contradiction({ grain: "perMonth", period: "sumMonths" })).toEqual(["grain", "period"]);
    expect(contradiction({ grain: "single", period: "eachMonth" })).toEqual(["grain", "period"]);
    expect(contradiction({ grain: "perMonth", period: "lastMonth" })).toBeUndefined();
    expect(contradiction({ grain: "single", period: "sumMonths" })).toBeUndefined();
  });
});

describe("invariants of the kit data", () => {
  it("keeps the bathtub identity", () => {
    expect(sumQ2(NET_NEW_MRR)).toBe(ENDING_MRR["2026-06"] - ENDING_MRR["2026-03"]);
    expect(ENDING_MRR["2026-04"]).toBe(ENDING_MRR["2026-03"] + NET_NEW_MRR["2026-04"]);
    expect(ENDING_MRR["2026-05"]).toBe(ENDING_MRR["2026-04"] + NET_NEW_MRR["2026-05"]);
    expect(ENDING_MRR["2026-06"]).toBe(ENDING_MRR["2026-05"] + NET_NEW_MRR["2026-06"]);
    expect(sumQ2(ENDING_MRR)).toBe(1_066_140);
  });

  it("keeps the headcount identity and the department figures", () => {
    expect(HEADCOUNT.startingHeadcount + HEADCOUNT.hiresQ2 - HEADCOUNT.leaversQ2).toBe(HEADCOUNT.level["2026-06"]);
    expect(HEADCOUNT.departments.reduce((sum, d) => sum + d.start, 0)).toBe(200);
    expect(HEADCOUNT.departments.reduce((sum, d) => sum + d.leavers, 0)).toBe(19);
    for (const department of HEADCOUNT.departments) {
      expect(Math.round((1000 * department.leavers) / department.start) / 10).toBe(department.ratePct);
    }
    const average = HEADCOUNT.departments.reduce((sum, d) => sum + d.ratePct, 0) / 4;
    expect(Math.round(average * 10) / 10).toBe(HEADCOUNT.departmentRatesAveragedPct);
    const monthly = Object.values(HEADCOUNT.monthlyExportRatesPct).reduce((sum, rate) => sum + rate, 0) / 3;
    expect(Math.round(monthly * 100) / 100).toBe(HEADCOUNT.monthlyRatesAveragedPct);
    expect((200 + 206 + 202 + 206) / 4).toBe(HEADCOUNT.averageHeadcount);
  });

  it("pins the derived values: 4/44, 12/144, 12/132 and more than nine times", () => {
    expect(formatValue({ unit: "rate", num: 4, den: 44 }, "de")).toBe("9,1\u00a0%");
    expect(formatValue({ unit: "rate", num: 12, den: 144, digits: 2 }, "de")).toBe("8,33\u00a0%");
    expect(formatValue({ unit: "rate", num: 12, den: 132 }, "de")).toBe("9,1\u00a0%");
    expect(DERIVED.levelOverChangeJune).toBeGreaterThan(9);
    expect(DERIVED.levelOverChangeJune).toBeLessThan(10);
  });
});

describe("triage", () => {
  it("grades G01 and R01 on the behaviour alone", () => {
    expect(evaluateTriage(triageCard("G01"), { behavior: "answer" }, 1)).toMatchObject({ verdict: "correct", rules: ["tG01Correct"] });
    for (const behavior of ["answerWarn", "askBack", "refuse"] as const) {
      expect(evaluateTriage(triageCard("G01"), { behavior }, 1)).toMatchObject({ verdict: "wrong", rules: ["tG01Wrong"] });
    }
    expect(evaluateTriage(triageCard("R01"), { behavior: "refuse" }, 1).rules).toEqual(["tR01Correct"]);
    expect(evaluateTriage(triageCard("R01"), { behavior: "answer" }, 1).rules).toEqual(["tR01Wrong"]);
  });

  it("is open until a behaviour is chosen", () => {
    const receipt = evaluateTriage(triageCard("C01"), {}, 1);
    expect(receipt.verdict).toBe("open");
    expect(triageTexts(receipt, DEMO_TEXT.de)).toEqual(["Noch offen: Was soll passieren?"]);
  });

  it("shows only the behaviour why while the behaviour is wrong", () => {
    const receipt = evaluateTriage(triageCard("C01"), { behavior: "answer", gaps: ["table"] }, 1);
    expect(receipt.rules).toEqual(["tC01Wrong"]);
    expect(receipt.followUp).toBeUndefined();
  });

  it("grades C01 gaps: kind and period, never table, grain either way", () => {
    const right: Gap[][] = [["kind", "period"], ["kind", "grain", "period"]];
    const wrong: Gap[][] = [[], ["kind"], ["period"], ["kind", "period", "table"], ["table"], ["grain"]];
    for (const gaps of right) {
      expect(evaluateTriage(triageCard("C01"), { behavior: "askBack", gaps }, 1).rules).toEqual(["tC01Correct"]);
    }
    for (const gaps of wrong) {
      expect(evaluateTriage(triageCard("C01"), { behavior: "askBack", gaps }, 1)).toMatchObject({
        verdict: "wrong",
        behavior: "right",
        followUp: "wrong",
        rules: ["tC01Gaps"],
      });
    }
  });

  it("grades R02: refuse plus the PostgreSQL role", () => {
    expect(evaluateTriage(triageCard("R02"), { behavior: "refuse", lock: "postgresRole" }, 1).rules).toEqual(["tR02Correct"]);
    expect(evaluateTriage(triageCard("R02"), { behavior: "answer", lock: "postgresRole" }, 1).rules).toEqual(["tR02Wrong"]);
    expect(evaluateTriage(triageCard("R02"), { behavior: "refuse" }, 1).verdict).toBe("open");
    const guard = evaluateTriage(triageCard("R02"), { behavior: "refuse", lock: "sqlGuard" }, 1);
    expect(guard.rules).toEqual(["tR02Lock"]);
    expect(triageTexts(guard, DEMO_TEXT.de)[0]).toBe(
      "Read-only SQL guard prüft SQL-Text mit Mustern und läuft nur in diesem einen Werkzeug; ein anderer Client mit demselben Login umgeht ihn. Ein erzwungener Lesezugriff kommt daran vorbei. Nur die PostgreSQL role setzt die Grenze: permission denied, SQLSTATE 42501.",
    );
  });

  it("grades F01 ticks: the four facts, no invented expiry, both lines may show", () => {
    const exact = ["loadedAt", "age", "warnAfter", "definition"] as const;
    expect(evaluateTriage(triageCard("F01"), { behavior: "answerWarn", ticks: exact }, 1).rules).toEqual(["tF01Correct"]);
    const both = evaluateTriage(triageCard("F01"), { behavior: "answerWarn", ticks: ["loadedAt", "age", "expiry48"] }, 1);
    expect(both.rules).toEqual(["tF01Missing", "tF01Invented"]);
    expect(triageTexts(both, DEMO_TEXT.de)).toEqual([
      "Es fehlt: Warnschwelle und Definition mit Version.",
      "Nicht hineinschreiben: Ablaufgrenze. Eine Ablaufgrenze hat niemand festgelegt, und das Alter zählt ab der Uhr der Frage.",
    ]);
    expect(evaluateTriage(triageCard("F01"), { behavior: "answerWarn", ticks: [...exact, "ageFromToday"] }, 1).rules).toEqual([
      "tF01Invented",
    ]);
    expect(evaluateTriage(triageCard("F01"), { behavior: "answer", ticks: exact }, 1).rules).toEqual(["tF01Wrong"]);
  });
});

describe("askBackSentence", () => {
  const subsets: Gap[][] = [];
  for (let mask = 0; mask < 16; mask += 1) subsets.push(GAPS.filter((_, index) => mask & (1 << index)));

  it.each(subsets)("builds a sentence for %o in both locales", (...gaps) => {
    for (const locale of ["de", "en"] as const) {
      const sentence = askBackSentence(new Set(gaps), DEMO_TEXT[locale]);
      expect(sentence.length).toBeGreaterThan(0);
      expect(sentence).not.toMatch(/[–—]/);
      if (gaps.length === 0) expect(sentence).toBe(locale === "de" ? "Kreuz an, was offen ist." : "Tick what is open.");
      else expect(sentence.endsWith("?")).toBe(true);
    }
  });

  it("matches the spec rows", () => {
    expect(askBackSentence(new Set<Gap>(["kind", "period"]), DEMO_TEXT.de)).toBe(
      "Meinst du den Endbestand, Net New MRR oder eine einzelne Monatsbewegung? Und für welchen Zeitraum?",
    );
    expect(askBackSentence(new Set<Gap>(["kind", "period"]), DEMO_TEXT.en)).toBe(
      "Do you mean ending MRR, net new MRR or one monthly movement? And for which period?",
    );
    expect(askBackSentence(new Set<Gap>(["period"]), DEMO_TEXT.de)).toBe("Für welchen Zeitraum?");
    expect(askBackSentence(new Set<Gap>(["kind"]), DEMO_TEXT.de)).toBe(
      "Meinst du den Endbestand, Net New MRR oder eine einzelne Monatsbewegung?",
    );
    expect(askBackSentence(new Set<Gap>(["kind", "period", "table"]), DEMO_TEXT.de)).toMatch(/Und aus welcher Tabelle\?$/);
  });
});

describe("formatValue", () => {
  it("formats DE with the minus sign U+2212", () => {
    expect(formatValue({ unit: "eur", amount: -19_960 }, "de")).toBe("−19.960\u00a0€");
    expect(formatValue({ unit: "eur", amount: 1_066_140 }, "de")).toBe("1.066.140\u00a0€");
    expect(formatValue({ unit: "rate", num: 4, den: 40 }, "de")).toBe("10,0\u00a0%");
    expect(formatValue({ unit: "rate", num: 19, den: 203.5, digits: 2 }, "de")).toBe("9,34\u00a0%");
    expect(formatValue({ unit: "rate", num: 0, den: 0 }, "de")).toBe("keine Quote");
    expect(formatValue({ unit: "count", n: 4, signed: true, noun: "accounts" }, "de")).toBe("+4 Konten");
    expect(formatValueLong({ unit: "rate", num: 19, den: 203.5, digits: 2 }, "de")).toBe("19 von 203,5 = 9,34\u00a0%");
    expect(formatValueLong({ unit: "rate", num: 0, den: 0 }, "de")).toBe("0 von 0, keine Quote");
  });

  it("formats EN", () => {
    expect(formatValue({ unit: "eur", amount: -19_960 }, "en")).toBe("−€19,960");
    expect(formatValue({ unit: "eur", amount: 9_775 }, "en")).toBe("€9,775");
    expect(formatValue({ unit: "rate", num: 4, den: 40 }, "en")).toBe("10.0%");
    expect(formatValue({ unit: "rate", num: 0, den: 0 }, "en")).toBe("no rate");
    expect(formatValue({ unit: "averagedRate", pct: 3.12, digits: 2 }, "en")).toBe("3.12%");
    expect(formatValueLong({ unit: "rate", num: 4, den: 48, digits: 2 }, "en")).toBe("4 of 48 = 8.33%");
  });
});

describe("seek and layout", () => {
  const a: Shape[] = [{ id: "x", x: 0, y: 10, w: 10, h: 20, solid: false, tone: "level" }];
  const b: Shape[] = [{ id: "x", x: 100, y: 0, w: 20, h: 40, solid: true, tone: "level" }];

  it("returns from at 0, to at 1, and clamps", () => {
    expect(seek(a, b, 0)).toEqual(a);
    expect(seek(a, b, 1)).toEqual(b);
    expect(seek(a, b, -3)).toEqual(a);
    expect(seek(a, b, 7)).toEqual(b);
    expect(seek(a, b, Number.NaN)).toEqual(b);
    const mid = seek(a, b, 0.5)[0];
    expect(mid.x).toBeGreaterThan(0);
    expect(mid.x).toBeLessThan(100);
  });

  it("grows new ids from h = 0 and drops removed ids at 1", () => {
    const grown = seek([], b, 0)[0];
    expect(grown.h).toBe(0);
    expect(grown.y).toBe(40);
    expect(seek(a, [], 1)).toEqual([]);
    expect(seek(a, [], 0.5)[0].h).toBeLessThan(20);
  });

  it("stacks the tower above the frame and slides the changes into 32.380", () => {
    const tower = layout("bathtub", "stackLevels").shapes.filter((shape) => shape.x === 268 && shape.tone === "level");
    expect(tower).toHaveLength(3);
    expect(Math.min(...tower.map((shape) => shape.y))).toBeLessThan(0);
    const sum = layout("bathtub", "changeSum").labels.find((label) => label.id === "v-sum");
    expect(sum?.text).toEqual({ kind: "eur", amount: 32_380 });
  });

  it("marks the tower as 2,75 times June", () => {
    const ratio = layout("bathtub", "stackLevels").labels.find((label) => label.id === "v-ratio");
    expect(ratio?.text.kind).toBe("times");
    expect(ratio?.text.kind === "times" ? ratio.text.factor : 0).toBeCloseTo(2.75, 2);
  });

  it("nets the three changes into one 32.380 bar in column five, through a waterfall", () => {
    const frame = layout("bathtub", "changeSum");
    const q2 = (shapes: readonly Shape[]) => shapes.filter((shape) => /^C-2026-0[456]$/.test(shape.id));
    const final = q2(frame.shapes);
    expect(final).toHaveLength(3);
    for (const shape of final) {
      expect(shape).toMatchObject({ x: 268, w: 40, solid: true });
      expect(shape.h).toBeCloseTo(32_380 * (40 / 60_160));
      expect(shape.y + shape.h).toBeCloseTo(262);
    }
    const steps = q2(frame.via ?? []);
    expect(steps.map((shape) => shape.x)).toEqual([268, 268, 268]);
    expect(new Set(steps.map((shape) => shape.y)).size).toBe(3);
    // The motion passes through the waterfall and ends on the single bar.
    const atSplit = seekPath(layout("bathtub", "none").shapes, frame.via, frame.shapes, 0.6);
    expect(q2(atSplit).map((shape) => Math.round(shape.y))).toEqual(steps.map((shape) => Math.round(shape.y)));
    expect(seekPath(layout("bathtub", "none").shapes, frame.via, frame.shapes, 1)).toEqual(frame.shapes);
  });

  it("brackets the step from the top of March to the top of June with dashed guides", () => {
    const shapes = layout("bathtub", "endMinusStart").shapes;
    const level = (month: string) => shapes.find((shape) => shape.id === `L-${month}`)!;
    const bracket = shapes.find((shape) => shape.id === "bracket")!;
    expect(bracket.tone).toBe("bracket");
    expect(bracket.y).toBeCloseTo(level("2026-06").y);
    expect(bracket.y + bracket.h).toBeCloseTo(level("2026-03").y);
    const guides = shapes.filter((shape) => shape.tone === "guide");
    expect(guides.map((shape) => shape.y)).toEqual([level("2026-03").y, level("2026-06").y]);
    for (const guide of guides) expect(guide.x + guide.w).toBeCloseTo(bracket.x + bracket.w);
  });

  it("moves a head count that does not fit its column to a row under the names", () => {
    for (const reading of ["pooled", "averageBase", "deptAveraged", "none"] as const) {
      const { shapes, labels } = layout("widths", reading);
      for (const label of labels.filter((candidate) => candidate.id.startsWith("p-"))) {
        const column = shapes.find((shape) => shape.id === label.attach)!;
        const width = String(label.text.kind === "count" ? label.text.n : "").length * 8 + 4;
        expect(label.position, `${reading} ${label.id}`).toBe(width <= column.w ? "inside" : "belowLow");
        if (label.position === "belowLow") expect(label.onSolid).toBeFalsy();
      }
    }
  });

  it("frames 40, 48 or 44 strips and closes to nothing for 0 of 0", () => {
    const frameWidth = (reading: "base:startOfQuarter" | "base:startPlusJoiners" | "base:endOfQuarter" | "zeroBase") =>
      layout("baseFrame", reading).shapes.find((shape) => shape.id === "frame-SMB")?.w ?? -1;
    expect(frameWidth("base:startPlusJoiners")).toBeGreaterThan(frameWidth("base:endOfQuarter"));
    expect(frameWidth("base:endOfQuarter")).toBeGreaterThan(frameWidth("base:startOfQuarter"));
    expect(frameWidth("zeroBase")).toBe(0);
  });

  it("switches the department widths between people and equal", () => {
    const pooled = layout("widths", "pooled").shapes.filter((shape) => shape.tone === "column");
    const averaged = layout("widths", "deptAveraged").shapes.filter((shape) => shape.tone === "column");
    expect(pooled[0].w / pooled[3].w).toBeCloseTo(4);
    expect(averaged[0].w).toBeCloseTo(averaged[3].w);
    const line = (reading: "pooled" | "deptAveraged") => layout("widths", reading).shapes.find((shape) => shape.id === "line")!.y;
    expect(line("deptAveraged")).toBeLessThan(line("pooled"));
  });

  it("plays only the four listed moments", () => {
    expect(momentFor("none", "stackLevels")?.id).toBe("M1");
    expect(momentFor("levels", "changeSum")?.id).toBe("M2");
    expect(momentFor("none", "endMinusStart")?.id).toBe("M2");
    expect(momentFor("base:startOfQuarter", "base:startPlusJoiners")?.id).toBe("M3");
    expect(momentFor("pooled", "deptAveraged")?.id).toBe("M4");
    expect(momentFor("deptAveraged", "pooled")?.id).toBe("M4");
    expect(momentFor("none", "pooled")).toBeUndefined();
    expect(momentFor("none", "levels")).toBeUndefined();
    expect(momentFor("levels", "levels")).toBeUndefined();
  });
});

describe("reduce", () => {
  function freeze<T>(value: T): T {
    if (value && typeof value === "object") {
      Object.freeze(value);
      for (const child of Object.values(value)) freeze(child);
    }
    return value;
  }

  function choose(state: DemoState, request: "01" | "02" | "03" | "05", definition: Definition): DemoState {
    return Object.entries(definition).reduce(
      (next, [blank, value]) => reduce(next, { type: "choose", request, blank: blank as never, value: value as never }),
      state,
    );
  }

  it("marks the receipt stale on any change after a run and never mutates", () => {
    const start = freeze(initialState());
    const chosen = freeze(choose(start, "01", { kind: "level", grain: "single", period: "sumMonths", table: SUMMARY }));
    expect(start.defs["01"].definition).toEqual({});
    const checked = freeze(reduce(chosen, { type: "check", request: "01" }));
    expect(checked.defs["01"].receipt?.rule).toBe("levelSummed");
    expect(checked.defs["01"].stale).toBe(false);
    const changed = reduce(checked, { type: "choose", request: "01", blank: "period", value: "lastMonth" });
    expect(changed.defs["01"].stale).toBe(true);
    expect(changed.defs["01"].receipt?.rule).toBe("levelSummed");
    const same = reduce(checked, { type: "choose", request: "01", blank: "period", value: "sumMonths" });
    expect(same.defs["01"].stale).toBe(false);
  });

  it("counts runs, keeps solved, and reports the rail states", () => {
    let state = initialState();
    expect(requestStatus(state, "01")).toBe("open");
    state = reduce(state, { type: "check", request: "01" });
    expect(requestStatus(state, "01")).toBe("tried");
    state = choose(state, "01", REQ_01.canonical);
    state = reduce(state, { type: "check", request: "01" });
    expect(state.defs["01"].attempt).toBe(2);
    expect(requestStatus(state, "01")).toBe("solved");
    state = reduce(state, { type: "choose", request: "01", blank: "table", value: REVENUE });
    expect(requestStatus(state, "01")).toBe("solved");
  });

  it("solves request 04 only when all five cards are solved, and the demo when all five requests are", () => {
    let state = initialState();
    for (const [request, def] of [["01", REQ_01], ["02", REQ_02], ["03", REQ_03], ["05", REQ_05]] as const) {
      state = choose(state, request, def.canonical);
      state = reduce(state, { type: "check", request });
    }
    expect(allSolved(state)).toBe(false);
    state = reduce(state, { type: "chooseBehavior", card: "G01", value: "answer" });
    state = reduce(state, { type: "checkCard", card: "G01" });
    expect(requestStatus(state, "04")).toBe("tried");
    state = reduce(state, { type: "chooseBehavior", card: "C01", value: "askBack" });
    state = reduce(state, { type: "toggleGap", card: "C01", value: "period" });
    state = reduce(state, { type: "toggleGap", card: "C01", value: "kind" });
    expect(state.cards.C01.choice.gaps).toEqual(["kind", "period"]);
    state = reduce(state, { type: "chooseBehavior", card: "R01", value: "refuse" });
    state = reduce(state, { type: "chooseBehavior", card: "R02", value: "refuse" });
    state = reduce(state, { type: "chooseLock", card: "R02", value: "postgresRole" });
    state = reduce(state, { type: "chooseBehavior", card: "F01", value: "answerWarn" });
    for (const tick of ["loadedAt", "age", "warnAfter", "definition"] as const) {
      state = reduce(state, { type: "toggleTick", card: "F01", value: tick });
    }
    for (const card of ["C01", "R01", "R02", "F01"] as const) state = reduce(state, { type: "checkCard", card });
    expect(requestStatus(state, "04")).toBe("solved");
    expect(allSolved(state)).toBe(true);
  });

  it("writes the live line", () => {
    const receipt = evaluateDefinition(REQ_01, { kind: "level", grain: "single", period: "sumMonths", table: SUMMARY }, 2);
    expect(liveText(receipt, REQ_01, DEMO_TEXT.de)).toBe("Anfrage 01, Lauf 2: Stimmt nicht. Deine Definition ergibt Q2 1.066.140\u00a0€.");
    expect(liveText(evaluateDefinition(REQ_01, REQ_01.canonical, 3), REQ_01, DEMO_TEXT.en)).toBe(
      "Request 01, run 3: Matches. Your definition gives Apr €334,675 · May €344,450 · Jun €387,015.",
    );
  });
});

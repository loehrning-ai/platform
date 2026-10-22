/**
 * The pure rules of "Die Zahl, die trägt": what every choice shows and how
 * it is judged. No DOM, no locale: the component formats and words it.
 *
 * Every option carries a fixed verdict. The one cross-row rule: a number on
 * the decision sheet that supports the other decision turns that row to
 * "misleads".
 */

import {
  CLAIMS,
  claimById,
  CRAFT_MEAN_LIST_PRICE,
  LINE_IDS,
  lineInfo,
  MONTHS,
  type ClaimId,
  type Cell,
  type LineId,
  type MonthId,
  type Truth,
} from "./data";

export type Verdict = "holds" | "misleads" | "absent";

export type Decision = "rework" | "marketing";
export const DECISIONS: readonly Decision[] = ["rework", "marketing"];

export type CompareId = "line-month" | "total-week" | "line-week";
export const COMPARE_IDS: readonly CompareId[] = ["line-month", "total-week", "line-week"];

export type DefectId = "count" | "per1000" | "returns";
export const DEFECT_IDS: readonly DefectId[] = ["count", "per1000", "returns"];

export type FlagId = "chronic" | "rising" | "most-reports";
export const FLAG_IDS: readonly FlagId[] = ["chronic", "rising", "most-reports"];

export type NumberId = "craft-mom" | "rate-251" | "rev-412" | "scrap-691" | "ncr-23";
export type CostId = "both-ways" | "lost-revenue" | "scrap-on-top";
export type OpenId = "weeks" | "marketing" | "rate";
export type CounterId = "price-margin" | "count-fell" | "rate-fell";
export type TriggerId = "rate-only" | "revenue" | "rate-and-scrap";

/* ------------------------------------------------------------------ */
/* Arithmetic                                                          */
/* ------------------------------------------------------------------ */

/** b / a - 1. */
export function growth(a: number, b: number): number {
  return b / a - 1;
}

/** Growth of the weekly average: (sep / wS) / (aug / wA) - 1. */
export function perWeekGrowth(aug: number, sep: number, wA = 4, wS = 5): number {
  return sep / wS / (aug / wA) - 1;
}

/** NCRs per 1.000 shipped units; null stays null ("keine Meldung"). */
export function per1000(ncr: number | null, units: number): number | null {
  if (ncr === null) return null;
  return (ncr / units) * 1000;
}

export function rate(line: LineId, month: MonthId): number | null {
  const entry = MONTHS[month].lines[line];
  return per1000(entry.ncr, entry.units);
}

/** Scrapped units as a share of the line's units; null without NCRs. */
export function scrapShare(line: LineId, month: MonthId): number | null {
  const entry = MONTHS[month].lines[line];
  return entry.scrapUnits === null ? null : entry.scrapUnits / entry.units;
}

export function monthTotal(month: MonthId): number {
  return MONTHS[month].weeklyUnits.reduce((sum, units) => sum + units, 0);
}

export function weekCount(month: MonthId): number {
  return MONTHS[month].weekStarts.length;
}

export function linePerWeekGrowth(line: LineId): number {
  return perWeekGrowth(
    MONTHS["2023-08"].lines[line].units,
    MONTHS["2023-09"].lines[line].units,
    weekCount("2023-08"),
    weekCount("2023-09"),
  );
}

export function totalPerWeekGrowth(): number {
  return perWeekGrowth(
    monthTotal("2023-08"),
    monthTotal("2023-09"),
    weekCount("2023-08"),
    weekCount("2023-09"),
  );
}

/** The +25 % one extra week makes on its own: 5 ÷ 4 - 1. */
export function extraWeekEffect(): number {
  return weekCount("2023-09") / weekCount("2023-08") - 1;
}

/* ------------------------------------------------------------------ */
/* Station 1 · Vergleichen                                             */
/* ------------------------------------------------------------------ */

export type RowSubject = LineId | "TOTAL";

export interface CompareRow {
  readonly line: RowSubject;
  /** Growth as a fraction. */
  readonly value: number;
}

export interface CompareReading {
  readonly verdict: Verdict;
  /** The subject and value of the headline figure. */
  readonly headline: CompareRow;
  /** What the comparison measures: monthly totals or the weekly average. */
  readonly basis: "month" | "week";
  readonly rows: readonly CompareRow[];
  /** M1: 0 = monthly stacks, 1 = weekly columns. */
  readonly stripTarget: 0 | 1;
}

const byValueDesc = (a: CompareRow, b: CompareRow) => b.value - a.value;

/** The report's month-over-month rows (§2) plus the company total, highest first. */
export function reportMonthRows(): readonly CompareRow[] {
  const lines = LINE_IDS.map((line) => ({
    line,
    value: lineInfo(line).reportMomUnitsPct / 100,
  }));
  return [...lines, { line: "TOTAL" as const, value: growth(monthTotal("2023-08"), monthTotal("2023-09")) }].sort(
    byValueDesc,
  );
}

export function weekRows(): readonly CompareRow[] {
  const lines = LINE_IDS.map((line) => ({ line, value: linePerWeekGrowth(line) }));
  return [...lines, { line: "TOTAL" as const, value: totalPerWeekGrowth() }].sort(byValueDesc);
}

export function readCompare(id: CompareId): CompareReading {
  if (id === "line-month") {
    const rows = reportMonthRows();
    return {
      verdict: "misleads",
      headline: rows.find((row) => row.line === "TOTAL")!,
      basis: "month",
      rows,
      stripTarget: 0,
    };
  }
  if (id === "total-week") {
    const total = { line: "TOTAL" as const, value: totalPerWeekGrowth() };
    return { verdict: "misleads", headline: total, basis: "week", rows: [total], stripTarget: 1 };
  }
  const rows = weekRows();
  return {
    verdict: "holds",
    headline: rows.find((row) => row.line === "CRAFT")!,
    basis: "week",
    rows,
    stripTarget: 1,
  };
}

/** Lines whose weekly average shrank, smallest first: PULSE, CRAFT, NEST. */
export function shrinkingLines(): readonly LineId[] {
  return weekRows()
    .filter((row): row is CompareRow & { line: LineId } => row.line !== "TOTAL" && row.value < 0)
    .sort((a, b) => a.value - b.value)
    .map((row) => row.line);
}

/* ------------------------------------------------------------------ */
/* Station 2 · Mängel                                                  */
/* ------------------------------------------------------------------ */

export interface DefectRow {
  readonly line: LineId;
  /** Count, rate per 1.000, or null ("keine Meldung" or "nicht in den Daten"). */
  readonly value: number | null;
  /** True when the figure does not exist in the data at all. */
  readonly absent: boolean;
  readonly note?: "echo-escalation";
}

export interface DefectReading {
  readonly verdict: Verdict;
  readonly scale: DefectId;
  /** All seven lines in revenue order. */
  readonly rows: readonly DefectRow[];
}

const DEFECT_VERDICT: Record<DefectId, Verdict> = {
  count: "misleads",
  per1000: "holds",
  returns: "absent",
};

export function defectValue(id: DefectId, line: LineId, month: MonthId = "2023-09"): number | null {
  if (id === "returns") return null;
  if (id === "count") return MONTHS[month].lines[line].ncr;
  return rate(line, month);
}

export function readDefects(id: DefectId): DefectReading {
  return {
    verdict: DEFECT_VERDICT[id],
    scale: id,
    rows: LINE_IDS.map((line) => ({
      line,
      value: defectValue(id, line),
      absent: id === "returns",
      ...(line === "ECHO" ? { note: "echo-escalation" as const } : {}),
    })),
  };
}

/** Lines that logged NCRs in September, in revenue order. */
export function linesWithNcr(): readonly LineId[] {
  return LINE_IDS.filter((line) => MONTHS["2023-09"].lines[line].ncr !== null);
}

export interface FlagEvidence {
  readonly rateAug: number;
  readonly rateSep: number;
  readonly scrapShareAug: number;
  readonly scrapShareSep: number;
  /** Scrapped units × CRAFT's mean list price, at list price. */
  readonly scrapEur: number;
  readonly scrapShareOfRevenue: number;
}

export interface FlagReading {
  readonly flagged: readonly LineId[];
  readonly verdict: Verdict;
  readonly noise: readonly LineId[];
  readonly evidence?: FlagEvidence;
}

/** A rate change smaller than this (per 1.000) is noise, not a signal. */
export const NOISE_PER_1000 = 0.05;

export function craftScrapEur(): number {
  return (MONTHS["2023-09"].lines.CRAFT.scrapUnits ?? 0) * CRAFT_MEAN_LIST_PRICE;
}

export function craftEvidence(): FlagEvidence {
  const scrapEur = craftScrapEur();
  return {
    rateAug: rate("CRAFT", "2023-08")!,
    rateSep: rate("CRAFT", "2023-09")!,
    scrapShareAug: scrapShare("CRAFT", "2023-08")!,
    scrapShareSep: scrapShare("CRAFT", "2023-09")!,
    scrapEur,
    scrapShareOfRevenue: scrapEur / lineInfo("CRAFT").revenueSepEur,
  };
}

export function readFlag(id: FlagId): FlagReading {
  if (id === "chronic") {
    return { flagged: ["CRAFT"], verdict: "holds", noise: [], evidence: craftEvidence() };
  }
  if (id === "rising") {
    const rising = linesWithNcr().filter((line) => rate(line, "2023-09")! > rate(line, "2023-08")!);
    const noise = rising.filter(
      (line) => Math.abs(rate(line, "2023-09")! - rate(line, "2023-08")!) < NOISE_PER_1000,
    );
    return { flagged: rising, verdict: "misleads", noise };
  }
  return { flagged: ["CRAFT"], verdict: "misleads", noise: [] };
}

/* ------------------------------------------------------------------ */
/* Station 3 · Prüfen                                                  */
/* ------------------------------------------------------------------ */

export interface ClaimCheck {
  readonly truth: Truth;
  readonly sourceValue: number | null;
  readonly rows: readonly (readonly Cell[])[];
  readonly more: number;
  readonly said: Truth;
  readonly same: boolean;
}

export function checkClaim(id: ClaimId, said: Truth): ClaimCheck {
  const claim = claimById(id);
  return {
    truth: claim.truth,
    sourceValue: claim.sourceValue,
    rows: claim.rows,
    more: claim.more,
    said,
    same: said === claim.truth,
  };
}

export function claimSummary(saidById: Partial<Record<ClaimId, Truth>>): {
  checked: number;
  of: number;
} {
  return {
    checked: CLAIMS.filter((claim) => saidById[claim.id] !== undefined).length,
    of: CLAIMS.length,
  };
}

/* ------------------------------------------------------------------ */
/* Station 4 · Entscheide                                              */
/* ------------------------------------------------------------------ */

export interface Sheet {
  readonly decision?: Decision;
  readonly number?: NumberId;
  readonly cost?: CostId;
  readonly open?: OpenId;
  readonly counter?: CounterId;
  readonly trigger?: TriggerId;
}

export type SheetField = keyof Sheet;
export const SHEET_FIELDS: readonly SheetField[] = [
  "decision",
  "number",
  "cost",
  "open",
  "counter",
  "trigger",
];

export interface OptionRule {
  readonly verdict: Verdict;
  /** Number row only: the decision this figure argues for. */
  readonly side?: Decision;
  /** True where the VP has a real objection to this option. */
  readonly vp?: true;
}

/** Every sheet option in display order, with its fixed verdict. */
export const SHEET_OPTIONS = {
  decision: {
    rework: { verdict: "holds" },
    marketing: { verdict: "misleads" },
  },
  number: {
    "craft-mom": { verdict: "misleads", side: "marketing" },
    "rate-251": { verdict: "holds", side: "rework" },
    "rev-412": { verdict: "misleads", side: "marketing" },
    "scrap-691": { verdict: "holds", side: "rework" },
    "ncr-23": { verdict: "misleads", vp: true },
  },
  cost: {
    "both-ways": { verdict: "holds" },
    "lost-revenue": { verdict: "absent" },
    "scrap-on-top": { verdict: "misleads", vp: true },
  },
  open: {
    weeks: { verdict: "misleads" },
    marketing: { verdict: "holds" },
    rate: { verdict: "misleads" },
  },
  counter: {
    "price-margin": { verdict: "absent" },
    "count-fell": { verdict: "misleads" },
    "rate-fell": { verdict: "holds" },
  },
  trigger: {
    "rate-only": { verdict: "misleads" },
    revenue: { verdict: "misleads" },
    "rate-and-scrap": { verdict: "holds" },
  },
} as const satisfies {
  readonly decision: Record<Decision, OptionRule>;
  readonly number: Record<NumberId, OptionRule>;
  readonly cost: Record<CostId, OptionRule>;
  readonly open: Record<OpenId, OptionRule>;
  readonly counter: Record<CounterId, OptionRule>;
  readonly trigger: Record<TriggerId, OptionRule>;
};

export function optionIds<F extends SheetField>(field: F): readonly NonNullable<Sheet[F]>[] {
  return Object.keys(SHEET_OPTIONS[field]) as unknown as readonly NonNullable<Sheet[F]>[];
}

export interface RowResult {
  readonly field: SheetField;
  readonly verdict: Verdict | "open";
  /** The chosen option; undefined while the row is open. */
  readonly option?: string;
  /**
   * Set when the cross-row rule turns the number row: the learner's
   * decision that the chosen number argues against. The row shows a text
   * for that direction above the option's own fact.
   */
  readonly against?: Decision;
  readonly vp?: true;
}

export interface SheetResult {
  readonly rows: readonly RowResult[];
  readonly holding: number;
  readonly open: number;
  readonly holds: boolean;
}

function ruleFor(field: SheetField, option: string): OptionRule {
  return (SHEET_OPTIONS[field] as Record<string, OptionRule>)[option];
}

export function assessSheet(sheet: Sheet): SheetResult {
  const rows = SHEET_FIELDS.map((field): RowResult => {
    const option = sheet[field];
    if (option === undefined) return { field, verdict: "open" };
    const rule = ruleFor(field, option);
    if (
      field === "number" &&
      rule.side !== undefined &&
      sheet.decision !== undefined &&
      rule.side !== sheet.decision
    ) {
      return { field, verdict: "misleads", option, against: sheet.decision };
    }
    return { field, verdict: rule.verdict, option, ...(rule.vp ? { vp: true as const } : {}) };
  });
  const holding = rows.filter((row) => row.verdict === "holds").length;
  const open = rows.filter((row) => row.verdict === "open").length;
  return { rows, holding, open, holds: holding === SHEET_FIELDS.length };
}

export type GutLine = "same-holds" | "same-weak" | "turned";

export function gutLine(
  gut: Decision | undefined,
  decision: Decision | undefined,
  holds: boolean,
): GutLine | null {
  if (gut === undefined || decision === undefined) return null;
  if (gut !== decision) return "turned";
  return holds ? "same-holds" : "same-weak";
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

export interface DemoState {
  readonly gut?: Decision;
  readonly compare?: CompareId;
  readonly defect?: DefectId;
  readonly flag?: FlagId;
  readonly said: Readonly<Partial<Record<ClaimId, Truth>>>;
  readonly sheet: Sheet;
}

export const INITIAL_STATE: DemoState = { said: {}, sheet: {} };

export type SheetAction = {
  [F in SheetField]: { readonly type: "sheet"; readonly field: F; readonly value: NonNullable<Sheet[F]> };
}[SheetField];

export type DemoAction =
  | { readonly type: "gut"; readonly value: Decision }
  | { readonly type: "compare"; readonly value: CompareId }
  | { readonly type: "defect"; readonly value: DefectId }
  | { readonly type: "flag"; readonly value: FlagId }
  | { readonly type: "say"; readonly claim: ClaimId; readonly value: Truth }
  | SheetAction
  | { readonly type: "reset" };

export function reducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "gut":
      return { ...state, gut: action.value };
    case "compare":
      return { ...state, compare: action.value };
    case "defect":
      return { ...state, defect: action.value };
    case "flag":
      return { ...state, flag: action.value };
    case "say":
      return { ...state, said: { ...state.said, [action.claim]: action.value } };
    case "sheet":
      return { ...state, sheet: { ...state.sheet, [action.field]: action.value } };
    case "reset":
      return INITIAL_STATE;
  }
}

export function isPristine(state: DemoState): boolean {
  return (
    state.gut === undefined &&
    state.compare === undefined &&
    state.defect === undefined &&
    state.flag === undefined &&
    Object.keys(state.said).length === 0 &&
    Object.keys(state.sheet).length === 0
  );
}

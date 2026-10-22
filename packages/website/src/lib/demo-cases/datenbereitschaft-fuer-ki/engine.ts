/**
 * The pure engine of demo 03 (spec section 5): no React, no Date, no
 * randomness. It computes first and classifies second, so a wrong table still
 * shows its real wrong number. Classification reports the first broken rule
 * in the order kind → table → period / combine → base → grain.
 */
import { DEFINITION_REQUESTS, INVENTED_TICKS, REQUIRED_TICKS, TRIAGE_CARDS, TRIAGE_IDS, triageCard } from "./cases";
import { ENDING_MRR, FOLDLINE, HEADCOUNT, NET_NEW_MRR, Q2_MONTHS, sumQ2, type Month } from "./data";
import { valuesEqual } from "./format";
import type {
  Behavior,
  Blank,
  BlankValues,
  Definition,
  DefinitionRequest,
  DefinitionRequestId,
  FreshTick,
  Gap,
  Lock,
  Params,
  Reading,
  Receipt,
  RequestId,
  Row,
  RuleId,
  TriageCard,
  TriageCardSpec,
  TriageChoice,
  TriageReceipt,
  Value,
  Verdict,
} from "./model";

export { formatValue } from "./format";

interface Analysis {
  readonly rows: readonly Row[];
  readonly reading: Reading;
  readonly verdict: Exclude<Verdict, "open">;
  readonly rule: RuleId;
  readonly note?: RuleId;
  /** The blank of the first broken rule. */
  readonly blank?: Blank;
  readonly params: Params;
  readonly origin?: "recorded" | "plausible";
}

type Complete<R extends DefinitionRequest["caseId"]> = R extends "G01"
  ? Required<Pick<Definition, "kind" | "grain" | "period" | "table">>
  : R extends "G02"
    ? Required<Pick<Definition, "kind" | "period" | "table">>
    : R extends "G03"
      ? Required<Pick<Definition, "kind" | "grain" | "table" | "base">>
      : Required<Pick<Definition, "kind" | "table" | "combine" | "base">>;

const eur = (amount: number): Value => ({ unit: "eur", amount });

function monthRows(record: Readonly<Record<Month, number>>): Row[] {
  return Q2_MONTHS.map((month) => ({ label: month, value: eur(record[month]) }));
}

const RECORDED_G01: readonly Row[] = monthRows(NET_NEW_MRR);

function rowsEqual(a: readonly Row[], b: readonly Row[]): boolean {
  return a.length === b.length && a.every((row, index) => row.label === b[index].label && valuesEqual(row.value, b[index].value));
}

/* --------------------------------- 01 · G01 -------------------------------- */

function analyzeG01(d: Complete<"G01">): Analysis {
  const isChange = d.kind === "change" || d.table === "public.monthly_revenue";
  const values = isChange ? NET_NEW_MRR : ENDING_MRR;
  const rows: Row[] =
    d.period === "eachMonth"
      ? monthRows(values)
      : d.period === "sumMonths"
        ? [{ label: "Q2", value: eur(sumQ2(values)) }]
        : [{ label: "2026-06", value: eur(values["2026-06"]) }];
  const reading: Reading = isChange
    ? ({ eachMonth: "changes", sumMonths: "changeSum", lastMonth: "lastChange" } as const)[
        d.period as "eachMonth" | "sumMonths" | "lastMonth"
      ]
    : ({ eachMonth: "levels", sumMonths: "stackLevels", lastMonth: "lastLevel" } as const)[
        d.period as "eachMonth" | "sumMonths" | "lastMonth"
      ];
  const origin = rowsEqual(rows, RECORDED_G01) ? ("recorded" as const) : undefined;

  if (d.kind === "change") {
    return { rows, reading, verdict: "wrong", rule: "changeForLevel", blank: "kind", params: {}, origin };
  }
  if (d.table === "public.monthly_revenue") {
    return { rows, reading, verdict: "wrong", rule: "tableStoresChange", blank: "table", params: {}, origin };
  }
  if (d.period === "sumMonths") {
    return { rows, reading, verdict: "wrong", rule: "levelSummed", blank: "period", params: { value: rows[0].value } };
  }
  if (d.period === "lastMonth") {
    return { rows, reading, verdict: "rightNumberWrongDef", rule: "lastLevelOnly", blank: "period", params: {} };
  }
  return {
    rows,
    reading,
    verdict: "correct",
    rule: "g01Correct",
    note: d.table === "analytics.account_mrr_monthly" ? "noteSmallestView" : undefined,
    params: {},
  };
}

/* --------------------------------- 02 · G02 -------------------------------- */

function analyzeG02(d: Complete<"G02">): Analysis {
  const q2 = (amount: number): Row[] => [{ label: "Q2", value: eur(amount) }];
  const june = (amount: number): Row[] => [{ label: "2026-06", value: eur(amount) }];
  const diff = NET_NEW_MRR["2026-06"] - NET_NEW_MRR["2026-03"];

  if (d.table === "public.billing_events") {
    const summed = d.period === "sumMonths";
    return {
      rows: summed ? q2(FOLDLINE.billingEventsQ2) : [],
      reading: summed ? "billingSum" : "noRows",
      verdict: "wrong",
      rule: "billingDuplicates",
      blank: "table",
      params: {},
    };
  }
  if (d.table === "public.monthly_revenue") {
    // The column decides: amount stores changes, whatever kind is meant.
    if (d.period === "sumMonths") {
      return {
        rows: q2(sumQ2(NET_NEW_MRR)),
        reading: "changeSum",
        verdict: "rightNumberWrongDef",
        rule: "exportLucky",
        blank: "table",
        params: {},
      };
    }
    if (d.period === "endMinusStart") {
      return { rows: q2(diff), reading: "changeDiff", verdict: "wrong", rule: "changeDiff", blank: "table", params: {}, origin: "recorded" };
    }
    return { rows: june(NET_NEW_MRR["2026-06"]), reading: "lastChange", verdict: "wrong", rule: "changeLastOnly", blank: "table", params: {} };
  }
  // The approved summary view.
  if (d.kind === "change") {
    if (d.period === "sumMonths") {
      return { rows: q2(sumQ2(NET_NEW_MRR)), reading: "changeSum", verdict: "correct", rule: "g02CorrectSum", params: {} };
    }
    if (d.period === "endMinusStart") {
      return { rows: q2(diff), reading: "changeDiff", verdict: "wrong", rule: "changeDiff", blank: "period", params: {}, origin: "recorded" };
    }
    return { rows: june(NET_NEW_MRR["2026-06"]), reading: "lastChange", verdict: "wrong", rule: "changeLastOnly", blank: "period", params: {} };
  }
  if (d.period === "endMinusStart") {
    return {
      rows: q2(ENDING_MRR["2026-06"] - ENDING_MRR["2026-03"]),
      reading: "endMinusStart",
      verdict: "correct",
      rule: "g02CorrectBathtub",
      params: {},
    };
  }
  if (d.period === "lastMonth") {
    return { rows: june(ENDING_MRR["2026-06"]), reading: "lastLevel", verdict: "wrong", rule: "levelForChange", blank: "period", params: {} };
  }
  const summed = q2(sumQ2(ENDING_MRR));
  return { rows: summed, reading: "stackLevels", verdict: "wrong", rule: "levelSummed", blank: "period", params: { value: summed[0].value } };
}

/* --------------------------------- 03 · G03 -------------------------------- */

const BASE_03 = {
  startOfQuarter: FOLDLINE.activeEndOfMarch,
  startPlusJoiners: FOLDLINE.activeEndOfMarch + FOLDLINE.joinedQ2,
  endOfQuarter: FOLDLINE.activeEndOfJune,
  averageHeadcount: Number.NaN,
} as const;

function analyzeG03(d: Complete<"G03">): Analysis {
  const perSegment = d.grain === "perSegment";
  const segments = FOLDLINE.segments.length;
  const spread = (perSegmentValue: Value, totalValue: Value): Row[] =>
    perSegment
      ? FOLDLINE.segments.map((segment) => ({ label: segment, value: perSegmentValue }))
      : [{ label: "allSegments", value: totalValue }];

  if (d.kind === "level" || d.kind === "change") {
    const n = d.kind === "level" ? FOLDLINE.activeEndOfMarch : FOLDLINE.joinedQ2 - FOLDLINE.churnedQ2;
    const signed = d.kind === "change";
    const rows = spread(
      { unit: "count", n, signed, noun: "accounts" },
      { unit: "count", n: n * segments, signed, noun: "accounts" },
    );
    return { rows, reading: "counts", verdict: "wrong", rule: "notARate", blank: "kind", params: { value: rows[0].value } };
  }
  if (d.table === "public.acct_history") {
    const zero: Value = { unit: "rate", num: 0, den: 0 };
    return { rows: spread(zero, zero), reading: "zeroBase", verdict: "wrong", rule: "statusCodes", blank: "table", params: {}, origin: "recorded" };
  }
  const den = BASE_03[d.base];
  const digits = d.base === "startPlusJoiners" ? 2 : 1;
  const rows = spread(
    { unit: "rate", num: FOLDLINE.churnedQ2, den, digits },
    { unit: "rate", num: FOLDLINE.churnedQ2 * segments, den: den * segments, digits },
  );
  const reading = `base:${d.base}` as Reading;
  if (d.base === "startPlusJoiners") {
    return { rows, reading, verdict: "wrong", rule: "baseJoiners", blank: "base", params: { value: rows[0].value } };
  }
  if (d.base === "endOfQuarter") {
    return { rows, reading, verdict: "wrong", rule: "baseEnd", blank: "base", params: { value: rows[0].value } };
  }
  if (!perSegment) {
    return { rows, reading, verdict: "rightNumberWrongDef", rule: "singleForSegments", blank: "grain", params: {} };
  }
  return { rows, reading, verdict: "correct", rule: "g03Correct", params: {} };
}

/* -------------------------------- 05 · HC01 -------------------------------- */

function analyzeHC01(d: Complete<"HC01">): Analysis {
  const company = (value: Value): Row[] => [{ label: "company", value }];
  if (d.kind === "level") {
    const rows = company({ unit: "count", n: HEADCOUNT.level["2026-06"], noun: "people" });
    return { rows, reading: "counts", verdict: "wrong", rule: "notARate", blank: "kind", params: { value: rows[0].value } };
  }
  if (d.kind === "change") {
    const rows = company({ unit: "count", n: HEADCOUNT.netQ2, signed: true, noun: "people" });
    return { rows, reading: "counts", verdict: "wrong", rule: "notARate", blank: "kind", params: { value: rows[0].value } };
  }
  if (d.table === "export_lane.hc_monthly") {
    if (d.combine === "averageRates") {
      return {
        rows: company({ unit: "averagedRate", pct: HEADCOUNT.monthlyRatesAveragedPct, digits: 2 }),
        reading: "monthlyAveraged",
        verdict: "wrong",
        rule: "hcMonthlyAveraged",
        blank: "table",
        params: {},
        origin: "plausible",
      };
    }
    return { rows: [], reading: "exportNoCounts", verdict: "wrong", rule: "hcExportNoCounts", blank: "table", params: {} };
  }
  if (d.combine === "averageRates") {
    return {
      rows: company({ unit: "averagedRate", pct: HEADCOUNT.departmentRatesAveragedPct }),
      reading: "deptAveraged",
      verdict: "wrong",
      rule: "hcDeptAveraged",
      blank: "combine",
      params: {},
      origin: "plausible",
    };
  }
  if (d.base === "averageHeadcount") {
    return {
      rows: company({ unit: "rate", num: HEADCOUNT.leaversQ2, den: HEADCOUNT.averageHeadcount, digits: 2 }),
      reading: "averageBase",
      verdict: "wrong",
      rule: "hcBaseUnwritten",
      blank: "base",
      params: {},
    };
  }
  return {
    rows: company({ unit: "rate", num: HEADCOUNT.leaversQ2, den: HEADCOUNT.startingHeadcount }),
    reading: "pooled",
    verdict: "correct",
    rule: "hcCorrect",
    params: {},
  };
}

function analyze(r: DefinitionRequest, d: Definition): Analysis {
  switch (r.caseId) {
    case "G01":
      return analyzeG01(d as Complete<"G01">);
    case "G02":
      return analyzeG02(d as Complete<"G02">);
    case "G03":
      return analyzeG03(d as Complete<"G03">);
    case "HC01":
      return analyzeHC01(d as Complete<"HC01">);
  }
}

/* ---------------------------------- API ------------------------------------ */

/** The shown blanks that have no choice yet, in panel order. */
export function missingBlanks(r: DefinitionRequest, d: Definition): readonly Blank[] {
  return r.blanks.filter((b) => d[b] === undefined);
}

/** "eine Zeile pro Monat" + "Monate addieren", or "ein Wert" + "einzeln", exclude each other. */
export function contradiction(d: Definition): readonly [Blank, Blank] | undefined {
  if (d.grain === "perMonth" && d.period === "sumMonths") return ["grain", "period"];
  if (d.grain === "single" && d.period === "eachMonth") return ["grain", "period"];
  return undefined;
}

function isComplete(r: DefinitionRequest, d: Definition): boolean {
  return missingBlanks(r, d).length === 0 && contradiction(d) === undefined;
}

export function computeDefinition(r: DefinitionRequest, d: Definition): { rows: readonly Row[]; reading: Reading } {
  if (!isComplete(r, d)) return { rows: [], reading: "none" };
  const { rows, reading } = analyze(r, d);
  return { rows, reading };
}

export function classifyDefinition(
  r: DefinitionRequest,
  d: Definition,
): { verdict: Verdict; rule: RuleId; note?: RuleId; blank?: Blank; params: Params } {
  const missing = missingBlanks(r, d);
  if (missing.length > 0) return { verdict: "open", rule: "incomplete", blank: missing[0], params: { blanks: missing } };
  if (contradiction(d)) {
    return { verdict: "open", rule: "contradiction", blank: "grain", params: { grain: d.grain, period: d.period } };
  }
  const { verdict, rule, note, blank, params } = analyze(r, d);
  return { verdict, rule, note, blank, params };
}

export function evaluateDefinition(r: DefinitionRequest, d: Definition, attempt: number): Receipt {
  const classified = classifyDefinition(r, d);
  if (classified.verdict === "open") {
    return {
      verdict: "open",
      rule: classified.rule,
      rows: [],
      truth: r.truth,
      reading: "none",
      changeBlank: classified.blank,
      params: classified.params,
      attempt,
    };
  }
  const analysis = analyze(r, d);
  return {
    verdict: analysis.verdict,
    rule: analysis.rule,
    note: analysis.note,
    rows: analysis.rows,
    truth: r.truth,
    reading: analysis.reading,
    changeBlank: analysis.verdict !== "correct" && attempt >= 2 ? analysis.blank : undefined,
    params: analysis.params,
    origin: analysis.origin,
    attempt,
  };
}

export function evaluateTriage(card: TriageCardSpec, choice: TriageChoice, attempt: number): TriageReceipt {
  const wrongRule = `t${card.id}Wrong` as const;
  const rightRule = `t${card.id}Correct` as const;
  if (!choice.behavior) {
    return { verdict: "open", behavior: "open", rules: ["tIncomplete"], params: { open: "behavior" }, attempt };
  }
  if (choice.behavior !== card.expected) {
    return { verdict: "wrong", behavior: "wrong", rules: [wrongRule], params: {}, attempt };
  }
  switch (card.followUp) {
    case undefined:
      return { verdict: "correct", behavior: "right", rules: [rightRule], params: {}, attempt };
    case "gaps": {
      const gaps = new Set(choice.gaps ?? []);
      const right = gaps.has("kind") && gaps.has("period") && !gaps.has("table");
      return right
        ? { verdict: "correct", behavior: "right", followUp: "right", rules: ["tC01Correct"], params: {}, attempt }
        : { verdict: "wrong", behavior: "right", followUp: "wrong", rules: ["tC01Gaps"], params: {}, attempt };
    }
    case "lock": {
      if (!choice.lock) {
        return { verdict: "open", behavior: "right", followUp: "open", rules: ["tIncomplete"], params: { open: "lock" }, attempt };
      }
      return choice.lock === "postgresRole"
        ? { verdict: "correct", behavior: "right", followUp: "right", rules: ["tR02Correct"], params: {}, attempt }
        : { verdict: "wrong", behavior: "right", followUp: "wrong", rules: ["tR02Lock"], params: { lock: choice.lock }, attempt };
    }
    case "freshTicks": {
      const ticks = new Set(choice.ticks ?? []);
      const missing = REQUIRED_TICKS.filter((tick) => !ticks.has(tick));
      const invented = INVENTED_TICKS.filter((tick) => ticks.has(tick));
      if (missing.length === 0 && invented.length === 0) {
        return { verdict: "correct", behavior: "right", followUp: "right", rules: ["tF01Correct"], params: {}, attempt };
      }
      const rules = [
        ...(missing.length > 0 ? (["tF01Missing"] as const) : []),
        ...(invented.length > 0 ? (["tF01Invented"] as const) : []),
      ];
      return { verdict: "wrong", behavior: "right", followUp: "wrong", rules, params: { missing, invented }, attempt };
    }
  }
}

/* --------------------------------- State ----------------------------------- */

export interface DefState {
  readonly definition: Definition;
  readonly attempt: number;
  readonly receipt?: Receipt;
  readonly stale: boolean;
  readonly solved: boolean;
}

export interface CardState {
  readonly choice: TriageChoice;
  readonly attempt: number;
  readonly receipt?: TriageReceipt;
  readonly stale: boolean;
  readonly solved: boolean;
}

export interface DemoState {
  readonly active: RequestId;
  readonly defs: Readonly<Record<DefinitionRequestId, DefState>>;
  readonly cards: Readonly<Record<TriageCard, CardState>>;
}

export type Action =
  | { readonly type: "select"; readonly id: RequestId }
  | { readonly type: "choose"; readonly request: DefinitionRequestId; readonly blank: Blank; readonly value: BlankValues[Blank] }
  | { readonly type: "chooseBehavior"; readonly card: TriageCard; readonly value: Behavior }
  | { readonly type: "chooseLock"; readonly card: TriageCard; readonly value: Lock }
  | { readonly type: "toggleGap"; readonly card: TriageCard; readonly value: Gap }
  | { readonly type: "toggleTick"; readonly card: TriageCard; readonly value: FreshTick }
  | { readonly type: "check"; readonly request: DefinitionRequestId }
  | { readonly type: "checkCard"; readonly card: TriageCard };

const EMPTY_DEF: DefState = { definition: {}, attempt: 0, stale: false, solved: false };
const EMPTY_CARD: CardState = { choice: {}, attempt: 0, stale: false, solved: false };

export function initialState(active: RequestId = "01"): DemoState {
  return {
    active,
    defs: { "01": EMPTY_DEF, "02": EMPTY_DEF, "03": EMPTY_DEF, "05": EMPTY_DEF },
    cards: { G01: EMPTY_CARD, C01: EMPTY_CARD, R01: EMPTY_CARD, R02: EMPTY_CARD, F01: EMPTY_CARD },
  };
}

function toggleIn<T extends string>(list: readonly T[] | undefined, value: T, order: readonly T[]): T[] {
  const set = new Set(list ?? []);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return order.filter((item) => set.has(item));
}

function withCard(state: DemoState, card: TriageCard, choice: TriageChoice): DemoState {
  const current = state.cards[card];
  return {
    ...state,
    active: "04",
    cards: { ...state.cards, [card]: { ...current, choice, stale: current.receipt !== undefined } },
  };
}

const GAP_ORDER: readonly Gap[] = ["kind", "grain", "period", "table"];
const TICK_ORDER: readonly FreshTick[] = ["loadedAt", "age", "warnAfter", "definition", "expiry48", "ageFromToday"];

/** The demo reducer: select, choose, toggle, check. It never mutates its input. */
export function reduce(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "select":
      return state.active === action.id ? state : { ...state, active: action.id };
    case "choose": {
      const current = state.defs[action.request];
      if (current.definition[action.blank] === action.value) {
        return state.active === action.request ? state : { ...state, active: action.request };
      }
      const definition: Definition = { ...current.definition, [action.blank]: action.value };
      return {
        ...state,
        active: action.request,
        defs: { ...state.defs, [action.request]: { ...current, definition, stale: current.receipt !== undefined } },
      };
    }
    case "chooseBehavior": {
      const choice = state.cards[action.card].choice;
      if (choice.behavior === action.value) return state;
      return withCard(state, action.card, { ...choice, behavior: action.value });
    }
    case "chooseLock": {
      const choice = state.cards[action.card].choice;
      if (choice.lock === action.value) return state;
      return withCard(state, action.card, { ...choice, lock: action.value });
    }
    case "toggleGap": {
      const choice = state.cards[action.card].choice;
      return withCard(state, action.card, { ...choice, gaps: toggleIn(choice.gaps, action.value, GAP_ORDER) });
    }
    case "toggleTick": {
      const choice = state.cards[action.card].choice;
      return withCard(state, action.card, { ...choice, ticks: toggleIn(choice.ticks, action.value, TICK_ORDER) });
    }
    case "check": {
      const current = state.defs[action.request];
      const attempt = current.attempt + 1;
      const receipt = evaluateDefinition(DEFINITION_REQUESTS[action.request], current.definition, attempt);
      return {
        ...state,
        active: action.request,
        defs: {
          ...state.defs,
          [action.request]: {
            ...current,
            attempt,
            receipt,
            stale: false,
            solved: current.solved || receipt.verdict === "correct",
          },
        },
      };
    }
    case "checkCard": {
      const current = state.cards[action.card];
      const attempt = current.attempt + 1;
      const receipt = evaluateTriage(triageCard(action.card), current.choice, attempt);
      return {
        ...state,
        active: "04",
        cards: {
          ...state.cards,
          [action.card]: {
            ...current,
            attempt,
            receipt,
            stale: false,
            solved: current.solved || receipt.verdict === "correct",
          },
        },
      };
    }
  }
}

export type RequestStatus = "open" | "tried" | "solved";

export function requestStatus(state: DemoState, id: RequestId): RequestStatus {
  if (id === "04") {
    const cards = TRIAGE_IDS.map((card) => state.cards[card]);
    if (cards.every((card) => card.solved)) return "solved";
    return cards.some((card) => card.attempt > 0) ? "tried" : "open";
  }
  const def = state.defs[id];
  if (def.solved) return "solved";
  return def.attempt > 0 ? "tried" : "open";
}

export function allSolved(state: DemoState): boolean {
  return (["01", "02", "03", "04", "05"] as const).every((id) => requestStatus(state, id) === "solved");
}

export { TRIAGE_CARDS };

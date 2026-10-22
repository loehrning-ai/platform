/** Types of demo 03 "Mach die Zahl richtig." (spec section 3.3 and 5). */
import type { TableId } from "./data";

export type RequestId = "01" | "02" | "03" | "04" | "05";
export type DefinitionRequestId = "01" | "02" | "03" | "05";
export type DefinitionCase = "G01" | "G02" | "G03" | "HC01";
export type TriageCard = "G01" | "C01" | "R01" | "R02" | "F01";

export type Kind = "level" | "change" | "rate";
export type Grain = "perMonth" | "perSegment" | "single";
export type Period = "eachMonth" | "sumMonths" | "lastMonth" | "endMinusStart";
export type Base = "startOfQuarter" | "startPlusJoiners" | "endOfQuarter" | "averageHeadcount";
export type Combine = "pool" | "averageRates";
export type Blank = "kind" | "grain" | "period" | "table" | "base" | "combine";

/** The value type of each blank. */
export interface BlankValues {
  readonly kind: Kind;
  readonly grain: Grain;
  readonly period: Period;
  readonly table: TableId;
  readonly base: Base;
  readonly combine: Combine;
}

export type Definition = { readonly [B in Blank]?: BlankValues[B] };

/** Lines the question already settles, printed between the fieldsets. */
export type FixedLine = "who01" | "grain02" | "who02" | "period03" | "scope05";

export type FormItem =
  | { readonly type: "blank"; readonly blank: Blank }
  | { readonly type: "fixed"; readonly line: FixedLine };

export interface DefinitionRequest {
  readonly id: DefinitionRequestId;
  readonly caseId: DefinitionCase;
  /** Shown fieldsets, in panel order. */
  readonly blanks: readonly Blank[];
  readonly options: { readonly [B in Blank]?: readonly BlankValues[B][] };
  /** Fieldsets and fixed lines in the order they are printed. */
  readonly items: readonly FormItem[];
  /** The database check. */
  readonly truth: readonly Row[];
  /** One canonical right definition (tests and the e2e loop). */
  readonly canonical: Definition;
  readonly figure: "bathtub" | "baseFrame" | "widths";
}

export type Behavior = "answer" | "answerWarn" | "askBack" | "refuse";
/** The deck appendix names, exactly. */
export type Lock = "guide" | "coursePolicy" | "sqlGuard" | "postgresRole";
export type FreshTick = "loadedAt" | "age" | "warnAfter" | "definition" | "expiry48" | "ageFromToday";
export type Gap = "kind" | "grain" | "period" | "table";

export interface TriageCardSpec {
  readonly id: TriageCard;
  readonly expected: Behavior;
  readonly followUp?: "gaps" | "lock" | "freshTicks";
}

export interface TriageChoice {
  readonly behavior?: Behavior;
  /** C01, in the order of GAPS. */
  readonly gaps?: readonly Gap[];
  /** R02. */
  readonly lock?: Lock;
  /** F01, in the order of FRESH_TICKS. */
  readonly ticks?: readonly FreshTick[];
}

export type Value =
  | { readonly unit: "eur"; readonly amount: number }
  /** den 0 → "keine Quote". digits: shown decimals (default 1). */
  | { readonly unit: "rate"; readonly num: number; readonly den: number; readonly digits?: 1 | 2 }
  /** 3,12 % and 9,8 %: no honest numerator or denominator exists. */
  | { readonly unit: "averagedRate"; readonly pct: number; readonly digits?: 1 | 2 }
  | {
      readonly unit: "count";
      readonly n: number;
      readonly signed?: boolean;
      readonly noun: "accounts" | "people";
    };

export type RowLabel =
  | "2026-03"
  | "2026-04"
  | "2026-05"
  | "2026-06"
  | "Q2"
  | "allSegments"
  | "Enterprise"
  | "Mid-Market"
  | "SMB"
  | "company";

export interface Row {
  readonly label: RowLabel;
  readonly value: Value;
}

export type Verdict = "correct" | "rightNumberWrongDef" | "wrong" | "open";

export type RuleId =
  // shared
  | "incomplete"
  | "contradiction"
  | "levelSummed"
  | "notARate"
  // 01
  | "g01Correct"
  | "noteSmallestView"
  | "tableStoresChange"
  | "changeForLevel"
  | "lastLevelOnly"
  // 02
  | "g02CorrectSum"
  | "g02CorrectBathtub"
  | "changeDiff"
  | "changeLastOnly"
  | "levelForChange"
  | "exportLucky"
  | "billingDuplicates"
  // 03
  | "g03Correct"
  | "baseJoiners"
  | "baseEnd"
  | "statusCodes"
  | "singleForSegments"
  // 05
  | "hcCorrect"
  | "hcMonthlyAveraged"
  | "hcDeptAveraged"
  | "hcExportNoCounts"
  | "hcBaseUnwritten";

export type TriageRuleId =
  | "tIncomplete"
  | "tG01Correct"
  | "tG01Wrong"
  | "tC01Correct"
  | "tC01Wrong"
  | "tC01Gaps"
  | "tR01Correct"
  | "tR01Wrong"
  | "tR02Correct"
  | "tR02Wrong"
  | "tR02Lock"
  | "tF01Correct"
  | "tF01Wrong"
  | "tF01Missing"
  | "tF01Invented";

export type Reading =
  | "none"
  | "levels"
  | "changes"
  | "stackLevels"
  | "lastLevel"
  | "lastChange"
  | "changeSum"
  | "endMinusStart"
  | "changeDiff"
  | "billingSum"
  | "noRows"
  | "base:startOfQuarter"
  | "base:startPlusJoiners"
  | "base:endOfQuarter"
  | "zeroBase"
  | "counts"
  | "pooled"
  | "deptAveraged"
  | "monthlyAveraged"
  | "averageBase"
  | "exportNoCounts";

/** Raw values a rule text interpolates; the copy layer formats them. */
export interface Params {
  readonly blanks?: readonly Blank[];
  readonly grain?: Grain;
  readonly period?: Period;
  readonly value?: Value;
}

export interface Receipt {
  readonly verdict: Verdict;
  readonly rule: RuleId;
  /** noteSmallestView only. */
  readonly note?: RuleId;
  /** What the definition gives (may be empty). */
  readonly rows: readonly Row[];
  /** The database check. */
  readonly truth: readonly Row[];
  readonly reading: Reading;
  /** The blank of the first broken rule: from attempt 2 when not correct; always when open. */
  readonly changeBlank?: Blank;
  readonly params: Params;
  /** The rows equal a recorded AI answer, or a kit "plausible, not recorded" answer. */
  readonly origin?: "recorded" | "plausible";
  readonly attempt: number;
}

export interface TriageReceipt {
  readonly verdict: Verdict;
  /** The behaviour part: right, wrong, or not chosen yet. */
  readonly behavior: "right" | "wrong" | "open";
  /** The follow-up part, when the card has one and the behaviour is right. */
  readonly followUp?: "right" | "wrong" | "open";
  /** One or two why lines. */
  readonly rules: readonly TriageRuleId[];
  readonly params: {
    readonly lock?: Lock;
    readonly missing?: readonly FreshTick[];
    readonly invented?: readonly FreshTick[];
    readonly open?: "behavior" | "lock";
  };
  readonly attempt: number;
}

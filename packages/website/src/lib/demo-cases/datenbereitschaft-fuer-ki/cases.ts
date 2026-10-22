/**
 * The four definition requests and the five triage cards (spec section 3.4).
 * Option order is deliberate: the canonical value sits at a different index
 * per blank, so picking the first chip everywhere never solves a request.
 */
import { ENDING_MRR, FOLDLINE, HEADCOUNT, Q2_MONTHS } from "./data";
import type {
  Blank,
  DefinitionRequest,
  DefinitionRequestId,
  FormItem,
  FreshTick,
  Gap,
  Lock,
  Behavior,
  RequestId,
  Row,
  TriageCard,
  TriageCardSpec,
} from "./model";

const blank = (b: Blank): FormItem => ({ type: "blank", blank: b });

const LEVEL_ROWS: readonly Row[] = Q2_MONTHS.map((month) => ({
  label: month,
  value: { unit: "eur", amount: ENDING_MRR[month] },
}));

const SEGMENT_TRUTH: readonly Row[] = FOLDLINE.segments.map((segment) => ({
  label: segment,
  value: { unit: "rate", num: FOLDLINE.churnedQ2, den: FOLDLINE.activeEndOfMarch },
}));

export const REQ_01: DefinitionRequest = {
  id: "01",
  caseId: "G01",
  blanks: ["kind", "grain", "period", "table"],
  options: {
    kind: ["change", "level"],
    grain: ["perMonth", "single"],
    period: ["sumMonths", "eachMonth", "lastMonth"],
    table: ["public.monthly_revenue", "analytics.account_mrr_monthly", "analytics.mrr_summary_monthly"],
  },
  items: [blank("kind"), blank("grain"), blank("period"), blank("table"), { type: "fixed", line: "who01" }],
  truth: LEVEL_ROWS,
  canonical: { kind: "level", grain: "perMonth", period: "eachMonth", table: "analytics.mrr_summary_monthly" },
  figure: "bathtub",
};

export const REQ_02: DefinitionRequest = {
  id: "02",
  caseId: "G02",
  blanks: ["kind", "period", "table"],
  options: {
    kind: ["level", "change"],
    period: ["endMinusStart", "lastMonth", "sumMonths"],
    table: ["public.billing_events", "analytics.mrr_summary_monthly", "public.monthly_revenue"],
  },
  items: [
    blank("kind"),
    { type: "fixed", line: "grain02" },
    blank("period"),
    blank("table"),
    { type: "fixed", line: "who02" },
  ],
  truth: [{ label: "Q2", value: { unit: "eur", amount: FOLDLINE.netNewQ2 } }],
  canonical: { kind: "change", period: "sumMonths", table: "analytics.mrr_summary_monthly" },
  figure: "bathtub",
};

export const REQ_03: DefinitionRequest = {
  id: "03",
  caseId: "G03",
  blanks: ["kind", "grain", "table", "base"],
  options: {
    kind: ["level", "change", "rate"],
    grain: ["perSegment", "single"],
    table: ["public.acct_history", "analytics.logo_churn_by_segment_quarter"],
    base: ["startPlusJoiners", "startOfQuarter", "endOfQuarter"],
  },
  items: [blank("kind"), blank("grain"), { type: "fixed", line: "period03" }, blank("table"), blank("base")],
  truth: SEGMENT_TRUTH,
  canonical: {
    kind: "rate",
    grain: "perSegment",
    table: "analytics.logo_churn_by_segment_quarter",
    base: "startOfQuarter",
  },
  figure: "baseFrame",
};

export const REQ_05: DefinitionRequest = {
  id: "05",
  caseId: "HC01",
  blanks: ["kind", "table", "combine", "base"],
  options: {
    kind: ["level", "change", "rate"],
    table: ["export_lane.hc_monthly", "analytics.attrition_by_department_quarter"],
    combine: ["averageRates", "pool"],
    base: ["startOfQuarter", "averageHeadcount"],
  },
  items: [blank("kind"), { type: "fixed", line: "scope05" }, blank("table"), blank("combine"), blank("base")],
  truth: [
    {
      label: "company",
      value: { unit: "rate", num: HEADCOUNT.leaversQ2, den: HEADCOUNT.startingHeadcount },
    },
  ],
  canonical: {
    kind: "rate",
    table: "analytics.attrition_by_department_quarter",
    combine: "pool",
    base: "startOfQuarter",
  },
  figure: "widths",
};

export const DEFINITION_REQUESTS: Readonly<Record<DefinitionRequestId, DefinitionRequest>> = {
  "01": REQ_01,
  "02": REQ_02,
  "03": REQ_03,
  "05": REQ_05,
};

export const REQUEST_IDS = ["01", "02", "03", "04", "05"] as const satisfies readonly RequestId[];

export const BEHAVIORS = ["answer", "answerWarn", "askBack", "refuse"] as const satisfies readonly Behavior[];
export const GAPS = ["kind", "grain", "period", "table"] as const satisfies readonly Gap[];
export const LOCKS = ["guide", "coursePolicy", "sqlGuard", "postgresRole"] as const satisfies readonly Lock[];
export const FRESH_TICKS = [
  "loadedAt",
  "age",
  "warnAfter",
  "definition",
  "expiry48",
  "ageFromToday",
] as const satisfies readonly FreshTick[];
export const REQUIRED_TICKS = ["loadedAt", "age", "warnAfter", "definition"] as const satisfies readonly FreshTick[];
export const INVENTED_TICKS = ["expiry48", "ageFromToday"] as const satisfies readonly FreshTick[];

export const TRIAGE_CARDS: readonly TriageCardSpec[] = [
  { id: "G01", expected: "answer" },
  { id: "C01", expected: "askBack", followUp: "gaps" },
  { id: "R01", expected: "refuse" },
  { id: "R02", expected: "refuse", followUp: "lock" },
  { id: "F01", expected: "answerWarn", followUp: "freshTicks" },
];

export const TRIAGE_IDS = TRIAGE_CARDS.map((card) => card.id) as readonly TriageCard[];

export function triageCard(id: TriageCard): TriageCardSpec {
  const card = TRIAGE_CARDS.find((candidate) => candidate.id === id);
  if (!card) throw new Error(`Unknown triage card ${id}`);
  return card;
}

/** Section and card anchors, the same in DE and EN. */
export const requestAnchor = (id: RequestId): string => `anfrage-${id}`;
export const cardAnchor = (id: TriageCard): string => `anfrage-04-${id.toLowerCase()}`;
export const TAKEAWAYS_ANCHOR = "mitnehmen";

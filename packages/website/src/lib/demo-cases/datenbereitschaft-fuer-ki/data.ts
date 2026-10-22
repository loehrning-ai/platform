/**
 * The facts behind demo 03 "Mach die Zahl richtig.", taken from the
 * Workshop 03 kit (public/workshops/datenbereitschaft-fuer-ki/). Every value
 * names its origin class from builder/warehouse/seed/SEED-FACTS.md:
 *
 * - DECK: a fixed fact shown in the workshop.
 * - RECORDED: what an AI answered in the August 2026 recording, one run each.
 * - EXPORT-LANE CHECK: the deck's own database checks on the export tables.
 * - PACK: builder/domains/PEOPLE-HEADCOUNT.md and domains/sql/people_headcount.sql
 *   (synthetic, "no real people"); its wrong answers are "plausible, not recorded".
 * - DERIVED: arithmetic on the values above, never called a recorded value.
 *
 * GENERATED seed values (MRR components, per-month account moves, segment
 * splits) are never used: SEED-FACTS says "never quote as workshop facts".
 * data.test.ts parses the kit files and pins every number here.
 */

export type Month = "2026-03" | "2026-04" | "2026-05" | "2026-06";
export const Q2_MONTHS = ["2026-04", "2026-05", "2026-06"] as const satisfies readonly Month[];

/** Ending MRR in EUR, a level (DECK, mrr_summary_monthly.csv ending_mrr_eur). */
export const ENDING_MRR: Readonly<Record<Month, number>> = {
  "2026-03": 354_635,
  "2026-04": 334_675,
  "2026-05": 344_450,
  "2026-06": 387_015,
};

/** Net new MRR in EUR, a change (DECK, mrr_summary_monthly.csv net_new_mrr_eur). */
export const NET_NEW_MRR: Readonly<Record<Month, number>> = {
  "2026-03": 60_160,
  "2026-04": -19_960,
  "2026-05": 9_775,
  "2026-06": 42_565,
};

export const FOLDLINE = {
  accounts: 144, // DECK
  /** Net new MRR Q2 = 387,015 − 354,635 (DECK, SEED-FACTS, CHECK-YOUR-RESULT). */
  netNewQ2: 32_380,
  /** The three Q2 levels added: "describes nothing" (DECK counter-example). */
  levelsSummedQ2: 1_066_140,
  /** June's change minus March's change, treated as levels (RECORDED). */
  recordedChangeDiff: -17_595,
  /** billing_events Q2 sum with retry copies (−225) and pending sign-ups (−5,100) (EXPORT-LANE CHECK). */
  billingEventsQ2: 27_055,
  billingRetryDelta: -225,
  billingPending: 5_100,
  segments: ["Enterprise", "Mid-Market", "SMB"] as const,
  /** Per segment (DECK): 40 active end of March, 4 churned, 8 joined, 44 active end of June. */
  activeEndOfMarch: 40,
  churnedQ2: 4,
  joinedQ2: 8,
  activeEndOfJune: 44,
  /** Runs on the approved views that cited the definition (DECK contract-consumers). */
  citedRuns: 0,
  recordedRunsOnViews: 3,
  /** Permission denied on the forced read (DECK appendix, D01). */
  sqlstateDenied: "42501",
} as const;

/** The clock and the data status (DECK; data_status_by_view.csv). */
export const FRESHNESS = {
  clock: "2026-07-01T09:00:00Z",
  loadedAt: "2026-07-01T06:00:00Z",
  ageHours: 3,
  warnAfterHours: 36,
  /** Empty in data_status_by_view.csv: no expiry was written. */
  hardExpiryHours: null,
  owner: "revenue_analytics",
  definitionVersion: "1.0.0",
  /** The what-if clock of card F01 (DECK freshness, FOLDLINE-SCENARIOS F01). */
  whatIfClock: "2026-07-03T18:00:00Z",
  whatIfAgeHours: 60,
  /** The invented expiry of the kit's failure table (CHECK-YOUR-RESULT). */
  inventedExpiryHours: 48,
} as const;

export const DERIVED = {
  /** 387,015 ÷ 42,565 = 9.09: "mehr als das Neunfache" on card C01. */
  levelOverChangeJune: ENDING_MRR["2026-06"] / NET_NEW_MRR["2026-06"],
} as const;

/** The transfer firm of request 05 (PACK). */
export const HEADCOUNT = {
  /** Month-end headcount, a level. */
  level: { "2026-03": 200, "2026-04": 206, "2026-05": 202, "2026-06": 206 } as Readonly<Record<Month, number>>,
  hiresQ2: 25,
  leaversQ2: 19,
  netQ2: 6,
  startingHeadcount: 200,
  /** (200 + 206 + 202 + 206) / 4 */
  averageHeadcount: 203.5,
  departments: [
    { id: "engineering", start: 80, leavers: 6, ratePct: 7.5 },
    { id: "sales", start: 60, leavers: 7, ratePct: 11.7 },
    { id: "support", start: 40, leavers: 4, ratePct: 10.0 },
    { id: "other", start: 20, leavers: 2, ratePct: 10.0 },
  ],
  /** The four department rates averaged (PACK counter-example). */
  departmentRatesAveragedPct: 9.8,
  /** export_lane.hc_monthly.attrition for April to June (PACK). */
  monthlyExportRatesPct: { "2026-04": 2.0, "2026-05": 2.91, "2026-06": 4.46 } as const,
  /** AVG(attrition) over the three export rows (PACK). */
  monthlyRatesAveragedPct: 3.12,
} as const;

export type DepartmentId = (typeof HEADCOUNT.departments)[number]["id"];

export type TableId =
  | "analytics.mrr_summary_monthly"
  | "analytics.account_mrr_monthly"
  | "analytics.logo_churn_by_segment_quarter"
  | "analytics.attrition_by_department_quarter"
  | "public.monthly_revenue"
  | "public.billing_events"
  | "public.acct_history"
  | "export_lane.hc_monthly";

export interface TableInfo {
  readonly id: TableId;
  /** analytics.* only. */
  readonly approved: boolean;
}

export const TABLES: Readonly<Record<TableId, TableInfo>> = {
  "analytics.mrr_summary_monthly": { id: "analytics.mrr_summary_monthly", approved: true },
  "analytics.account_mrr_monthly": { id: "analytics.account_mrr_monthly", approved: true },
  "analytics.logo_churn_by_segment_quarter": {
    id: "analytics.logo_churn_by_segment_quarter",
    approved: true,
  },
  "analytics.attrition_by_department_quarter": {
    id: "analytics.attrition_by_department_quarter",
    approved: true,
  },
  "public.monthly_revenue": { id: "public.monthly_revenue", approved: false },
  "public.billing_events": { id: "public.billing_events", approved: false },
  "public.acct_history": { id: "public.acct_history", approved: false },
  "export_lane.hc_monthly": { id: "export_lane.hc_monthly", approved: false },
};

/** Sum of a month record over the Q2 months. */
export function sumQ2(record: Readonly<Record<Month, number>>): number {
  return Q2_MONTHS.reduce((total, month) => total + record[month], 0);
}

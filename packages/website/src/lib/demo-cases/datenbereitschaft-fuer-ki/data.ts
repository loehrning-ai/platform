/**
 * The facts behind demo 03 "Die Fragekarte", each taken from a file of the
 * Workshop 03 kit (public/workshops/datenbereitschaft-fuer-ki/
 * data-readiness-kit/). data.test.ts reads those files and pins every value,
 * so the demo cannot drift from the kit. Origin classes:
 *
 * - KIT: a value in a kit data file (CSV).
 * - RECORDED: what Claude answered in a kept run (builder/claude-demo/AI-RUN-LOG.md).
 * - DERIVED: arithmetic on the values above, never called a recorded value.
 */

import CUSTOMER_STATUS from "./customer-status.json";

export type Month = "2026-04" | "2026-05" | "2026-06";
export const QUARTER: readonly Month[] = ["2026-04", "2026-05", "2026-06"];

/** Ending MRR on 31 December 2025, in EUR (KIT, mrr_summary_monthly.csv row 2025-12-01). In no export file. */
export const OPENING_DEC_2025 = 258_785;

/** Net new MRR per month of 2026, January to June, in EUR (KIT, mrr_summary_monthly.csv net_new_mrr_eur). */
export const NET_NEW_2026: readonly number[] = [14_210, 21_480, 60_160, -19_960, 9_775, 42_565];

/** Ending MRR, the level at each month end, in EUR (KIT, mrr_summary_monthly.csv ending_mrr_eur). */
export const ENDING_MRR = {
  "2026-03": 354_635,
  "2026-04": 334_675,
  "2026-05": 344_450,
  "2026-06": 387_015,
} as const;

/** Active accounts at month end (KIT, mrr_summary_monthly.csv active_accounts). */
export const ACTIVE_ACCOUNTS = { "2026-03": 120, "2026-06": 132 } as const;

/** The approved view of the example and the column the answer must come from. */
export const APPROVED_VIEW = "analytics.mrr_summary_monthly";
export const APPROVED_COLUMN = "ending_mrr_eur";

/** One row of the export file monthly_revenue.csv (KIT, 18 rows). */
export interface ExportRow {
  readonly dt: string;
  readonly segment: "Enterprise" | "Mid-Market" | "SMB";
  readonly amount: number;
}

export const EXPORT_ROWS: readonly ExportRow[] = [
  { dt: "2026-01-01", segment: "Enterprise", amount: 5685 },
  { dt: "2026-01-01", segment: "Mid-Market", amount: 4555 },
  { dt: "2026-01-01", segment: "SMB", amount: 3970 },
  { dt: "2026-02-01", segment: "Enterprise", amount: 15780 },
  { dt: "2026-02-01", segment: "Mid-Market", amount: 4030 },
  { dt: "2026-02-01", segment: "SMB", amount: 1670 },
  { dt: "2026-03-01", segment: "Enterprise", amount: 34285 },
  { dt: "2026-03-01", segment: "Mid-Market", amount: 15790 },
  { dt: "2026-03-01", segment: "SMB", amount: 10085 },
  { dt: "2026-04-01", segment: "Enterprise", amount: -13285 },
  { dt: "2026-04-01", segment: "Mid-Market", amount: -3080 },
  { dt: "2026-04-01", segment: "SMB", amount: -3595 },
  { dt: "2026-05-01", segment: "Enterprise", amount: 760 },
  { dt: "2026-05-01", segment: "Mid-Market", amount: 5880 },
  { dt: "2026-05-01", segment: "SMB", amount: 3135 },
  { dt: "2026-06-01", segment: "Enterprise", amount: 21230 },
  { dt: "2026-06-01", segment: "Mid-Market", amount: 16785 },
  { dt: "2026-06-01", segment: "SMB", amount: 4550 },
];

/**
 * The column `status` of customer_master.csv, one code per account in file
 * order (KIT): A active, C cancelled, N new. 108 A, 12 C, 24 N.
 */
export const STATUS: string = CUSTOMER_STATUS.status;

/** Claude's recorded answer, chat with two export files (RECORDED, 2 of 2 kept rehearsal runs). */
export const CLAUDE_ANSWER: readonly number[] = [75_890, 85_665, 128_230];

/** The seven export tables of the course (KIT, builder/warehouse/sql/10_export_lane.sql). */
export const EXPORT_TABLES = [
  "customer_master",
  "subscription_export",
  "billing_events",
  "monthly_revenue",
  "acct_history",
  "usage_log",
  "tickets",
] as const;
export type ExportTable = (typeof EXPORT_TABLES)[number];

/**
 * One month of the approved view mrr_summary_monthly.csv (KIT,
 * builder/claude/project/, 18 rows, January 2025 to June 2026). The company's
 * first subscriptions start in January 2025, so the tub is empty before it:
 * ending of 2025-01 equals its net new MRR (data.test.ts).
 */
export interface SummaryRow {
  /** "YYYY-MM" of month_start. */
  readonly month: string;
  /** ending_mrr_eur: the level at month end. */
  readonly ending: number;
  /** net_new_mrr_eur: the change during the month. */
  readonly netNew: number;
  /** active_accounts at month end. */
  readonly active: number;
}

export const SUMMARY: readonly SummaryRow[] = [
  { month: "2025-01", ending: 23545, netNew: 23545, active: 9 },
  { month: "2025-02", ending: 40590, netNew: 17045, active: 17 },
  { month: "2025-03", ending: 61480, netNew: 20890, active: 25 },
  { month: "2025-04", ending: 84225, netNew: 22745, active: 34 },
  { month: "2025-05", ending: 106630, netNew: 22405, active: 42 },
  { month: "2025-06", ending: 123015, netNew: 16385, active: 50 },
  { month: "2025-07", ending: 145390, netNew: 22375, active: 59 },
  { month: "2025-08", ending: 167965, netNew: 22575, active: 67 },
  { month: "2025-09", ending: 190110, netNew: 22145, active: 75 },
  { month: "2025-10", ending: 213720, netNew: 23610, active: 84 },
  { month: "2025-11", ending: 234605, netNew: 20885, active: 92 },
  { month: "2025-12", ending: 258785, netNew: 24180, active: 100 },
  { month: "2026-01", ending: 272995, netNew: 14210, active: 104 },
  { month: "2026-02", ending: 294475, netNew: 21480, active: 108 },
  { month: "2026-03", ending: 354635, netNew: 60160, active: 120 },
  { month: "2026-04", ending: 334675, netNew: -19960, active: 123 },
  { month: "2026-05", ending: 344450, netNew: 9775, active: 123 },
  { month: "2026-06", ending: 387015, netNew: 42565, active: 132 },
];

/** The month ends the tub can show: December 2024 (empty) to June 2026, 19 in all. */
export const FIRST_MONTH = "2025-01";
export const EXPORT_FIRST_MONTH = "2026-01";

/**
 * The two kept rehearsal runs of case G01 (RECORDED, builder/claude-demo/
 * AI-RUN-LOG.md rows A, G01, 1 and 2). Both gave the same three values; the
 * log quotes the caveat of run 2 only and says where each caveat stood.
 */
export interface RehearsalRun {
  readonly run: 1 | 2;
  readonly values: readonly number[];
  readonly caveat: "before" | "after";
  /** The caveat as the log quotes it, or null when the log only describes it. */
  readonly quote: string | null;
}

export const REHEARSAL_RUNS: readonly RehearsalRun[] = [
  { run: 1, values: CLAUDE_ANSWER, caveat: "before", quote: null },
  { run: 2, values: CLAUDE_ANSWER, caveat: "after", quote: "MRR added since 1 Jan 2026, not total MRR" },
];

/** Active accounts at 30 June that run 2 named (RECORDED, AI-RUN-LOG.md row A, G01, 2: "said 120 active at 30 June"). */
export const RUN2_ACTIVE = 120;

/** The expected values of test T1 (KIT, claude/PRUEFLISTE-VORLAGE.md and CHECK-YOUR-RESULT.md "The truth"). */
export const T1_EXPECTED: readonly number[] = [ENDING_MRR["2026-04"], ENDING_MRR["2026-05"], ENDING_MRR["2026-06"]];

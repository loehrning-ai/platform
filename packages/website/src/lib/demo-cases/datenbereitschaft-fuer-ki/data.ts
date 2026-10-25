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
export const STATUS =
  "AAAAAAAACAAAAAAAAAAACAAACCAAAAAAAAAAAAAACAAAAAAAAACAAACCAAAAAAAAAAAAAAACCCAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAANNNNNNNNNNNNNNNNNNNNNNNN";

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

/** The three traps the demo pins to a row of builder/ANTI-PATTERNS.md. */
export const TABLE_TRAPS: Readonly<Partial<Record<ExportTable, "AP-N01" | "AP-S03" | "AP-S04">>> = {
  monthly_revenue: "AP-N01",
  subscription_export: "AP-S03",
  billing_events: "AP-S04",
};

/** Load time of the approved files and the warning threshold (KIT, data_status_by_view.csv). */
export const LOAD_UTC = "2026-07-01T06:00:00Z";
export const WARN_AFTER_H = 36;
/** The two clocks of the course: the evaluation clock and the what-if clock of case F01. */
export const CLOCK_UTC = "2026-07-01T09:00:00Z";
export const F01_CLOCK_UTC = "2026-07-03T18:00:00Z";

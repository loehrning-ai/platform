/**
 * The real NORTHWIND figures behind the Monatsgrenze demo, derived from the
 * workshop kit (northwind-analyst-kit.zip): data/demand_actuals.csv joined to
 * data/product_lines.csv on (line, model_code) taken from the sku
 * `NW-<LINE>-<code>-...`; revenue = units x base_price_eur. All 2.115 rows join.
 * A week belongs to the month its start date is in (week_start before
 * 2023-09-01 is August). data.test.ts re-derives every number from the zip.
 */
export type LineId = "AURA" | "ECHO" | "NEST" | "BEAM" | "PULSE" | "CRAFT" | "BREW";

export interface ShipWeek {
  /** ISO start date of the shipping week (a Saturday). */
  readonly start: string;
  readonly revenueEur: number;
  readonly units: number;
}

export const WEEKS: readonly ShipWeek[] = [
  { start: "2023-08-05", revenueEur: 4295459, units: 27881 },
  { start: "2023-08-12", revenueEur: 4442950, units: 27780 },
  { start: "2023-08-19", revenueEur: 4042856, units: 26404 },
  { start: "2023-08-26", revenueEur: 4452382, units: 28308 },
  { start: "2023-09-02", revenueEur: 4409249, units: 28161 },
  { start: "2023-09-09", revenueEur: 4307325, units: 27815 },
  { start: "2023-09-16", revenueEur: 4293319, units: 27611 },
  { start: "2023-09-23", revenueEur: 4202199, units: 26661 },
  { start: "2023-09-30", revenueEur: 4475452, units: 28808 },
] as const;

/** Defect records (NCR feed, data/ncr_records.csv) and shipped units per line and month. */
export interface DefectRow {
  readonly line: LineId;
  readonly augRecords: number;
  readonly sepRecords: number;
  readonly augUnits: number;
  readonly sepUnits: number;
}

export const DEFECTS: readonly DefectRow[] = [
  { line: "CRAFT", augRecords: 24, sepRecords: 23, augUnits: 7488, sepUnits: 9162 },
  { line: "NEST", augRecords: 12, sepRecords: 19, augUnits: 13467, sepUnits: 16770 },
  { line: "AURA", augRecords: 11, sepRecords: 18, augUnits: 33471, sepUnits: 42197 },
  { line: "PULSE", augRecords: 9, sepRecords: 11, augUnits: 12829, sepUnits: 15479 },
] as const;

/** Figures the workshop states; shown as stated, never re-derived from a price. */
export const WORKSHOP = {
  craftIntensityAug: 3.21,
  craftIntensitySep: 2.51,
  nextWorstMultiple: 2.2,
  scrapTriggerPct: 8,
  defaultTriggerPer1000: 2.51,
} as const;

/** The cuts the demo allows: at least three weeks on each side. */
export const CUTS = [3, 4, 5, 6] as const;
export const MIN_CUT = 3;
export const MAX_CUT = 6;
export const REPORT_CUT = 4;

/** Trigger range of the Act 2 line, per 1.000 units. */
export const TRIGGER = { min: 1, max: 3.5, step: 0.01, nudge: 0.1 } as const;

export const REVENUES: readonly number[] = WEEKS.map((week) => week.revenueEur);
export const UNITS: readonly number[] = WEEKS.map((week) => week.units);

/** The month of the NORTHWIND release trigger in Act 2 and the rules file (1 = January). */
export const EXAMPLE_TRIGGER_MONTH = 10;

/**
 * The NORTHWIND rows behind "Eine Datei, drei Antworten", copied from the
 * workshop kit (northwind-analyst-kit.zip and northwind-analyst-kit-de.zip,
 * whose CSVs are byte-identical). Every constant here is a row or a sum of
 * rows; data.test.ts re-derives each one from both zips, so the demo cannot
 * drift from the kit.
 *
 * Month rule (the kit's): a shipping week belongs to the month of its
 * week_start, an NCR to the month of its ncr_date.
 */

export type ModelCode = "E1" | "E2" | "G1";

/** CRAFT units shipped per week (demand_actuals.csv, sum of units_actual). */
export const CRAFT_WEEKS: readonly { readonly start: string; readonly units: number }[] = [
  { start: "2023-08-05", units: 1747 },
  { start: "2023-08-12", units: 2056 },
  { start: "2023-08-19", units: 1867 },
  { start: "2023-08-26", units: 1818 },
  { start: "2023-09-02", units: 1874 },
  { start: "2023-09-09", units: 1624 },
  { start: "2023-09-16", units: 1877 },
  { start: "2023-09-23", units: 1752 },
  { start: "2023-09-30", units: 2035 },
];

export type NcrType = "documentation" | "dimensional" | "weld_crack" | "surface_finish" | "fastener_torque";

/** One row of data/ncr_records.csv, as the stage needs it. */
export interface NcrRow {
  readonly id: string;
  readonly date: string;
  readonly machine: string;
  readonly type: NcrType;
  readonly qty: number;
  readonly scrap: boolean;
}

type RawNcr = readonly [string, string, string, NcrType, number, 0 | 1];

/** The 23 CRAFT NCRs of September 2023, in ncr_date order (ties by id). */
const SEP_RAW: readonly RawNcr[] = [
  ["000242", "09-02", "019", "surface_finish", 162, 0],
  ["000614", "09-02", "020", "documentation", 171, 1],
  ["000936", "09-02", "021", "weld_crack", 160, 1],
  ["001555", "09-02", "019", "weld_crack", 113, 0],
  ["002339", "09-02", "022", "weld_crack", 236, 1],
  ["000060", "09-09", "024", "surface_finish", 161, 1],
  ["001492", "09-09", "021", "surface_finish", 132, 0],
  ["001964", "09-09", "023", "documentation", 76, 0],
  ["001976", "09-09", "019", "documentation", 140, 0],
  ["000890", "09-16", "024", "dimensional", 162, 1],
  ["001477", "09-16", "020", "dimensional", 33, 1],
  ["001849", "09-16", "024", "dimensional", 18, 0],
  ["001860", "09-16", "023", "documentation", 27, 1],
  ["001975", "09-16", "022", "documentation", 196, 0],
  ["000035", "09-23", "023", "fastener_torque", 231, 0],
  ["000213", "09-23", "023", "documentation", 65, 1],
  ["000257", "09-23", "019", "fastener_torque", 154, 1],
  ["000896", "09-23", "024", "documentation", 47, 1],
  ["001275", "09-23", "023", "dimensional", 2, 0],
  ["001360", "09-23", "022", "weld_crack", 22, 1],
  ["001419", "09-23", "024", "weld_crack", 223, 0],
  ["002187", "09-23", "024", "documentation", 226, 1],
  ["000006", "09-30", "019", "dimensional", 75, 1],
];

export const CRAFT_NCR_SEP: readonly NcrRow[] = SEP_RAW.map(([id, date, machine, type, qty, scrap]) => ({
  id: `NCR-${id}`,
  date: `2023-${date}`,
  machine: `M-${machine}`,
  type,
  qty,
  scrap: scrap === 1,
}));

/** August, as sums (the stage draws only September's rows). */
export const CRAFT_NCR_AUG = {
  records: 24,
  affected: 2324,
  scrapped: 924,
  /** Records left after merging the same machine in the same week. */
  merged: 15,
} as const;

/** The 95 CRAFT rows of September in demand_actuals.csv, file order: [model, units_actual]. */
export const CRAFT_SEP_ROWS: readonly (readonly [ModelCode, number])[] = [
  ["E2", 164], ["E2", 154], ["E2", 145], ["E2", 141], ["E2", 192], ["E1", 294], ["E1", 232], ["E1", 314],
  ["E1", 369], ["E1", 367], ["G1", 294], ["G1", 204], ["G1", 395], ["G1", 256], ["G1", 368], ["E1", 43],
  ["E1", 44], ["E1", 46], ["E1", 18], ["E1", 44], ["E2", 95], ["E2", 93], ["E2", 87], ["E2", 97],
  ["E2", 66], ["G1", 37], ["G1", 68], ["G1", 68], ["G1", 47], ["G1", 62], ["G1", 19], ["G1", 25],
  ["G1", 20], ["G1", 21], ["G1", 21], ["E1", 41], ["E1", 39], ["E1", 31], ["E1", 41], ["E1", 42],
  ["G1", 30], ["G1", 29], ["G1", 27], ["G1", 24], ["G1", 24], ["E1", 132], ["E1", 98], ["E1", 120],
  ["E1", 124], ["E1", 82], ["E2", 112], ["E2", 90], ["E2", 85], ["E2", 72], ["E2", 157], ["G1", 42],
  ["G1", 38], ["G1", 27], ["G1", 34], ["G1", 32], ["G1", 49], ["G1", 45], ["G1", 49], ["G1", 39],
  ["G1", 79], ["G1", 36], ["G1", 21], ["G1", 27], ["G1", 34], ["G1", 22], ["E1", 134], ["E1", 96],
  ["E1", 108], ["E1", 118], ["E1", 130], ["E1", 32], ["E1", 26], ["E1", 27], ["E1", 39], ["E1", 27],
  ["E2", 254], ["E2", 263], ["E2", 238], ["E2", 217], ["E2", 251], ["G1", 35], ["G1", 26], ["G1", 26],
  ["G1", 27], ["G1", 34], ["G1", 31], ["G1", 33], ["G1", 37], ["G1", 34], ["G1", 35],
];

/** CRAFT's three models with list price (product_lines.csv). */
export const CRAFT_MODELS: readonly { readonly code: ModelCode; readonly price: number }[] = [
  { code: "E1", price: 449 },
  { code: "E2", price: 699 },
  { code: "G1", price: 199 },
];

/** Company totals per month (all lines, demand_actuals.csv joined to product_lines.csv). */
export const COMPANY = {
  units: { aug: 110373, sep: 139056 },
  revenueEur: { aug: 17233647, sep: 21687544 },
} as const;

/** Rows in demand_actuals.csv, all lines and weeks. */
export const DEMAND_ROWS = 2115;

/** What the September report states (reports/2023-09-monthly-report.md). */
export const REPORT = {
  /** §2, CRAFT revenue. */
  craftRevenueEur: 4124238,
  /** §2, CRAFT average price (revenue ÷ units), in cents. */
  avgPriceCents: 45015,
  /** §5, the VP's defect figures per 1.000 units. */
  vpDefectsAug: 3.21,
  vpDefectsSep: 2.51,
} as const;

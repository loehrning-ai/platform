/**
 * The NORTHWIND rows behind "Eine Datei, drei Antworten", copied from the
 * workshop kit (northwind-analyst-kit.zip and northwind-analyst-kit-de.zip,
 * whose CSVs are byte-identical). Every constant here is a row of a kit CSV
 * or a figure the report prints; data.test.ts re-derives each one from both
 * zips, so the demo cannot drift from the kit. Every other number on the page
 * is computed from these rows (definitions.ts, trace.ts, decide.ts).
 *
 * Month rule (the kit's): a shipping week belongs to the month of its
 * week_start, a quality record (NCR) to the month of its ncr_date. All nine
 * week_start values are Saturdays, and every CRAFT ncr_date is one of them.
 */

/** The product line the report argues about (the copy writes it as {line}). */
export const LINE = "CRAFT";

export type ModelCode = "E1" | "E2" | "G1";

/** The nine CRAFT shipping weeks in demand_actuals.csv (week_start, Saturday to Friday). */
export const WEEK_STARTS = ["2023-08-05", "2023-08-12", "2023-08-19", "2023-08-26", "2023-09-02", "2023-09-09", "2023-09-16", "2023-09-23", "2023-09-30"] as const;

export type WeekStart = (typeof WEEK_STARTS)[number];

/** One CRAFT SKU of demand_actuals.csv: units_actual per week, in WEEK_STARTS order. */
export interface SkuRow {
  readonly sku: string;
  readonly model: ModelCode;
  readonly units: readonly number[];
}

/** [sku without "NW-CRAFT-", units per week]; file order (the CSV is sorted by SKU, then week). */
const SKU_RAW: readonly (readonly [string, readonly number[]])[] = [
  ["E2-BLK-CH", [132, 154, 163, 148, 164, 154, 145, 141, 192]],
  ["E1-SLV-GB", [309, 415, 315, 324, 294, 232, 314, 369, 367]],
  ["G1-SLV-BE", [278, 373, 383, 346, 294, 204, 395, 256, 368]],
  ["E1-BLK-PL", [45, 36, 42, 54, 43, 44, 46, 18, 44]],
  ["E2-SLV-NL", [79, 93, 81, 62, 95, 93, 87, 97, 66]],
  ["G1-SLV-AT", [58, 72, 41, 40, 37, 68, 68, 47, 62]],
  ["G1-SLV-IT", [19, 22, 28, 15, 19, 25, 20, 21, 21]],
  ["E1-SLV-FI", [25, 46, 34, 41, 41, 39, 31, 41, 42]],
  ["G1-SLV-US", [20, 17, 19, 20, 30, 29, 27, 24, 24]],
  ["E1-BLK-CH", [127, 98, 113, 106, 132, 98, 120, 124, 82]],
  ["E2-BLK-SE", [126, 149, 121, 150, 112, 90, 85, 72, 157]],
  ["G1-BLK-DK", [36, 32, 40, 29, 42, 38, 27, 34, 32]],
  ["G1-SLV-DK", [59, 58, 60, 51, 49, 45, 49, 39, 79]],
  ["G1-SLV-SE", [45, 33, 27, 27, 36, 21, 27, 34, 22]],
  ["E1-SLV-NL", [93, 105, 124, 93, 134, 96, 108, 118, 130]],
  ["E1-SLV-NO", [43, 36, 30, 34, 32, 26, 27, 39, 27]],
  ["E2-BLK-BE", [192, 242, 174, 212, 254, 263, 238, 217, 251]],
  ["G1-BLK-GB", [27, 35, 32, 26, 35, 26, 26, 27, 34]],
  ["G1-BLK-FR", [34, 40, 40, 40, 31, 33, 37, 34, 35]],
];

/** The 19 CRAFT SKUs: 171 rows of demand_actuals.csv in all, 19 per week. */
export const CRAFT_SKUS: readonly SkuRow[] = SKU_RAW.map(([sku, units]) => ({
  sku: `NW-${LINE}-${sku}`,
  model: sku.slice(0, 2) as ModelCode,
  units,
}));

export type NcrType = "documentation" | "dimensional" | "weld_crack" | "surface_finish" | "fastener_torque";

/** One CRAFT row of data/ncr_records.csv. */
export interface NcrRow {
  readonly id: string;
  /** ncr_date, always a week_start. */
  readonly date: WeekStart;
  readonly machine: string;
  readonly type: NcrType;
  /** qty_affected. */
  readonly qty: number;
  /** scrap_or_rework is "scrap". */
  readonly scrap: boolean;
}

type RawNcr = readonly [string, string, string, NcrType, number, 0 | 1];

/** [ncr_id digits, ncr_date month and day, machine digits, ncr_type, qty_affected, 1 scrap or 0 rework], by date, then id. */
const NCR_RAW: readonly RawNcr[] = [
  ["000673", "08-05", "023", "fastener_torque", 77, 0],
  ["001091", "08-05", "023", "surface_finish", 108, 1],
  ["001796", "08-05", "020", "weld_crack", 39, 0],
  ["002159", "08-05", "022", "surface_finish", 109, 0],
  ["000103", "08-12", "021", "documentation", 223, 0],
  ["000992", "08-12", "019", "fastener_torque", 3, 1],
  ["001597", "08-12", "021", "dimensional", 70, 0],
  ["001945", "08-12", "022", "documentation", 177, 0],
  ["002092", "08-12", "022", "dimensional", 25, 1],
  ["002156", "08-12", "020", "documentation", 174, 1],
  ["000554", "08-19", "024", "surface_finish", 40, 1],
  ["000785", "08-19", "022", "fastener_torque", 34, 1],
  ["000826", "08-19", "022", "dimensional", 243, 0],
  ["001276", "08-19", "022", "documentation", 223, 1],
  ["001633", "08-19", "023", "documentation", 222, 0],
  ["001877", "08-19", "022", "surface_finish", 6, 0],
  ["002086", "08-19", "019", "fastener_torque", 124, 0],
  ["000125", "08-26", "019", "weld_crack", 189, 1],
  ["000661", "08-26", "022", "documentation", 4, 1],
  ["001264", "08-26", "022", "fastener_torque", 55, 1],
  ["001596", "08-26", "020", "surface_finish", 50, 0],
  ["002009", "08-26", "021", "documentation", 69, 1],
  ["002140", "08-26", "019", "surface_finish", 35, 0],
  ["002256", "08-26", "019", "documentation", 25, 0],
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

/** The 47 CRAFT quality records of August and September 2023, by ncr_date, then ncr_id. */
export const CRAFT_NCR: readonly NcrRow[] = NCR_RAW.map(([id, date, machine, type, qty, scrap]) => ({
  id: `NCR-${id}`,
  date: `2023-${date}` as WeekStart,
  machine: `M-${machine}`,
  type,
  qty,
  scrap: scrap === 1,
}));

/** CRAFT's three models with list price (product_lines.csv, base_price_eur). */
export const CRAFT_MODELS: readonly {
  readonly code: ModelCode;
  readonly price: number;
}[] = [
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

/** What the September report prints (reports/2023-09-monthly-report.md); data.test.ts finds each in both editions. */
export const REPORT = {
  /** Abschnitt 2, CRAFT revenue. */
  craftRevenueEur: 4124238,
  /** Abschnitt 2, CRAFT average price (revenue divided by units), in cents. */
  avgPriceCents: 45015,
  /** Abschnitt 2, CRAFT units against August, in tenths of a percent. */
  unitsGrowthPermille: 224,
  /** Abschnitt 5, the VP's defect figures per 1.000 units. */
  vpDefectsAug: 3.21,
  vpDefectsSep: 2.51,
  /** Abschnitt 6, the company's units per shipping week against August, in tenths of a percent. */
  companyWeekGrowthPermille: 8,
} as const;

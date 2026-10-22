/**
 * NORTHWIND, September against August 2023: the totals the Workshop 02 demo
 * reads. Every value is a total recomputed from the workshop kit
 * (public/workshops/geschaeftsberichte-mit-ki-lesen/northwind-analyst-kit.zip:
 * data/demand_actuals.csv, ncr_records.csv, product_lines.csv,
 * campaign_master.csv and reports/2023-09-monthly-report.md). NORTHWIND is
 * invented; no row here carries a person, a customer or a free-text field.
 *
 * One measure throughout: units. Revenue appears only as the report's own
 * euro figures, never as a growth rate.
 */

/** The seven shipping lines, in the report's revenue order (§2). */
export const LINE_IDS = ["AURA", "CRAFT", "ECHO", "NEST", "BREW", "PULSE", "BEAM"] as const;
export type LineId = (typeof LINE_IDS)[number];

export const MONTH_IDS = ["2023-08", "2023-09"] as const;
export type MonthId = (typeof MONTH_IDS)[number];

export interface LineMonth {
  readonly units: number;
  /** Production NCRs logged. null = no NCR logged ("keine Meldung"), never 0. */
  readonly ncr: number | null;
  /** Units scrapped on those NCRs. null when the line logged no NCR. */
  readonly scrapUnits: number | null;
}

export interface Month {
  readonly id: MonthId;
  /** Every `week_start` bucket of the month in the extract (all Saturdays). */
  readonly weekStarts: readonly string[];
  /** Company units per week start, same order as weekStarts. */
  readonly weeklyUnits: readonly number[];
  readonly lines: Readonly<Record<LineId, LineMonth>>;
}

export interface LineInfo {
  readonly id: LineId;
  /** List price band in euros, from product_lines.csv. */
  readonly priceBand: readonly [number, number];
  /** Month-over-month units as the report prints it (§2), in percent, one decimal. */
  readonly reportMomUnitsPct: number;
  /** September revenue as the report prints it (§2): units × list price. */
  readonly revenueSepEur: number;
}

export const LINES: readonly LineInfo[] = [
  { id: "AURA", priceBand: [89, 399], reportMomUnitsPct: 26.1, revenueSepEur: 7_962_953 },
  { id: "CRAFT", priceBand: [199, 699], reportMomUnitsPct: 22.4, revenueSepEur: 4_124_238 },
  { id: "ECHO", priceBand: [79, 219], reportMomUnitsPct: 28.5, revenueSepEur: 3_162_514 },
  { id: "NEST", priceBand: [39, 219], reportMomUnitsPct: 24.5, revenueSepEur: 2_212_590 },
  { id: "BREW", priceBand: [49, 89], reportMomUnitsPct: 27.9, revenueSepEur: 2_068_796 },
  { id: "PULSE", priceBand: [59, 199], reportMomUnitsPct: 20.7, revenueSepEur: 1_910_901 },
  { id: "BEAM", priceBand: [19, 89], reportMomUnitsPct: 33.4, revenueSepEur: 245_552 },
];

export function lineInfo(id: LineId): LineInfo {
  const info = LINES.find((line) => line.id === id);
  if (!info) throw new Error(`Unknown line ${id}`);
  return info;
}

export const MONTHS: Readonly<Record<MonthId, Month>> = {
  "2023-08": {
    id: "2023-08",
    weekStarts: ["2023-08-05", "2023-08-12", "2023-08-19", "2023-08-26"],
    weeklyUnits: [27_881, 27_780, 26_404, 28_308],
    lines: {
      AURA: { units: 33_471, ncr: 11, scrapUnits: 133 },
      CRAFT: { units: 7_488, ncr: 24, scrapUnits: 924 },
      ECHO: { units: 14_989, ncr: null, scrapUnits: null },
      NEST: { units: 13_467, ncr: 12, scrapUnits: 399 },
      BREW: { units: 24_421, ncr: null, scrapUnits: null },
      PULSE: { units: 12_829, ncr: 9, scrapUnits: 463 },
      BEAM: { units: 3_708, ncr: null, scrapUnits: null },
    },
  },
  "2023-09": {
    id: "2023-09",
    weekStarts: ["2023-09-02", "2023-09-09", "2023-09-16", "2023-09-23", "2023-09-30"],
    weeklyUnits: [28_161, 27_815, 27_611, 26_661, 28_808],
    lines: {
      AURA: { units: 42_197, ncr: 18, scrapUnits: 656 },
      CRAFT: { units: 9_162, ncr: 23, scrapUnits: 1_539 },
      ECHO: { units: 19_256, ncr: null, scrapUnits: null },
      NEST: { units: 16_770, ncr: 19, scrapUnits: 1_100 },
      BREW: { units: 31_244, ncr: null, scrapUnits: null },
      PULSE: { units: 15_479, ncr: 11, scrapUnits: 375 },
      BEAM: { units: 4_948, ncr: null, scrapUnits: null },
    },
  },
};

/** The week starts October 2023 would have in the same extract (four Saturdays). */
export const OCTOBER_2023_WEEK_STARTS = [
  "2023-10-07",
  "2023-10-14",
  "2023-10-21",
  "2023-10-28",
] as const;

/** Company totals the report prints (§1, §2). */
export const REPORT = {
  revenueSepEur: 21_687_544,
  craftAvgPriceEur: 450.15,
  auraAvgPriceEur: 188.71,
} as const;

/** CRAFT's three list prices (G1, E1, E2). ncr_records.csv carries no model column. */
export const CRAFT_LIST_PRICES = [199, 449, 699] as const;
/** The plain mean of CRAFT's three list prices, used to value scrap. Not the report's Ø 450,15 €. */
export const CRAFT_MEAN_LIST_PRICE = 449;

/** Sum of budget_eur over every campaign in campaign_master.csv (no line column). */
export const MARKETING_TOTAL_EUR = 2_032_716;
/** First and last campaign start year in campaign_master.csv. */
export const MARKETING_START_YEARS = [2021, 2024] as const;

/** Rows of demand_actuals.csv in the extract. */
export const DEMAND_ROWS = { aug: 940, sep: 1_175, craftSep: 95 } as const;

/** NCRs on lines with at least one NCR, both months (ncr_records.csv has 127 rows). */
export const NCR_ROWS_TOTAL = 127;

/** The release trigger of slide 16. */
export const TRIGGER = { ratePer1000: 2.51, scrapShareOfRevenue: 0.08 } as const;

/* ------------------------------------------------------------------ */
/* Station 3: four figures as an answer could return them              */
/* ------------------------------------------------------------------ */

export type Truth = "match" | "differs" | "nowhere";
export const TRUTHS: readonly Truth[] = ["match", "differs", "nowhere"];

export type ClaimId = "craft-units" | "nest-ncr" | "craft-revenue" | "craft-marketing";

export type ClaimUnit = "units" | "count" | "eur";

/** One cell of a sample row: mono text, an integer or a euro amount. */
export type Cell =
  | { readonly t: "text"; readonly v: string }
  | { readonly t: "int"; readonly v: number }
  | { readonly t: "eur"; readonly v: number };

export interface Claim {
  readonly id: ClaimId;
  /** What the answer claims. */
  readonly value: number;
  readonly unit: ClaimUnit;
  readonly truth: Truth;
  /** What the source gives; null when no file can give it. */
  readonly sourceValue: number | null;
  /** Column names of the sample rows, as in the CSV header. */
  readonly header: readonly string[];
  /** Separator between cells of one row. */
  readonly separator: " · " | " ";
  /** Sample rows as printed. Empty for a claim no row can carry. */
  readonly rows: readonly (readonly Cell[])[];
  /** "+ n weitere Zeilen". */
  readonly more: number;
}

const t = (v: string): Cell => ({ t: "text", v });
const n = (v: number): Cell => ({ t: "int", v });
const eur = (v: number): Cell => ({ t: "eur", v });

/** Display order: the two "match" cards are not adjacent, so elimination does not work. */
export const CLAIMS: readonly Claim[] = [
  {
    id: "craft-units",
    value: 9_162,
    unit: "units",
    truth: "match",
    sourceValue: 9_162,
    header: ["week_start", "sku", "units_actual"],
    separator: " · ",
    rows: [
      [t("2023-09-02"), t("NW-CRAFT-E2-BLK-CH"), n(164)],
      [t("2023-09-16"), t("NW-CRAFT-E1-SLV-GB"), n(314)],
      [t("2023-09-30"), t("NW-CRAFT-G1-SLV-BE"), n(368)],
    ],
    more: 92,
  },
  {
    id: "nest-ncr",
    value: 12,
    unit: "count",
    truth: "differs",
    sourceValue: 19,
    header: ["ncr_id", "ncr_date", "line"],
    separator: " · ",
    rows: [
      [t("NCR-000042"), t("2023-09-02"), t("NEST")],
      [t("NCR-000142"), t("2023-09-09"), t("NEST")],
      [t("NCR-000269"), t("2023-09-23"), t("NEST")],
      [t("NCR-000405"), t("2023-09-23"), t("NEST")],
    ],
    more: 15,
  },
  {
    id: "craft-revenue",
    value: 4_124_238,
    unit: "eur",
    truth: "match",
    sourceValue: 4_124_238,
    header: ["units_actual", "×", "base_price_eur"],
    separator: " ",
    rows: [
      [n(164), t("×"), eur(699), t("="), eur(114_636)],
      [n(314), t("×"), eur(449), t("="), eur(140_986)],
      [n(368), t("×"), eur(199), t("="), eur(73_232)],
    ],
    more: 92,
  },
  {
    id: "craft-marketing",
    value: 290_388,
    unit: "eur",
    truth: "nowhere",
    sourceValue: null,
    header: ["campaign_id", "name", "channel", "start_date", "budget_eur"],
    separator: " · ",
    rows: [],
    more: 0,
  },
];

export function claimById(id: ClaimId): Claim {
  const claim = CLAIMS.find((entry) => entry.id === id);
  if (!claim) throw new Error(`Unknown claim ${id}`);
  return claim;
}

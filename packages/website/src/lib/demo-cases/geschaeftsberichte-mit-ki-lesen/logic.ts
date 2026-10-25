import { CUTS, DEFECTS, REVENUES, UNITS, type DefectRow } from "./data";

/** Pure math of the Monatsgrenze demo. No React, no clock, no random. */
export interface Group {
  readonly n: number;
  readonly total: number;
  readonly mean: number;
}

const group = (values: readonly number[]): Group => {
  const total = values.reduce((sum, value) => sum + value, 0);
  return { n: values.length, total, mean: values.length > 0 ? total / values.length : Number.NaN };
};

export const growth = (a: number, b: number): number => (a > 0 ? b / a - 1 : Number.NaN);

export const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** The two months when the line sits after `k` weeks. */
export function groups(values: readonly number[], k: number): { a: Group; b: Group } {
  return { a: group(values.slice(0, k)), b: group(values.slice(k)) };
}

/** The headline: month total against month total. */
export function headline(values: readonly number[], k: number): number {
  const { a, b } = groups(values, k);
  return growth(a.total, b.total);
}

/** The same comparison per week (mean against mean). */
export function perUnit(values: readonly number[], k: number): number {
  const { a, b } = groups(values, k);
  return growth(a.mean, b.mean);
}

const range = (list: readonly number[]): [number, number] => [Math.min(...list), Math.max(...list)];

/** Lowest and highest result over the allowed cuts, as headline and per week. */
export function cutSpan(
  values: readonly number[],
  ks: readonly number[] = CUTS,
): { head: [number, number]; per: [number, number] } {
  return {
    head: range(ks.map((k) => headline(values, k))),
    per: range(ks.map((k) => perUnit(values, k))),
  };
}

/** Share of the headline growth that the calendar explains: 1 - per week / headline. */
export function calendarShare(h: number, p: number): number | null {
  if (!Number.isFinite(h) || !Number.isFinite(p) || !(h > 0) || !(p < h)) return null;
  return clamp(1 - p / h, 0, 1);
}

export type Verdict = "calendar" | "mixed" | "real" | "reverse" | "shrinks" | "down" | "thin";

/** Per-unit growth above the headline by more than this (a tenth of a percentage point) means the calendar hides growth. */
export const REVERSE_MARGIN = 0.001;

/** Thresholds are printed on the page: >= 80 % calendar, 30 to 80 % mixed, below 30 % real. */
export function verdict(h: number, p: number): Verdict {
  if (!Number.isFinite(h) || !Number.isFinite(p)) return "thin";
  if (h <= 0) return "down";
  if (p <= 0) return "shrinks";
  if (p > h + REVERSE_MARGIN) return "reverse";
  const share = calendarShare(h, p) ?? 0;
  if (share >= 0.8) return "calendar";
  if (share >= 0.3) return "mixed";
  return "real";
}

export const per1000 = (records: number, units: number): number =>
  units > 0 ? (records / units) * 1000 : Number.NaN;

export const leadPct = (a: number, b: number): number => (b > 0 ? a / b - 1 : Number.NaN);

export interface DefectRate {
  readonly line: DefectRow["line"];
  readonly records: number;
  readonly rate: number;
}

/** September defect records and the rate per 1.000 units, in the given order. */
export function septemberRates(rows: readonly DefectRow[] = DEFECTS): readonly DefectRate[] {
  return rows.map((row) => ({
    line: row.line,
    records: row.sepRecords,
    rate: per1000(row.sepRecords, row.sepUnits),
  }));
}

/** CRAFT against the next-worst line: lead in records, and multiple per 1.000 units. */
export function craftComparison(rows: readonly DefectRow[] = DEFECTS) {
  const rates = septemberRates(rows);
  const craft = rates.find((entry) => entry.line === "CRAFT");
  const others = rates.filter((entry) => entry.line !== "CRAFT");
  const nextByRecords = others.reduce((best, entry) => (entry.records > best.records ? entry : best));
  const nextByRate = others.reduce((best, entry) => (entry.rate > best.rate ? entry : best));
  if (!craft) throw new Error("CRAFT missing from the defect rows");
  return {
    craft,
    nextByRecords,
    nextByRate,
    leadRecords: leadPct(craft.records, nextByRecords.records),
    multiple: craft.rate / nextByRate.rate,
  };
}

/** Number of Monday-to-Friday days in a month, minus holidays, at least 1. */
export function weekdaysInMonth(year: number, month1: number, holidays: number): number {
  const days = new Date(Date.UTC(year, month1, 0)).getUTCDate();
  let count = 0;
  for (let day = 1; day <= days; day += 1) {
    const weekday = new Date(Date.UTC(year, month1 - 1, day)).getUTCDay();
    if (weekday !== 0 && weekday !== 6) count += 1;
  }
  return Math.max(1, count - Math.max(0, Math.floor(holidays)));
}

/** Number of calendar days in a month, minus days off, at least 1. */
export function calendarDaysInMonth(year: number, month1: number, daysOff: number): number {
  const days = new Date(Date.UTC(year, month1, 0)).getUTCDate();
  return Math.max(1, days - Math.max(0, Math.floor(daysOff)));
}

export type FieldId = "aVal" | "aN" | "bVal" | "bN";

export interface CompareInput {
  readonly aVal: number | null;
  readonly aN: number | null;
  readonly bVal: number | null;
  readonly bN: number | null;
}

/** Beyond these the input is almost surely the wrong field (pieces for weeks) or another scale: say so instead of printing nonsense. */
export const MAX_COUNT = 400;
/** +10.000 %. */
export const MAX_GROWTH = 100;

export type CompareResult =
  | {
      readonly ok: false;
      readonly missing: readonly FieldId[];
      /** Set when the numbers are all there but implausible; `flagged` names the fields to check. */
      readonly implausible?: "count" | "growth";
      readonly flagged?: readonly FieldId[];
    }
  | {
      readonly ok: true;
      readonly h: number;
      readonly p: number;
      readonly s: number | null;
      readonly verdict: Verdict;
      readonly aPer: number;
      readonly bPer: number;
      /** Units of B beyond A (positive when B is longer). */
      readonly extra: number;
    };

/** The visitor's own comparison. A missing or non-positive field is named, never guessed. */
export function compare(input: CompareInput): CompareResult {
  const checks: readonly [FieldId, number | null][] = [
    ["aVal", input.aVal],
    ["aN", input.aN],
    ["bVal", input.bVal],
    ["bN", input.bN],
  ];
  const missing = checks.filter(([, value]) => value === null || !(value > 0)).map(([id]) => id);
  if (missing.length > 0) return { ok: false, missing };
  const { aVal, aN, bVal, bN } = input as { [K in FieldId]: number };
  const tooMany = (["aN", "bN"] as const).filter((id) => (id === "aN" ? aN : bN) > MAX_COUNT);
  if (tooMany.length > 0) return { ok: false, missing: [], implausible: "count", flagged: tooMany };
  const aPer = aVal / aN;
  const bPer = bVal / bN;
  const h = growth(aVal, bVal);
  const p = growth(aPer, bPer);
  if (h > MAX_GROWTH || p > MAX_GROWTH) return { ok: false, missing: [], implausible: "growth", flagged: ["aVal", "bVal"] };
  return { ok: true, h, p, s: calendarShare(h, p), verdict: verdict(h, p), aPer, bPer, extra: bN - aN };
}

/** Northwind helpers used by the stage. */
export const northwind = {
  headline: (k: number) => headline(REVENUES, k),
  perUnit: (k: number) => perUnit(REVENUES, k),
  unitsPerUnit: (k: number) => perUnit(UNITS, k),
  span: () => cutSpan(REVENUES),
};

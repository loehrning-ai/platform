/**
 * Every way this demo counts CRAFT's quality and demand, as pure functions of
 * the kit rows in data.ts. One function, reading(), turns a choice of
 * numerator, denominator, period, September end and merges into August,
 * September and the change between them; the trays, the scale and the Claude
 * notes all take their numbers from it. definitions.test.ts pins the results
 * to the kit's START-HERE expected values.
 */
import { COMPANY, CRAFT_NCR, CRAFT_SKUS, WEEK_STARTS, type NcrRow, type WeekStart } from "./data";

export type Month = "aug" | "sep";
/** Zähler: what is counted. */
export type Counter = "records" | "affected" | "scrapped";
/** Nenner: nothing, or per 1.000 units shipped in the same weeks. */
export type Denom = "none" | "per1000";
/** Zeitraum: the month total, or the total divided by the month's shipping weeks. */
export type Period = "month" | "week";
/** Where the file's September ends: the kit's rule (6 October, five weeks) or after four weeks (29 September). */
export type SeptemberEnds = "oct6" | "sep29";
export type Verdict = "better" | "same" | "worse";

export const COUNTERS: readonly Counter[] = ["records", "affected", "scrapped"];
export const PERIODS: readonly Period[] = ["month", "week"];

/** A value we set for the demo, not one from the kit; the page never shows it without saying so. */
export interface DemoSetting<T> {
  readonly value: T;
  readonly source: "demo";
}

/** A change under 2 percent counts as "gleich" on our scale. Neither the kit nor the report has such a band. */
export const SAME_BAND: DemoSetting<number> = { value: 0.02, source: "demo" };

export interface ReadingKey {
  readonly counter: Counter;
  readonly denom: Denom;
  readonly period: Period;
  readonly septemberEnds: SeptemberEnds;
  /** Merges of September records from the same machine in the same week (0 to maxMerges()). */
  readonly merges: number;
}

/** The report's reading: records per 1.000 units shipped, month total, the kit's September, nothing merged. */
export const REPORT_KEY: ReadingKey = {
  counter: "records",
  denom: "per1000",
  period: "month",
  septemberEnds: "oct6",
  merges: 0,
};

export function key(patch: Partial<ReadingKey> = {}): ReadingKey {
  return { ...REPORT_KEY, ...patch };
}

const monthOf = (date: string): Month => (date < "2023-09-01" ? "aug" : "sep");

/** The week_start values of a month, in file order; "sep29" drops the week from 30 September. */
export function weeksOf(month: Month, septemberEnds: SeptemberEnds = "oct6"): readonly WeekStart[] {
  return WEEK_STARTS.filter((week) => monthOf(week) === month && !(septemberEnds === "sep29" && week === "2023-09-30"));
}

/** CRAFT units shipped in one week (sum of units_actual over the 19 SKUs). */
export function weeklyUnits(week: WeekStart): number {
  const index = WEEK_STARTS.indexOf(week);
  return CRAFT_SKUS.reduce((sum, row) => sum + (row.units[index] ?? 0), 0);
}

/** CRAFT units shipped in the month. */
export function unitsShipped(month: Month, septemberEnds: SeptemberEnds = "oct6"): number {
  return weeksOf(month, septemberEnds).reduce((sum, week) => sum + weeklyUnits(week), 0);
}

/** Distinct week_start values in the month. */
export function weekCount(month: Month, septemberEnds: SeptemberEnds = "oct6"): number {
  return weeksOf(month, septemberEnds).length;
}

const MONTH_DAYS_2023 = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Adds days to an ISO date of 2023 (no Date object, so the demo stays deterministic). */
export function addDays(iso: string, days: number): string {
  let month = Number(iso.slice(5, 7));
  let day = Number(iso.slice(8, 10)) + days;
  while (day > (MONTH_DAYS_2023[month - 1] ?? 31)) {
    day -= MONTH_DAYS_2023[month - 1] ?? 31;
    month += 1;
  }
  return `2023-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** The days the file's month covers: its first week_start to the Friday after its last. */
export function daysCovered(month: Month, septemberEnds: SeptemberEnds = "oct6"): { readonly from: string; readonly to: string; readonly days: number } {
  const weeks = weeksOf(month, septemberEnds);
  const from = weeks[0] as string;
  return {
    from,
    to: addDays(weeks[weeks.length - 1] as string, 6),
    days: weeks.length * 7,
  };
}

/** The CRAFT records of a month. */
export function recordsOf(month: Month, septemberEnds: SeptemberEnds = "oct6"): readonly NcrRow[] {
  const weeks = new Set<string>(weeksOf(month, septemberEnds));
  return CRAFT_NCR.filter((row) => weeks.has(row.date));
}

/** One cell of records from the same machine in the same week. */
export interface MergeCell {
  readonly machine: string;
  readonly date: WeekStart;
  readonly rows: readonly NcrRow[];
}

/** Groups records by machine and week (ncr_date is always a week_start), in first-seen order. */
export function mergeRecords(rows: readonly NcrRow[]): readonly MergeCell[] {
  const cells = new Map<string, NcrRow[]>();
  for (const row of rows) {
    const cellKey = `${row.machine}|${row.date}`;
    cells.set(cellKey, [...(cells.get(cellKey) ?? []), row]);
  }
  return [...cells.values()].map((members) => {
    const first = members[0] as NcrRow;
    return { machine: first.machine, date: first.date, rows: members };
  });
}

/** The September cells that hold more than one record: the only places a merge can happen. */
export function mergeCells(septemberEnds: SeptemberEnds = "oct6"): readonly MergeCell[] {
  return mergeRecords(recordsOf("sep", septemberEnds)).filter((cell) => cell.rows.length > 1);
}

/** How many merges September allows: each one turns two records of a cell into one. */
export function maxMerges(septemberEnds: SeptemberEnds = "oct6"): number {
  return mergeCells(septemberEnds).reduce((sum, cell) => sum + cell.rows.length - 1, 0);
}

/** The numerator of a counter for a month; merges only ever touch September's records. */
export function numerator(counter: Counter, month: Month, septemberEnds: SeptemberEnds = "oct6", merges = 0): number {
  const rows = recordsOf(month, septemberEnds);
  if (counter === "records") {
    const applied = month === "sep" ? Math.max(0, Math.min(merges, maxMerges(septemberEnds))) : 0;
    return rows.length - applied;
  }
  return (counter === "scrapped" ? rows.filter((row) => row.scrap) : rows).reduce((sum, row) => sum + row.qty, 0);
}

/** One month's value under a reading. */
export function monthValue(reading: ReadingKey, month: Month): number {
  const value = numerator(reading.counter, month, reading.septemberEnds, reading.merges);
  if (reading.denom === "per1000") return (value / unitsShipped(month, reading.septemberEnds)) * 1000;
  return reading.period === "week" ? value / weekCount(month, reading.septemberEnds) : value;
}

/** Relative change from a to b. */
export function change(a: number, b: number): number {
  return b / a - 1;
}

/** For defects falling is better; a change inside the band counts as the same. */
export function verdictOf(delta: number, band = SAME_BAND.value): Verdict {
  if (Math.abs(delta) < band) return "same";
  return delta < 0 ? "better" : "worse";
}

export interface Reading {
  readonly key: ReadingKey;
  readonly id: string;
  readonly aug: number;
  readonly sep: number;
  readonly change: number;
  readonly verdict: Verdict;
}

/** Per 1.000 units the period cancels out, so such a reading always reports period "month". */
export function normalKey(patch: Partial<ReadingKey> = {}): ReadingKey {
  const raw = key(patch);
  const merges = Math.max(0, Math.min(raw.merges, maxMerges(raw.septemberEnds)));
  return {
    ...raw,
    merges,
    period: raw.denom === "per1000" ? "month" : raw.period,
  };
}

/** A stable id for a reading ("scrapped/per1000/month/oct6/0"), used by the notes and the card check. */
export function readingId(patch: Partial<ReadingKey> = {}): string {
  const k = normalKey(patch);
  return `${k.counter}/${k.denom}/${k.period}/${k.septemberEnds}/${k.merges}`;
}

/** The one function behind the scale. */
export function reading(patch: Partial<ReadingKey> = {}): Reading {
  const normal = normalKey(patch);
  const aug = monthValue(normal, "aug");
  const sep = monthValue(normal, "sep");
  const delta = change(aug, sep);
  return {
    key: normal,
    id: readingId(normal),
    aug,
    sep,
    change: delta,
    verdict: verdictOf(delta),
  };
}

/** Per 1.000 units for a month, the kit's way (also used by the hub tile). */
export function rate(counter: Counter, month: Month, merges = 0): number {
  return monthValue(normalKey({ counter, merges }), month);
}

/** The record rate per 1.000 in September after k merges (the scene-3 gauge). */
export function mergeStepRate(merges: number, septemberEnds: SeptemberEnds = "oct6"): number {
  return monthValue(normalKey({ merges, septemberEnds }), "sep");
}

/** Mean qty_affected per record in a month (97 in August, 123 in September). */
export function meanQty(month: Month): number {
  const rows = recordsOf(month);
  return rows.reduce((sum, row) => sum + row.qty, 0) / rows.length;
}

/** Records about weld cracks in a month (ncr_type weld_crack); merging never changes them. */
export function weldCracks(month: Month, septemberEnds: SeptemberEnds = "oct6"): number {
  return recordsOf(month, septemberEnds).filter((row) => row.type === "weld_crack").length;
}

/** The machines CRAFT's records come from, sorted. */
export function machines(): readonly string[] {
  return [...new Set(CRAFT_NCR.map((row) => row.machine))].sort();
}

/** CRAFT demand in a month: the total, or the total per shipping week. */
export function demand(month: Month, period: Period, septemberEnds: SeptemberEnds = "oct6"): number {
  const units = unitsShipped(month, septemberEnds);
  return period === "month" ? units : units / weekCount(month, septemberEnds);
}

/** CRAFT demand change August to September for a period and a September end. */
export function growthWith(septemberEnds: SeptemberEnds, period: Period): number {
  return change(demand("aug", period, septemberEnds), demand("sep", period, septemberEnds));
}

/** CRAFT demand change on the kit's months (+22,4 % as a month total). */
export function growth(period: Period): number {
  return growthWith("oct6", period);
}

/** The whole company's units change August to September. */
export function companyGrowth(period: Period): number {
  if (period === "month") return change(COMPANY.units.aug, COMPANY.units.sep);
  return change(COMPANY.units.aug / weekCount("aug"), COMPANY.units.sep / weekCount("sep"));
}

/**
 * The three ways to count CRAFT's defects and the two ways to compare its
 * demand, as pure functions of the kit rows in data.ts. Every number the
 * stage shows comes out of here (definitions.test.ts pins them to the kit's
 * START-HERE expected values).
 */
import { COMPANY, CRAFT_NCR_AUG, CRAFT_NCR_SEP, CRAFT_WEEKS, type NcrRow } from "./data";

export type Month = "aug" | "sep";
export type Counter = "records" | "affected" | "scrapped";
export type Basis = "month" | "week";
export type Verdict = "better" | "same" | "worse";

export const COUNTERS: readonly Counter[] = ["records", "affected", "scrapped"];
export const BASES: readonly Basis[] = ["month", "week"];

/** A relative change inside ±2 % counts as "gleich" (a setting, stated under the rails). */
export const SAME_BAND = 0.02;

const monthOf = (isoDate: string): Month => (isoDate < "2023-09-01" ? "aug" : "sep");

export const weeksOf = (month: Month) => CRAFT_WEEKS.filter((week) => monthOf(week.start) === month);

/** CRAFT units shipped in the month (sum of units_actual). */
export function unitsShipped(month: Month): number {
  return weeksOf(month).reduce((sum, week) => sum + week.units, 0);
}

/** Distinct week_start values in the month. */
export function weekCount(month: Month): number {
  return weeksOf(month).length;
}

/** One group of NCRs from the same machine in the same week. */
export interface MergedGroup {
  readonly machine: string;
  readonly date: string;
  readonly rows: readonly NcrRow[];
}

/** Merges records from the same machine on the same week (ncr_date is always a week_start). */
export function mergeRecords(rows: readonly NcrRow[]): readonly MergedGroup[] {
  const groups = new Map<string, NcrRow[]>();
  for (const row of rows) {
    const key = `${row.machine}|${row.date}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.entries()].map(([key, members]) => {
    const [machine, date] = key.split("|") as [string, string];
    return { machine, date, rows: members };
  });
}

/** The numerator of a counter for a month; `merged` applies the merge to records only. */
export function count(counter: Counter, month: Month, merged = false): number {
  if (month === "aug") {
    if (counter === "records") return merged ? CRAFT_NCR_AUG.merged : CRAFT_NCR_AUG.records;
    return counter === "affected" ? CRAFT_NCR_AUG.affected : CRAFT_NCR_AUG.scrapped;
  }
  if (counter === "records") return merged ? mergeRecords(CRAFT_NCR_SEP).length : CRAFT_NCR_SEP.length;
  const rows = counter === "scrapped" ? CRAFT_NCR_SEP.filter((row) => row.scrap) : CRAFT_NCR_SEP;
  return rows.reduce((sum, row) => sum + row.qty, 0);
}

/** Per 1.000 units shipped in the same month. */
export function rate(counter: Counter, month: Month, merged = false): number {
  return (count(counter, month, merged) / unitsShipped(month)) * 1000;
}

/** Relative change from a to b. */
export function change(a: number, b: number): number {
  return b / a - 1;
}

/** For defects: falling is better; inside the band is the same. */
export function trend(a: number, b: number, tolerance = SAME_BAND): Verdict {
  const delta = change(a, b);
  if (Math.abs(delta) < tolerance) return "same";
  return delta < 0 ? "better" : "worse";
}

export function verdict(counter: Counter): Verdict {
  return trend(rate(counter, "aug"), rate(counter, "sep"));
}

/** CRAFT demand in a month: the total, or the total per shipping week. */
export function demand(month: Month, basis: Basis): number {
  const units = unitsShipped(month);
  return basis === "month" ? units : units / weekCount(month);
}

/** Demand change August to September on a basis. */
export function growth(basis: Basis): number {
  return change(demand("aug", basis), demand("sep", basis));
}

/** The whole company's units change August to September on a basis. */
export function companyGrowth(basis: Basis): number {
  if (basis === "month") return change(COMPANY.units.aug, COMPANY.units.sep);
  return change(COMPANY.units.aug / weekCount("aug"), COMPANY.units.sep / weekCount("sep"));
}

/** Rounds like the report: per 1.000 records to two decimals, units to whole numbers. */
export function shownRate(counter: Counter, value: number): number {
  return counter === "records" ? Math.round(value * 100) / 100 : Math.round(value);
}

/**
 * The Nachweisprobe as pure functions: statuses, month counting, dates and
 * the few sums the demo shows. Every figure on the stage is derived here from
 * the kit's rows (kit.ts), never typed in, and the tests re-derive the
 * numbers in loesungen/LOESUNGEN.md (279,7, 318,4, 320,9, 305,1 MWh, 46 Tage).
 */

/** BELEGT · SCHWACH · LÜCKE (EN COVERED · WEAK · GAP). */
export type Status = "belegt" | "schwach" | "luecke";

const RANK: Readonly<Record<Status, number>> = { luecke: 0, schwach: 1, belegt: 2 };

/** Several parts: the weakest part counts (LÜCKE before SCHWACH before BELEGT). */
export function weakest(statuses: readonly Status[]): Status {
  let result: Status = "belegt";
  for (const status of statuses) if (RANK[status] < RANK[result]) result = status;
  return result;
}

export interface Counts {
  readonly belegt: number;
  readonly schwach: number;
  readonly luecke: number;
}

export function countStatuses(statuses: readonly Status[]): Counts {
  return {
    belegt: statuses.filter((status) => status === "belegt").length,
    schwach: statuses.filter((status) => status === "schwach").length,
    luecke: statuses.filter((status) => status === "luecke").length,
  };
}

/** One row of a monthly bill series, with its line in the kit file. */
export interface BillRow {
  /** "2025-10" */
  readonly month: string;
  readonly invoice: string;
  readonly amount: number;
  /** Line number in the kit file, counted like a text editor. */
  readonly line: number;
}

export interface MonthCount {
  /** Distinct months, ascending: "2025-01" ... */
  readonly months: readonly string[];
  /** The same invoice booked more than once: counts once. */
  readonly duplicates: readonly { readonly invoice: string; readonly lines: readonly number[] }[];
  /** Two different invoices for one month without a note: the file contradicts itself. */
  readonly conflicts: readonly string[];
  /** Month numbers (1 to 12) of the year with no bill. */
  readonly missing: readonly number[];
}

/** Counts months, not rows: month plus invoice number is the key. */
export function distinctMonths(rows: readonly BillRow[], year: number): MonthCount {
  const byKey = new Map<string, BillRow[]>();
  for (const row of rows) {
    const key = `${row.month}|${row.invoice}`;
    byKey.set(key, [...(byKey.get(key) ?? []), row]);
  }
  const invoicesByMonth = new Map<string, Set<string>>();
  for (const row of rows) {
    invoicesByMonth.set(row.month, new Set([...(invoicesByMonth.get(row.month) ?? []), row.invoice]));
  }
  const duplicates = [...byKey.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({ invoice: group[0]!.invoice, lines: group.map((row) => row.line) }));
  const conflicts = [...invoicesByMonth.entries()].filter(([, invoices]) => invoices.size > 1).map(([month]) => month);
  const months = [...invoicesByMonth.keys()].sort();
  const missing: number[] = [];
  for (let month = 1; month <= 12; month += 1) {
    if (!invoicesByMonth.has(`${year}-${String(month).padStart(2, "0")}`)) missing.push(month);
  }
  return { months, duplicates, conflicts, missing };
}

/** The sum over distinct invoices: a bill booked twice counts once. */
export function sumDistinct(rows: readonly BillRow[]): number {
  const seen = new Map<string, number>();
  for (const row of rows) seen.set(`${row.month}|${row.invoice}`, row.amount);
  return [...seen.values()].reduce((sum, value) => sum + value, 0);
}

/** The sum over every row, the mistake the kit warns about. */
export function naiveSum(rows: readonly BillRow[]): number {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

/** Months covered as a share of the year, 0 to 1. */
export function coverage(monthCount: number): number {
  return Math.max(0, Math.min(12, monthCount)) / 12;
}

/** A value rounded to a fixed number of decimals, without float noise. */
export function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** A calendar date without a time zone. */
export interface CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/** "31.08.2026" to a date; null for anything that is not a real day. */
export function parseDate(text: string): CalendarDate | null {
  const match = /^\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s*$/.exec(text);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return null;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > days) return null;
  return { year, month, day };
}

/** Whole days from a to b (b later is positive), on calendar dates only. */
export function daysBetween(a: CalendarDate, b: CalendarDate): number {
  const utc = (date: CalendarDate) => Date.UTC(date.year, date.month - 1, date.day);
  return Math.round((utc(b) - utc(a)) / 86_400_000);
}

/** Expired on the reference date: valid until a day before it. */
export function isExpired(validUntil: CalendarDate, referenceDate: CalendarDate): boolean {
  return daysBetween(validUntil, referenceDate) > 0;
}

/** An invoice photo checked against itself: new meter reading minus old = kWh billed. */
export function meterCheck(oldReading: number, newReading: number, billed: number) {
  const difference = newReading - oldReading;
  return { difference, matches: difference === billed } as const;
}

/** Share of a yearly figure, 0 to 1. */
export function share(part: number, whole: number): number {
  return whole > 0 ? part / whole : 0;
}

/** The bank's simple payback: investment / (yearly yield in kWh x price per kWh). */
export function payback(investment: number, yieldKwh: number, pricePerKwh: number): number {
  return investment / (yieldKwh * pricePerKwh);
}

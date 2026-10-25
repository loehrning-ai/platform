import type { Locale } from "./format";
import { calendarDaysInMonth, weekdaysInMonth } from "./logic";

/** Parsing of the visitor's own numbers. Pure; a number that cannot be read is null, never guessed. */

const SCALE_WORD = /\b(mio|mrd|mill|million|billion|bn|tsd|tausend|k|m)\b\.?/i;

export const hasScaleWord = (text: string): boolean => SCALE_WORD.test(text.trim());

/**
 * "17.233.647", "17,23", "17233647,5", "1 234", "17,233,647.5" and "EUR 17.2" to a
 * number. Both signs present: the last one is the decimal sign. One kind only:
 * repeated means thousands; once, three digits after it and the locale's
 * thousands sign means thousands, anything else decimal. Words such as "Mio"
 * return null: the page asks for the full number.
 */
export function parseNumber(raw: string, locale: Locale = "de"): number | null {
  if (hasScaleWord(raw)) return null;
  const cleaned = raw.replace(/[\s\u00a0\u202f\u2009']/g, "").replace(/[€$£]|eur|usd/gi, "");
  if (!/^[-+−]?[\d.,]*\d[\d.,]*$/.test(cleaned)) return null;
  const negative = /^[-−]/.test(cleaned);
  const body = cleaned.replace(/^[-+−]/, "");
  const lastDot = body.lastIndexOf(".");
  const lastComma = body.lastIndexOf(",");
  const dots = (body.match(/\./g) ?? []).length;
  const commas = (body.match(/,/g) ?? []).length;
  const thousands = locale === "de" ? "." : ",";
  let decimalAt = -1;
  if (dots > 0 && commas > 0) {
    decimalAt = Math.max(lastDot, lastComma);
  } else if (dots + commas > 0) {
    const sep = dots > 0 ? "." : ",";
    const count = dots > 0 ? dots : commas;
    const index = dots > 0 ? lastDot : lastComma;
    const after = body.length - index - 1;
    if (count === 1 && !(after === 3 && sep === thousands)) decimalAt = index;
  }
  const digits = (text: string) => text.replace(/[.,]/g, "");
  const text =
    decimalAt < 0 ? digits(body) : `${digits(body.slice(0, decimalAt))}.${digits(body.slice(decimalAt + 1))}`;
  const value = Number(text);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

/** "2023-08", "08/2023", "8.2023" or "08.2023" to year and month; null otherwise. */
export function parseMonth(raw: string): { year: number; month: number } | null {
  const text = raw.trim();
  const iso = /^(\d{4})-(\d{1,2})$/.exec(text);
  const other = /^(\d{1,2})[./](\d{4})$/.exec(text);
  const year = iso ? Number(iso[1]) : other ? Number(other[2]) : Number.NaN;
  const month = iso ? Number(iso[2]) : other ? Number(other[1]) : Number.NaN;
  if (!(year >= 1900 && year <= 2200 && month >= 1 && month <= 12)) return null;
  return { year, month };
}

export interface Row {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly value: number;
}

const DATE = /^\s*(?:(\d{4})-(\d{1,2})-(\d{1,2})|(\d{1,2})\.(\d{1,2})\.(\d{4}))[\sT]*/;

/** One pasted line to a row, or null (a header, a blank, an unreadable value). */
export function parseLine(line: string, locale: Locale): Row | null {
  const match = DATE.exec(line);
  if (!match) return null;
  const iso = match[1] !== undefined;
  const year = Number(iso ? match[1] : match[6]);
  const month = Number(iso ? match[2] : match[5]);
  const day = Number(iso ? match[3] : match[4]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const rest = line.slice(match[0].length).replace(/^[\t;,\s]+/, "");
  const cell = rest.split(/[\t;]/)[0] ?? "";
  // Without tab or semicolon the rest is "1234,5" or "1.234,5": the first token is the value.
  const value = parseNumber(/[\t;]/.test(rest) ? cell : (rest.split(/\s+/)[0] ?? ""), locale);
  return value === null ? null : { year, month, day, value };
}

export type Granularity = "daily" | "weekly" | "monthly";

const dayNumber = (row: Row) => Math.floor(Date.UTC(row.year, row.month - 1, row.day) / 86400000);

/** From the median gap between consecutive dates: up to 2 days daily, 5 to 9 weekly, else monthly. */
export function detectGranularity(rows: readonly Row[]): Granularity {
  const days = [...new Set(rows.map(dayNumber))].sort((x, y) => x - y);
  const gaps = days.slice(1).map((day, index) => day - (days[index] as number)).sort((x, y) => x - y);
  const median = gaps.length > 0 ? (gaps[Math.floor(gaps.length / 2)] as number) : 31;
  if (median <= 2) return "daily";
  if (median >= 5 && median <= 9) return "weekly";
  return "monthly";
}

export interface MonthSum {
  readonly key: string;
  readonly year: number;
  readonly month: number;
  readonly value: number;
  /** Rows counted: days present (daily), weeks (weekly), 1 (monthly). */
  readonly count: number;
  /** Days of the month the data does not cover (daily only): Mo-Fr, or every day when the paste has weekend rows. */
  readonly gapDays: number;
}

export type ParseResult =
  | {
      readonly ok: true;
      readonly granularity: Granularity;
      /** Daily rows include Saturdays or Sundays: every row is summed and every day counts. */
      readonly calendar: boolean;
      readonly a: MonthSum;
      readonly b: MonthSum;
    }
  | {
      readonly ok: false;
      readonly reason: "empty" | "thin";
      /** What was found: "2023-09: 2" (month: points), for the message. */
      readonly found: readonly string[];
      readonly needed: number;
    };

const monthKey = (row: { year: number; month: number }) =>
  `${row.year}-${String(row.month).padStart(2, "0")}`;

/** Pasted rows (date, value) to the last two months with enough points. */
export function parsePaste(text: string, locale: Locale = "de"): ParseResult {
  const rows = text
    .split(/\r?\n/)
    .map((line) => parseLine(line, locale))
    .filter((row): row is Row => row !== null);
  if (rows.length === 0) return { ok: false, reason: "empty", found: [], needed: 3 };
  const granularity = detectGranularity(rows);
  const isWeekend = (row: Row) => {
    const weekday = new Date(Date.UTC(row.year, row.month - 1, row.day)).getUTCDay();
    return weekday === 0 || weekday === 6;
  };
  // A shop or webshop sells on weekends: dropping those rows would understate the totals. When the paste carries any
  // Saturday or Sunday row, all rows are summed and every day of the month is a day; otherwise it stays Mo-Fr.
  const calendar = granularity === "daily" && rows.some(isWeekend);
  const needed = granularity === "monthly" ? 1 : 3;
  const sums = new Map<string, { year: number; month: number; value: number; days: Set<number> }>();
  for (const row of rows) {
    const key = monthKey(row);
    const entry = sums.get(key) ?? { year: row.year, month: row.month, value: 0, days: new Set<number>() };
    entry.value += row.value;
    entry.days.add(dayNumber(row));
    sums.set(key, entry);
  }
  const ordered = [...sums.entries()].sort(([x], [y]) => x.localeCompare(y));
  const enough = ordered.filter(([, entry]) => entry.days.size >= needed);
  if (enough.length < 2) {
    return {
      ok: false,
      reason: "thin",
      found: ordered.map(([key, entry]) => `${key}: ${entry.days.size}`),
      needed,
    };
  }
  const sum = ([key, entry]: (typeof ordered)[number]): MonthSum => {
    const count = granularity === "monthly" ? 1 : entry.days.size;
    const covered = calendar
      ? calendarDaysInMonth(entry.year, entry.month, 0)
      : weekdaysInMonth(entry.year, entry.month, 0);
    return {
      key,
      year: entry.year,
      month: entry.month,
      value: entry.value,
      count,
      gapDays: granularity === "daily" ? Math.max(0, covered - count) : 0,
    };
  };
  const [a, b] = enough.slice(-2) as [(typeof ordered)[number], (typeof ordered)[number]];
  return { ok: true, granularity, calendar, a: sum(a), b: sum(b) };
}

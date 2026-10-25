/**
 * Dates for the evidence check: the audit window, day and hour differences,
 * and every date a file name or a header line can carry. An uncertain date
 * (a month, a quarter, a year) takes the earliest day it could mean, so it can
 * never pass DATUM by luck. A dd/mm/yyyy date with both parts at 12 or less
 * is ambiguous and never guessed. Pure; no Date parsing of free text.
 */

export type IsoDate = string;

export interface DateToken {
  /** The earliest day the token can mean; null when it is ambiguous or not a real day. */
  readonly iso: IsoDate | null;
  /** The latest day the token can mean (the same day for an exact date). */
  readonly latest: IsoDate | null;
  readonly uncertain: boolean;
  readonly ambiguous: boolean;
  /** Shaped like a date but no real day ("2026/13/45"): never read as anything else. */
  readonly invalid: boolean;
  readonly raw: string;
  readonly index: number;
}

const DAY_MS = 86_400_000;

const MONTHS: Readonly<Record<string, number>> = {
  january: 1, jan: 1, januar: 1, "jänner": 1, february: 2, feb: 2, februar: 2, march: 3, mar: 3, "märz": 3, maerz: 3,
  april: 4, apr: 4, may: 5, mai: 5, june: 6, jun: 6, juni: 6, july: 7, jul: 7, juli: 7, august: 8, aug: 8,
  september: 9, sep: 9, sept: 9, october: 10, oct: 10, oktober: 10, okt: 10, november: 11, nov: 11,
  december: 12, dec: 12, dezember: 12, dez: 12,
};

const pad = (value: number) => String(value).padStart(2, "0");

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isValidDate(year: number, month: number, day: number): boolean {
  return year >= 1900 && year <= 2199 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

export function toIso(year: number, month: number, day: number): IsoDate {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function utc(iso: IsoDate): number {
  const [year, month, day] = iso.split("-").map(Number) as [number, number, number];
  return Date.UTC(year, month - 1, day);
}

/** The same calendar day `months` earlier; a day the month lacks becomes its last day (29 Feb to 28 Feb). */
export function windowStart(audit: IsoDate, months = 12): IsoDate {
  const [year, month, day] = audit.split("-").map(Number) as [number, number, number];
  const total = year * 12 + (month - 1) - months;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return toIso(y, m, Math.min(day, daysInMonth(y, m)));
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((utc(to) - utc(from)) / DAY_MS);
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = new Date(utc(iso) + days * DAY_MS);
  return toIso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/** Hours between two "YYYY-MM-DD HH:MM" values. */
export function hoursBetween(from: string, to: string): number {
  const at = (value: string) => {
    const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/.exec(value.trim());
    if (!match) throw new Error(`not a date and time: ${value}`);
    return utc(match[1] as string) + Number(match[2]) * 3_600_000 + Number(match[3]) * 60_000;
  };
  return (at(to) - at(from)) / 3_600_000;
}

/** "10.12.2026" in German, "10 Dec 2026" in English. */
export function formatShort(iso: IsoDate, locale: "de" | "en"): string {
  const [year, month, day] = iso.split("-").map(Number) as [number, number, number];
  if (locale === "de") return `${pad(day)}.${pad(month)}.${year}`;
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${names[month - 1]} ${year}`;
}

/** "10 December 2026": the kit's English long form, used inside the English templates. */
export function formatLongEn(iso: IsoDate): string {
  const [year, month, day] = iso.split("-").map(Number) as [number, number, number];
  const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${day} ${names[month - 1]} ${year}`;
}

interface Pattern {
  readonly re: RegExp;
  /** A token; null marks an impossible date (kept as an invalid token); undefined leaves the text (no month word). */
  readonly read: (match: RegExpExecArray) => Read | null | undefined;
}

type Read = Omit<DateToken, "raw" | "index">;

const exact = (year: number, month: number, day: number): Read | null =>
  isValidDate(year, month, day) ? { iso: toIso(year, month, day), latest: toIso(year, month, day), uncertain: false, ambiguous: false, invalid: false } : null;
/** A month, a quarter or a year: from the first day of `month` to the last day of `lastMonth`. */
const earliest = (year: number, month: number, lastMonth = month): Read | null =>
  isValidDate(year, month, 1) && isValidDate(year, lastMonth, 1)
    ? { iso: toIso(year, month, 1), latest: toIso(year, lastMonth, daysInMonth(year, lastMonth)), uncertain: true, ambiguous: false, invalid: false }
    : null;
const monthOf = (word: string) => MONTHS[word.toLowerCase().replace(/\.$/, "")];

/** In the order the spec gives: full dates first, then the uncertain ones. */
const PATTERNS: readonly Pattern[] = [
  { re: /(?<!\d)(\d{4})[-_](\d{2})[-_](\d{2})(?!\d)/g, read: (m) => exact(Number(m[1]), Number(m[2]), Number(m[3])) },
  { re: /(?<!\d)(\d{4})\/(\d{1,2})\/(\d{1,2})(?!\d)/g, read: (m) => exact(Number(m[1]), Number(m[2]), Number(m[3])) },
  { re: /(?<!\d)(\d{1,2})\.(\d{1,2})\.(\d{4})(?!\d)/g, read: (m) => exact(Number(m[3]), Number(m[2]), Number(m[1])) },
  {
    re: /(?<!\d)(\d{1,2})\/(\d{1,2})\/(\d{4})(?!\d)/g,
    read: (m) => {
      const [a, b, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
      if (a <= 12 && b <= 12 && a !== b) return { iso: null, latest: null, uncertain: true, ambiguous: true, invalid: false };
      return a > 12 ? exact(year, b, a) : b > 12 ? exact(year, a, b) : exact(year, a, a);
    },
  },
  {
    re: /(?<![\d\p{L}])(\d{1,2})\.?\s+(\p{L}{3,9}\.?)\s+(\d{4})(?!\d)/gu,
    read: (m) => {
      const month = monthOf(m[2] as string);
      return month ? exact(Number(m[3]), month, Number(m[1])) : undefined;
    },
  },
  { re: /(?<!\d)(20\d{2})(\d{2})(\d{2})(?!\d)/g, read: (m) => exact(Number(m[1]), Number(m[2]), Number(m[3])) },
  { re: /(?<!\d)(\d{4})[-_ ]?[Qq]([1-4])(?!\d)/g, read: (m) => earliest(Number(m[1]), (Number(m[2]) - 1) * 3 + 1, Number(m[2]) * 3) },
  { re: /(?<![\p{L}\d])[Qq]([1-4])[-_ ]?(\d{4})(?!\d)/gu, read: (m) => earliest(Number(m[2]), (Number(m[1]) - 1) * 3 + 1, Number(m[1]) * 3) },
  { re: /(?<!\d)(\d{4})[-_](\d{2})(?![-_]?\d)/g, read: (m) => earliest(Number(m[1]), Number(m[2])) },
  {
    re: /(?<![\p{L}\d])(\p{L}{3,9}\.?)\s+(\d{4})(?!\d)/gu,
    read: (m) => {
      const month = monthOf(m[1] as string);
      return month ? earliest(Number(m[2]), month) : undefined;
    },
  },
  { re: /(?<!\d)((?:19|20)\d{2})(?!\d)/g, read: (m) => earliest(Number(m[1]), 1, 12) },
];

/**
 * Every date in a string, in reading order. Each pattern runs on what the
 * earlier ones left, so "2026-05-07" is one exact date and never also a year;
 * an impossible date ("2026-13-40", "2026/13/45") becomes an invalid token and
 * never a year.
 */
export function parseDateTokens(input: string): readonly DateToken[] {
  let rest = input;
  const found: DateToken[] = [];
  for (const { re, read } of PATTERNS) {
    rest = rest.replace(re, (...args: unknown[]) => {
      const match = args.slice(0, -2) as unknown as RegExpExecArray;
      const index = args.at(-2) as number;
      const raw = match[0] as string;
      const token = read(match);
      if (token === undefined) return raw;
      found.push(token ? { ...token, raw, index } : { iso: null, latest: null, uncertain: false, ambiguous: false, invalid: true, raw, index });
      return " ".repeat(raw.length);
    });
  }
  return found.sort((a, b) => a.index - b.index);
}

/** The first date in a string that is not ambiguous, or null. */
export function firstDate(input: string): DateToken | null {
  return parseDateTokens(input).find((token) => token.iso !== null) ?? null;
}

import { clamp, round } from "./numbers";
import type { Locale, MonthCell } from "./types";

/*
 * Reads what a person pastes: a column or row of 12 values (Excel copy), or
 * lines with a month label ("Jan 21.400", "März 20,6", "2025-03 EL-25-03 20600",
 * "3 20600"). It never guesses silently: every line becomes an Entry, a line
 * that cannot be read stays listed, an ambiguous number carries both readings,
 * a repeated month keeps both rows. Units are never converted.
 */

export interface Entry {
  readonly id: number;
  readonly raw: string;
  /** 1..12, or null when the line could not be read. */
  readonly month: number | null;
  readonly kind: "value" | "missing" | "unread";
  readonly value: number | null;
  readonly estimate: boolean;
  /**
   * The other reading of a number whose separator could mean either ("21.400":
   * 21400 or 21.4). Set only when the visitor has to be told: a separator that
   * is plain thousands in the page's language never raises it.
   */
  readonly alt: number | null;
  /** Which separator was read as thousands in the default reading. */
  readonly separator: "." | "," | null;
  /**
   * The reading a silent "21.400" did not take (21.4). Never shown on its own; offered
   * only when the number's size does not fit the others, where it is the likely slip.
   */
  readonly quiet: Quiet | null;
  /** Set when the position, not a label, gave the month. */
  readonly positional: boolean;
}

export interface Parsed {
  readonly entries: readonly Entry[];
  /** Which separator the paste uses for thousands, and whether the paste itself proved it. */
  readonly convention: Convention;
  /** Positional input with another count than 12. */
  readonly countMismatch: number | null;
}

export interface Resolution {
  /** Entry ids that use their other reading. */
  readonly flips: ReadonlySet<number>;
  /** Months whose SECOND row wins over the first. */
  readonly swaps: ReadonlySet<number>;
  /** Hand-edited cells: month -> text ("" clears, "~12" estimates). */
  readonly edits: ReadonlyMap<number, string>;
}

export interface Convention {
  /** The thousands separator the numbers are read with; the other one is the decimal sign. */
  readonly thousands: "." | ",";
  /** The page language's own thousands separator ("." in German, "," in English). */
  readonly localeThousands: "." | ",";
  /** True when numbers in the paste itself settle it (1.234,5 or 20,6 or 1.234.567). */
  readonly evident: boolean;
}

export function localeConvention(locale: Locale): Convention {
  const thousands = locale === "de" ? "." : ",";
  return { thousands, localeThousands: thousands, evident: false };
}

export interface Resolved {
  readonly cells: readonly MonthCell[];
  /** Months that appear twice: first and second entry id. */
  readonly duplicates: readonly { readonly month: number; readonly first: number; readonly second: number }[];
  /** Months whose value is far from the others (factor 20): "Einheit?". */
  readonly unitHints: readonly number[];
  /** Months read as exactly 0: a bill that says 0 is rare, so the visitor confirms it ("Null?"). */
  readonly zeroHints: readonly number[];
}

export const NO_RESOLUTION: Resolution = { flips: new Set(), swaps: new Set(), edits: new Map() };

const MONTH_NAMES: Readonly<Record<string, number>> = {
  jan: 1, januar: 1, january: 1, jänner: 1,
  feb: 2, februar: 2, february: 2,
  mar: 3, mär: 3, mrz: 3, märz: 3, maerz: 3, march: 3,
  apr: 4, april: 4,
  mai: 5, may: 5,
  jun: 6, juni: 6, june: 6,
  jul: 7, juli: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  okt: 10, oct: 10, oktober: 10, october: 10,
  nov: 11, november: 11,
  dez: 12, dec: 12, dezember: 12, december: 12,
};

const MISSING_TOKENS = new Set(["", "-", "\u2013", "\u2014", "?", "fehlt", "n/a", "na", "k.a.", "missing", "none", "null"]);
const ESTIMATE_PREFIX = /^(?:~|≈|ca\.?|approx\.?)\s*/i;
const UNIT_SUFFIX = /\s*(?:[a-zA-Zµ]{1,4}[³²]?|%)$/;

/** The unread other side of an ambiguous number. */
export interface Quiet {
  readonly alt: number;
  readonly separator: "." | ",";
}

export interface ParsedNumber {
  readonly value: number;
  /** The other reading, only when the visitor has to be shown the choice. */
  readonly alt: number | null;
  readonly separator: "." | "," | null;
  readonly quiet?: Quiet;
}

/** "24 000", "1 234 567,8": space groups of three (regular, narrow or no-break space). */
const SPACE_GROUPS = /^\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:[.,]\d+)?$/;

/**
 * "1.234,5" and "1,234.5" both; "24 000" with any space as thousands; a single
 * separator with three digits ("21.400") is the one ambiguous shape. Without a
 * convention it reads thousands and keeps the other reading; with one, the
 * paste's own evidence or the page language decides, and `alt` appears only
 * when three digits had to be read as decimals.
 */
export function parseNumber(token: string, convention?: Convention): ParsedNumber | null {
  let text = token.trim().replace(UNIT_SUFFIX, "").trim();
  if (SPACE_GROUPS.test(text)) text = text.replace(/[ \u00a0\u202f]/g, "");
  text = text.replace(/[\u00a0\u202f']/g, "");
  if (!/^\d[\d.,]*$/.test(text)) return null;
  text = text.replace(/[.,]+$/, "");
  const dots = (text.match(/\./g) ?? []).length;
  const commas = (text.match(/,/g) ?? []).length;
  if (dots > 0 && commas > 0) {
    const decimal = text.lastIndexOf(".") > text.lastIndexOf(",") ? "." : ",";
    const thousands = decimal === "." ? "," : ".";
    return { value: Number(text.split(thousands).join("").replace(decimal, ".")), alt: null, separator: null };
  }
  const separator = dots > 0 ? "." : commas > 0 ? "," : null;
  if (separator === null) return { value: Number(text), alt: null, separator: null };
  const count = separator === "." ? dots : commas;
  if (count > 1) return { value: Number(text.split(separator).join("")), alt: null, separator: null };
  const [whole = "", fraction = ""] = text.split(separator);
  const asThousands = Number(`${whole}${fraction}`);
  const asDecimal = Number(`${whole}.${fraction}`);
  const ambiguous = fraction.length === 3 && whole.length >= 1 && whole.length <= 3 && !whole.startsWith("0");
  if (!ambiguous) return { value: asDecimal, alt: null, separator: null };
  if (!convention) return { value: asThousands, alt: asDecimal, separator };
  const thousandsHere = separator === convention.thousands;
  // A separator that is thousands here reads silently. Three digits behind a decimal sign is the odd case: show it.
  if (thousandsHere) {
    // The paste's own evidence differs from the page language: say so, and let the visitor flip it.
    const foreign = convention.evident && convention.thousands !== convention.localeThousands;
    return foreign ? { value: asThousands, alt: asDecimal, separator } : { value: asThousands, alt: null, separator: null, quiet: { alt: asDecimal, separator } };
  }
  return { value: asDecimal, alt: asThousands, separator };
}

/**
 * Looks at the whole paste: a number with both separators, a separator that
 * repeats, or a separator followed by other than three digits says which one is
 * the decimal sign. One answer settles it; none or two answers leave the page
 * language in charge.
 */
export function detectConvention(text: string, locale: Locale): Convention {
  const base = localeConvention(locale);
  const votes = new Set<"." | ",">();
  for (const raw of text.split(/[\s;]+/)) {
    const token = raw.replace(ESTIMATE_PREFIX, "").replace(UNIT_SUFFIX, "").replace(/[.,]+$/, "");
    if (!/^\d[\d.,]*$/.test(token)) continue;
    const dots = (token.match(/\./g) ?? []).length;
    const commas = (token.match(/,/g) ?? []).length;
    if (dots > 0 && commas > 0) {
      votes.add(token.lastIndexOf(".") > token.lastIndexOf(",") ? "," : ".");
    } else if (dots > 1) {
      votes.add(".");
    } else if (commas > 1) {
      votes.add(",");
    } else if (dots + commas === 1) {
      const separator = dots === 1 ? "." : ",";
      const [whole = "", fraction = ""] = token.split(separator);
      if (fraction.length !== 3 || whole.length > 3 || (whole === "0" && fraction.length === 3)) {
        votes.add(separator === "." ? "," : ".");
      }
    }
  }
  if (votes.size !== 1) return base;
  const [thousands] = [...votes] as ("." | ",")[];
  return { thousands: thousands as "." | ",", localeThousands: base.localeThousands, evident: true };
}

function monthOf(token: string): number | null {
  const iso = /^\d{4}-(\d{1,2})(?:-\d{1,2})?$/.exec(token);
  if (iso) {
    const month = Number(iso[1]);
    return month >= 1 && month <= 12 ? month : null;
  }
  const word = token.toLowerCase().replace(/[.,:;)]+$/, "");
  return MONTH_NAMES[word] ?? null;
}

interface ValueRead {
  readonly kind: "value" | "missing" | "unread";
  readonly value: number | null;
  readonly alt: number | null;
  readonly separator: "." | "," | null;
  readonly estimate: boolean;
  readonly quiet?: Quiet;
}

/** One cell's text: a number, a missing marker, or nothing readable. */
export function readValue(text: string, convention?: Convention): ValueRead {
  const trimmed = text.trim();
  if (MISSING_TOKENS.has(trimmed.toLowerCase())) {
    return { kind: "missing", value: null, alt: null, separator: null, estimate: false };
  }
  const estimate = ESTIMATE_PREFIX.test(trimmed);
  const body = trimmed.replace(ESTIMATE_PREFIX, "");
  const number = parseNumber(body, convention);
  if (!number || !Number.isFinite(number.value)) {
    return { kind: "unread", value: null, alt: null, separator: null, estimate: false };
  }
  return { kind: "value", value: number.value, alt: number.alt, separator: number.separator, estimate, quiet: number.quiet };
}

const split = (line: string) => line.trim().split(/[ \t]+/).filter((token) => token.length > 0);

function entry(id: number, raw: string, month: number | null, read: ValueRead | null, positional: boolean): Entry {
  if (month === null || read === null || read.kind === "unread") {
    return { id, raw, month, kind: "unread", value: null, estimate: false, alt: null, separator: null, quiet: null, positional };
  }
  return {
    id, raw, month, kind: read.kind, value: read.value, estimate: read.estimate,
    alt: read.alt, separator: read.separator, quiet: read.quiet ?? null, positional,
  };
}

/** A trailing word that is not the value: a unit ("kWh"), a note in brackets, an invoice id. */
const UNITISH = /^(?:[\p{L}µ]{1,12}[³²]?\.?|%|\(.*\)|[A-Z]{1,4}-[\d-]+)$/u;
const YEAR = /^(?:19|20)\d\d$/;
const ESTIMATE_WORD = /^(?:~|≈|ca\.?|approx\.?)$/i;

/** "24" "000" are one number written with a space as thousands separator: join such groups. */
function joinGroups(tokens: readonly string[]): readonly string[] {
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    let token = tokens[i] as string;
    if (/^\d{1,3}$/.test(token)) {
      let j = i + 1;
      while (j < tokens.length && /^\d{3}$/.test(tokens[j] as string)) {
        token += tokens[j];
        j += 1;
      }
      // a last group may carry the decimals: "1 234,5"
      if (j > i + 1 || /^\d{3}[.,]\d+$/.test(tokens[j] ?? "")) {
        if (j < tokens.length && /^\d{3}[.,]\d+$/.test(tokens[j] as string)) {
          token += tokens[j];
          j += 1;
        }
        out.push(token);
        i = j - 1;
        continue;
      }
    }
    out.push(token);
  }
  return out;
}

const MISSING: ValueRead = { kind: "missing", value: null, alt: null, separator: null, estimate: false };

/**
 * A line with a month label: label first, then the value. Anything after the
 * value may only be a unit or a note. A second number, or a token that is
 * neither number nor unit, makes the line "not read": nothing is guessed.
 */
function labelled(id: number, raw: string, convention: Convention): Entry | null {
  const tokens = split(raw);
  const first = tokens[0];
  if (!first) return null;
  let month = monthOf(first);
  const isIso = /^\d{4}-\d{1,2}/.test(first);
  const bareNumber = /^\d{1,2}$/.test(first) ? Number(first) : null;
  if (month === null && bareNumber !== null && bareNumber >= 1 && bareNumber <= 12 && tokens.length >= 2) {
    month = bareNumber;
  }
  if (month === null) return null;
  // Three or more plain numbers in a row are a row of values, not a label with a value.
  if (bareNumber !== null && tokens.length > 2 && tokens.every((token) => readValue(token, convention).kind === "value")) return null;
  const rest = joinGroups(tokens.slice(1));
  if (rest.length === 0 && !isIso && bareNumber !== null) return null;
  const candidates = rest.filter((token) => !UNITISH.test(token) || MISSING_TOKENS.has(token.toLowerCase()));
  const numeric = candidates.filter((token) => readValue(token, convention).kind === "value");
  const numbers = numeric.length > 1 ? numeric.filter((token) => !YEAR.test(token)) : numeric;
  const last = candidates[candidates.length - 1];
  if (last === undefined) {
    const marker = rest.some((token) => MISSING_TOKENS.has(token.toLowerCase()));
    return rest.length === 0 || marker ? entry(id, raw, month, MISSING, false) : entry(id, raw, month, null, false);
  }
  if (numbers.length > 1) return entry(id, raw, month, null, false);
  const read = readValue(last, convention);
  if (read.kind === "value") {
    const before = rest[rest.lastIndexOf(last) - 1];
    const marked = !read.estimate && before !== undefined && ESTIMATE_WORD.test(before);
    return entry(id, raw, month, marked ? { ...read, estimate: true } : read, false);
  }
  if (read.kind === "missing") return entry(id, raw, month, read, false);
  return entry(id, raw, month, null, false);
}

/** Splits the input into its rows or cells, keeping blanks so positions hold. */
function slots(text: string, convention: Convention): readonly string[] {
  const normal = text.replace(/\r\n?/g, "\n");
  const lines = normal.split("\n");
  while (lines.length > 0 && (lines[lines.length - 1] as string).trim() === "") lines.pop();
  while (lines.length > 0 && (lines[0] as string).trim() === "") lines.shift();
  if (lines.length === 1) {
    const single = lines[0] as string;
    const byTab = single.split("\t");
    if (byTab.length > 1) return byTab;
    const bySemicolon = single.split(";");
    if (bySemicolon.length > 1) return bySemicolon;
    const byBlank = split(single);
    if (byBlank.length === 12 && byBlank.every((token) => readValue(token, convention).kind !== "unread")) return byBlank;
  }
  return lines.flatMap((line) => (line.includes("\t") && line.split("\t").length > 1 ? line.split("\t") : [line]));
}

export function parseSeries(text: string, locale: Locale = "de"): Parsed {
  const convention = detectConvention(text, locale);
  if (text.trim() === "") return { entries: [], countMismatch: null, convention };
  const lines = text.replace(/\r\n?/g, "\n").split("\n").filter((line) => line.trim() !== "");
  const tries = lines.map((line, i) => labelled(i, line, convention));
  const labelCount = tries.filter((found) => found !== null).length;
  // Month labels carry the position: at least one labelled line, and not a lone stray number.
  if (labelCount > 0) {
    const entries = lines.map((line, i) => tries[i] ?? entry(i, line.trim(), null, null, false));
    return { entries, countMismatch: null, convention };
  }
  const cells = slots(text, convention);
  // A header ("kWh", "Verbrauch") above the values is listed as not read; it does not shift the months.
  let position = 0;
  let header = true;
  const entries = cells.map((cell, i) => {
    const read = readValue(cell, convention);
    if (header && read.kind === "unread") return entry(i, cell.trim(), null, null, true);
    header = false;
    position += 1;
    return entry(i, cell.trim(), position <= 12 ? position : null, read, true);
  });
  const counted = entries.filter((found) => found.month !== null || found.kind !== "unread").length;
  return { entries, countMismatch: counted === 12 ? null : counted, convention };
}

/** Applies the visitor's choices and lays the entries on twelve months. */
export function resolveCells(parsed: Parsed, choice: Resolution = NO_RESOLUTION): Resolved {
  const byMonth = new Map<number, Entry[]>();
  for (const found of parsed.entries) {
    if (found.month === null || found.kind === "unread") continue;
    byMonth.set(found.month, [...(byMonth.get(found.month) ?? []), found]);
  }
  const duplicates: { month: number; first: number; second: number }[] = [];
  const cells: MonthCell[] = [];
  for (let month = 1; month <= 12; month += 1) {
    const edit = choice.edits.get(month);
    const rows = byMonth.get(month) ?? [];
    if (rows.length > 1) duplicates.push({ month, first: (rows[0] as Entry).id, second: (rows[1] as Entry).id });
    if (edit !== undefined) {
      const read = readValue(edit, parsed.convention);
      cells.push(read.kind === "value"
        ? { month, value: read.value, state: read.estimate ? "estimate" : "proven" }
        : { month, value: null, state: "missing" });
      continue;
    }
    const chosen = rows.length > 1 && choice.swaps.has(month) ? rows[1] : rows[0];
    if (!chosen || chosen.kind !== "value" || chosen.value === null) {
      cells.push({ month, value: null, state: "missing" });
      continue;
    }
    const other = chosen.alt ?? chosen.quiet?.alt ?? null;
    const value = choice.flips.has(chosen.id) && other !== null ? other : chosen.value;
    cells.push({ month, value: round(value, 6), state: chosen.estimate ? "estimate" : "proven" });
  }
  return { cells, duplicates, unitHints: unitHints(cells), zeroHints: zeroHints(cells) };
}

/** Months whose value is more than 20 times above or below the median of the others. */
export function unitHints(cells: readonly MonthCell[]): readonly number[] {
  const values = cells.filter((cell) => cell.value !== null && cell.value > 0).map((cell) => cell.value as number);
  if (values.length < 3) return [];
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 1 ? (sorted[mid] as number) : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
  return cells
    .filter((cell) => cell.value !== null && cell.value > 0 && (cell.value > median * 20 || cell.value < median / 20))
    .map((cell) => cell.month);
}

/** Months that read as exactly 0. A zero is shown as proven only with the visitor's eyes on it. */
export function zeroHints(cells: readonly MonthCell[]): readonly number[] {
  return cells.filter((cell) => cell.state === "proven" && cell.value === 0).map((cell) => cell.month);
}

export const clampMonth = (month: number) => clamp(Math.round(month), 1, 12);

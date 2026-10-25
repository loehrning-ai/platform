/**
 * Reads a weekly table the way pruefen.py `lesen` does (the code block of
 * content/skills/prognose-pruefen/SKILL.md), so the demo, the skill and the
 * script agree on every week: header aliases, ; or tab or comma, the same
 * date and number formats, identical duplicates counted once, missing weeks
 * inserted empty, daily data refused. Pure: no DOM, no network.
 *
 * Errors are data ({ key, ... }); copy.ts turns them into one sentence that
 * names the line and the fix.
 */

/** One calendar week. `woche` is the ISO date of the row's day (yyyy-mm-dd). */
export interface Row {
  readonly woche: string;
  readonly ist: number | null;
  /** The forecast stored at the time. */
  readonly f: number | null;
  readonly hinweis: string;
  /** Sold out (a note or bestand_ende = 0): the actual is smaller than the demand. */
  readonly zensiert: boolean;
}

export type ParseError =
  | { readonly key: "empty" }
  | { readonly key: "tooBig" }
  | { readonly key: "tooManyRows"; readonly rows: number }
  | { readonly key: "header" }
  | { readonly key: "date"; readonly line: number; readonly value: string }
  | { readonly key: "number"; readonly line: number; readonly column: string; readonly value: string }
  | { readonly key: "negative"; readonly line: number; readonly column: string; readonly value: string }
  | { readonly key: "conflict"; readonly date: string; readonly first: number; readonly line: number }
  | { readonly key: "daily" };

export type ParseNotice =
  | { readonly key: "duplicate"; readonly date: string }
  | { readonly key: "gap"; readonly date: string };

export interface ParsedTable {
  readonly rows: readonly Row[];
  readonly notices: readonly ParseNotice[];
  /** Header cells that map to no column, as typed. */
  readonly ignored: readonly string[];
  readonly hasForecast: boolean;
}

export type ParseResult =
  | ({ readonly ok: true } & ParsedTable)
  | { readonly ok: false; readonly error: ParseError };

export const MAX_BYTES = 1_000_000;
export const MAX_ROWS = 1000;

type Column = "woche" | "ist" | "prognose" | "hinweis" | "bestand";

/** The aliases of pruefen.py ALIAS, lower case. */
export const ALIAS: Readonly<Record<string, Column>> = {
  woche: "woche", week: "woche", datum: "woche", date: "woche", kw: "woche",
  ist: "ist", verkauft: "ist", absatz: "ist", sales: "ist", actual: "ist",
  prognose: "prognose", forecast: "prognose", tool_prognose: "prognose",
  hinweis: "hinweis", note: "hinweis", kommentar: "hinweis",
  bestand_ende: "bestand", bestand: "bestand", stock_end: "bestand",
};

export const SOLD_OUT_WORDS = ["ausverkauft", "sold out", "stockout", "fehlbestand"] as const;

/** The separator of the header line: ; first, then tab, then comma. */
export function sniffDelimiter(header: string): ";" | "\t" | "," {
  if (header.includes(";")) return ";";
  if (header.includes("\t")) return "\t";
  return ",";
}

/** One CSV line into cells, with "quoted" cells and "" as an escaped quote. */
export function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i] as string;
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && cell === "") quoted = true;
    else if (char === delimiter) {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }
  cells.push(cell);
  return cells;
}

const DAY_MS = 86_400_000;

/** Days since 1970-01-01 for a valid calendar date, else null. */
export function dayNumber(year: number, month: number, day: number): number | null {
  if (!(year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= 31)) return null;
  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return Math.round(ms / DAY_MS);
}

export function isoFromDay(dayNum: number): string {
  return new Date(dayNum * DAY_MS).toISOString().slice(0, 10);
}

export function dayFromIso(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return dayNumber(y as number, m as number, d as number) as number;
}

/** Monday of ISO week `week` in ISO year `year` (Python date.fromisocalendar). */
function isoWeekMonday(year: number, week: number): number | null {
  if (week < 1 || week > 53) return null;
  const jan4 = dayNumber(year, 1, 4) as number;
  const jan4Weekday = (((jan4 + 3) % 7) + 7) % 7; // 0 = Monday (1970-01-01 was a Thursday)
  const monday = jan4 - jan4Weekday + (week - 1) * 7;
  if (week === 53) {
    // only years with 53 ISO weeks
    const dec28 = dayNumber(year, 12, 28) as number;
    const lastWeekMonday = dec28 - ((((dec28 + 3) % 7) + 7) % 7);
    if (monday > lastWeekMonday) return null;
  }
  return monday;
}

/** pruefen.py `datum`: 2025-10-27, 27.10.2025, 27.10.25, 27/10/2025, KW 44/2025, 2025-W44. */
export function parseDate(input: string): string | null {
  const s = input.trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) return toIso(Number(m[1]), Number(m[2]), Number(m[3]));
  m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s);
  if (m) return toIso(Number(m[3]), Number(m[2]), Number(m[1]));
  m = /^(\d{1,2})\.(\d{1,2})\.(\d{2})$/.exec(s);
  if (m) {
    const yy = Number(m[3]);
    return toIso(yy < 69 ? 2000 + yy : 1900 + yy, Number(m[2]), Number(m[1]));
  }
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) return toIso(Number(m[3]), Number(m[2]), Number(m[1]));
  m = /^(?:KW|W)\s?(\d{1,2})[/ -](\d{4})$/i.exec(s);
  if (m) return fromWeek(Number(m[2]), Number(m[1]));
  m = /^(\d{4})-W(\d{2})$/.exec(s);
  if (m) return fromWeek(Number(m[1]), Number(m[2]));
  return null;
}

function toIso(year: number, month: number, day: number): string | null {
  const n = dayNumber(year, month, day);
  return n === null ? null : isoFromDay(n);
}

function fromWeek(year: number, week: number): string | null {
  const n = isoWeekMonday(year, week);
  return n === null ? null : isoFromDay(n);
}

export type CellNumber = { readonly ok: true; readonly value: number | null } | { readonly ok: false; readonly negative: boolean };

/** pruefen.py `zahl`: DE and EN thousands groups, a decimal comma or point; empty is null. */
export function parseCell(input: string | undefined): CellNumber {
  let t = (input ?? "").trim().replace(/[\u00a0\u202f ]/g, "");
  if (t === "") return { ok: true, value: null };
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replaceAll(".", "").replace(",", ".");
  else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) t = t.replaceAll(",", "");
  else if (/^\d+,\d+$/.test(t)) t = t.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(t)) return { ok: false, negative: /^[-−]\s*\d/.test(t) };
  return { ok: true, value: Number(t) };
}

const COLUMN_LABEL: Readonly<Record<Column, string>> = {
  woche: "woche", ist: "ist", prognose: "prognose", hinweis: "hinweis", bestand: "bestand_ende",
};

function sameRow(a: Omit<Row, "woche">, b: Omit<Row, "woche">): boolean {
  return a.ist === b.ist && a.f === b.f && a.hinweis === b.hinweis && a.zensiert === b.zensiert;
}

/** The whole table, or the first problem. Nothing is computed from a partly read file. */
export function parseTable(text: string): ParseResult {
  if (text.length > MAX_BYTES) return { ok: false, error: { key: "tooBig" } };
  const lines = text.replace(/^\uFEFF/, "").split(/\r\n|\n|\r/);
  while (lines.length > 0 && (lines[lines.length - 1] as string).trim() === "") lines.pop();
  if (lines.length === 0 || (lines[0] as string).trim() === "") return { ok: false, error: { key: "empty" } };
  if (lines.length - 1 > MAX_ROWS) return { ok: false, error: { key: "tooManyRows", rows: lines.length - 1 } };

  const delimiter = sniffDelimiter(lines[0] as string);
  const headerCells = splitLine(lines[0] as string, delimiter);
  const header = headerCells.map((cell) => ALIAS[cell.trim().toLowerCase()] ?? null);
  if (!header.includes("woche") || !header.includes("ist")) return { ok: false, error: { key: "header" } };
  const ignored = headerCells.filter((cell, index) => header[index] === null && cell.trim() !== "").map((cell) => cell.trim());

  const byDay = new Map<number, { row: Omit<Row, "woche">; line: number }>();
  const notices: ParseNotice[] = [];
  for (let index = 1; index < lines.length; index += 1) {
    const line = index + 1;
    const cells = splitLine(lines[index] as string, delimiter);
    if (!cells.some((cell) => cell.trim() !== "")) continue;
    const record: Partial<Record<Column, string>> = {};
    header.forEach((column, i) => {
      if (column) record[column] = cells[i] ?? "";
    });
    const iso = parseDate(record.woche ?? "");
    if (iso === null) return { ok: false, error: { key: "date", line, value: (record.woche ?? "").trim() } };
    const values: Partial<Record<"ist" | "prognose" | "bestand", number | null>> = {};
    for (const column of ["ist", "prognose", "bestand"] as const) {
      const parsed = parseCell(record[column]);
      if (!parsed.ok) {
        const value = (record[column] ?? "").trim();
        return { ok: false, error: { key: parsed.negative ? "negative" : "number", line, column: COLUMN_LABEL[column], value } };
      }
      values[column] = parsed.value;
    }
    const hinweis = (record.hinweis ?? "").trim();
    const lower = (record.hinweis ?? "").toLowerCase();
    const row = {
      ist: values.ist ?? null,
      f: values.prognose ?? null,
      hinweis,
      zensiert: values.bestand === 0 || SOLD_OUT_WORDS.some((word) => lower.includes(word)),
    };
    const day = dayFromIso(iso);
    const seen = byDay.get(day);
    if (seen) {
      if (sameRow(seen.row, row)) {
        notices.push({ key: "duplicate", date: iso });
        continue;
      }
      return { ok: false, error: { key: "conflict", date: iso, first: seen.line, line } };
    }
    byDay.set(day, { row, line });
  }
  const days = [...byDay.keys()].sort((a, b) => a - b);
  if (days.length === 0) return { ok: false, error: { key: "empty" } };
  for (let i = 1; i < days.length; i += 1) {
    if ((days[i] as number) - (days[i - 1] as number) === 1) return { ok: false, error: { key: "daily" } };
  }
  const rows: Row[] = [];
  for (const day of days) {
    while (rows.length > 0 && day - dayFromIso((rows[rows.length - 1] as Row).woche) > 7) {
      const empty = isoFromDay(dayFromIso((rows[rows.length - 1] as Row).woche) + 7);
      notices.push({ key: "gap", date: empty });
      rows.push({ woche: empty, ist: null, f: null, hinweis: "", zensiert: false });
    }
    rows.push({ woche: isoFromDay(day), ...(byDay.get(day) as { row: Omit<Row, "woche"> }).row });
  }
  return { ok: true, rows, notices, ignored, hasForecast: rows.some((row) => row.f !== null) };
}

/**
 * "Deine Datei": the visitor's own CSV, read in the browser only. The demo
 * finds a date column and, if there is one, a quantity column, then compares
 * the last two complete calendar months two ways, the same fork as the
 * Zähler lesson: rows counted and quantity summed. Pure; nothing leaves the
 * page. Limits: 1 MB, 20.000 rows, separator from the header line.
 */

export const MAX_BYTES = 1_000_000;
export const MAX_ROWS = 20_000;
/** A column is a date or number column when this share of its filled cells parse. */
const COLUMN_SHARE = 0.8;

export type CsvError = "tooBig" | "tooMany" | "empty" | "noDate" | "noMonths" | "read";

export interface CsvTable {
  readonly header: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

export function separatorOf(headerLine: string): string {
  const counts = ["\t", ";", ","].map((sep) => ({
    sep,
    n: headerLine.split(sep).length - 1,
  }));
  const best = counts.sort((a, b) => b.n - a.n)[0];
  return best && best.n > 0 ? best.sep : ",";
}

/** Splits one line, honouring double quotes ("a;b" stays one cell, "" is a quote). */
export function splitLine(line: string, sep: string): readonly string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index] as string;
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === sep) {
      cells.push(cell.trim());
      cell = "";
    } else cell += char;
  }
  cells.push(cell.trim());
  return cells;
}

export function parseCsv(text: string): CsvTable | CsvError {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");
  const [head, ...body] = lines;
  if (!head || body.length === 0) return "empty";
  if (body.length > MAX_ROWS) return "tooMany";
  const sep = separatorOf(head);
  return {
    header: splitLine(head, sep),
    rows: body.map((line) => splitLine(line, sep)),
  };
}

/** "2023-09-30", "2023-09-30T08:00", "30.09.2023" or "30.9.2023" to [year, month, day]; else null. */
export function parseDate(cell: string): readonly [number, number, number] | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/.exec(cell);
  const dotted = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(cell);
  const [y, m, d] = iso ? [iso[1], iso[2], iso[3]] : dotted ? [dotted[3], dotted[2], dotted[1]] : [];
  if (!y || !m || !d) return null;
  const parts = [Number(y), Number(m), Number(d)] as const;
  if (parts[1] < 1 || parts[1] > 12 || parts[2] < 1 || parts[2] > 31) return null;
  return parts;
}

/** A number in German ("1.234,5") or English ("1,234.5") style. */
export function parseNumber(cell: string, style: "de" | "en"): number | null {
  const clean = cell.replace(/[\s\u00A0€$%]/g, "");
  if (!/^[+-]?[\d.,]+$/.test(clean)) return null;
  const normal = style === "de" ? clean.replace(/\./g, "").replace(",", ".") : clean.replace(/,/g, "");
  const value = Number(normal);
  return Number.isFinite(value) ? value : null;
}

/** German or English digits, by the majority of cells that only one style reads cleanly. */
export function numberStyle(cells: readonly string[]): "de" | "en" {
  let de = 0;
  let en = 0;
  for (const cell of cells) {
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$|^\d+,\d+$/.test(cell)) de += 1;
    else if (/^\d{1,3}(,\d{3})+(\.\d+)?$|^\d+\.\d+$/.test(cell)) en += 1;
  }
  return de > en ? "de" : "en";
}

function share(cells: readonly string[], test: (cell: string) => boolean): number {
  const filled = cells.filter((cell) => cell !== "");
  return filled.length === 0 ? 0 : filled.filter(test).length / filled.length;
}

export interface Columns {
  readonly dates: readonly number[];
  readonly numbers: readonly number[];
}

export function detectColumns(table: CsvTable): Columns {
  const dates: number[] = [];
  const numbers: number[] = [];
  table.header.forEach((_, index) => {
    const cells = table.rows.map((row) => row[index] ?? "");
    if (share(cells, (cell) => parseDate(cell) !== null) >= COLUMN_SHARE) dates.push(index);
    else {
      const style = numberStyle(cells);
      if (share(cells, (cell) => parseNumber(cell, style) !== null) >= COLUMN_SHARE) numbers.push(index);
    }
  });
  return { dates, numbers };
}

export interface MonthCompare {
  /** "YYYY-MM" of the earlier and the later month. */
  readonly m1: string;
  readonly m2: string;
  readonly rows: readonly [number, number];
  readonly qty: readonly [number, number] | null;
}

const daysIn = (year: number, month: number) => [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 31;
const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;

/**
 * The last two complete calendar months: every month between the first and
 * the last date, plus the first or last month when the dates reach its first
 * or last day.
 */
export function compareMonths(table: CsvTable, dateColumn: number, qtyColumn: number | null): MonthCompare | CsvError {
  const parsed = table.rows.map((row) => parseDate(row[dateColumn] ?? "")).filter((date): date is readonly [number, number, number] => date !== null);
  if (parsed.length === 0) return "noDate";
  const ordinal = (d: readonly [number, number, number]) => d[0] * 10000 + d[1] * 100 + d[2];
  const sorted = [...parsed].sort((a, b) => ordinal(a) - ordinal(b));
  const first = sorted[0] as readonly [number, number, number];
  const last = sorted[sorted.length - 1] as readonly [number, number, number];
  const months: string[] = [];
  for (let y = first[0], m = first[1]; y < last[0] || (y === last[0] && m <= last[1]); m === 12 ? ((m = 1), (y += 1)) : (m += 1)) {
    const isFirst = y === first[0] && m === first[1];
    const isLast = y === last[0] && m === last[1];
    if (isFirst && first[2] !== 1) continue;
    if (isLast && last[2] !== daysIn(y, m)) continue;
    months.push(monthKey(y, m));
  }
  if (months.length < 2) return "noMonths";
  const m1 = months[months.length - 2] as string;
  const m2 = months[months.length - 1] as string;
  const style = qtyColumn === null ? "en" : numberStyle(table.rows.map((row) => row[qtyColumn] ?? ""));
  const rows: [number, number] = [0, 0];
  const qty: [number, number] = [0, 0];
  for (const row of table.rows) {
    const date = parseDate(row[dateColumn] ?? "");
    if (!date) continue;
    const key = monthKey(date[0], date[1]);
    const slot = key === m1 ? 0 : key === m2 ? 1 : -1;
    if (slot === -1) continue;
    rows[slot] += 1;
    if (qtyColumn !== null) qty[slot] += parseNumber(row[qtyColumn] ?? "", style) ?? 0;
  }
  return { m1, m2, rows, qty: qtyColumn === null ? null : qty };
}

export type Direction = "up" | "down" | "flat";

export function direction(a: number, b: number): Direction {
  if (b > a) return "up";
  if (b < a) return "down";
  return "flat";
}

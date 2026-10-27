/**
 * "Deine Datei, deine Karte": the visitor's own file, read in this browser
 * tab only. Pure functions: the text goes in, column names, types and
 * monthly totals come out. Cell values are never shown, except short codes
 * after the visitor asks for them. Limits: 200 KB, 2.000 rows, 40 columns.
 *
 * The one rule that matters: a change is summed per month, a level never
 * is. A level takes the last value of the month (per group, then summed
 * across groups), so a daily stock file gives the stock at month end.
 */

export const OWN_LIMITS = { bytes: 200_000, rows: 2_000, cols: 40 } as const;

export type CsvError = "empty" | "tooBig" | "tooManyRows" | "tooManyCols";

export interface Table {
  readonly header: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

export type ColumnType = "date" | "number" | "code" | "text";

export interface Column {
  readonly index: number;
  readonly name: string;
  readonly type: ColumnType;
  /** A number column with at least one negative value (lint L1: probably a change). */
  readonly negatives: boolean;
  /** Distinct values of a code column, sorted; empty for every other type. */
  readonly codes: readonly string[];
}

/** The separator with the most hits in the header line: tab, semicolon or comma. */
export function separatorOf(headerLine: string): string {
  const counts = ["\t", ";", ","].map((sep) => ({ sep, n: headerLine.split(sep).length - 1 }));
  const best = [...counts].sort((a, b) => b.n - a.n)[0];
  return best && best.n > 0 ? best.sep : ",";
}

/** One line into cells, honouring double quotes ("a;b" stays one cell, "" is a quote). */
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

/** Reads CSV, TSV or plain text with a header line. `bytes` is the file size, checked first. */
export function parseTable(text: string, bytes = text.length): Table | CsvError {
  if (bytes > OWN_LIMITS.bytes) return "tooBig";
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");
  const [head, ...body] = lines;
  if (!head || body.length === 0) return "empty";
  if (body.length > OWN_LIMITS.rows) return "tooManyRows";
  const sep = separatorOf(head);
  const header = splitLine(head, sep).map((name, index) => name || `#${index + 1}`);
  if (header.length > OWN_LIMITS.cols) return "tooManyCols";
  const rows = body.map((line) => {
    const cells = splitLine(line, sep);
    return header.map((_, index) => cells[index] ?? "");
  });
  return { header, rows };
}

/**
 * A cell as a number, or null. Reads "1234", "-19960", "−19.960" (German
 * grouping), "1.234,5", "1,234.5", "12,5" and "12.5"; a currency sign or a
 * percent sign around it is ignored. One separator followed by exactly three
 * digits ("19.960", "1,234") is read as grouping in both notations.
 */
export function numberOf(cell: string): number | null {
  let text = cell.trim().replace(/[\u2212\u2013]/g, "-").replace(/[€$£%\s\u00A0]/g, "");
  if (text === "" || !/^[-+]?[\d.,]+$/.test(text)) return null;
  const lastDot = text.lastIndexOf(".");
  const lastComma = text.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    text = lastComma > lastDot ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  } else if (lastComma >= 0) {
    const groups = text.split(",");
    text = groups.length > 2 || /^[-+]?\d{1,3},\d{3}$/.test(text) ? text.replace(/,/g, "") : text.replace(",", ".");
  } else if (lastDot >= 0 && (text.split(".").length > 2 || /^[-+]?\d{1,3}\.\d{3}$/.test(text))) {
    text = text.replace(/\./g, "");
  }
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/**
 * A cell as a sortable date "YYYY-MM-DD HH:MM", or null. Reads ISO dates
 * with or without a time, "YYYY-MM" and German "DD.MM.YYYY".
 */
export function dateOf(cell: string): string | null {
  const text = cell.trim();
  const iso = /^(\d{4})-(\d{2})(?:-(\d{2}))?(?:[ T](\d{2}):(\d{2}))?/.exec(text);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3] ?? "01"} ${iso[4] ?? "00"}:${iso[5] ?? "00"}`;
  const de = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(text);
  if (de) return `${de[3]}-${String(de[2]).padStart(2, "0")}-${String(de[1]).padStart(2, "0")} 00:00`;
  return null;
}

/** "2026-04-30 23:59" to "2026-04". */
export function monthOf(cell: string): string | null {
  return dateOf(cell)?.slice(0, 7) ?? null;
}

const COLUMN_SHARE = 0.8;
const MAX_CODE_LENGTH = 3;
const MAX_CODES = 8;

/** Name, type and the lint facts of every column. */
export function profile(table: Table): readonly Column[] {
  return table.header.map((name, index) => {
    const cells = table.rows.map((row) => row[index] ?? "").filter((cell) => cell !== "");
    const share = (test: (cell: string) => boolean) => (cells.length === 0 ? 0 : cells.filter(test).length / cells.length);
    const distinct = [...new Set(cells)].sort();
    let type: ColumnType = "text";
    if (share((cell) => dateOf(cell) !== null) >= COLUMN_SHARE) type = "date";
    else if (share((cell) => numberOf(cell) !== null) >= COLUMN_SHARE) type = "number";
    else if (distinct.length > 0 && distinct.length <= MAX_CODES && distinct.every((value) => value.length <= MAX_CODE_LENGTH)) type = "code";
    const negatives = type === "number" && cells.some((cell) => (numberOf(cell) ?? 0) < 0);
    return { index, name, type, negatives, codes: type === "code" ? distinct : [] };
  });
}

/** L6: names that look like identifiers of people go straight into box 4. */
const IDENTIFIER = /mail|phone|telefon|handy|mobil|\bname\b|vorname|nachname|first.?name|last.?name|full.?name|address|adresse|anschrift|stra(?:ss|ß)e|street|iban|birth|geburt|\bdob\b|personal.?n|staff.?n|employee.?(?:id|n)|mitarbeiter.?n|ssn|steuer.?id|tax.?id/i;
/** L4: names that say nothing about what the number means. */
const VAGUE = /^(?:amount|value|values|wert|werte|betrag|status|qty|val|num|number|count|data|daten|summe|sum|total)$/i;

export interface Lints {
  /** L1: the number column has negatives, so it is probably a change. */
  readonly negative: boolean;
  /** L2: columns of short codes, by name. */
  readonly codeColumns: readonly string[];
  /** L4: vague column names. */
  readonly vague: readonly string[];
  /** L6: names that look like identifiers of people. */
  readonly identifiers: readonly string[];
}

export function lintColumns(columns: readonly Column[], valueIndex: number | null): Lints {
  const value = columns.find((column) => column.index === valueIndex);
  return {
    negative: value?.negatives ?? false,
    codeColumns: columns.filter((column) => column.type === "code").map((column) => column.name),
    vague: columns.filter((column) => VAGUE.test(column.name.trim())).map((column) => column.name),
    identifiers: columns.filter((column) => IDENTIFIER.test(column.name)).map((column) => column.name),
  };
}

export type OwnKind = "change" | "level";

export interface MonthValue {
  readonly month: string;
  readonly value: number;
}

/**
 * The monthly series the own tub draws. A change: the sum of the month. A
 * level: the value with the latest date in the month (a later row wins a
 * tie), per group when a group column is named, then summed across groups.
 * Rows without a readable date or number are skipped.
 */
export function monthly(table: Table, valueIndex: number, dateIndex: number, kind: OwnKind, groupIndex: number | null = null): readonly MonthValue[] {
  const sums = new Map<string, number>();
  const last = new Map<string, { readonly at: string; readonly value: number; readonly month: string }>();
  for (const row of table.rows) {
    const at = dateOf(row[dateIndex] ?? "");
    const value = numberOf(row[valueIndex] ?? "");
    if (at === null || value === null) continue;
    const month = at.slice(0, 7);
    if (kind === "change") {
      sums.set(month, (sums.get(month) ?? 0) + value);
      continue;
    }
    const key = `${groupIndex === null ? "" : (row[groupIndex] ?? "")}\u0000${month}`;
    const seen = last.get(key);
    if (!seen || at >= seen.at) last.set(key, { at, value, month });
  }
  if (kind === "level") for (const entry of last.values()) sums.set(entry.month, (sums.get(entry.month) ?? 0) + entry.value);
  return [...sums.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, value]) => ({ month, value: Math.round(value * 100) / 100 }));
}

/** The first number and first date column, as the chips are prefilled. */
export function defaultColumns(columns: readonly Column[]): { readonly value: number | null; readonly date: number | null } {
  return {
    value: columns.find((column) => column.type === "number")?.index ?? null,
    date: columns.find((column) => column.type === "date")?.index ?? null,
  };
}

/** A group column worth suggesting for a level: a code column, when there is one. */
export function defaultGroup(columns: readonly Column[]): number | null {
  return columns.find((column) => column.type === "code" && column.codes.length > 1)?.index ?? null;
}

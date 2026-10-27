/**
 * "Deine Datei": the visitor's export of electricity, gas or water bills,
 * read in the browser only. Pure: text in, rows or one error code out. It
 * accepts a CSV with ";", "," or tab, a paste from Excel, German or English
 * headers and numbers, and months as 2025-01, 01.2025, 01/2025 or Jan 2025.
 * Nothing here touches the network or browser storage.
 */
import type { BillRow } from "./rules";

export const MAX_BYTES = 1_000_000;
export const MAX_ROWS = 500;

export type ParseError = "empty" | "tooBig" | "tooMany" | "noHeader" | "noMonth" | "noAmount" | "noRows";

export interface ParsedBills {
  readonly ok: true;
  /** Every row with a month and an amount, in file order, with its line in the file. */
  readonly rows: readonly BillRow[];
  /** The years found, most rows first. */
  readonly years: readonly number[];
  /** The year with the most rows (the visitor can change it). */
  readonly year: number;
  /** The unit as the header names it ("kWh", "m³"), or null. */
  readonly unit: string | null;
  /** True when the file has no invoice column: a month booked twice with the same amount counts as one booking. */
  readonly noInvoice: boolean;
  /** Data rows that had no readable month or amount. */
  readonly skipped: number;
}

export type ParseResult = ParsedBills | { readonly ok: false; readonly error: ParseError };

const HEADERS = {
  month: ["monat", "month", "periode", "period", "abrechnungsmonat", "abrechnungszeitraum", "billing month", "billing period", "zeitraum", "datum", "date"],
  invoice: ["rechnungsnr", "rechnungsnummer", "rechnung", "rechnung nr", "invoice", "invoice no", "invoice number", "beleg nr", "belegnr", "belegnummer", "nr"],
  amount: ["kwh", "mwh", "m3", "m³", "menge", "verbrauch", "amount", "consumption", "quantity", "usage", "volume"],
} as const;

const UNITS: Readonly<Record<string, string>> = { kwh: "kWh", mwh: "MWh", m3: "m³", "m³": "m³" };

const MONTH_NAMES: Readonly<Record<string, number>> = {
  jan: 1, januar: 1, january: 1, jänner: 1,
  feb: 2, februar: 2, february: 2,
  mär: 3, mar: 3, märz: 3, maerz: 3, march: 3,
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

const normal = (cell: string) =>
  cell
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .toLowerCase()
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** The column whose header names a role; the first match wins. */
function findColumn(header: readonly string[], names: readonly string[]): number {
  const cells = header.map(normal);
  for (const name of names) {
    const exact = cells.indexOf(name);
    if (exact >= 0) return exact;
  }
  for (const name of names) {
    const loose = cells.findIndex((cell) => cell.split(" ").includes(name));
    if (loose >= 0) return loose;
  }
  return -1;
}

/** The separator the header line uses most: ";", tab or ",". */
export function detectSeparator(line: string): string {
  const counts = [";", "\t", ","].map((separator) => [separator, line.split(separator).length - 1] as const);
  const best = counts.reduce((a, b) => (b[1] > a[1] ? b : a));
  return best[1] > 0 ? best[0] : ";";
}

/** Splits one line, honouring double quotes. */
export function splitLine(line: string, separator: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let at = 0; at < line.length; at += 1) {
    const char = line[at] as string;
    if (quoted) {
      if (char === '"' && line[at + 1] === '"') {
        cell += '"';
        at += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === separator) {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }
  cells.push(cell);
  return cells.map((value) => value.trim());
}

/** "2025-01", "01.2025", "1/2025", "Jan 2025", "Januar 2025", "2025-01-31", "31.01.2025" to "2025-01". */
export function parseMonth(text: string): string | null {
  const value = text.trim().toLowerCase().replace(/\s+/g, " ");
  const pad = (month: number) => String(month).padStart(2, "0");
  const valid = (year: number, month: number) => year >= 1990 && year <= 2100 && month >= 1 && month <= 12;
  let match = /^(\d{4})[-/.](\d{1,2})(?:[-/.]\d{1,2})?$/.exec(value);
  if (match && valid(Number(match[1]), Number(match[2]))) return `${match[1]}-${pad(Number(match[2]))}`;
  match = /^(?:\d{1,2}[./-])?(\d{1,2})[./-](\d{4})$/.exec(value);
  if (match && valid(Number(match[2]), Number(match[1]))) return `${match[2]}-${pad(Number(match[1]))}`;
  match = /^([a-zäöü]+)\.? ?'?(\d{2}|\d{4})$/.exec(value);
  if (match) {
    const month = MONTH_NAMES[match[1] as string];
    const year = (match[2] as string).length === 2 ? 2000 + Number(match[2]) : Number(match[2]);
    if (month && valid(year, month)) return `${year}-${pad(month)}`;
  }
  return null;
}

/** German numbers ("21.400", "9,50") or English ones ("21,400", "9.50"), decided for the whole column. */
export function numberFormat(values: readonly string[]): "de" | "en" {
  let de = 0;
  let en = 0;
  for (const raw of values) {
    const value = raw.replace(/[\s\u00A0'’]/g, "");
    if (/,\d{1,2}$/.test(value) || /\.\d{3}(?:,|$)/.test(value)) de += 1;
    if (/\.\d{1,2}$/.test(value) || /,\d{3}(?:\.|$)/.test(value)) en += 1;
  }
  return de > en ? "de" : "en";
}

export function parseNumber(raw: string, format: "de" | "en"): number | null {
  let value = raw.replace(/[\s\u00A0'’]/g, "").replace(/[^\d.,-]/g, "");
  if (value === "" || value === "-") return null;
  value = format === "de" ? value.replace(/\./g, "").replace(",", ".") : value.replace(/,/g, "");
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

/** Reads a bill export. Line numbers count like a text editor, comments and the header included. */
export function parseBills(text: string): ParseResult {
  if (new TextEncoder().encode(text).length > MAX_BYTES) return { ok: false, error: "tooBig" };
  const lines = text.replace(/^\uFEFF/, "").split(/\r\n|\r|\n/);
  const headerAt = lines.findIndex((line) => line.trim() !== "" && !line.trim().startsWith("#"));
  if (headerAt < 0) return { ok: false, error: "empty" };
  const separator = detectSeparator(lines[headerAt] as string);
  const header = splitLine(lines[headerAt] as string, separator);
  const monthCol = findColumn(header, HEADERS.month);
  const amountCol = findColumn(header, HEADERS.amount);
  const invoiceCol = findColumn(header, HEADERS.invoice);
  if (monthCol < 0 && amountCol < 0) return { ok: false, error: "noHeader" };
  if (monthCol < 0) return { ok: false, error: "noMonth" };
  if (amountCol < 0) return { ok: false, error: "noAmount" };

  const data = lines
    .map((line, index) => ({ line: index + 1, cells: splitLine(line, separator), blank: line.trim() === "" || line.trim().startsWith("#") }))
    .slice(headerAt + 1)
    .filter((entry) => !entry.blank);
  if (data.length > MAX_ROWS) return { ok: false, error: "tooMany" };
  const format = numberFormat(data.map((entry) => entry.cells[amountCol] ?? ""));

  const rows: BillRow[] = [];
  let skipped = 0;
  for (const entry of data) {
    const month = parseMonth(entry.cells[monthCol] ?? "");
    const amount = parseNumber(entry.cells[amountCol] ?? "", format);
    if (!month || amount === null) {
      skipped += 1;
      continue;
    }
    const invoice = invoiceCol >= 0 ? (entry.cells[invoiceCol] ?? "").trim() : "";
    // Without an invoice number a booking is known by its month and amount.
    rows.push({ month, invoice: invoice || `#${amount}`, amount, line: entry.line });
  }
  if (rows.length === 0) return { ok: false, error: "noRows" };

  const perYear = new Map<number, number>();
  for (const row of rows) {
    const year = Number(row.month.slice(0, 4));
    perYear.set(year, (perYear.get(year) ?? 0) + 1);
  }
  const years = [...perYear.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]).map(([year]) => year);
  const unitKey = normal(header[amountCol] ?? "").split(" ").find((word) => word in UNITS);
  return {
    ok: true,
    rows,
    years,
    year: years[0] as number,
    unit: unitKey ? (UNITS[unitKey] as string) : null,
    noInvoice: invoiceCol < 0,
    skipped,
  };
}

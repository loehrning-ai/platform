import { formatDecimal, type Cell, type FigureTable } from "@/lib/figures";

function csvCell(cell: Cell): string {
  if (cell === null) return "";
  const text = String(cell);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV of exactly the plotted numbers: raw values, a dot as decimal separator, header first. */
export function tableToCsv(table: FigureTable): string {
  const lines = [table.columns, ...table.rows].map((row) => row.map(csvCell).join(","));
  return `${lines.join("\n")}\n`;
}

/** A download link that works without a request: the CSV is part of the page. */
export function csvDataUri(csv: string): string {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${csv}`)}`;
}

function decimalsOf(cell: Cell): number {
  return typeof cell === "number" ? Math.min(3, (String(cell).split(".")[1] ?? "").length) : 0;
}

/** Decimals per column: the most any number in that column carries, so 2 and 1,5 print as 2,0 and 1,5. */
export function columnDigits(table: FigureTable): readonly number[] {
  return table.columns.map((_, c) => Math.max(0, ...table.rows.map((row) => decimalsOf(row[c] ?? null))));
}

/** A cell as the reader sees it in the table: German separators, a steady number of decimals per column. */
export function formatCell(cell: Cell, digits = decimalsOf(cell)): string {
  if (cell === null) return "";
  if (typeof cell === "string") return cell;
  return formatDecimal(cell, digits);
}

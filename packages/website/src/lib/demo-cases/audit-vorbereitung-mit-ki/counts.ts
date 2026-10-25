/**
 * Counting the way the kit asks for it: CSV rows read with quotes, comment
 * lines skipped, duplicates removed before the count. Pure.
 */

/** One CSV line into cells (RFC 4180 quotes, comma separated). */
export function csvCells(line: string): readonly string[] {
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
    else if (char === ",") {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }
  cells.push(cell);
  return cells;
}

export interface CsvTable {
  readonly header: readonly string[];
  readonly rows: readonly Readonly<Record<string, string>>[];
  /** The raw data lines, in order, for quoting. */
  readonly lines: readonly string[];
}

/** A kit CSV: "#" comment lines first, then a header and data rows. */
export function readCsv(text: string): CsvTable {
  const lines = text.split("\n").filter((line) => line.trim() !== "" && !line.startsWith("#"));
  const header = csvCells(lines[0] ?? "");
  const data = lines.slice(1);
  return {
    header,
    lines: data,
    rows: data.map((line) => {
      const cells = csvCells(line);
      return Object.fromEntries(header.map((name, index) => [name, cells[index] ?? ""]));
    }),
  };
}

export function uniqueCount(rows: readonly Readonly<Record<string, string>>[], key: string): { readonly unique: number; readonly duplicates: number; readonly rows: number } {
  const seen = new Set(rows.map((row) => row[key]));
  return { unique: seen.size, duplicates: rows.length - seen.size, rows: rows.length };
}

export function share(part: number, whole: number): number {
  return whole > 0 ? part / whole : 0;
}

/** "20,8 %" in German, "20.8%" in English. */
export function formatPercent(value: number, locale: "de" | "en"): string {
  // One decimal where it carries information (20,8 %), none on a whole number (95 %).
  const text = (Math.round(value * 1000) / 10).toFixed(1).replace(/\.0$/, "");
  return locale === "de" ? `${text.replace(".", ",")} %` : `${text}%`;
}

/** "30,5" in German, "30.5" in English. */
export function formatDecimal(value: number, locale: "de" | "en"): string {
  const text = String(Math.round(value * 10) / 10);
  return locale === "de" ? text.replace(".", ",") : text;
}

/**
 * The visitor's own bill file, checked like the electricity file: months,
 * not rows. Pure: the sentences, the Markdown table for Claude and the mail
 * for the missing invoices are built from the parsed rows and the words of
 * the copy pack, so a test can read them without a browser.
 */
import type { Pack } from "./copy";
import { fill, monthList } from "./export";
import { distinctMonths, naiveSum, sumDistinct, type BillRow } from "./rules";

export interface OwnReport {
  readonly year: number;
  /** Rows of that year, in file order. */
  readonly rows: readonly BillRow[];
  readonly covered: number;
  readonly missing: readonly number[];
  readonly duplicates: readonly { readonly invoice: string; readonly lines: readonly number[] }[];
  /** Month numbers with two different invoices. */
  readonly conflicts: readonly number[];
  readonly naive: number;
  readonly distinct: number;
}

export function ownReport(rows: readonly BillRow[], year: number): OwnReport {
  const inYear = rows.filter((row) => row.month.startsWith(`${year}-`));
  const count = distinctMonths(inYear, year);
  return {
    year,
    rows: inYear,
    covered: 12 - count.missing.length,
    missing: count.missing,
    duplicates: count.duplicates,
    conflicts: count.conflicts.map((month) => Number(month.slice(5))),
    naive: naiveSum(inYear),
    distinct: sumDistinct(inYear),
  };
}

type OwnWords = Pack["own"];

const listOf = (items: readonly (string | number)[], and: string) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} ${and} ${items.at(-1)}`;

/** „Deine Datei deckt 10 von 12 Monaten 2025. Es fehlen Mai und September. …" */
export function reportSentences(report: OwnReport, own: OwnWords): string[] {
  const words = own.words;
  const month = (n: number) => words.months[n - 1] ?? String(n);
  const sentences = [fill(own.resultCovered, { n: report.covered, year: report.year })];
  if (report.missing.length > 0) sentences.push(fill(report.missing.length === 1 ? own.resultMissingOne : own.resultMissing, { months: monthList(report.missing, words) }));
  for (const duplicate of report.duplicates) {
    const times = own.times[duplicate.lines.length - 1] ?? fill(own.timesOther, { n: duplicate.lines.length });
    sentences.push(fill(own.resultDuplicate, { invoice: duplicate.invoice, times, lines: listOf(duplicate.lines, words.and) }));
  }
  for (const conflict of report.conflicts) sentences.push(fill(own.resultConflict, { month: month(conflict) }));
  sentences.push(report.missing.length > 0 ? fill(own.resultNeed, { months: monthList(report.missing, words) }) : own.resultComplete);
  return sentences;
}

const cell = (text: string) => text.replace(/\r?\n|\r/g, " ").replace(/\\/g, "\\\\").replace(/\|/g, "\\|");

/** „Als Tabelle für Claude kopieren": one line per row and per missing month. */
export function reportTable(report: OwnReport, own: OwnWords, format: (value: number) => string): string {
  const words = own.words;
  const month = (n: number) => words.months[n - 1] ?? String(n);
  const twice = new Set(report.duplicates.flatMap((duplicate) => duplicate.lines.slice(1)));
  const conflicts = new Set(report.conflicts);
  const lines = report.rows.map((row) => {
    const n = Number(row.month.slice(5));
    const status = twice.has(row.line) ? own.tableDuplicate : conflicts.has(n) ? words.statuses.schwach : words.statuses.belegt;
    return [`${month(n)} ${report.year}`, row.invoice, format(row.amount), status, ""];
  });
  for (const n of report.missing) lines.push([`${month(n)} ${report.year}`, "", "", words.statuses.luecke, fill(own.tableMissing, { month: month(n), year: report.year })]);
  const head = `| ${own.tableHead.join(" | ")} |`;
  const rule = `|${own.tableHead.map(() => "---").join("|")}|`;
  return [head, rule, ...lines.map((cells) => `| ${cells.map(cell).join(" | ")} |`)].join("\n");
}

/** „Mail mit der Nachfrage kopieren": the kit's mail, filled with the missing months. */
export function reportMail(report: OwnReport, own: OwnWords): string | null {
  if (report.missing.length === 0) return null;
  const months = monthList(report.missing, own.words);
  const values = { months, year: report.year };
  return [fill(own.mailSubject, values), "", ...own.mailBody.map((line) => fill(line, values))].join("\n");
}

/** The take-home line: „Meine Datei deckt 10 von 12 Monaten 2025. Es fehlen Mai und September." */
export function takeHomeLine(report: OwnReport, takehome: Pack["takehome"], own: OwnWords): string {
  return report.missing.length === 0
    ? fill(takehome.ownLineComplete, { year: report.year })
    : fill(report.missing.length === 1 ? takehome.ownLineOne : takehome.ownLine, { n: report.covered, year: report.year, months: monthList(report.missing, own.words) });
}

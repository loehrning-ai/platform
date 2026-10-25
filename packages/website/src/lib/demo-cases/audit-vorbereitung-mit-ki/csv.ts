/**
 * nachweis-index.csv, built in the browser: the header of
 * templates/evidence-index.csv, ";" in German and "," in English, a UTF-8
 * BOM for spreadsheet apps, RFC 4180 quoting, and a leading ' on any cell a
 * spreadsheet would run as a formula. Pure.
 */

import { kitText } from "./kit";

export const EVIDENCE_COLUMNS = [
  "item",
  "request",
  "file",
  "doc_type",
  "date",
  "date_kind",
  "approved_or_owned_by",
  "scope",
  "quote",
  "date_test",
  "approval_test",
  "scope_test",
  "quote_test",
  "status",
  "closing_document",
  "owner",
  "due",
] as const;

export type EvidenceColumn = (typeof EVIDENCE_COLUMNS)[number];
export type EvidenceRow = Readonly<Partial<Record<EvidenceColumn, string>>>;

/** The header line of the kit template, for the lockstep test. */
export function templateHeader(): string {
  return kitText("templates/evidence-index.csv").split("\n")[0] ?? "";
}

export function guardCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function csvCell(value: string, separator: string): string {
  const safe = guardCell(value);
  return /["\n\r]/.test(safe) || safe.includes(separator) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toEvidenceCsv(rows: readonly EvidenceRow[], locale: "de" | "en"): string {
  const separator = locale === "de" ? ";" : ",";
  const lines = [EVIDENCE_COLUMNS.join(separator), ...rows.map((row) => EVIDENCE_COLUMNS.map((column) => csvCell(row[column] ?? "", separator)).join(separator))];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

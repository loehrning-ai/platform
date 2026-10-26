/**
 * The three files the visitor takes home, built in the tab: the evidence
 * index (Vardar's, or the visitor's own folder once there is one), the gap
 * list with one request per gap, and the project instructions with the
 * visitor's audit date. Pure.
 */

import { OWNERS, itemById } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/case";
import type { W05Copy } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { toEvidenceCsv, type EvidenceRow } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/csv";
import { formatShort, windowStart } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/dates";
import type { Evaluation } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import type { Model } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
import type { OwnResult } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/own-folder";
import { VARDAR_VALUES, renderGapList, renderInstructions } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/render";
import type { Loc } from "./words";

/** The test columns in the template's words: "hält" / "scheitert" in German, "pass" / "FAIL" in English. */
const VERDICT = { de: { pass: "hält", fail: "scheitert", notMet: "nicht erfüllt" }, en: { pass: "pass", fail: "FAIL", notMet: "not met" } } as const;
const verdict = (pass: boolean, locale: Loc) => (pass ? VERDICT[locale].pass : VERDICT[locale].fail);

/** Kit rule 13: approvers and owners by role. "Dragan Ilievski, Managing Director" becomes "Managing Director"; a name without a role stays. */
export function roleOf(by: string | null): string {
  if (!by) return "";
  const comma = by.indexOf(",");
  return comma > 0 ? by.slice(comma + 1).trim() : by.trim();
}
const tri = (value: boolean | null, locale: Loc) => (value === null ? "?" : verdict(value, locale));

function vardarRow(result: Evaluation, copy: W05Copy, locale: Loc, due: string): EvidenceRow {
  const { tests, item } = result;
  const fact = tests.date.used ?? result.doc.date;
  return {
    item: item.id,
    request: item.request,
    file: result.doc.file,
    doc_type: copy.type[result.doc.type],
    date: fact?.iso ?? "",
    date_kind: fact ? copy.dateKind[fact.kind] : "",
    approved_or_owned_by: roleOf(tests.approval.by),
    scope: tests.scope.coveredSystems.join(" + "),
    quote: tests.quote.quote ?? "",
    period_test: verdict(tests.date.pass, locale),
    approval_test: verdict(tests.approval.pass, locale),
    scope_test: verdict(tests.scope.pass, locale),
    quote_test: tests.quote.kind === "pass" ? VERDICT[locale].pass : tests.quote.kind === "notMet" ? VERDICT[locale].notMet : verdict(false, locale),
    status: copy.status[result.status],
    closing_document: result.status === "covered" ? "" : item.closing[locale],
    owner: OWNERS[item.owner][locale],
    due: result.status === "covered" ? "" : formatShort(due, locale),
  };
}

export function indexCsv(model: Model, own: OwnResult | null, copy: W05Copy, locale: Loc): string {
  if (!own) return toEvidenceCsv(model.rows.map((row) => vardarRow(row.best, copy, locale, model.context.due)), locale);
  const rows: EvidenceRow[] = own.items.flatMap((ownItem) => {
    const item = itemById(ownItem.id);
    const status = copy.own.bound[ownItem.bound];
    if (ownItem.candidates.length === 0) return [{ item: item.id, request: item.label[locale], status, scope: "?", quote: "?", scope_test: "?", quote_test: "?" }];
    return ownItem.candidates.map((file) => ({
      item: item.id,
      request: item.label[locale],
      file: file.entry.name,
      doc_type: copy.type[file.type],
      date: file.date?.iso ?? "",
      date_kind: file.date ? (file.date.kind ?? file.date.source) : "",
      approved_or_owned_by: roleOf(file.approvedBy),
      scope: "?",
      quote: "?",
      period_test: tri(file.dateTest, locale),
      approval_test: tri(file.approvalTest, locale),
      scope_test: "?",
      quote_test: "?",
      status,
    }));
  });
  return toEvidenceCsv(rows, locale);
}

export function gapListMarkdown(model: Model, copy: W05Copy, locale: Loc): string {
  return renderGapList(
    model.rows.map((row) => row.best),
    model.context,
    copy.gapTemplate,
    locale,
  );
}

/** The project instructions in the page's language: Vardar's values, or the visitor's audit date with placeholders for customer and request file. */
export function instructionsText(copy: W05Copy, audit: string, months: number, locale: Loc): string {
  if (!audit) return renderInstructions(VARDAR_VALUES, locale);
  return renderInstructions(
    {
      customerFull: copy.takehome.customerPlaceholder,
      audit,
      windowStart: windowStart(audit, months),
      requestFile: copy.takehome.requestFilePlaceholder,
      fictional: false,
    },
    locale,
  );
}

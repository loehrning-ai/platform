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

const verdict = (pass: boolean) => (pass ? "pass" : "FAIL");
const tri = (value: boolean | null) => (value === null ? "?" : verdict(value));

function vardarRow(result: Evaluation, copy: W05Copy, locale: Loc, due: string): EvidenceRow {
  const { tests, item } = result;
  const fact = tests.date.used ?? result.doc.date;
  return {
    item: item.id,
    request: item.request,
    file: result.doc.file,
    doc_type: result.doc.type,
    date: fact?.iso ?? "",
    date_kind: fact?.kind ?? "",
    approved_or_owned_by: tests.approval.by ?? "",
    scope: tests.scope.coveredSystems.join(" + "),
    quote: tests.quote.quote ?? "",
    date_test: verdict(tests.date.pass),
    approval_test: verdict(tests.approval.pass),
    scope_test: verdict(tests.scope.pass),
    quote_test: tests.quote.kind === "pass" ? "pass" : tests.quote.kind,
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
      doc_type: file.type,
      date: file.date?.iso ?? "",
      date_kind: file.date ? (file.date.kind ?? file.date.source) : "",
      approved_or_owned_by: file.approvedBy ?? "",
      scope: "?",
      quote: "?",
      date_test: tri(file.dateTest),
      approval_test: tri(file.approvalTest),
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

/** project-instructions.md: Vardar's values, or the visitor's audit date with placeholders for customer and request file. */
export function instructionsText(copy: W05Copy, audit: string, months: number): string {
  if (!audit) return renderInstructions(VARDAR_VALUES);
  return renderInstructions({
    customerFull: copy.takehome.customerPlaceholder,
    audit,
    windowStart: windowStart(audit, months),
    requestFile: copy.takehome.requestFilePlaceholder,
    note: "",
  });
}

/**
 * The three files the visitor takes home, built in the tab: the evidence
 * index (the kit's, or the visitor's own folder once there is one), the gap
 * list with one request per gap, and the project instructions with the
 * visitor's audit date. The status, test and type words are the kit's own
 * (vocab.ts), so the files read like the kit. Pure.
 */

import { OWNERS, itemById } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/case";
import type { W05Copy } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { toEvidenceCsv, type EvidenceRow } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/csv";
import { formatShort, windowStart } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/dates";
import type { Evaluation } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import type { Model } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
import type { OwnBoard } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/own-board";
import { VARDAR_VALUES, renderGapList, renderInstructions } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/render";
import { kitVocab } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/vocab";
import type { Loc } from "./fmt";

/** Kit rule 13: approvers and owners by role. "Dragan Ilievski, Managing Director" becomes "Managing Director"; a name without a role stays. */
export function roleOf(by: string | null): string {
  if (!by) return "";
  const comma = by.indexOf(",");
  return comma > 0 ? by.slice(comma + 1).trim() : by.trim();
}

function kitRow(result: Evaluation, copy: W05Copy, locale: Loc, due: string): EvidenceRow {
  const vocab = kitVocab(locale);
  const { tests, item } = result;
  const fact = tests.date.used ?? result.doc.date;
  const verdict = (pass: boolean) => (pass ? vocab.pass : vocab.fail);
  return {
    item: item.id,
    request: item.request,
    file: result.doc.file,
    doc_type: vocab.type[result.doc.type] ?? result.doc.type,
    date: fact?.iso ?? "",
    date_kind: fact ? copy.dateKind[fact.kind] : "",
    approved_or_owned_by: roleOf(tests.approval.by),
    scope: tests.scope.coveredSystems.join(" + "),
    quote: tests.quote.quote ?? "",
    period_test: verdict(tests.date.pass),
    approval_test: verdict(tests.approval.pass),
    scope_test: verdict(tests.scope.pass),
    quote_test: tests.quote.kind === "pass" ? vocab.pass : tests.quote.kind === "notMet" ? copy.sheet.notMet : vocab.fail,
    status: vocab.status[result.status],
    closing_document: result.status === "covered" ? "" : item.closing[locale],
    owner: OWNERS[item.owner][locale],
    due: result.status === "covered" ? "" : formatShort(due, locale),
  };
}

const tri = (value: boolean | null, locale: Loc) => (value === null ? "?" : value ? kitVocab(locale).pass : kitVocab(locale).fail);

/** The evidence index: the kit's best file per request, or the visitor's own cards in the kit's columns. */
export function indexCsv(model: Model, own: OwnBoard | null, copy: W05Copy, locale: Loc): string {
  if (!own) return toEvidenceCsv(model.rows.map((row) => kitRow(row.best, copy, locale, model.context.due)), locale);
  const rows: EvidenceRow[] = own.rows.flatMap((row) => {
    const item = itemById(row.id);
    const status = copy.own.boundStamp[row.bound];
    if (row.files.length === 0) return [{ item: item.id, request: copy.own.genericName[row.id], status, scope: "?", quote: "?", scope_test: "?", quote_test: "?" }];
    return row.files.map((file) => ({
      item: item.id,
      request: copy.own.genericName[row.id],
      file: file.entry.name,
      doc_type: kitVocab(locale).type[file.type] ?? file.type,
      date: file.date?.iso ?? "",
      date_kind: file.date?.kind ? copy.dateKind[file.date.kind] : (file.date?.source ?? ""),
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

/** The project instructions in the page's language: the kit's values, or the visitor's audit date with placeholders for customer and request file. */
export function instructionsText(copy: W05Copy, audit: string, locale: Loc): string {
  if (!audit) return renderInstructions(VARDAR_VALUES, locale);
  return renderInstructions(
    {
      customerFull: copy.takehome.customerPlaceholder,
      audit,
      windowStart: windowStart(audit, 12),
      requestFile: copy.takehome.requestFilePlaceholder,
      fictional: false,
    },
    locale,
  );
}

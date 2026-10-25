/**
 * The four tests and the status, computed from the kit texts alone:
 *
 *   DATUM · FREIGABE · UMFANG · ZITAT  ->  BELEGT, SCHWACH oder LÜCKE
 *
 * A part is missing or one test fails: SCHWACH. Nothing answers, or the
 * record shows "not met": LÜCKE. No quote, no BELEGT; a policy shows intent,
 * only a record shows practice. dateTest and approvalTest also run on the
 * visitor's own files (own-folder.ts). Pure.
 */

import { docType, type DocType } from "./classify";
import { readCsv, share, uniqueCount } from "./counts";
import { daysBetween, hoursBetween, type IsoDate } from "./dates";
import { kitText, type FolderFile } from "./kit";
import { dateOfKind, documentDate, extractMeta, type DatedFact, type Meta } from "./meta";
import type { AuditContext, Item } from "./case";

export type TestId = "date" | "approval" | "scope" | "quote";
export const TEST_ORDER: readonly TestId[] = ["date", "approval", "scope", "quote"];
export type Status = "covered" | "weak" | "gap";

export interface Doc {
  readonly file: string;
  readonly text: string;
  readonly type: DocType;
  readonly meta: Meta;
  readonly date: DatedFact | null;
}

export function readDoc(file: string, text: string): Doc {
  const meta = extractMeta(text);
  return { file, text, type: docType(file, text), meta, date: documentDate(meta) };
}

export function kitDoc(file: FolderFile): Doc {
  return readDoc(file, kitText(`folder/${file}`));
}

export interface DateResult {
  readonly pass: boolean;
  /** The date the test used, and its kind. */
  readonly used: DatedFact | null;
  /** Days the date lies before the window start (when it fails on age). */
  readonly daysShort: number | null;
  /** A stated next review that already lies before the window. */
  readonly reviewDue: DatedFact | null;
}

/** DATUM: a record or register dated in the window; a policy approved or reviewed in it. */
export function dateTest(doc: Doc, windowStart: IsoDate): DateResult {
  const { meta } = doc;
  let used: DatedFact | null = doc.date;
  let reviewDue: DatedFact | null = null;
  if (doc.type === "POLICY" || doc.type === "CONTRACT") {
    const approval = [dateOfKind(meta, "approved"), dateOfKind(meta, "reviewed")]
      .filter((fact): fact is DatedFact => fact !== null)
      .sort((a, b) => (a.iso < b.iso ? 1 : -1))[0];
    used = approval ?? doc.date;
    const next = dateOfKind(meta, "nextReview");
    if (next && next.iso < windowStart) reviewDue = next;
  }
  if (!used) return { pass: false, used: null, daysShort: null, reviewDue };
  if (doc.type === "STATEMENT") return { pass: true, used, daysShort: null, reviewDue: null };
  const inWindow = used.iso >= windowStart && !reviewDue;
  return { pass: inWindow, used, daysShort: used.iso < windowStart ? daysBetween(used.iso, windowStart) : null, reviewDue };
}

export type ApprovalFail = "open" | "draft" | "none" | "notReviewed";

export interface ApprovalResult {
  readonly pass: boolean;
  readonly by: string | null;
  readonly fail: ApprovalFail | null;
}

/** FREIGABE: a policy names its approver with a date; a record or register its owner or maker; a vendor page its issuer and page date. */
export function approvalTest(doc: Doc): ApprovalResult {
  const { meta } = doc;
  if (doc.type === "POLICY" || doc.type === "CONTRACT") {
    if (meta.draft) return { pass: false, by: meta.approvedBy, fail: "draft" };
    if (meta.approvedBy && dateOfKind(meta, "approved")) return { pass: true, by: meta.approvedBy, fail: null };
    return { pass: false, by: null, fail: meta.approvalOpen ? "open" : "none" };
  }
  if (doc.type === "STATEMENT") {
    const page = dateOfKind(meta, "page");
    if (meta.source && page) return { pass: true, by: issuerOf(doc), fail: null };
    if (meta.approvedBy) return { pass: true, by: meta.approvedBy, fail: null };
    return { pass: false, by: null, fail: meta.notReviewed ? "notReviewed" : "none" };
  }
  const by = meta.owner ?? meta.maker ?? meta.approvedBy;
  return by ? { pass: true, by, fail: null } : { pass: false, by: null, fail: "none" };
}

function issuerOf(doc: Doc): string {
  const title = /\(([^)]+)\)\s*$/m.exec(doc.text.split("\n")[0] ?? "");
  if (title) return title[1] as string;
  try {
    return new URL(doc.meta.source ?? "").hostname;
  } catch {
    return "";
  }
}

export interface ScopeResult {
  readonly pass: boolean;
  /** Systems the item needs that the file does not name. */
  readonly missingSystems: readonly string[];
  readonly coveredSystems: readonly string[];
  /** Days of the window the file does not cover (a rule valid only from a later date). */
  readonly uncoveredDays: number;
  readonly windowDays: number;
  readonly validFrom: IsoDate | null;
}

/** UMFANG: the set difference of what the item needs and what the file covers. */
export function scopeTest(doc: Doc, item: Item, context: AuditContext): ScopeResult {
  const header = doc.text.split("\n").slice(0, 3).join(" ");
  const coveredSystems = context.systems.filter((system) => header.includes(system));
  const missingSystems = item.scopeNeed.includes("all-systems") ? context.systems.filter((system) => !coveredSystems.includes(system)) : [];
  const validFrom = item.scopeNeed.includes("period") ? (dateOfKind(doc.meta, "validFrom")?.iso ?? null) : null;
  const uncoveredDays = validFrom && validFrom > context.windowStart ? daysBetween(context.windowStart, validFrom) : 0;
  return {
    pass: missingSystems.length === 0 && uncoveredDays === 0,
    missingSystems,
    coveredSystems,
    uncoveredDays,
    windowDays: daysBetween(context.windowStart, context.audit),
    validFrom,
  };
}

/** Words that turn a record into "not met". */
export const NOT_MET = /\b(planned|pending|not done|none|nicht durchgeführt|geplant)\b/i;

export type QuoteKind = "pass" | "part" | "intent" | "notMet" | "none";

export interface Figures {
  readonly rows?: number;
  readonly unique?: number;
  readonly duplicates?: number;
  readonly duplicateId?: string;
  readonly staff?: number;
  readonly share?: number;
  readonly needed?: number;
  readonly missing?: number;
  readonly hours?: number;
  readonly incident?: string;
  readonly country?: string;
}

export interface QuoteResult {
  readonly kind: QuoteKind;
  readonly quote: string | null;
  /** Columns a row leaves empty ("last_review", "transfer_basis"). */
  readonly missingParts: readonly string[];
  readonly figures: Figures;
}

const EU = /germany|deutschland|france|austria|netherlands|ireland|eu\b|europe|frankfurt/i;

/** ZITAT: words from the file that answer the item, and what they show. */
export function quoteTest(doc: Doc, item: Item, context: AuditContext): QuoteResult {
  const candidate = item.candidates.find((entry) => entry.file === doc.file);
  const quote = candidate ? (candidate.quote.exec(doc.text)?.[0]?.trim() ?? null) : null;
  if (!quote) return { kind: "none", quote: null, missingParts: [], figures: {} };
  if (item.needsRecord && doc.type !== "RECORD") return { kind: "intent", quote, missingParts: [], figures: {} };

  if (item.check === "transfer") {
    const table = readCsv(doc.text);
    const outside = table.rows.filter((row) => !EU.test(row.country ?? ""));
    const missingParts = [...new Set(outside.flatMap((row) => ["last_review", "transfer_basis"].filter((part) => !(row[part] ?? "").trim())))];
    return { kind: missingParts.length > 0 ? "part" : "pass", quote, missingParts, figures: { country: outside[0]?.country } };
  }
  if (item.check === "share") {
    const table = readCsv(doc.text);
    const counted = uniqueCount(table.rows, "staff_id");
    const ids = table.rows.map((row) => row.staff_id);
    const duplicateId = ids.find((id, index) => ids.indexOf(id) !== index);
    const staff = Number(/(\d+)\.?$/.exec(quote)?.[1] ?? 0);
    const needed = Math.ceil(context.trainingShare * staff);
    const figures: Figures = { rows: counted.rows, unique: counted.unique, duplicates: counted.duplicates, duplicateId, staff, share: share(counted.unique, staff), needed, missing: Math.max(0, needed - counted.unique) };
    return { kind: counted.unique >= needed ? "pass" : "notMet", quote, missingParts: [], figures };
  }
  if (item.check === "notice") {
    const table = readCsv(doc.text);
    const row = table.rows.find((entry) => (entry.customer_data ?? "") === context.customer);
    const hours = row ? hoursBetween(row.detected ?? "", row.customer_told ?? "") : Number.NaN;
    return {
      kind: row && hours <= context.noticeHours ? "pass" : "notMet",
      quote,
      missingParts: [],
      figures: { hours, incident: row?.id },
    };
  }
  if (item.check === "storage") {
    return { kind: "pass", quote, missingParts: [], figures: { country: EU.test(quote) ? "EU" : quote.replace(/ \(.*$/, "") } };
  }
  return { kind: NOT_MET.test(quote) ? "notMet" : "pass", quote, missingParts: [], figures: {} };
}

export interface TestResults {
  readonly date: DateResult;
  readonly approval: ApprovalResult;
  readonly scope: ScopeResult;
  readonly quote: QuoteResult;
}

/** The tests a result fails, in test order (a "part" counts against ZITAT). */
export function failedTests(tests: TestResults): readonly TestId[] {
  return TEST_ORDER.filter((test) =>
    test === "quote" ? tests.quote.kind !== "pass" : !tests[test].pass,
  );
}

/** notMet or no answering quote: LÜCKE. Else any failure or a missing part: SCHWACH. Else BELEGT. */
export function statusOf(tests: TestResults): Status {
  const { kind } = tests.quote;
  if (kind === "notMet" || kind === "none" || kind === "intent") return "gap";
  return failedTests(tests).length > 0 ? "weak" : "covered";
}

export interface Evaluation {
  readonly item: Item;
  readonly doc: Doc;
  readonly tests: TestResults;
  readonly failed: readonly TestId[];
  readonly status: Status;
}

export function evaluate(item: Item, file: FolderFile, context: AuditContext): Evaluation {
  const doc = kitDoc(file);
  const tests: TestResults = {
    date: dateTest(doc, context.windowStart),
    approval: approvalTest(doc),
    scope: scopeTest(doc, item, context),
    quote: quoteTest(doc, item, context),
  };
  return { item, doc, tests, failed: failedTests(tests), status: statusOf(tests) };
}

const STATUS_RANK: Readonly<Record<Status, number>> = { covered: 0, weak: 1, gap: 2 };
const isRecord = (type: DocType) => type === "RECORD" || type === "REGISTER";

/** The best candidate: BELEGT before SCHWACH before LÜCKE, then a record, then fewer failed tests, then file order. */
export function itemStatus(item: Item, context: AuditContext): Evaluation {
  const results = item.candidates.map((candidate) => evaluate(item, candidate.file, context));
  return [...results].sort(
    (a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      Number(isRecord(b.doc.type)) - Number(isRecord(a.doc.type)) ||
      a.failed.length - b.failed.length,
  )[0] as Evaluation;
}

export interface Tally {
  readonly covered: number;
  readonly weak: number;
  readonly gap: number;
}

export function tally(results: readonly { readonly status: Status }[]): Tally {
  return {
    covered: results.filter((result) => result.status === "covered").length,
    weak: results.filter((result) => result.status === "weak").length,
    gap: results.filter((result) => result.status === "gap").length,
  };
}

export interface IndexRow {
  readonly doc: Doc;
  readonly date: DateResult;
  readonly approval: ApprovalResult;
  readonly passes: boolean;
}

/** Mission 1: DATUM and FREIGABE for every file of a folder. */
export function indexRows(docs: readonly Doc[], windowStart: IsoDate): readonly IndexRow[] {
  return docs.map((doc) => {
    const date = dateTest(doc, windowStart);
    const approval = approvalTest(doc);
    return { doc, date, approval, passes: date.pass && approval.pass };
  });
}

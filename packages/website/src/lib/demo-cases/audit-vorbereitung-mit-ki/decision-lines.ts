/**
 * Where in a file each of the four checks found its answer: the line number
 * and the verbatim span the engine read, so the page can put the lens on it
 * and turn a file card over to show it. Every span is a substring of the
 * file text (kit.test.ts holds this for the whole kit). Pure.
 */

import { parseDateTokens } from "./dates";
import type { DateResult, Doc, Evaluation, TestId, TestResults } from "./evidence";

export interface DecisionLine {
  readonly test: TestId;
  /** 1-based line number in the file. */
  readonly line: number;
  /** Verbatim text from that line. */
  readonly span: string;
  readonly pass: boolean;
}

/** The lines of a file as the document view draws them (no trailing empty line). */
export function docLines(text: string): readonly string[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  return lines.at(-1) === "" ? lines.slice(0, -1) : lines;
}

interface Hit {
  readonly line: number;
  readonly start: number;
  readonly end: number;
}

/** The sentence of a line around [start, end), cut at ". " followed by a capital letter or a digit. */
function sentenceAround(text: string, start: number, end: number): { readonly start: number; readonly end: number } {
  const breaks = [...text.matchAll(/\.\s+(?=[A-ZÄÖÜ0-9("])/g)].map((match) => (match.index ?? 0) + 1);
  const from = [0, ...breaks].filter((index) => index <= start).at(-1) ?? 0;
  const to = breaks.find((index) => index >= end) ?? text.length;
  return { start: from, end: to };
}

function spanOf(lines: readonly string[], hit: Hit, sentence = true): string {
  const text = lines[hit.line - 1] ?? "";
  const range = sentence ? sentenceAround(text, hit.start, hit.end) : hit;
  return text.slice(range.start, range.end).trim();
}

/** The first line that holds `needle` word for word. */
export function lineOf(text: string, needle: string): number | null {
  if (!needle) return null;
  const index = docLines(text).findIndex((line) => line.includes(needle));
  return index < 0 ? null : index + 1;
}

function findText(lines: readonly string[], needle: string): Hit | null {
  for (const [index, line] of lines.entries()) {
    const at = line.indexOf(needle);
    if (at >= 0) return { line: index + 1, start: at, end: at + needle.length };
  }
  return null;
}

function findPattern(lines: readonly string[], re: RegExp): Hit | null {
  for (const [index, line] of lines.entries()) {
    const match = re.exec(line);
    if (match) return { line: index + 1, start: match.index, end: match.index + match[0].length };
  }
  return null;
}

/** The line and place of the first date token with this ISO date (a header's "Approved 2024-03-12", a "March 2025"). */
function findDate(lines: readonly string[], iso: string): Hit | null {
  for (const [index, line] of lines.entries()) {
    const token = parseDateTokens(line).find((entry) => entry.iso === iso);
    if (token) return { line: index + 1, start: token.index, end: token.index + token.raw.length };
  }
  return null;
}

function joinHits(lines: readonly string[], a: Hit, b: Hit | null): string {
  if (!b || b.line !== a.line) return spanOf(lines, a);
  const text = lines[a.line - 1] ?? "";
  const first = sentenceAround(text, a.start, a.end);
  const second = sentenceAround(text, b.start, b.end);
  return text.slice(Math.min(first.start, second.start), Math.max(first.end, second.end)).trim();
}

/** ZEITRAUM: the date the test used, the rule's "Valid from" when the file holds only for part of the window, a stated next review. */
export function dateDecision(doc: Doc, date: DateResult, validFrom: string | null = null): DecisionLine | null {
  const lines = docLines(doc.text);
  if (date.uncoveredDays > 0 && validFrom) {
    const hit = findPattern(lines, /\b(valid from|gültig ab|in kraft ab)\b/i) ?? findDate(lines, validFrom);
    return hit ? { test: "date", line: hit.line, span: spanOf(lines, hit), pass: false } : null;
  }
  if (!date.used) return null;
  const hit = findDate(lines, date.used.iso);
  if (!hit) return null;
  const review = date.reviewDue ? findDate(lines, date.reviewDue.iso) : null;
  return { test: "date", line: hit.line, span: joinHits(lines, hit, review), pass: date.pass };
}

/** FREIGABE: "Not reviewed by anyone", an open approval field, the named approver, owner or maker, or a vendor page's date. */
export function approvalDecision(doc: Doc, pass: boolean): DecisionLine | null {
  const lines = docLines(doc.text);
  const { meta } = doc;
  const patterns: readonly (RegExp | string | null)[] = [
    meta.notReviewed ? /\b(not reviewed|nicht geprüft|ungeprüft)\b/i : null,
    meta.approvalOpen || meta.draft ? /\b(approved by|freigegeben von)\s*:/i : null,
    meta.approvedBy,
    meta.owner ? /\b(owner|verantwortlich|geführt von)\s*:/i : null,
    meta.maker,
    /\b(page date|stand der seite)\b/i,
  ];
  for (const pattern of patterns) {
    if (!pattern) continue;
    const hit = typeof pattern === "string" ? findText(lines, pattern) : findPattern(lines, pattern);
    if (hit) return { test: "approval", line: hit.line, span: spanOf(lines, hit), pass };
  }
  return null;
}

/** UMFANG: the header naming the systems, the "Jobs:" or "Applies to" line, the "Valid from" of a rule. */
function scopeDecision(evaluation: Evaluation): DecisionLine | null {
  const { doc, tests, item } = evaluation;
  const lines = docLines(doc.text);
  const pass = tests.scope.pass;
  if (item.scopeNeed.includes("all-systems")) {
    const quote = tests.quote.quote;
    const hit = (quote ? findText(lines, quote) : null) ?? (tests.scope.coveredSystems[0] ? findText(lines, tests.scope.coveredSystems[0]) : null);
    return hit ? { test: "scope", line: hit.line, span: quote && lines[hit.line - 1]?.includes(quote) ? quote : spanOf(lines, hit), pass } : null;
  }
  const hit = findPattern(lines, /^(jobs|systems?|scope|umfang|applies to|gilt für)\b[^.]*\./i) ?? findPattern(lines, /\b(applies to|gilt für)\b/i);
  return hit ? { test: "scope", line: hit.line, span: spanOf(lines, hit), pass } : null;
}

/** ZITAT: the words that answer the item, verbatim. */
function quoteDecision(evaluation: Evaluation): DecisionLine | null {
  const { doc, tests } = evaluation;
  const quote = tests.quote.quote;
  if (!quote) return null;
  const lines = docLines(doc.text);
  const hit = findText(lines, quote);
  return hit ? { test: "quote", line: hit.line, span: quote, pass: tests.quote.kind === "pass" } : null;
}

/** The deciding line of every check that has one, in check order (Zitat, Zeitraum, Umfang, Freigabe). */
export function decisionLines(evaluation: Evaluation): readonly DecisionLine[] {
  const { doc, tests } = evaluation;
  return [
    quoteDecision(evaluation),
    dateDecision(doc, tests.date, tests.scope.validFrom),
    scopeDecision(evaluation),
    approvalDecision(doc, tests.approval.pass),
  ].filter((entry): entry is DecisionLine => entry !== null);
}

/** The line the check `test` decided on, if any. */
export function decisionFor(evaluation: Evaluation, test: TestId): DecisionLine | null {
  return decisionLines(evaluation).find((entry) => entry.test === test) ?? null;
}

/** The deciding line of the first failing check of a name-linked file: what its card shows on the back. */
export function backLine(evaluation: Evaluation, tests: TestResults = evaluation.tests): DecisionLine | null {
  const first = evaluation.failed[0];
  if (!first) return null;
  return decisionFor({ ...evaluation, tests }, first);
}

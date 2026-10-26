/**
 * Zitat-Probe: Claude's Mission 2 answer, checked line by line against the
 * kit files. It reads a markdown table or plain lines, finds per item the
 * cited files, the quotes, the status word, any section or control number and
 * the numbers, and raises one flag per problem: a file that does not exist,
 * BELEGT without a quote, a policy quoted where a record is needed, a source
 * that fails the index, a reference found in no file, compliance words, and
 * a status or a number that differs from the key. Pure; nothing leaves the tab.
 */

import { ITEMS, itemById, type AuditContext, type ItemId } from "./case";
import { indexRows, itemStatus, kitDoc, type Status } from "./evidence";
import { FOLDER_FILES, kitText } from "./kit";
import { verifyQuote, type QuoteCheck } from "./quote";

export interface AnswerRow {
  readonly item: ItemId;
  readonly raw: string;
  readonly files: readonly string[];
  readonly unknownFiles: readonly string[];
  readonly quotes: readonly string[];
  readonly status: Status | null;
  readonly refs: readonly string[];
  readonly numbers: readonly number[];
}

const STATUS_WORDS: Readonly<Record<string, Status>> = {
  COVERED: "covered",
  BELEGT: "covered",
  WEAK: "weak",
  SCHWACH: "weak",
  GAP: "gap",
  LÜCKE: "gap",
  LUECKE: "gap",
};

const QUOTE_PATTERNS = [/"([^"\n]{12,}?)"/g, /“([^”\n]{12,}?)”/g, /„([^“”"\n]{12,}?)[“”"]/g, /»([^«\n]{12,}?)«/g];
const REFERENCE = /\b(A\.\d+(?:\.\d+)*|Art\.?\s*\d+(?:\(\d+\))?|(?:section|clause|Abschnitt|Ziffer|Klausel)\s+\d+(?:\.\d+)?)/gi;
/**
 * A file name: starts at a token boundary and is at most 80 characters, so a
 * long run of letters without an extension costs one bounded scan per start
 * and never backtracks across the whole line.
 */
const FILE_TOKEN = /(?<![\w.-])[\w-][\w.-]{0,79}\.(?:md|csv|txt|docx?|pdf|xlsx?)\b/gi;
/** Pasted answers are cut to these sizes before any pattern runs. */
export const MAX_ANSWER = 50_000;
export const MAX_LINE = 2_000;
export const MAX_QUOTES = 64;
export const COMPLIANCE = /\b(compliant|certified|konform\w*|zertifiziert\w*)\b/i;

const stem = (name: string) => name.toLowerCase().replace(/\.[a-z0-9]+$/, "");
const KNOWN = FOLDER_FILES.map((file) => ({ file, stem: stem(file) }));
/** Short names Claude uses in tables ("system-list", "v4_DRAFT"). */
const SHORT = KNOWN.map(({ file, stem: full }) => ({ file, short: full.replace(/_\d{4}(?:-\d{2}){0,2}$/, "") }));

function citedFiles(line: string): { readonly files: string[]; readonly unknown: string[] } {
  const files = new Set<string>();
  const unknown: string[] = [];
  for (const token of line.match(FILE_TOKEN) ?? []) {
    const hit = KNOWN.find((known) => known.stem === stem(token) || stem(token).startsWith(known.stem));
    if (hit) files.add(hit.file);
    else if (!/^request_tannwald|^project-instructions|^draft-reply/i.test(token)) unknown.push(token);
  }
  const lower = line.toLowerCase();
  for (const { file, short } of SHORT) if (lower.includes(short.toLowerCase())) files.add(file);
  return { files: [...files], unknown };
}

function statusIn(line: string): Status | null {
  const unquoted = line.replace(/"[^"]*"|“[^”]*”|„[^“”"]*[“”"]/g, " ");
  const strict = /\b(COVERED|BELEGT|WEAK|SCHWACH|GAP|LÜCKE|LUECKE)\b/.exec(unquoted);
  const loose = strict ?? /(?<![\p{L}])(covered|belegt|weak|schwach|gap|lücke)(?![\p{L}])/iu.exec(unquoted);
  return loose ? (STATUS_WORDS[(loose[1] as string).toUpperCase()] ?? null) : null;
}

/** One row per item; a line that names two or more items (a summary) is skipped. */
export function parseClaudeAnswer(text: string): readonly AnswerRow[] {
  const rows = new Map<ItemId, AnswerRow>();
  let quoteCount = 0;
  for (const fullLine of text.slice(0, MAX_ANSWER).split(/\r?\n/)) {
    const raw = fullLine.slice(0, MAX_LINE);
    const ids = [...new Set(raw.match(/\bR[1-8]\b/g) ?? [])] as ItemId[];
    if (ids.length !== 1 || /^\s*\|?\s*:?-{3,}/.test(raw)) continue;
    const item = ids[0] as ItemId;
    const quotes = QUOTE_PATTERNS.flatMap((pattern) => [...raw.matchAll(pattern)].map((match) => (match[1] as string).trim())).slice(
      0,
      Math.max(0, MAX_QUOTES - quoteCount),
    );
    quoteCount += quotes.length;
    const { files, unknown } = citedFiles(raw);
    const refs = [...raw.replace(/"[^"]*"/g, " ").matchAll(REFERENCE)].map((match) => (match[1] as string).trim());
    const numbers = [...raw.replace(/\bR[1-8]\b|\d{4}-\d{2}-\d{2}|(?<![\w.-])[\w-][\w.-]{0,79}\.(?:md|csv|txt)/g, " ").matchAll(/(?<![\w.])(\d+(?:[.,]\d+)?)(?![\w])/g)].map((match) =>
      Number((match[1] as string).replace(",", ".")),
    );
    const previous = rows.get(item);
    rows.set(item, {
      item,
      raw: previous ? `${previous.raw}\n${raw}` : raw,
      files: [...new Set([...(previous?.files ?? []), ...files])],
      unknownFiles: [...(previous?.unknownFiles ?? []), ...unknown],
      quotes: [...(previous?.quotes ?? []), ...quotes],
      status: statusIn(raw) ?? previous?.status ?? null,
      refs: [...(previous?.refs ?? []), ...refs],
      numbers: [...(previous?.numbers ?? []), ...numbers],
    });
  }
  return [...rows.values()].sort((a, b) => a.item.localeCompare(b.item));
}

export type Flag =
  | { readonly kind: "missing-file"; readonly file: string }
  | { readonly kind: "covered-no-quote" }
  | { readonly kind: "policy-for-record"; readonly file: string }
  | { readonly kind: "source-fails"; readonly file: string; readonly test: "date" | "approval" }
  | { readonly kind: "unknown-ref"; readonly ref: string }
  | { readonly kind: "compliance-word"; readonly word: string }
  | { readonly kind: "status-differs"; readonly expected: Status }
  | { readonly kind: "number-differs"; readonly found: number; readonly expected: number };

export interface CheckedRow {
  readonly row: AnswerRow;
  readonly quotes: readonly { readonly text: string; readonly check: QuoteCheck }[];
  readonly flags: readonly Flag[];
}

/** Numbers people and models get wrong on this folder, with the right one: rows instead of unique staff, the share of 26. */
const NUMBER_TRAPS: Partial<Record<ItemId, readonly (readonly [number, number])[]>> = {
  R5: [
    [26, 25],
    [21.7, 20.8],
  ],
};

export function checkAnswer(rows: readonly AnswerRow[], context: AuditContext): readonly CheckedRow[] {
  const files = FOLDER_FILES.map((file) => ({ name: file, text: kitText(`folder/${file}`) }));
  const index = new Map(indexRows(FOLDER_FILES.map(kitDoc), context.windowStart).map((row) => [row.doc.file, row]));
  const haystack = [kitText("request_tannwald.md"), ...files.map((file) => file.text)].join("\n").toLowerCase();
  const key = new Map(ITEMS.map((item) => [item.id, itemStatus(item, context).status]));

  return rows.map((row) => {
    const item = itemById(row.item);
    const flags: Flag[] = row.unknownFiles.map((file) => ({ kind: "missing-file", file }) as const);
    const quotes = row.quotes.map((text) => ({ text, check: verifyQuote(text, files) }));
    if (row.status === "covered" && row.quotes.length === 0) flags.push({ kind: "covered-no-quote" });
    const sources = new Set([...row.files, ...quotes.flatMap(({ check }) => (check.kind === "missing" ? [] : [check.file]))]);
    for (const file of sources) {
      const entry = index.get(file as (typeof FOLDER_FILES)[number]);
      if (!entry) continue;
      if (item.needsRecord && entry.doc.type !== "RECORD" && quotes.some(({ check }) => check.kind !== "missing" && check.file === file)) {
        flags.push({ kind: "policy-for-record", file });
      }
      if (!entry.approval.pass) flags.push({ kind: "source-fails", file, test: "approval" });
      else if (!entry.date.pass) flags.push({ kind: "source-fails", file, test: "date" });
    }
    for (const ref of row.refs) if (!haystack.includes(ref.toLowerCase())) flags.push({ kind: "unknown-ref", ref });
    const compliance = COMPLIANCE.exec(row.raw);
    if (compliance) flags.push({ kind: "compliance-word", word: compliance[1] as string });
    const expected = key.get(row.item);
    if (expected && row.status && row.status !== expected) flags.push({ kind: "status-differs", expected });
    for (const [found, right] of NUMBER_TRAPS[row.item] ?? []) {
      if (row.numbers.includes(found) && !row.numbers.includes(right)) flags.push({ kind: "number-differs", found, expected: right });
    }
    return { row, quotes, flags };
  });
}

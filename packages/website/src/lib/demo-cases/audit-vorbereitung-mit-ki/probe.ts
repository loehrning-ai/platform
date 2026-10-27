/**
 * The Zitat-Probe on a recorded or pasted Claude answer: every quoted span
 * is looked up in the attached files (the request and the eleven folder
 * files) and marked found (with file and line), similar (with the share) or
 * missing. It works on any answer, with or without an R table. The marks are
 * the page's check, never model output. Pure.
 */

import { lineOf } from "./decision-lines";
import { FOLDER_FILES, kitText } from "./kit";
import { elidedParts, needleOf, normalizeForQuote, verifyQuote, type QuoteCheck } from "./quote";

export interface ProbeFile {
  readonly name: string;
  readonly text: string;
}

/** The twelve files the recorded runs had attached. */
export function attachedFiles(): readonly ProbeFile[] {
  return [{ name: "request_tannwald.md", text: kitText("request_tannwald.md") }, ...FOLDER_FILES.map((file) => ({ name: file, text: kitText(`folder/${file}`) }))];
}

export interface ProbeMark {
  /** The quote as it stands in the answer. */
  readonly quote: string;
  /** Character offsets of the quote inside the answer (without its quote marks). */
  readonly start: number;
  readonly end: number;
  readonly check: QuoteCheck;
  /** 1-based line of the file a found quote stands in. */
  readonly line: number | null;
}

export const MIN_QUOTE = 12;
/** A quote of three words or fewer ("does not exist", "letzte Prüfung") is a phrase, not a claim about a file. */
export const MIN_WORDS = 4;
const MAX_MARKS = 64;

/**
 * Quoted spans: "…", „…", “…”, «…» and `…` of at least MIN_QUOTE characters
 * and MIN_WORDS words, in reading order. Lines of a blockquote are skipped:
 * there Claude drafts a message for someone to send, and a quote in it is
 * not evidence. Code spans pair from left to right, so the text between two
 * code spans is never read as one.
 */
export function quotedSpans(text: string): readonly { readonly quote: string; readonly start: number; readonly length: number }[] {
  const spans: { quote: string; start: number; length: number }[] = [];
  // A blockquote line becomes blanks, and an escaped quote mark (\\") two placeholders, so offsets stay those of the text.
  const masked = text.replace(/^[ \t]*>.*$/gm, (line) => " ".repeat(line.length)).replace(/\\"/g, "\uE000\uE001");
  const re = /"([^"\n]{4,400})"|„([^“”"\n]{4,400})[“”"]|“([^”\n]{4,400})”|«([^»\n]{4,400})»|`([^`\n]*)`/g;
  for (const match of masked.matchAll(re)) {
    const group = match.slice(1).findIndex((value) => value !== undefined);
    const inner = match[group + 1] ?? "";
    const raw = inner.trim();
    const quote = raw.replace(/\uE000\uE001/g, '"');
    if (quote.length < MIN_QUOTE || quote.split(/\s+/).length < MIN_WORDS) continue;
    spans.push({ quote, start: (match.index ?? 0) + 1 + inner.indexOf(raw), length: raw.length });
    if (spans.length >= MAX_MARKS) break;
  }
  return spans;
}

/** The line of a file that holds the normalised quote, or null. */
function foundLine(file: ProbeFile, quote: string): number | null {
  const direct = lineOf(file.text, quote);
  if (direct) return direct;
  const needle = elidedParts(quote)?.[0] ?? needleOf(quote);
  const index = file.text.split("\n").findIndex((line) => normalizeForQuote(line).includes(needle));
  return index < 0 ? null : index + 1;
}

export function probeAnswer(text: string, files: readonly ProbeFile[] = attachedFiles()): readonly ProbeMark[] {
  return quotedSpans(text).map(({ quote, start, length }) => {
    const check = verifyQuote(quote, files);
    const file = check.kind === "found" ? files.find((entry) => entry.name === check.file) : undefined;
    return { quote, start, end: start + length, check, line: file ? foundLine(file, quote) : null };
  });
}

export interface ProbeSummary {
  readonly found: number;
  readonly similar: number;
  readonly missing: number;
}

export function probeSummary(marks: readonly ProbeMark[]): ProbeSummary {
  return {
    found: marks.filter((mark) => mark.check.kind === "found").length,
    similar: marks.filter((mark) => mark.check.kind === "similar").length,
    missing: marks.filter((mark) => mark.check.kind === "missing").length,
  };
}

/** A mark with where it stands: in Claude's answer, or in the file Claude wrote. */
export interface SourcedMark extends ProbeMark {
  /** null: the chat answer; else the name of the file Claude wrote. */
  readonly source: string | null;
}

export interface TakeProbe {
  readonly marks: readonly SourcedMark[];
  /** Quoted passages a reviewer read as Claude's own words (review.ts), left out of the marks. */
  readonly ownWords: number;
}

/**
 * The probe of one recorded take: the answer and the evidence file Claude
 * wrote, each quote looked up in the twelve attached files. A mark a
 * reviewer read as "not-a-claim" is dropped and counted.
 */
export function probeTake(
  take: { readonly turn: { readonly final_text: string }; readonly produced: { readonly name: string; readonly text: string } | null; readonly reviews: Readonly<Record<string, { readonly verdict: string }>> },
  files: readonly ProbeFile[] = attachedFiles(),
): TakeProbe {
  const all: SourcedMark[] = [
    ...probeAnswer(take.turn.final_text, files).map((mark) => ({ ...mark, source: null })),
    ...(take.produced ? probeAnswer(take.produced.text, files).map((mark) => ({ ...mark, source: take.produced?.name ?? null })) : []),
  ];
  const marks = all.filter((mark) => mark.check.kind === "found" || take.reviews[mark.quote]?.verdict !== "not-a-claim");
  return { marks, ownWords: all.length - marks.length };
}

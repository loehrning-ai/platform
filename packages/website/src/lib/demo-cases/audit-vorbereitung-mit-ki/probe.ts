/**
 * The Zitat-Probe on a recorded or pasted Claude answer: every quoted span
 * is looked up in the attached files (the request and the eleven folder
 * files) and marked found (with file and line), similar (with the share) or
 * missing. It works on any answer, with or without an R table. The marks are
 * the page's check, never model output. Pure.
 */

import { lineOf } from "./decision-lines";
import { FOLDER_FILES, kitText } from "./kit";
import { normalizeForQuote, verifyQuote, type QuoteCheck } from "./quote";

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
const MAX_MARKS = 64;

/** Quoted spans: "…", „…", “…”, «…» and `…` of at least MIN_QUOTE characters, in reading order. */
export function quotedSpans(text: string): readonly { readonly quote: string; readonly start: number }[] {
  const spans: { quote: string; start: number }[] = [];
  const re = /"([^"\n]{4,400})"|„([^“”"\n]{4,400})[“”"]|“([^”\n]{4,400})”|«([^»\n]{4,400})»|`([^`\n]{4,400})`/g;
  for (const match of text.matchAll(re)) {
    const group = match.slice(1).findIndex((value) => value !== undefined);
    const quote = (match[group + 1] ?? "").trim();
    if (quote.length < MIN_QUOTE || !/\s/.test(quote)) continue;
    spans.push({ quote, start: (match.index ?? 0) + 1 + (match[group + 1] ?? "").indexOf(quote) });
    if (spans.length >= MAX_MARKS) break;
  }
  return spans;
}

/** The line of a file that holds the normalised quote, or null. */
function foundLine(file: ProbeFile, quote: string): number | null {
  const direct = lineOf(file.text, quote);
  if (direct) return direct;
  const needle = normalizeForQuote(quote);
  const index = file.text.split("\n").findIndex((line) => normalizeForQuote(line).includes(needle));
  return index < 0 ? null : index + 1;
}

export function probeAnswer(text: string, files: readonly ProbeFile[] = attachedFiles()): readonly ProbeMark[] {
  return quotedSpans(text).map(({ quote, start }) => {
    const check = verifyQuote(quote, files);
    const file = check.kind === "found" ? files.find((entry) => entry.name === check.file) : undefined;
    return { quote, start, end: start + quote.length, check, line: file ? foundLine(file, quote) : null };
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

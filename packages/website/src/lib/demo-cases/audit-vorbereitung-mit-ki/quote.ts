/**
 * Is this quote really in the files? Both sides are normalised (NFC, lower
 * case, one kind of quote mark and apostrophe, single spaces, no markdown
 * marks, CSV commas as spaces), then the quote is looked up word for word.
 * Otherwise the longest common substring, as a share of the quote, tells
 * "similar, not verbatim" from "in no file". Pure.
 */

export function normalizeForQuote(text: string): string {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[„“”«»‹›"]/g, '"')
    .replace(/[‚‘’`´']/g, "'")
    .replace(/[*_`]/g, "")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Longest common substring length, dynamic programming on two rows. Inputs are capped by the caller. */
export function longestCommonSubstring(a: string, b: string): number {
  let best = 0;
  let previous = new Uint16Array(b.length + 1);
  let current = new Uint16Array(b.length + 1);
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = a[i - 1] === b[j - 1] ? (previous[j - 1] as number) + 1 : 0;
      if ((current[j] as number) > best) best = current[j] as number;
    }
    [previous, current] = [current, previous];
    current.fill(0);
  }
  return best;
}

export type QuoteCheck =
  | { readonly kind: "found"; readonly file: string; /** The quote leaves words out with "…"; every part stands in the file, in order. */ readonly elided?: true }
  | { readonly kind: "similar"; readonly file: string; readonly share: number }
  | { readonly kind: "missing" };

/** Covers every attached kit file (the request has 2,123 characters, the largest folder file 1,697); kit.test.ts asserts it. */
export const MAX_FILE = 4000;
const MAX_QUOTE = 400;
export const SIMILAR_SHARE = 0.8;

/**
 * A quote as the answer's sentence closes it: the full stop or comma inside
 * the quote marks belongs to the answer's sentence, not to the file
 * ("…, with its result." quotes the table cell "…, with its result").
 */
export function needleOf(quote: string): string {
  return normalizeForQuote(quote).replace(/[\s.,;:!?]+$/u, "");
}

/** The parts of a quote that leaves words out ("A … B", "A [...] B"), or null. */
export function elidedParts(quote: string): readonly string[] | null {
  if (!/…|\.\.\.|\[…\]|\[\.\.\.\]/.test(quote)) return null;
  const parts = quote
    .split(/\[?(?:…|\.\.\.)\]?/)
    .map((part) => needleOf(part).replace(/^[\s.,;:!?]+/u, ""))
    .filter((part) => part.length > 0);
  return parts.length > 0 ? parts : null;
}

function inOrder(text: string, parts: readonly string[]): boolean {
  let at = 0;
  for (const part of parts) {
    const index = text.indexOf(part, at);
    if (index < 0) return false;
    at = index + part.length;
  }
  return true;
}

export function verifyQuote(quote: string, files: readonly { readonly name: string; readonly text: string }[]): QuoteCheck {
  const needle = needleOf(quote);
  if (!needle) return { kind: "missing" };
  const normalized = files.map((file) => ({ name: file.name, text: normalizeForQuote(file.text) }));
  const exact = normalized.find((file) => file.text.includes(needle));
  if (exact) return { kind: "found", file: exact.name };
  const parts = elidedParts(quote);
  if (parts) {
    const whole = normalized.find((file) => inOrder(file.text, parts));
    if (whole) return { kind: "found", file: whole.name, elided: true };
  }
  let best: { file: string; share: number } | null = null;
  const capped = needle.slice(0, MAX_QUOTE);
  for (const file of normalized) {
    const share = longestCommonSubstring(capped, file.text.slice(0, MAX_FILE)) / capped.length;
    if (!best || share > best.share) best = { file: file.name, share };
  }
  return best && best.share >= SIMILAR_SHARE ? { kind: "similar", file: best.file, share: best.share } : { kind: "missing" };
}

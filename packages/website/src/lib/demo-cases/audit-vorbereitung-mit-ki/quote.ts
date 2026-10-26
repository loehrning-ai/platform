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
  | { readonly kind: "found"; readonly file: string }
  | { readonly kind: "similar"; readonly file: string; readonly share: number }
  | { readonly kind: "missing" };

/** Covers every attached kit file (the request has 2,123 characters, the largest folder file 1,697); kit.test.ts asserts it. */
export const MAX_FILE = 4000;
const MAX_QUOTE = 400;
export const SIMILAR_SHARE = 0.8;

export function verifyQuote(quote: string, files: readonly { readonly name: string; readonly text: string }[]): QuoteCheck {
  const needle = normalizeForQuote(quote);
  if (!needle) return { kind: "missing" };
  const normalized = files.map((file) => ({ name: file.name, text: normalizeForQuote(file.text) }));
  const exact = normalized.find((file) => file.text.includes(needle));
  if (exact) return { kind: "found", file: exact.name };
  let best: { file: string; share: number } | null = null;
  const capped = needle.slice(0, MAX_QUOTE);
  for (const file of normalized) {
    const share = longestCommonSubstring(capped, file.text.slice(0, MAX_FILE)) / capped.length;
    if (!best || share > best.share) best = { file: file.name, share };
  }
  return best && best.share >= SIMILAR_SHARE ? { kind: "similar", file: best.file, share: best.share } : { kind: "missing" };
}

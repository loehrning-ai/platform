/**
 * Captions as single sentences, so a folded caption can show its first
 * sentence whole and never cut a word. A sentence ends at ".", "!" or "?"
 * after a word of two or more lowercase letters (or after % or €), when the
 * next word starts with a capital letter or an opening quote. So "am 1. Juli",
 * "z. B." and "Nr. 3" stay inside their sentence.
 */
const BOUNDARY = /(?<=(?:[\p{Ll}"“”)]{2}|[%€])[.!?])\s+(?=[„"“\p{Lu}])/u;

export function toSentences(parts: readonly string[]): readonly string[] {
  return parts.flatMap((part) => part.split(BOUNDARY)).map((sentence) => sentence.trim()).filter(Boolean);
}

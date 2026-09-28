/**
 * Keeps legal references and dates on one line at render time.
 *
 * "§ 64", "Abs. 1", "Art. 5", "Section 64(1)", "Annex III", "lit. c" and dates
 * such as "2. Februar 2025" or "2 February 2025" must not break between the
 * marker and its number, nor between day, month and year. The space after
 * the marker, the day and the month becomes U+00A0. The
 * Markdown sources keep normal spaces; only rendered text changes.
 *
 * Testing Library's default normalizer and the browser's innerText treat
 * U+00A0 as whitespace, so text queries and copy-paste keep working.
 */

export const NBSP = " ";

// Longer markers first so "§§" wins over "§" and "Sections" over "Section".
const MARKERS = [
  "§§",
  "§",
  "Abs.",
  "Nr.",
  "Art.",
  "S.",
  "lit.",
  "Anhang",
  "Sections",
  "Section",
  "Articles",
  "Article",
  "Annex",
  "nos.",
  "no.",
  "point",
] as const;

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A marker preceded by a non-letter (or the start) and followed by one space
 * and then a digit, a roman numeral, "(" or a single lowercase letter (as in
 * "lit. c"). "point of view" stays breakable: "of" is not a single letter.
 */
const LEGAL_REF = new RegExp(
  `(^|[^\\p{L}\\p{N}])(${MARKERS.map(escape).join("|")}) (?=\\d|[IVXLC]+(?![\\p{L}\\p{N}])|\\(|\\p{Ll}(?!\\p{L}))`,
  "gu",
);

const GERMAN_MONTHS =
  "Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember";
const ENGLISH_MONTHS =
  "January|February|March|April|May|June|July|August|September|October|November|December";

// "2. Februar" and "2 February": the day stays with its month.
const DAY_MONTH = new RegExp(
  `(^|[^\\p{L}\\p{N}])(\\d{1,2}\\.?) (?=(?:${GERMAN_MONTHS}|${ENGLISH_MONTHS})(?![\\p{L}]))`,
  "gu",
);

// "November 2026": the month stays with its year, so a date range such as
// "1. Oktober 2026 bis 30. November 2026" breaks only around "bis".
const MONTH_YEAR = new RegExp(
  `(^|[^\\p{L}\\p{N}])(${GERMAN_MONTHS}|${ENGLISH_MONTHS}) (?=\\d{4}(?!\\d))`,
  "gu",
);

export function keepLegalRefsTogether(text: string): string {
  return text
    .replace(LEGAL_REF, `$1$2${NBSP}`)
    .replace(DAY_MONTH, `$1$2${NBSP}`)
    .replace(MONTH_YEAR, `$1$2${NBSP}`);
}

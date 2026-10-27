/**
 * Strict parser for the visitor's numbers. No eval, no Number() on raw text:
 * every token must match one of the anchored grammars below or the whole
 * paste is rejected. Suffixes (12k, 1 Mio) and anything else are rejected.
 */

export const MIN_VALUES = 3;
export const MAX_VALUES = 6;
const LIMIT = 1e12;
/** More decimals than this are rejected, so no number is ever shown rounded. */
export const MAX_DECIMALS = 2;

const DE_GROUPED = /^\d{1,3}(\.\d{3})+(,\d+)?$/; // 1.234 / 1.234,56
const EN_GROUPED = /^\d{1,3}(,\d{3})+(\.\d+)?$/; // 1,234,567 / 1,234.56
const DE_DECIMAL = /^\d+,\d+$/; // 12,5 (a lone comma is a DE decimal mark)
const PLAIN = /^\d+(\.\d+)?$/; // 1234 / 1234.5

/** One number, or null when the token is not a number in an accepted notation. */
export function parseNumber(token: string): number | null {
  let text = token.trim();
  let negative = false;
  const bracket = /^\((.+)\)$/.exec(text);
  if (bracket) {
    negative = true;
    text = (bracket[1] as string).trim();
  }
  const sign = /^([+\-−])\s?(.+)$/.exec(text);
  if (sign) {
    if (bracket) return null;
    negative = sign[1] !== "+";
    text = sign[2] as string;
  }
  let normalized: string;
  if (DE_GROUPED.test(text)) normalized = text.replace(/\./g, "").replace(",", ".");
  else if (EN_GROUPED.test(text) && (text.split(",").length > 2 || text.includes("."))) normalized = text.replace(/,/g, "");
  else if (DE_DECIMAL.test(text)) normalized = text.replace(",", ".");
  else if (PLAIN.test(text)) normalized = text;
  else return null;
  if ((normalized.split(".")[1] ?? "").length > MAX_DECIMALS) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value >= LIMIT) return null;
  const signed = negative ? -value : value;
  return signed === 0 ? 0 : signed;
}

/** Tab, newline, `;`, `, ` (comma plus space) or two or more spaces separate values. */
const SEPARATORS = /[\t\r\n;]+|,\s+|\s{2,}/;

export type ParseFailure = "count" | "token";
export type ParsedList =
  | { readonly ok: true; readonly values: readonly number[] }
  | { readonly ok: false; readonly reason: ParseFailure };

export function parseList(text: string): ParsedList {
  const tokens = text
    .trim()
    .split(SEPARATORS)
    .flatMap((token) => {
      const whole = token.trim();
      if (whole === "") return [];
      // "1 2 3" with single spaces: only when the whole token is not a number itself.
      return parseNumber(whole) === null && /\s/.test(whole) && !/^[+\-−(]\s/.test(whole) ? whole.split(/\s+/) : [whole];
    });
  if (tokens.length < MIN_VALUES || tokens.length > MAX_VALUES) return { ok: false, reason: "count" };
  const values: number[] = [];
  for (const token of tokens) {
    const value = parseNumber(token);
    if (value === null) return { ok: false, reason: "token" };
    values.push(value);
  }
  return { ok: true, values };
}

/** An optional single number: empty is fine (null), garbage is not (undefined). */
export function parseOptional(text: string): number | null | undefined {
  if (text.trim() === "") return null;
  return parseNumber(text) ?? undefined;
}

const NAME_ALLOWED = /[^A-Za-z0-9_ äöüÄÖÜß.-]/g;

/** Column and table names: allow-listed characters only, at most 40 of them. */
export function sanitizeName(text: string, max = 40): string {
  return text.replace(NAME_ALLOWED, "").replace(/\s+/g, " ").trim().slice(0, max);
}

/** snake_case id for the YAML slug. */
export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "metric";
}

import type { Locale } from "@/lib/i18n/locale";

/**
 * Number formatting for the demo. German puts a no-break space before % and
 * €, English writes "+0.8%" and "€4,124,238". Negative values use the true
 * minus sign (U+2212), never a hyphen or a dash.
 */

const NBSP = "\u00a0";
const MINUS = "−";

const TAG: Record<Locale, string> = { de: "de-DE", en: "en-GB" };

function number(locale: Locale, value: number, digits: number): string {
  return new Intl.NumberFormat(TAG[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: true,
  }).format(value);
}

/** Integers with grouping: 9.162 / 9,162. */
export function formatInt(locale: Locale, value: number): string {
  return number(locale, Math.round(value), 0);
}

/** Decimals: 2,51 / 2.51. */
export function formatDecimal(locale: Locale, value: number, digits = 2): string {
  return number(locale, value, digits);
}

/** Round half away from zero at `digits` decimals, then drop a negative zero. */
function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  const rounded = Math.sign(value) * Math.round(Math.abs(value) * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * A fraction as a percentage: 0.008 -> "+0,8 %" / "+0.8%". `signed` adds a
 * plus for positive values; a value that rounds to zero carries no sign.
 */
export function formatPct(
  locale: Locale,
  fraction: number,
  { digits = 1, signed = true }: { digits?: number; signed?: boolean } = {},
): string {
  const pct = roundTo(fraction * 100, digits);
  const sign = pct > 0 ? (signed ? "+" : "") : pct < 0 ? MINUS : "";
  const body = number(locale, Math.abs(pct), digits);
  return locale === "de" ? `${sign}${body}${NBSP}%` : `${sign}${body}%`;
}

/** Euro amounts without cents: 4.124.238 € / €4,124,238. */
export function formatEur(locale: Locale, value: number): string {
  const body = formatInt(locale, value);
  return locale === "de" ? `${body}${NBSP}€` : `€${body}`;
}

/** Replace no-break spaces with plain spaces (for comparing with copy text). */
export function plainSpaces(text: string): string {
  return text.replace(/\u00a0/g, " ");
}

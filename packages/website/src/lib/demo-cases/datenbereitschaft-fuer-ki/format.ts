/**
 * Number formatting for demo 03, written out by hand so the server and every
 * browser print the same string (no ICU differences). Negative numbers use
 * the minus sign U+2212, never a hyphen or a dash.
 */
import type { Locale } from "@/lib/i18n/locale";

export const MINUS = "−";
/** No-break space between a number and its unit, so "32.380 €" never breaks. */
export const NBSP = " ";

/** 334675 -> DE "334.675", EN "334,675"; 2.7548 with 2 digits -> "2,75" / "2.75". */
export function formatNumber(value: number, locale: Locale, digits = 0): string {
  const fixed = Math.abs(value).toFixed(digits);
  const [integerPart = "0", fraction] = fixed.split(".");
  const separator = locale === "de" ? "." : ",";
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  const body = fraction ? `${grouped}${locale === "de" ? "," : "."}${fraction}` : grouped;
  return value < 0 && Number(fixed) !== 0 ? `${MINUS}${body}` : body;
}

/** DE "−19.960 €" (no-break space), EN "−€19,960"; any other unit is appended. */
export function formatMoney(amount: number, unit: string, locale: Locale, digits = 0): string {
  const body = formatNumber(Math.abs(amount), locale, digits);
  const sign = amount < 0 ? MINUS : "";
  if (unit === "EUR") return locale === "de" ? `${sign}${body}${NBSP}€` : `${sign}€${body}`;
  return unit ? `${sign}${body}${NBSP}${unit}` : `${sign}${body}`;
}

/** How many decimals a number carries, at most `max` (float noise like 4.6000000000000005 counts as 4.6). */
export function countDecimals(value: number, max = 2): number {
  for (let digits = 0; digits < max; digits += 1) {
    const scaled = value * 10 ** digits;
    if (Math.abs(scaled - Math.round(scaled)) < 1e-7 * Math.max(1, Math.abs(scaled))) return digits;
  }
  return max;
}

/**
 * Axis ticks and crowded bar labels: below 1000 the number as it is (with the
 * decimals it carries, or `decimals` when a series fixes them), from 1000 on the "k" form:
 * 350000 -> "350k", -40000 -> "−40k".
 */
export function formatCompact(value: number, locale: Locale = "en", decimals?: number): string {
  if (Math.abs(value) < 1000) return formatNumber(value, locale, decimals ?? countDecimals(value, 4));
  const thousands = Math.round(Math.abs(value) / 100) / 10;
  const body = locale === "de" ? String(thousands).replace(".", ",") : String(thousands);
  return `${value < 0 ? MINUS : ""}${body}k`;
}

/**
 * The short form of a bar label where the whole number does not fit: thousands
 * with up to two decimals, rounded half away from zero in integers (no float
 * drift) and trailing zeros dropped. 344450 -> "344,45k", 334675 -> "334,68k".
 */
export function formatShort(value: number, locale: Locale): string {
  if (Math.abs(value) < 1000) return formatNumber(value, locale, countDecimals(value, 2));
  const hundredths = Math.round(Math.abs(value) / 10);
  const whole = Math.floor(hundredths / 100);
  const rest = String(hundredths % 100).padStart(2, "0").replace(/0+$/, "");
  const mark = locale === "de" ? "," : ".";
  return `${value < 0 ? MINUS : ""}${whole}${rest ? mark + rest : ""}k`;
}

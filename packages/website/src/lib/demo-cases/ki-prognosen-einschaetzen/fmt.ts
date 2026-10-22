/**
 * Number formats for Demo 01, deterministic on server and client (no Intl
 * locale data): DE "1.050", "12,0 %", "+2,4 %", "1,2 Std."; EN "1,050",
 * "12.0%", "+2.4%", "1.2 h". Negative numbers use U+2212, never a hyphen.
 */
import type { Locale } from "@/lib/i18n/locale";

export const MINUS = "−";

function groupThousands(digits: string, separator: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/** A whole number: 1.050 / 1,050. Negative numbers get U+2212. */
export function fmtInt(value: number, locale: Locale): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? MINUS : "";
  return sign + groupThousands(String(Math.abs(rounded)), locale === "de" ? "." : ",");
}

/** A decimal with a fixed number of digits, without sign: 12,0 / 12.0. */
export function fmtDecimal(value: number, digits: number, locale: Locale): string {
  const fixed = Math.abs(value).toFixed(digits);
  const [whole, fraction] = fixed.split(".");
  const grouped = groupThousands(whole ?? "0", locale === "de" ? "." : ",");
  if (!fraction) return grouped;
  return `${grouped}${locale === "de" ? "," : "."}${fraction}`;
}

/** A share as a percentage: 0.12 -> "12,0 %" / "12.0%". */
export function fmtPct(share: number, locale: Locale, digits = 1): string {
  const value = fmtDecimal(share * 100, digits, locale);
  const sign = share * 100 < 0 && Number(value.replace(",", ".")) !== 0 ? MINUS : "";
  return locale === "de" ? `${sign}${value}\u00A0%` : `${sign}${value}%`;
}

/** A signed percentage: 0.024 -> "+2,4 %", -0.012 -> "−1,2 %". Zero has no sign. */
export function fmtSignedPct(share: number, locale: Locale, digits = 1): string {
  const value = fmtDecimal(share * 100, digits, locale);
  const isZero = Number(value.replace(",", ".")) === 0;
  const sign = isZero ? "" : share < 0 ? MINUS : "+";
  return locale === "de" ? `${sign}${value}\u00A0%` : `${sign}${value}%`;
}

/** Hours of data age: 1.2 -> "1,2 Std." / "1.2 h". */
export function fmtHours(hours: number, locale: Locale): string {
  const value = fmtDecimal(hours, 1, locale);
  return locale === "de" ? `${value}\u00A0Std.` : `${value}\u00A0h`;
}

/** Three store numbers in store order: "480 / 365 / 205". */
export function fmtTriple(values: readonly number[], locale: Locale): string {
  return values.map((value) => fmtInt(value, locale)).join(" / ");
}

/** "480 / 365 / 205" in running text: no-break spaces around each slash between numbers. */
export function keepTriplesTogether(text: string): string {
  return text.replace(/(\d) \/ (?=[\d−+])/g, "$1\u00A0/\u00A0");
}

/** A list in prose: "A", "A und B", "A, B und C" / "A and B", "A, B and C". */
export function fmtList(items: readonly string[], locale: Locale): string {
  const and = locale === "de" ? "und" : "and";
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;
}

/** "1, 3 und 6" / "1, 3 and 6". */
export function fmtDays(days: readonly number[], locale: Locale): string {
  return fmtList(days.map(String), locale);
}

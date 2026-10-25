import type { Locale } from "./types";

/** Float noise off: 279.7 stays 279.7 however it was summed. */
export function round(value: number, digits = 6): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const formatters = new Map<string, Intl.NumberFormat>();

/** A figure in the locale's own notation with a fixed number of decimals. */
export function formatNumber(value: number, locale: Locale, digits: number): string {
  const key = `${locale}:${digits}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      useGrouping: true,
    });
    formatters.set(key, formatter);
  }
  return formatter.format(round(value, 9));
}

/** "91,7 %" from 0.917. */
export function formatPercent(fraction: number, locale: Locale, digits = 1): string {
  return `${formatNumber(fraction * 100, locale, digits)} %`;
}

/** Decimals needed to show every value exactly, at most `max`. */
export function decimalsOf(values: readonly number[], max = 2): number {
  let digits = 0;
  for (const value of values) {
    for (let d = digits; d <= max; d += 1) {
      if (Math.abs(round(value, d) - value) < 1e-9) {
        digits = d;
        break;
      }
      digits = Math.max(digits, d);
    }
  }
  return Math.min(digits, max);
}

/** A figure with only the decimals it needs, at most `max`: 30000 stays "30.000", 279.7 stays "279,7". */
export function formatSmart(value: number, locale: Locale, max: number): string {
  return formatNumber(value, locale, decimalsOf([value], max));
}

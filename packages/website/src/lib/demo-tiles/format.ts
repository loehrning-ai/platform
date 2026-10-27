import type { Locale } from "@/lib/i18n/locale";

const MINUS = "−";

/**
 * A figure for a tile, formatted for the locale ("1.050" vs "1,050") with a
 * real minus sign. Pure and synchronous, so a tile renders the same on the
 * server and in a test.
 */
export function tileNumber(
  value: number,
  locale: Locale,
  options: { readonly digits?: number; readonly sign?: boolean } = {},
): string {
  const digits = options.digits ?? 0;
  const text = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: true,
  }).format(Math.abs(value));
  if (value < 0) return `${MINUS}${text}`;
  return options.sign && value > 0 ? `+${text}` : text;
}

/**
 * The page's way of writing numbers, money and months for one pack. Every
 * number on the stage goes through here, so DE and EN never mix notations.
 */
import type { Pack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import { fill } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/files";
import { formatCompact, formatMoney, formatNumber } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/format";

export interface Fmt {
  readonly locale: "de" | "en";
  /** Fills "{name}" slots. */
  readonly t: (template: string, values?: Readonly<Record<string, string | number>>) => string;
  readonly n: (value: number) => string;
  readonly eur: (value: number) => string;
  readonly compact: (value: number) => string;
  /** "2025-03" to "März 2025" / "March 2025". */
  readonly month: (month: string) => string;
  /** "2026-04" to "Apr". */
  readonly monthShort: (month: string) => string;
  /** A list joined with "und" / "and". */
  readonly list: (items: readonly string[]) => string;
  /** Quotation marks of the language: „…“ in German, “…” in English. */
  readonly quote: (text: string) => string;
}

export function formatter(pack: Pack): Fmt {
  const locale = pack.locale;
  const index = (month: string) => Number(month.slice(5, 7)) - 1;
  return {
    locale,
    t: (template, values = {}) => fill(template, values),
    n: (value) => formatNumber(value, locale),
    eur: (value) => formatMoney(value, "EUR", locale),
    compact: (value) => formatCompact(value, locale),
    month: (month) => fill(pack.monthYear, { month: pack.monthLong[index(month)] ?? month, year: month.slice(0, 4) }),
    monthShort: (month) => pack.monthShort[index(month)] ?? month,
    list: (items) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} ${pack.sicht.and} ${items[items.length - 1]}`),
    quote: (text) => (locale === "de" ? `\u201E${text}\u201C` : `\u201C${text}\u201D`),
  };
}

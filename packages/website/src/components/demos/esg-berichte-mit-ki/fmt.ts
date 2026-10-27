import { figures, formatNumber, longDate, shortDate, type Figures } from "@/lib/demo-cases/esg-berichte-mit-ki/figures";
import type { CalendarDate } from "@/lib/demo-cases/esg-berichte-mit-ki/rules";
import type { Locale } from "@/lib/i18n/locale";

/**
 * The client's way to fill the pack: {name} slots from the kit figures and
 * the values a scene computes, numbers and dates in the page's language.
 */
export interface Fmt {
  readonly locale: Locale;
  readonly figures: Figures;
  /** Fills {slots}: the kit figures first, then the values given. */
  readonly t: (template: string, values?: Readonly<Record<string, string | number>>) => string;
  /** Each sentence filled. */
  readonly ts: (templates: readonly string[], values?: Readonly<Record<string, string | number>>) => string[];
  readonly n: (value: number, digits?: number) => string;
  /** "16.10.2026". */
  readonly date: (date: CalendarDate) => string;
  /** "16. Oktober 2026" / "16 October 2026". */
  readonly longDate: (date: CalendarDate) => string;
}

export function formatter(locale: Locale): Fmt {
  const kit = figures(locale);
  const t = (template: string, values: Readonly<Record<string, string | number>> = {}) =>
    template.replace(/\{(\w+)\}/g, (whole, key: string) => {
      if (key in values) return String(values[key]);
      if (key in kit) return String(kit[key]);
      return whole;
    });
  return {
    locale,
    figures: kit,
    t,
    ts: (templates, values) => templates.map((template) => t(template, values)),
    n: (value, digits = 0) => formatNumber(value, locale, digits),
    date: shortDate,
    longDate: (date) => longDate(date, locale),
  };
}

/** The visitor's numbers in plain words: "eine", "zwei" up to twelve, then digits. */
const NUMBER_WORDS = {
  de: ["null", "eine", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf"],
  en: ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"],
} as const;

export function numberWord(value: number, locale: Locale): string {
  return NUMBER_WORDS[locale][value] ?? String(value);
}

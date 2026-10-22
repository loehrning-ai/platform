import "server-only";
import type { Locale } from "@/lib/i18n/locale";
import type { EsgStrings } from "./copy-bind";
import { ESG_STRINGS, JUDGE_TEXT } from "./copy";
import type { EsgWorld } from "./core";
import { FACTS, REASONS, STROM_MONDAY } from "./facts";
import { INVOICE_OPTIONS, ROWS, STAYS_BECAUSE } from "./rows";
import { CHECKLIST, TAKEAWAYS, type Takeaway } from "./takeaways";
import type { AnswerRow, L, Option, RowId } from "./types";

/**
 * Everything the page's client tree reads, in one locale, as plain data. The
 * server component (components/demos/esg-berichte-mit-ki/index.tsx) builds
 * it and passes it as a prop, so the browser gets one locale's words only and
 * no client module imports facts.ts, rows.ts, copy.ts or takeaways.ts.
 *
 * Inside the pack every L keeps its shape but carries only `locale`: client
 * code reads an L with the page's locale and nothing else (pack.test.ts plays
 * the whole demo on a pack and checks that no other locale is read).
 */
export interface EsgPack {
  readonly locale: Locale;
  readonly strings: EsgStrings;
  readonly world: EsgWorld;
  readonly rows: readonly AnswerRow[];
  readonly stays: Readonly<Partial<Record<RowId, L>>>;
  readonly invoiceOptions: readonly Option[];
  readonly takeaways: readonly [Takeaway, Takeaway, Takeaway];
  readonly checklist: {
    readonly title: string;
    readonly lines: readonly string[];
    readonly close: string;
  };
}

const LOCALES: readonly Locale[] = ["de", "en"];

/** An L: a plain object with exactly a string per locale. */
function isL(value: object): value is L {
  const keys = Object.keys(value);
  return (
    keys.length === LOCALES.length &&
    LOCALES.every((locale) => typeof (value as Record<string, unknown>)[locale] === "string")
  );
}

/** A deep copy of `value` in which every L carries only `locale`. */
export function onlyLocale<T>(value: T, locale: Locale): T {
  if (Array.isArray(value)) return value.map((item) => onlyLocale(item, locale)) as T;
  if (value === null || typeof value !== "object") return value;
  if (isL(value)) return { [locale]: value[locale] } as T;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, onlyLocale(item, locale)]),
  ) as T;
}

export function buildPack(locale: Locale): EsgPack {
  return {
    locale,
    strings: ESG_STRINGS[locale],
    world: {
      facts: onlyLocale(FACTS, locale),
      strom: onlyLocale(STROM_MONDAY, locale),
      reasons: onlyLocale(REASONS, locale),
      text: { [locale]: JUDGE_TEXT[locale] },
    },
    rows: onlyLocale(ROWS, locale),
    stays: onlyLocale(STAYS_BECAUSE, locale),
    invoiceOptions: onlyLocale(INVOICE_OPTIONS, locale),
    takeaways: TAKEAWAYS[locale],
    checklist: CHECKLIST[locale],
  };
}

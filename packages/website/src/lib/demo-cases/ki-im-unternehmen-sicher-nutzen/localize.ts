import type { DemoLocale, L10n } from "./types";

/*
 * One language out of the bilingual case data. The server picks the page's
 * locale and hands the client island plain strings, so the browser never
 * downloads the other language.
 */

/** T with every { de, en } leaf replaced by one string. */
export type Localized<T> = T extends string | number | boolean | null | undefined
  ? T
  : T extends L10n
    ? string
    : T extends readonly (infer U)[]
      ? readonly Localized<U>[]
      : { readonly [K in keyof T]: Localized<T[K]> };

function isL10n(value: object): value is L10n {
  const keys = Object.keys(value);
  return (
    keys.length === 2 &&
    typeof (value as Partial<L10n>).de === "string" &&
    typeof (value as Partial<L10n>).en === "string"
  );
}

function pick(value: unknown, locale: DemoLocale): unknown {
  if (Array.isArray(value)) return value.map((entry) => pick(entry, locale));
  if (value === null || typeof value !== "object") return value;
  if (isL10n(value)) return value[locale];
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, pick(entry, locale)]));
}

/** A new tree in one language; the source stays untouched. */
export function localize<T>(value: T, locale: DemoLocale): Localized<T> {
  return pick(value, locale) as Localized<T>;
}

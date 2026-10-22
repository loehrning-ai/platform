/**
 * Both locales of "Die Zahl, die trägt", for server code and tests only.
 * The server picks one with copyFor(locale) and passes it to the client
 * tree as a prop; client modules import types from copy-types.ts instead.
 */

import type { Locale } from "@/lib/i18n/locale";
import { de } from "./copy-de";
import { en } from "./copy-en";
import type { NorthwindCopy } from "./copy-types";

export * from "./copy-types";

export const COPY: Readonly<Record<Locale, NorthwindCopy>> = { de, en };

export function copyFor(locale: Locale): NorthwindCopy {
  return COPY[locale];
}

/**
 * Demo 01: both locales' copy in one map, for server code and tests only.
 * No component imports it: client modules import copy-types.ts for the
 * shape and receive their locale's copy from a locale entry
 * (forecast-release-de/-en.tsx), see bundle-hygiene.test.ts.
 */
import type { Locale } from "@/lib/i18n/locale";
import { DE_COPY } from "./copy-de";
import { EN_COPY } from "./copy-en";
import type { ForecastCopy } from "./copy-types";

export type { ForecastCopy, SentencePart } from "./copy-types";

export const FORECAST_COPY: Readonly<Record<Locale, ForecastCopy>> = {
  de: DE_COPY,
  en: EN_COPY,
};

export function copyFor(locale: Locale): ForecastCopy {
  return FORECAST_COPY[locale];
}

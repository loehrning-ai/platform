import "server-only";

import { headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_REQUEST_HEADER,
  type Locale,
} from "./locale";

export function localeFromRequestHeaders(requestHeaders: Headers): Locale {
  const value = requestHeaders.get(LOCALE_REQUEST_HEADER);
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getRequestLocale(): Promise<Locale> {
  return localeFromRequestHeaders(await headers());
}

/**
 * Every string of demo 03 in DE and EN (spec sections 8 and 9). copy.test.ts
 * keeps both locales equal in shape and scans them for dashes, "Sie", umlaut
 * substitutes and numbers the kit lacks. This module pulls in both languages:
 * import it from server code and tests only, never from a "use client" module
 * (client-bundle.test.ts guards that).
 */
import type { Locale } from "@/lib/i18n/locale";
import { DE_TEXT } from "./copy-de";
import { EN_TEXT } from "./copy-en";
import type { DemoText } from "./copy-shared";

export * from "./copy-shared";

export const DEMO_TEXT: Readonly<Record<Locale, DemoText>> = { de: DE_TEXT, en: EN_TEXT };

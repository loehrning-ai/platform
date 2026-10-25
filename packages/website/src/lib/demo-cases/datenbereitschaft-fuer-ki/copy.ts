import "server-only";

import type { Locale } from "@/lib/i18n/locale";
import { DE } from "./copy-de";
import { EN } from "./copy-en";
import type { DemoPack } from "./pack";

/**
 * The words of the Stufe oder Treppe? demo, both languages. Server only:
 * index.tsx picks one pack and passes it to the client demo as props, so the
 * browser bundle carries a single language (checked by demo-contract.test.ts).
 */
export type { DemoPack } from "./pack";

export const COPY = { de: DE, en: EN } as const satisfies Record<Locale, DemoPack>;

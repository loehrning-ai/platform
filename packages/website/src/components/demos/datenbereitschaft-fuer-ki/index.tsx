/*
 * DEMO CONTRACT · /demos/datenbereitschaft-fuer-ki (and /en/demos/datenbereitschaft-fuer-ki)
 *
 * Demo 03 "Mach die Zahl richtig." for Workshop 03. The shell (demo-page.tsx)
 * renders the poster band and the synthetic-data line; this folder renders
 * everything below it: the rail, requests 01 to 05 and Zum Mitnehmen.
 *
 * - Logic, data, copy and tests live in src/lib/demo-cases/datenbereitschaft-fuer-ki/
 *   (pure TypeScript, no React, no Date, no randomness).
 * - This file is a server component: it picks the current locale's copy and
 *   hands it to the client tree as a prop, so the browser loads one language.
 *   No "use client" module imports copy.ts, copy-de.ts or copy-en.ts
 *   (client-bundle.test.ts).
 * - The whole tree server-renders with its initial state: every section, the
 *   questions, the sources and the full take-aways are in the first HTML.
 * - Motion is seek(t) from layout.ts and plays only after Prüfen; reduced
 *   motion renders t = 1 and starts no requestAnimationFrame.
 * - Styles are scoped to .dr3 in demo.css.
 */
import type { Locale } from "@/lib/i18n/locale";
import { DE_TEXT } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import { EN_TEXT } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-en";
import { DataReadinessDemo } from "./demo";
import "./demo.css";

interface Props {
  readonly locale: Locale;
}

export default function MakeTheNumberRightDemo({ locale }: Props) {
  return <DataReadinessDemo text={locale === "en" ? EN_TEXT : DE_TEXT} />;
}

/*
 * DEMO CONTRACT · /demos/geschaeftsberichte-mit-ki-lesen (and /en/demos/geschaeftsberichte-mit-ki-lesen)
 *
 * Workshop 02 "Geschäftsberichte mit KI lesen": "Die Zahl, die trägt". The
 * learner reads NORTHWIND's September report without AI: compare months
 * fairly, count defects as a rate, check four sourced figures and write a
 * six-line decision on CRAFT whose every line rests on the data.
 *
 * - Default export, mounted by src/app/demos/<slug>/page.tsx with
 *   { locale }. This is a server component: it picks the locale's copy and
 *   passes it to the client tree as plain data, so the browser loads one
 *   language, not both. The page shell renders the band (title, question, workshop
 *   link) and the synthetic-data line; this starts with the first section.
 * - Server-rendered: the client tree's first render is the report's state of
 *   every figure, every option, the workshop's answer and the full "Zum
 *   Mitnehmen". No collapsible UI, nothing sticky.
 * - Logic, data, copy and frames: src/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/.
 *   Motion is frame(p), driven by requestAnimationFrame per choice, and
 *   prefers-reduced-motion shows the end state.
 */
import { copyFor } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import type { Locale } from "@/lib/i18n/locale";
import { NorthwindDemo } from "./northwind-demo";

interface Props {
  readonly locale: Locale;
}

export default function NumberThatHoldsDemo({ locale }: Props) {
  return <NorthwindDemo locale={locale} copy={copyFor(locale)} />;
}

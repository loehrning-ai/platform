/*
 * DEMO · /demos/datenbereitschaft-fuer-ki (and /en/demos/datenbereitschaft-fuer-ki)
 * Workshop 03 "Die Fragekarte". Server component: picks the locale pack and
 * renders the client demo with it, so the browser bundle holds one language.
 * The hub miniature is tile.tsx (+ tile-motion.ts); the contract of this
 * folder is checked by src/components/demos/demo-contract.test.ts.
 */
import type { DemoComponentProps } from "../demo-page";
import { COPY } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy";
import Demo from "./demo";

export default function DatenbereitschaftFuerKiDemo({ locale }: DemoComponentProps) {
  return <Demo pack={COPY[locale]} />;
}

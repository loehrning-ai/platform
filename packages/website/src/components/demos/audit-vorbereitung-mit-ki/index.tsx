/*
 * DEMO · /demos/audit-vorbereitung-mit-ki (and /en/demos/audit-vorbereitung-mit-ki)
 * Workshop 05 "Audit-Vorbereitung mit KI": the Vardar folder against
 * Tannwald's eight requests. Server component: picks the locale pack and
 * renders the client demo with it, so the browser bundle holds one
 * language. The hub miniature is tile.tsx (+ tile-motion.ts); the contract
 * of this folder is checked by src/components/demos/demo-contract.test.ts.
 */
import type { DemoComponentProps } from "../demo-page";
import { COPY } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import Demo from "./demo";

export default function AuditVorbereitungDemo({ locale }: DemoComponentProps) {
  return <Demo copy={COPY[locale]} locale={locale} />;
}

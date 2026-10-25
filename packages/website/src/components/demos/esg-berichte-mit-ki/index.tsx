/*
 * DEMO · /demos/esg-berichte-mit-ki (and /en/demos/esg-berichte-mit-ki)
 * Workshop 04 "Elf von zwölf". Server component: picks the locale pack and renders
 * the client demo with it, so the browser bundle holds one language. The hub
 * miniature is tile.tsx (+ tile-motion.ts); the contract of this folder is
 * checked by src/components/demos/demo-contract.test.ts.
 */
import type { DemoComponentProps } from "../demo-page";
import { COPY } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import Demo from "./demo";

export default function EsgBerichteMitKiDemo({ locale }: DemoComponentProps) {
  return <Demo pack={COPY[locale]} />;
}

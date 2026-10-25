/*
 * DEMO · /demos/geschaeftsberichte-mit-ki-lesen (and /en/demos/geschaeftsberichte-mit-ki-lesen)
 * Workshop 02 "Monatsgrenze". Server component: picks the locale pack and renders
 * the client demo with it, so the browser bundle holds one language. The hub
 * miniature is tile.tsx (+ tile-motion.ts); the contract of this folder is
 * checked by src/components/demos/demo-contract.test.ts.
 */
import type { DemoComponentProps } from "../demo-page";
import { COPY } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import Demo from "./demo";

export default function GeschaeftsberichteMitKiLesenDemo({ locale }: DemoComponentProps) {
  return <Demo copy={COPY[locale]} />;
}

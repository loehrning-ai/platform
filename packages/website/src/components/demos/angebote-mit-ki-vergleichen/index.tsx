/*
 * DEMO · /demos/angebote-mit-ki-vergleichen (and /en/demos/angebote-mit-ki-vergleichen)
 * Workshop 06 "Die Vergleichsbasis", rotfaden's stack demo ported onto the v3 shell. Server component:
 * picks the locale pack and renders the client demo with it, so the browser bundle holds one language.
 * The hub miniature is tile.tsx (+ tile-motion.ts); the contract of this folder is checked by
 * src/components/demos/demo-contract.test.ts.
 */
import type { DemoComponentProps } from "../demo-page";
import { COPY } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import Demo from "./demo";

export default function AngeboteMitKiVergleichenDemo({ locale }: DemoComponentProps) {
  return <Demo pack={COPY[locale]} />;
}

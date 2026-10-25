/*
 * DEMO · /demos/ki-prognosen-einschaetzen (and /en/demos/ki-prognosen-einschaetzen)
 * Workshop 01 "Hundert Startwochen". Server component: picks the locale pack and renders
 * the client demo with it, so the browser bundle holds one language. The hub
 * miniature is tile.tsx (+ tile-motion.ts); the contract of this folder is
 * checked by src/components/demos/demo-contract.test.ts.
 */
import type { DemoComponentProps } from "../demo-page";
import { COPY } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import Demo from "./demo";

export default function KiPrognosenEinschaetzenDemo({
  locale,
}: DemoComponentProps) {
  return <Demo copy={COPY[locale]} />;
}

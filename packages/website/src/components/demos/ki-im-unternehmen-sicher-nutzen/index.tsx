/*
 * DEMO · /demos/ki-im-unternehmen-sicher-nutzen (and /en/demos/ki-im-unternehmen-sicher-nutzen)
 * Workshop 05 "Was fliegt mit?". Server component: picks the locale pack and
 * renders the client demo with it, so the browser bundle holds one language;
 * the sources block (rule + dated facts) is server-rendered below it. The hub
 * miniature is tile.tsx (+ tile-motion.ts); the contract of this folder is
 * checked by src/components/demos/demo-contract.test.ts.
 */
import type { DemoComponentProps } from "../demo-page";
import { getDemoForLocale } from "@/lib/demos";
import { COPY } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/copy";
import Demo from "./demo";
import { Sources } from "./sources";

export default function KiImUnternehmenSicherNutzenDemo({ locale }: DemoComponentProps) {
  const entry = getDemoForLocale("ki-im-unternehmen-sicher-nutzen", locale);
  return (
    <>
      <Demo copy={COPY[locale]} promise={entry?.oneLiner} note={entry?.syntheticDataLabel} />
      <Sources locale={locale} />
    </>
  );
}

/*
 * DEMO · /demos/esg-berichte-mit-ki (and /en/demos/esg-berichte-mit-ki)
 * "Zehn Fakten, 14 Antworten": the person who checks and signs every ESG
 * answer, trained by hand on the files of the Workshop 04 kit, with no AI.
 *
 * Server entry. The page shell renders the poster band and the synthetic-data
 * line; this renders everything below it. The client tree (esg-demo.tsx) is
 * server-rendered too: card 1, the whole answer sheet, the Monday lock line
 * and all three takeaways are in the first HTML. Logic and data live in
 * src/lib/demo-cases/esg-berichte-mit-ki (pure, unit-tested against the kit zip).
 *
 * This server component picks the page's locale: it builds the locale pack
 * (lib/demo-cases/esg-berichte-mit-ki/pack.ts) and hands it to the client
 * tree as a prop, so the browser loads one locale's words and no client
 * module imports the bilingual data (bundle.test.ts walks the import graph).
 */
import { buildPack } from "@/lib/demo-cases/esg-berichte-mit-ki/pack";
import type { Locale } from "@/lib/i18n/locale";
import { EsgDemo } from "./esg-demo";
import "./esg-demo.css";

interface Props {
  readonly locale: Locale;
}

export default function TenFactsDemo({ locale }: Props) {
  return <EsgDemo pack={buildPack(locale)} />;
}

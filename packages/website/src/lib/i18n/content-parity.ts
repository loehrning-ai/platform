import type { Locale } from "./locale";

// Only reviewed public routes belong here. Protected course-reader routes stay
// out of this SEO registry even when their locale-specific content is complete.
const ENGLISH_CONTENT_PARITY_PATHS = new Set<string>([
  "/",
  "/ai-native",
  "/ai-native/glossar",
  "/ai-native/verifizierung",
  "/blog",
  "/bot",
  "/blog/eu-ai-act-grundlagen",
  "/blog/ki-in-der-ausbildung",
  "/buecher",
  "/buecher/ki-landschaft",
  "/buecher/ki-landschaft/01_zweimal_gemessen",
  "/buecher/ki-landschaft/02_textmenge",
  "/buecher/ki-landschaft/03_schaufenster",
  "/buecher/ki-landschaft/04_stellen_namen",
  "/buecher/ki-landschaft/05_land",
  "/buecher/ki-landschaft/06_stimmen",
  "/buecher/ki-landschaft/07_schluessel",
  "/buecher/ki-landschaft/08_dein_zug",
  "/buecher/ki-landschaft/09_quellen",
  "/datenschutz",
  "/demos",
  "/demos/agent-pipeline",
  "/demos/cost-drift-observability",
  "/demos/excel",
  "/demos/fine-tune-playground",
  "/demos/llm-observability",
  "/demos/n8n-supply-chain",
  "/demos/outbound-workflow",
  "/demos/prompt-scanner",
  "/demos/rag-vertragsassistent",
  "/demos/rechnung-zu-sap",
  "/demos/roi-rechner",
  "/demos/word",
  "/einstieg",
  "/eu-ai-act-kurs",
  "/hilfe",
  "/impressum",
  "/ki-fuehrerschein",
  "/ki-check",
  "/ki-und-gesellschaft",
  "/kurse",
  "/kurse/open-source/ai-native-operator",
  "/kurse/open-source/data-engineering-fundamentals",
  "/kurse/open-source/data-science",
  "/kurse/open-source/data-infrastructure",
  "/neuigkeiten",
  "/open-source",
  "/open-source/lizenzrichtlinie",
  "/open-source/tools/cv-engine",
  "/ueber-mich",
  "/workshops",
  "/workshops/ki-im-unternehmen-sicher-nutzen",
  // A workshop with a kit block adds its kit page here (workshops-kit.test.ts keeps this list in step).
  "/workshops/ki-im-unternehmen-sicher-nutzen/kit",
  "/workshops/datenbereitschaft-fuer-ki",
  "/workshops/esg-berichte-mit-ki",
  // A workshop with a kit block adds its kit page here (workshops-kit.test.ts keeps this list in step).
  "/workshops/esg-berichte-mit-ki/kit",
  "/workshops/geschaeftsberichte-mit-ki-lesen",
  "/workshops/ki-prognosen-einschaetzen",
]);

export function contentLocalesForPath(pathname: string): readonly Locale[] {
  return ENGLISH_CONTENT_PARITY_PATHS.has(pathname)
    ? (["de", "en"] as const)
    : (["de"] as const);
}

export function hasEnglishContentParity(pathname: string): boolean {
  return contentLocalesForPath(pathname).includes("en");
}

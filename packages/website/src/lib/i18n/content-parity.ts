import type { Locale } from "./locale";

// Only reviewed public routes belong here. Protected course-reader routes stay
// out of this SEO registry even when their locale-specific content is complete.
const ENGLISH_CONTENT_PARITY_PATHS = new Set<string>([
  "/",
  "/ai-native",
  "/ai-native/capstone-gallery",
  "/ai-native/demos",
  "/ai-native/fluency-test",
  "/ai-native/glossar",
  "/ai-native/verifizierung",
  "/blog",
  "/blog/eu-ai-act-grundlagen",
  "/buecher",
  "/buecher/ki-landschaft",
  "/buecher/ki-landschaft/01_eisberg",
  "/buecher/ki-landschaft/02_methodik",
  "/buecher/ki-landschaft/03_reifegrad_ueberblick",
  "/buecher/ki-landschaft/04_bundesland",
  "/buecher/ki-landschaft/05_branchen",
  "/buecher/ki-landschaft/06_eu_ki_verordnung",
  "/buecher/ki-landschaft/07_schnellstart",
  "/buecher/ki-landschaft/08_fahrplan",
  "/buecher/ki-landschaft/09_ausblick",
  "/buecher/ki-landschaft/10_anhang",
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
  "/kurse/open-source/claude",
  "/kurse/open-source/codex",
  "/kurse/open-source/data-engineering-fundamentals",
  "/kurse/open-source/data-science",
  "/kurse/open-source/data-infrastructure",
  "/neuigkeiten",
  "/open-source",
  "/open-source/lizenzrichtlinie",
  "/open-source/tools/cv-engine",
  "/ueber-mich",
  "/workshops",
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

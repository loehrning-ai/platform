/**
 * Demos catalog: one practice demo per workshop, the single source of truth
 * for /demos, /demos/<slug>, the share card, the sitemap and the machine
 * surfaces.
 *
 * A demo's slug is exactly its workshop's slug. The demo page renders the
 * band (title, question, synthetic-data line) from this registry and mounts
 * the demo component from src/components/demos/<slug>/index.tsx; each demo has
 * its own route folder src/app/demos/<slug>/ that imports only that component.
 * Logic, data and
 * tests of a demo live in src/lib/demo-cases/<slug>/.
 *
 * German copy sits on the entry itself; `en` carries the English overlay.
 * Read localized entries through `getDemosForLocale` / `getDemoForLocale`.
 */

import type { CourseSlug } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n/locale";
import type { MotifId, PlakatKey } from "@/lib/plakat/palettes";
import type { WorkshopNumber } from "@/lib/workshops";

export const DEMO_SLUGS = [
  "ki-prognosen-einschaetzen",
  "geschaeftsberichte-mit-ki-lesen",
  "datenbereitschaft-fuer-ki",
  "esg-berichte-mit-ki",
  "ki-im-unternehmen-sicher-nutzen",
] as const;

export type DemoSlug = (typeof DEMO_SLUGS)[number];

export type DemoEvidenceMode = "synthetic" | "rule_based" | "live_api" | "recorded_trace";
export type DemoExternalActionMode = "none" | "simulated" | "review_gated" | "real_disabled";

/** The words a demo shows in one locale. */
export interface DemoCopy {
  /** The poster title, as the spec names the demo. */
  readonly title: string;
  /** One or two short sentences for the hub, the meta description and the share card. */
  readonly oneLiner: string;
  /** The one question the demo answers, printed at the top. */
  readonly question: string;
  /** The one honest line about the data, shown once under the band. */
  readonly syntheticDataLabel: string;
}

export interface Demo extends DemoCopy {
  /** Stable id for machine surfaces; equals the slug. */
  readonly id: DemoSlug;
  readonly slug: DemoSlug;
  /** The workshop this demo belongs to; always equal to `slug`. */
  readonly workshopSlug: DemoSlug;
  readonly workshopNumber: WorkshopNumber;
  /** The workshop's poster palette and motif (workshopPlakat(slug)). */
  readonly plakat: PlakatKey;
  readonly motif: MotifId;
  /** About how long one run takes, in minutes. */
  readonly minutes: number;
  /** Every demo runs on invented data. */
  readonly illustrative: true;
  readonly evidenceMode: DemoEvidenceMode;
  readonly externalActionMode: DemoExternalActionMode;
  /** The course the workshop practises for (the learning graph's mapping). */
  readonly courseSlug: CourseSlug;
  /** ISO date the registry copy was last reviewed. */
  readonly lastReviewed: string;
  readonly en: DemoCopy;
}

/** A demo with its copy resolved for one locale. */
export type LocalizedDemo = Omit<Demo, "en"> & { readonly locale: Locale };

export const demos: readonly Demo[] = [
  {
    id: "ki-prognosen-einschaetzen",
    slug: "ki-prognosen-einschaetzen",
    workshopSlug: "ki-prognosen-einschaetzen",
    workshopNumber: "01",
    plakat: "lemons",
    motif: "fan",
    minutes: 10,
    illustrative: true,
    evidenceMode: "rule_based",
    externalActionMode: "none",
    courseSlug: "data-science",
    lastReviewed: "2026-10-20",
    title: "1.050 Stück, sieben Morgen",
    oneLiner:
      "Angemeldet 1.370, geschätzt 1.180, geliefert 1.050. Du legst die Regel fest und führst eine Woche lang die Freigabe.",
    question: "Wann darf der Plan allein raus?",
    syntheticDataLabel: "Übungsfall aus Workshop 01, alle Zahlen erfunden.",
    en: {
      title: "1,050 units, seven mornings",
      oneLiner:
        "Asked 1,370, estimated 1,180, delivered 1,050. You set the rule and run the release for a week.",
      question: "When may the plan ship on its own?",
      syntheticDataLabel: "Practice case from Workshop 01, all figures invented.",
    },
  },
  {
    id: "geschaeftsberichte-mit-ki-lesen",
    slug: "geschaeftsberichte-mit-ki-lesen",
    workshopSlug: "geschaeftsberichte-mit-ki-lesen",
    workshopNumber: "02",
    plakat: "idea",
    motif: "pie",
    minutes: 10,
    illustrative: true,
    evidenceMode: "rule_based",
    externalActionMode: "none",
    courseSlug: "ai-native",
    lastReviewed: "2026-10-20",
    title: "Die Zahl, die trägt",
    oneLiner: "Entscheide über CRAFT, so wie ein Bericht gelesen werden sollte.",
    question:
      "Soll NORTHWIND die Produktlinie CRAFT nacharbeiten oder mehr Q3-Marketingbudget dahinterstellen?",
    syntheticDataLabel:
      "NORTHWIND ist erfunden. Alle Zahlen stammen aus dem Workshop-Kit und werden im Browser nachgerechnet. Keine KI, nichts wird gesendet.",
    en: {
      title: "The number that holds",
      oneLiner: "Decide on CRAFT the way a report should be read.",
      question:
        "Should NORTHWIND rework the CRAFT product line or put more Q3 marketing budget behind it?",
      syntheticDataLabel:
        "NORTHWIND is invented. Every figure comes from the workshop kit and is recalculated in your browser. No AI, nothing is sent.",
    },
  },
  {
    id: "datenbereitschaft-fuer-ki",
    slug: "datenbereitschaft-fuer-ki",
    workshopSlug: "datenbereitschaft-fuer-ki",
    workshopNumber: "03",
    plakat: "bloom",
    motif: "dome",
    minutes: 15,
    illustrative: true,
    evidenceMode: "rule_based",
    externalActionMode: "none",
    courseSlug: "data-engineering-fundamentals",
    lastReviewed: "2026-10-20",
    title: "Mach die Zahl richtig.",
    oneLiner:
      "Fünf Anfragen, wie sie an eine KI gestellt werden. Du legst fest, was die Zahl bedeutet, und siehst sofort, welche Zahl daraus wird.",
    question: "Was genau soll die Zahl bedeuten?",
    syntheticDataLabel:
      "Erfundene Firmen, erfundene Daten. Hier rechnet keine KI: Die Seite wendet deine Festlegungen auf die Daten des Workshop-Kits an.",
    en: {
      title: "Make the number right.",
      oneLiner:
        "Five requests, the way people put them to an AI. You decide what the number means and see at once which number it gives.",
      question: "What exactly should the number mean?",
      syntheticDataLabel:
        "Invented companies, invented data. No AI runs here: the page applies your choices to the workshop kit's data.",
    },
  },
  {
    id: "esg-berichte-mit-ki",
    slug: "esg-berichte-mit-ki",
    workshopSlug: "esg-berichte-mit-ki",
    workshopNumber: "04",
    plakat: "autumn",
    motif: "leaves",
    minutes: 10,
    illustrative: true,
    evidenceMode: "rule_based",
    externalActionMode: "none",
    courseSlug: "ai-native",
    lastReviewed: "2026-10-20",
    title: "Zehn Fakten, 14 Antworten",
    oneLiner:
      "Du prüfst die Akte einer erfundenen Kellerei: zehn Fakten, die 14 Antworten an Importeur und Bank tragen.",
    question: "Welche Antworten an Importeur und Bank belegen deine Dateien wirklich?",
    syntheticDataLabel:
      "Erfundene Kellerei, Dateien aus dem Workshop-Kit. Keine KI läuft hier: Feste Regeln prüfen deine Antworten.",
    en: {
      title: "Ten facts, 14 answers",
      oneLiner:
        "You check the file of an invented winery: ten facts that carry 14 answers to the importer and the bank.",
      question: "Which answers to the importer and the bank do your files actually prove?",
      syntheticDataLabel:
        "Invented winery, files from the workshop kit. No AI runs here: fixed rules check your answers.",
    },
  },
  {
    id: "ki-im-unternehmen-sicher-nutzen",
    slug: "ki-im-unternehmen-sicher-nutzen",
    workshopSlug: "ki-im-unternehmen-sicher-nutzen",
    workshopNumber: "05",
    plakat: "sage",
    motif: "ledger",
    minutes: 12,
    illustrative: true,
    evidenceMode: "rule_based",
    externalActionMode: "none",
    courseSlug: "ai-native",
    lastReviewed: "2026-10-20",
    title: "Darf das in diesen Chat?",
    oneLiner:
      "Acht Einfügungen bei Vardar Works, einer erfundenen Firma. Du gibst jeder eine Ampel und siehst, wohin sie geht.",
    question: "Darf das in diesen Chat?",
    syntheticDataLabel:
      "Vardar Works und alle Personen und Einfügungen sind erfunden. Die Ampel ist die Regel aus dem Workshop, kein Gesetz. Keine Rechtsberatung.",
    en: {
      title: "Can this go into the chat?",
      oneLiner:
        "Eight pastes at Vardar Works, an invented firm. You give each a light and see where it goes.",
      question: "Can this go into the chat?",
      syntheticDataLabel:
        "Vardar Works and every person and paste are invented. The light is the workshop's rule, not a law. Not legal advice.",
    },
  },
];

export function isDemoSlug(slug: string): slug is DemoSlug {
  return (DEMO_SLUGS as readonly string[]).includes(slug);
}

export function getDemoBySlug(slug: string): Demo | undefined {
  return demos.find((demo) => demo.slug === slug);
}

function localize(demo: Demo, locale: Locale): LocalizedDemo {
  const { en, ...base } = demo;
  return locale === "en" ? { ...base, ...en, locale } : { ...base, locale };
}

/** All demos in workshop order, with copy in the given locale. */
export function getDemosForLocale(locale: Locale): readonly LocalizedDemo[] {
  return demos.map((demo) => localize(demo, locale));
}

export function getDemoForLocale(
  slug: string,
  locale: Locale,
): LocalizedDemo | undefined {
  const demo = getDemoBySlug(slug);
  return demo ? localize(demo, locale) : undefined;
}

/** The demo of a workshop, or undefined for a workshop without one. */
export function demoForWorkshop(workshopSlug: string): Demo | undefined {
  return demos.find((demo) => demo.workshopSlug === workshopSlug);
}

/**
 * The line a surface prints under the title: the question, or the one-liner
 * where the question is the title itself (Workshop 05), so a band or a row
 * never says the same sentence twice.
 */
export function demoLede(demo: Pick<DemoCopy, "title" | "question" | "oneLiner">): string {
  return demo.question === demo.title ? demo.oneLiner : demo.question;
}

/**
 * Demos bound to a course, in workshop order. Empty for courses no workshop
 * practises for; callers render nothing then.
 */
export function demosForCourse(courseSlug: CourseSlug): readonly Demo[] {
  return demos.filter((demo) => demo.courseSlug === courseSlug);
}

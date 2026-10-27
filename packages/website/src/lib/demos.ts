/**
 * Demos catalog: one hands-on demo per workshop, the single source of truth
 * for /demos, /demos/<slug>, the share card, the sitemap and the machine
 * surfaces.
 *
 * A demo's slug is exactly its workshop's slug. The demo page renders the
 * band (name, question), the promise and the synthetic-data line from this
 * registry and mounts the demo component from
 * src/components/demos/<slug>/index.tsx; each demo has its own route folder
 * src/app/demos/<slug>/ that imports only that component. Pure logic, data
 * and the two-language copy pack of a demo live in src/lib/demo-cases/<slug>/;
 * its hub miniature is src/components/demos/<slug>/tile.tsx (the folder
 * contract is checked by src/components/demos/demo-contract.test.ts).
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
  "audit-vorbereitung-mit-ki",
  "angebote-mit-ki-vergleichen",
] as const;

export type DemoSlug = (typeof DEMO_SLUGS)[number];

export type DemoEvidenceMode = "synthetic" | "rule_based" | "live_api" | "recorded_trace";
export type DemoExternalActionMode = "none" | "simulated" | "review_gated" | "real_disabled";

/** The words a demo shows in one locale. */
export interface DemoCopy {
  /** The demo's name. */
  readonly title: string;
  /** The promise, one or two sentences: the meta description and the share card. */
  readonly oneLiner: string;
  /** The one question the demo answers, printed at the top. */
  readonly question: string;
  /** The one honest line about the data, shown once under the band. */
  readonly syntheticDataLabel: string;
  /**
   * The hub's job line, the biggest text on the tile: verb first, about the
   * visitor, at most 56 characters ("Prüf, ob dein Jahreswert zwölf Monate hat.").
   */
  readonly job: string;
  /** The hub tile: the surprise in one sentence, and what the visitor leaves with. */
  readonly tile: {
    readonly hook: string;
    readonly take: string;
    /** Replaces the hub's label before the take line; "" drops the label. */
    readonly takeLabel?: string;
  };
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
  /** About how long one run takes, in minutes (the detail page, not the hub). */
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
    minutes: 4,
    illustrative: true,
    evidenceMode: "rule_based",
    externalActionMode: "none",
    courseSlug: "data-science",
    lastReviewed: "2026-10-25",
    title: "Die Fehlerliste",
    oneLiner:
      "Prüf die Prognose deines Tools an ihren alten Fehlern: Messlatte, Spanne, Planzahl, Regel.",
    question:
      "Darf die Prognose deines Tools ohne Freigabe in die Planung, und welche Menge planst du?",
    syntheticDataLabel:
      "Erfundene Firma, erfundene Zahlen. Gerechnet in deinem Browser, ohne KI. Nichts wird gesendet.",
    job: "Prüf die Prognose deines Tools an ihren alten Fehlern.",
    tile: {
      hook: "Linsensuppe 2025: Die Prognose liegt 21 % näher als „wie letzte Woche“. Die Prüfregel hält sie trotzdem 15 Wochen an.",
      take: "Prüfregel + Claude-Skill",
    },
    en: {
      title: "The Error List",
      oneLiner:
        "Check your tool's forecast against its own past errors: baseline, range, planning number, rule.",
      question:
        "May your tool's forecast go into planning without sign-off, and what quantity do you plan?",
      syntheticDataLabel:
        "Invented company, invented numbers. Worked out in your browser, no AI. Nothing is sent.",
      job: "Check your tool's forecast against its past errors.",
      tile: {
        hook: "Lentil soup 2025: the forecast misses 21 % less than \"same as last week\". The release rule still stops it for 15 weeks.",
        take: "Release rule + Claude skill",
      },
    },
  },
  {
    id: "geschaeftsberichte-mit-ki-lesen",
    slug: "geschaeftsberichte-mit-ki-lesen",
    workshopSlug: "geschaeftsberichte-mit-ki-lesen",
    workshopNumber: "02",
    plakat: "idea",
    motif: "pie",
    minutes: 4,
    illustrative: true,
    evidenceMode: "rule_based",
    externalActionMode: "none",
    courseSlug: "ai-native",
    lastReviewed: "2026-10-25",
    title: "Eine Datei, drei Antworten",
    oneLiner:
      "Eine Datei aus dem Workshop-Kit, eine Frage, drei richtig gerechnete Antworten. Danach legst du eine eigene Kennzahl fest und nimmst einen Skill für Claude mit. Alles im Browser.",
    question: "Ist die Qualität von CRAFT im September besser geworden?",
    syntheticDataLabel:
      "NORTHWIND ist erfunden, die Zahlen stammen aus dem Workshop-Kit und werden in deinem Browser gerechnet. Keine KI, nichts wird gesendet.",
    job: "Leg fest, was deine Kennzahl zählt.",
    tile: {
      hook: "Dieselbe CSV sagt besser, gleich und schlechter. Je nachdem, was man zählt.",
      take: "Kennzahlen-Steckbrief als Skill",
    },
    en: {
      title: "One file, three answers",
      oneLiner:
        "One file from the workshop kit, one question, three correctly computed answers. Then you pin down one of your own metrics and take a Claude skill home. All in your browser.",
      question: "Did CRAFT's quality get better in September?",
      syntheticDataLabel:
        "NORTHWIND is invented, the figures come from the workshop kit and are worked out in your browser. No AI, nothing is sent.",
      job: "Pin down what your metric counts.",
      tile: {
        hook: "The same CSV says better, same and worse. It depends on what you count.",
        take: "metric cards as a skill",
      },
    },
  },
  {
    id: "datenbereitschaft-fuer-ki",
    slug: "datenbereitschaft-fuer-ki",
    workshopSlug: "datenbereitschaft-fuer-ki",
    workshopNumber: "03",
    plakat: "bloom",
    motif: "dome",
    minutes: 4,
    illustrative: true,
    evidenceMode: "rule_based",
    externalActionMode: "none",
    courseSlug: "data-engineering-fundamentals",
    lastReviewed: "2026-10-25",
    title: "Die Fragekarte",
    oneLiner:
      "Eine richtige Datei, eine falsche Tabelle: Fünf Kästchen fangen den Fehler, bevor die Zahl weitergeht. Am Ende füllst du deine eigene Karte.",
    question: "Zeig Ending MRR je Monat für das letzte abgeschlossene Quartal. Stichtag: 1. Juli 2026.",
    syntheticDataLabel:
      "FOLDLINE ist erfunden, die Zahlen stammen aus dem Workshop-Kit und werden in deinem Browser gerechnet. Claudes Antwort ist aus einem Probelauf beim Bau des Kurses aufgezeichnet. Keine KI läuft hier, nichts wird gesendet.",
    job: "Füll fünf Kästchen, bevor eine KI-Zahl weitergeht.",
    tile: {
      hook: "Die Datei stimmt, Claudes Tabelle nicht: 75.890 statt 334.675.",
      take: "Fünf Kästchen und die Dateien für deinen Claude.",
      takeLabel: "",
    },
    en: {
      title: "The question card",
      oneLiner:
        "One correct file, one wrong table: five boxes catch the mistake before the number goes out. At the end you fill in your own card.",
      question: "Show ending MRR by month for the last complete quarter. Clock: 1 July 2026.",
      syntheticDataLabel:
        "FOLDLINE is invented, the numbers come from the workshop kit and are worked out in your browser. Claude's answer was recorded in a rehearsal while building the course. No AI runs here, nothing is sent.",
      job: "Fill five boxes before an AI number goes out.",
      tile: {
        hook: "The file is right, Claude's table is not: 75,890, not 334,675.",
        take: "Five boxes and three files for your Claude.",
        takeLabel: "",
      },
    },
  },
  {
    id: "esg-berichte-mit-ki",
    slug: "esg-berichte-mit-ki",
    workshopSlug: "esg-berichte-mit-ki",
    workshopNumber: "04",
    plakat: "autumn",
    motif: "leaves",
    minutes: 6,
    illustrative: true,
    evidenceMode: "rule_based",
    externalActionMode: "none",
    courseSlug: "ai-native",
    lastReviewed: "2026-10-25",
    title: "Nachweisprobe",
    oneLiner:
      "Vier Sätze, vier Dateien, vier Prüfungen. Dann derselbe Ordner für drei Anfragen, eine nachgereichte Rechnung und deine eigenen Sätze.",
    question: "Deckt die Datei den Satz?",
    syntheticDataLabel:
      "Erfundenes Weingut, Dateien aus dem Workshop-Kit, Zeile für Zeile. Gerechnet in deinem Browser, ohne KI, nichts wird gesendet.",
    job: "Leg jede ESG-Antwort neben ihre Datei.",
    tile: {
      hook: "12 von 40 ha, abgelaufen am 31.08.2026. Das Zertifikat liegt bei.",
      take: "Nachweisprobe, Claude-Skill und Nachweisregister für deinen Ordner",
    },
    en: {
      title: "Evidence test",
      oneLiner:
        "Four sentences, four files, four checks. Then the same folder for three requests, one late invoice and your own sentences.",
      question: "Does the file cover the sentence?",
      syntheticDataLabel:
        "Invented winery, files from the workshop kit, line by line. Worked out in your browser, without AI, nothing is sent.",
      job: "Put every ESG answer next to its file.",
      tile: {
        hook: "12 of 40 ha, expired 31.08.2026. The certificate is attached.",
        take: "evidence check, Claude skill and evidence register for your folder",
      },
    },
  },
  {
    id: "audit-vorbereitung-mit-ki",
    slug: "audit-vorbereitung-mit-ki",
    workshopSlug: "audit-vorbereitung-mit-ki",
    workshopNumber: "05",
    plakat: "sage",
    motif: "ledger",
    minutes: 4,
    illustrative: true,
    evidenceMode: "rule_based",
    externalActionMode: "none",
    courseSlug: "ai-native",
    lastReviewed: "2026-10-25",
    title: "Die Lückenliste",
    oneLiner:
      "Acht Anforderungen, elf Dateien. Prüf, welche Datei wirklich etwas belegt, prüf Claudes Zitate gegen die Dateien und nimm einen Skill für deine eigenen Audits mit. Alles läuft in diesem Tab.",
    question: "Welche Dateien im Ordner sind ein Nachweis?",
    syntheticDataLabel:
      "Erfundener Fall aus Workshop 05: Vardar Works, Tannwald Haustechnik und alle Personen sind erfunden; zwei Zeilen stammen von Anthropics öffentlicher Datenschutzseite. Gerechnet in deinem Browser, keine KI, nichts wird gesendet.",
    job: "Prüf, welche Datei im Ordner wirklich etwas belegt.",
    tile: {
      hook: "11 Dateien, 8 Anforderungen, 2 belegt.",
      take: "eine Nachweisliste und ein Skill, der ohne Zitat nichts zählt",
    },
    en: {
      title: "The gap list",
      oneLiner:
        "Eight requests, eleven files. Test which file actually proves something, check Claude's quotes against the files, and take a skill home for your own audits. Everything runs in this tab.",
      question: "Which files in the folder are evidence?",
      syntheticDataLabel:
        "Invented case from Workshop 05: Vardar Works, Tannwald Haustechnik and every person are invented; two lines come from Anthropic's public privacy page. Worked out in your browser, no AI, nothing is sent.",
      job: "Test which file in the folder actually proves something.",
      tile: {
        hook: "11 files, 8 requests, 2 covered.",
        take: "an evidence index and a skill that counts nothing without a quote",
      },
    },
  },
  {
    id: "angebote-mit-ki-vergleichen",
    slug: "angebote-mit-ki-vergleichen",
    workshopSlug: "angebote-mit-ki-vergleichen",
    workshopNumber: "06",
    plakat: "kraft",
    motif: "converge",
    minutes: 8,
    illustrative: true,
    evidenceMode: "rule_based",
    externalActionMode: "none",
    courseSlug: "ai-native",
    lastReviewed: "2026-10-27",
    title: "Die Vergleichsbasis",
    oneLiner:
      "Drei Angebote, eine Basis: gleiche Menge, je Stück, bis ins Werk, mit Einmalkosten und Skonto. Schätz zuerst, dann siehst du, welche Zeile entscheidet.",
    question: "Welches Angebot ist günstiger?",
    syntheticDataLabel:
      "Firma, Lieferanten und Zahlen sind erfunden, und jede Zahl steht im Kit. Auf dieser Seite läuft keine KI; die Claude-Antwort ist eine Aufzeichnung.",
    job: "Bring drei Angebote auf eine Basis.",
    tile: {
      hook: "Der billigste Stückpreis ist das teuerste Angebot.",
      take: "eine Vergleichsbasis und ein Skill, der keine fehlende Zeile als 0 zählt",
    },
    en: {
      title: "The comparison basis",
      oneLiner:
        "Three offers, one basis: same quantity, per unit, delivered, with one-off costs and discount. Guess first, then see which line decides.",
      question: "Which offer costs less?",
      syntheticDataLabel:
        "The company, the suppliers and the numbers are invented, and every number is in the kit. No AI runs on this page; the Claude answer is a recording.",
      job: "Bring three offers onto one basis.",
      tile: {
        hook: "The lowest unit price is the most expensive offer.",
        take: "a comparison basis and a skill that never counts a missing line as 0",
      },
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

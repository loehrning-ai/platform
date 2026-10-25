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
  "ki-im-unternehmen-sicher-nutzen",
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
  /**
   * "v3": the demo runs on the v3 shell (src/components/demos/shell), its route
   * passes beats, and the v3 contract test applies. Opt-in while the five
   * demos migrate; the integrator removes the flag once all five are on v3.
   */
  readonly shell?: "v3";
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
    lastReviewed: "2026-10-23",
    title: "Hundert Startwochen",
    oneLiner:
      "Zieh dein Lager durch hundert mögliche Startwochen und sieh, in wie vielen es nicht reicht.",
    question: "Kann KI die Zukunft vorhersagen?",
    syntheticDataLabel:
      "Erfundener Fall aus Workshop 01, gerechnet in deinem Browser. Keine KI, nichts wird gesendet.",
    job: "Sieh, in wie vielen Wochen dein Lager nicht reicht.",
    tile: {
      hook: "Lager 1.050, erwartet 1.180. In 76 von 100 Startwochen reicht es nicht.",
      take: "ein Satz für deine Mail",
    },
    en: {
      title: "A Hundred Launch Weeks",
      oneLiner:
        "Drag your stock through a hundred possible launch weeks and see in how many it falls short.",
      question: "Can AI predict the future?",
      syntheticDataLabel:
        "Invented case from Workshop 01, worked out in your browser. No AI, nothing is sent.",
      job: "See in how many weeks your stock falls short.",
      tile: {
        hook: "Stock 1,050, expected 1,180. In 76 of 100 launch weeks it falls short.",
        take: "a sentence for your email",
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
    lastReviewed: "2026-10-23",
    title: "Monatsgrenze",
    oneLiner:
      "Schieb die Linie um eine Woche. Aus +26 % wird −20 %. Dann rechne mit deinen Zahlen.",
    question: "Stimmt das?",
    syntheticDataLabel:
      "NORTHWIND ist erfunden, die Zahlen stammen aus dem Workshop-Kit und werden in deinem Browser gerechnet. Keine KI, nichts wird gesendet.",
    job: "Prüf, ob dein Wachstum an der Monatsgrenze hängt.",
    tile: {
      hook: "Dieselben neun Wochen: +26 %, −20 % oder +105 %.",
      take: "Regeln für deine Berichte",
    },
    en: {
      title: "The Month Line",
      oneLiner:
        "Move the line by one week. +26 % becomes −20 %. Then run your own numbers.",
      question: "Is that right?",
      syntheticDataLabel:
        "NORTHWIND is invented, the figures come from the workshop kit and are worked out in your browser. No AI, nothing is sent.",
      job: "Check if your growth hangs on where a month ends.",
      tile: {
        hook: "The same nine weeks: +26 %, −20 % or +105 %.",
        take: "rules for your reports",
      },
    },
  },
  {
    id: "datenbereitschaft-fuer-ki",
    shell: "v3",
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
      take: "Fünf Kästchen und drei Dateien für dein Claude.",
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
    minutes: 4,
    illustrative: true,
    evidenceMode: "rule_based",
    externalActionMode: "none",
    courseSlug: "ai-native",
    lastReviewed: "2026-10-23",
    title: "Elf von zwölf",
    oneLiner:
      "Im Entwurf steht „Gesamtjahr“. Im Ordner liegen elf Rechnungen. Rate den zwölften Monat, sieh, wie weit du daneben liegst, und nimm eine Zeile mit, die nie wieder „ganzes Jahr“ behauptet.",
    question: "Ist das ein Jahreswert?",
    syntheticDataLabel:
      "Erfundene Kellerei, Dateien aus dem Workshop-Kit, gerechnet in deinem Browser. Keine KI, nichts wird gesendet.",
    job: "Prüf, ob dein Jahreswert zwölf Monate hat.",
    tile: {
      hook: "279,7 MWh stehen als Jahreswert da. Rate den fehlenden Monat.",
      take: "eine Zeile, die nie wieder „Gesamtjahr“ sagt",
    },
    en: {
      title: "Eleven of twelve",
      oneLiner:
        "The draft says “full year”. The folder holds eleven bills. Guess the twelfth month, see how far off you are, and take away a line that never claims “full year” again.",
      question: "Is this a full-year figure?",
      syntheticDataLabel:
        "Invented winery, files from the workshop kit, worked out in your browser. No AI, nothing is sent.",
      job: "Check that your annual figure has twelve months.",
      tile: {
        hook: "279.7 MWh sits there as the annual figure. Guess the missing month.",
        take: "a line that never says “full year” again",
      },
    },
  },
  {
    id: "ki-im-unternehmen-sicher-nutzen",
    slug: "ki-im-unternehmen-sicher-nutzen",
    workshopSlug: "ki-im-unternehmen-sicher-nutzen",
    workshopNumber: "05",
    plakat: "sage",
    motif: "ledger",
    minutes: 4,
    illustrative: true,
    evidenceMode: "rule_based",
    externalActionMode: "none",
    courseSlug: "ai-native",
    lastReviewed: "2026-10-23",
    title: "Was fliegt mit?",
    oneLiner:
      "Füge deinen Text ein, bevor du ihn in einen KI-Chat gibst. Du siehst, was mitfliegen würde, schwärzt es mit einem Zug und nimmst einen sauberen Prompt mit. Läuft nur auf deinem Gerät, auch im Flugmodus.",
    question: "Was fliegt mit, wenn du das einfügst?",
    syntheticDataLabel:
      "Alle Beispiele und Personen sind erfunden. Die Ampel ist die Regel aus dem Workshop, kein Gesetz. Keine Rechtsberatung. Dein Text bleibt auf deinem Gerät.",
    job: "Schwärz deinen Text, bevor er in den Chat geht.",
    tile: {
      hook: "Füge deinen Text ein und sieh, was mitfliegen würde.",
      take: "ein sauberer Prompt",
    },
    en: {
      title: "What goes along?",
      oneLiner:
        "Put your text here before you put it in an AI chat. See what would go along, black it out with one drag, take a clean prompt away. Runs only on your device, even in airplane mode.",
      question: "What goes along when you paste this?",
      syntheticDataLabel:
        "All examples and people are invented. The light is the workshop's rule, not a law. Not legal advice. Your text stays on your device.",
      job: "Black out your text before it goes into a chat.",
      tile: {
        hook: "Paste your text and see what would go along.",
        take: "a clean prompt",
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

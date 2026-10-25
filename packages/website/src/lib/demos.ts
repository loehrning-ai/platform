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
    lastReviewed: "2026-10-23",
    title: "Stufe oder Treppe?",
    oneLiner: "Zieh den Hebel: aus −19.960 € wird 334.675 €, und kein Datensatz ändert sich.",
    question: "Warum ist April negativ?",
    syntheticDataLabel:
      "Erfundene Firma, Daten aus dem Workshop-Kit, gerechnet in deinem Browser. Keine KI, nichts wird gesendet.",
    job: "Lies dieselben Zahlen als Stufe und als Treppe.",
    tile: {
      hook: "Aus −19.960 € werden 334.675 €, ohne dass sich ein Datensatz ändert.",
      take: "Zieh den Hebel: dieselben Zahlen, zwei Lesarten.",
      takeLabel: "",
    },
    en: {
      title: "Step or staircase?",
      oneLiner: "Pull the lever: −€19,960 becomes €334,675, and not one record changes.",
      question: "Why is April negative?",
      syntheticDataLabel:
        "Invented company, data from the workshop kit, worked out in your browser. No AI, nothing is sent.",
      job: "Read the same numbers as a step and a staircase.",
      tile: {
        hook: "−€19,960 becomes €334,675, without one record changing.",
        take: "Pull the lever: the same numbers, two readings.",
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
    shell: "v3",
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
    title: "Nachweisprüfung",
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
      title: "Evidence check",
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

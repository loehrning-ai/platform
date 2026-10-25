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
    shell: "v3",
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
    shell: "v3",
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

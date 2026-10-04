import type { Locale } from "@/lib/i18n/locale";

export const HOME_COPY = {
  de: {
    metadata: {
      title: "KI-Kurse, Workshops und offene Lernmaterialien",
      description:
        "Kostenfreie KI-Kurse auf Deutsch und Englisch, dazu Workshops, Bücher, Demos und Open-Source-Werkzeuge, mit Quellen und klaren Zugangsregeln.",
    },
    hero: {
      headline: ["KI", "verstehen.", "Sicher anwenden."],
      // The introduction card: one sentence on phones (lead + "."), from lg
      // lead + detail + "." followed by the facts.
      introduction: {
        lead: "Freie Kurse, Praxisbeispiele und Workshops zu KI",
        detail: " mit Übungen und Quellen",
        facts: "Frei, zweisprachig und quelloffen.",
      },
      primaryCta: "Lernroute wählen",
      globeToggle: "Globus anhalten",
      pillars: [
        {
          title: "Lernen",
          body: "Antworte zuerst, dann siehst du die Lösung.",
          href: "/kurse",
        },
        {
          title: "Prüfen",
          body: "Ändere eine Variable und vergleiche.",
          href: "/demos",
        },
        {
          title: "Anwenden",
          body: "Übertrag die Regel auf einen neuen Fall.",
          href: "/workshops",
        },
      ],
    },
    offering: {
      headline: "Vier Kurse in fester Reihenfolge",
      // Section caption, from lg: facts only, never a restated heading.
      routeSignal: (lessons: number) => `${lessons} Lektionen`,
      routeLabel: "Empfohlener Grundlagenpfad",
      lessonLabel: "Lektionen",
      deeperSummary: (count: number) =>
        `Dazu ${count} Kurse zum visuellen Lernen über Daten und KI-Betrieb.`,
      viewAllCourses: "Alle Kurse ansehen",
    },
    workflow: {
      headline: "Material zum Nachlesen und Ausprobieren",
      // Section caption, from lg: facts only.
      boardLabel: (areas: number) => `${areas} Bereiche · ohne Konto`,
      boardAriaLabel: "Werkzeuge und Lernressourcen",
      resources: [
        {
          label: "Blog",
          // One line at 320px, never truncated; the same line at every width.
          short: "KI und Recht, mit Quellen",
          href: "/blog",
        },
        {
          label: "Lernbücher",
          // One line at 320px, never truncated; the same line at every width.
          short: "Kapitel mit Quellen",
          href: "/buecher",
        },
        {
          label: "Praxisbeispiele",
          // One line at 320px, never truncated; the same line at every width.
          short: "Abläufe zum Ausprobieren",
          href: "/demos",
        },
        {
          label: "Workshops",
          // One line at 320px, never truncated; the same line at every width.
          short: "Fälle für Teams",
          href: "/workshops",
        },
        {
          label: "Open Source",
          // One line at 320px, never truncated; the same line at every width.
          short: "Code, Version, Lizenz",
          href: "/open-source",
        },
      ],
      accountBody:
        "Ein kostenloses Konto synchronisiert Fortschritt und Arbeitsbelege geräteübergreifend.",
      accountCta: "Zum Konto",
    },
    companion: {
      resumeEyebrow: "Weiter bei",
      startEyebrow: "Erster Schritt",
      access: {
        open: "Ohne Lernkonto",
        "account-required": "Lernkonto nötig",
        unavailable: "Hier nicht verfügbar",
      },
      lessonsDone: (done: number, total: number) =>
        `${done} von ${total} Lektionen`,
      demosTitle: "Praxisbeispiele",
      demosRailLabel: "Praxisbeispiele zum Ausprobieren",
      booksTitle: "Lernbücher",
      booksRailLabel: "Lernbücher der Plattform",
      bookMeta: (chapters: number, minutes: number) =>
        `${chapters} Kapitel · ${minutes} Min.`,
    },
    credibility: {
      headline: "Grundregeln",
      principles: [
        {
          title: "Keine Paywall",
          body: "Vier Kurse brauchen ein kostenloses Lernkonto.",
        },
        {
          title: "Zwei vollständige Fassungen",
          body: "Alle Kurse gibt es auf Deutsch und Englisch.",
        },
        {
          title: "Quellen sind verlinkt",
          body: "Fakten verweisen auf Quellen. Annahmen und Simulationen sind markiert.",
        },
        {
          title: "Von Tim Löhr redigiert",
          body: "Überarbeitungsstand und bekannte Grenzen bleiben sichtbar.",
        },
      ],
    },
  },
  en: {
    metadata: {
      title: "AI courses, workshops and open learning materials",
      description:
        "Free AI courses in German and English, plus workshops, books, demos and open-source tools, with sources and clear access rules.",
    },
    hero: {
      headline: ["Understand", "AI.", "Apply it safely."],
      introduction: {
        lead: "Free courses, examples and workshops on AI",
        detail: " with exercises and sources",
        facts: "Free, bilingual and open source.",
      },
      primaryCta: "Choose a learning route",
      globeToggle: "Pause the globe",
      pillars: [
        {
          title: "Learn",
          body: "Answer first, then see the solution.",
          href: "/kurse",
        },
        {
          title: "Check",
          body: "Change one variable and compare.",
          href: "/demos",
        },
        {
          title: "Apply",
          body: "Use the rule on a new case.",
          href: "/workshops",
        },
      ],
    },
    offering: {
      headline: "Four courses in a set order",
      routeSignal: (lessons: number) => `${lessons} lessons`,
      routeLabel: "Recommended foundation path",
      lessonLabel: "lessons",
      deeperSummary: (count: number) =>
        `Plus ${count} visual-learning courses on data and AI operations.`,
      viewAllCourses: "View all courses",
    },
    workflow: {
      headline: "Material to read and try",
      boardLabel: (areas: number) => `${areas} areas · no account needed`,
      boardAriaLabel: "Tools and learning resources",
      resources: [
        {
          label: "Blog",
          // One line at 320px, never truncated; the same line at every width.
          short: "AI and law, with sources",
          href: "/blog",
        },
        {
          label: "Learning books",
          // One line at 320px, never truncated; the same line at every width.
          short: "Chapters with sources",
          href: "/buecher",
        },
        {
          label: "Applied examples",
          // One line at 320px, never truncated; the same line at every width.
          short: "Workflows to try",
          href: "/demos",
        },
        {
          label: "Workshops",
          // One line at 320px, never truncated; the same line at every width.
          short: "Cases for teams",
          href: "/workshops",
        },
        {
          label: "Open Source",
          // One line at 320px, never truncated; the same line at every width.
          short: "Code, version, licence",
          href: "/open-source",
        },
      ],
      accountBody:
        "A free account syncs progress and work artifacts across devices.",
      accountCta: "Go to account",
    },
    companion: {
      resumeEyebrow: "Continue with",
      startEyebrow: "First step",
      access: {
        open: "No account needed",
        "account-required": "Account required",
        unavailable: "Unavailable here",
      },
      lessonsDone: (done: number, total: number) =>
        `${done} of ${total} lessons`,
      demosTitle: "Applied examples",
      demosRailLabel: "Applied examples to try",
      booksTitle: "Learning books",
      booksRailLabel: "Learning books on this platform",
      bookMeta: (chapters: number, minutes: number) =>
        `${chapters} chapters · ${minutes} min`,
    },
    credibility: {
      headline: "Ground rules",
      principles: [
        {
          title: "No paywall",
          body: "Four courses need a free learning account.",
        },
        {
          title: "Two complete editions",
          body: "Every course is available in German and English.",
        },
        {
          title: "Sources are linked",
          body: "Facts link to sources. Assumptions and simulations are labelled.",
        },
        {
          title: "Edited by Tim Löhr",
          body: "Revision date and known limits stay visible.",
        },
      ],
    },
  },
} as const satisfies Readonly<Record<Locale, object>>;

export interface HomeCourseCopy {
  readonly title: string;
  readonly tagline: string;
  readonly duration: string;
}

export const HOME_COURSE_COPY: Readonly<
  Record<Locale, Readonly<Record<string, HomeCourseCopy>>>
> = {
  de: {
    "ki-fuehrerschein": {
      title: "KI-Führerschein",
      tagline: "Aufgaben abgrenzen, Daten schützen und Antworten prüfen.",
      duration: "ca. 1 Std. 40 Min.",
    },
    "ki-und-gesellschaft": {
      title: "KI und Gesellschaft",
      tagline:
        "Prüfe an Beispielen, was Deepfakes, Bias und KI für die Arbeit bedeuten.",
      duration: "ca. 46 Min.",
    },
    "eu-ai-act-kurs": {
      title: "EU AI Act Kurs",
      tagline: "Ordne deinen Anwendungsfall ein und leite Rolle und Pflichten ab.",
      duration: "ca. 1 Std. 50 Min.",
    },
    "ai-native": {
      title: "AI-Native Arbeitskurs",
      tagline: "Gib der KI Absicht und Kontext, dann prüfe das Ergebnis.",
      // /kurse states "ca. 5 Std. Lektionen, 12 Std. mit Übungen".
      duration: "ca. 5 Std. + Übungen",
    },
  },
  en: {
    "ki-fuehrerschein": {
      title: "Everyday AI Literacy",
      tagline: "Set task boundaries, protect data and verify responses.",
      duration: "about 1 hr 40 min",
    },
    "ki-und-gesellschaft": {
      title: "AI and Society",
      tagline: "Use examples to assess deepfakes, bias and effects on work.",
      duration: "about 46 min",
    },
    "eu-ai-act-kurs": {
      title: "EU AI Act Course",
      tagline: "Classify your use case, then derive your role and duties.",
      duration: "about 1 hr 50 min",
    },
    "ai-native": {
      title: "AI-Native Work Course",
      tagline: "Give the AI intent and context, then check the result.",
      // /kurse states "about 5 hrs of lessons, 12 hrs with exercises".
      duration: "about 5 hr + exercises",
    },
  },
};

export function homeCourseCopy(locale: Locale, slug: string): HomeCourseCopy {
  const copy = HOME_COURSE_COPY[locale][slug];
  if (!copy)
    throw new Error(
      `Homepage course copy is missing for "${slug}" in ${locale}.`,
    );
  return copy;
}

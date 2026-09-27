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
      // One sentence on phones (lead + "."), the full introduction from lg:
      // lead + detail + "." + facts. Below lg the facts sit above the
      // headline as the band's label instead.
      introduction: {
        lead: "Wähle ein Ziel und prüfe deine Entscheidungen an einem Modell",
        detail: " und nimm einen Arbeitsbeleg mit",
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
      routeSignal: (lessons: number) =>
        `${lessons} Lektionen · kostenlos · DE + EN`,
      routeLabel: "Empfohlener Grundlagenpfad",
      lessonLabel: "Lektionen",
      deeperSummary: (count: number) =>
        `Dazu ${count} technische Kurse zu Prompting, Coding-Agenten und Daten.`,
      viewAllCourses: "Alle Kurse ansehen",
    },
    workflow: {
      headline: "Material zum Nachlesen und Ausprobieren",
      // Empty: the rows name each task (see copy-diet requests).
      introduction: "",
      // Section caption, from lg: facts only.
      boardLabel: (areas: number) => `${areas} Bereiche · ohne Konto`,
      boardAriaLabel: "Werkzeuge und Lernressourcen",
      resources: [
        {
          label: "Blog",
          body: "KI und Recht, mit Primärquellen.",
          // Phone rows: one line at 320px, never truncated.
          short: "KI und Recht, mit Quellen",
          href: "/blog",
        },
        {
          label: "Lernbücher",
          body: "Kapitel mit Quellen und Begriffen.",
          // Phone rows: one line at 320px, never truncated.
          short: "Kapitel mit Quellen",
          href: "/buecher",
        },
        {
          label: "Praxisbeispiele",
          body: "Abläufe zum Ausprobieren, mit Annahmen und Grenzen.",
          // Phone rows: one line at 320px, never truncated.
          short: "Abläufe zum Ausprobieren",
          href: "/demos",
        },
        {
          label: "Workshops",
          body: "Geführte Fälle für Entscheidungen im Team.",
          // Phone rows: one line at 320px, never truncated.
          short: "Fälle für Teams",
          href: "/workshops",
        },
        {
          label: "Open Source",
          body: "Werkzeuge mit Quellcode, Version und Lizenz.",
          // Phone rows: one line at 320px, never truncated.
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
      // Empty: the four principles below say it (see copy-diet requests).
      introduction: "",
      principles: [
        {
          title: "Keine Paywall",
          body: "Kein Abo. Vier Reader benötigen ein kostenloses Lernkonto.",
        },
        {
          title: "Zwei vollständige Fassungen",
          body: "Alle Kurse gibt es auf Deutsch und Englisch.",
        },
        {
          title: "Stand und Herkunft sichtbar",
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
        lead: "Choose a goal and test your decisions on a model",
        detail: " and take away a record of your work",
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
      routeSignal: (lessons: number) => `${lessons} lessons · free · DE + EN`,
      routeLabel: "Recommended foundation path",
      lessonLabel: "lessons",
      deeperSummary: (count: number) =>
        `Plus ${count} technical courses on prompting, coding agents and data.`,
      viewAllCourses: "View all courses",
    },
    workflow: {
      headline: "Material to read and try",
      introduction: "",
      boardLabel: (areas: number) => `${areas} areas · no account needed`,
      boardAriaLabel: "Tools and learning resources",
      resources: [
        {
          label: "Blog",
          body: "AI and law, with primary sources.",
          // Phone rows: one line at 320px, never truncated.
          short: "AI and law, with sources",
          href: "/blog",
        },
        {
          label: "Learning books",
          body: "Chapters with sources and definitions.",
          // Phone rows: one line at 320px, never truncated.
          short: "Chapters with sources",
          href: "/buecher",
        },
        {
          label: "Applied examples",
          body: "Workflows to try, with assumptions and limits.",
          // Phone rows: one line at 320px, never truncated.
          short: "Workflows to try",
          href: "/demos",
        },
        {
          label: "Workshops",
          body: "Guided cases for team decisions.",
          // Phone rows: one line at 320px, never truncated.
          short: "Cases for teams",
          href: "/workshops",
        },
        {
          label: "Open Source",
          body: "Tools with source, version and licence.",
          // Phone rows: one line at 320px, never truncated.
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
      introduction: "",
      principles: [
        {
          title: "No paywall",
          body: "No subscription. Four readers require a free learning account.",
        },
        {
          title: "Two complete editions",
          body: "Every course is available in German and English.",
        },
        {
          title: "Date and origin shown",
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
      title: "AI Fundamentals",
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

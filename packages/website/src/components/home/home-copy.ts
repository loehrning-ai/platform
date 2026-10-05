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
      // lead + detail + "." and the facts as one tag line under it.
      introduction: {
        lead: "Freie Kurse, Praxisbeispiele und Workshops zu KI",
        detail: " mit Übungen und Quellen",
        facts: ["Ohne Paywall", "Deutsch und Englisch", "Quelloffen"],
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
        "Kostenloses Konto: Fortschritt und Arbeitsbelege auf jedem Gerät.",
      accountCta: "Zum Konto",
    },
    companion: {
      demosTitle: "Praxisbeispiele",
      demosRailLabel: "Praxisbeispiele zum Ausprobieren",
      booksTitle: "Lernbücher",
      booksRailLabel: "Lernbücher der Plattform",
      bookMeta: (chapters: number, minutes: number) =>
        `${chapters} Kapitel · ${minutes} Min.`,
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
        facts: ["No paywall", "German and English", "Open source"],
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
        "Free account: progress and work artifacts on every device.",
      accountCta: "Go to account",
    },
    companion: {
      demosTitle: "Applied examples",
      demosRailLabel: "Applied examples to try",
      booksTitle: "Learning books",
      booksRailLabel: "Learning books on this platform",
      bookMeta: (chapters: number, minutes: number) =>
        `${chapters} chapters · ${minutes} min`,
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
      tagline: "Daten einstufen, prüfbar briefen, Fehler finden.",
      duration: "ca. 45 Min.",
    },
    "ki-und-gesellschaft": {
      title: "KI und Gesellschaft",
      tagline: "Jobzahlen lesen, Fakes prüfen, Fairness messen.",
      duration: "ca. 40 Min.",
    },
    "eu-ai-act-kurs": {
      title: "EU AI Act Kurs",
      tagline: "Rolle bestimmen, Risikoklasse einordnen, Pflichten ableiten.",
      duration: "ca. 1 Std.",
    },
    "ai-native": {
      title: "Mit KI arbeiten",
      tagline: "Miss den Nutzen, begrenze die Rechte, teste den Ablauf.",
      duration: "ca. 70 Min.",
    },
  },
  en: {
    "ki-fuehrerschein": {
      title: "Everyday AI Literacy",
      tagline: "Classify data, brief checkably, catch errors.",
      duration: "about 45 min",
    },
    "ki-und-gesellschaft": {
      title: "AI and Society",
      tagline: "Read jobs figures, check fakes, measure fairness.",
      duration: "about 40 min",
    },
    "eu-ai-act-kurs": {
      title: "EU AI Act Course",
      tagline: "Determine your role, classify the use case, derive your duties.",
      duration: "about 1 hr",
    },
    "ai-native": {
      title: "Working with AI",
      tagline: "Measure the benefit, limit permissions, test the workflow.",
      duration: "about 70 min",
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

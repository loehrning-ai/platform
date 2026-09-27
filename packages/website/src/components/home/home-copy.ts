import type { Locale } from "@/lib/i18n/locale";

export const HOME_COPY = {
  de: {
    metadata: {
      title: "KI-Kurse, Workshops und offene Lernmaterialien",
      description:
        "Kostenfreie KI-Kurse auf Deutsch und Englisch, Workshops, Bücher, Demos und Open-Source-Werkzeuge. Mit Quellenstand, bekannten Grenzen und klaren Zugangsregeln.",
    },
    hero: {
      headline: ["KI", "verstehen.", "Sicher anwenden."],
      // One sentence on phones (lead + "."), the full introduction from lg:
      // lead + detail + "." + facts. Below lg the facts sit above the
      // headline as the band's label instead.
      introduction: {
        lead: "Wähle ein Ziel. Triff eine Entscheidung. Teste sie an einem Modell",
        detail: " und nimm einen überprüfbaren Arbeitsbeleg mit",
        facts: "Frei, zweisprachig und quelloffen.",
      },
      primaryCta: "Lernroute wählen",
      globeToggle: "Globus anhalten",
      pillars: [
        {
          title: "Lernen",
          body: "Formuliere zuerst eine eigene Antwort.",
          href: "/kurse",
        },
        {
          title: "Prüfen",
          body: "Verändere eine Variable und beobachte den Unterschied.",
          href: "/demos",
        },
        {
          title: "Anwenden",
          body: "Übertrage die Regel in einen neuen Fall.",
          href: "/workshops",
        },
      ],
    },
    offering: {
      headline: "Vier Kurse in fester Reihenfolge",
      introduction:
        "Beginne mit sicherer Anwendung. Prüfe danach gesellschaftliche Folgen, rechtliche Pflichten und belastbare Arbeitsabläufe.",
      // Section caption, from lg: facts only, never a restated heading.
      routeSignal: (lessons: number) =>
        `${lessons} Lektionen · kostenlos · DE + EN`,
      routeLabel: "Empfohlener Grundlagenpfad",
      lessonLabel: "Lektionen",
      deeperSummary: (count: number) =>
        `Dazu ${count} technische Kurse von Data Engineering bis System Design.`,
      viewAllCourses: "Alle Kurse ansehen",
    },
    workflow: {
      headline: "Material zum Nachlesen und Ausprobieren",
      introduction:
        "Wähle nach Aufgabe: nachlesen, ausprobieren, gemeinsam entscheiden oder selbst weiterbauen.",
      // Section caption, from lg: facts only.
      boardLabel: (areas: number) => `${areas} Bereiche · ohne Konto`,
      boardAriaLabel: "Werkzeuge und Lernressourcen",
      resources: [
        {
          label: "Blog",
          body: "Einordnungen zu KI und Recht mit Primärquellen.",
          // Phone rows: one line at 320px, never truncated.
          short: "KI und Recht, mit Quellen",
          href: "/blog",
        },
        {
          label: "Lernbücher",
          body: "Vertiefungen mit Kapiteln, Quellen und Begriffen.",
          // Phone rows: one line at 320px, never truncated.
          short: "Kapitel mit Quellen",
          href: "/buecher",
        },
        {
          label: "Praxisbeispiele",
          body: "Arbeitsabläufe zum Ausprobieren, mit Annahmen und Grenzen.",
          // Phone rows: one line at 320px, never truncated.
          short: "Abläufe zum Ausprobieren",
          href: "/demos",
        },
        {
          label: "Workshops",
          body: "Geführte Fälle für gemeinsame Entscheidungen.",
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
      headline: "Was hier nicht verhandelbar ist",
      introduction:
        "Jede Oberfläche folgt denselben Regeln: offen zugänglich, zweisprachig, mit sichtbarer Herkunft und verantworteter Redaktion.",
      principles: [
        {
          title: "Keine Paywall",
          body: "Kein Abo. Vier Reader benötigen ein kostenloses Lernkonto.",
        },
        {
          title: "Zwei vollständige Fassungen",
          body: "Alle Kurse sind vollständig auf Deutsch und Englisch verfügbar.",
        },
        {
          title: "Stand und Herkunft sichtbar",
          body: "Fakten verweisen auf Quellen. Annahmen und Simulationen sind markiert.",
        },
        {
          title: "Von Tim Löhr redigiert",
          body: "Autorschaft, Überarbeitungsstand und bekannte Grenzen bleiben sichtbar.",
        },
      ],
    },
  },
  en: {
    metadata: {
      title: "AI courses, workshops and open learning materials",
      description:
        "Free AI courses in German and English, workshops, books, demos and open-source tools. Each resource states its sources, known limits and access requirements.",
    },
    hero: {
      headline: ["Understand", "AI.", "Apply it safely."],
      introduction: {
        lead: "Choose a goal. Commit to a decision. Test it against a model",
        detail: " and leave with a reviewable work artifact",
        facts: "Free, bilingual and open source.",
      },
      primaryCta: "Choose a learning route",
      globeToggle: "Pause the globe",
      pillars: [
        {
          title: "Learn",
          body: "State your own answer before the reveal.",
          href: "/kurse",
        },
        {
          title: "Check",
          body: "Change one variable and observe the difference.",
          href: "/demos",
        },
        {
          title: "Apply",
          body: "Transfer the rule into a new case.",
          href: "/workshops",
        },
      ],
    },
    offering: {
      headline: "Four courses in a set order",
      introduction:
        "Start with safe use. Then test social effects, legal duties and reviewable working methods.",
      routeSignal: (lessons: number) => `${lessons} lessons · free · DE + EN`,
      routeLabel: "Recommended foundation path",
      lessonLabel: "lessons",
      deeperSummary: (count: number) =>
        `Plus ${count} technical courses, from data engineering to system design.`,
      viewAllCourses: "View all courses",
    },
    workflow: {
      headline: "Material to read and try",
      introduction:
        "Choose by task: read, experiment, decide together or build on the source.",
      boardLabel: (areas: number) => `${areas} areas · no account needed`,
      boardAriaLabel: "Tools and learning resources",
      resources: [
        {
          label: "Blog",
          body: "AI and legal analysis with primary sources.",
          // Phone rows: one line at 320px, never truncated.
          short: "AI and law, with sources",
          href: "/blog",
        },
        {
          label: "Learning books",
          body: "Deeper chapters with sources and definitions.",
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
          body: "Guided cases for shared decisions.",
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
        "A free account synchronizes progress and work artifacts across devices.",
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
      headline: "What is not negotiable here",
      introduction:
        "Every surface follows the same rules: open access, complete bilingual editions, visible provenance and accountable editing.",
      principles: [
        {
          title: "No paywall",
          body: "No subscription. Four readers require a free learning account.",
        },
        {
          title: "Two complete editions",
          body: "Every course is complete in English and German.",
        },
        {
          title: "Date and origin shown",
          body: "Facts link to sources. Assumptions and simulations are labelled.",
        },
        {
          title: "Edited by Tim Löhr",
          body: "Authorship, revision date and known limits stay visible.",
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
        "Deepfakes, Bias und Folgen für Arbeit anhand von Beispielen prüfen.",
      duration: "ca. 46 Min.",
    },
    "eu-ai-act-kurs": {
      title: "EU AI Act Kurs",
      tagline:
        "Anwendungsfall klassifizieren, Rolle bestimmen, Pflichten zuordnen.",
      duration: "ca. 1 Std. 50 Min.",
    },
    "ai-native": {
      title: "AI-Native Arbeitskurs",
      tagline:
        "Absicht klären, Kontext bereitstellen, Ausführung und Ergebnis prüfen.",
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
      tagline: "Assess deepfakes, bias and effects on work through examples.",
      duration: "about 46 min",
    },
    "eu-ai-act-kurs": {
      title: "EU AI Act Course",
      tagline: "Classify a use case, identify the role and map the duties.",
      duration: "about 1 hr 50 min",
    },
    "ai-native": {
      title: "AI-Native Work Course",
      tagline:
        "Clarify intent, provide context, then verify execution and results.",
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

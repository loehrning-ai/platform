import type { Locale } from "@/lib/i18n/locale";

export const HOME_COPY = {
  de: {
    metadata: {
      title: "KI-Kurse, Workshops und offene Lernmaterialien",
      description:
        "Kostenfreie KI-Kurse auf Deutsch und Englisch, Workshops, Bücher, Demos und Open-Source-Werkzeuge. Mit Quellenstand, bekannten Grenzen und klaren Zugangsregeln.",
    },
    hero: {
      platformLabel: "Offene Lerninstrumente",
      headline: ["KI", "verstehen.", "Sicher anwenden."],
      introduction:
        "Wähle ein Ziel. Triff eine Entscheidung. Teste sie an einem Modell und nimm einen überprüfbaren Arbeitsbeleg mit. Frei, zweisprachig und quelloffen.",
      primaryCta: "Lernroute wählen",
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
      overline: "Grundlagenpfad",
      headline: ["Vier Kurse.", "Eine klare Reihenfolge."],
      introduction:
        "Beginne mit sicherer Anwendung. Prüfe danach gesellschaftliche Folgen, rechtliche Pflichten und belastbare Arbeitsabläufe.",
      routeSignal: "Ein Pfad. Vier überprüfbare Ergebnisse.",
      routeLabel: "Empfohlener Grundlagenpfad",
      lessonLabel: "Lektionen",
      deeperSummary: (count: number) =>
        `Dazu ${count} technische Kurse von Data Engineering bis System Design.`,
      viewAllCourses: "Alle Kurse ansehen",
    },
    workflow: {
      overline: "Ressourcen",
      headline: "Nachlesen, prüfen, übertragen.",
      introduction:
        "Wähle nach Aufgabe: nachlesen, ausprobieren, gemeinsam entscheiden oder selbst weiterbauen.",
      boardLabel: "Kein Content-Labyrinth. Ein Werkzeug pro Absicht.",
      boardAriaLabel: "Werkzeuge und Lernressourcen",
      resources: [
        {
          label: "Blog",
          body: "Einordnungen zu KI und Recht mit Primärquellen.",
          href: "/blog",
        },
        {
          label: "Lernbücher",
          body: "Vertiefungen mit Kapiteln, Quellen und Begriffen.",
          href: "/buecher",
        },
        {
          label: "Praxisbeispiele",
          body: "Modelle zum Ausprobieren, mit Annahmen und Grenzen.",
          href: "/demos",
        },
        {
          label: "Workshops",
          body: "Geführte Fälle für gemeinsame Entscheidungen.",
          href: "/workshops",
        },
        {
          label: "Open Source",
          body: "Werkzeuge mit Quellcode, Version und Lizenz.",
          href: "/open-source",
        },
      ],
      accountBody:
        "Ein kostenloses Konto synchronisiert Fortschritt und Arbeitsbelege geräteübergreifend.",
      accountCta: "Zum Konto",
    },
    credibility: {
      overline: "Betriebsprinzipien",
      headline: "Was hier nicht verhandelbar ist.",
      introduction:
        "Jede Oberfläche folgt denselben Regeln: offen zugänglich, zweisprachig, mit sichtbarer Herkunft und verantworteter Redaktion.",
      principles: [
        {
          label: "Zugang",
          title: "Keine Paywall",
          body: "Kein Abo. Vier Reader benötigen ein kostenloses Lernkonto.",
        },
        {
          label: "Sprachen",
          title: "Zwei vollständige Fassungen",
          body: "Alle Kurse sind vollständig auf Deutsch und Englisch verfügbar.",
        },
        {
          label: "Quellen",
          title: "Stand und Herkunft sichtbar",
          body: "Fakten verweisen auf Quellen. Annahmen und Simulationen sind markiert.",
        },
        {
          label: "Redaktion",
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
      platformLabel: "Open learning instruments",
      headline: ["Understand", "AI.", "Apply it safely."],
      introduction:
        "Choose a goal. Commit to a decision. Test it against a model and leave with a reviewable work artifact. Free, bilingual and open source.",
      primaryCta: "Choose a learning route",
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
      overline: "Foundation path",
      headline: ["Four courses.", "One defined order."],
      introduction:
        "Start with safe use. Then test social effects, legal duties and reviewable working methods.",
      routeSignal: "One path. Four reviewable outcomes.",
      routeLabel: "Recommended foundation path",
      lessonLabel: "lessons",
      deeperSummary: (count: number) =>
        `Plus ${count} technical courses, from data engineering to system design.`,
      viewAllCourses: "View all courses",
    },
    workflow: {
      overline: "Resources",
      headline: "Read, test, transfer.",
      introduction:
        "Choose by task: read, experiment, decide together or build on the source.",
      boardLabel: "No content maze. One instrument for each intent.",
      boardAriaLabel: "Tools and learning resources",
      resources: [
        {
          label: "Blog",
          body: "AI and legal analysis with primary sources.",
          href: "/blog",
        },
        {
          label: "Learning books",
          body: "Deeper chapters with sources and definitions.",
          href: "/buecher",
        },
        {
          label: "Applied examples",
          body: "Models to try, with assumptions and limits.",
          href: "/demos",
        },
        {
          label: "Workshops",
          body: "Guided cases for shared decisions.",
          href: "/workshops",
        },
        {
          label: "Open Source",
          body: "Tools with source, version and licence.",
          href: "/open-source",
        },
      ],
      accountBody:
        "A free account synchronizes progress and work artifacts across devices.",
      accountCta: "Go to account",
    },
    credibility: {
      overline: "Operating principles",
      headline: "What is not negotiable here.",
      introduction:
        "Every surface follows the same rules: open access, complete bilingual editions, visible provenance and accountable editing.",
      principles: [
        {
          label: "Access",
          title: "No paywall",
          body: "No subscription. Four readers require a free learning account.",
        },
        {
          label: "Languages",
          title: "Two complete editions",
          body: "Every course is complete in English and German.",
        },
        {
          label: "Sources",
          title: "Date and origin shown",
          body: "Facts link to sources. Assumptions and simulations are labelled.",
        },
        {
          label: "Editorial",
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
      duration: "ca. 12 Std.",
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
      duration: "about 12 hr",
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

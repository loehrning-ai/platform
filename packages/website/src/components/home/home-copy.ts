import type { Locale } from "@/lib/i18n/locale";
import { courseBadges } from "@/lib/courses/tracks";

export const HOME_COPY = {
  de: {
    metadata: {
      title: "KI-Kurse, Workshops und offene Lernmaterialien",
      description:
        "Kostenfreie KI-Kurse auf Deutsch und Englisch, Workshops, Bücher, Demos und Open-Source-Werkzeuge. Mit Quellenstand, bekannten Grenzen und klaren Zugangsregeln.",
    },
    hero: {
      platformLabel: "Freie KI-Lernplattform",
      headline: ["KI", "verstehen.", "Sicher anwenden."],
      introduction:
        "Kostenfreie Kurse, Demos, Bücher und Workshops zu KI-Grundlagen, EU AI Act, Datenarbeit und agentischen Arbeitsabläufen. Vier Reader im Grundlagenpfad nutzen ein kostenloses Lernkonto; die übrigen Lernmaterialien sind öffentlich erreichbar.",
      trustSignals: [
        "Deutsch + Englisch",
        "Quellenstand sichtbar",
        "Kurse ohne Paywall",
        "Quellcode veröffentlicht",
      ],
      primaryCta: "KI-Check öffnen",
      secondaryCta: "Open Source",
      mapStamp: "ÖFFENTLICHE LERNKARTE v3.0",
      edition: "AUSGABE Nr. 014 / 2026",
      resourcesStamp: "KURSE · BÜCHER · DEMOS · BLOG //",
      online: "Online",
      pillars: [
        {
          title: "Lernen",
          body: "Kurse und Bücher erklären Begriffe, Regeln und technische Grundlagen.",
        },
        {
          title: "Prüfen",
          body: "Selbsttests und Demos machen Annahmen, Daten und Grenzen sichtbar.",
        },
        {
          title: "Anwenden",
          body: "Workshops und Technikkurse übersetzen Methoden in prüfbare Abläufe.",
        },
      ],
    },
    offering: {
      overline: "Grundlagenpfad",
      headline: ["Vier Kurse.", "Eine klare Reihenfolge."],
      introduction:
        "Der KI-Führerschein legt die Grundlagen. Danach folgen gesellschaftliche Folgen, EU-AI-Act-Pflichten und der Aufbau überprüfbarer KI-Arbeitsabläufe. Alle vier Kurse sind auf Deutsch und Englisch verfügbar und nutzen ein kostenloses Lernkonto.",
      personaLabel: "Ich möchte:",
      personas: [
        {
          label: "Alltag und sicherer Einsatz",
          course: "KI-Führerschein",
          href: "/ki-fuehrerschein",
        },
        {
          label: "Deepfakes und Bias prüfen",
          course: "KI und Gesellschaft",
          href: "/ki-und-gesellschaft",
        },
        {
          label: "Pflichten und Risiken einordnen",
          course: "EU AI Act Kurs",
          href: "/eu-ai-act-kurs",
        },
        {
          label: "KI-Arbeit strukturieren",
          course: "AI-Native Arbeitskurs",
          href: "/ai-native",
        },
      ],
      personaAria: "Direkte Kursempfehlungen nach Lernziel",
      personaLinkAria: (label: string, course: string) =>
        `${label}: direkt zum Kurs ${course}`,
      recommended: "Empfohlener Einstieg",
      duration: "Dauer",
      lessons: "Lektionen",
      deeperSummary: (count: number) =>
        `Dazu ${count} technische Kurse auf Deutsch und Englisch, von Data Engineering bis System Design.`,
      viewAllCourses: "Alle Kurse ansehen",
      technicalCourses: "Technikkurse",
      technicalDescription:
        "Aus offenen GitHub-Repositories übernommen, auf Deutsch und Englisch verfügbar und mit selbst ausgestelltem Abschlussnachweis.",
      viewTechnicalCourses: "Alle Technikkurse ansehen",
      detailsAria: (title: string) => `${title}: Details ansehen`,
      sourceAria: (title: string) => `Quellcode auf GitHub: ${title}`,
      sourceFacts: "GitHub · MIT · DE + EN",
    },
    workflow: {
      overline: "Ressourcen",
      headline: "Nachlesen, prüfen, übertragen.",
      introduction:
        "Bücher erklären Zusammenhänge, Demos prüfen einzelne Annahmen, Workshops führen durch abgegrenzte Fälle. Open-Source-Artefakte legen ihren Quellstand offen.",
      resources: [
        {
          label: "Blog",
          body: "Einordnungen zu KI und Recht mit Primärquellen und geprüftem Stand.",
          href: "/blog",
        },
        {
          label: "Lernbücher",
          body: "Längere Lesefassungen mit Kapiteln, Quellenhinweisen und Begriffserklärungen.",
          href: "/buecher",
        },
        {
          label: "Praxisbeispiele",
          body: "Interaktive Modelle mit ausgewiesenem Evidenzmodus und bekannten Grenzen.",
          href: "/demos",
        },
        {
          label: "Workshops",
          body: "Geführte Fälle mit Ablauf, Browsermaterial und Dateien zum Nachbauen.",
          href: "/workshops",
        },
        {
          label: "Open Source",
          body: "Veröffentlichte Werkzeuge mit festem Commit, Lizenz und bekannten Grenzen.",
          href: "/open-source",
        },
      ],
      accountBody:
        "Mit einem kostenlosen Konto bleiben dein Fortschritt, deine Abschlussnachweise und deine Kompetenzen erhalten, auch geräteübergreifend.",
      accountCta: "Zum Konto",
    },
    credibility: {
      overline: "Betriebsprinzipien",
      principles: [
        {
          label: "Zugang",
          title: "Keine Paywall",
          body: "Es gibt kein Abo und keine Premiumstufe. Nur die vier Reader des Grundlagenpfads benötigen ein kostenloses Lernkonto.",
        },
        {
          label: "Sprachen",
          title: "Zwei vollständige Fassungen",
          body: "Alle zehn Kurse sind auf Deutsch und Englisch verfügbar. Die Sprachwahl bleibt beim Wechsel zwischen Seiten erhalten.",
        },
        {
          label: "Quellen",
          title: "Stand und Herkunft sichtbar",
          body: "Rechts- und Sachangaben verweisen auf Primärquellen. Annahmen und simulierte Daten sind als solche gekennzeichnet.",
        },
        {
          label: "Redaktion",
          title: "Von Tim Löhr redigiert",
          body: "Inhalte, Quellenstand und bekannte Grenzen werden namentlich verantwortet und über die Rückmeldung korrigiert.",
        },
      ],
      summary:
        "Bücher, Demos, KI-Check und technische Vertiefungen sind öffentlich. Für die vier Reader des Grundlagenpfads brauchst du ein kostenloses Konto.",
    },
    finalCta: {
      headline: "Den passenden Einstieg finden.",
      body: "Fünf Fragen ordnen deinen aktuellen Kenntnisstand einem sinnvollen Einstieg zu. Die Auswertung läuft im Browser und benötigt kein Konto.",
      label: "KI-Check öffnen",
    },
  },
  en: {
    metadata: {
      title: "AI courses, workshops and open learning materials",
      description:
        "Free AI courses in German and English, workshops, books, demos and open-source tools. Each resource states its sources, known limits and access requirements.",
    },
    hero: {
      platformLabel: "Open AI learning platform",
      headline: ["Understand", "AI.", "Apply it safely."],
      introduction:
        "Free courses, demos, books and workshops on AI fundamentals, the EU AI Act, data work and agentic workflows. Four foundation-path readers require a free learning account; all other learning materials are public.",
      trustSignals: [
        "German + English",
        "Sources dated",
        "No course paywall",
        "Source code published",
      ],
      primaryCta: "Open AI check",
      secondaryCta: "Open Source",
      mapStamp: "PUBLIC LEARNING MAP v3.0",
      edition: "EDITION No. 014 / 2026",
      resourcesStamp: "COURSES · BOOKS · DEMOS · BLOG //",
      online: "Online",
      pillars: [
        {
          title: "Learn",
          body: "Courses and books explain terms, rules and technical foundations.",
        },
        {
          title: "Check",
          body: "Self-tests and demos expose assumptions, data and limits.",
        },
        {
          title: "Apply",
          body: "Workshops and technical courses turn methods into verifiable workflows.",
        },
      ],
    },
    offering: {
      overline: "Foundation path",
      headline: ["Four courses.", "One defined order."],
      introduction:
        "AI Fundamentals establishes the base. The next courses cover social effects, EU AI Act duties and verifiable AI workflows. All four courses are available in English and German and use a free learning account.",
      personaLabel: "I want to:",
      personas: [
        {
          label: "Use AI safely at work",
          course: "AI Fundamentals",
          href: "/ki-fuehrerschein",
        },
        {
          label: "Assess deepfakes and bias",
          course: "AI and Society",
          href: "/ki-und-gesellschaft",
        },
        {
          label: "Map duties and risks",
          course: "EU AI Act Course",
          href: "/eu-ai-act-kurs",
        },
        {
          label: "Structure AI work",
          course: "AI-Native Work Course",
          href: "/ai-native",
        },
      ],
      personaAria: "Direct course recommendations by learning goal",
      personaLinkAria: (label: string, course: string) =>
        `${label}: go directly to ${course}`,
      recommended: "Recommended start",
      duration: "Duration",
      lessons: "Lessons",
      deeperSummary: (count: number) =>
        `There are also ${count} technical courses in English and German, from data engineering to system design.`,
      viewAllCourses: "View all courses",
      technicalCourses: "Technical courses",
      technicalDescription:
        "Adapted from open GitHub repositories, available in English and German, with a completion record issued by loehrning.ai.",
      viewTechnicalCourses: "View all technical courses",
      detailsAria: (title: string) => `${title}: view details`,
      sourceAria: (title: string) => `Source code on GitHub: ${title}`,
      sourceFacts: "GitHub · MIT · DE + EN",
    },
    workflow: {
      overline: "Resources",
      headline: "Read, test, transfer.",
      introduction:
        "Books explain connections, demos test individual assumptions, and workshops guide you through bounded cases. Open-source artifacts disclose the exact source revision.",
      resources: [
        {
          label: "Blog",
          body: "Analysis of AI and law with primary sources and a stated review date.",
          href: "/blog",
        },
        {
          label: "Learning books",
          body: "Long-form chapters with source notes and definitions.",
          href: "/buecher",
        },
        {
          label: "Applied examples",
          body: "Interactive models with a stated evidence mode and known limits.",
          href: "/demos",
        },
        {
          label: "Workshops",
          body: "Guided cases with a defined process, browser materials and files for replication.",
          href: "/workshops",
        },
        {
          label: "Open Source",
          body: "Published tools with a pinned commit, licence and known limits.",
          href: "/open-source",
        },
      ],
      accountBody:
        "A free account keeps your progress, completion records and competencies available across devices.",
      accountCta: "Go to account",
    },
    credibility: {
      overline: "Operating principles",
      principles: [
        {
          label: "Access",
          title: "No paywall",
          body: "There is no subscription or premium tier. Only the four foundation-path readers require a free learning account.",
        },
        {
          label: "Languages",
          title: "Two complete editions",
          body: "All ten courses are available in English and German. The selected language persists between pages.",
        },
        {
          label: "Sources",
          title: "Date and origin shown",
          body: "Legal and factual claims point to primary sources. Assumptions and simulated data are labelled.",
        },
        {
          label: "Editorial",
          title: "Edited by Tim Löhr",
          body: "Tim Löhr takes named responsibility for the content, source dates and known limits, and corrects them through the feedback process.",
        },
      ],
      summary:
        "Books, demos, the AI check and technical courses are public. The four foundation-path readers require a free account.",
    },
    finalCta: {
      headline: "Find the right starting point.",
      body: "Five questions match your current knowledge to a suitable entry point. The assessment runs in your browser and requires no account.",
      label: "Open AI check",
    },
  },
} as const satisfies Readonly<Record<Locale, object>>;

export interface HomeCourseCopy {
  readonly title: string;
  readonly eyebrow: string;
  readonly tagline: string;
  readonly description: string;
  readonly duration: string;
  readonly unitLabel: string;
  readonly imageAlt?: string;
}

export const HOME_COURSE_COPY: Readonly<
  Record<Locale, Readonly<Record<string, HomeCourseCopy>>>
> = {
  de: {
    "ki-fuehrerschein": {
      title: "KI-Führerschein",
      eyebrow: "Schritt 01 · KI-Kompetenz",
      tagline: "Aufgaben abgrenzen, Daten schützen und Antworten prüfen.",
      description:
        "Der Einstieg erklärt Funktionsweise, Fehlertypen, Datenschutz und sichere Nutzung. Er ordnet außerdem die seit 27. Juli 2026 geltende Fassung von Artikel 4 ein. Mit lokal erstellter Teilnahmebestätigung.",
      duration: "ca. 1 Std. 40 Min.",
      unitLabel: "Blöcke",
    },
    "ki-und-gesellschaft": {
      title: "KI und Gesellschaft",
      eyebrow: "Schritt 02 · Gesellschaft",
      tagline:
        "Deepfakes, Bias und Folgen für Arbeit anhand von Beispielen prüfen.",
      description:
        "Drei Blöcke untersuchen veränderte Arbeit, manipulierte Medien und diskriminierende Systeme. Quellen, Interessen und Unsicherheit werden getrennt ausgewiesen.",
      duration: "ca. 46 Min.",
      unitLabel: "Blöcke",
    },
    "eu-ai-act-kurs": {
      title: "EU AI Act Kurs",
      eyebrow: "Schritt 03 · Vertiefung",
      tagline:
        "Anwendungsfall klassifizieren, Rolle bestimmen, Pflichten zuordnen.",
      description:
        "Der Kurs trennt verbotene Praktiken, Transparenzpflichten, GPAI und Hochrisiko-Systeme. Zeitabhängige Aussagen nennen Rechtsstand und Primärquelle. Keine Rechtsberatung.",
      duration: "ca. 1 Std. 50 Min.",
      unitLabel: "Blöcke",
    },
    "ai-native": {
      title: "AI-Native Arbeitskurs",
      eyebrow: "Schritt 04 · Arbeitsweise",
      tagline:
        "Absicht klären, Kontext bereitstellen, Ausführung und Ergebnis prüfen.",
      description:
        "Vier Module zeigen einen wiederholbaren Arbeitsablauf für Recherche, Dokumentation und Automatisierung. Übungen benennen Werkzeug, Eingabe, Prüfschritt und Abbruchkriterium.",
      duration: "ca. 12 Std.",
      unitLabel: "Module",
    },
  },
  en: {
    "ki-fuehrerschein": {
      title: "AI Fundamentals",
      eyebrow: "Step 01 · AI literacy",
      tagline: "Set task boundaries, protect data and verify responses.",
      description:
        "This introduction explains how AI systems work, common error types, data protection and safe use. It also covers the version of Article 4 in force since 27 July 2026. Includes a locally generated participation record.",
      duration: "about 1 hr 40 min",
      unitLabel: "Blocks",
    },
    "ki-und-gesellschaft": {
      title: "AI and Society",
      eyebrow: "Step 02 · Society",
      tagline: "Assess deepfakes, bias and effects on work through examples.",
      description:
        "Three blocks examine changing work, manipulated media and discriminatory systems. Sources, interests and uncertainty are identified separately.",
      duration: "about 46 min",
      unitLabel: "Blocks",
    },
    "eu-ai-act-kurs": {
      title: "EU AI Act Course",
      eyebrow: "Step 03 · Advanced foundations",
      tagline: "Classify a use case, identify the role and map the duties.",
      description:
        "This course distinguishes prohibited practices, transparency duties, GPAI and high-risk systems. Time-dependent claims state the legal date and primary source. It is not legal advice.",
      duration: "about 1 hr 50 min",
      unitLabel: "Blocks",
    },
    "ai-native": {
      title: "AI-Native Work Course",
      eyebrow: "Step 04 · Working method",
      tagline:
        "Clarify intent, provide context, then verify execution and results.",
      description:
        "Four modules define a repeatable workflow for research, documentation and automation. Exercises name the tool, input, verification step and stopping condition.",
      duration: "about 12 hr",
      unitLabel: "Modules",
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

export function homeCourseBadges(
  locale: Locale,
  slug: string,
): readonly string[] {
  return courseBadges(slug, locale).map(({ label }) => label);
}

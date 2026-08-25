import type { Locale } from "@/lib/i18n/locale";

type LandingCopy = {
  readonly metadata: {
    readonly title: string;
    readonly description: string;
    readonly openGraphDescription: string;
  };
  readonly breadcrumbLabel: string;
  readonly home: string;
  readonly eyebrow: string;
  readonly lessonSummary: (durationMinutes: number) => string;
  readonly resumeNote: string;
  readonly lessonLabel: (number: number, durationMinutes: number) => string;
  readonly startLesson: string;
  readonly nextEyebrow: string;
  readonly nextBody: string;
  readonly driverLicense: string;
  readonly backToEntry: string;
};

type LessonCopy = {
  readonly metadataSuffix: string;
  readonly breadcrumbLabel: string;
  readonly lessonNavigation: string;
  readonly conceptsLabel: string;
  readonly home: string;
  readonly courseTitle: string;
  readonly lessonBreadcrumb: (number: number) => string;
  readonly lessonProgress: (
    number: number,
    total: number,
    durationMinutes: number,
  ) => string;
  readonly reviewed: string;
  readonly section: (number: number) => string;
  readonly readTime: (minutes: number) => string;
  readonly takeaway: string;
  readonly selfCheck: string;
  readonly responseLabel: string;
  readonly responsePlaceholder: string;
  readonly compareCriteria: string;
  readonly hideCriteria: string;
  readonly criteriaHeading: string;
  readonly sessionOnly: string;
  readonly referenceTitle: string;
  readonly previousLesson: string;
  readonly nextLesson: string;
  readonly completedEyebrow: string;
  readonly completedHeading: string;
  readonly completedBody: string;
  readonly driverLicense: string;
  readonly backToEntry: string;
  readonly schemaDescription: string;
};

export const WIE_KI_LANDING_COPY: Readonly<Record<Locale, LandingCopy>> = {
  de: {
    metadata: {
      title: "Wie Sprachmodelle arbeiten: 4 kostenlose Lektionen",
      description:
        "Token-Vorhersage, Trainingsdaten und Bias, Halluzinationen und KI-Grenzen. Vier kostenlose Lektionen ohne technisches Vorwissen oder Login.",
      openGraphDescription:
        "Token-Vorhersage, Trainingsdaten und Bias, Halluzinationen und KI-Grenzen. Vier Lektionen ohne Vorwissen.",
    },
    breadcrumbLabel: "Brotkrümelnavigation",
    home: "Startseite",
    eyebrow: "Konzeptblock · Stufe 1: Prüfen",
    lessonSummary: (durationMinutes) =>
      `Vier Lektionen, keine Vorkenntnisse, kein Login. Gesamtdauer: ca. ${durationMinutes} Minuten.`,
    resumeNote: "Du kannst jederzeit unterbrechen und weitermachen.",
    lessonLabel: (number, durationMinutes) =>
      `Lektion ${number} · ${durationMinutes} Min.`,
    startLesson: "Lektion starten",
    nextEyebrow: "Wie geht es weiter?",
    nextBody:
      "Dieser Konzeptblock ist der Einstieg. Der KI-Führerschein behandelt anschließend Datenregeln, Ergebnisprüfung und Zuständigkeiten für den beruflichen Einsatz.",
    driverLicense: "Zum KI-Führerschein",
    backToEntry: "Zum Einstieg zurück",
  },
  en: {
    metadata: {
      title: "How Language Models Work: 4 Free Lessons",
      description:
        "Token prediction, training data and bias, hallucinations, and AI limits. Four free lessons with no technical background or login required.",
      openGraphDescription:
        "Token prediction, training data and bias, hallucinations, and AI limits. Four lessons with no technical background required.",
    },
    breadcrumbLabel: "Breadcrumb",
    home: "Home",
    eyebrow: "Concept block · Stage 1: Evaluate",
    lessonSummary: (durationMinutes) =>
      `Four lessons, no prerequisites, no login. Total time: about ${durationMinutes} minutes.`,
    resumeNote: "Stop and continue whenever you need to.",
    lessonLabel: (number, durationMinutes) =>
      `Lesson ${number} · ${durationMinutes} min`,
    startLesson: "Start lesson",
    nextEyebrow: "What comes next?",
    nextBody:
      "This concept block is the starting point. Everyday AI Literacy then covers data rules, output review, and responsibility in workplace use.",
    driverLicense: "Go to Everyday AI Literacy",
    backToEntry: "Back to the introduction",
  },
};

export const WIE_KI_LESSON_COPY: Readonly<Record<Locale, LessonCopy>> = {
  de: {
    metadataSuffix: "Wie Sprachmodelle arbeiten",
    breadcrumbLabel: "Brotkrümelnavigation",
    lessonNavigation: "Navigation zwischen den Lektionen",
    conceptsLabel: "Begriffe dieser Lektion",
    home: "Startseite",
    courseTitle: "Wie Sprachmodelle arbeiten",
    lessonBreadcrumb: (number) => `Lektion ${number}`,
    lessonProgress: (number, total, durationMinutes) =>
      `Lektion ${number} von ${total} · ${durationMinutes} Min.`,
    reviewed: "Stand",
    section: (number) => `Abschnitt ${number}`,
    readTime: (minutes) => `${minutes} Min. Lesezeit`,
    takeaway: "Das Wichtigste aus diesem Abschnitt",
    selfCheck: "Kurze Selbstprüfung",
    responseLabel: "Deine Antwort",
    responsePlaceholder: "Formuliere die Kernidee.",
    compareCriteria: "Mit Prüfkriterien vergleichen",
    hideCriteria: "Prüfkriterien ausblenden",
    criteriaHeading: "Prüfkriterien",
    sessionOnly: "Nur auf dieser Seite. Nicht gespeichert.",
    referenceTitle: "Konzepte und Belege",
    previousLesson: "Vorherige Lektion",
    nextLesson: "Nächste Lektion",
    completedEyebrow: "Nächster Schritt",
    completedHeading: "Übertrage die vier Konzepte jetzt in die Praxis.",
    completedBody:
      "Der KI-Führerschein überträgt diese Grundlagen auf Datenregeln, Ergebnisprüfung und Zuständigkeiten im Arbeitsalltag. Er ist kostenlos und setzt kein technisches Vorwissen voraus.",
    driverLicense: "Zum KI-Führerschein",
    backToEntry: "Zum Einstieg zurück",
    schemaDescription:
      "Kostenlose Lektion über die Funktionsweise und Grenzen von Sprachmodellen.",
  },
  en: {
    metadataSuffix: "How Language Models Work",
    breadcrumbLabel: "Breadcrumb",
    lessonNavigation: "Lesson navigation",
    conceptsLabel: "Concepts in this lesson",
    home: "Home",
    courseTitle: "How Language Models Work",
    lessonBreadcrumb: (number) => `Lesson ${number}`,
    lessonProgress: (number, total, durationMinutes) =>
      `Lesson ${number} of ${total} · ${durationMinutes} min`,
    reviewed: "Reviewed",
    section: (number) => `Section ${number}`,
    readTime: (minutes) => `${minutes} min read`,
    takeaway: "Key point from this section",
    selfCheck: "Quick self-check",
    responseLabel: "Your answer",
    responsePlaceholder: "State the core idea.",
    compareCriteria: "Compare with criteria",
    hideCriteria: "Hide criteria",
    criteriaHeading: "Check criteria",
    sessionOnly: "This page only. Not saved.",
    referenceTitle: "Concepts and evidence",
    previousLesson: "Previous lesson",
    nextLesson: "Next lesson",
    completedEyebrow: "Next step",
    completedHeading: "Apply the four concepts in practice.",
    completedBody:
      "Everyday AI Literacy applies these foundations to data rules, output review, and responsibility at work. It is free and requires no technical background.",
    driverLicense: "Go to Everyday AI Literacy",
    backToEntry: "Back to the introduction",
    schemaDescription:
      "A free lesson about how language models work and where their limits lie.",
  },
};

export const WIE_KI_COMPREHENSION_CHECKS: Readonly<
  Record<
    Locale,
    Readonly<
      Record<string, { question: string; criteria: readonly string[] }>
    >
  >
> = {
  de: {
    "lektion-1-vorhersage": {
      question:
        "Warum kann ein Sprachmodell eine Frage richtig beantworten, ohne die Antwort wirklich zu 'wissen'?",
      criteria: [
        "Benennt gelernte Muster und Eingabekontext als Grundlage der Fortsetzung.",
        "Trennt eine plausible Fortsetzung von der Prüfung gegen eine verlässliche Quelle.",
      ],
    },
    "lektion-2-trainingsdaten": {
      question:
        "Ein KI-Modell schreibt bei einem Text über Krankenpflege automatisch in der weiblichen Form. Ist das ein Programmierfehler?",
      criteria: [
        "Behandelt Trainingsdaten als mögliche, nicht als einzige Ursache.",
        "Fordert kontrollierte Tests mit der konkreten Modellversion und ihrem Kontext.",
      ],
    },
    "lektion-3-halluzinationen": {
      question:
        "Du bittest ein KI-Modell, eine wissenschaftliche Quelle zu nennen, die deine These belegt. Das Modell nennt eine Studie mit Autor, Zeitschrift und Jahr. Was solltest du tun?",
      criteria: [
        "Prüft die Studie unabhängig in einer Literaturdatenbank oder Primärquelle.",
        "Verwendet die Angabe nicht, wenn sich die Studie nicht verifizieren lässt.",
      ],
    },
    "lektion-4-grenzen": {
      question:
        "Du verwendest ein KI-Modell, um aktuelle Informationen zu einem Gesetz zu erhalten. Welche Grenze ist hier besonders relevant?",
      criteria: [
        "Prüft Aktualität, Herkunft und tatsächlich genutzte Werkzeuge gegen den amtlichen Text.",
        "Zieht für die konkrete Rechtsfrage eine qualifizierte Fachperson hinzu.",
      ],
    },
  },
  en: {
    "lektion-1-vorhersage": {
      question:
        "How can a language model answer a question correctly without actually 'knowing' the answer?",
      criteria: [
        "Names learned patterns and prompt context as the basis of the continuation.",
        "Separates a plausible continuation from verification against an authoritative source.",
      ],
    },
    "lektion-2-trainingsdaten": {
      question:
        "An AI model automatically uses female pronouns in a text about nursing. Is that necessarily a programming error?",
      criteria: [
        "Treats training data as one possible cause, not the only cause.",
        "Calls for controlled tests with the actual model version and context.",
      ],
    },
    "lektion-3-halluzinationen": {
      question:
        "You ask an AI model for a scientific source supporting your claim. It names a study, author, journal, and year. What should you do?",
      criteria: [
        "Checks the study independently in a literature database or primary source.",
        "Does not use the citation when the study cannot be verified.",
      ],
    },
    "lektion-4-grenzen": {
      question:
        "You use an AI model to obtain current information about a law. Which limit is especially relevant?",
      criteria: [
        "Checks currency, origin, and actual tool use against the current official text.",
        "Involves a qualified professional for the specific legal question.",
      ],
    },
  },
};

export const WIE_KI_ERROR_COPY = {
  de: {
    eyebrow: "Lernsequenz",
    heading: "Die Lernsequenz konnte nicht geladen werden.",
    body: "Versuche es erneut. Dein Lernfortschritt auf anderen Seiten bleibt unverändert.",
    retry: "Erneut versuchen",
    back: "Zur Übersicht",
    notFoundHeading: "Seite nicht gefunden",
    notFoundBody:
      "Diese Lektion gehört nicht zur veröffentlichten Lernsequenz.",
  },
  en: {
    eyebrow: "Learning sequence",
    heading: "The learning sequence could not be loaded.",
    body: "Try again. Progress recorded on other pages remains unchanged.",
    retry: "Try again",
    back: "Back to the overview",
    notFoundHeading: "Lesson not found",
    notFoundBody: "This lesson is not part of the published learning sequence.",
  },
} as const satisfies Readonly<Record<Locale, Record<string, string>>>;

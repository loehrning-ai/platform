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
    previousLesson: "Vorherige Lektion",
    nextLesson: "Nächste Lektion",
    completedEyebrow: "Konzeptblock abgeschlossen",
    completedHeading:
      "Du kennst jetzt die grundlegende Arbeitsweise und Grenzen von KI.",
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
    previousLesson: "Previous lesson",
    nextLesson: "Next lesson",
    completedEyebrow: "Concept block complete",
    completedHeading: "You now know the basic operation and limits of AI.",
    completedBody:
      "Everyday AI Literacy applies these foundations to data rules, output review, and responsibility at work. It is free and requires no technical background.",
    driverLicense: "Go to Everyday AI Literacy",
    backToEntry: "Back to the introduction",
    schemaDescription:
      "A free lesson about how language models work and where their limits lie.",
  },
};

export const WIE_KI_COMPREHENSION_CHECKS: Readonly<
  Record<Locale, Readonly<Record<string, { question: string; answer: string }>>>
> = {
  de: {
    "lektion-1-vorhersage": {
      question:
        "Warum kann ein Sprachmodell eine Frage richtig beantworten, ohne die Antwort wirklich zu 'wissen'?",
      answer:
        "Weil die Modellparameter Beziehungen zwischen Begriffen aus dem Training abbilden und die Eingabe passenden Kontext liefert. Eine richtige Fortsetzung kann daraus entstehen, ohne dass die Generierung die Aussage gegen eine geprüfte Faktendatenbank verifiziert. Quellen oder Werkzeugergebnisse müssen getrennt geprüft werden.",
    },
    "lektion-2-trainingsdaten": {
      question:
        "Ein KI-Modell schreibt bei einem Text über Krankenpflege automatisch in der weiblichen Form. Ist das ein Programmierfehler?",
      answer:
        "Nein, nicht zwingend. Die Zuordnung kann aus Trainingsdaten stammen, aber auch Auswahl, Kennzeichnung, Trainingsziel oder Systemanweisung können sie beeinflussen. Um die Ursache und Wirkung zu bewerten, braucht es mehrere kontrollierte Tests mit der konkreten Modellversion.",
    },
    "lektion-3-halluzinationen": {
      question:
        "Du bittest ein KI-Modell, eine wissenschaftliche Quelle zu nennen, die deine These belegt. Das Modell nennt eine Studie mit Autor, Zeitschrift und Jahr. Was solltest du tun?",
      answer:
        "Prüfe die Quelle, bevor du sie verwendest. KI-Modelle können Quellen erfinden oder Angaben vermischen. Suche die Studie in einer Literaturdatenbank oder über eine Websuche. Wenn du sie nicht findest, gehe davon aus, dass sie nicht existiert.",
    },
    "lektion-4-grenzen": {
      question:
        "Du verwendest ein KI-Modell, um aktuelle Informationen zu einem Gesetz zu erhalten. Welche Grenze ist hier besonders relevant?",
      answer:
        "Die Aktualität und Herkunft der verwendeten Informationen. Ein System kann nur aus seinem Modellstand antworten oder zusätzlich Suche und andere Werkzeuge verwenden. Prüfe, welche Quellen tatsächlich genutzt wurden, öffne aktuelle amtliche Fassungen und beziehe für die konkrete Rechtsfrage eine qualifizierte Fachperson ein.",
    },
  },
  en: {
    "lektion-1-vorhersage": {
      question:
        "How can a language model answer a question correctly without actually 'knowing' the answer?",
      answer:
        "The model parameters encode relationships learned during training, and the prompt supplies relevant context. A correct continuation can result without the generation process verifying the claim against an authoritative fact database. Sources and tool results still require separate review.",
    },
    "lektion-2-trainingsdaten": {
      question:
        "An AI model automatically uses female pronouns in a text about nursing. Is that necessarily a programming error?",
      answer:
        "Not necessarily. The association may come from training data, but selection, labels, training objectives, or system instructions can also influence it. Assessing the cause and effect requires several controlled tests with the actual model version.",
    },
    "lektion-3-halluzinationen": {
      question:
        "You ask an AI model for a scientific source supporting your claim. It names a study, author, journal, and year. What should you do?",
      answer:
        "Check the source before using it. AI models can invent sources or combine details from different works. Search for the study in a literature database or through a web search. If you cannot find it, assume it does not exist.",
    },
    "lektion-4-grenzen": {
      question:
        "You use an AI model to obtain current information about a law. Which limit is especially relevant?",
      answer:
        "The currency and origin of the information. A system may answer from its model state or use search and other tools. Check which sources were actually used, open the current official text, and involve a qualified professional for the specific legal question.",
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

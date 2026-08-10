import type { Locale } from "@/lib/i18n/locale";

interface BoundaryCopy {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly retry: string;
  readonly back: string;
}

interface NotFoundCopy {
  readonly title: string;
  readonly body: string;
  readonly back: string;
}

export interface AiNativeOperatorCourseCopy {
  readonly landingMetadata: {
    readonly title: string;
    readonly description: string;
  };
  readonly landing: {
    readonly breadcrumbs: readonly [string, string, string];
    readonly eyebrow: string;
    readonly title: string;
    readonly start: string;
    readonly syllabusLink: string;
    readonly moduleCount: (count: number) => string;
    readonly lessonCount: (count: number) => string;
    readonly exerciseCount: (count: number) => string;
    readonly durationShort: string;
    readonly outcomesEyebrow: string;
    readonly outcomesTitle: string;
    readonly syllabusEyebrow: string;
    readonly syllabusMode: string;
    readonly syllabusTitle: string;
    readonly lessonUnit: (count: number) => string;
  };
  readonly module: {
    readonly breadcrumb: string;
    readonly moduleLabel: (number: string) => string;
    readonly lessons: string;
    readonly lessonUnit: (count: number) => string;
    readonly objectives: string;
    readonly begin: string;
    readonly notFoundTitle: string;
  };
  readonly lesson: {
    readonly course: string;
    readonly navLabel: string;
    readonly openNav: string;
    readonly closeNav: string;
    readonly lessonLabel: (module: string, lesson: number) => string;
    readonly knowledgeCheck: string;
    readonly reading: string;
    readonly minutes: (minutes: number) => string;
    readonly quizIntro: string;
    readonly quickCheck: string;
    readonly check: string;
    readonly answerOptions: string;
    readonly correct: string;
    readonly incorrect: string;
    readonly loadingProgress: string;
    readonly completed: string;
    readonly complete: string;
    readonly answerFirst: string;
    readonly previous: string;
    readonly nextLesson: string;
    readonly nextModule: (title: string) => string;
    readonly finalAssessment: string;
    readonly notFoundTitle: string;
  };
  readonly quizMetadata: {
    readonly title: string;
    readonly description: string;
  };
  readonly certificateMetadata: {
    readonly title: string;
    readonly description: string;
  };
  readonly verificationMetadata: {
    readonly title: string;
    readonly description: string;
  };
  readonly boundaries: {
    readonly course: BoundaryCopy;
    readonly module: BoundaryCopy;
    readonly lesson: BoundaryCopy;
  };
  readonly notFound: {
    readonly course: NotFoundCopy;
    readonly module: NotFoundCopy;
    readonly lesson: NotFoundCopy;
  };
}

const COPY: Readonly<Record<Locale, AiNativeOperatorCourseCopy>> = {
  en: {
    landingMetadata: {
      title: "AI-Native Operator: controlled model-assisted work",
      description:
        "Nine modules and 39 lessons on task selection, engineering, product boundaries, operations, people, organization, retrieval, governance, and measurement.",
    },
    landing: {
      breadcrumbs: ["Home", "Courses", "AI-Native Operator"],
      eyebrow: "Course on model-assisted operations",
      title: "AI-Native Operator",
      start: "Begin module 01",
      syllabusLink: "View syllabus",
      moduleCount: (count) => `${count} modules`,
      lessonCount: (count) => `${count} lessons`,
      exerciseCount: (count) => `${count} exercises`,
      durationShort: "About 14 hours",
      outcomesEyebrow: "Course outcomes",
      outcomesTitle: "Practices covered",
      syllabusEyebrow: "Syllabus",
      syllabusMode: "Nine modules · linear or self-directed",
      syllabusTitle: "Nine modules and 39 lessons",
      lessonUnit: (count) => `${count} ${count === 1 ? "lesson" : "lessons"}`,
    },
    module: {
      breadcrumb: "Course",
      moduleLabel: (number) => `Module ${number}`,
      lessons: "Lessons",
      lessonUnit: (count) => `${count} ${count === 1 ? "lesson" : "lessons"}`,
      objectives: "Learning objectives",
      begin: "Begin",
      notFoundTitle: "Module not found",
    },
    lesson: {
      course: "Course",
      navLabel: "Module navigation",
      openNav: "Open module navigation",
      closeNav: "Close module navigation",
      lessonLabel: (module, lesson) => `Lesson ${module}.${lesson}`,
      knowledgeCheck: "Knowledge check",
      reading: "Reading",
      minutes: (minutes) => `${minutes} min`,
      quizIntro:
        "Choose the best answer for each question. Answers are stored only with this browser's course progress.",
      quickCheck: "Knowledge check",
      check: "Check",
      answerOptions: "Answer options",
      correct: "Correct.",
      incorrect: "Not correct.",
      loadingProgress: "Loading progress",
      completed: "Lesson completed",
      complete: "Complete lesson",
      answerFirst: "Answer every question correctly first",
      previous: "Previous",
      nextLesson: "Next lesson",
      nextModule: (title) => `Next module: ${title}`,
      finalAssessment: "Continue to final assessment",
      notFoundTitle: "Lesson not found",
    },
    quizMetadata: {
      title: "Workshop quiz: AI-Native Operator",
      description:
        "Twenty-two questions from the nine module checks. Pass mark: 70 percent. Time limit: 28 minutes.",
    },
    certificateMetadata: {
      title: "Course completion record: AI-Native Operator",
      description:
        "Download a locally generated course completion record. It is not server-verified, externally assessed, or accredited.",
    },
    verificationMetadata: {
      title: "Read course-record data: AI-Native Operator",
      description:
        "Read the course-record data contained in a QR link. The data is not a cryptographic signature or server-side verification.",
    },
    boundaries: {
      course: {
        eyebrow: "Error",
        title: "The course could not be loaded",
        body: "The course page did not load. Stored progress remains unchanged.",
        retry: "Try again",
        back: "Back to courses",
      },
      module: {
        eyebrow: "Error",
        title: "The module could not be loaded",
        body: "The module page did not load. Stored progress remains unchanged.",
        retry: "Try again",
        back: "Back to course",
      },
      lesson: {
        eyebrow: "Error",
        title: "The lesson could not be loaded",
        body: "The lesson did not load. Stored progress remains unchanged.",
        retry: "Try again",
        back: "Back to course",
      },
    },
    notFound: {
      course: {
        title: "Course page not found",
        body: "The link is outdated or the course page has moved.",
        back: "Back to courses",
      },
      module: {
        title: "Module not found",
        body: "The link is invalid or the module does not exist.",
        back: "Back to course",
      },
      lesson: {
        title: "Lesson not found",
        body: "The link is invalid or the lesson does not exist.",
        back: "Back to course",
      },
    },
  },
  de: {
    landingMetadata: {
      title: "AI-Native Operator: kontrollierte modellgestützte Arbeit",
      description:
        "Neun Module und 39 Lektionen zu Aufgabenauswahl, Technik, Produktgrenzen, Betrieb, Personal, Organisation, Abruf, Steuerung und Messung.",
    },
    landing: {
      breadcrumbs: ["Start", "Kurse", "AI-Native Operator"],
      eyebrow: "Kurs zu modellgestütztem Betrieb",
      title: "AI-Native Operator",
      start: "Modul 01 beginnen",
      syllabusLink: "Lehrplan ansehen",
      moduleCount: (count) => `${count} Module`,
      lessonCount: (count) => `${count} Lektionen`,
      exerciseCount: (count) => `${count} Übungen`,
      durationShort: "Etwa 14 Stunden",
      outcomesEyebrow: "Kursziele",
      outcomesTitle: "Behandelte Praktiken",
      syllabusEyebrow: "Lehrplan",
      syllabusMode: "Neun Module · linear oder selbstgesteuert",
      syllabusTitle: "Neun Module und 39 Lektionen",
      lessonUnit: (count) =>
        `${count} ${count === 1 ? "Lektion" : "Lektionen"}`,
    },
    module: {
      breadcrumb: "Kurs",
      moduleLabel: (number) => `Modul ${number}`,
      lessons: "Lektionen",
      lessonUnit: (count) =>
        `${count} ${count === 1 ? "Lektion" : "Lektionen"}`,
      objectives: "Lernziele",
      begin: "Beginnen",
      notFoundTitle: "Modul nicht gefunden",
    },
    lesson: {
      course: "Kurs",
      navLabel: "Modulnavigation",
      openNav: "Modulnavigation öffnen",
      closeNav: "Modulnavigation schließen",
      lessonLabel: (module, lesson) => `Lektion ${module}.${lesson}`,
      knowledgeCheck: "Wissensprüfung",
      reading: "Lektüre",
      minutes: (minutes) => `${minutes} Min.`,
      quizIntro:
        "Wählen Sie zu jeder Frage die beste Antwort. Antworten werden nur mit dem Kursfortschritt dieses Browsers gespeichert.",
      quickCheck: "Wissensprüfung",
      check: "Prüfen",
      answerOptions: "Antwortmöglichkeiten",
      correct: "Richtig.",
      incorrect: "Nicht korrekt.",
      loadingProgress: "Fortschritt wird geladen",
      completed: "Lektion abgeschlossen",
      complete: "Lektion abschließen",
      answerFirst: "Zuerst alle Fragen richtig beantworten",
      previous: "Zurück",
      nextLesson: "Nächste Lektion",
      nextModule: (title) => `Nächstes Modul: ${title}`,
      finalAssessment: "Weiter zur Abschlussprüfung",
      notFoundTitle: "Lektion nicht gefunden",
    },
    quizMetadata: {
      title: "Abschlussquiz: AI-Native Operator",
      description:
        "22 Fragen aus den Wissensprüfungen der neun Module. 70 Prozent zum Bestehen. Zeitlimit: 28 Minuten.",
    },
    certificateMetadata: {
      title: "Teilnahmebestätigung: AI-Native Operator",
      description:
        "Laden Sie eine lokal erzeugte Teilnahmebestätigung herunter. Sie ist nicht servergeprüft, nicht fremdbewertet und nicht akkreditiert.",
    },
    verificationMetadata: {
      title: "Teilnahmedaten lesen: AI-Native Operator",
      description:
        "Lesen Sie die Teilnahmedaten aus einem QR-Link. Die Daten sind keine kryptografische Signatur oder serverseitige Prüfung.",
    },
    boundaries: {
      course: {
        eyebrow: "Fehler",
        title: "Der Kurs konnte nicht geladen werden",
        body: "Die Kursseite wurde nicht geladen. Gespeicherter Fortschritt bleibt unverändert.",
        retry: "Erneut versuchen",
        back: "Zurück zu den Kursen",
      },
      module: {
        eyebrow: "Fehler",
        title: "Das Modul konnte nicht geladen werden",
        body: "Die Modulseite wurde nicht geladen. Gespeicherter Fortschritt bleibt unverändert.",
        retry: "Erneut versuchen",
        back: "Zurück zum Kurs",
      },
      lesson: {
        eyebrow: "Fehler",
        title: "Die Lektion konnte nicht geladen werden",
        body: "Die Lektion wurde nicht geladen. Gespeicherter Fortschritt bleibt unverändert.",
        retry: "Erneut versuchen",
        back: "Zurück zum Kurs",
      },
    },
    notFound: {
      course: {
        title: "Kursseite nicht gefunden",
        body: "Der Link ist veraltet oder die Kursseite wurde verschoben.",
        back: "Zurück zu den Kursen",
      },
      module: {
        title: "Modul nicht gefunden",
        body: "Der Link ist ungültig oder das Modul ist nicht vorhanden.",
        back: "Zurück zum Kurs",
      },
      lesson: {
        title: "Lektion nicht gefunden",
        body: "Der Link ist ungültig oder die Lektion ist nicht vorhanden.",
        back: "Zurück zum Kurs",
      },
    },
  },
};

export function getAiNativeOperatorCourseCopy(
  locale: Locale,
): AiNativeOperatorCourseCopy {
  return COPY[locale];
}

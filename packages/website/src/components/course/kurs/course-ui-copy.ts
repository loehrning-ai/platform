import type { Locale } from "@/lib/i18n/locale";

export interface CourseReaderCopy {
  readonly block: {
    readonly notFoundTitle: string;
    readonly allBlocks: string;
    readonly blockPosition: (current: number, total: number) => string;
    readonly lessonCount: (count: number) => string;
    readonly minutes: (count: number) => string;
  };
  readonly shell: {
    readonly navigation: string;
    readonly open: string;
    readonly close: string;
  };
  readonly sidebar: {
    readonly navigation: string;
    readonly heading: string;
    readonly lessonLabel: (
      number: number,
      title: string,
      completed: boolean,
    ) => string;
    readonly minutes: (count: number) => string;
  };
  readonly lesson: {
    readonly position: (current: number, total: number) => string;
    readonly tablist: string;
    readonly learn: string;
    readonly quiz: string;
    readonly complete: string;
    readonly completed: string;
    readonly next: string;
    readonly legalNote: string;
  };
  readonly section: {
    readonly minutes: (count: number) => string;
    readonly takeaway: string;
    readonly readAnnouncement: string;
    readonly read: string;
    readonly markRead: string;
  };
  readonly quiz: {
    readonly empty: string;
    readonly correctFeedback: (explanation: string) => string;
    readonly incorrectFeedback: (explanation: string) => string;
    readonly completionAnnouncement: (score: number, total: number) => string;
    readonly score: (score: number, total: number) => string;
    readonly perfect: string;
    readonly partial: string;
    readonly retryLesson: string;
    readonly retry: string;
    readonly progress: (current: number, total: number) => string;
    readonly previousBest: (score: number, total: number) => string;
    readonly correctAnswer: string;
    readonly incorrectSelection: string;
    readonly correct: string;
    readonly incorrect: string;
    readonly next: string;
    readonly result: string;
  };
  readonly freshness: {
    readonly aria: (monthYear: string) => string;
    readonly label: string;
    readonly overdue: string;
    readonly dateLocale: string;
  };
}

export const COURSE_READER_COPY: Readonly<Record<Locale, CourseReaderCopy>> = {
  de: {
    block: {
      notFoundTitle: "Block nicht gefunden",
      allBlocks: "Alle Blöcke",
      blockPosition: (current, total) => `Block ${current} / ${total}`,
      lessonCount: (count) => `${count} Lektionen`,
      minutes: (count) => `${count} Min`,
    },
    shell: {
      navigation: "Lektionsnavigation",
      open: "Navigation öffnen",
      close: "Navigation schließen",
    },
    sidebar: {
      navigation: "Lektionsnavigation",
      heading: "Lektionen",
      lessonLabel: (number, title, completed) =>
        `Lektion ${number}: ${title}${completed ? " (abgeschlossen)" : ""}`,
      minutes: (count) => `${count} Min`,
    },
    lesson: {
      position: (current, total) => `Lektion ${current} von ${total}`,
      tablist: "Lektionsinhalt",
      learn: "Lernen",
      quiz: "Quiz",
      complete: "Lektion abschließen",
      completed: "Lektion abgeschlossen",
      next: "Nächste Lektion",
      legalNote:
        "Die blockbezogenen Prüfstände stehen oberhalb der Lektion. Keine Rechtsberatung.",
    },
    section: {
      minutes: (count) => `~${count} Min`,
      takeaway: "Kernaussage",
      readAnnouncement: "Abschnitt als gelesen markiert",
      read: "Gelesen",
      markRead: "Als gelesen markieren",
    },
    quiz: {
      empty: "Keine Quizfragen für diese Lektion verfügbar.",
      correctFeedback: (explanation) => `Richtig. ${explanation}`,
      incorrectFeedback: (explanation) => `Nicht korrekt. ${explanation}`,
      completionAnnouncement: (score, total) =>
        `Quiz abgeschlossen: ${score} von ${total} Fragen richtig.`,
      score: (score, total) => `${score}/${total} richtig`,
      perfect: "Alle Antworten richtig.",
      partial: "Gut gemacht! Versuch es nochmal für die volle Punktzahl.",
      retryLesson: "Lies die Lektion nochmal und versuch es noch einmal.",
      retry: "Nochmal",
      progress: (current, total) => `Frage ${current} von ${total}`,
      previousBest: (score, total) => `Bisher: ${score}/${total}`,
      correctAnswer: "Richtige Antwort.",
      incorrectSelection: "Ihre Auswahl ist falsch.",
      correct: "Richtig",
      incorrect: "Falsch",
      next: "Weiter",
      result: "Ergebnis",
    },
    freshness: {
      aria: (monthYear) => `Inhalt zuletzt geprüft: ${monthYear}`,
      label: "Stand",
      overdue: "Aktualisierung ausstehend",
      dateLocale: "de-DE",
    },
  },
  en: {
    block: {
      notFoundTitle: "Block not found",
      allBlocks: "All blocks",
      blockPosition: (current, total) => `Block ${current} / ${total}`,
      lessonCount: (count) => `${count} ${count === 1 ? "lesson" : "lessons"}`,
      minutes: (count) => `${count} min`,
    },
    shell: {
      navigation: "Lesson navigation",
      open: "Open lesson navigation",
      close: "Close lesson navigation",
    },
    sidebar: {
      navigation: "Lesson navigation",
      heading: "Lessons",
      lessonLabel: (number, title, completed) =>
        `Lesson ${number}: ${title}${completed ? " (complete)" : ""}`,
      minutes: (count) => `${count} min`,
    },
    lesson: {
      position: (current, total) => `Lesson ${current} of ${total}`,
      tablist: "Lesson content",
      learn: "Learn",
      quiz: "Quiz",
      complete: "Mark lesson complete",
      completed: "Lesson complete",
      next: "Next lesson",
      legalNote:
        "Block-specific review dates appear above the lesson. Not legal advice.",
    },
    section: {
      minutes: (count) => `~${count} min`,
      takeaway: "Key point",
      readAnnouncement: "Section marked as read",
      read: "Read",
      markRead: "Mark as read",
    },
    quiz: {
      empty: "No quiz questions are available for this lesson.",
      correctFeedback: (explanation) => `Correct. ${explanation}`,
      incorrectFeedback: (explanation) => `Incorrect. ${explanation}`,
      completionAnnouncement: (score, total) =>
        `Quiz complete: ${score} of ${total} questions correct.`,
      score: (score, total) => `${score}/${total} correct`,
      perfect: "All answers correct.",
      partial: "Review the explanations, then retry for a full score.",
      retryLesson: "Review the lesson, then try again.",
      retry: "Retry",
      progress: (current, total) => `Question ${current} of ${total}`,
      previousBest: (score, total) => `Best: ${score}/${total}`,
      correctAnswer: "Correct answer.",
      incorrectSelection: "Your selection is incorrect.",
      correct: "Correct",
      incorrect: "Incorrect",
      next: "Next",
      result: "Result",
    },
    freshness: {
      aria: (monthYear) => `Content last reviewed: ${monthYear}`,
      label: "Reviewed",
      overdue: "Review overdue",
      dateLocale: "en-GB",
    },
  },
};

export function getCourseReaderCopy(locale: Locale): CourseReaderCopy {
  return COURSE_READER_COPY[locale];
}

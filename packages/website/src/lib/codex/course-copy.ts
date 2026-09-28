import type { Locale } from "@/lib/i18n/locale";

export interface CodexCourseCopy {
  readonly landingMetadata: {
    readonly title: string;
    readonly description: string;
  };
  readonly landing: {
    readonly eyebrow: string;
    readonly title: string;
    readonly intro: string;
    readonly start: string;
    readonly map: string;
    readonly facts: readonly string[];
    readonly courseEyebrow: string;
    readonly courseTitle: string;
    readonly lessonLabel: (number: number) => string;
    readonly breadcrumbs: readonly [string, string, string];
    readonly jsonLdDescription: string;
  };
  readonly indexMetadata: {
    readonly title: string;
    readonly description: string;
  };
  readonly index: {
    readonly eyebrow: string;
    readonly title: string;
    readonly intro: string;
    readonly trackLabel: (number: number) => string;
    readonly lessonLabel: (number: number) => string;
    readonly duration: (minutes: number) => string;
  };
  readonly reader: {
    readonly navLabel: string;
    readonly progress: (number: number, total: number) => string;
    readonly duration: (minutes: number) => string;
    readonly takeaway: string;
    readonly read: string;
    readonly markRead: string;
    readonly practiceTitle: string;
    readonly practiceBody: string;
    readonly complete: string;
    readonly completed: string;
    readonly next: string;
    readonly previous: string;
    readonly notFoundTitle: string;
  };
  readonly certificateMetadata: {
    readonly title: string;
    readonly description: string;
  };
  readonly verificationMetadata: {
    readonly title: string;
    readonly description: string;
  };
  readonly error: {
    readonly title: string;
    readonly body: string;
    readonly retry: string;
    readonly back: string;
  };
  readonly notFound: {
    readonly title: string;
    readonly body: string;
    readonly back: string;
  };
}

export const CODEX_COURSE_COPY = Object.freeze({
  de: {
    landingMetadata: {
      title: "Codex-Kurs: Aufträge für den Coding-Agenten präzise steuern",
      description:
        "Zwölf Lektionen zu Sandbox, AGENTS.md, Spezifikation, Review und paralleler Arbeit mit Codex.",
    },
    landing: {
      eyebrow: "Codex / Kurs",
      title: "Codex im Repository steuern.",
      intro:
        "Du gibst Codex Kontext, grenzt die Änderung ab, verlangst Nachweise und liest den Diff vor dem Merge.",
      start: "Lektion 01 starten",
      map: "Kursübersicht",
      facts: [
        "12 Lektionen",
        "4 Tracks",
        "Abschlussfall in Lektion 12",
        "eine Übung pro Lektion",
      ],
      courseEyebrow: "Kursaufbau",
      courseTitle: "Zwölf Lektionen in vier Tracks.",
      lessonLabel: (number) => `Lektion ${number}`,
      breadcrumbs: ["Start", "Kurse", "Codex-Kurs"],
      jsonLdDescription:
        "Zwölf Lektionen zur kontrollierten Arbeit mit Codex.",
    },
    indexMetadata: {
      title: "Lektionen: Codex-Kurs",
      description:
        "Die zwölf Lektionen des Codex-Kurses in vier Tracks.",
    },
    index: {
      eyebrow: "Kursübersicht",
      title: "Zwölf Lektionen in vier Tracks.",
      intro: "Arbeite der Reihe nach. Lektion 12 ist der Abschlussfall.",
      trackLabel: (number) => `Track ${String(number).padStart(2, "0")}`,
      lessonLabel: (number) => `Lektion ${number}`,
      duration: (minutes) => `${minutes} Min. Lesedauer`,
    },
    reader: {
      navLabel: "Lektionsnavigation",
      progress: (number, total) => `Lektion ${number} von ${total}`,
      duration: (minutes) => `ca. ${minutes} Min.`,
      takeaway: "Kernaussage",
      read: "Gelesen",
      markRead: "Als gelesen markieren",
      practiceTitle: "Praxisübung",
      practiceBody:
        "Die Simulation speichert nur ihren lokalen Checkpoint.",
      complete: "Lektion abschließen",
      completed: "Lektion abgeschlossen",
      next: "Nächste Lektion →",
      previous: "← Vorherige Lektion",
      notFoundTitle: "Lektion nicht gefunden",
    },
    certificateMetadata: {
      title: "Teilnahmebestätigung: Codex-Kurs",
      description:
        "Lokale Teilnahmebestätigung für den Codex-Kurs herunterladen.",
    },
    verificationMetadata: {
      title: "Zertifikatdaten lesen: Codex-Kurs",
      description:
        "Liest die lokal kodierten Daten einer Teilnahmebestätigung. Sie sind nicht servergeprüft und nicht kryptografisch signiert.",
    },
    error: {
      title: "Codex-Kurs konnte nicht geladen werden",
      body: "Die Kursansicht ist fehlgeschlagen. Dein Lernstand ist unverändert.",
      retry: "Erneut laden",
      back: "Zur Kursübersicht",
    },
    notFound: {
      title: "Codex-Lektion nicht gefunden",
      body: "Diese Lektion gibt es im Kurs nicht.",
      back: "Alle Lektionen anzeigen",
    },
  },
  en: {
    landingMetadata: {
      title: "Codex Course: precise task control for the coding agent",
      description:
        "Twelve lessons on the Codex sandbox, AGENTS.md, specifications, review, and parallel work.",
    },
    landing: {
      eyebrow: "Codex / course",
      title: "Steer Codex in your repo.",
      intro:
        "Give Codex context, bound the change, require evidence, and read the diff before merge.",
      start: "Start lesson 01",
      map: "Course map",
      facts: [
        "12 lessons",
        "4 tracks",
        "capstone in lesson 12",
        "one exercise per lesson",
      ],
      courseEyebrow: "Course structure",
      courseTitle: "Twelve lessons in four tracks.",
      lessonLabel: (number) => `Lesson ${number}`,
      breadcrumbs: ["Home", "Courses", "Codex Course"],
      jsonLdDescription:
        "Twelve lessons on controlled work with Codex.",
    },
    indexMetadata: {
      title: "Lessons: Codex Course",
      description:
        "The twelve Codex Course lessons in four tracks.",
    },
    index: {
      eyebrow: "Course map",
      title: "Twelve lessons in four tracks.",
      intro: "Work in order. Lesson 12 is the capstone.",
      trackLabel: (number) => `Track ${String(number).padStart(2, "0")}`,
      lessonLabel: (number) => `Lesson ${number}`,
      duration: (minutes) => `${minutes} min read`,
    },
    reader: {
      navLabel: "Lesson navigation",
      progress: (number, total) => `Lesson ${number} of ${total}`,
      duration: (minutes) => `about ${minutes} min`,
      takeaway: "Key takeaway",
      read: "Read",
      markRead: "Mark as read",
      practiceTitle: "Practice exercise",
      practiceBody:
        "The simulation stores only its local checkpoint.",
      complete: "Complete lesson",
      completed: "Lesson complete",
      next: "Next lesson →",
      previous: "← Previous lesson",
      notFoundTitle: "Lesson not found",
    },
    certificateMetadata: {
      title: "Certificate of participation: Codex Course",
      description:
        "Download the local completion record for the Codex Course.",
    },
    verificationMetadata: {
      title: "Read completion-record data: Codex Course",
      description:
        "Reads the locally encoded data of a completion record. The data is not server-verified or cryptographically signed.",
    },
    error: {
      title: "The Codex Course could not load",
      body: "The course view failed. Your progress is unchanged.",
      retry: "Reload",
      back: "Back to course map",
    },
    notFound: {
      title: "Codex lesson not found",
      body: "This course has no such lesson.",
      back: "View all lessons",
    },
  },
}) satisfies Readonly<Record<Locale, CodexCourseCopy>>;

export function getCodexCourseCopy(locale: Locale): CodexCourseCopy {
  return CODEX_COURSE_COPY[locale];
}

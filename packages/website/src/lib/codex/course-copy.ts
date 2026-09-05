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
    readonly courseIntro: string;
    readonly lessonLabel: (number: number) => string;
    readonly finalEyebrow: string;
    readonly finalTitle: string;
    readonly finalBody: string;
    readonly finalCta: string;
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
        "Zwölf Lektionen zu Arbeitsmodell, Sandbox, AGENTS.md, Spezifikation, Review, Iteration, Werkzeugen und paralleler Arbeit mit Codex.",
    },
    landing: {
      eyebrow: "Codex / Kurs",
      title: "Codex kontrolliert im Repository einsetzen.",
      intro:
        "Der Kurs behandelt Codex als auftragsorientierten Coding-Agenten: Kontext bereitstellen, Änderungen abgrenzen, Nachweise verlangen und den Diff vor dem Merge lesen.",
      start: "Lektion 01 starten",
      map: "Kursübersicht",
      facts: [
        "12 Lektionen",
        "4 aufeinander aufbauende Tracks",
        "Abschlussfall in Lektion 12",
        "eine Übung pro Lektion",
      ],
      courseEyebrow: "Kursaufbau",
      courseTitle: "Vier Tracks. Zwölf Lektionen. Ein Abschlussfall.",
      courseIntro:
        "Erst das Arbeitsmodell. Dann Spezifikation, Umfang und Akzeptanz. Am Ende ein vollständiger, prüfbarer Ablauf.",
      lessonLabel: (number) => `Lektion ${number}`,
      finalEyebrow: "Einstieg",
      finalTitle: "Lektion 01: das Arbeitsmodell",
      finalBody:
        "Die erste Lektion trennt begrenzte Repository-Aufträge von Autovervollständigung und Chat. Danach betrachtest du Aufgabe, Repository-Kontext und Ausführungsgrenze als einen zusammenhängenden Rahmen.",
      finalCta: "Beginnen",
      breadcrumbs: ["Start", "Kurse", "Codex-Kurs"],
      jsonLdDescription:
        "Zwölf Lektionen zur kontrollierten Arbeit mit Codex über vier Tracks.",
    },
    indexMetadata: {
      title: "Lektionen: Codex-Kurs",
      description:
        "Alle zwölf Lektionen des Codex-Kurses in vier Tracks: Grundlagen, Auftragsgestaltung, Arbeitszyklus und fortgeschrittene Integration.",
    },
    index: {
      eyebrow: "Kursübersicht",
      title: "Vier Tracks. Zwölf Lektionen.",
      intro:
        "Arbeite die Lektionen in Reihenfolge durch. Der Abschlussfall verbindet Spezifikation, Lauf, Review und Iteration.",
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
        "Bearbeite die Simulation. Sie speichert nur den zugehörigen lokalen Checkpoint.",
      complete: "Lektion abschließen",
      completed: "Lektion abgeschlossen",
      next: "Nächste Lektion →",
      previous: "← Vorherige Lektion",
      notFoundTitle: "Lektion nicht gefunden",
    },
    certificateMetadata: {
      title: "Teilnahmebestätigung: Codex-Kurs",
      description:
        "Lokale Teilnahmebestätigung für den abgeschlossenen Codex-Kurs herunterladen.",
    },
    verificationMetadata: {
      title: "Teilnahmebestätigungsdaten prüfen: Codex-Kurs",
      description:
        "Lokal kodierte Daten einer Codex-Kurs-Teilnahmebestätigung lesen. Die Daten sind nicht servergeprüft oder kryptografisch signiert.",
    },
    error: {
      title: "Codex-Kurs konnte nicht geladen werden",
      body: "Die Kursansicht ist in diesem Browserlauf fehlgeschlagen. Es wurde kein Lernstand verändert.",
      retry: "Erneut laden",
      back: "Zur Kursübersicht",
    },
    notFound: {
      title: "Codex-Lektion nicht gefunden",
      body: "Die angeforderte Lektions-ID gehört nicht zu diesem Kurs.",
      back: "Alle Lektionen anzeigen",
    },
  },
  en: {
    landingMetadata: {
      title: "Codex Course: precise task control for the coding agent",
      description:
        "Twelve lessons on the Codex operating model, sandbox, AGENTS.md, specifications, review, iteration, tools, and parallel work.",
    },
    landing: {
      eyebrow: "Codex / course",
      title: "Use Codex under explicit repository controls.",
      intro:
        "Codex is treated here as a task-oriented coding agent. Supply the context, bound the change, require evidence, read the diff before merge.",
      start: "Start lesson 01",
      map: "Course map",
      facts: [
        "12 lessons",
        "4 sequential tracks",
        "capstone in lesson 12",
        "one exercise per lesson",
      ],
      courseEyebrow: "Course structure",
      courseTitle: "Four tracks. Twelve lessons. One capstone.",
      courseIntro:
        "Start with the operating model. Then define specification, scope, and acceptance. Finish with a complete, reviewable workflow.",
      lessonLabel: (number) => `Lesson ${number}`,
      finalEyebrow: "Entry point",
      finalTitle: "Lesson 01: the operating model",
      finalBody:
        "The first lesson separates bounded repository tasks from autocomplete and chat. After that, task, repository context and execution boundary read as one operating contract.",
      finalCta: "Begin",
      breadcrumbs: ["Home", "Courses", "Codex Course"],
      jsonLdDescription:
        "Twelve lessons on controlled work with Codex across four tracks.",
    },
    indexMetadata: {
      title: "Lessons: Codex Course",
      description:
        "All twelve Codex Course lessons across four tracks: fundamentals, task craft, the review loop, and advanced integration.",
    },
    index: {
      eyebrow: "Course map",
      title: "Four tracks. Twelve lessons.",
      intro:
        "Work through the lessons in order. The capstone combines specification, execution, review, and iteration.",
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
        "Work through the simulation. It stores only the corresponding local checkpoint.",
      complete: "Complete lesson",
      completed: "Lesson complete",
      next: "Next lesson →",
      previous: "← Previous lesson",
      notFoundTitle: "Lesson not found",
    },
    certificateMetadata: {
      title: "Certificate of completion: Codex Course",
      description:
        "Download the locally generated completion record for the Codex Course.",
    },
    verificationMetadata: {
      title: "Read completion-record data: Codex Course",
      description:
        "Read locally encoded Codex Course completion data. The data is not server-verified or cryptographically signed.",
    },
    error: {
      title: "The Codex Course could not load",
      body: "The course view failed in this browser session. No learning progress was changed.",
      retry: "Reload",
      back: "Back to course map",
    },
    notFound: {
      title: "Codex lesson not found",
      body: "The requested lesson ID does not belong to this course.",
      back: "View all lessons",
    },
  },
}) satisfies Readonly<Record<Locale, CodexCourseCopy>>;

export function getCodexCourseCopy(locale: Locale): CodexCourseCopy {
  return CODEX_COURSE_COPY[locale];
}

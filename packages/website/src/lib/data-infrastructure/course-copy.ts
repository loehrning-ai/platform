import type { Locale } from "@/lib/i18n/locale";

export interface DataInfraCourseCopy {
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
    readonly stats: readonly {
      readonly value: string;
      readonly label: string;
    }[];
    readonly courseEyebrow: string;
    readonly courseTitle: string;
    readonly lessonLabel: (number: number) => string;
    readonly progressEyebrow: string;
    readonly progressTitle: string;
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
    readonly simulatorTitle: (plural: boolean) => string;
    readonly simulatorBody: string;
    readonly complete: string;
    readonly completed: string;
    readonly next: string;
    readonly previous: string;
    readonly notFoundTitle: string;
  };
  readonly progress: {
    readonly overall: string;
    readonly lessons: string;
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

export const DATA_INFRA_COURSE_COPY = Object.freeze({
  de: {
    landingMetadata: {
      title: "Data Infrastructure: Systemdesign für Datenplattformen",
      description:
        "Zwölf Lektionen zu Datenmodellen, Speicherformaten, Batch, Streaming, CDC und Datenqualität.",
    },
    landing: {
      eyebrow: "Data Infrastructure / Kurs",
      title: "Datenplattformen anhand ihrer Systemgrenzen entwerfen.",
      intro:
        "Du verfolgst Daten von der Quelle bis zur Nutzung. Jede Lektion benennt Entscheidung, Ausfallmodus und Betriebsnachweis.",
      start: "Lektion 01 starten",
      map: "Kursübersicht",
      facts: [
        "12 Lektionen",
        "4 Tracks",
        "14 interaktive Modelle",
        "Systemdesign-Fall in Lektion 12",
      ],
      stats: [
        { value: "12", label: "Lektionen" },
        { value: "14", label: "interaktive Modelle" },
        { value: "4", label: "Tracks" },
        { value: "System", label: "Entwurfsprüfung" },
      ],
      courseEyebrow: "Kursaufbau",
      courseTitle: "Zwölf Lektionen in vier Tracks.",
      lessonLabel: (number) => `Lektion ${String(number).padStart(2, "0")}`,
      progressEyebrow: "Lernstand",
      progressTitle: "Fortschritt pro Track auf diesem Gerät.",
      breadcrumbs: ["Start", "Kurse", "Data Infrastructure"],
      jsonLdDescription:
        "Zwölf Lektionen zum Systemdesign von Datenplattformen.",
    },
    indexMetadata: {
      title: "Lektionen: Data Infrastructure",
      description:
        "Zwölf Lektionen zu Speicherung, Datentransport und Betrieb von Datenplattformen.",
    },
    index: {
      eyebrow: "Kursübersicht",
      title: "Zwölf Lektionen in vier Tracks.",
      intro: "Arbeite der Reihe nach. Lektion 12 ist der Systemdesign-Fall.",
      trackLabel: (number) => `Track ${String(number).padStart(2, "0")}`,
      lessonLabel: (number) => `Lektion ${String(number).padStart(2, "0")}`,
      duration: (minutes) => `geschätzt ${minutes} Min.`,
    },
    reader: {
      navLabel: "Lektionsnavigation",
      progress: (number, total) => `Lektion ${number} von ${total}`,
      duration: (minutes) => `geschätzt ${minutes} Min.`,
      takeaway: "Kernaussage",
      read: "Gelesen",
      markRead: "Als gelesen markieren",
      simulatorTitle: (plural) =>
        plural ? "Interaktive Modelle" : "Interaktives Modell",
      simulatorBody:
        "Die Modelle nutzen feste Beispieldaten und vereinfachte Regeln; sie messen weder Produktleistung noch reale Latenz oder Kapazität.",
      complete: "Lektion abschließen",
      completed: "Lektion abgeschlossen",
      next: "Nächste Lektion →",
      previous: "← Vorherige Lektion",
      notFoundTitle: "Lektion nicht gefunden",
    },
    progress: { overall: "Gesamtfortschritt", lessons: "Lektionen" },
    certificateMetadata: {
      title: "Teilnahmebestätigung: Data Infrastructure",
      description:
        "Lokale Teilnahmebestätigung für Data Infrastructure herunterladen.",
    },
    verificationMetadata: {
      title: "Teilnahmebestätigungsdaten prüfen: Data Infrastructure",
      description:
        "Lokal kodierte Abschlussdaten lesen, nicht servergeprüft oder signiert.",
    },
    error: {
      title: "Data Infrastructure konnte nicht geladen werden",
      body: "Die Kursansicht ist fehlgeschlagen. Dein Lernstand ist unverändert.",
      retry: "Erneut laden",
      back: "Zur Kursübersicht",
    },
    notFound: {
      title: "Lektion nicht gefunden",
      body: "Diese Lektion gibt es in Data Infrastructure nicht.",
      back: "Alle Lektionen anzeigen",
    },
  },
  en: {
    landingMetadata: {
      title: "Data Infrastructure: system design for data platforms",
      description:
        "Twelve lessons on data models, storage formats, batch, streaming, CDC, and data quality.",
    },
    landing: {
      eyebrow: "Data Infrastructure / course",
      title: "Design data platforms from explicit system boundaries.",
      intro:
        "Follow data from source to use. Each lesson names a decision, a failure mode, and operating evidence.",
      start: "Start lesson 01",
      map: "Course map",
      facts: [
        "12 lessons",
        "4 tracks",
        "14 interactive models",
        "system-design case in lesson 12",
      ],
      stats: [
        { value: "12", label: "lessons" },
        { value: "14", label: "interactive models" },
        { value: "4", label: "tracks" },
        { value: "system", label: "design review" },
      ],
      courseEyebrow: "Course structure",
      courseTitle: "Twelve lessons in four tracks.",
      lessonLabel: (number) => `Lesson ${String(number).padStart(2, "0")}`,
      progressEyebrow: "Progress",
      progressTitle: "Track progress on this device.",
      breadcrumbs: ["Home", "Courses", "Data Infrastructure"],
      jsonLdDescription:
        "Twelve lessons on data-platform system design.",
    },
    indexMetadata: {
      title: "Lessons: Data Infrastructure",
      description:
        "Twelve lessons on storage, data movement, and operating data platforms.",
    },
    index: {
      eyebrow: "Course map",
      title: "Twelve lessons in four tracks.",
      intro: "Work in order. Lesson 12 is the system-design case.",
      trackLabel: (number) => `Track ${String(number).padStart(2, "0")}`,
      lessonLabel: (number) => `Lesson ${String(number).padStart(2, "0")}`,
      duration: (minutes) => `estimated ${minutes} min`,
    },
    reader: {
      navLabel: "Lesson navigation",
      progress: (number, total) => `Lesson ${number} of ${total}`,
      duration: (minutes) => `estimated ${minutes} min`,
      takeaway: "Key takeaway",
      read: "Read",
      markRead: "Mark as read",
      simulatorTitle: (plural) =>
        plural ? "Interactive models" : "Interactive model",
      simulatorBody:
        "These models use fixed sample data and simplified rules; they do not benchmark product latency, throughput, or capacity.",
      complete: "Complete lesson",
      completed: "Lesson complete",
      next: "Next lesson →",
      previous: "← Previous lesson",
      notFoundTitle: "Lesson not found",
    },
    progress: { overall: "Overall progress", lessons: "lessons" },
    certificateMetadata: {
      title: "Certificate of participation: Data Infrastructure",
      description:
        "Download the local completion record for Data Infrastructure.",
    },
    verificationMetadata: {
      title: "Read completion-record data: Data Infrastructure",
      description:
        "Read locally encoded completion data, not server-verified or signed.",
    },
    error: {
      title: "Data Infrastructure could not load",
      body: "The course view failed. Your progress is unchanged.",
      retry: "Reload",
      back: "Back to course map",
    },
    notFound: {
      title: "Lesson not found",
      body: "Data Infrastructure has no such lesson.",
      back: "View all lessons",
    },
  },
}) satisfies Readonly<Record<Locale, DataInfraCourseCopy>>;

export function getDataInfraCourseCopy(locale: Locale): DataInfraCourseCopy {
  return DATA_INFRA_COURSE_COPY[locale];
}

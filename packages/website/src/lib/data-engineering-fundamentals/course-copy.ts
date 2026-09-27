import type { Locale } from "@/lib/i18n/locale";
import type { DefChapterId } from "./types";

export interface DataEngineeringFundamentalsCourseCopy {
  readonly landingMetadata: {
    readonly title: string;
    readonly description: string;
  };
  readonly landing: {
    readonly eyebrow: string;
    readonly title: string;
    readonly intro: string;
    readonly start: string;
    readonly browse: string;
    readonly facts: readonly string[];
    readonly courseEyebrow: string;
    readonly courseTitle: string;
    readonly chapterLabel: (displayNumber: string, id: DefChapterId) => string;
    readonly duration: (minutes: number) => string;
    readonly breadcrumbs: readonly [string, string, string];
    readonly jsonLdDescription: string;
  };
  readonly reader: {
    readonly navLabel: string;
    readonly openNavLabel: string;
    readonly closeNavLabel: string;
    readonly paginationLabel: string;
    readonly previous: string;
    readonly next: string;
    readonly certificate: string;
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
    readonly eyebrow: string;
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
  readonly socialImage: {
    readonly eyebrow: string;
    readonly description: string;
    readonly facts: readonly string[];
    readonly topics: readonly string[];
  };
}

export const DATA_ENGINEERING_FUNDAMENTALS_COURSE_COPY = Object.freeze({
  de: {
    landingMetadata: {
      title:
        "Data Engineering Fundamentals: Datenpipelines von der Quelle bis zur Bereitstellung",
      description:
        "Zwölf Kapitel und 17 Simulationen zu Speicherformaten, Streaming, Orchestrierung, Datenqualität und Governance.",
    },
    landing: {
      eyebrow: "Data Engineering / Grundlagen",
      title: "Datenpipelines Station für Station.",
      intro:
        "Zu jeder Station probierst du die Entscheidung in einer Simulation aus.",
      start: "Überblick öffnen",
      browse: "Kapitel anzeigen",
      facts: [
        "12 Kapitel",
        "17 interaktive Simulationen",
        "ca. 90 Minuten",
        "ohne Anmeldung",
      ],
      courseEyebrow: "Kursaufbau",
      courseTitle: "Zwölf Kapitel entlang einer Pipeline.",
      chapterLabel: (displayNumber, id) =>
        id === "home" ? "Kursüberblick" : `Kapitel ${displayNumber}`,
      duration: (minutes) => `${minutes} Min.`,
      breadcrumbs: ["Start", "Kurse", "Data Engineering Fundamentals"],
      jsonLdDescription:
        "Zwölf Kapitel zu Entwurf und Betrieb von Datenpipelines, mit 17 Simulationen und Abschlussprojekt.",
    },
    reader: {
      navLabel: "Kapitelnavigation",
      openNavLabel: "Kapitelnavigation öffnen",
      closeNavLabel: "Kapitelnavigation schließen",
      paginationLabel: "Kapitel wechseln",
      previous: "← Vorheriges Kapitel",
      next: "Nächstes Kapitel →",
      certificate: "Teilnahmebestätigung öffnen →",
      notFoundTitle: "Kapitel nicht gefunden",
    },
    certificateMetadata: {
      title: "Teilnahmebestätigung: Data Engineering Fundamentals",
      description:
        "Lokale Teilnahmebestätigung für Data Engineering Fundamentals herunterladen.",
    },
    verificationMetadata: {
      title: "Zertifikatdaten lesen: Data Engineering Fundamentals",
      description:
        "Liest die lokal kodierten Daten einer Teilnahmebestätigung. Sie sind nicht servergeprüft und nicht kryptografisch signiert.",
    },
    error: {
      eyebrow: "Data Engineering / Fehler",
      title: "Das Kapitel konnte nicht geladen werden",
      body: "Die Kursansicht ist fehlgeschlagen. Dein Lernstand ist unverändert.",
      retry: "Erneut laden",
      back: "Zur Kursübersicht",
    },
    notFound: {
      title: "Kapitel nicht gefunden",
      body: "Dieses Kapitel gibt es im Kurs nicht.",
      back: "Alle Kapitel anzeigen",
    },
    socialImage: {
      eyebrow: "Open-Source-Kurs",
      description:
        "Zwölf Kapitel und 17 Simulationen zu Entwurf und Betrieb von Datenpipelines.",
      facts: ["MIT", "kostenlos", "im Browser"],
      topics: ["Speicher", "Streaming", "Orchestrierung", "Datenqualität"],
    },
  },
  en: {
    landingMetadata: {
      title:
        "Data Engineering Fundamentals: data pipelines from source to serving",
      description:
        "Twelve chapters and 17 simulations on storage formats, streaming, orchestration, data quality, and governance.",
    },
    landing: {
      eyebrow: "Data engineering / fundamentals",
      title: "Understand a data pipeline stage by stage.",
      intro:
        "At each stage you try the decision in a simulation.",
      start: "Open the overview",
      browse: "View the chapters",
      facts: [
        "12 chapters",
        "17 interactive simulations",
        "about 90 minutes",
        "no account required",
      ],
      courseEyebrow: "Course structure",
      courseTitle: "Twelve chapters along one pipeline.",
      chapterLabel: (displayNumber, id) =>
        id === "home" ? "Course overview" : `Chapter ${displayNumber}`,
      duration: (minutes) => `${minutes} min`,
      breadcrumbs: ["Home", "Courses", "Data Engineering Fundamentals"],
      jsonLdDescription:
        "Twelve chapters on data-pipeline design and operation, with 17 simulations and a capstone.",
    },
    reader: {
      navLabel: "Chapter navigation",
      openNavLabel: "Open chapter navigation",
      closeNavLabel: "Close chapter navigation",
      paginationLabel: "Change chapter",
      previous: "← Previous chapter",
      next: "Next chapter →",
      certificate: "Open completion record →",
      notFoundTitle: "Chapter not found",
    },
    certificateMetadata: {
      title: "Certificate of participation: Data Engineering Fundamentals",
      description:
        "Download the local completion record for Data Engineering Fundamentals.",
    },
    verificationMetadata: {
      title: "Read completion-record data: Data Engineering Fundamentals",
      description:
        "Reads the locally encoded data of a completion record. The data is not server-verified or cryptographically signed.",
    },
    error: {
      eyebrow: "Data Engineering / error",
      title: "The chapter could not load",
      body: "The course view failed. Your progress is unchanged.",
      retry: "Reload",
      back: "Back to course overview",
    },
    notFound: {
      title: "Chapter not found",
      body: "This course has no such chapter.",
      back: "View all chapters",
    },
    socialImage: {
      eyebrow: "Open-source course",
      description:
        "Twelve chapters and 17 simulations on data-pipeline design and operation.",
      facts: ["MIT", "free", "browser-based"],
      topics: ["storage", "streaming", "orchestration", "data quality"],
    },
  },
}) satisfies Readonly<Record<Locale, DataEngineeringFundamentalsCourseCopy>>;

export function getDataEngineeringFundamentalsCourseCopy(
  locale: Locale,
): DataEngineeringFundamentalsCourseCopy {
  return DATA_ENGINEERING_FUNDAMENTALS_COURSE_COPY[locale];
}

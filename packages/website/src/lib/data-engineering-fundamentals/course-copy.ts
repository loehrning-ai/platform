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
    readonly stats: readonly {
      readonly value: string;
      readonly label: string;
    }[];
    readonly courseEyebrow: string;
    readonly courseTitle: string;
    readonly courseIntro: string;
    readonly chapterLabel: (displayNumber: string, id: DefChapterId) => string;
    readonly duration: (minutes: number) => string;
    readonly finalEyebrow: string;
    readonly finalTitle: string;
    readonly finalBody: string;
    readonly finalCta: string;
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
        "Zwölf Kapitel und 17 interaktive Simulationen zu Speicherformaten, Datenaufnahme, Streaming, Verarbeitung, Orchestrierung, Qualität, Bereitstellung und Governance.",
    },
    landing: {
      eyebrow: "Data Engineering / Grundlagen",
      title: "Datenpipelines als zusammenhängendes System verstehen.",
      intro:
        "Der Kurs verfolgt Daten von der Quelle bis zur Nutzung. Er erklärt Ereigniszeit, Dateiformate, verteilte Verarbeitung, Idempotenz, Qualitätsprüfungen, Metadaten, Metrikschichten und Freigabeschranken anhand ausführbarer Simulationen.",
      start: "Überblick öffnen",
      browse: "Kapitel anzeigen",
      facts: [
        "12 Kapitel",
        "17 interaktive Simulationen",
        "ca. 90 Minuten",
        "ohne Anmeldung",
      ],
      stats: [
        { value: "12", label: "Kapitel" },
        { value: "17", label: "Simulationen" },
        { value: "10", label: "Pipeline-Stationen" },
        { value: "1", label: "Abschlussprojekt" },
      ],
      courseEyebrow: "Kursaufbau",
      courseTitle: "Eine Pipeline. Zwölf Kapitel. Ein durchgängiger Fall.",
      courseIntro:
        "Die Kapitel bauen aufeinander auf. Beginne mit Speicher und Abfrage-Engines, verfolge danach den Datenfluss und untersuche im Abschlussprojekt sechs ausgewählte Kurskontrollen gemeinsam.",
      chapterLabel: (displayNumber, id) =>
        id === "home" ? "Kursüberblick" : `Kapitel ${displayNumber}`,
      duration: (minutes) => `${minutes} Min.`,
      finalEyebrow: "Einstieg",
      finalTitle: "Zuerst die vollständige Pipeline ansehen.",
      finalBody:
        "Der Überblick ordnet jede technische Entscheidung einer Pipeline-Station zu. Danach behandelt jedes Kapitel einen Teil des Systems im Detail.",
      finalCta: "Überblick starten",
      breadcrumbs: ["Start", "Kurse", "Data Engineering Fundamentals"],
      jsonLdDescription:
        "Zwölf Kapitel zu Entwurf und Betrieb von Datenpipelines mit 17 interaktiven Simulationen und einem durchgängigen Abschlussprojekt.",
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
        "Lokale Teilnahmebestätigung für den abgeschlossenen Kurs Data Engineering Fundamentals herunterladen.",
    },
    verificationMetadata: {
      title: "Teilnahmebestätigungsdaten lesen: Data Engineering Fundamentals",
      description:
        "Lokal kodierte Abschlussdaten lesen. Die Daten sind nicht servergeprüft und nicht kryptografisch signiert.",
    },
    error: {
      eyebrow: "Data Engineering / Fehler",
      title: "Das Kapitel konnte nicht geladen werden",
      body: "Die Kursansicht ist in diesem Browserlauf fehlgeschlagen. Der gespeicherte Lernstand wurde nicht verändert.",
      retry: "Erneut laden",
      back: "Zur Kursübersicht",
    },
    notFound: {
      title: "Kapitel nicht gefunden",
      body: "Die angeforderte Kapitel-ID gehört nicht zu diesem Kurs. Die Kursübersicht enthält alle zwölf gültigen Kapitel.",
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
        "Twelve chapters and 17 interactive simulations on storage formats, ingestion, streaming, compute, orchestration, quality, serving, and governance.",
    },
    landing: {
      eyebrow: "Data engineering / fundamentals",
      title: "Understand a data pipeline as one connected system.",
      intro:
        "Follow data from source to use. The course explains event time, file formats, distributed compute, idempotency, quality checks, metadata, metrics layers, and release gates through executable simulations.",
      start: "Open the overview",
      browse: "View the chapters",
      facts: [
        "12 chapters",
        "17 interactive simulations",
        "about 90 minutes",
        "no account required",
      ],
      stats: [
        { value: "12", label: "chapters" },
        { value: "17", label: "simulations" },
        { value: "10", label: "pipeline stages" },
        { value: "1", label: "capstone" },
      ],
      courseEyebrow: "Course structure",
      courseTitle: "One pipeline. Twelve chapters. One end-to-end case.",
      courseIntro:
        "The chapters build on one another. Start with storage and query engines, trace the data flow, then inspect six selected course controls together in the capstone.",
      chapterLabel: (displayNumber, id) =>
        id === "home" ? "Course overview" : `Chapter ${displayNumber}`,
      duration: (minutes) => `${minutes} min`,
      finalEyebrow: "Entry point",
      finalTitle: "Start with the complete pipeline.",
      finalBody:
        "The overview assigns every technical decision to a pipeline stage. Each following chapter examines one part of that system in detail.",
      finalCta: "Start the overview",
      breadcrumbs: ["Home", "Courses", "Data Engineering Fundamentals"],
      jsonLdDescription:
        "Twelve chapters on data-pipeline design and operation with 17 interactive simulations and one end-to-end capstone.",
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
      title: "Certificate of completion: Data Engineering Fundamentals",
      description:
        "Download the locally generated completion record for Data Engineering Fundamentals.",
    },
    verificationMetadata: {
      title: "Read completion-record data: Data Engineering Fundamentals",
      description:
        "Read locally encoded completion data. The data is not server-verified or cryptographically signed.",
    },
    error: {
      eyebrow: "Data Engineering / error",
      title: "The chapter could not load",
      body: "The course view failed in this browser session. Stored learning progress was not changed.",
      retry: "Reload",
      back: "Back to course overview",
    },
    notFound: {
      title: "Chapter not found",
      body: "The requested chapter ID does not belong to this course. The course overview lists all twelve valid chapters.",
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

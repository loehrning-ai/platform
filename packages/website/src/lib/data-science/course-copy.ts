import type { Locale } from "@/lib/i18n/locale";

export interface DataScienceCourseCopy {
  readonly landingMetadata: {
    readonly title: string;
    readonly description: string;
  };
  readonly reader: {
    readonly navLabel: string;
    readonly paginationLabel: string;
    readonly previous: string;
    readonly next: string;
    readonly certificate: string;
    readonly notFoundTitle: string;
  };
  readonly breadcrumbs: readonly [string, string, string];
  readonly jsonLdDescription: string;
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
}

export const DATA_SCIENCE_COURSE_COPY = Object.freeze({
  de: {
    landingMetadata: {
      title: "Data Science Fundamentals: interaktiver Kurs",
      description:
        "Zwölf interaktive Kapitel von Exploration über Experimente und Kausalität bis zum Produktionsbetrieb.",
    },
    reader: {
      navLabel: "Kapitelnavigation",
      paginationLabel: "Kapitel wechseln",
      previous: "← Vorheriges Kapitel",
      next: "Nächstes Kapitel →",
      certificate: "Teilnahmebestätigung öffnen →",
      notFoundTitle: "Kapitel nicht gefunden",
    },
    breadcrumbs: ["Start", "Kurse", "Data Science Fundamentals"],
    jsonLdDescription:
      "Zwölf interaktive Kapitel entlang des Data-Science-Zyklus.",
    certificateMetadata: {
      title: "Teilnahmebestätigung: Data Science Fundamentals",
      description:
        "Lokale Teilnahmebestätigung für Data Science Fundamentals herunterladen.",
    },
    verificationMetadata: {
      title: "Zertifikatdaten lesen: Data Science Fundamentals",
      description:
        "Liest die lokal kodierten Daten einer Teilnahmebestätigung. Sie sind nicht servergeprüft und nicht kryptografisch signiert.",
    },
    error: {
      eyebrow: "Data Science / Fehler",
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
  },
  en: {
    landingMetadata: {
      title: "Data Science Fundamentals: interactive course",
      description:
        "Twelve interactive chapters from exploration through experiments and causality to production.",
    },
    reader: {
      navLabel: "Chapter navigation",
      paginationLabel: "Change chapter",
      previous: "← Previous chapter",
      next: "Next chapter →",
      certificate: "Open completion record →",
      notFoundTitle: "Chapter not found",
    },
    breadcrumbs: ["Home", "Courses", "Data Science Fundamentals"],
    jsonLdDescription:
      "Twelve interactive chapters along the data science loop.",
    certificateMetadata: {
      title: "Certificate of participation: Data Science Fundamentals",
      description:
        "Download the local completion record for Data Science Fundamentals.",
    },
    verificationMetadata: {
      title: "Read completion-record data: Data Science Fundamentals",
      description:
        "Reads the locally encoded data of a completion record. The data is not server-verified or cryptographically signed.",
    },
    error: {
      eyebrow: "Data Science / error",
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
  },
}) satisfies Readonly<Record<Locale, DataScienceCourseCopy>>;

export function getDataScienceCourseCopy(
  locale: Locale,
): DataScienceCourseCopy {
  return DATA_SCIENCE_COURSE_COPY[locale];
}

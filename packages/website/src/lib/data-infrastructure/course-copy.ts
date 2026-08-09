import type { Locale } from "@/lib/i18n/locale";

export interface DataInfraStackRowCopy {
  readonly n: string;
  readonly name: string;
  readonly head: string;
  readonly body: string;
  readonly tools: readonly string[];
}

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
    readonly stackTitle: string;
    readonly stackFile: string;
    readonly stackRows: readonly DataInfraStackRowCopy[];
    readonly stats: readonly {
      readonly value: string;
      readonly label: string;
    }[];
    readonly courseEyebrow: string;
    readonly courseTitle: string;
    readonly courseIntro: string;
    readonly lessonLabel: (number: number) => string;
    readonly progressEyebrow: string;
    readonly progressTitle: string;
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

const SHARED_TOOLS = {
  source: ["Postgres", "iOS SDK", "Stripe"],
  log: ["Kafka", "Kinesis", "Pub/Sub"],
  process: ["Flink", "Spark", "dbt"],
  store: ["S3", "Iceberg", "Parquet"],
  serve: ["Snowflake", "Trino", "DynamoDB"],
  consume: ["Looker", "Feature Store", "API"],
} as const;

export const DATA_INFRA_COURSE_COPY = Object.freeze({
  de: {
    landingMetadata: {
      title: "Data Infrastructure: Systemdesign für Datenplattformen",
      description:
        "Zwölf Lektionen zu Datenmodellen, Speicherformaten, Batch, Streaming, CDC, Idempotenz, Datenqualität und prüfbarem Systemdesign.",
    },
    landing: {
      eyebrow: "Data Infrastructure / Kurs",
      title: "Datenplattformen anhand ihrer Systemgrenzen entwerfen.",
      intro:
        "Der Kurs verfolgt Daten von der Quelle bis zur Nutzung. Jede Lektion trennt Anforderungen, technische Entscheidung, Ausfallmodus und Betriebsnachweis. Interaktive Modelle veranschaulichen Konsistenz, Speicherlayout, Streaming-Zeit und Wiederanläufe mit festen Beispieldaten.",
      start: "Lektion 01 starten",
      map: "Kursübersicht",
      facts: [
        "12 Lektionen",
        "4 Tracks",
        "14 interaktive Modelle",
        "Systemdesign-Fall in Lektion 12",
      ],
      stackTitle: "Datenfluss · Quelle bis Nutzung",
      stackFile: "data-flow.svg",
      stackRows: [
        {
          n: "01",
          name: "quelle",
          head: "Hier entstehen Daten.",
          body: "Anwendungsserver, mobile Clients, Sensoren und externe APIs erzeugen Ereignisse und Zustände.",
          tools: SHARED_TOOLS.source,
        },
        {
          n: "02",
          name: "log",
          head: "Die nur erweiterbare Ereignisfolge.",
          body: "Ein geordnetes, dauerhaftes und partitioniertes Log entkoppelt Produzenten und Konsumenten.",
          tools: SHARED_TOOLS.log,
        },
        {
          n: "03",
          name: "verarbeitung",
          head: "Hier ändert sich die Form.",
          body: "Stream- und Batch-Jobs filtern, verknüpfen, aggregieren und prüfen Daten.",
          tools: SHARED_TOOLS.process,
        },
        {
          n: "04",
          name: "speicherung",
          head: "Dauerhafte, abfragbare Bytes.",
          body: "Object Storage hält Rohdaten; Tabellenformate ergänzen Transaktionen; Dateiformate bestimmen die Scan-Kosten.",
          tools: SHARED_TOOLS.store,
        },
        {
          n: "05",
          name: "bereitstellung",
          head: "Antworten für konkrete Zugriffsmuster.",
          body: "OLAP-Engines, Suchindizes und Key-Value-Stores bedienen unterschiedliche Latenz- und Abfrageziele.",
          tools: SHARED_TOOLS.serve,
        },
        {
          n: "06",
          name: "nutzung",
          head: "Der Zweck des Systems.",
          body: "Dashboards, Modelle, Abrechnung, Betrugserkennung und Produktfunktionen verwenden die Ergebnisse.",
          tools: SHARED_TOOLS.consume,
        },
      ],
      stats: [
        { value: "12", label: "Lektionen" },
        { value: "14", label: "interaktive Modelle" },
        { value: "4", label: "Tracks" },
        { value: "System", label: "Entwurfsprüfung" },
      ],
      courseEyebrow: "Kursaufbau",
      courseTitle:
        "Vier Tracks. Zwölf Lektionen. Ein vollständiger Entwurfsfall.",
      courseIntro:
        "Bearbeite die Lektionen in Reihenfolge. Lektion 12 verbindet Anforderungen, APIs, Datenmodell, Pipeline, Speicher, Bereitstellung und Betrieb in einer Systemdesign-Übung.",
      lessonLabel: (number) => `Lektion ${String(number).padStart(2, "0")}`,
      progressEyebrow: "Lernstand",
      progressTitle: "Fortschritt pro Track auf diesem Gerät.",
      finalEyebrow: "Einstieg",
      finalTitle: "Lektion 01: der gesamte Datenfluss",
      finalBody:
        "Ordne zuerst jede Systemkomponente einer von sechs Schichten zu. Danach lassen sich Speicher-, Konsistenz- und Laufzeitentscheidungen getrennt prüfen.",
      finalCta: "Beginnen",
      breadcrumbs: ["Start", "Kurse", "Data Infrastructure"],
      jsonLdDescription:
        "Zwölf deutschsprachige Lektionen zum Systemdesign von Datenplattformen über vier Tracks.",
    },
    indexMetadata: {
      title: "Lektionen: Data Infrastructure",
      description:
        "Alle zwölf Lektionen zu Grundlagen, Speicherung, Datentransport und Betrieb von Datenplattformen.",
    },
    index: {
      eyebrow: "Kursübersicht",
      title: "Vier Tracks. Zwölf Lektionen.",
      intro:
        "Arbeite die Lektionen in Reihenfolge durch. Jede Lektion benennt Entscheidung, Ausfallmodus und Betriebsnachweis.",
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
        "Die Modelle verwenden feste Beispieldaten und vereinfachte Regeln. Sie erklären Zusammenhänge; sie messen weder Produktleistung noch reale Latenz oder Kapazität.",
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
        "Lokale Teilnahmebestätigung für den abgeschlossenen Kurs Data Infrastructure herunterladen.",
    },
    verificationMetadata: {
      title: "Teilnahmebestätigungsdaten prüfen: Data Infrastructure",
      description:
        "Lokal kodierte Abschlussdaten lesen. Die Daten sind nicht servergeprüft oder kryptografisch signiert.",
    },
    error: {
      title: "Data Infrastructure konnte nicht geladen werden",
      body: "Die Kursansicht ist in diesem Browserlauf fehlgeschlagen. Es wurde kein Lernstand verändert.",
      retry: "Erneut laden",
      back: "Zur Kursübersicht",
    },
    notFound: {
      title: "Lektion nicht gefunden",
      body: "Die angeforderte Lektions-ID gehört nicht zu Data Infrastructure.",
      back: "Alle Lektionen anzeigen",
    },
  },
  en: {
    landingMetadata: {
      title: "Data Infrastructure: system design for data platforms",
      description:
        "Twelve lessons on data models, storage formats, batch, streaming, CDC, idempotency, data quality, and reviewable system design.",
    },
    landing: {
      eyebrow: "Data Infrastructure / course",
      title: "Design data platforms from explicit system boundaries.",
      intro:
        "The course follows data from source to use. Each lesson separates requirements, technical decisions, failure modes, and operating evidence. Interactive models illustrate consistency, storage layout, streaming time, and retries with fixed sample data.",
      start: "Start lesson 01",
      map: "Course map",
      facts: [
        "12 lessons",
        "4 tracks",
        "14 interactive models",
        "system-design case in lesson 12",
      ],
      stackTitle: "Data flow · source to use",
      stackFile: "data-flow.svg",
      stackRows: [
        {
          n: "01",
          name: "source",
          head: "Where data originates.",
          body: "Application servers, mobile clients, sensors, and external APIs create events and state.",
          tools: SHARED_TOOLS.source,
        },
        {
          n: "02",
          name: "log",
          head: "The append-only event sequence.",
          body: "An ordered, durable, partitioned log decouples producers from consumers.",
          tools: SHARED_TOOLS.log,
        },
        {
          n: "03",
          name: "process",
          head: "Where shape changes.",
          body: "Stream and batch jobs filter, join, aggregate, and validate data.",
          tools: SHARED_TOOLS.process,
        },
        {
          n: "04",
          name: "store",
          head: "Durable, queryable bytes.",
          body: "Object storage retains raw data; table formats add transactions; file formats determine scan cost.",
          tools: SHARED_TOOLS.store,
        },
        {
          n: "05",
          name: "serve",
          head: "Answers for specific access patterns.",
          body: "OLAP engines, search indexes, and key-value stores serve different latency and query targets.",
          tools: SHARED_TOOLS.serve,
        },
        {
          n: "06",
          name: "consume",
          head: "The purpose of the system.",
          body: "Dashboards, models, billing, fraud detection, and product features use the output.",
          tools: SHARED_TOOLS.consume,
        },
      ],
      stats: [
        { value: "12", label: "lessons" },
        { value: "14", label: "interactive models" },
        { value: "4", label: "tracks" },
        { value: "system", label: "design review" },
      ],
      courseEyebrow: "Course structure",
      courseTitle: "Four tracks. Twelve lessons. One complete design case.",
      courseIntro:
        "Work through the lessons in order. Lesson 12 combines requirements, APIs, data model, pipeline, storage, serving, and operations in a system-design exercise.",
      lessonLabel: (number) => `Lesson ${String(number).padStart(2, "0")}`,
      progressEyebrow: "Progress",
      progressTitle: "Track progress on this device.",
      finalEyebrow: "Entry point",
      finalTitle: "Lesson 01: the complete data flow",
      finalBody:
        "First assign every component to one of six layers. Then evaluate storage, consistency, and runtime decisions separately.",
      finalCta: "Begin",
      breadcrumbs: ["Home", "Courses", "Data Infrastructure"],
      jsonLdDescription:
        "Twelve English lessons on data-platform system design across four tracks.",
    },
    indexMetadata: {
      title: "Lessons: Data Infrastructure",
      description:
        "All twelve lessons on foundations, storage, data movement, and operating data platforms.",
    },
    index: {
      eyebrow: "Course map",
      title: "Four tracks. Twelve lessons.",
      intro:
        "Work through the lessons in order. Each lesson identifies a decision, a failure mode, and operating evidence.",
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
        "These models use fixed sample data and simplified rules. They explain relationships; they do not benchmark product latency, throughput, or capacity.",
      complete: "Complete lesson",
      completed: "Lesson complete",
      next: "Next lesson →",
      previous: "← Previous lesson",
      notFoundTitle: "Lesson not found",
    },
    progress: { overall: "Overall progress", lessons: "lessons" },
    certificateMetadata: {
      title: "Certificate of completion: Data Infrastructure",
      description:
        "Download the locally generated completion record for Data Infrastructure.",
    },
    verificationMetadata: {
      title: "Read completion-record data: Data Infrastructure",
      description:
        "Read locally encoded completion data. The data is not server-verified or cryptographically signed.",
    },
    error: {
      title: "Data Infrastructure could not load",
      body: "The course view failed in this browser session. No learning progress was changed.",
      retry: "Reload",
      back: "Back to course map",
    },
    notFound: {
      title: "Lesson not found",
      body: "The requested lesson ID does not belong to Data Infrastructure.",
      back: "View all lessons",
    },
  },
}) satisfies Readonly<Record<Locale, DataInfraCourseCopy>>;

export function getDataInfraCourseCopy(locale: Locale): DataInfraCourseCopy {
  return DATA_INFRA_COURSE_COPY[locale];
}

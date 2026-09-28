import type { Locale } from "@/lib/i18n/locale";
import {
  DATA_INFRASTRUCTURE_CONFIG,
  DATA_INFRASTRUCTURE_CONFIG_DE,
} from "./config";
import {
  DATA_INFRA_TRACKS,
  DATA_INFRA_TRACKS_DE,
  type DataInfraLessonId,
  type DataInfraTrack,
  type DataInfraTrackId,
} from "./types";

export interface DataInfraLessonSummary {
  readonly id: DataInfraLessonId;
  readonly number: number;
  readonly title: string;
  readonly subtitle: string;
  readonly durationMinutes: number;
  readonly trackId: DataInfraTrackId;
  readonly hook: string;
}

export interface DataInfraLandingManifest {
  readonly courseTitle: string;
  readonly tracks: readonly DataInfraTrack[];
  readonly lessons: readonly DataInfraLessonSummary[];
}

interface LessonSeed {
  readonly id: DataInfraLessonId;
  readonly durationMinutes: number;
  readonly trackId: DataInfraTrackId;
  readonly de: Pick<DataInfraLessonSummary, "title" | "subtitle" | "hook">;
  readonly en: Pick<DataInfraLessonSummary, "title" | "subtitle" | "hook">;
}

/**
 * Route-card metadata only. Full lesson prose and widgets remain lazy modules
 * in `data.ts`; landing, reader, metadata, certificate, and verification
 * requests must not import all 24 localized lesson modules before first paint.
 * `localization.test.ts` compares every field with the full locale registry.
 */
const LESSON_SEEDS = [
  {
    id: "mental-model",
    durationMinutes: 12,
    trackId: "foundations",
    en: {
      title: "The stack, top to bottom",
      subtitle: "Source → log → lake → warehouse → mart",
      hook: "Trace data from source to consumer, then state the contract at each boundary.",
    },
    de: {
      title: "Der Daten-Stack von oben nach unten",
      subtitle: "Quelle → Log → Lake → Warehouse → Mart",
      hook: "Daten bis zum Consumer verfolgen und jede Grenze festlegen.",
    },
  },
  {
    id: "cap-pacelc",
    durationMinutes: 14,
    trackId: "foundations",
    en: {
      title: "CAP, PACELC and coordination cost",
      subtitle: "Partition behavior and normal-operation trade-offs",
      hook: "State the failure model first, then choose consistency and availability behavior per operation.",
    },
    de: {
      title: "CAP, PACELC und Koordinationskosten",
      subtitle: "Partitionsverhalten und Zielkonflikte im Normalbetrieb",
      hook: "Zuerst das Fehlermodell benennen, dann Konsistenz- und Verfügbarkeitsverhalten je Vorgang wählen.",
    },
  },
  {
    id: "modeling",
    durationMinutes: 13,
    trackId: "foundations",
    en: {
      title: "Modeling: OLTP vs OLAP vs stream",
      subtitle: "3NF · Kimball · Wide-table · Vault",
      hook: "Choose a model from write behavior, query shape, history, lineage, and ownership.",
    },
    de: {
      title: "Datenmodellierung für OLTP, OLAP und Streams",
      subtitle: "3NF · Kimball · breite Tabellen · Vault",
      hook: "Ein Modell aus Schreibverhalten, Abfrageform, Historie, Lineage und Zuständigkeit wählen.",
    },
  },
  {
    id: "storage-formats",
    durationMinutes: 13,
    trackId: "storage",
    en: {
      title: "Row vs column: inside Parquet",
      subtitle: "Encodings · row groups · pushdown",
      hook: "Relate physical layout and metadata to the bytes an analytical query must read.",
    },
    de: {
      title: "Zeilen und Spalten im Parquet-Format",
      subtitle: "Kodierungen · Zeilengruppen · Pushdown",
      hook: "Physisches Layout und Metadaten mit den Bytes verbinden, die eine analytische Abfrage lesen muss.",
    },
  },
  {
    id: "lakehouse",
    durationMinutes: 15,
    trackId: "storage",
    en: {
      title: "The lakehouse: Iceberg, Delta, Hudi",
      subtitle: "ACID on object storage",
      hook: "Inspect snapshots, commit validation, delete handling, and maintenance before choosing a table format.",
    },
    de: {
      title: "Lakehouse mit Iceberg, Delta und Hudi",
      subtitle: "ACID auf Object Storage",
      hook: "Snapshots, Commit-Validierung, Löschverhalten und Wartung vor der Wahl eines Tabellenformats prüfen.",
    },
  },
  {
    id: "partitioning",
    durationMinutes: 12,
    trackId: "storage",
    en: {
      title: "Partitioning, clustering, small files",
      subtitle: "Lay out a petabyte to query a megabyte",
      hook: "Design file layout from measured predicates, distribution, file size, and maintenance cost.",
    },
    de: {
      title: "Partitionierung, Clustering und kleine Dateien",
      subtitle:
        "Ein Petabyte so anordnen, dass eine Abfrage nur ein Megabyte liest",
      hook: "Dateilayout aus gemessenen Prädikaten, Verteilung, Dateigröße und Wartungskosten entwerfen.",
    },
  },
  {
    id: "batch-elt",
    durationMinutes: 13,
    trackId: "movement",
    en: {
      title: "Batch ELT and orchestration",
      subtitle: "Airflow · dbt · idempotent merges",
      hook: "Make bounded jobs replayable, observable, and safe under partial failure.",
    },
    de: {
      title: "Batch-ELT und Orchestrierung",
      subtitle: "Airflow · dbt · idempotente Zusammenführungen",
      hook: "Begrenzte Jobs wiedereinspielbar, beobachtbar und bei Teilfehlern sicher machen.",
    },
  },
  {
    id: "streaming",
    durationMinutes: 15,
    trackId: "movement",
    en: {
      title: "Streaming: Kafka, watermarks, windows",
      subtitle: "Partitions · groups · event time",
      hook: "Event time differs from processing time. Watermarks handle late data.",
    },
    de: {
      title: "Streaming: Kafka, Watermarks und Fenster",
      subtitle: "Partitionen · Gruppen · Ereigniszeit",
      hook: "Ereigniszeit und Verarbeitungszeit unterscheiden sich. Watermarks machen verspätete Daten beherrschbar.",
    },
  },
  {
    id: "cdc-lambda-kappa",
    durationMinutes: 14,
    trackId: "movement",
    en: {
      title: "CDC, Lambda & Kappa",
      subtitle: "Change data capture · two architectures",
      hook: "Capture row changes with CDC and pick the processing path.",
    },
    de: {
      title: "CDC, Lambda & Kappa",
      subtitle: "Change Data Capture · zwei Architekturen",
      hook: "Zeilenänderungen per CDC erfassen und den Verarbeitungspfad wählen.",
    },
  },
  {
    id: "idempotency",
    durationMinutes: 14,
    trackId: "scale",
    en: {
      title: "Idempotency, backfills and processing guarantees",
      subtitle: "Scope the source, state, sink, and failure model",
      hook: "Make retries and historical reprocessing safe across every declared side effect.",
    },
    de: {
      title: "Idempotenz, Backfills und Verarbeitungsgarantien",
      subtitle: "Quelle, Zustand, Ziel und Fehlermodell abgrenzen",
      hook: "Wiederholungen und historische Neuberechnungen für alle benannten Seiteneffekte sicher machen.",
    },
  },
  {
    id: "sla-quality",
    durationMinutes: 16,
    trackId: "scale",
    en: {
      title: "SLAs, observability and data quality",
      subtitle: "Freshness · volume · drift · lineage",
      hook: "Define measurable reliability targets, detect silent data defects, and route incidents with evidence.",
    },
    de: {
      title: "SLAs, Observability und Datenqualität",
      subtitle: "Freshness · Volumen · Drift · Lineage",
      hook: "Messbare Zuverlässigkeitsziele definieren, stille Datenfehler erkennen und Vorfälle anhand von Evidenz weiterleiten.",
    },
  },
  {
    id: "interview-playbook",
    durationMinutes: 20,
    trackId: "scale",
    en: {
      title: "System design review",
      subtitle: "A seller analytics scenario with stated assumptions",
      hook: "Turn an open prompt into a reviewable system design.",
    },
    de: {
      title: "Systemdesign-Review",
      subtitle: "Ein Händleranalyse-Szenario mit expliziten Annahmen",
      hook: "Eine offene Aufgabe als prüfbaren Systementwurf ausarbeiten.",
    },
  },
] as const satisfies readonly LessonSeed[];

function buildManifest(locale: Locale): DataInfraLandingManifest {
  const config =
    locale === "de"
      ? DATA_INFRASTRUCTURE_CONFIG_DE
      : DATA_INFRASTRUCTURE_CONFIG;
  return Object.freeze({
    courseTitle: config.title,
    tracks: locale === "de" ? DATA_INFRA_TRACKS_DE : DATA_INFRA_TRACKS,
    lessons: Object.freeze(
      LESSON_SEEDS.map((seed, index) =>
        Object.freeze({
          id: seed.id,
          number: index + 1,
          durationMinutes: seed.durationMinutes,
          trackId: seed.trackId,
          ...seed[locale],
        }),
      ),
    ),
  });
}

const MANIFESTS = Object.freeze({
  de: buildManifest("de"),
  en: buildManifest("en"),
});

export function getDataInfraLandingManifest(
  locale: Locale,
): DataInfraLandingManifest {
  return MANIFESTS[locale];
}

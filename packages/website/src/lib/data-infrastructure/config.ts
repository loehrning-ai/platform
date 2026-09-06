// ─── Data Infrastructure course config ───────────
//
// Own module (mirroring `lib/codex/config.ts`) so the course-config object
// lives beside its own content module; `lib/course/config.ts` imports and
// re-exports it into the shared registry, so `getCourseConfig("data-infrastructure")`
// works exactly like every other course.

import type { CourseConfig } from "@/lib/course/types";
import { createLocalizedTechnicalCourseConfig } from "@/lib/technical-courses/routes";

export const DATA_INFRASTRUCTURE_CONFIG = {
  slug: "data-infrastructure",
  title: "Data Infrastructure",
  language: "en",
  basePath: "/kurse/open-source/data-infrastructure",
  coursePath: "/kurse/open-source/data-infrastructure/kurs",
  blockIds: [],
  // This course has no separate gating exam or capstone rubric. Lesson 12
  // is a step-through system-design review, not a
  // scored gate. Certificate eligibility resolves via 's
  // generic all-lessons-completed "completion" path (src/lib/progress/store.ts's
  // isCertificateEligible), same as codex/data-engineering-fundamentals/
  // data-science. No `/kurs/quiz` route is built for this course; these three
  // fields are kept only for CourseConfig-shape compatibility and are never
  // read by any real UI.
  workshopQuizQuestionCount: 0,
  workshopQuizTimeLimitMinutes: 0,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "Data Infrastructure",
  certificateSubtitle:
    "Certificate of participation. Issued by loehrning.ai, an independent education platform. This confirmation is not an accredited qualification.",
  certificateModules: [
    "Foundations: mental model, CAP/PACELC, modeling",
    "Storage: row vs columnar, Parquet internals, the lakehouse, partitioning",
    "Movement: batch ETL & orchestration, streaming, watermarks, CDC, Lambda vs Kappa",
    "Operations: idempotency, backfills, observability, and a system-design review",
  ],
  certificateReferenceLabel:
    "Personal certificate of participation: Data Infrastructure course topics",
  quizPassMessage: "Data Infrastructure course completed.",
  certificateFileStem: "Data-Infrastructure",
  recordNoun: {
    label: "Certificate of Participation",
    possessive: "Your certificate of participation",
    demonstrative: "This certificate of participation",
  },
} satisfies CourseConfig;

export const DATA_INFRASTRUCTURE_CONFIG_DE =
  createLocalizedTechnicalCourseConfig(DATA_INFRASTRUCTURE_CONFIG, "de", {
    title: "Data Infrastructure",
    certificateTitle: "Teilnahmebestätigung: Data Infrastructure",
    certificateSubtitle:
      "Lokal erzeugte Teilnahmebestätigung der unabhängigen Lernplattform loehrning.ai. Keine staatlich anerkannte oder akkreditierte Qualifikation.",
    certificateModules: [
      "Grundlagen: Gesamtmodell, CAP und PACELC sowie Datenmodellierung",
      "Speicherung: Zeilen- und Spaltenformate, Parquet, Lakehouse und Partitionierung",
      "Transport: Batch-ELT, Orchestrierung, Streaming, Watermarks und CDC",
      "Betrieb: Idempotenz, Backfills, Datenqualität und Systemdesign-Interview",
    ],
    certificateReferenceLabel:
      "Persönliche Teilnahmebestätigung: Themen des Kurses Data Infrastructure",
    quizPassMessage: "Der Kurs Data Infrastructure ist abgeschlossen.",
    certificateFileStem: "Data-Infrastructure",
    recordNoun: {
      label: "Teilnahmebestätigung",
      possessive: "Deine Teilnahmebestätigung",
      demonstrative: "Diese Teilnahmebestätigung",
    },
  });

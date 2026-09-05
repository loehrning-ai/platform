// ─── Data Engineering Fundamentals course config ─
//
// Own module (mirroring `lib/data-infrastructure/config.ts`) so the
// course-config object lives beside its own content module;
// `lib/course/config.ts` imports and re-exports it into the shared
// registry, so `getCourseConfig("data-engineering-fundamentals")` works
// exactly like every other course.

import type { CourseConfig } from "@/lib/course/types";
import { createLocalizedTechnicalCourseConfig } from "@/lib/technical-courses/routes";

export const DATA_ENGINEERING_FUNDAMENTALS_CONFIG = {
  slug: "data-engineering-fundamentals",
  title: "Data Engineering Fundamentals",
  language: "en",
  basePath: "/kurse/open-source/data-engineering-fundamentals",
  // Unlike codex/data-infrastructure (which nest chapters under a real
  // `.../kurs/[id]` route), this course's chapters live directly under
  // `.../data-engineering-fundamentals/[chapterId]` with no `/kurs`
  // segment ( Done Criteria) — there is no
  // `src/app/kurse/open-source/data-engineering-fundamentals/kurs`
  // route at all. `coursePath` must point at the real landing page so
  // certificate-page.tsx's "back to course" link/redirect resolves.
  coursePath: "/kurse/open-source/data-engineering-fundamentals",
  blockIds: [],
  // No quiz/scoring mechanism exists in source at all (grep across all 14
  // source chapter files for a "Quiz" component returns nothing —
  // `DiscoverySpeedrun` is a timed practice game, not a pass/fail gate).
  // Completion-record eligibility requires one current, versioned transfer
  // checkpoint per chapter. Historical click-only completion flags do not
  // count. No `/kurs/quiz` route is built for this course;
  // these three fields are kept only for CourseConfig-shape compatibility
  // and are never read by any real UI.
  workshopQuizQuestionCount: 0,
  workshopQuizTimeLimitMinutes: 0,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "Data Engineering Fundamentals",
  certificateSubtitle:
    "Certificate of participation. Issued by loehrning.ai, an independent education platform. This confirmation is not an accredited qualification.",
  certificateModules: [
    "Fundamentals: storage, formats, and query engines",
    "Ingest and streaming: where data is born, watermarks, and the bridge to the warehouse",
    "Store and compute: how data lives and how it is read",
    "Orchestrate, quality, discovery, serving, and governance: idempotency, quality signals, and a reference deploy gate",
  ],
  certificateReferenceLabel:
    "Personal certificate of participation: data-pipeline design from source to serving",
  quizPassMessage: "Data Engineering Fundamentals is complete.",
  certificateFileStem: "Data-Engineering-Fundamentals",
  recordNoun: {
    label: "Certificate of Participation",
    possessive: "Your certificate of participation",
    demonstrative: "This certificate of participation",
  },
} satisfies CourseConfig;

export const DATA_ENGINEERING_FUNDAMENTALS_CONFIG_DE =
  createLocalizedTechnicalCourseConfig(
    DATA_ENGINEERING_FUNDAMENTALS_CONFIG,
    "de",
    {
      title: "Data Engineering Fundamentals",
      certificateTitle: "Teilnahmebestätigung: Data Engineering Fundamentals",
      certificateSubtitle:
        "Lokal erzeugte Teilnahmebestätigung der unabhängigen Lernplattform loehrning.ai. Keine staatlich anerkannte oder akkreditierte Qualifikation.",
      certificateModules: [
        "Grundlagen: Speicher, Formate und Abfrage-Engines",
        "Datenaufnahme und Streaming: Ereigniszeit, Watermarks und der Weg ins Warehouse",
        "Speicherung und Verarbeitung: Datenmodelle, Dateiformate, Partitionierung und verteilte Ausführung",
        "Orchestrierung, Qualität, Ermittlung, Bereitstellung und Governance: Idempotenz, Qualitätsnachweise und eine Referenz-Freigabeschranke",
      ],
      certificateReferenceLabel:
        "Persönliche Teilnahmebestätigung: Entwurf von Datenpipelines von der Quelle bis zur Bereitstellung",
      quizPassMessage:
        "Der Kurs Data Engineering Fundamentals ist abgeschlossen.",
      certificateFileStem: "Data-Engineering-Fundamentals",
      recordNoun: {
        label: "Teilnahmebestätigung",
        possessive: "Deine Teilnahmebestätigung",
        demonstrative: "Diese Teilnahmebestätigung",
      },
    },
  );

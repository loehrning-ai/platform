// ─── Data Engineering Fundamentals course config (plan 011 stage 1) ─
//
// Own module (mirroring `lib/data-infrastructure/config.ts`) so the
// course-config object lives beside its own content module;
// `lib/course/config.ts` imports and re-exports it into the shared
// registry, so `getCourseConfig("data-engineering-fundamentals")` works
// exactly like every other course.

import type { CourseConfig } from "@/lib/course/types";

export const DATA_ENGINEERING_FUNDAMENTALS_CONFIG: CourseConfig = {
  slug: "data-engineering-fundamentals",
  title: "Data Engineering Fundamentals",
  language: "en",
  basePath: "/kurse/open-source/data-engineering-fundamentals",
  coursePath: "/kurse/open-source/data-engineering-fundamentals/kurs",
  blockIds: [],
  // No quiz/scoring mechanism exists in source at all (grep across all 14
  // source chapter files for a "Quiz" component returns nothing —
  // `DiscoverySpeedrun` is a timed practice game, not a pass/fail gate).
  // Certificate eligibility resolves via plan 007's generic
  // all-lessons-completed "completion" path (src/lib/progress/store.ts's
  // isCertificateEligible). No `/kurs/quiz` route is built for this course;
  // these three fields are kept only for CourseConfig-shape compatibility
  // and are never read by any real UI.
  workshopQuizQuestionCount: 0,
  workshopQuizTimeLimitMinutes: 0,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "Data Engineering Fundamentals",
  certificateSubtitle:
    "Certificate of completion. Issued by loehrning.ai, an independent education platform. This confirmation is not an accredited qualification.",
  certificateModules: [
    "Fundamentals: storage, formats, and query engines",
    "Ingest and streaming: where data is born, watermarks, and the bridge to the warehouse",
    "Store and compute: how data lives and how it is read",
    "Orchestrate, quality, discovery, serving, and governance: idempotency, trust, and the deploy gate",
  ],
  certificateReferenceLabel:
    "Personal certificate of completion: production-ready data pipelines, source to serving",
  quizPassMessage: "Congratulations! You completed the Data Engineering Fundamentals course.",
  certificateFileStem: "Data-Engineering-Fundamentals",
  recordNoun: {
    label: "Certificate of Completion",
    possessive: "Your certificate of completion",
    demonstrative: "This certificate of completion",
  },
};

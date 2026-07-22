// ─── Data Infrastructure course config ───────────
//
// Own module (mirroring `lib/codex/config.ts`) so the course-config object
// lives beside its own content module; `lib/course/config.ts` imports and
// re-exports it into the shared registry, so `getCourseConfig("data-infrastructure")`
// works exactly like every other course.

import type { CourseConfig } from "@/lib/course/types";

export const DATA_INFRASTRUCTURE_CONFIG: CourseConfig = {
  slug: "data-infrastructure",
  title: "Data Infrastructure",
  language: "en",
  basePath: "/kurse/open-source/data-infrastructure",
  coursePath: "/kurse/open-source/data-infrastructure/kurs",
  blockIds: [],
  // This course has no separate gating exam or capstone rubric — lesson 12
  // ("The IC5 Interview, Live") is itself a step-through walkthrough, not a
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
    "Certificate of completion. Issued by loehrning.ai, an independent education platform. This confirmation is not an accredited qualification.",
  certificateModules: [
    "Foundations: mental model, CAP/PACELC, modeling",
    "Storage: row vs columnar, Parquet internals, the lakehouse, partitioning",
    "Movement: batch ETL & orchestration, streaming, watermarks, CDC, Lambda vs Kappa",
    "At scale: idempotency, backfills, observability, the IC5 system-design interview",
  ],
  certificateReferenceLabel:
    "Personal certificate of completion: data infrastructure at IC5/staff system-design depth",
  quizPassMessage: "Congratulations! You completed the Data Infrastructure course.",
  certificateFileStem: "Data-Infrastructure",
  recordNoun: {
    label: "Certificate of Completion",
    possessive: "Your certificate of completion",
    demonstrative: "This certificate of completion",
  },
};

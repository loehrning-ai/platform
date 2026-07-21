// ─── Data Science course config (plan 012 stage 1) ───────────────────
//
// Own module (mirroring `lib/data-engineering-fundamentals/config.ts`) so
// the course-config object lives beside its own content module;
// `lib/course/config.ts` imports and re-exports it into the shared
// registry, so `getCourseConfig("data-science")` works exactly like every
// other course. Registered here ahead of the catalog flip (stage 14), same
// sequencing as claude/codex/data-infrastructure/data-engineering-
// fundamentals's own stage-1 precedent.

import type { CourseConfig } from "@/lib/course/types";

export const DATA_SCIENCE_CONFIG: CourseConfig = {
  slug: "data-science",
  title: "Data Science Fundamentals",
  language: "en",
  basePath: "/kurse/open-source/data-science",
  // Like data-engineering-fundamentals, this course's chapters live
  // directly under `.../data-science/[chapterSlug]` with no `/kurs`
  // segment — there is no `src/app/kurse/open-source/data-science/kurs`
  // route at all. `coursePath` must point at the real landing page so
  // certificate-page.tsx's "back to course" link/redirect resolves.
  coursePath: "/kurse/open-source/data-science",
  blockIds: [],
  // No quiz/scoring mechanism exists in source at all (grep across all 15
  // source files for a "Quiz" component returns nothing). Certificate
  // eligibility resolves via plan 007's generic all-lessons-completed
  // "completion" path (src/lib/progress/store.ts's isCertificateEligible).
  // No `/kurs/quiz` route is built for this course; these three fields are
  // kept only for CourseConfig-shape compatibility and are never read by
  // any real UI.
  workshopQuizQuestionCount: 0,
  workshopQuizTimeLimitMinutes: 0,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "Data Science Fundamentals",
  certificateSubtitle:
    "Certificate of completion. Issued by loehrning.ai, an independent education platform. This confirmation is not an accredited qualification.",
  certificateModules: [
    "Fundamentals and exploration: sampling, the DS loop, EDA, and data cleaning",
    "Feature engineering and modeling: encoding, leakage, and the bias/variance tradeoff",
    "Evaluation and experimentation: ROC/PR curves, SHAP interpretability, and A/B test power",
    "Causal inference and production: DAGs, peeking/CUPED, drift monitoring, and deployment",
  ],
  certificateReferenceLabel:
    "Personal certificate of completion: the data science loop, EDA to deployment",
  quizPassMessage: "Congratulations! You completed the Data Science Fundamentals course.",
  certificateFileStem: "Data-Science-Fundamentals",
  recordNoun: {
    label: "Certificate of Completion",
    possessive: "Your certificate of completion",
    demonstrative: "This certificate of completion",
  },
};

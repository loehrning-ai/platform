// ─── Data Science course config ───────────────────
//
// Own module (mirroring `lib/data-engineering-fundamentals/config.ts`) so
// the course-config object lives beside its own content module;
// `lib/course/config.ts` imports and re-exports it into the shared
// registry, so `getCourseConfig("data-science")` works exactly like every
// other course. Registered here ahead of the catalog flip (stage 14), same
// sequencing as claude/codex/data-infrastructure/data-engineering-
// fundamentals's own stage-1 precedent.

import type { CourseConfig } from "@/lib/course/types";
import { createLocalizedTechnicalCourseConfig } from "@/lib/technical-courses/routes";

export const DATA_SCIENCE_CONFIG = {
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
  // No quiz/scoring mechanism exists in source. Completion-record eligibility
  // requires one current, versioned transfer checkpoint per chapter;
  // historical click-only completion flags do not count.
  // No `/kurs/quiz` route is built for this course; these three fields are
  // kept only for CourseConfig-shape compatibility and are never read by
  // any real UI.
  workshopQuizQuestionCount: 0,
  workshopQuizTimeLimitMinutes: 0,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "Data Science Fundamentals",
  certificateSubtitle:
    "Certificate of participation. Issued by loehrning.ai, an independent education platform. This confirmation is not an accredited qualification.",
  certificateModules: [
    "Fundamentals and exploration: sampling, the DS loop, EDA, and data cleaning",
    "Feature engineering and modeling: encoding, leakage, and the bias/variance tradeoff",
    "Evaluation and experimentation: ROC/PR curves, SHAP interpretability, and A/B test power",
    "Causal inference and production: DAGs, peeking/CUPED, drift monitoring, and deployment",
  ],
  certificateReferenceLabel:
    "Personal certificate of participation: the data science loop, EDA to deployment",
  quizPassMessage: "Data Science Fundamentals is complete.",
  certificateFileStem: "Data-Science-Fundamentals",
  recordNoun: {
    label: "Certificate of Participation",
    possessive: "Your certificate of participation",
    demonstrative: "This certificate of participation",
  },
} satisfies CourseConfig;

export const DATA_SCIENCE_CONFIG_DE = createLocalizedTechnicalCourseConfig(
  DATA_SCIENCE_CONFIG,
  "de",
  {
    title: "Data Science Fundamentals",
    certificateTitle: "Teilnahmebestätigung: Data Science Fundamentals",
    certificateSubtitle:
      "Lokal erzeugte Teilnahmebestätigung der unabhängigen Lernplattform loehrning.ai. Keine staatlich anerkannte oder akkreditierte Qualifikation.",
    certificateModules: [
      "Grundlagen und Exploration: Stichproben, Data-Science-Zyklus, EDA und Datenbereinigung",
      "Feature Engineering und Modellierung: Kodierung, Leakage und Bias-Varianz-Abwägung",
      "Evaluation und Experimente: ROC/PR-Kurven, SHAP-Interpretation und Power von A/B-Tests",
      "Kausale Inferenz und Betrieb: DAGs, Peeking/CUPED, Drift-Monitoring und Deployment",
    ],
    certificateReferenceLabel:
      "Persönliche Teilnahmebestätigung: Data-Science-Zyklus von EDA bis Deployment",
    quizPassMessage: "Der Kurs Data Science Fundamentals ist abgeschlossen.",
    certificateFileStem: "Data-Science-Fundamentals",
    recordNoun: {
      label: "Teilnahmebestätigung",
      possessive: "Deine Teilnahmebestätigung",
      demonstrative: "Diese Teilnahmebestätigung",
    },
  },
);

// ─── Codex Course config (plan 009 stage 1) ─────────────────────────
//
// Own module (not inlined into `lib/course/config.ts`, unlike claude's
// CLAUDE_CONFIG) so the course-config object lives beside its own content
// module; `lib/course/config.ts` imports and re-exports it into the shared
// registry, so `getCourseConfig("codex")` works exactly like every other
// course.

import type { CourseConfig } from "@/lib/course/types";

export const CODEX_CONFIG: CourseConfig = {
  slug: "codex",
  title: "Codex Course",
  language: "en",
  basePath: "/kurse/open-source/codex",
  coursePath: "/kurse/open-source/codex/kurs",
  blockIds: [],
  // Codex has no separate gating exam: lesson 12 IS the capstone content,
  // but there is no aggregate end-of-course quiz. Certificate eligibility
  // resolves via plan 007 stage 4's generic all-lessons-completed
  // "completion" path (src/lib/progress/store.ts's isCertificateEligible),
  // same as data-infrastructure/data-engineering-fundamentals/data-science.
  // No `/kurs/quiz` route is built for this course; these three fields are
  // kept only for CourseConfig-shape compatibility and are never read by
  // any real UI.
  workshopQuizQuestionCount: 0,
  workshopQuizTimeLimitMinutes: 0,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "Codex Course",
  certificateSubtitle:
    "Certificate of completion. Issued by loehrning.ai, an independent education platform. This confirmation is not an accredited qualification.",
  certificateModules: [
    "Fundamentals: mental model, the sandbox contract, AGENTS.md",
    "Task craft: task specs, scoping, acceptance criteria",
    "In the loop: review, iteration, the AI tools ecosystem",
    "Advanced: parallelism, proven patterns, the end-to-end workflow",
  ],
  certificateReferenceLabel:
    "Personal certificate of completion: working effectively with Codex",
  quizPassMessage: "Congratulations! You completed the Codex Course.",
  certificateFileStem: "Codex-Course",
  recordNoun: {
    label: "Certificate of Completion",
    possessive: "Your certificate of completion",
    demonstrative: "This certificate of completion",
  },
};

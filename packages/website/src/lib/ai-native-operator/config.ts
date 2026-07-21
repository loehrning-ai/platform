// ─── AI-Native Operator Course config ────────────────
//
// Own module (mirroring `lib/codex/config.ts`/`lib/data-science/config.ts`)
// so the course-config object lives beside its own content module;
// `lib/course/config.ts` imports and re-exports it into the shared
// registry, so `getCourseConfig("ai-native-operator")` works exactly like
// every other course.
//
// Unlike codex/data-infrastructure/data-engineering-fundamentals/
// data-science, this course DOES have a real quiz gate: 9 module
// knowledge-checks pooled into one 22-question workshop quiz (
// stage 3), so it follows claude's quiz-gated `CourseConfig` shape rather
// than generic "completion" fallback.

import type { CourseConfig } from "@/lib/course/types";

export const AI_NATIVE_OPERATOR_CONFIG: CourseConfig = {
  slug: "ai-native-operator",
  title: "The AI-Native Operator",
  language: "en",
  basePath: "/kurse/open-source/ai-native-operator",
  // Like data-engineering-fundamentals/data-science, this course's modules
  // and lessons live directly under `.../ai-native-operator/[moduleId]/
  // [lessonNum]` with no `/kurs` segment — there is no
  // `src/app/kurse/open-source/ai-native-operator/kurs` route at all.
  // `coursePath` must point at the real landing page so
  // certificate-page.tsx's "back to course" link/redirect resolves, and so
  // workshop-quiz-page.tsx's `${config.coursePath}/zertifikat` link resolves.
  coursePath: "/kurse/open-source/ai-native-operator",
  blockIds: [],
  // Bank size equals served count (matches every other course's convention:
  // ki-fuehrerschein 20/20, eu-ai-act-kurs 27/27, ai-native 24/24,
  // ki-und-gesellschaft 15/15, claude 19/19). The 22-question bank pools
  // all 9 module knowledge-checks' questions verbatim.
  workshopQuizQuestionCount: 22,
  workshopQuizTimeLimitMinutes: 28,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "The AI-Native Operator",
  certificateSubtitle:
    "Certificate of completion. Issued by loehrning.ai, an independent education platform. This confirmation is not an accredited qualification.",
  certificateModules: [
    "Mindset & Culture",
    "Engineering Practices",
    "Product Building",
    "Operations & Workflows",
    "Talent & Skills",
    "Org Structure",
    "Data & Infrastructure",
    "Governance & Safety",
    "Measurement & ROI",
  ],
  certificateReferenceLabel:
    "Personal certificate of completion: operating AI-natively across mindset, engineering, product, operations, talent, org design, data, governance, and measurement",
  quizPassMessage: "Congratulations! You passed The AI-Native Operator workshop quiz.",
  certificateFileStem: "AI-Native-Operator",
  recordNoun: {
    label: "Certificate of Completion",
    possessive: "Your certificate of completion",
    demonstrative: "This certificate of completion",
  },
};

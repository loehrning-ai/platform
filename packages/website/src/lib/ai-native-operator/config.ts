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
import { createLocalizedTechnicalCourseConfig } from "@/lib/technical-courses/routes";

export const AI_NATIVE_OPERATOR_CONFIG = {
  slug: "ai-native-operator",
  title: "AI-Native Operator",
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
  // Bank size equals served count. The 22-question bank pools all 9 module
  // knowledge-checks' questions verbatim.
  workshopQuizQuestionCount: 22,
  workshopQuizTimeLimitMinutes: 28,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "Course completion record: AI-Native Operator",
  certificateSubtitle:
    "Locally generated completion record from the independent learning platform loehrning.ai. It is not server-verified, externally assessed, accredited, or evidence of regulatory compliance.",
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
    "Personal course completion record: model-assisted operations across task selection, engineering, product, workflows, people, organization, data, governance, and measurement",
  quizPassMessage: "You passed the AI-Native Operator workshop quiz.",
  certificateFileStem: "AI-Native-Operator",
  recordNoun: {
    label: "Course Completion Record",
    possessive: "Your course completion record",
    demonstrative: "This course completion record",
  },
} satisfies CourseConfig;

export const AI_NATIVE_OPERATOR_CONFIG_DE =
  createLocalizedTechnicalCourseConfig(AI_NATIVE_OPERATOR_CONFIG, "de", {
    title: "AI-Native Operator: Praxiskurs",
    certificateTitle: "Teilnahmebestätigung: AI-Native Operator",
    certificateSubtitle:
      "Lokal erzeugter Abschlussnachweis der unabhängigen Lernplattform loehrning.ai. Er ist nicht servergeprüft, nicht fremdbewertet, nicht akkreditiert und kein Nachweis regulatorischer Konformität.",
    certificateModules: [
      "Mindset und Arbeitskultur",
      "Technische Praxis",
      "Produktentwicklung",
      "Betrieb und Abläufe",
      "Personal und Kompetenzen",
      "Organisationsstruktur",
      "Daten und Infrastruktur",
      "Steuerung und Sicherheit",
      "Messung und Wirtschaftlichkeit",
    ],
    certificateReferenceLabel:
      "Persönlicher Abschlussnachweis: modellgestützte Arbeit über Aufgabenauswahl, Technik, Produkt, Abläufe, Personal, Organisation, Daten, Steuerung und Messung",
    quizPassMessage:
      "Das Abschlussquiz des Kurses AI-Native Operator ist bestanden.",
    certificateFileStem: "AI-Native-Operator-Praxiskurs",
    recordNoun: {
      label: "Teilnahmebestätigung",
      possessive: "Deine Teilnahmebestätigung",
      demonstrative: "Diese Teilnahmebestätigung",
    },
  });

// ─── Workshop-quiz question loaders (performance hardening) ────────
//
// The quiz question JSON (~22 KB per course) is loaded PER COURSE via dynamic
// import, mirroring `lib/ai-native/data.ts`'s LESSON_LOADERS. The shared
// WorkshopQuizPage client component already populates questions in a mount
// effect behind a "Quiz wird geladen…" state, so loading them async changes
// no visuals — it only keeps the JSON out of the initial route bundles.
// Server/test callers that need the questions synchronously keep using
// `getWorkshopQuestions` in ./data.

import type { CourseSlug, QuizQuestion } from "./types";
import type { Locale } from "@/lib/i18n/locale";
import { getCourseConfig } from "./config";

const QUESTION_LOADERS: Partial<
  Record<
    CourseSlug,
    Partial<Record<Locale, () => Promise<{ default: unknown }>>>
  >
> = {
  "ki-fuehrerschein": {
    de: () => import("../../../content/ki-fuehrerschein/quiz/questions.json"),
    en: () =>
      import("../../../content/ki-fuehrerschein/en/quiz/questions.json"),
  },
  "eu-ai-act-kurs": {
    de: () => import("../../../content/eu-ai-act-kurs/quiz/questions.json"),
    en: () => import("../../../content/eu-ai-act-kurs/en/quiz/questions.json"),
  },
  "ai-native": {
    de: () => import("../../../content/ai-native/quiz/questions.json"),
    en: () => import("../../../content/ai-native/en/quiz/questions.json"),
  },
  "ki-und-gesellschaft": {
    de: () =>
      import("../../../content/ki-und-gesellschaft/quiz/questions.json"),
    en: () =>
      import("../../../content/ki-und-gesellschaft/en/quiz/questions.json"),
  },
  claude: {
    de: () => import("../../../content/claude/de/quiz/questions.json"),
    en: () => import("../../../content/claude/quiz/questions.json"),
  },
  "ai-native-operator": {
    de: () =>
      import("@/lib/ai-native-operator/workshop-questions").then(
        async (module) => ({
          default: await module.getAiNativeOperatorWorkshopQuestions("de"),
        }),
      ),
    en: () =>
      import("@/lib/ai-native-operator/workshop-questions").then(
        async (module) => ({
          default: await module.getAiNativeOperatorWorkshopQuestions("en"),
        }),
      ),
  },
};

// Memoize per course so retries within one session import the JSON only once.
const questionCache = new Map<string, readonly QuizQuestion[]>();

export async function loadWorkshopQuestions(
  courseSlug: CourseSlug,
  locale?: Locale,
): Promise<readonly QuizQuestion[]> {
  const contentLocale = locale ?? getCourseConfig(courseSlug).language;
  const cacheKey = `${courseSlug}:${contentLocale}`;
  const cached = questionCache.get(cacheKey);
  if (cached) return cached;
  const loader = QUESTION_LOADERS[courseSlug]?.[contentLocale];
  if (!loader) {
    throw new Error(
      `Course "${courseSlug}" has no "${contentLocale}" workshop quiz questions registered.`,
    );
  }
  const mod = await loader();
  const questions = mod.default as QuizQuestion[];
  questionCache.set(cacheKey, questions);
  return questions;
}

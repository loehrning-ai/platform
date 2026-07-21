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

const QUESTION_LOADERS: Partial<
  Record<CourseSlug, () => Promise<{ default: unknown }>>
> = {
  "ki-fuehrerschein": () =>
    import("../../../content/ki-fuehrerschein/quiz/questions.json"),
  "eu-ai-act-kurs": () =>
    import("../../../content/eu-ai-act-kurs/quiz/questions.json"),
  "ai-native": () => import("../../../content/ai-native/quiz/questions.json"),
  "ki-und-gesellschaft": () =>
    import("../../../content/ki-und-gesellschaft/quiz/questions.json"),
  claude: () => import("../../../content/claude/quiz/questions.json"),
};

// Memoize per course so retries within one session import the JSON only once.
const questionCache = new Map<CourseSlug, readonly QuizQuestion[]>();

export async function loadWorkshopQuestions(
  courseSlug: CourseSlug,
): Promise<readonly QuizQuestion[]> {
  const cached = questionCache.get(courseSlug);
  if (cached) return cached;
  const loader = QUESTION_LOADERS[courseSlug];
  if (!loader) {
    throw new Error(
      `Course "${courseSlug}" has no workshop quiz questions registered.`,
    );
  }
  const mod = await loader();
  const questions = mod.default as QuizQuestion[];
  questionCache.set(courseSlug, questions);
  return questions;
}

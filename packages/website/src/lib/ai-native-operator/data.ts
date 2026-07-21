// ─── AI-Native Operator Course content loader ────────
//
// Structured as a Record<ModuleId, () => Promise<...>> loader map, mirroring
// `lib/codex/data.ts`'s LESSON_LOADERS / `lib/course/questions.ts`'s
// QUESTION_LOADERS: a per-module dynamic import(), not one eagerly-imported
// object, so no lesson route's bundle pays for a sibling module's 936 lines
// of source prose. Per-module (not per-lesson) keeps file count sane (9
// files instead of 39) while still keeping the initial-load JSON out of
// every route's bundle.
//
// ─── Widget dispatch mapping ─────────────────────
//
// Every one of the 30 reading lessons' `widgets` arrays (authored in
// ./modules/*.ts) routes its single exercise through a TIER_A kind
// (reflect-box / matrix-grid / slot-fill / self-rate / plays) — never
// through the AI-graded "exercise-free-response" kind. This is deliberate,
// not an oversight: `ai-native-operator/course-app.js` (264 lines, read in
// full) never calls any AI/grading endpoint anywhere in the source, so
// wiring these through an AI-graded widget would misrepresent the source AND
// reintroduce exactly the per-exercise AI-feedback-text storage-bloat risk
// this course's port was designed to avoid (see progress-budget.test.ts).
// Completion is checkpoint-boolean via useCheckpoint; free text/picks stay
// local-draft-only via useDraftValue and are never persisted server-side.
// See widget-wiring.test.ts for the exhaustive guard over all 30 exercises.

import type { AiNativeOperatorLesson, ModuleId } from "./types";
import { MODULE_IDS, MODULE_LESSON_COUNTS } from "./types";

const MODULE_LOADERS: Record<
  ModuleId,
  () => Promise<{ default: readonly AiNativeOperatorLesson[] }>
> = {
  mindset: () =>
    import("./modules/m01-mindset").then((m) => ({ default: m.MINDSET_LESSONS })),
  engineering: () =>
    import("./modules/m02-engineering").then((m) => ({ default: m.ENGINEERING_LESSONS })),
  product: () => import("./modules/m03-product").then((m) => ({ default: m.PRODUCT_LESSONS })),
  operations: () =>
    import("./modules/m04-operations").then((m) => ({ default: m.OPERATIONS_LESSONS })),
  talent: () => import("./modules/m05-talent").then((m) => ({ default: m.TALENT_LESSONS })),
  orgmodel: () => import("./modules/m06-orgmodel").then((m) => ({ default: m.ORGMODEL_LESSONS })),
  data: () => import("./modules/m07-data").then((m) => ({ default: m.DATA_LESSONS })),
  governance: () =>
    import("./modules/m08-governance").then((m) => ({ default: m.GOVERNANCE_LESSONS })),
  measurement: () =>
    import("./modules/m09-measurement").then((m) => ({ default: m.MEASUREMENT_LESSONS })),
};

// Memoized per module so a single request that touches a module more than
// once (e.g. metadata + page render) imports its module only once.
const moduleCache = new Map<ModuleId, readonly AiNativeOperatorLesson[]>();

export async function getModuleLessons(
  moduleId: ModuleId,
): Promise<readonly AiNativeOperatorLesson[]> {
  const cached = moduleCache.get(moduleId);
  if (cached) return cached;
  const loader = MODULE_LOADERS[moduleId];
  const mod = await loader();
  moduleCache.set(moduleId, mod.default);
  return mod.default;
}

export async function getLesson(
  moduleId: ModuleId,
  lessonNumber: number,
): Promise<AiNativeOperatorLesson | undefined> {
  const lessons = await getModuleLessons(moduleId);
  return lessons.find((l) => l.lessonNumber === lessonNumber);
}

export async function getAllModuleLessonPairs(): Promise<
  readonly { readonly moduleId: ModuleId; readonly lessonNumber: number }[]
> {
  return MODULE_IDS.flatMap((moduleId) =>
    Array.from({ length: MODULE_LESSON_COUNTS[moduleId] }, (_, i) => ({
      moduleId,
      lessonNumber: i + 1,
    })),
  );
}

export async function getAllLessons(): Promise<readonly AiNativeOperatorLesson[]> {
  const all = await Promise.all(MODULE_IDS.map(getModuleLessons));
  return all.flat();
}

/** Test-only: clear the per-module cache between cases. */
export function __resetAiNativeOperatorCacheForTests(): void {
  moduleCache.clear();
}

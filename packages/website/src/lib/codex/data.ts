// ─── Codex Course content loader ───────────────
//
// Structured as a Record<LessonId, () => Promise<...>> loader map,
// mirroring `lib/course/questions.ts`'s QUESTION_LOADERS and
// `lib/claude-course/data.ts`'s LESSON_LOADERS: a per-lesson dynamic
// import(), not one eagerly-imported array, so no lesson route's bundle
// pays for a sibling lesson's content.

import type { CodexLesson, LessonId } from "./types";
import { CODEX_LESSON_IDS, CODEX_TRACKS } from "./types";

const LESSON_LOADERS: Record<
  LessonId,
  () => Promise<{ default: CodexLesson }>
> = {
  L01: () => import("./lessons/l01-mental-model"),
  L02: () => import("./lessons/l02-sandbox"),
  L03: () => import("./lessons/l03-agents-md"),
  L04: () => import("./lessons/l04-task-spec"),
  L05: () => import("./lessons/l05-scope"),
  L06: () => import("./lessons/l06-acceptance"),
  L07: () => import("./lessons/l07-review"),
  L08: () => import("./lessons/l08-iterate"),
  L09: () => import("./lessons/l09-tools"),
  L10: () => import("./lessons/l10-parallelism"),
  L11: () => import("./lessons/l11-patterns"),
  L12: () => import("./lessons/l12-workflow"),
};

// Memoized per lesson so a single request that touches a lesson more than
// once (e.g. metadata + page render) imports its module only once.
const lessonCache = new Map<LessonId, CodexLesson>();

export async function getCodexLesson(
  id: LessonId,
): Promise<CodexLesson | undefined> {
  const cached = lessonCache.get(id);
  if (cached) return cached;
  const loader = LESSON_LOADERS[id];
  if (!loader) return undefined;
  const mod = await loader();
  lessonCache.set(id, mod.default);
  return mod.default;
}

export async function getAllCodexLessons(): Promise<readonly CodexLesson[]> {
  const all = await Promise.all(CODEX_LESSON_IDS.map(getCodexLesson));
  return all
    .filter((l): l is CodexLesson => l != null)
    .sort((a, b) => a.number - b.number);
}

export function getCodexTracks() {
  return CODEX_TRACKS;
}

export function getCodexTotalLessons(): number {
  return CODEX_LESSON_IDS.length;
}

/** Test-only: clear the per-lesson cache between cases. */
export function __resetCodexLessonCacheForTests(): void {
  lessonCache.clear();
}

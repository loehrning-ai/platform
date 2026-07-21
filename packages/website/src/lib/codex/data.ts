// ─── Codex Course content loader (plan 009 stage 3) ─────────────────
//
// Structured as a Partial<Record<LessonId, () => Promise<...>>> loader map,
// mirroring `lib/course/questions.ts`'s QUESTION_LOADERS and
// `lib/claude-course/data.ts`'s LESSON_LOADERS: a per-lesson dynamic
// import(), not one eagerly-imported array, so no lesson route's bundle
// pays for a sibling lesson's content.

import type { CodexLesson, LessonId } from "./types";
import { CODEX_LESSON_IDS, CODEX_TRACKS } from "./types";

// Partial for now: plan 009 stage 3 lands tracks 1-2 (L01-L06), stage 4
// lands tracks 3-4 (L07-L12). Tightens to a full Record<LessonId, ...> once
// stage 4 registers the remaining six entries.
const LESSON_LOADERS: Partial<
  Record<LessonId, () => Promise<{ default: CodexLesson }>>
> = {
  L01: () => import("./lessons/l01-mental-model"),
  L02: () => import("./lessons/l02-sandbox"),
  L03: () => import("./lessons/l03-agents-md"),
  L04: () => import("./lessons/l04-task-spec"),
  L05: () => import("./lessons/l05-scope"),
  L06: () => import("./lessons/l06-acceptance"),
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

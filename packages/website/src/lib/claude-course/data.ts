// ─── Claude Course content loader (plan 008 stage 2) ────────────────
//
// Structured as a Partial<Record<ClaudeLessonId, () => Promise<...>>> loader
// map, mirroring `lib/course/questions.ts`'s QUESTION_LOADERS and
// `lib/ai-native/data.ts`'s LESSON_LOADERS, a per-lesson dynamic import, not
// one eagerly-imported array, so no lesson route's bundle pays for a
// sibling lesson's content.

import type { ClaudeLesson, ClaudeLessonId } from "./types";
import { CLAUDE_LESSON_IDS, CLAUDE_TRACKS } from "./types";

const LESSON_LOADERS: Record<
  ClaudeLessonId,
  () => Promise<{ default: ClaudeLesson }>
> = {
  "mental-model": () => import("./lessons/mental-model"),
  anatomy: () => import("./lessons/anatomy"),
  context: () => import("./lessons/context"),
  "claude-md": () => import("./lessons/claude-md"),
  iteration: () => import("./lessons/iteration"),
  gdocs: () => import("./lessons/gdocs"),
  agents: () => import("./lessons/agents"),
  reviews: () => import("./lessons/reviews"),
  grounding: () => import("./lessons/grounding"),
  team: () => import("./lessons/team"),
  evals: () => import("./lessons/evals"),
  safety: () => import("./lessons/safety"),
};

// Memoized per lesson so a single request that touches a lesson more than
// once (e.g. metadata + page render) imports its module only once.
const lessonCache = new Map<ClaudeLessonId, ClaudeLesson>();

export async function getClaudeLesson(
  id: ClaudeLessonId,
): Promise<ClaudeLesson | undefined> {
  const cached = lessonCache.get(id);
  if (cached) return cached;
  const loader = LESSON_LOADERS[id];
  if (!loader) return undefined;
  const mod = await loader();
  lessonCache.set(id, mod.default);
  return mod.default;
}

export async function getAllClaudeLessons(): Promise<readonly ClaudeLesson[]> {
  const all = await Promise.all(CLAUDE_LESSON_IDS.map(getClaudeLesson));
  return all
    .filter((l): l is ClaudeLesson => l != null)
    .sort((a, b) => a.number - b.number);
}

export function getClaudeTracks() {
  return CLAUDE_TRACKS;
}

export function getClaudeTotalLessons(): number {
  return CLAUDE_LESSON_IDS.length;
}

/** Test-only: clear the per-lesson cache between cases. */
export function __resetClaudeLessonCacheForTests(): void {
  lessonCache.clear();
}

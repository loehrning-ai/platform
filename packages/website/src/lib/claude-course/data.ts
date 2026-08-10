// ─── Claude Course content loader ────────────────
//
// Structured as a Partial<Record<ClaudeLessonId, () => Promise<...>>> loader
// map, mirroring `lib/course/questions.ts`'s QUESTION_LOADERS and
// `lib/ai-native/data.ts`'s LESSON_LOADERS, a per-lesson dynamic import, not
// one eagerly-imported array, so no lesson route's bundle pays for a
// sibling lesson's content.

import type { Locale } from "@/lib/i18n/locale";
import type { ClaudeLesson, ClaudeLessonId } from "./types";
import { CLAUDE_LESSON_IDS, CLAUDE_TRACKS_BY_LOCALE } from "./types";

type ClaudeLessonLoader = () => Promise<{ default: ClaudeLesson }>;

function jsonLessonLoader(
  loader: () => Promise<{ default: unknown }>,
): ClaudeLessonLoader {
  return async () => ({
    default: (await loader()).default as ClaudeLesson,
  });
}

const EN_LESSON_LOADERS: Record<ClaudeLessonId, ClaudeLessonLoader> = {
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

const DE_LESSON_LOADERS: Record<ClaudeLessonId, ClaudeLessonLoader> = {
  "mental-model": jsonLessonLoader(
    () => import("../../../content/claude/de/lessons/mental-model.json"),
  ),
  anatomy: jsonLessonLoader(
    () => import("../../../content/claude/de/lessons/anatomy.json"),
  ),
  context: jsonLessonLoader(
    () => import("../../../content/claude/de/lessons/context.json"),
  ),
  "claude-md": jsonLessonLoader(
    () => import("../../../content/claude/de/lessons/claude-md.json"),
  ),
  iteration: jsonLessonLoader(
    () => import("../../../content/claude/de/lessons/iteration.json"),
  ),
  gdocs: jsonLessonLoader(
    () => import("../../../content/claude/de/lessons/gdocs.json"),
  ),
  agents: jsonLessonLoader(
    () => import("../../../content/claude/de/lessons/agents.json"),
  ),
  reviews: jsonLessonLoader(
    () => import("../../../content/claude/de/lessons/reviews.json"),
  ),
  grounding: jsonLessonLoader(
    () => import("../../../content/claude/de/lessons/grounding.json"),
  ),
  team: jsonLessonLoader(
    () => import("../../../content/claude/de/lessons/team.json"),
  ),
  evals: jsonLessonLoader(
    () => import("../../../content/claude/de/lessons/evals.json"),
  ),
  safety: jsonLessonLoader(
    () => import("../../../content/claude/de/lessons/safety.json"),
  ),
};

const LESSON_LOADERS_BY_LOCALE: Readonly<
  Record<Locale, Record<ClaudeLessonId, ClaudeLessonLoader>>
> = {
  de: DE_LESSON_LOADERS,
  en: EN_LESSON_LOADERS,
};

// Memoized per lesson so a single request that touches a lesson more than
// once (e.g. metadata + page render) imports its module only once.
const lessonCache = new Map<string, ClaudeLesson>();

export async function getClaudeLesson(
  id: ClaudeLessonId,
  locale: Locale = "en",
): Promise<ClaudeLesson | undefined> {
  const cacheKey = `${locale}:${id}`;
  const cached = lessonCache.get(cacheKey);
  if (cached) return cached;
  const loader = LESSON_LOADERS_BY_LOCALE[locale][id];
  if (!loader) return undefined;
  const mod = await loader();
  const lesson = mod.default as ClaudeLesson;
  lessonCache.set(cacheKey, lesson);
  return lesson;
}

export async function getAllClaudeLessons(
  locale: Locale = "en",
): Promise<readonly ClaudeLesson[]> {
  const all = await Promise.all(
    CLAUDE_LESSON_IDS.map((lessonId) => getClaudeLesson(lessonId, locale)),
  );
  return all
    .filter((l): l is ClaudeLesson => l != null)
    .sort((a, b) => a.number - b.number);
}

export function getClaudeTracks(locale: Locale = "en") {
  return CLAUDE_TRACKS_BY_LOCALE[locale];
}

export function getClaudeTotalLessons(): number {
  return CLAUDE_LESSON_IDS.length;
}

/** Test-only: clear the per-lesson cache between cases. */
export function __resetClaudeLessonCacheForTests(): void {
  lessonCache.clear();
}

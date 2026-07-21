// ─── Data Engineering Fundamentals chapter-component loader (plan 011 stage 1) ───
//
// Structured as a per-chapter dynamic-import loader map, mirroring
// `lib/data-infrastructure/data.ts`'s `LESSON_LOADERS`: a per-chapter
// dynamic `import()`, not one eagerly-imported module, so no chapter
// route's bundle pays for a sibling chapter's content (which, for this
// course, includes its own bespoke interactive simulators — much heavier
// per-chapter than data-infrastructure's prose-only lesson content).
//
// Unlike `lib/data-infrastructure`, this course's chapters are not built
// from a generic sections+widgets data shape — the source is already a
// hand-built React layout per chapter (Hero + prose + inline simulators in
// a fixed arrangement), so each loader resolves a real chapter COMPONENT,
// not a data object. `CHAPTER_LOADERS` starts `Partial` and is populated
// incrementally as each chapter is assembled (plan 011 stage 9 completes
// all 12 entries and tightens this to a full, non-partial `Record`).

import type { ComponentType } from "react";
import type { DefChapterId } from "./types";
import { isDefChapterId } from "./types";

export type DefChapterComponent = ComponentType;
type DefChapterLoader = () => Promise<{ default: DefChapterComponent }>;

const CHAPTER_LOADERS: Partial<Record<DefChapterId, DefChapterLoader>> = {};

const chapterCache = new Map<DefChapterId, DefChapterComponent>();

export async function getDefChapterComponent(
  id: DefChapterId,
): Promise<DefChapterComponent | undefined> {
  if (!isDefChapterId(id)) return undefined;
  const cached = chapterCache.get(id);
  if (cached) return cached;
  const loader = CHAPTER_LOADERS[id];
  if (!loader) return undefined;
  const mod = await loader();
  chapterCache.set(id, mod.default);
  return mod.default;
}

/** Test-only: clear the per-chapter cache between cases. */
export function __resetDefChapterCacheForTests(): void {
  chapterCache.clear();
}

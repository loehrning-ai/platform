// ─── Data Engineering Fundamentals chapter-component loader (plan 011 stage 1, populated stage 9) ───
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
// not a data object. All 12 entries populated in stage 9.

import type { ComponentType } from "react";
import type { ChapterMeta, DefChapterId } from "./types";
import { DEF_CHAPTER_IDS, isDefChapterId } from "./types";

export interface ChapterBodyProps {
  readonly chapter: ChapterMeta;
  /**
   * Only the "home" (Ch_Overview) chapter uses this — every other chapter
   * component ignores it. Kept on the shared prop shape so `getDefChapterComponent`
   * returns one uniform component type instead of a per-chapter union.
   */
  readonly goTo: (id: DefChapterId) => void;
}

export type DefChapterComponent = ComponentType<ChapterBodyProps>;
type DefChapterLoader = () => Promise<{ default: DefChapterComponent }>;

const CHAPTER_LOADERS: Record<DefChapterId, DefChapterLoader> = {
  home: () => import("@/components/data-engineering-fundamentals/chapters/ch-overview"),
  fund: () => import("@/components/data-engineering-fundamentals/chapters/ch0-fundamentals"),
  ingest: () => import("@/components/data-engineering-fundamentals/chapters/ch1-ingest"),
  stream: () => import("@/components/data-engineering-fundamentals/chapters/ch1-5-streaming"),
  store: () => import("@/components/data-engineering-fundamentals/chapters/ch2-store"),
  comp: () => import("@/components/data-engineering-fundamentals/chapters/ch3-compute"),
  orch: () => import("@/components/data-engineering-fundamentals/chapters/ch4-orchestrate"),
  qual: () => import("@/components/data-engineering-fundamentals/chapters/ch5-quality"),
  disc: () => import("@/components/data-engineering-fundamentals/chapters/ch6-discover"),
  serve: () => import("@/components/data-engineering-fundamentals/chapters/ch7-serve"),
  gov: () => import("@/components/data-engineering-fundamentals/chapters/ch8-govern"),
  cap: () => import("@/components/data-engineering-fundamentals/chapters/ch9-capstone"),
};

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

export async function getAllDefChapterComponents(): Promise<
  ReadonlyMap<DefChapterId, DefChapterComponent>
> {
  const entries = await Promise.all(
    DEF_CHAPTER_IDS.map(async (id) => [id, await getDefChapterComponent(id)] as const),
  );
  const map = new Map<DefChapterId, DefChapterComponent>();
  for (const [id, comp] of entries) {
    if (comp) map.set(id, comp);
  }
  return map;
}

/** Test-only: clear the per-chapter cache between cases. */
export function __resetDefChapterCacheForTests(): void {
  chapterCache.clear();
}

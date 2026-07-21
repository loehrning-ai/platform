// ─── Data Science chapter-component loader (plan 012 stage 1) ────────
//
// Structured as a per-chapter dynamic-import loader map, mirroring
// `lib/data-engineering-fundamentals/content.ts`'s `CHAPTER_LOADERS`: a
// per-chapter dynamic `import()`, not one eagerly-imported module, so no
// chapter route's bundle pays for a sibling chapter's content (which, for
// this course, includes its own bespoke SVG/RAF simulators — much heavier
// per-chapter than a plain prose lesson).
//
// The source is already a hand-built React layout per chapter (Hero +
// prose + inline simulators in a fixed arrangement), so each loader
// resolves a real chapter COMPONENT, not a data object. `CHAPTER_LOADERS`
// starts `Partial` and is populated incrementally as each chapter is
// ported (stages 6-11 populate all 13 entries).

import type { ComponentType } from "react";
import type { ChapterMeta, DsChapterId } from "./types";
import { DS_CHAPTER_IDS, isDsChapterId } from "./types";

export interface DsChapterBodyProps {
  readonly chapter: ChapterMeta;
}

export type DsChapterComponent = ComponentType<DsChapterBodyProps>;
type DsChapterLoader = () => Promise<{ default: DsChapterComponent }>;

const CHAPTER_LOADERS: Partial<Record<DsChapterId, DsChapterLoader>> = {
  fund: () => import("@/components/data-science/chapters/ch01-fundamentals"),
  eval: () => import("@/components/data-science/chapters/ch06-evaluate"),
};

const chapterCache = new Map<DsChapterId, DsChapterComponent>();

export async function getDsChapterComponent(
  id: DsChapterId,
): Promise<DsChapterComponent | undefined> {
  if (!isDsChapterId(id)) return undefined;
  const cached = chapterCache.get(id);
  if (cached) return cached;
  const loader = CHAPTER_LOADERS[id];
  if (!loader) return undefined;
  const mod = await loader();
  chapterCache.set(id, mod.default);
  return mod.default;
}

export async function getAllDsChapterComponents(): Promise<
  ReadonlyMap<DsChapterId, DsChapterComponent>
> {
  const entries = await Promise.all(
    DS_CHAPTER_IDS.map(async (id) => [id, await getDsChapterComponent(id)] as const),
  );
  const map = new Map<DsChapterId, DsChapterComponent>();
  for (const [id, comp] of entries) {
    if (comp) map.set(id, comp);
  }
  return map;
}

/** Test-only: clear the per-chapter cache between cases. */
export function __resetDsChapterCacheForTests(): void {
  chapterCache.clear();
}

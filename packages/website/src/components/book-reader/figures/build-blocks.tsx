import type { ReactNode } from "react";
import type { ChapterSegment } from "@/components/book-reader/chapter-markdown";
import { loadBookFigures } from "@/lib/book-figures";
import type { Locale } from "@/lib/i18n/locale";
import { blockContext, renderDirective } from "./blocks";

/**
 * One node per segment of a chapter: the figure for a directive segment, null
 * for a text run. This module is the only importer of the island builders, and
 * the chapter page loads it with a dynamic import, so the islands are bundled
 * and shipped only for chapters that hold a figure line.
 */
export async function buildChapterFigureBlocks(
  bookSlug: string,
  locale: Locale,
  segments: readonly ChapterSegment[],
): Promise<(ReactNode | null)[]> {
  const figures = await loadBookFigures(bookSlug);
  const ctx = blockContext(figures, locale);
  return segments.map((segment) => (segment.kind === "directive" ? renderDirective(ctx, segment.directive) : null));
}

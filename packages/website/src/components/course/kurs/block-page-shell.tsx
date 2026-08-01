import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import {
  getBlock,
  getBlocks,
  getCourseBlockIds,
  getCourseConfig,
  getBlockFreshness,
} from "@/lib/course/data";
import { LessonLayout } from "@/components/course/kurs/lesson-layout";
import { SITE_URL } from "@/lib/seo/json-ld";
import type { BlockId, CourseSlug } from "@/lib/course/types";

/**
 * Shared block-page renderer + metadata helper for every free course
 * (shared course architecture). The two `[blockId]/page.tsx` route
 * files are thin wrappers that pass a `courseSlug`.
 */

export function blockStaticParams(courseSlug: CourseSlug) {
  return getCourseBlockIds(courseSlug).map((id) => ({ blockId: id }));
}

export function blockMetadata(
  courseSlug: CourseSlug,
  blockId: string,
): Metadata {
  const block = getBlock(courseSlug, blockId as BlockId);
  if (!block) return { title: "Block nicht gefunden" };
  const config = getCourseConfig(courseSlug);
  const blockUrl = `${SITE_URL}${config.coursePath}/${blockId}`;
  return {
    title: `Block ${block.orderIndex + 1}: ${block.title} (${config.title})`,
    description: `${block.description} ${block.lessons.length} Lektionen, ${block.durationMinutes} Minuten.`,
    robots: { index: false, follow: true },
    openGraph: {
      title: `Block ${block.orderIndex + 1}: ${block.title} (${config.title})`,
      description: block.description,
      url: blockUrl,
      type: "article",
    },
  };
}

interface BlockPageShellProps {
  readonly courseSlug: CourseSlug;
  readonly blockId: string;
}

export function BlockPageShell({ courseSlug, blockId }: BlockPageShellProps) {
  const blockIds = getCourseBlockIds(courseSlug);
  if (!blockIds.includes(blockId as BlockId)) {
    notFound();
  }

  const block = getBlock(courseSlug, blockId as BlockId);
  if (!block || block.lessons.length === 0) {
    notFound();
  }

  const config = getCourseConfig(courseSlug);
  const blocks = getBlocks(courseSlug);
  const totalDuration = block.lessons.reduce(
    (sum, l) => sum + l.durationMinutes,
    0,
  );
  const freshnessMeta = getBlockFreshness(courseSlug, blockId as BlockId);

  return (
    <div className="min-h-[100svh] bg-background">
      {/* Sub-header below site nav */}
      <header className="sticky top-16 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-6">
          <Link
            href={config.coursePath}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Alle Blöcke
          </Link>
          <div className="text-center">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Block {block.orderIndex + 1} / {blocks.length}
            </span>
            <span className="mx-2 text-border">|</span>
            <h1 className="inline text-sm font-medium">{block.title}</h1>
          </div>
          <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {totalDuration} Min
          </span>
        </div>
      </header>

      {/* Two-Column Lesson Layout */}
      <div>
        <LessonLayout
          courseSlug={courseSlug}
          lessons={block.lessons}
          blockTitle={block.title}
          freshnessMeta={freshnessMeta}
        />
      </div>
    </div>
  );
}

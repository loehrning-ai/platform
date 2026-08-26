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
import type { Locale } from "@/lib/i18n/locale";
import { localizeHref } from "@/lib/i18n/locale";
import { getCourseReaderCopy } from "./course-ui-copy";

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
  locale: Locale = "de",
): Metadata {
  const copy = getCourseReaderCopy(locale);
  const block = getBlock(courseSlug, blockId as BlockId, locale);
  if (!block) return { title: copy.block.notFoundTitle };
  const config = getCourseConfig(courseSlug, locale);
  const blockPath = localizeHref(`${config.coursePath}/${blockId}`, locale);
  const blockUrl = `${SITE_URL}${blockPath}`;
  return {
    title: `Block ${block.orderIndex + 1}: ${block.title} (${config.title})`,
    description: `${block.description} ${copy.block.lessonCount(block.lessons.length)}, ${copy.block.minutes(block.durationMinutes)}.`,
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
  readonly locale?: Locale;
}

export function BlockPageShell({
  courseSlug,
  blockId,
  locale = "de",
}: BlockPageShellProps) {
  const blockIds = getCourseBlockIds(courseSlug, locale);
  if (!blockIds.includes(blockId as BlockId)) {
    notFound();
  }

  const block = getBlock(courseSlug, blockId as BlockId, locale);
  if (!block || block.lessons.length === 0) {
    notFound();
  }

  const config = getCourseConfig(courseSlug, locale);
  const copy = getCourseReaderCopy(locale);
  const blocks = getBlocks(courseSlug, locale);
  const totalDuration = block.lessons.reduce(
    (sum, l) => sum + l.durationMinutes,
    0,
  );
  const freshnessMeta = getBlockFreshness(
    courseSlug,
    blockId as BlockId,
    locale,
  );

  return (
    <div className="min-h-[100svh] bg-background">
      {/* Sub-header below site nav */}
      <header className="sticky top-16 z-40 w-full border-b border-border bg-background">
        <div className="mx-auto grid min-h-14 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-2 sm:flex sm:h-12 sm:min-h-0 sm:px-6 sm:py-0">
          <Link
            href={localizeHref(config.coursePath, locale)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.block.allBlocks}
          </Link>
          <div className="order-3 col-span-2 min-w-0 text-left sm:order-none sm:col-span-1 sm:text-center">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {copy.block.blockPosition(block.orderIndex + 1, blocks.length)}
            </span>
            <span className="mx-2 hidden text-border sm:inline">|</span>
            <h1 className="block break-words text-xs font-medium sm:inline sm:text-sm">
              {block.title}
            </h1>
          </div>
          <span className="order-2 inline-flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground sm:order-none">
            <Clock className="h-3 w-3" />
            {copy.block.minutes(totalDuration)}
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
          locale={locale}
        />
      </div>
    </div>
  );
}

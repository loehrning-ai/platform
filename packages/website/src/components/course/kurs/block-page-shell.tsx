import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import {
  getBlock,
  getBlocks,
  getCourseBlockIds,
  getCourseConfig,
  getBlockFreshness,
} from "@/lib/course/data";
import { LessonLayout } from "@/components/course/kurs/lesson-layout";
import { OpenWithYourAiRegion } from "@/components/course/open-with-your-ai-region";
import { hasLessonBodies } from "@/lib/mcp/catalog";
import { lessonUri } from "@/lib/mcp/uris";
import { SITE_URL } from "@/lib/seo/json-ld";
import type { BlockId, CourseSlug } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n/locale";
import { localizeHref } from "@/lib/i18n/locale";
import { getCourseReaderCopy } from "./course-ui-copy";
import { isEngineLesson } from "@/lib/lesson-engine/lesson";

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
  const unit = block.lessons.some((lesson) => isEngineLesson(lesson))
    ? locale === "de"
      ? "Modul"
      : "Module"
    : "Block";
  const blockPath = localizeHref(`${config.coursePath}/${blockId}`, locale);
  const blockUrl = `${SITE_URL}${blockPath}`;
  return {
    title: `${unit} ${block.orderIndex + 1}: ${block.title} (${config.title})`,
    description: `${block.description} ${copy.block.lessonCount(block.lessons.length)}, ${copy.block.minutes(block.durationMinutes)}.`,
    robots: { index: false, follow: true },
    openGraph: {
      title: `${unit} ${block.orderIndex + 1}: ${block.title} (${config.title})`,
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
    // A course that moved to the lesson engine retired some block ids (for
    // example KI-Führerschein's block_5). Old bookmarks land on the hub.
    if (
      /^block_\d+$/.test(blockId) &&
      getBlock(courseSlug, blockIds[0], locale)?.lessons.some((lesson) =>
        isEngineLesson(lesson),
      )
    ) {
      redirect(localizeHref(getCourseConfig(courseSlug, locale).coursePath, locale));
    }
    notFound();
  }

  const block = getBlock(courseSlug, blockId as BlockId, locale);
  if (!block || block.lessons.length === 0) {
    notFound();
  }

  const config = getCourseConfig(courseSlug, locale);
  const copy = getCourseReaderCopy(locale);
  const blocks = getBlocks(courseSlug, locale);
  const blockIndex = blocks.findIndex((item) => item.id === block.id);
  const nextBlock = blocks[blockIndex + 1];
  const followingHref = nextBlock
    ? `${config.coursePath}/${nextBlock.id}#lesson=${encodeURIComponent(nextBlock.lessons[0].id)}`
    : `${config.coursePath}/quiz`;
  const totalDuration = block.lessons.reduce(
    (sum, l) => sum + l.durationMinutes,
    0,
  );
  // Lesson-engine courses call their units "Module".
  const engineCourse = block.lessons.some((lesson) => isEngineLesson(lesson));
  const unitWord = engineCourse
    ? locale === "de"
      ? "Modul"
      : "Module"
    : "Block";
  const freshnessMeta = getBlockFreshness(
    courseSlug,
    blockId as BlockId,
    locale,
  );

  const lessonOffset = blocks
    .slice(0, blockIndex)
    .reduce((sum, item) => sum + item.lessons.length, 0);
  const courseLessonCount = blocks.reduce((sum, item) => sum + item.lessons.length, 0);
  const followingLabel = nextBlock
    ? engineCourse
      ? locale === "de"
        ? `Weiter mit Modul ${block.orderIndex + 2}: ${nextBlock.title}`
        : `Continue with module ${block.orderIndex + 2}: ${nextBlock.title}`
      : (locale === "de" ? "Nächster Block" : "Next block")
    : (locale === "de" ? "Zur Prüfung" : "Assessment");
  const aiResources = hasLessonBodies(courseSlug)
    ? block.lessons.map((lesson) => ({
        uri: lessonUri(courseSlug, lesson.id, locale),
        title: lesson.title,
      }))
    : [];

  if (engineCourse) {
    // Course-app reader: the sticky course header inside the shell replaces
    // the old subheader, and the outline lists the whole course.
    let number = 0;
    const outline = blocks.map((item) => ({
      id: item.id,
      number: item.orderIndex + 1,
      title: item.title,
      lessons: item.lessons.map((lesson) => {
        number += 1;
        return {
          id: lesson.id,
          number,
          title: lesson.title,
          durationMinutes: lesson.durationMinutes,
          href:
            item.id === block.id
              ? undefined
              : localizeHref(
                  `${config.coursePath}/${item.id}#lesson=${encodeURIComponent(lesson.id)}`,
                  locale,
                ),
        };
      }),
    }));
    return (
      <div className="course-app-ground min-h-[100svh]" data-course-reader={courseSlug}>
        <OpenWithYourAiRegion
          kind="lesson"
          contextTitle={`${config.title}: ${block.title}`}
          resources={aiResources}
          locale={locale}
          look="app"
        />
        <LessonLayout
          courseSlug={courseSlug}
          lessons={block.lessons}
          blockTitle={block.title}
          freshnessMeta={freshnessMeta}
          locale={locale}
          lessonOffset={lessonOffset}
          courseLessonCount={courseLessonCount}
          followingHref={localizeHref(followingHref, locale)}
          moduleLabel={`${unitWord} ${block.orderIndex + 1} · ${block.title}`}
          followingLabel={followingLabel}
          courseApp={{
            outline,
            courseTitle: config.title,
            hubHref: localizeHref(config.coursePath, locale),
            moduleNumber: block.orderIndex + 1,
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-background">
      {/* On phones this context stays in document flow; the lesson toolbar is
          the only sticky course band. Desktop keeps its existing subheader. */}
      <header className="relative z-40 w-full border-b border-border bg-background lg:sticky lg:top-[var(--nav-h)]">
        <div className="mx-auto grid min-h-14 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-2 sm:flex sm:h-12 sm:min-h-0 sm:px-6 sm:py-0">
          <Link
            href={localizeHref(config.coursePath, locale)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft className="h-4 w-4" />
            {engineCourse
              ? locale === "de"
                ? "Alle Module"
                : "All modules"
              : copy.block.allBlocks}
          </Link>
          <div className="order-3 col-span-2 min-w-0 text-left sm:order-none sm:col-span-1 sm:text-center">
            <span className="text-label text-muted-foreground tabular-nums">
              {engineCourse
                ? `${unitWord} ${block.orderIndex + 1} / ${blocks.length}`
                : copy.block.blockPosition(block.orderIndex + 1, blocks.length)}
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

      <OpenWithYourAiRegion
        kind="lesson"
        contextTitle={`${config.title}: ${block.title}`}
        resources={
          hasLessonBodies(courseSlug)
            ? block.lessons.map((lesson) => ({
                uri: lessonUri(courseSlug, lesson.id, locale),
                title: lesson.title,
              }))
            : []
        }
        locale={locale}
      />

      {/* Two-Column Lesson Layout */}
      <div>
        <LessonLayout
          courseSlug={courseSlug}
          lessons={block.lessons}
          blockTitle={block.title}
          freshnessMeta={freshnessMeta}
          locale={locale}
          lessonOffset={blocks.slice(0, blockIndex).reduce((sum, item) => sum + item.lessons.length, 0)}
          courseLessonCount={blocks.reduce((sum, item) => sum + item.lessons.length, 0)}
          followingHref={localizeHref(followingHref, locale)}
          moduleLabel={
            engineCourse
              ? `${unitWord} ${block.orderIndex + 1} · ${block.title}`
              : undefined
          }
          followingLabel={nextBlock
            ? engineCourse
              ? locale === "de"
                ? `Weiter mit Modul ${block.orderIndex + 2}: ${nextBlock.title}`
                : `Continue with module ${block.orderIndex + 2}: ${nextBlock.title}`
              : (locale === "de" ? "Nächster Block" : "Next block")
            : (locale === "de" ? "Zur Prüfung" : "Assessment")}
        />
      </div>
    </div>
  );
}

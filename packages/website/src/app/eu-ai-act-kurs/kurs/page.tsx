import { getBlocks, getTotalLessonCount } from "@/lib/course/data";
import type { BlockSummary } from "@/lib/course/types";
import { KursContent } from "./kurs-content";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

// Server half of the course hub (performance hardening): derives slim
// `BlockSummary` props from the heavy course-data module so the
// lesson/quiz/glossary JSON graph (~420 KB) stays out of this route's
// client bundle. The interactive hub UI lives in ./kurs-content.tsx.

const COURSE_SLUG = "eu-ai-act-kurs" as const;

export default async function KursPage() {
  const contentLocale = resolveFoundationCourseContentLocale(
    COURSE_SLUG,
    await getRequestLocale(),
  );
  const blocks: readonly BlockSummary[] = getBlocks(
    COURSE_SLUG,
    contentLocale,
  ).map((block) => ({
    id: block.id,
    title: block.title,
    description: block.description,
    durationMinutes: block.durationMinutes,
    orderIndex: block.orderIndex,
    lessonIds: block.lessons.map((lesson) => lesson.id),
  }));

  return (
    <KursContent
      blocks={blocks}
      totalLessons={getTotalLessonCount(COURSE_SLUG, contentLocale)}
      locale={contentLocale}
    />
  );
}

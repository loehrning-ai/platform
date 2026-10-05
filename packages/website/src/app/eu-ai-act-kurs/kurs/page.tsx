import { getBlocks } from "@/lib/course/data";
import type { ModuleOverviewModule } from "@/components/lesson-engine/module-overview";
import { KursContent } from "./kurs-content";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

// Server half of the course hub (performance hardening): derives slim module
// summaries from the course-data module so lesson bodies stay out of this
// route's client bundle. The interactive hub UI lives in ./kurs-content.tsx.

const COURSE_SLUG = "eu-ai-act-kurs" as const;

export default async function KursPage() {
  const contentLocale = resolveFoundationCourseContentLocale(
    COURSE_SLUG,
    await getRequestLocale(),
  );
  const modules: readonly ModuleOverviewModule[] = getBlocks(
    COURSE_SLUG,
    contentLocale,
  ).map((block) => ({
    id: block.id,
    title: block.title,
    description: block.description,
    durationMinutes: block.durationMinutes,
    orderIndex: block.orderIndex,
    lessons: block.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      durationMinutes: lesson.durationMinutes,
    })),
  }));

  return <KursContent modules={modules} locale={contentLocale} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClaudeLessonPage } from "@/components/imported-courses/claude/claude-lesson-page";
import { getClaudeCourseBundle } from "@/lib/claude-course/localization";
import { isClaudeLessonId } from "@/lib/claude-course/types";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import {
  buildTechnicalCourseMetadata,
  getTechnicalCourseStaticParams,
  technicalCourseHref,
} from "@/lib/technical-courses/routes";

interface PageProps {
  readonly params: Promise<{ lessonId: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return [...getTechnicalCourseStaticParams("claude")];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const [{ lessonId }, locale] = await Promise.all([
    params,
    getRequestLocale(),
  ]);
  if (!isClaudeLessonId(lessonId)) {
    return {
      title: locale === "de" ? "Lektion nicht gefunden" : "Lesson not found",
      robots: { index: false, follow: true },
    };
  }
  const bundle = await getClaudeCourseBundle(locale);
  const lesson = bundle.content.lessons.find((item) => item.id === lessonId);
  if (!lesson) {
    return {
      title: locale === "de" ? "Lektion nicht gefunden" : "Lesson not found",
      robots: { index: false, follow: true },
    };
  }
  return buildTechnicalCourseMetadata({
    courseSlug: "claude",
    locale,
    target: { kind: "lesson", lessonId },
    title: `${lesson.title}: ${bundle.config.title}`,
    description: lesson.subtitle,
    availableContentLocales: ["de", "en"],
  });
}

export default async function ClaudeLessonRoute({ params }: PageProps) {
  const [{ lessonId }, locale] = await Promise.all([
    params,
    getRequestLocale(),
  ]);
  if (!isClaudeLessonId(lessonId)) notFound();
  const bundle = await getClaudeCourseBundle(locale);
  const lesson = bundle.content.lessons.find((item) => item.id === lessonId);
  if (!lesson) notFound();

  const currentIndex = bundle.content.lessons.findIndex(
    (item) => item.id === lesson.id,
  );
  const prevLesson =
    currentIndex > 0 ? bundle.content.lessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < bundle.content.lessons.length - 1
      ? bundle.content.lessons[currentIndex + 1]
      : null;
  const navItems = bundle.content.lessons.map((item) => ({
    id: item.id,
    number: item.number,
    title: item.title,
    trackId: item.trackId,
  }));

  return (
    <ClaudeLessonPage
      lesson={lesson}
      navItems={navItems}
      totalLessons={bundle.content.lessons.length}
      prevHref={
        prevLesson
          ? technicalCourseHref("claude", locale, {
              kind: "lesson",
              lessonId: prevLesson.id,
            })
          : null
      }
      nextHref={
        nextLesson
          ? technicalCourseHref("claude", locale, {
              kind: "lesson",
              lessonId: nextLesson.id,
            })
          : null
      }
      locale={locale}
    />
  );
}

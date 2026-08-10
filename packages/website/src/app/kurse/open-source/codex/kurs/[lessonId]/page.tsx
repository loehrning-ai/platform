import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CodexLessonPage } from "@/components/codex/codex-lesson-page";
import { getCodexCourseCopy } from "@/lib/codex/course-copy";
import { getCodexLocaleRegistry } from "@/lib/codex/data";
import { isCodexLessonId } from "@/lib/codex/types";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import {
  buildTechnicalCourseMetadata,
  getTechnicalCourseStaticParams,
  technicalCourseCanonicalHref,
  technicalCourseHref,
} from "@/lib/technical-courses/routes";

interface PageProps {
  readonly params: Promise<{ lessonId: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return [...getTechnicalCourseStaticParams("codex")];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const [{ lessonId }, locale] = await Promise.all([params, getRequestLocale()]);
  const copy = getCodexCourseCopy(locale).reader;
  if (!isCodexLessonId(lessonId)) {
    return { title: copy.notFoundTitle, robots: { index: false, follow: true } };
  }
  const bundle = (await getCodexLocaleRegistry()).get(locale);
  const lesson = bundle.content.lessons.find((candidate) => candidate.id === lessonId);
  if (!lesson) {
    return { title: copy.notFoundTitle, robots: { index: false, follow: true } };
  }
  const target = { kind: "lesson", lessonId } as const;
  const canonicalPath = technicalCourseCanonicalHref("codex", target);
  return buildTechnicalCourseMetadata({
    courseSlug: "codex",
    locale,
    target,
    title: `${lesson.title}: ${bundle.config.title}`,
    description: lesson.subtitle,
    availableContentLocales: contentLocalesForPath(canonicalPath),
  });
}

export default async function CodexLessonRoute({ params }: PageProps) {
  const [{ lessonId }, locale] = await Promise.all([params, getRequestLocale()]);
  if (!isCodexLessonId(lessonId)) notFound();
  const bundle = (await getCodexLocaleRegistry()).get(locale);
  const allLessons = bundle.content.lessons;
  const lesson = allLessons.find((candidate) => candidate.id === lessonId);
  if (!lesson) notFound();

  const currentIndex = allLessons.findIndex((candidate) => candidate.id === lesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null;

  const navItems = allLessons.map((candidate) => ({
    id: candidate.id,
    number: candidate.number,
    title: candidate.title,
    trackId: candidate.trackId,
  }));

  return (
    <CodexLessonPage
      locale={locale}
      lesson={lesson}
      tracks={bundle.content.tracks}
      navItems={navItems}
      totalLessons={allLessons.length}
      prevHref={
        prevLesson
          ? technicalCourseHref("codex", locale, {
              kind: "lesson",
              lessonId: prevLesson.id,
            })
          : null
      }
      nextHref={
        nextLesson
          ? technicalCourseHref("codex", locale, {
              kind: "lesson",
              lessonId: nextLesson.id,
            })
          : null
      }
    />
  );
}

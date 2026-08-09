import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DataInfraLessonPage } from "@/components/data-infrastructure/data-infra-lesson-page";
import { getDataInfraCourseCopy } from "@/lib/data-infrastructure/course-copy";
import { getDataInfraLesson } from "@/lib/data-infrastructure/data";
import { getDataInfraLandingManifest } from "@/lib/data-infrastructure/landing-manifest";
import { isDataInfraLessonId } from "@/lib/data-infrastructure/types";
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
  return [...getTechnicalCourseStaticParams("data-infrastructure")];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const [{ lessonId }, locale] = await Promise.all([
    params,
    getRequestLocale(),
  ]);
  const copy = getDataInfraCourseCopy(locale).reader;
  if (!isDataInfraLessonId(lessonId)) {
    return {
      title: copy.notFoundTitle,
      robots: { index: false, follow: true },
    };
  }
  const manifest = getDataInfraLandingManifest(locale);
  const summary = manifest.lessons.find(
    (candidate) => candidate.id === lessonId,
  );
  if (!summary) {
    return {
      title: copy.notFoundTitle,
      robots: { index: false, follow: true },
    };
  }
  const target = { kind: "lesson", lessonId } as const;
  const canonicalPath = technicalCourseCanonicalHref(
    "data-infrastructure",
    target,
  );
  return buildTechnicalCourseMetadata({
    courseSlug: "data-infrastructure",
    locale,
    target,
    title: `${summary.title}: ${manifest.courseTitle}`,
    description: summary.subtitle,
    availableContentLocales: contentLocalesForPath(canonicalPath),
  });
}

export default async function DataInfraLessonRoute({ params }: PageProps) {
  const [{ lessonId }, locale] = await Promise.all([
    params,
    getRequestLocale(),
  ]);
  if (!isDataInfraLessonId(lessonId)) notFound();
  const manifest = getDataInfraLandingManifest(locale);
  const allLessons = manifest.lessons;
  const lesson = await getDataInfraLesson(lessonId, locale);
  if (!lesson) notFound();

  const currentIndex = allLessons.findIndex(
    (candidate) => candidate.id === lesson.id,
  );
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null;

  return (
    <DataInfraLessonPage
      locale={locale}
      lesson={lesson}
      tracks={manifest.tracks}
      navItems={allLessons.map((candidate) => ({
        id: candidate.id,
        number: candidate.number,
        title: candidate.title,
        trackId: candidate.trackId,
      }))}
      totalLessons={allLessons.length}
      prevHref={
        prevLesson
          ? technicalCourseHref("data-infrastructure", locale, {
              kind: "lesson",
              lessonId: prevLesson.id,
            })
          : null
      }
      nextHref={
        nextLesson
          ? technicalCourseHref("data-infrastructure", locale, {
              kind: "lesson",
              lessonId: nextLesson.id,
            })
          : null
      }
    />
  );
}

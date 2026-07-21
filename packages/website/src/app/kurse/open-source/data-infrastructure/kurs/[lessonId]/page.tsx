import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DataInfraLessonPage } from "@/components/data-infrastructure/data-infra-lesson-page";
import { getAllDataInfraLessons, getDataInfraLesson } from "@/lib/data-infrastructure/data";
import { DATA_INFRA_LESSON_IDS, isDataInfraLessonId } from "@/lib/data-infrastructure/types";
import { SITE_URL } from "@/lib/seo/json-ld";

interface PageProps {
  readonly params: Promise<{ lessonId: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return DATA_INFRA_LESSON_IDS.map((lessonId) => ({ lessonId }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lessonId } = await params;
  if (!isDataInfraLessonId(lessonId)) return { title: "Lesson not found" };
  const lesson = await getDataInfraLesson(lessonId);
  if (!lesson) return { title: "Lesson not found" };
  const lessonUrl = `${SITE_URL}/kurse/open-source/data-infrastructure/kurs/${lessonId}`;
  return {
    title: `${lesson.title}: Data Infrastructure`,
    description: lesson.subtitle,
    robots: { index: false, follow: true },
    alternates: { canonical: lessonUrl },
    openGraph: {
      title: `${lesson.title}: Data Infrastructure`,
      description: lesson.subtitle,
      url: lessonUrl,
      type: "article",
    },
  };
}

export default async function DataInfraLessonRoute({ params }: PageProps) {
  const { lessonId } = await params;
  if (!isDataInfraLessonId(lessonId)) notFound();
  const lesson = await getDataInfraLesson(lessonId);
  if (!lesson) notFound();

  const allLessons = await getAllDataInfraLessons();
  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const navItems = allLessons.map((l) => ({
    id: l.id,
    number: l.number,
    title: l.title,
    trackId: l.trackId,
  }));

  return (
    <DataInfraLessonPage
      lesson={lesson}
      navItems={navItems}
      totalLessons={allLessons.length}
      prevHref={prevLesson ? `/kurse/open-source/data-infrastructure/kurs/${prevLesson.id}` : null}
      nextHref={nextLesson ? `/kurse/open-source/data-infrastructure/kurs/${nextLesson.id}` : null}
    />
  );
}

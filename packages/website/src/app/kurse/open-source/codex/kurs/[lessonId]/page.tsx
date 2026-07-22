import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CodexLessonPage } from "@/components/codex/codex-lesson-page";
import { getAllCodexLessons, getCodexLesson } from "@/lib/codex/data";
import { CODEX_LESSON_IDS, isCodexLessonId } from "@/lib/codex/types";
import { SITE_URL } from "@/lib/seo/json-ld";

interface PageProps {
  readonly params: Promise<{ lessonId: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return CODEX_LESSON_IDS.map((lessonId) => ({ lessonId }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lessonId } = await params;
  if (!isCodexLessonId(lessonId)) return { title: "Lesson not found" };
  const lesson = await getCodexLesson(lessonId);
  if (!lesson) return { title: "Lesson not found" };
  const lessonUrl = `${SITE_URL}/kurse/open-source/codex/kurs/${lessonId}`;
  return {
    title: `${lesson.title}: Codex Course`,
    description: lesson.subtitle,
    robots: { index: false, follow: true },
    alternates: { canonical: lessonUrl },
    openGraph: {
      title: `${lesson.title}: Codex Course`,
      description: lesson.subtitle,
      url: lessonUrl,
      type: "article",
    },
  };
}

export default async function CodexLessonRoute({ params }: PageProps) {
  const { lessonId } = await params;
  if (!isCodexLessonId(lessonId)) notFound();
  const lesson = await getCodexLesson(lessonId);
  if (!lesson) notFound();

  const allLessons = await getAllCodexLessons();
  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null;

  const navItems = allLessons.map((l) => ({
    id: l.id,
    number: l.number,
    title: l.title,
    trackId: l.trackId,
  }));

  return (
    <CodexLessonPage
      lesson={lesson}
      navItems={navItems}
      totalLessons={allLessons.length}
      prevHref={prevLesson ? `/kurse/open-source/codex/kurs/${prevLesson.id}` : null}
      nextHref={nextLesson ? `/kurse/open-source/codex/kurs/${nextLesson.id}` : null}
    />
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClaudeLessonPage } from "@/components/imported-courses/claude/claude-lesson-page";
import { getAllClaudeLessons, getClaudeLesson } from "@/lib/claude-course/data";
import { CLAUDE_LESSON_IDS } from "@/lib/claude-course/types";
import { SITE_URL } from "@/lib/seo/json-ld";

interface PageProps {
  readonly params: Promise<{ lessonId: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return CLAUDE_LESSON_IDS.map((lessonId) => ({ lessonId }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = await getClaudeLesson(lessonId as (typeof CLAUDE_LESSON_IDS)[number]);
  if (!lesson) return { title: "Lesson not found" };
  const lessonUrl = `${SITE_URL}/kurse/open-source/claude/kurs/${lessonId}`;
  return {
    title: `${lesson.title}: Claude Course`,
    description: lesson.subtitle,
    robots: { index: false, follow: true },
    alternates: { canonical: lessonUrl },
    openGraph: {
      title: `${lesson.title}: Claude Course`,
      description: lesson.subtitle,
      url: lessonUrl,
      type: "article",
    },
  };
}

export default async function ClaudeLessonRoute({ params }: PageProps) {
  const { lessonId } = await params;
  const lesson = await getClaudeLesson(lessonId as (typeof CLAUDE_LESSON_IDS)[number]);
  if (!lesson) notFound();

  const allLessons = await getAllClaudeLessons();
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
    <ClaudeLessonPage
      lesson={lesson}
      navItems={navItems}
      totalLessons={allLessons.length}
      prevHref={prevLesson ? `/kurse/open-source/claude/kurs/${prevLesson.id}` : null}
      nextHref={nextLesson ? `/kurse/open-source/claude/kurs/${nextLesson.id}` : null}
    />
  );
}

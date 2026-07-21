import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AiNativeOperatorLessonPage } from "@/components/ai-native-operator/lesson-page";
import type { NextTarget } from "@/components/ai-native-operator/lesson-page";
import { getAllLessons, getAllModuleLessonPairs, getModuleLessons } from "@/lib/ai-native-operator/data";
import { MODULE_IDS, MODULE_META, isModuleId, type ModuleId } from "@/lib/ai-native-operator/types";
import { courseHref, lessonHref, moduleHref } from "@/lib/ai-native-operator/routes";
import { SITE_URL } from "@/lib/seo/json-ld";

interface PageProps {
  readonly params: Promise<{ moduleId: string; lessonNum: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const pairs = await getAllModuleLessonPairs();
  return pairs.map(({ moduleId, lessonNumber }) => ({
    moduleId,
    lessonNum: String(lessonNumber),
  }));
}

function parseLessonNum(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  return Number.parseInt(raw, 10);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { moduleId, lessonNum } = await params;
  const lessonNumber = parseLessonNum(lessonNum);
  if (!isModuleId(moduleId) || lessonNumber === null) return { title: "Lesson not found" };
  const lessons = await getModuleLessons(moduleId);
  const lesson = lessons.find((l) => l.lessonNumber === lessonNumber);
  if (!lesson) return { title: "Lesson not found" };
  const url = `${SITE_URL}${lessonHref(moduleId, lessonNumber)}`;
  return {
    title: `${lesson.title}: The AI-Native Operator`,
    description: lesson.objective,
    robots: { index: false, follow: true },
    alternates: { canonical: url },
    openGraph: {
      title: `${lesson.title}: The AI-Native Operator`,
      description: lesson.objective,
      url,
      type: "article",
    },
  };
}

export default async function AiNativeOperatorLessonRoute({ params }: PageProps) {
  const { moduleId: rawModuleId, lessonNum } = await params;
  const lessonNumber = parseLessonNum(lessonNum);
  if (!isModuleId(rawModuleId) || lessonNumber === null) notFound();
  const moduleId: ModuleId = rawModuleId;

  const lessons = await getModuleLessons(moduleId);
  const currentIndex = lessons.findIndex((l) => l.lessonNumber === lessonNumber);
  if (currentIndex === -1) notFound();
  const lesson = lessons[currentIndex];

  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const moduleIndex = MODULE_IDS.indexOf(moduleId);
  const nextModuleId = !nextLesson && moduleIndex < MODULE_IDS.length - 1 ? MODULE_IDS[moduleIndex + 1] : null;

  let next: NextTarget;
  if (nextLesson) {
    next = { href: lessonHref(moduleId, nextLesson.lessonNumber), label: "Next lesson", kind: "lesson" };
  } else if (nextModuleId) {
    next = {
      href: moduleHref(nextModuleId),
      label: `Next module: ${MODULE_META[nextModuleId].name}`,
      kind: "module",
    };
  } else {
    next = { href: courseHref(), label: "Course complete, return to overview", kind: "course-complete" };
  }

  const allLessons = await getAllLessons();
  const navItems = allLessons.map((l) => ({
    moduleId: l.moduleId,
    lessonNumber: l.lessonNumber,
    title: l.title,
  }));

  return (
    <AiNativeOperatorLessonPage
      lesson={lesson}
      navItems={navItems}
      prevHref={prevLesson ? lessonHref(moduleId, prevLesson.lessonNumber) : null}
      prevTitle={prevLesson ? prevLesson.title : null}
      next={next}
    />
  );
}

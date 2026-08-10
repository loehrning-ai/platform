import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AiNativeOperatorLessonPage,
  type NextTarget,
} from "@/components/ai-native-operator/lesson-page";
import { getAiNativeOperatorCourseCopy } from "@/lib/ai-native-operator/course-copy";
import {
  getAiNativeOperatorLocaleRegistry,
  getAllLessons,
  getModuleLessons,
} from "@/lib/ai-native-operator/data";
import {
  courseHref,
  lessonHref,
  moduleHref,
} from "@/lib/ai-native-operator/routes";
import {
  MODULE_IDS,
  getModuleMeta,
  isModuleId,
  type ModuleId,
} from "@/lib/ai-native-operator/types";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import {
  buildTechnicalCourseMetadata,
  getTechnicalCourseStaticParams,
} from "@/lib/technical-courses/routes";

interface PageProps {
  readonly params: Promise<{ moduleId: string; lessonNum: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return [...getTechnicalCourseStaticParams("ai-native-operator")];
}

function parseLessonNum(raw: string): number | null {
  if (!/^[1-9]\d{0,2}$/.test(raw)) return null;
  const value = Number.parseInt(raw, 10);
  return Number.isSafeInteger(value) ? value : null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const [{ moduleId, lessonNum }, locale] = await Promise.all([
    params,
    getRequestLocale(),
  ]);
  const copy = getAiNativeOperatorCourseCopy(locale).lesson;
  const lessonNumber = parseLessonNum(lessonNum);
  if (!isModuleId(moduleId) || lessonNumber === null) {
    return {
      title: copy.notFoundTitle,
      robots: { index: false, follow: false },
    };
  }
  (await getAiNativeOperatorLocaleRegistry()).get(locale);
  const lessons = await getModuleLessons(moduleId, locale);
  const lesson = lessons.find(
    (candidate) => candidate.lessonNumber === lessonNumber,
  );
  if (!lesson) {
    return {
      title: copy.notFoundTitle,
      robots: { index: false, follow: false },
    };
  }
  return buildTechnicalCourseMetadata({
    courseSlug: "ai-native-operator",
    locale,
    target: { kind: "lesson", moduleId, lessonNumber },
    title: `${lesson.title}: ${
      locale === "de" ? "AI-Native Operator Praxiskurs" : "AI-Native Operator"
    }`,
    description: lesson.objective,
    availableContentLocales: contentLocalesForPath(
      `/kurse/open-source/ai-native-operator/${moduleId}/${lessonNumber}`,
    ),
  });
}

export default async function AiNativeOperatorLessonRoute({
  params,
}: PageProps) {
  const [{ moduleId: rawModuleId, lessonNum }, locale] = await Promise.all([
    params,
    getRequestLocale(),
  ]);
  const lessonNumber = parseLessonNum(lessonNum);
  if (!isModuleId(rawModuleId) || lessonNumber === null) notFound();
  const moduleId: ModuleId = rawModuleId;
  (await getAiNativeOperatorLocaleRegistry()).get(locale);

  const copy = getAiNativeOperatorCourseCopy(locale).lesson;
  const lessons = await getModuleLessons(moduleId, locale);
  const currentIndex = lessons.findIndex(
    (lesson) => lesson.lessonNumber === lessonNumber,
  );
  if (currentIndex === -1) notFound();
  const lesson = lessons[currentIndex];

  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  const moduleIndex = MODULE_IDS.indexOf(moduleId);
  const nextModuleId =
    !nextLesson && moduleIndex < MODULE_IDS.length - 1
      ? MODULE_IDS[moduleIndex + 1]
      : null;

  let next: NextTarget;
  if (nextLesson) {
    next = {
      href: lessonHref(moduleId, nextLesson.lessonNumber, locale),
      label: copy.nextLesson,
      kind: "lesson",
    };
  } else if (nextModuleId) {
    next = {
      href: moduleHref(nextModuleId, locale),
      label: copy.nextModule(getModuleMeta(nextModuleId, locale).name),
      kind: "module",
    };
  } else {
    next = {
      href: `${courseHref(locale)}#final-assessment`,
      label: copy.finalAssessment,
      kind: "final-assessment",
    };
  }

  const allLessons = await getAllLessons(locale);
  const navItems = allLessons.map((item) => ({
    moduleId: item.moduleId,
    lessonNumber: item.lessonNumber,
    title: item.title,
  }));

  return (
    <AiNativeOperatorLessonPage
      locale={locale}
      lesson={lesson}
      navItems={navItems}
      prevHref={
        prevLesson
          ? lessonHref(moduleId, prevLesson.lessonNumber, locale)
          : null
      }
      prevTitle={prevLesson ? prevLesson.title : null}
      next={next}
    />
  );
}

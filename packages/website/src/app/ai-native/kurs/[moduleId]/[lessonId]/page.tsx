import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AiNativeLessonPageShell } from "@/components/ai-native/kurs/lesson-page-shell";
import {
  getModule,
  getModuleLessons,
  getLesson,
  getModules,
} from "@/lib/ai-native/data";
import { MODULE_IDS, type ModuleId } from "@/lib/ai-native/types";
import { SITE_URL } from "@/lib/seo/json-ld";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { localizeHref } from "@/lib/i18n/locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";
import { LessonFlow } from "@/components/lesson-engine/lesson-flow";
import { isEngineLesson } from "@/lib/lesson-engine/lesson";

// "Mit KI arbeiten" / "Working with AI" runs on the lesson engine
// (docs/lesson-engine.md): every lesson renders through the shared LessonFlow
// (concept, one exercise, two checks). Bookmarks to retired lesson ids in a
// valid module land on the course hub instead of a 404.

interface PageProps {
  params: Promise<{ moduleId: string; lessonId: string }>;
}

const COURSE_TITLE = { de: "Mit KI arbeiten", en: "Working with AI" } as const;

export async function generateStaticParams() {
  const perModule = await Promise.all(
    MODULE_IDS.map(async (moduleId) => {
      const lessons = await getModuleLessons(moduleId);
      return lessons.map((lesson) => ({ moduleId, lessonId: lesson.id }));
    }),
  );
  return perModule.flat();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { moduleId, lessonId } = await params;
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  const lesson = await getLesson(moduleId as ModuleId, lessonId, locale);
  if (!lesson)
    return {
      title: locale === "en" ? "Lesson not found" : "Lektion nicht gefunden",
      robots: { index: false, follow: false },
    };
  const lessonUrl = `${SITE_URL}${localizeHref(`/ai-native/kurs/${moduleId}/${lessonId}`, locale)}`;
  const title = `${lesson.title} · ${COURSE_TITLE[locale === "en" ? "en" : "de"]}`;
  return {
    title,
    description: lesson.subtitle,
    robots: { index: false, follow: true },
    alternates: { canonical: lessonUrl },
    openGraph: {
      title,
      description: lesson.subtitle,
      url: lessonUrl,
      type: "article",
    },
  };
}

export default async function AiNativeLessonPage({ params }: PageProps) {
  const { moduleId, lessonId } = await params;
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  const mod = getModule(moduleId as ModuleId, locale);
  if (!mod) notFound();
  const lesson = await getLesson(mod.id, lessonId, locale);
  if (!lesson || !isEngineLesson(lesson)) {
    redirect(localizeHref("/ai-native/kurs", locale));
  }

  const isEnglish = locale === "en";
  const navigationItems = (
    await Promise.all(
      getModules(locale).map(async (navigationModule) => {
        const moduleLessons = await getModuleLessons(navigationModule.id, locale);
        return moduleLessons.map((navigationLesson) => ({
          moduleId: navigationModule.id,
          moduleNumber: navigationModule.number,
          moduleTitle: navigationModule.title,
          lessonId: navigationLesson.id,
          lessonNumber: navigationLesson.number,
          title: navigationLesson.title,
        }));
      }),
    )
  ).flat();
  const flatIndex = navigationItems.findIndex(
    (item) => item.lessonId === lesson.id,
  );
  const following = navigationItems[flatIndex + 1];

  return (
    <AiNativeLessonPageShell lessons={navigationItems} locale={locale} lessonId={lesson.id}>
      <div className="min-w-0 py-8 md:py-10">
        <LessonFlow
          courseSlug="ai-native"
          lesson={lesson}
          position={{ index: flatIndex + 1, total: navigationItems.length }}
          moduleLabel={`${isEnglish ? "Module" : "Modul"} ${mod.number} · ${mod.title}`}
          locale={locale}
          next={
            following
              ? {
                  kind: "link",
                  href: localizeHref(`/ai-native/kurs/${following.moduleId}/${following.lessonId}`, locale),
                  label: `${isEnglish ? "Next" : "Weiter"}: ${following.title}`,
                }
              : {
                  kind: "link",
                  href: localizeHref("/ai-native/kurs/quiz", locale),
                  label: isEnglish ? "Assessment" : "Zur Prüfung",
                }
          }
        />
      </div>
    </AiNativeLessonPageShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import {
  ClipHeading,
  VoiceAnchor,
  TierChip,
} from "@/components/ai-native/primitives";
import { AiNativeLessonReader } from "@/components/ai-native/kurs/lesson-reader";
import { AiNativeLessonPageShell } from "@/components/ai-native/kurs/lesson-page-shell";
import { CourseProjectStudio } from "@/components/course-projects/course-project-studio";
import { LessonReference } from "@/components/course/lesson-reference";
import { LessonProgressRing } from "@/components/ai-native/kurs/lesson-progress-ring";
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
import { isCourseProjectCheckpointLesson } from "@/lib/course-projects/checkpoint-selector";

interface PageProps {
  params: Promise<{ moduleId: string; lessonId: string }>;
}

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
  const courseTitle =
    locale === "en" ? "AI-Native Workflow Course" : "AI-Native Arbeitskurs";
  return {
    title: `${lesson.title}: ${courseTitle}`,
    description: lesson.subtitle,
    robots: { index: false, follow: true },
    alternates: { canonical: lessonUrl },
    openGraph: {
      title: `${lesson.title}: ${courseTitle}`,
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
  const lesson = await getLesson(moduleId as ModuleId, lessonId, locale);
  if (!mod || !lesson) notFound();

  const lessons = await getModuleLessons(moduleId as ModuleId, locale);
  const currentIdx = lessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIdx > 0 ? lessons[currentIdx - 1] : null;
  const nextLesson =
    currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null;
  const isEnglish = locale === "en";
  const navigationItems = (
    await Promise.all(
      getModules(locale).map(async (navigationModule) => {
        const moduleLessons =
          navigationModule.id === mod.id
            ? lessons
            : await getModuleLessons(navigationModule.id, locale);
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
  const isProjectCheckpoint = isCourseProjectCheckpointLesson(
    "ai-native",
    lesson.id,
  );

  return (
    <AiNativeLessonPageShell lessons={navigationItems} locale={locale}>
      <div className="min-w-0 py-10 md:py-12">
        <div className="mx-auto max-w-[880px]">
          {/* Breadcrumb */}
          <nav
            aria-label={isEnglish ? "Breadcrumb" : "Brotkrümelnavigation"}
            className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground"
          >
            <Link
              href={localizeHref("/ai-native", locale)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {isEnglish ? "Course" : "Kurs"}
            </Link>
            <span className="mx-2 opacity-40">/</span>
            <Link
              href={localizeHref(`/ai-native/kurs/${mod.id}`, locale)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {isEnglish ? "Module" : "Modul"} {mod.number}
            </Link>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-brand-orange">
              {isEnglish ? "Lesson" : "Lektion"} {lesson.number}
            </span>
          </nav>

          {/* Header */}
          <header className="mt-10 border-b border-border pb-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex flex-wrap items-baseline gap-5">
                <span
                  className="font-mono font-bold leading-none tracking-[-0.02em] text-brand-orange"
                  style={{ fontSize: "clamp(2.25rem, 4vw, 2.75rem)" }}
                >
                  § {lesson.number}
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <TierChip tier="FREE" locale={locale} />
                  <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    <Clock size={11} className="mr-1 inline" />
                    {lesson.durationMinutes} {isEnglish ? "min" : "Min."}
                  </span>
                </div>
              </div>
              <LessonProgressRing
                lessonId={lesson.id}
                totalSections={lesson.sections.length}
              />
            </div>
            <ClipHeading
              as="h1"
              className="mt-5 break-words font-bold leading-[0.95] tracking-[-0.035em] text-foreground"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)" }}
            >
              {lesson.title}
            </ClipHeading>
            <p className="mt-4 max-w-[640px] text-[18px] leading-[1.55] text-muted-foreground">
              {lesson.subtitle}
            </p>
          </header>
        </div>

        {isProjectCheckpoint ? (
          <div className="my-10">
            <CourseProjectStudio
              courseSlug="ai-native"
              lessonId={lesson.id}
              locale={locale}
              missionHeadingLevel={2}
              lessonContext={{
                title: lesson.title,
                objective: lesson.subtitle,
                keyConcepts: lesson.keyConcepts,
              }}
            />
          </div>
        ) : null}

        {/* Progressive-disclosure reader (client — sections + quiz + prev/next inside) */}
        <LessonReference
          key={lesson.id}
          locale={locale}
          title={lesson.title}
          objective={lesson.subtitle}
          headingLevel={2}
        >
          {/* Authored perspective remains available as supporting reference. */}
          {mod.voiceAnchor ? (
            <div className="mx-auto mb-8 max-w-[880px]">
              <VoiceAnchor
                author={`${isEnglish ? "Module" : "Modul"} ${mod.number} · ${isEnglish ? "course note" : "Kursnotiz"}`}
              >
                {mod.voiceAnchor}
              </VoiceAnchor>
            </div>
          ) : null}
          {lesson.voiceAnchor && lesson.voiceAnchor !== mod.voiceAnchor ? (
            <div className="mx-auto mb-8 max-w-[880px]">
              <VoiceAnchor
                author={`${isEnglish ? "Lesson" : "Lektion"} ${lesson.number}`}
              >
                {lesson.voiceAnchor}
              </VoiceAnchor>
            </div>
          ) : null}
          <div className="mx-auto max-w-[1100px]">
            <AiNativeLessonReader
              module={mod}
              lesson={lesson}
              prevLesson={prevLesson ?? null}
              nextLesson={nextLesson ?? null}
              allModuleLessonIds={lessons.map((l) => l.id)}
              locale={locale}
            />
          </div>
        </LessonReference>
      </div>
    </AiNativeLessonPageShell>
  );
}

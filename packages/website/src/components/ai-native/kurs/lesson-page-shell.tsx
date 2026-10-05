"use client";

import { useState, type JSX, type ReactNode } from "react";
import { LessonShell } from "@/components/course/lesson-shell";
import { useLessonReaderBar } from "@/components/course/use-lesson-reader-bar";
import {
  AiNativeLessonSidebar,
  type AiNativeLessonNavItem,
} from "./lesson-sidebar";
import type { Locale } from "@/lib/i18n/locale";
import { localizeHref } from "@/lib/i18n/locale";
import {
  CourseOutline,
  type CourseOutlineLesson,
  type CourseOutlineModule,
} from "@/components/lesson-engine/course-outline";
import { CourseLessonHeader } from "@/components/lesson-engine/course-lesson-header";

interface AiNativeLessonPageShellProps {
  readonly children: ReactNode;
  readonly lessons: readonly AiNativeLessonNavItem[];
  readonly locale: Locale;
  readonly lessonId: string;
}

/** Adds shared responsive course chrome without turning lesson content client-side. */
export function AiNativeLessonPageShell({
  children,
  lessons,
  locale,
  lessonId,
}: AiNativeLessonPageShellProps): JSX.Element {
  const [navOpen, setNavOpen] = useState(false);
  const isEnglish = locale === "en";
  const currentIndex = lessons.findIndex((item) => item.lessonId === lessonId);
  const next = lessons[currentIndex + 1];
  const reader = useLessonReaderBar({
    courseSlug: "ai-native", lessonId,
    ordinal: currentIndex + 1, total: lessons.length, locale,
    next: {
      kind: "link",
      href: localizeHref(next ? `/ai-native/kurs/${next.moduleId}/${next.lessonId}` :
        "/ai-native/kurs/quiz", locale),
      label: next ? (isEnglish ? "Next" : "Weiter") :
        (isEnglish ? "Assessment" : "Zur Prüfung"),
    },
    engineSteps: true,
  });
  const current = lessons[currentIndex];
  const outline: CourseOutlineModule[] = [];
  lessons.forEach((item, index) => {
    let group = outline.find((entry) => entry.id === item.moduleId);
    if (!group) {
      group = { id: item.moduleId, number: item.moduleNumber, title: item.moduleTitle, lessons: [] };
      outline.push(group);
    }
    (group.lessons as CourseOutlineLesson[]).push({
      id: item.lessonId,
      number: index + 1,
      title: item.title,
      durationMinutes: item.durationMinutes,
      href: localizeHref(`/ai-native/kurs/${item.moduleId}/${item.lessonId}`, locale),
    });
  });

  return (
    <LessonShell
      look="app"
      header={
        <CourseLessonHeader
          courseSlug="ai-native"
          lessonId={lessonId}
          courseLessonIds={lessons.map((item) => item.lessonId)}
          backHref={localizeHref("/ai-native/kurs", locale)}
          backLabel={isEnglish ? "Course overview" : "Zur Kursübersicht"}
          title={isEnglish ? "Working with AI" : "Mit KI arbeiten"}
          context={`${isEnglish ? "Module" : "Modul"} ${current?.moduleNumber ?? 1} · ${isEnglish ? "Lesson" : "Lektion"} ${currentIndex + 1} ${isEnglish ? "of" : "von"} ${lessons.length}`}
          locale={locale}
        />
      }
      readerBar={reader.bar}
      contentRef={reader.contentRef}
      navOpen={navOpen}
      onNavOpenChange={setNavOpen}
      navLabel={isEnglish ? "Course navigation" : "Kursnavigation"}
      navId="ai-native-mobile-course-nav"
      openNavLabel={isEnglish ? "Open course navigation" : "Kursnavigation öffnen"}
      closeNavLabel={isEnglish ? "Close course navigation" : "Kursnavigation schließen"}
      collapseNavLabel={isEnglish ? "Collapse course navigation" : "Kursnavigation einklappen"}
      expandNavLabel={isEnglish ? "Expand course navigation" : "Kursnavigation ausklappen"}
      contentMode="stage"
      sidebar={<AiNativeLessonSidebar locale={locale} lessons={lessons} />}
      renderSidebar={(instance) => (
        <CourseOutline
          key={instance}
          courseSlug="ai-native"
          modules={outline}
          activeLessonId={lessonId}
          locale={locale}
          label={isEnglish ? "Course navigation" : "Kursnavigation"}
        />
      )}
    >
      {children}
    </LessonShell>
  );
}

export default AiNativeLessonPageShell;

"use client";

import { useState, type JSX } from "react";
import { LessonShell } from "@/components/course/lesson-shell";
import { CourseProjectStudio } from "@/components/course-projects/course-project-studio";
import {
  DataInfraLessonSidebar,
  type DataInfraLessonNavItem,
} from "./data-infra-lesson-sidebar";
import { DataInfraLessonReader } from "./data-infra-lesson-reader";
import type {
  DataInfraLesson,
  DataInfraTrack,
} from "@/lib/data-infrastructure/types";
import { getDataInfraCourseCopy } from "@/lib/data-infrastructure/course-copy";
import type { Locale } from "@/lib/i18n/locale";

interface DataInfraLessonPageProps {
  readonly locale: Locale;
  readonly lesson: DataInfraLesson;
  readonly tracks: readonly DataInfraTrack[];
  readonly navItems: readonly DataInfraLessonNavItem[];
  readonly totalLessons: number;
  readonly prevHref: string | null;
  readonly nextHref: string | null;
}

/** Ties the shared `LessonShell` nav chrome to this course's sidebar + reader. */
export function DataInfraLessonPage({
  locale,
  lesson,
  tracks,
  navItems,
  totalLessons,
  prevHref,
  nextHref,
}: DataInfraLessonPageProps): JSX.Element {
  const [navOpen, setNavOpen] = useState(false);
  const copy = getDataInfraCourseCopy(locale).reader;

  return (
    <LessonShell
      navOpen={navOpen}
      onNavOpenChange={setNavOpen}
      navLabel={copy.navLabel}
      openNavLabel={
        locale === "de" ? "Lektionsnavigation öffnen" : "Open lesson navigation"
      }
      closeNavLabel={
        locale === "de"
          ? "Lektionsnavigation schließen"
          : "Close lesson navigation"
      }
      collapseNavLabel={
        locale === "de"
          ? "Lektionsnavigation einklappen"
          : "Collapse lesson navigation"
      }
      expandNavLabel={
        locale === "de"
          ? "Lektionsnavigation ausklappen"
          : "Expand lesson navigation"
      }
      sidebar={
        <DataInfraLessonSidebar
          locale={locale}
          lessons={navItems}
          tracks={tracks}
        />
      }
    >
      <div className="mb-10">
        <CourseProjectStudio
          courseSlug="data-infrastructure"
          lessonId={lesson.id}
          locale={locale}
          lessonContext={{
            title: lesson.title,
            objective: lesson.hook,
            keyConcepts: lesson.keyConcepts,
          }}
        />
      </div>
      <DataInfraLessonReader
        locale={locale}
        lesson={lesson}
        totalLessons={totalLessons}
        prevHref={prevHref}
        nextHref={nextHref}
      />
    </LessonShell>
  );
}

export default DataInfraLessonPage;

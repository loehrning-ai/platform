"use client";

import { useState, type JSX } from "react";
import { LessonShell } from "@/components/course/lesson-shell";
import { LessonReference } from "@/components/course/lesson-reference";
import { CourseProjectStudio } from "@/components/course-projects/course-project-studio";
import { isCourseProjectCheckpointLesson } from "@/lib/course-projects/checkpoint-selector";
import {
  ClaudeLessonSidebar,
  type ClaudeLessonNavItem,
} from "./claude-lesson-sidebar";
import { ClaudeLessonReader } from "./claude-lesson-reader";
import type { ClaudeLesson } from "@/lib/claude-course/types";
import type { Locale } from "@/lib/i18n/locale";

interface ClaudeLessonPageProps {
  readonly lesson: ClaudeLesson;
  readonly navItems: readonly ClaudeLessonNavItem[];
  readonly totalLessons: number;
  readonly prevHref: string | null;
  readonly nextHref: string | null;
  readonly locale: Locale;
}

/** Ties the shared `LessonShell` nav chrome to the claude-course sidebar + reader. */
export function ClaudeLessonPage({
  lesson,
  navItems,
  totalLessons,
  prevHref,
  nextHref,
  locale,
}: ClaudeLessonPageProps): JSX.Element {
  const [navOpen, setNavOpen] = useState(false);
  const isProjectCheckpoint = isCourseProjectCheckpointLesson(
    "claude",
    lesson.id,
  );

  return (
    <LessonShell
      navOpen={navOpen}
      onNavOpenChange={setNavOpen}
      navLabel={locale === "de" ? "Lektionsnavigation" : "Lesson navigation"}
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
      sidebar={<ClaudeLessonSidebar lessons={navItems} locale={locale} />}
    >
      {isProjectCheckpoint ? (
        <div className="mb-10">
          <CourseProjectStudio
            courseSlug="claude"
            lessonId={lesson.id}
            locale={locale}
            lessonContext={{
              title: lesson.title,
              objective: lesson.hook,
              keyConcepts: lesson.keyConcepts,
            }}
          />
        </div>
      ) : null}
      <LessonReference
        key={lesson.id}
        locale={locale}
        title={lesson.title}
        objective={lesson.hook}
        headingLevel={isProjectCheckpoint ? 2 : 1}
      >
        <ClaudeLessonReader
          lesson={lesson}
          totalLessons={totalLessons}
          prevHref={prevHref}
          nextHref={nextHref}
          locale={locale}
        />
      </LessonReference>
    </LessonShell>
  );
}

export default ClaudeLessonPage;

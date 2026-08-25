"use client";

import { useState, type JSX } from "react";
import { LessonShell } from "@/components/course/lesson-shell";
import { LessonReference } from "@/components/course/lesson-reference";
import { CourseProjectStudio } from "@/components/course-projects/course-project-studio";
import { isCourseProjectCheckpointLesson } from "@/lib/course-projects/checkpoint-selector";
import {
  CodexLessonSidebar,
  type CodexLessonNavItem,
} from "./codex-lesson-sidebar";
import { CodexLessonReader } from "./codex-lesson-reader";
import { getCodexCourseCopy } from "@/lib/codex/course-copy";
import type { CodexLesson, CodexTrack } from "@/lib/codex/types";
import type { Locale } from "@/lib/i18n/locale";

interface CodexLessonPageProps {
  readonly locale: Locale;
  readonly lesson: CodexLesson;
  readonly tracks: readonly CodexTrack[];
  readonly navItems: readonly CodexLessonNavItem[];
  readonly totalLessons: number;
  readonly prevHref: string | null;
  readonly nextHref: string | null;
}

/** Ties the shared `LessonShell` nav chrome to the codex-course sidebar + reader. */
export function CodexLessonPage({
  locale,
  lesson,
  tracks,
  navItems,
  totalLessons,
  prevHref,
  nextHref,
}: CodexLessonPageProps): JSX.Element {
  const [navOpen, setNavOpen] = useState(false);
  const copy = getCodexCourseCopy(locale).reader;
  const isProjectCheckpoint = isCourseProjectCheckpointLesson(
    "codex",
    lesson.id,
  );

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
        <CodexLessonSidebar
          locale={locale}
          lessons={navItems}
          tracks={tracks}
        />
      }
    >
      {isProjectCheckpoint ? (
        <div className="mb-10">
          <CourseProjectStudio
            courseSlug="codex"
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
        <CodexLessonReader
          locale={locale}
          lesson={lesson}
          totalLessons={totalLessons}
          prevHref={prevHref}
          nextHref={nextHref}
        />
      </LessonReference>
    </LessonShell>
  );
}

export default CodexLessonPage;

"use client";

import { useState, type JSX } from "react";
import { LessonShell } from "@/components/course/lesson-shell";
import { CodexLessonSidebar, type CodexLessonNavItem } from "./codex-lesson-sidebar";
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

  return (
    <LessonShell
      navOpen={navOpen}
      onNavOpenChange={setNavOpen}
      navLabel={copy.navLabel}
      sidebar={<CodexLessonSidebar locale={locale} lessons={navItems} tracks={tracks} />}
    >
      <CodexLessonReader
        locale={locale}
        lesson={lesson}
        totalLessons={totalLessons}
        prevHref={prevHref}
        nextHref={nextHref}
      />
    </LessonShell>
  );
}

export default CodexLessonPage;

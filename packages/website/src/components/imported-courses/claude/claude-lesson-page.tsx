"use client";

import { useState, type JSX } from "react";
import { LessonShell } from "@/components/course/lesson-shell";
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

  return (
    <LessonShell
      navOpen={navOpen}
      onNavOpenChange={setNavOpen}
      navLabel={locale === "de" ? "Lektionsnavigation" : "Lesson navigation"}
      sidebar={<ClaudeLessonSidebar lessons={navItems} locale={locale} />}
    >
      <ClaudeLessonReader
        lesson={lesson}
        totalLessons={totalLessons}
        prevHref={prevHref}
        nextHref={nextHref}
        locale={locale}
      />
    </LessonShell>
  );
}

export default ClaudeLessonPage;

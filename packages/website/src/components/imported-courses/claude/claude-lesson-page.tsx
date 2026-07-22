"use client";

import { useState, type JSX } from "react";
import { LessonShell } from "@/components/course/lesson-shell";
import { ClaudeLessonSidebar, type ClaudeLessonNavItem } from "./claude-lesson-sidebar";
import { ClaudeLessonReader } from "./claude-lesson-reader";
import type { ClaudeLesson } from "@/lib/claude-course/types";

interface ClaudeLessonPageProps {
  readonly lesson: ClaudeLesson;
  readonly navItems: readonly ClaudeLessonNavItem[];
  readonly totalLessons: number;
  readonly prevHref: string | null;
  readonly nextHref: string | null;
}

/** Ties the shared `LessonShell` nav chrome to the claude-course sidebar + reader. */
export function ClaudeLessonPage({
  lesson,
  navItems,
  totalLessons,
  prevHref,
  nextHref,
}: ClaudeLessonPageProps): JSX.Element {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <LessonShell
      navOpen={navOpen}
      onNavOpenChange={setNavOpen}
      navLabel="Lesson navigation"
      sidebar={<ClaudeLessonSidebar lessons={navItems} />}
    >
      <ClaudeLessonReader
        lesson={lesson}
        totalLessons={totalLessons}
        prevHref={prevHref}
        nextHref={nextHref}
      />
    </LessonShell>
  );
}

export default ClaudeLessonPage;

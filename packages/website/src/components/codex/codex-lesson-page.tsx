"use client";

import { useState, type JSX } from "react";
import { LessonShell } from "@/components/course/lesson-shell";
import { CodexLessonSidebar, type CodexLessonNavItem } from "./codex-lesson-sidebar";
import { CodexLessonReader } from "./codex-lesson-reader";
import type { CodexLesson } from "@/lib/codex/types";

interface CodexLessonPageProps {
  readonly lesson: CodexLesson;
  readonly navItems: readonly CodexLessonNavItem[];
  readonly totalLessons: number;
  readonly prevHref: string | null;
  readonly nextHref: string | null;
}

/** Ties the shared `LessonShell` nav chrome to the codex-course sidebar + reader. */
export function CodexLessonPage({
  lesson,
  navItems,
  totalLessons,
  prevHref,
  nextHref,
}: CodexLessonPageProps): JSX.Element {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <LessonShell
      navOpen={navOpen}
      onNavOpenChange={setNavOpen}
      navLabel="Lesson navigation"
      sidebar={<CodexLessonSidebar lessons={navItems} />}
    >
      <CodexLessonReader
        lesson={lesson}
        totalLessons={totalLessons}
        prevHref={prevHref}
        nextHref={nextHref}
      />
    </LessonShell>
  );
}

export default CodexLessonPage;

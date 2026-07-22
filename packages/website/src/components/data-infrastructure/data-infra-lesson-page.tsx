"use client";

import { useState, type JSX } from "react";
import { LessonShell } from "@/components/course/lesson-shell";
import { DataInfraLessonSidebar, type DataInfraLessonNavItem } from "./data-infra-lesson-sidebar";
import { DataInfraLessonReader } from "./data-infra-lesson-reader";
import type { DataInfraLesson } from "@/lib/data-infrastructure/types";

interface DataInfraLessonPageProps {
  readonly lesson: DataInfraLesson;
  readonly navItems: readonly DataInfraLessonNavItem[];
  readonly totalLessons: number;
  readonly prevHref: string | null;
  readonly nextHref: string | null;
}

/** Ties the shared `LessonShell` nav chrome to this course's sidebar + reader. */
export function DataInfraLessonPage({
  lesson,
  navItems,
  totalLessons,
  prevHref,
  nextHref,
}: DataInfraLessonPageProps): JSX.Element {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <LessonShell
      navOpen={navOpen}
      onNavOpenChange={setNavOpen}
      navLabel="Lesson navigation"
      sidebar={<DataInfraLessonSidebar lessons={navItems} />}
    >
      <DataInfraLessonReader lesson={lesson} totalLessons={totalLessons} prevHref={prevHref} nextHref={nextHref} />
    </LessonShell>
  );
}

export default DataInfraLessonPage;

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { courseGroupFor } from "@/lib/courses/tracks";
import { subscribe } from "@/lib/progress/store";
import type { UnifiedProgress } from "@/lib/progress/types";
import {
  completedCanonicalLessonCount,
  isCourseCompletionEarned,
} from "@/lib/courses/completion";
import {
  hasCourseStarted,
  resolveCourseResumeHref,
} from "@/lib/courses/resume";
import type { CourseSlug } from "@/lib/course/types";

const SPINE_COURSES = COURSE_CATALOG.filter(
  (course) => courseGroupFor(course.slug) === "spine",
);

export interface LernbegleiterState {
  readonly currentCourseIndex: number;
  readonly completedCourseCount: number;
  readonly completedCourseSlugs: readonly CourseSlug[];
  readonly nextLabel: string;
  readonly nextHref: string;
  readonly allComplete: boolean;
}

/**
 * Resolve the next step from canonical catalog metadata and the unified
 * progress state. Every course requires its canonical lessons; courses with a
 * final assessment additionally require a passed quiz or the AI-Native
 * capstone. The strip uses the same completion bar as certificates/account.
 */
export function computeStripState(
  progress: UnifiedProgress,
  pathname?: string,
): LernbegleiterState {
  const completion = SPINE_COURSES.map((course) => {
    const completedLessons = completedCanonicalLessonCount(
      progress,
      course.slug,
    );
    return {
      course,
      completedLessons,
      complete: isCourseCompletionEarned(progress, course.slug),
      started: hasCourseStarted(progress, course.slug),
      lastActivity: progress.courses[course.slug]?.lastActivity ?? null,
    };
  });

  const completedCourseSlugs = completion
    .filter((entry) => entry.complete)
    .map((entry) => entry.course.slug);
  const completedCourseCount = completedCourseSlugs.length;
  const routeCourseIndex = pathname
    ? completion.findIndex(
        (entry) =>
          !entry.complete &&
          (pathname === entry.course.href ||
            pathname.startsWith(`${entry.course.href}/`)),
      )
    : -1;
  const mostRecentlyActive = completion
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => !entry.complete && entry.started)
    .sort((left, right) => {
      const leftAt = left.entry.lastActivity
        ? Date.parse(left.entry.lastActivity)
        : 0;
      const rightAt = right.entry.lastActivity
        ? Date.parse(right.entry.lastActivity)
        : 0;
      return rightAt - leftAt;
    })[0]?.index;
  const currentCourseIndex =
    routeCourseIndex >= 0
      ? routeCourseIndex
      : (mostRecentlyActive ??
        completion.findIndex((entry) => !entry.complete));

  if (currentCourseIndex === -1) {
    return {
      currentCourseIndex: SPINE_COURSES.length - 1,
      completedCourseCount,
      completedCourseSlugs,
      nextLabel: "Lernpfad abgeschlossen · tiefer gehen",
      nextHref: "/kurse#tiefer-gehen",
      allComplete: true,
    };
  }

  const current = completion[currentCourseIndex];
  const hasStarted = current.completedLessons > 0 || current.started;

  return {
    currentCourseIndex,
    completedCourseCount,
    completedCourseSlugs,
    nextLabel: `${hasStarted ? "Weiterlernen" : "Starten"}: ${current.course.title}`,
    nextHref: hasStarted
      ? resolveCourseResumeHref(progress, current.course.slug)
      : current.course.startHref,
    allComplete: false,
  };
}

export function LernbegleiterStrip() {
  const [state, setState] = useState<LernbegleiterState | null>(null);
  const pathname = usePathname();

  useEffect(
    () =>
      subscribe((progress) => {
        setState(computeStripState(progress, pathname));
      }),
    [pathname],
  );

  if (!state || SPINE_COURSES.length === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm"
      aria-label="Lernbegleiter"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3">
        <div className="hidden shrink-0 gap-1 sm:flex" aria-hidden="true">
          {SPINE_COURSES.map((course, index) => {
            const isDone =
              state.allComplete ||
              state.completedCourseSlugs.includes(course.slug);
            const isCurrent =
              !state.allComplete && index === state.currentCourseIndex;
            return (
              <div
                key={course.slug}
                title={course.title}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  isDone
                    ? "bg-brand-orange"
                    : isCurrent
                      ? "bg-brand-orange/60"
                      : "bg-border"
                }`}
              />
            );
          })}
        </div>

        <span className="hidden shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:block">
          Lernpfad{" "}
          {state.allComplete
            ? SPINE_COURSES.length
            : state.currentCourseIndex + 1}
          /{SPINE_COURSES.length}
        </span>

        <Link
          href={state.nextHref}
          className="group flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-brand-orange"
        >
          <span className="truncate">{state.nextLabel}</span>
          <ChevronRight
            aria-hidden="true"
            size={14}
            className="shrink-0 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </div>
  );
}

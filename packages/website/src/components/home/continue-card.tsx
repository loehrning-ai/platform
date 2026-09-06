"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { HOME_COPY } from "@/components/home/home-copy";
import type { ContinueCourse } from "@/components/home/continue-courses";
import {
  getCompletedLessonsCount,
  getCourseSlice,
  isCertificateEligible,
  subscribe,
} from "@/lib/progress/store";
import type { Locale } from "@/lib/i18n/locale";

/**
 * The one decision the companion home puts above everything else: the course
 * this browser is already in, or the first step if it is in none.
 *
 * Progress lives only in the active learning namespace (anonymous or account),
 * so this cannot be answered on the server. The component therefore renders
 * client-side only, inside a seat whose height is reserved in the server HTML
 * (continue-slot.tsx) — the card fills that seat and never grows it, so a late
 * namespace resolution moves nothing on the page.
 *
 * Everything it reads is already in the page's client graph: the progress
 * store, which the layout's learning-owner boundary loads on every route, and
 * HOME_COPY, which the hero loads. Course facts arrive as props from the
 * server (continue-courses.ts). The card adds no module of its own weight.
 */

/** One course's progress, independent of copy, locale and catalog order. */
export interface ContinueCourseProgress {
  readonly slug: string;
  readonly completed: number;
  readonly started: boolean;
  readonly certified: boolean;
  /** ISO stamp the store writes on every per-course write. */
  readonly lastActivity: string;
}

export interface ContinueTarget {
  readonly slug: string;
  readonly completed: number;
  readonly mode: "resume" | "start";
}

/**
 * Pick the resume target, deterministically and tie-broken by catalog order.
 *
 *   1. the started, unfinished course touched most recently — the real "where
 *      you left off". The store stamps `lastActivity` on every per-course
 *      write, so this is a recorded fact rather than an inference;
 *   2. otherwise the first course this browser has not started;
 *   3. otherwise the most recently touched course, when every started course
 *      is already finished.
 */
export function pickContinueTarget(
  courses: readonly ContinueCourseProgress[],
): ContinueTarget | null {
  if (courses.length === 0) return null;

  const open = courses.filter((course) => course.started && !course.certified);
  const latest = mostRecent(open);
  if (latest) {
    return { slug: latest.slug, completed: latest.completed, mode: "resume" };
  }

  const unstarted = courses.find((course) => !course.started);
  if (unstarted) {
    return { slug: unstarted.slug, completed: 0, mode: "start" };
  }

  const fallback = mostRecent(courses) ?? courses[0];
  return {
    slug: fallback.slug,
    completed: fallback.completed,
    mode: "resume",
  };
}

function mostRecent(
  courses: readonly ContinueCourseProgress[],
): ContinueCourseProgress | null {
  return courses.reduce<ContinueCourseProgress | null>(
    (winner, course) =>
      winner !== null && stampOf(winner) >= stampOf(course) ? winner : course,
    null,
  );
}

/** An unparseable stamp sorts oldest, so catalog order decides instead. */
function stampOf(course: ContinueCourseProgress): number {
  const parsed = Date.parse(course.lastActivity);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function readCourseProgress(course: ContinueCourse): ContinueCourseProgress {
  const slice = getCourseSlice(course.slug);
  const completed = getCompletedLessonsCount(course.slug);
  return {
    slug: course.slug,
    completed,
    // Matches hasCourseStarted() in lib/courses/resume.ts, read off the slice
    // the store already exposes so this island needs no further module.
    started:
      completed > 0 ||
      Object.keys(slice.lessons).length > 0 ||
      slice.workshopQuiz.completedAt !== null ||
      slice.capstoneSubmitted,
    certified: isCertificateEligible(course.slug),
    lastActivity: slice.lastActivity,
  };
}

export function ContinueCard({
  locale = "de",
  courses,
}: {
  readonly locale?: Locale;
  readonly courses: readonly ContinueCourse[];
}) {
  const copy = HOME_COPY[locale].companion;
  const [target, setTarget] = useState<ContinueTarget | null>(null);

  // subscribe() delivers the current snapshot immediately and again on every
  // local write or cross-tab change, so the card needs no separate read.
  useEffect(
    () => subscribe(() => setTarget(pickContinueTarget(courses.map(readCourseProgress)))),
    [courses],
  );

  if (!target) return null;

  const course = courses.find((candidate) => candidate.slug === target.slug);
  if (!course) return null;

  const resuming = target.mode === "resume";

  return (
    <Link
      href={resuming ? course.continueHref : course.startHref}
      prefetch={false}
      data-home-continue-card={target.mode}
      className="flex h-full w-full items-center gap-3 overflow-hidden rounded-2xl border border-foreground/10 bg-brand-acid/60 px-4 shadow-card outline-none transition-[border-color,box-shadow] duration-200 hover:border-brand-cobalt/45 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-brand-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-ui-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange">
          {resuming ? copy.resumeEyebrow : copy.startEyebrow}
        </span>
        <span className="mt-0.5 block truncate text-base font-bold tracking-[-0.02em] text-foreground">
          {course.title}
        </span>
        <span className="block truncate text-xs leading-snug text-muted-foreground">
          {resuming
            ? copy.lessonsDone(target.completed, course.totalLessons)
            : course.duration}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-foreground/15 bg-paper text-brand-cobalt"
      >
        <ArrowRight size={16} />
      </span>
    </Link>
  );
}

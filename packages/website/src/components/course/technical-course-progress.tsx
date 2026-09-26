"use client";

import { useEffect, useState, type JSX } from "react";
import type { CourseSlug } from "@/lib/course/types";
import {
  getCompletedLessonsCount,
  getEvidenceBackedCompletedLessonIds,
  getOverallProgress,
  subscribe,
} from "@/lib/progress";

interface TechnicalCourseProgressBarProps {
  readonly courseSlug: CourseSlug;
  readonly totalLessons: number;
  readonly label: string;
  readonly unitLabel: string;
}

interface TechnicalCourseTrackProgressProps {
  readonly courseSlug: CourseSlug;
  readonly tracks: readonly {
    readonly id: string;
    readonly label: string;
    readonly title: string;
  }[];
  readonly lessons: readonly {
    readonly id: string;
    readonly trackId: string;
  }[];
  readonly label: string;
  readonly overallLabel: string;
  readonly unitLabel: string;
}

function widthStyle(percentage: number): { readonly width: string } {
  return { width: `${percentage}%` };
}

export function TechnicalCourseProgressBar({
  courseSlug,
  totalLessons,
  label,
  unitLabel,
}: TechnicalCourseProgressBarProps): JSX.Element | null {
  const [done, setDone] = useState(0);
  const [percentage, setPercentage] = useState(0);

  useEffect(
    () =>
      subscribe(() => {
        setDone(getCompletedLessonsCount(courseSlug));
        setPercentage(getOverallProgress(courseSlug, totalLessons));
      }),
    [courseSlug, totalLessons],
  );

  // A visitor with no recorded lesson gets no empty "0 / 18 · 0%" bar in the
  // hero. The server and first client render both start at 0, so the bar
  // appears only after stored progress is read: hydration-safe.
  if (done === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-caption text-muted-foreground tabular-nums">
        <span className="break-words">
          {done} / {totalLessons} {unitLabel}
        </span>
        <span className="shrink-0 tabular-nums">{percentage}%</span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden bg-track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-foreground transition-[width] motion-reduce:transition-none"
          style={widthStyle(percentage)}
        />
      </div>
    </div>
  );
}

export function TechnicalCourseTrackProgress({
  courseSlug,
  tracks,
  lessons,
  label,
  overallLabel,
  unitLabel,
}: TechnicalCourseTrackProgressProps): JSX.Element {
  const [completed, setCompleted] = useState<ReadonlySet<string>>(new Set());

  useEffect(
    () =>
      subscribe(() => {
        setCompleted(getEvidenceBackedCompletedLessonIds(courseSlug));
      }),
    [courseSlug],
  );

  const totalDone = lessons.filter((lesson) => completed.has(lesson.id)).length;
  const overallPercentage =
    lessons.length > 0 ? Math.round((totalDone / lessons.length) * 100) : 0;

  return (
    <div aria-label={label} className="border-y border-hairline" role="group">
      {tracks.map((track) => {
        const trackLessons = lessons.filter(
          (lesson) => lesson.trackId === track.id,
        );
        const done = trackLessons.filter((lesson) =>
          completed.has(lesson.id),
        ).length;
        const percentage =
          trackLessons.length > 0
            ? Math.round((done / trackLessons.length) * 100)
            : 0;

        return (
          <div
            key={track.id}
            className="grid min-w-0 gap-2 border-b border-hairline py-3 sm:grid-cols-[180px_minmax(0,1fr)_7rem] sm:items-center sm:gap-4"
          >
            <div className="min-w-0">
              <p className="text-label text-muted-foreground">
                {track.label}
              </p>
              <p className="mt-0.5 break-words text-[0.875rem] font-semibold text-foreground">
                {track.title}
              </p>
            </div>
            <div
              className="h-1.5 overflow-hidden bg-track"
              role="progressbar"
              aria-label={`${track.title}: ${done} / ${trackLessons.length} ${unitLabel}`}
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-foreground transition-[width] motion-reduce:transition-none"
                style={widthStyle(percentage)}
              />
            </div>
            <p className="text-caption tabular-nums text-muted-foreground sm:text-right">
              {done} / {trackLessons.length} · {percentage}%
            </p>
          </div>
        );
      })}
      <div className="grid min-w-0 gap-2 py-3 sm:grid-cols-[180px_minmax(0,1fr)_7rem] sm:items-center sm:gap-4">
        <p className="text-label text-foreground">
          {overallLabel}
        </p>
        <div
          className="h-2 overflow-hidden bg-track"
          role="progressbar"
          aria-label={`${overallLabel}: ${totalDone} / ${lessons.length} ${unitLabel}`}
          aria-valuenow={overallPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-foreground transition-[width] motion-reduce:transition-none"
            style={widthStyle(overallPercentage)}
          />
        </div>
        <p className="text-caption font-semibold tabular-nums text-foreground sm:text-right">
          {totalDone} / {lessons.length} · {overallPercentage}%
        </p>
      </div>
    </div>
  );
}

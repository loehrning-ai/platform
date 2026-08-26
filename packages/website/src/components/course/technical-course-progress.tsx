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
}: TechnicalCourseProgressBarProps): JSX.Element {
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

  return (
    <div>
      <div className="flex items-center justify-between gap-3 font-mono text-xs text-muted-foreground">
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
          className="h-full bg-brand-orange transition-[width] motion-reduce:transition-none"
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
    <div aria-label={label} className="border-y border-border" role="group">
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
            className="grid min-w-0 gap-2 border-b border-border py-3 sm:grid-cols-[180px_minmax(0,1fr)_7rem] sm:items-center sm:gap-4"
          >
            <div className="min-w-0">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-brand-orange">
                {track.label}
              </p>
              <p className="mt-0.5 break-words text-[13px] font-semibold text-foreground">
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
                className="h-full bg-brand-orange transition-[width] motion-reduce:transition-none"
                style={widthStyle(percentage)}
              />
            </div>
            <p className="font-mono text-xs tabular-nums text-muted-foreground sm:text-right">
              {done} / {trackLessons.length} · {percentage}%
            </p>
          </div>
        );
      })}
      <div className="grid min-w-0 gap-2 py-3 sm:grid-cols-[180px_minmax(0,1fr)_7rem] sm:items-center sm:gap-4">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-foreground">
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
            className="h-full bg-brand-orange transition-[width] motion-reduce:transition-none"
            style={widthStyle(overallPercentage)}
          />
        </div>
        <p className="font-mono text-xs font-bold tabular-nums text-foreground sm:text-right">
          {totalDone} / {lessons.length} · {overallPercentage}%
        </p>
      </div>
    </div>
  );
}

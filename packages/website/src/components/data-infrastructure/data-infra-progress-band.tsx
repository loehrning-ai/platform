"use client";

import { useEffect, useState, type JSX } from "react";
import { getCompletedLessonIds } from "@/lib/course/progress";
import type {
  DataInfraLessonId,
  DataInfraTrack,
} from "@/lib/data-infrastructure/types";
import { getDataInfraCourseCopy } from "@/lib/data-infrastructure/course-copy";
import type { Locale } from "@/lib/i18n/locale";
import { subscribe } from "@/lib/progress";

interface DataInfraProgressBandProps {
  readonly locale: Locale;
  readonly tracks: readonly DataInfraTrack[];
  readonly lessons: readonly {
    readonly id: DataInfraLessonId;
    readonly trackId: string;
  }[];
}

/**
 * Live per-track + overall progress readout for the course landing page
 *.
 * Hydration-safe: renders the zero state on first paint (matching the
 * server-rendered markup), then fills in from the unified progress store
 * (localStorage cache + server-synced) after mount.
 */
export function DataInfraProgressBand({
  locale,
  tracks,
  lessons,
}: DataInfraProgressBandProps): JSX.Element {
  const [completed, setCompleted] = useState<ReadonlySet<string>>(new Set());
  const copy = getDataInfraCourseCopy(locale).progress;

  useEffect(() => {
    return subscribe(() => {
      setCompleted(getCompletedLessonIds("data-infrastructure"));
    });
  }, []);

  const totalDone = lessons.filter((l) => completed.has(l.id)).length;
  const overallPct =
    lessons.length > 0 ? Math.round((totalDone / lessons.length) * 100) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tracks.map((track) => {
        const trackLessons = lessons.filter((l) => l.trackId === track.id);
        const done = trackLessons.filter((l) => completed.has(l.id)).length;
        const pct =
          trackLessons.length > 0
            ? Math.round((done / trackLessons.length) * 100)
            : 0;
        return (
          <div
            key={track.id}
            className="min-w-0 border-2 border-border bg-card p-4"
          >
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-brand-orange">
              <span className="break-words">{track.label}</span>
            </p>
            <p className="mt-1 break-words text-[13px] font-semibold text-foreground">
              {track.title}
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-brand-orange transition-[width]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
              {done} / {trackLessons.length} {copy.lessons} · {pct}%
            </p>
          </div>
        );
      })}
      <div className="border-2 border-foreground bg-card p-4 sm:col-span-2 lg:col-span-4">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          {copy.overall}
        </p>
        <p className="mt-1 font-mono text-[20px] font-bold text-foreground">
          {totalDone} / {lessons.length} {copy.lessons} · {overallPct}%
        </p>
      </div>
    </div>
  );
}

export default DataInfraProgressBand;

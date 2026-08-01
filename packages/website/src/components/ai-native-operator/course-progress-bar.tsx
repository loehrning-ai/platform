"use client";

import { useEffect, useState, type JSX } from "react";
import { subscribe, getCompletedLessonsCount, getOverallProgress } from "@/lib/progress/store";
import { TOTAL_LESSON_COUNT } from "@/lib/ai-native-operator/types";

/**
 * CourseProgressBar — reading-progress bar sourced from the unified store
 *, mirroring the source's own `Sidebar` progress readout
 * (course-app.js:38, "N / 39 lessons · X%") but as a page-level bar rather
 * than sidebar chrome. SSR-safe: renders "0 / 39" until mounted, then
 * subscribes to the unified store for live cross-tab updates.
 */
export function CourseProgressBar(): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [done, setDone] = useState(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = subscribe(() => {
      setDone(getCompletedLessonsCount("ai-native-operator"));
      setPct(getOverallProgress("ai-native-operator", TOTAL_LESSON_COUNT));
    });
    return unsubscribe;
  }, []);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
        <span>
          {mounted ? done : 0} / {TOTAL_LESSON_COUNT} lessons
        </span>
        <span>{mounted ? pct : 0}%</span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden bg-border"
        role="progressbar"
        aria-label="Lesson progress"
        aria-valuenow={mounted ? pct : 0}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-brand-orange transition-[width] duration-300"
          style={{ width: `${mounted ? pct : 0}%` }}
        />
      </div>
    </div>
  );
}

export default CourseProgressBar;

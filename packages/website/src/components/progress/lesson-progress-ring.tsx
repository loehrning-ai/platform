"use client";

// ─── Shared LessonProgressRing (shared course architecture) ──
//
// Circular SVG arc that fills as the learner marks sections read. Originally
// AI-Native only (src/components/ai-native/kurs/lesson-progress-ring.tsx);
// this course-agnostic version reads the ONE unified store via `subscribe`
// (live cross-tab + same-tab updates, no focus/storage hand-rolling) so it
// drops onto the two free courses too.
//
// SSR-safe: renders an empty ring with a "— / N" label until mounted so there
// is no layout shift. Reduced-motion: the fill transition is dropped.

import { useEffect, useState, type JSX } from "react";
import { useReducedMotion } from "framer-motion";
import { subscribe } from "@/lib/progress/store";
import { getReadSectionIds } from "@/lib/progress/store";
import { isEvidenceBackedLessonCompleted } from "@/lib/progress/completion-evidence";
import type { CourseSlug } from "@/lib/course/types";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locale";

interface Props {
  readonly courseSlug: CourseSlug;
  readonly lessonId: string;
  readonly totalSections: number;
  readonly size?: number;
  readonly className?: string;
  readonly locale?: Locale;
}

export function LessonProgressRing({
  courseSlug,
  lessonId,
  totalSections,
  size = 56,
  className,
  locale = "de",
}: Props): JSX.Element {
  const prefersReduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [sectionsRead, setSectionsRead] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // subscribe() fires immediately with current state, then on every store
    // change (local writes + cross-tab via the storage listener).
    const unsubscribe = subscribe(() => {
      setSectionsRead(getReadSectionIds(courseSlug, lessonId).size);
      setCompleted(isEvidenceBackedLessonCompleted(courseSlug, lessonId));
    });
    return unsubscribe;
  }, [courseSlug, lessonId]);

  const stroke = 4;
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const fraction =
    totalSections <= 0
      ? 0
      : Math.min(1, Math.max(0, sectionsRead / totalSections));
  const offset = c * (1 - fraction);
  const isDone = completed;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      role="img"
      aria-label={
        mounted
          ? locale === "en"
            ? `${sectionsRead} of ${totalSections} sections reviewed`
            : `${sectionsRead} von ${totalSections} Abschnitten geprüft`
          : locale === "en"
            ? `${totalSections} sections`
            : `${totalSections} Abschnitte`
      }
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={
            isDone ? "var(--color-risk-green)" : "var(--color-brand-orange)"
          }
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: prefersReduced
              ? "none"
              : "stroke-dashoffset 400ms cubic-bezier(0.19, 1, 0.22, 1)",
          }}
        />
      </svg>
      {/* 7f (accessibility and quality hardening): aria-hidden="true" on the inner checkmark/progress text.
          The SVG ring's aria-label on the parent div already conveys the state
          to screen readers; this inner span is purely decorative/redundant. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute font-mono text-xs font-bold tracking-[0.06em]",
          isDone ? "text-risk-green" : "text-foreground",
        )}
      >
        {mounted
          ? isDone
            ? "✓"
            : `${sectionsRead}/${totalSections}`
          : `, /${totalSections}`}
      </span>
    </div>
  );
}

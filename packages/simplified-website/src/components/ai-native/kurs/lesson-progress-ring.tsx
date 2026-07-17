"use client";

import { useEffect, useState, type JSX } from "react";
import { getReadSectionIds, isLessonCompleted } from "@/lib/ai-native/progress";
import { cn } from "@/lib/utils";

/**
 * LessonProgressRing — circular SVG arc that fills as the user marks
 * sections read. Delight #2 from AI-native lesson system ().
 *
 * Hydrates from localStorage on mount; during SSR shows an empty ring with
 * "— / N" label so there's no layout shift.
 */

interface Props {
  readonly lessonId: string;
  readonly totalSections: number;
  readonly size?: number;
  readonly className?: string;
}

export function LessonProgressRing({
  lessonId,
  totalSections,
  size = 56,
  className,
}: Props): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [sectionsRead, setSectionsRead] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const read = getReadSectionIds(lessonId);
    setSectionsRead(read.size);
    setCompleted(isLessonCompleted(lessonId));
  }, [lessonId]);

  useEffect(() => {
    if (!mounted) return;
    // Refresh ring when progress storage changes (cross-tab + same-tab writes
    // emit a "storage" event; for same-tab we refresh on focus).
    function refresh() {
      const read = getReadSectionIds(lessonId);
      setSectionsRead(read.size);
      setCompleted(isLessonCompleted(lessonId));
    }
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [mounted, lessonId]);

  const stroke = 4;
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const fraction =
    totalSections <= 0
      ? 0
      : Math.min(1, Math.max(0, sectionsRead / totalSections));
  const offset = c * (1 - fraction);

  // Show "completed" state if the lesson is fully done OR ring is at 100%.
  const isDone = completed || fraction >= 1;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      role="img"
      aria-label={
        mounted
          ? `${sectionsRead} von ${totalSections} Abschnitten gelesen`
          : `${totalSections} Abschnitte`
      }
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={isDone ? "#22c55e" : "var(--color-brand-orange)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: "stroke-dashoffset 400ms cubic-bezier(0.19, 1, 0.22, 1)",
          }}
        />
      </svg>
      <span
        className={cn(
          "absolute font-mono text-[10px] font-bold tracking-[0.06em]",
          isDone ? "text-[#22c55e]" : "text-foreground",
        )}
      >
        {mounted ? (
          isDone ? (
            "✓"
          ) : (
            `${sectionsRead}/${totalSections}`
          )
        ) : (
          `, /${totalSections}`
        )}
      </span>
    </div>
  );
}

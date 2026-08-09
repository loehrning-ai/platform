"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n/locale";
import { getCourseReaderCopy } from "./course-ui-copy";

// Codex card easing (interactive-courses index.html `.card` transition):
// fast out, gentle settle. Used for the lesson-card hover accent-bar.
// MotionConfig in layout.tsx maps this to a no-op under
// prefers-reduced-motion, so the bar simply snaps to its target scaleY.
const CODEX_EASE = "cubic-bezier(.2,.8,.2,1)";

interface LessonSidebarProps {
  readonly lessons: readonly Lesson[];
  readonly activeLessonId: string;
  readonly completedLessonIds: ReadonlySet<string>;
  readonly onSelectLesson: (lessonId: string) => void;
  readonly locale?: Locale;
}

export function LessonSidebar({
  lessons,
  activeLessonId,
  completedLessonIds,
  onSelectLesson,
  locale = "de",
}: LessonSidebarProps) {
  const copy = getCourseReaderCopy(locale);
  return (
    <nav className="space-y-1" aria-label={copy.sidebar.navigation}>
      <p className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-brand-orange">
        {copy.sidebar.heading}
      </p>
      {lessons.map((lesson) => {
        const isActive = lesson.id === activeLessonId;
        const isCompleted = completedLessonIds.has(lesson.id);

        return (
          <button
            key={lesson.id}
            type="button"
            onClick={() => onSelectLesson(lesson.id)}
            aria-current={isActive ? "location" : undefined}
            aria-label={copy.sidebar.lessonLabel(
              lesson.number,
              lesson.title,
              isCompleted,
            )}
            // WCAG 2.5.3: the aria-label above contains the visible lesson title
            // as a substring so voice-input commands ("click Lektion 2: Datenschutz")
            // work correctly. Do NOT rewrite aria-label to a value that omits the
            // visible text, or voice-input commands will break.
            className={cn(
              "group relative flex w-full items-start gap-3 border px-4 py-3 text-left transition-[background-color,border-color,color,opacity,transform,box-shadow] duration-200",
              isActive
                ? "border-brand-orange/30 bg-brand-orange/5"
                : "border-transparent hover:border-border hover:bg-card/50",
            )}
          >
            {/* Hover accent-bar (shared course architecture, codex card easing):
                a left rail that scales vertically in on hover/active.
                transform-origin bottom so it grows upward. */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-y-0 left-0 w-[3px] origin-bottom bg-brand-orange transition-transform duration-300 group-hover:scale-y-100 group-focus-visible:scale-y-100",
                isActive ? "scale-y-100" : "scale-y-0",
              )}
              style={{ transitionTimingFunction: CODEX_EASE }}
            />
            <div className="mt-0.5 shrink-0">
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-brand-sand" />
              ) : isActive ? (
                <Circle className="h-4 w-4 text-brand-orange" />
              ) : (
                <Circle className="h-4 w-4 text-muted" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-medium leading-tight",
                  isActive
                    ? "text-brand-orange"
                    : isCompleted
                      ? "text-brand-sand"
                      : "text-foreground",
                )}
              >
                {lesson.title}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {copy.sidebar.minutes(lesson.durationMinutes)}
              </span>
            </div>
          </button>
        );
      })}
    </nav>
  );
}

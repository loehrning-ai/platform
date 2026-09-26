"use client";

import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LESSON_SIDEBAR_ACTIVE_MARKER_CLASS,
  LESSON_SIDEBAR_NUMBER_CLASS,
  lessonSidebarItemClass,
} from "../lesson-sidebar-classes";
import type { Lesson } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n/locale";
import { getCourseReaderCopy } from "./course-ui-copy";

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
    <nav
      className="flex min-w-0 flex-col gap-0.5"
      aria-label={copy.sidebar.navigation}
    >
      <p className="mb-2 text-label text-muted-foreground">
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
            className={lessonSidebarItemClass(isActive)}
          >
            <div className="flex w-4 shrink-0 justify-center">
              {isCompleted ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-pass" aria-hidden="true" />
              ) : isActive ? (
                <span
                  aria-hidden="true"
                  className={LESSON_SIDEBAR_ACTIVE_MARKER_CLASS}
                />
              ) : (
                <span className={LESSON_SIDEBAR_NUMBER_CLASS}>
                  {lesson.number}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "break-words leading-tight [overflow-wrap:anywhere]",
                  isActive || isCompleted
                    ? "text-foreground"
                    : undefined,
                )}
              >
                {lesson.title}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                {copy.sidebar.minutes(lesson.durationMinutes)}
              </span>
            </div>
          </button>
        );
      })}
    </nav>
  );
}

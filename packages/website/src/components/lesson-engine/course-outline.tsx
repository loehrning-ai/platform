"use client";

import { useEffect, useId, useState, type JSX } from "react";
import Link from "next/link";
import { Check, ChevronDown, Clock } from "lucide-react";
import type { CourseSlug } from "@/lib/course/types";
import { getEvidenceBackedCompletedLessonIds, subscribe } from "@/lib/progress";
import { getLearningOwnerContext } from "@/lib/progress/browser-learning-storage";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { APP_FOCUS } from "./app-ui";

export interface CourseOutlineLesson {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly durationMinutes?: number;
  /** Route of the lesson. Lessons without an href use `onSelectLesson`. */
  readonly href?: string;
}

export interface CourseOutlineModule {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly lessons: readonly CourseOutlineLesson[];
}

const COPY = {
  de: {
    module: (number: number) => `Modul ${number}`,
    moduleProgress: (done: number, total: number) => `${done} von ${total} Lektionen erledigt`,
    lessonLabel: (number: number, title: string, done: boolean) =>
      `Lektion ${number}: ${title}${done ? " (abgeschlossen)" : ""}`,
    minutes: (count: number) => `${count} Min.`,
  },
  en: {
    module: (number: number) => `Module ${number}`,
    moduleProgress: (done: number, total: number) => `${done} of ${total} lessons done`,
    lessonLabel: (number: number, title: string, done: boolean) =>
      `Lesson ${number}: ${title}${done ? " (complete)" : ""}`,
    minutes: (count: number) => `${count} min`,
  },
} as const;

/**
 * The course-app outline: every module of the course as a collapsible group
 * with a progress dot per lesson. The module that holds the active lesson
 * starts open. Lessons of the current route are buttons when the reader
 * switches lessons in place (block courses), links otherwise.
 */
export function CourseOutline({
  courseSlug,
  modules,
  activeLessonId,
  onSelectLesson,
  locale = "de",
  label,
}: {
  readonly courseSlug: CourseSlug;
  readonly modules: readonly CourseOutlineModule[];
  readonly activeLessonId: string;
  readonly onSelectLesson?: (lessonId: string) => void;
  readonly locale?: Locale;
  /** Accessible name of the navigation landmark. */
  readonly label: string;
}): JSX.Element {
  const copy = COPY[locale];
  const baseId = useId();
  const [completed, setCompleted] = useState<ReadonlySet<string>>(() => new Set());
  const activeModuleId =
    modules.find((module) => module.lessons.some((lesson) => lesson.id === activeLessonId))?.id ??
    modules[0]?.id;
  const [open, setOpen] = useState<ReadonlySet<string>>(
    () => new Set(activeModuleId ? [activeModuleId] : []),
  );

  useEffect(
    () =>
      subscribe(() => {
        setCompleted(
          getLearningOwnerContext().kind === "unknown"
            ? new Set()
            : new Set(getEvidenceBackedCompletedLessonIds(courseSlug)),
        );
      }),
    [courseSlug],
  );

  // Moving to a lesson in another module opens that module.
  useEffect(() => {
    if (!activeModuleId) return;
    setOpen((previous) =>
      previous.has(activeModuleId) ? previous : new Set([...previous, activeModuleId]),
    );
  }, [activeModuleId]);

  const toggle = (moduleId: string) =>
    setOpen((previous) => {
      const next = new Set(previous);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });

  return (
    <nav aria-label={label} data-course-outline className="flex min-w-0 flex-col gap-2">
      {modules.map((module) => {
        const done = module.lessons.filter((lesson) => completed.has(lesson.id)).length;
        const total = module.lessons.length;
        const expanded = open.has(module.id);
        const panelId = `${baseId}-${module.id}`;
        const isActiveModule = module.id === activeModuleId;
        return (
          <section
            key={module.id}
            data-outline-module={module.id}
            className={cn(
              "min-w-0 rounded-[20px] transition-[background-color] duration-200 motion-reduce:transition-none",
              isActiveModule ? "bg-card shadow-lab-sm ring-1 ring-lab-line/80" : "bg-transparent",
            )}
          >
            <h3 className="m-0">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(module.id)}
                className={cn(
                  "flex min-h-12 w-full min-w-0 items-center gap-3 rounded-[20px] px-3 py-2 text-left transition-[background-color] duration-150 hover:bg-lab-accent-soft/60 motion-reduce:transition-none",
                  APP_FOCUS,
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[12px] font-semibold", done === total && total > 0 ? "text-lab-good" : "text-lab-accent")}>
                    {copy.module(module.number)}
                  </span>
                  <span className="block break-words text-[14px] font-semibold leading-snug text-foreground">
                    {module.title}
                  </span>
                  <span className="mt-1.5 flex items-center gap-1" aria-hidden="true">
                    {module.lessons.map((lesson) => (
                      <span
                        key={lesson.id}
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          completed.has(lesson.id)
                            ? "bg-lab-good"
                            : lesson.id === activeLessonId
                              ? "bg-lab-accent"
                              : "bg-lab-line",
                        )}
                      />
                    ))}
                  </span>
                  <span className="sr-only">{copy.moduleProgress(done, total)}</span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
                    expanded && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <ol id={panelId} hidden={!expanded} className="space-y-0.5 px-1.5 pb-2">
              {module.lessons.map((lesson) => {
                const isActive = lesson.id === activeLessonId;
                const isDone = completed.has(lesson.id);
                const rowClass = cn(
                  "flex min-h-11 w-full min-w-0 items-start gap-2.5 rounded-[14px] px-2.5 py-2.5 text-left text-[14px] leading-snug transition-[background-color,color] duration-150 motion-reduce:transition-none",
                  isActive
                    ? "bg-lab-accent-soft font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-lab-accent-soft/60 hover:text-foreground",
                  APP_FOCUS,
                );
                const content = (
                  <>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full",
                        isDone
                          ? "bg-lab-good text-paper"
                          : isActive
                            ? "bg-lab-accent ring-4 ring-lab-accent/15"
                            : "ring-2 ring-inset ring-lab-line",
                      )}
                    >
                      {isDone ? <Check className="h-3 w-3" strokeWidth={3} /> : isActive ? <span className="h-1.5 w-1.5 rounded-full bg-paper" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words [overflow-wrap:anywhere]">{lesson.title}</span>
                      {lesson.durationMinutes ? (
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-normal text-muted-foreground">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {copy.minutes(lesson.durationMinutes)}
                        </span>
                      ) : null}
                    </span>
                  </>
                );
                return (
                  <li key={lesson.id}>
                    {lesson.href ? (
                      <Link
                        href={lesson.href}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={copy.lessonLabel(lesson.number, lesson.title, isDone)}
                        className={rowClass}
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectLesson?.(lesson.id)}
                        aria-current={isActive ? "location" : undefined}
                        aria-label={copy.lessonLabel(lesson.number, lesson.title, isDone)}
                        className={rowClass}
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </nav>
  );
}

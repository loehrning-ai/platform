"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import type { CourseSlug } from "@/lib/course/types";
import { getEvidenceBackedCompletedLessonIds, subscribe } from "@/lib/progress";
import { getLearningOwnerContext } from "@/lib/progress/browser-learning-storage";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { MotionProvider } from "@/components/motion-provider";
import { APP_EASE, APP_FOCUS, CONCEPT_SEEN_EVENT } from "./app-ui";
import { LESSON_ENGINE_COPY } from "./engine-copy";
import { useEngineLessonSteps } from "./use-engine-lesson-progress";

const COPY = {
  de: {
    course: (done: number, total: number) => `Kursfortschritt: ${done} von ${total} Lektionen abgeschlossen`,
    lesson: (done: number) => `Diese Lektion: ${done} von 3 Schritten erledigt`,
  },
  en: {
    course: (done: number, total: number) => `Course progress: ${done} of ${total} lessons complete`,
    lesson: (done: number) => `This lesson: ${done} of 3 steps done`,
  },
} as const;

/**
 * The slim sticky course header of the lesson reader: back to the hub, the
 * course and lesson context, three step dots for this lesson and a thin bar
 * for the whole course that grows when a lesson is completed.
 *
 * It is course progress, not a scroll indicator, and sits in the 3rem band
 * the document already reserves below the compact top bar
 * (`--lesson-toolbar-h`), so anchors and focus are never covered.
 */
export function CourseLessonHeader({
  courseSlug,
  lessonId,
  courseLessonIds,
  backHref,
  backLabel,
  title,
  context,
  locale = "de",
}: {
  readonly courseSlug: CourseSlug;
  readonly lessonId: string;
  /** Every lesson id of the course, for the course bar. */
  readonly courseLessonIds: readonly string[];
  readonly backHref: string;
  readonly backLabel: string;
  /** Course title. */
  readonly title: string;
  /** Module and lesson position, e.g. "Modul 1 · Lektion 2 von 8". */
  readonly context: string;
  readonly locale?: Locale;
}): JSX.Element {
  const copy = COPY[locale];
  const engineCopy = LESSON_ENGINE_COPY[locale];
  const steps = useEngineLessonSteps(courseSlug, lessonId);
  const [courseDone, setCourseDone] = useState(0);
  const idsKey = courseLessonIds.join("|");

  useEffect(
    () =>
      subscribe(() => {
        if (getLearningOwnerContext().kind === "unknown") {
          setCourseDone(0);
          return;
        }
        const completed = getEvidenceBackedCompletedLessonIds(courseSlug);
        setCourseDone(idsKey.split("|").filter((id) => id && completed.has(id)).length);
      }),
    [courseSlug, idsKey],
  );

  const [conceptSeenFor, setConceptSeenFor] = useState<string | null>(null);
  useEffect(() => {
    const onSeen = (event: Event) => {
      const detail = (event as CustomEvent<{ lessonId?: string }>).detail;
      if (detail?.lessonId) setConceptSeenFor(detail.lessonId);
    };
    window.addEventListener(CONCEPT_SEEN_EVENT, onSeen);
    return () => window.removeEventListener(CONCEPT_SEEN_EVENT, onSeen);
  }, []);

  // The header paints the band behind the translucent top bar only while it
  // is stuck under it (globals.css). Unstuck, at the top of the page, that
  // band would cover whatever sits above the header, such as the guest
  // "progress not saved" banner on a phone.
  const headerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const stickyTop = Number.parseFloat(getComputedStyle(header).top) || 0;
      const stuck = header.getBoundingClientRect().top <= stickyTop + 0.5 && window.scrollY > 0;
      header.toggleAttribute("data-stuck", stuck);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const total = courseLessonIds.length;
  const conceptDone =
    conceptSeenFor === lessonId || steps.exerciseDone || steps.checksPassed;
  const lessonSteps = [
    { key: "concept", label: engineCopy.steps.concept, done: conceptDone },
    { key: "exercise", label: engineCopy.steps.exercise, done: steps.exerciseDone },
    { key: "checks", label: engineCopy.steps.checks, done: steps.checksPassed },
  ];
  const stepsDone = lessonSteps.filter((step) => step.done).length;

  return (
    <MotionProvider>
      <div
        ref={headerRef}
        data-course-lesson-header
        className="course-app-frost sticky top-[var(--nav-h-compact)] z-30 -mx-4 -mt-4 mb-5 border-b border-lab-line/70 sm:-mx-5 lg:top-[var(--nav-h)] lg:-mx-6 lg:-mt-7 lg:mb-7 xl:-mx-8"
      >
        <div className="mx-auto flex h-[var(--lesson-toolbar-h)] max-w-5xl items-center gap-2 px-2 sm:px-4">
          <Link
            href={backHref}
            aria-label={backLabel}
            className={cn(
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground transition-[background-color] duration-150 hover:bg-lab-accent-soft motion-reduce:transition-none",
              APP_FOCUS,
            )}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[14px] font-semibold text-foreground">{title}</p>
            <p className="truncate text-[12px] text-muted-foreground">{context}</p>
          </div>
          <div
            role="img"
            aria-label={copy.lesson(stepsDone)}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-paper px-2.5 py-1.5 ring-1 ring-lab-line"
          >
            {lessonSteps.map((step) => (
              <span
                key={step.key}
                title={step.label}
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full transition-[background-color] duration-300 motion-reduce:transition-none",
                  step.done ? "bg-lab-good text-paper" : "bg-lab-line",
                )}
              >
                {step.done ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" /> : null}
              </span>
            ))}
          </div>
          <span className="hidden shrink-0 pl-1 text-[13px] font-semibold tabular-nums text-muted-foreground sm:inline" aria-hidden="true">
            {courseDone}/{total}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={copy.course(courseDone, total)}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={courseDone}
          className="absolute inset-x-0 bottom-0 h-[3px] bg-lab-line/60"
        >
          <m.div
            className="h-full origin-left bg-gradient-to-r from-lab-accent to-lab-good"
            initial={false}
            animate={{ scaleX: total > 0 ? courseDone / total : 0 }}
            transition={{ duration: 0.8, ease: APP_EASE }}
          />
        </div>
      </div>
    </MotionProvider>
  );
}

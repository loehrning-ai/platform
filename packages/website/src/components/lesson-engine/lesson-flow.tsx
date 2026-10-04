"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type JSX,
  type ReactNode,
} from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { ArrowRight, BookOpen, Check, Clock, FlaskConical, ListChecks } from "lucide-react";
import type { BaseLesson, CourseSlug } from "@/lib/course/types";
import type { EngineLesson } from "@/lib/lesson-engine/lesson";
import {
  ENGINE_EXERCISE_CHECKPOINT_ID,
  engineCheckpointLessonKey,
} from "@/lib/lesson-engine/types";
import type { Locale } from "@/lib/i18n/locale";
import { MarkdownRenderer } from "@/components/course/kurs/markdown-renderer";
import { RenderWidget } from "@/components/widgets/registry";
import { LabEmbedContext } from "@/components/widgets/lab/lab-context";
import { MotionProvider } from "@/components/motion-provider";
import { cn } from "@/lib/utils";
import { LESSON_ENGINE_COPY } from "./engine-copy";
import { LessonChecks } from "./lesson-checks";
import { ProgressRing } from "./progress-ring";
import { useEngineLessonProgress } from "./use-engine-lesson-progress";

export type LessonFlowNext =
  | { readonly kind: "button"; readonly label: string; readonly onSelect: () => void }
  | { readonly kind: "link"; readonly label: string; readonly href: string };

export interface LessonFlowProps {
  readonly courseSlug: CourseSlug;
  readonly lesson: EngineLesson<BaseLesson>;
  /** One-based position in the whole course. */
  readonly position: { readonly index: number; readonly total: number };
  /** Optional module label above the title, e.g. "Modul 1 · Was darf rein?". */
  readonly moduleLabel?: string;
  readonly next?: LessonFlowNext;
  readonly locale?: Locale;
  /** Fired once when this lesson becomes complete during this visit. */
  readonly onCompleted?: () => void;
  /** Fired once when the learner first records progress in this lesson. */
  readonly onFirstProgress?: () => void;
}

const REVEAL = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
} as const;

function StepHeading({
  index,
  icon,
  kicker,
  title,
  done,
  doneLabel,
  id,
}: {
  readonly index: number;
  readonly icon: ReactNode;
  readonly kicker: string;
  readonly title?: string;
  readonly done: boolean;
  readonly doneLabel: string;
  readonly id: string;
}): JSX.Element {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300",
          done ? "bg-lab-good text-paper" : "bg-lab-accent-soft text-lab-accent",
        )}
      >
        {done ? <Check className="h-4 w-4" /> : icon}
      </span>
      <div className="min-w-0">
        <p className="text-label text-muted-foreground">
          <span className="sr-only">{index}. </span>
          {kicker}
          {done ? <span className="sr-only"> ({doneLabel})</span> : null}
        </p>
        {title ? (
          <h2 id={id} className="mt-0.5 text-xl font-bold tracking-[-0.01em] text-foreground sm:text-2xl">
            {title}
          </h2>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The lesson-engine reader: one scrolling flow.
 *
 *   header (position, title, step rail, duration)
 *   1. concept   — ≤150 words, evidence first, takeaway, source chips
 *   2. exercise  — one registered widget driven by lesson JSON props
 *   3. checks    — two questions with instant explained feedback
 *   completion   — appears when exercise done + both checks correct; next CTA
 *
 * Route-agnostic: block courses render it inside LessonLayout, AI-Native can
 * render it inside its lesson page shell. Progress lives in the unified store
 * (useEngineLessonProgress); this component never writes a "read" bit.
 */
export function LessonFlow({
  courseSlug,
  lesson,
  position,
  moduleLabel,
  next,
  locale = "de",
  onCompleted,
  onFirstProgress,
}: LessonFlowProps): JSX.Element {
  const copy = LESSON_ENGINE_COPY[locale];
  const progress = useEngineLessonProgress(courseSlug, lesson.id);
  const interactive = progress.hydrated && progress.ownerReady;
  const completedBefore = useRef<boolean | null>(null);
  const progressedBefore = useRef<boolean | null>(null);

  useEffect(() => {
    if (!progress.hydrated) return;
    if (completedBefore.current === null) {
      completedBefore.current = progress.completed;
    } else if (!completedBefore.current && progress.completed) {
      completedBefore.current = true;
      onCompleted?.();
    }
    const any = progress.exerciseDone || progress.checksPassed;
    if (progressedBefore.current === null) {
      progressedBefore.current = any;
    } else if (!progressedBefore.current && any) {
      progressedBefore.current = true;
      onFirstProgress?.();
    }
  }, [
    progress.hydrated,
    progress.completed,
    progress.exerciseDone,
    progress.checksPassed,
    onCompleted,
    onFirstProgress,
  ]);

  const { recordExerciseDone, recordChecksPassed } = progress;
  const embedValue = useMemo(
    () => ({ embedded: true, onComplete: () => void recordExerciseDone() }),
    [recordExerciseDone],
  );
  const exerciseProps = useMemo(
    () => ({
      ...lesson.exercise.props,
      lessonId: engineCheckpointLessonKey(courseSlug, lesson.id),
      cpId: ENGINE_EXERCISE_CHECKPOINT_ID,
    }),
    [courseSlug, lesson.id, lesson.exercise.props],
  );
  const handleChecksSolved = useCallback(
    (total: number) => {
      recordChecksPassed(total);
    },
    [recordChecksPassed],
  );

  const stepsDone =
    1 + Number(progress.exerciseDone) + Number(progress.checksPassed);
  const steps = [
    { key: "concept", label: copy.steps.concept, done: true, href: "#lesson-concept" },
    { key: "exercise", label: copy.steps.exercise, done: progress.exerciseDone, href: "#lesson-exercise" },
    { key: "checks", label: copy.steps.checks, done: progress.checksPassed, href: "#lesson-checks" },
  ] as const;

  return (
    <MotionProvider>
      <article
        data-lesson-engine
        data-lesson-id={lesson.id}
        data-lesson-complete={progress.completed ? "1" : "0"}
        className="mx-auto w-full max-w-4xl pb-8"
      >
        {/* Header */}
        <m.header {...REVEAL} className="lab-wash-sky -mx-1 rounded-3xl px-1 pb-6 pt-2 sm:px-2">
          <p className="text-label text-muted-foreground">
            {moduleLabel ? <span>{moduleLabel} · </span> : null}
            <span className="tabular-nums">
              {copy.lessonPosition(position.index, position.total)}
            </span>
          </p>
          <h1 className="mt-2 break-words text-fluid-h1 font-bold text-foreground">
            {lesson.title}
          </h1>
          {lesson.subtitle ? (
            <p className="mt-3 max-w-[60ch] text-lead text-muted-foreground">
              {lesson.subtitle}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <ProgressRing
              fraction={stepsDone / 3}
              size={44}
              stroke={4}
              tone={progress.completed ? "good" : "accent"}
              label={`${copy.stepsLabel}: ${stepsDone}/3`}
            >
              {stepsDone}/3
            </ProgressRing>
            <nav aria-label={copy.stepsLabel}>
              <ol className="flex flex-wrap gap-2">
                {steps.map((step, index) => (
                  <li key={step.key}>
                    <a
                      href={step.href}
                      className={cn(
                        "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent",
                        step.done
                          ? "border-lab-good/30 bg-lab-good-soft text-lab-good"
                          : "border-lab-line bg-card text-foreground hover:border-lab-accent/50",
                      )}
                    >
                      <span aria-hidden="true" className="tabular-nums">
                        {step.done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                      </span>
                      {step.label}
                      <span className="sr-only">
                        {" "}
                        ({step.done ? copy.stepState.done : copy.stepState.open})
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {copy.minutes(lesson.durationMinutes)}
            </span>
          </div>
        </m.header>

        {/* 1. Concept */}
        <m.section
          {...REVEAL}
          id="lesson-concept"
          aria-labelledby="lesson-concept-heading"
          className="mt-6 scroll-mt-28 rounded-3xl border border-lab-line bg-card p-5 shadow-lab sm:p-8"
        >
          <StepHeading
            index={1}
            id="lesson-concept-heading"
            icon={<BookOpen className="h-4 w-4" />}
            kicker={copy.conceptKicker}
            done
            doneLabel={copy.stepState.done}
          />
          <h2 id="lesson-concept-heading" className="sr-only">
            {copy.steps.concept}
          </h2>
          <div className="lesson-engine-concept text-body">
            <MarkdownRenderer content={lesson.concept.body} />
          </div>
          {lesson.concept.takeaway ? (
            <p className="lab-wash-acid mt-2 rounded-2xl border border-lab-line px-4 py-3 text-[17px] font-semibold leading-snug text-foreground">
              <span className="mb-1 block text-label text-muted-foreground">
                {copy.takeawayLabel}
              </span>
              {lesson.concept.takeaway}
            </p>
          ) : null}
          {lesson.concept.sources?.length ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-label text-muted-foreground">{copy.sourcesLabel}:</span>
              {lesson.concept.sources.map((source) =>
                source.url ? (
                  <a
                    key={source.label}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center rounded-full border border-lab-line bg-paper px-3 text-sm font-medium text-lab-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
                  >
                    {source.label}
                  </a>
                ) : (
                  <span
                    key={source.label}
                    className="inline-flex min-h-8 items-center rounded-full border border-lab-line bg-paper px-3 text-sm font-medium text-muted-foreground"
                  >
                    {source.label}
                  </span>
                ),
              )}
            </div>
          ) : null}
        </m.section>

        {/* 2. Exercise */}
        <m.section
          {...REVEAL}
          id="lesson-exercise"
          aria-labelledby="lesson-exercise-heading"
          data-exercise-kind={lesson.exercise.kind}
          className="mt-8 scroll-mt-28"
        >
          <StepHeading
            index={2}
            id="lesson-exercise-heading"
            icon={<FlaskConical className="h-4 w-4" />}
            kicker={copy.exerciseKicker}
            title={lesson.exercise.title}
            done={progress.exerciseDone}
            doneLabel={copy.exerciseDone}
          />
          <p className="mb-4 max-w-[65ch] text-body text-muted-foreground">
            {lesson.exercise.instructions}
          </p>
          <div className="lab-grid-paper rounded-3xl border border-lab-line bg-card p-3 shadow-lab-lg sm:p-6">
            <LabEmbedContext.Provider value={embedValue}>
              <RenderWidget
                kind={lesson.exercise.kind}
                props={exerciseProps}
                locale={locale}
              />
            </LabEmbedContext.Provider>
          </div>
        </m.section>

        {/* 3. Checks */}
        <m.section
          {...REVEAL}
          id="lesson-checks"
          aria-labelledby="lesson-checks-heading"
          className="mt-10 scroll-mt-28"
        >
          <StepHeading
            index={3}
            id="lesson-checks-heading"
            icon={<ListChecks className="h-4 w-4" />}
            kicker={copy.checksKicker}
            title={copy.steps.checks}
            done={progress.checksPassed}
            doneLabel={copy.checksPassed}
          />
          <p className="mb-4 text-sm text-muted-foreground">{copy.checksIntro}</p>
          <LessonChecks
            key={`${lesson.id}:${progress.hydrated ? "h" : "s"}`}
            checks={lesson.checks}
            copy={copy}
            passed={progress.checksPassed}
            interactive={interactive}
            onAllSolved={handleChecksSolved}
          />
        </m.section>

        {/* Completion */}
        <section
          aria-labelledby="lesson-status-heading"
          className={cn(
            "mt-10 rounded-3xl border p-5 shadow-lab sm:p-6",
            progress.completed
              ? "lab-wash-acid border-lab-good/30 bg-card"
              : "border-lab-line bg-card",
          )}
        >
          <div role="status" aria-live="polite" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <ProgressRing
                fraction={stepsDone / 3}
                size={56}
                tone={progress.completed ? "good" : "accent"}
                label={`${copy.stepsLabel}: ${stepsDone}/3`}
              >
                {progress.completed ? <Check className="h-5 w-5 text-lab-good" aria-hidden="true" /> : `${stepsDone}/3`}
              </ProgressRing>
              <div className="min-w-0">
                <h2 id="lesson-status-heading" className="text-lg font-bold text-foreground">
                  {progress.completed ? copy.completeTitle : copy.openTitle}
                </h2>
                {progress.completed ? (
                  <p className="mt-1 text-sm text-muted-foreground">{copy.completeBody}</p>
                ) : !progress.ownerReady && progress.hydrated ? (
                  <p className="mt-1 text-sm text-muted-foreground">{copy.ownerHint}</p>
                ) : (
                  <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                    {!progress.exerciseDone ? <li>· {copy.missingExercise}</li> : null}
                    {!progress.checksPassed ? <li>· {copy.missingChecks}</li> : null}
                  </ul>
                )}
              </div>
            </div>
            {next ? (
              next.kind === "link" ? (
                <Link
                  href={next.href}
                  data-lesson-next
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent focus-visible:ring-offset-2",
                    progress.completed
                      ? "bg-lab-accent text-paper shadow-lab-sm hover:bg-brand-cobalt/90"
                      : "border border-lab-line bg-card text-foreground hover:bg-lab-accent-soft",
                  )}
                >
                  {next.label}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <button
                  type="button"
                  data-lesson-next
                  onClick={next.onSelect}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent focus-visible:ring-offset-2",
                    progress.completed
                      ? "bg-lab-accent text-paper shadow-lab-sm hover:bg-brand-cobalt/90"
                      : "border border-lab-line bg-card text-foreground hover:bg-lab-accent-soft",
                  )}
                >
                  {next.label}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )
            ) : null}
          </div>
        </section>

        <p className="mt-6 text-xs leading-relaxed text-muted">{copy.legalNote}</p>
      </article>
    </MotionProvider>
  );
}

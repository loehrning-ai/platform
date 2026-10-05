"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import Link from "next/link";
import { m } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  ExternalLink,
  FlaskConical,
  Lightbulb,
  ListChecks,
  PartyPopper,
} from "lucide-react";
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
import { StepFlow } from "./step-flow";
import { CelebrationBurst } from "./celebration-burst";
import {
  APP_CARD,
  APP_EASE,
  APP_EYEBROW,
  APP_FOCUS,
  APP_PILL,
  APP_PRIMARY,
  APP_SECONDARY,
} from "./app-ui";
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
  transition: { duration: 0.5, ease: APP_EASE },
} as const;

const SECTION_IDS = {
  concept: "lesson-concept",
  exercise: "lesson-exercise",
  checks: "lesson-checks",
} as const;
type StepKey = keyof typeof SECTION_IDS;

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
    <div className="mb-4 flex items-center gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold shadow-lab-sm transition-colors duration-300 motion-reduce:transition-none",
          done ? "bg-lab-good text-paper" : "bg-card text-lab-accent ring-1 ring-lab-line",
        )}
      >
        {done ? <Check className="h-5 w-5" strokeWidth={2.75} /> : icon}
      </span>
      <div className="min-w-0">
        <p className={APP_EYEBROW}>
          <span className="sr-only">{index}. </span>
          {kicker}
          {done ? <span className="sr-only"> ({doneLabel})</span> : null}
        </p>
        {title ? (
          <h2 id={id} className="mt-0.5 break-words text-xl font-bold leading-tight tracking-[-0.015em] text-foreground sm:text-2xl">
            {title}
          </h2>
        ) : null}
      </div>
    </div>
  );
}

/** The section in view drives the step indicator (visual only). */
function useActiveStep(): StepKey {
  const [active, setActive] = useState<StepKey>("concept");
  useEffect(() => {
    if (typeof IntersectionObserver !== "function") return;
    const entries = (Object.keys(SECTION_IDS) as StepKey[])
      .map((key) => [key, document.getElementById(SECTION_IDS[key])] as const)
      .filter((entry): entry is readonly [StepKey, HTMLElement] => entry[1] !== null);
    const observer = new IntersectionObserver(
      (records) => {
        const visible = records.filter((record) => record.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const match = entries.find(([, element]) => element === top.target);
        if (match) setActive(match[0]);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 },
    );
    for (const [, element] of entries) observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return active;
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
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (!progress.hydrated) return;
    if (completedBefore.current === null) {
      completedBefore.current = progress.completed;
    } else if (!completedBefore.current && progress.completed) {
      completedBefore.current = true;
      setJustCompleted(true);
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

  const activeStep = useActiveStep();
  const stepsDone =
    1 + Number(progress.exerciseDone) + Number(progress.checksPassed);
  const steps = [
    { key: "concept", label: copy.steps.concept, done: true, href: `#${SECTION_IDS.concept}`, icon: <BookOpen className="h-5 w-5" /> },
    { key: "exercise", label: copy.steps.exercise, done: progress.exerciseDone, href: `#${SECTION_IDS.exercise}`, icon: <FlaskConical className="h-5 w-5" /> },
    { key: "checks", label: copy.steps.checks, done: progress.checksPassed, href: `#${SECTION_IDS.checks}`, icon: <ListChecks className="h-5 w-5" /> },
  ] as const;

  const nextClass = cn(
    "w-full sm:w-auto",
    progress.completed ? APP_PRIMARY : APP_SECONDARY,
  );

  return (
    <MotionProvider>
      <article
        data-lesson-engine
        data-lesson-id={lesson.id}
        data-lesson-complete={progress.completed ? "1" : "0"}
        className="mx-auto w-full max-w-3xl pb-8"
      >
        {/* Header */}
        <m.header
          {...REVEAL}
          className="course-app-hero relative overflow-hidden rounded-[28px] border border-lab-line/80 px-5 pb-5 pt-6 shadow-lab sm:px-8 sm:pb-7 sm:pt-8"
        >
          <div className="flex flex-wrap items-center gap-2">
            {moduleLabel ? (
              <span className={cn(APP_PILL, "max-w-full text-foreground")}>
                <span className="truncate">{moduleLabel}</span>
              </span>
            ) : null}
            <span className={cn(APP_PILL, "tabular-nums")}>
              {copy.lessonPosition(position.index, position.total)}
            </span>
            <span className={APP_PILL}>
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.minutes(lesson.durationMinutes)}
            </span>
          </div>
          <h1 className="mt-4 break-words text-[2rem] font-bold leading-[1.08] tracking-[-0.025em] text-foreground sm:text-fluid-h1">
            {lesson.title}
          </h1>
          {lesson.subtitle ? (
            <p className="mt-3 max-w-[60ch] text-[17px] leading-relaxed text-muted-foreground sm:text-lead">
              {lesson.subtitle}
            </p>
          ) : null}
          <div className="mt-6 rounded-[22px] bg-paper/75 px-2 pb-2 pt-3 ring-1 ring-lab-line/80 sm:px-4">
            <StepFlow
              steps={steps}
              activeKey={activeStep}
              label={copy.stepsLabel}
              stateLabel={copy.stepState}
            />
          </div>
        </m.header>

        {/* 1. Concept */}
        <m.section
          {...REVEAL}
          id={SECTION_IDS.concept}
          aria-labelledby="lesson-concept-heading"
          className="mt-8 scroll-mt-32"
        >
          <StepHeading
            index={1}
            id="lesson-concept-heading"
            icon={<BookOpen className="h-5 w-5" />}
            kicker={copy.conceptKicker}
            done
            doneLabel={copy.stepState.done}
          />
          <h2 id="lesson-concept-heading" className="sr-only">
            {copy.steps.concept}
          </h2>
          <div className={cn(APP_CARD, "p-5 sm:p-8")}>
            <div className="lesson-engine-concept text-body">
              <MarkdownRenderer content={lesson.concept.body} />
            </div>
            {lesson.concept.takeaway ? (
              <div className="lab-wash-acid mt-3 flex gap-3 rounded-[20px] bg-paper px-4 py-4 ring-1 ring-lab-line sm:px-5">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-lab-good shadow-lab-sm"
                >
                  <Lightbulb className="h-[18px] w-[18px]" />
                </span>
                <p className="min-w-0 text-[17px] font-semibold leading-snug text-foreground">
                  <span className="mb-0.5 block text-sm font-semibold text-lab-good">
                    {copy.takeawayLabel}
                  </span>
                  {lesson.concept.takeaway}
                </p>
              </div>
            ) : null}
            {lesson.concept.sources?.length ? (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground">{copy.sourcesLabel}:</span>
                {lesson.concept.sources.map((source) =>
                  source.url ? (
                    <a
                      key={source.label}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex min-h-11 items-center gap-1.5 rounded-full bg-lab-accent-soft px-4 text-sm font-semibold text-lab-accent transition-[background-color] duration-150 hover:bg-[#d8e0f5] motion-reduce:transition-none",
                        APP_FOCUS,
                      )}
                    >
                      {source.label}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  ) : (
                    <span
                      key={source.label}
                      className="inline-flex min-h-8 items-center rounded-full bg-paper px-3 text-sm font-medium text-muted-foreground ring-1 ring-lab-line"
                    >
                      {source.label}
                    </span>
                  ),
                )}
              </div>
            ) : null}
          </div>
        </m.section>

        {/* 2. Exercise */}
        <m.section
          {...REVEAL}
          id={SECTION_IDS.exercise}
          aria-labelledby="lesson-exercise-heading"
          data-exercise-kind={lesson.exercise.kind}
          className="mt-10 scroll-mt-32"
        >
          <StepHeading
            index={2}
            id="lesson-exercise-heading"
            icon={<FlaskConical className="h-5 w-5" />}
            kicker={copy.exerciseKicker}
            title={lesson.exercise.title}
            done={progress.exerciseDone}
            doneLabel={copy.exerciseDone}
          />
          <p className="mb-4 max-w-[65ch] text-body text-muted-foreground">
            {lesson.exercise.instructions}
          </p>
          <div className="lab-grid-paper -mx-1 rounded-[26px] border border-lab-line/80 bg-card p-2.5 shadow-lab-lg sm:mx-0 sm:p-6">
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
          id={SECTION_IDS.checks}
          aria-labelledby="lesson-checks-heading"
          className="mt-10 scroll-mt-32"
        >
          <StepHeading
            index={3}
            id="lesson-checks-heading"
            icon={<ListChecks className="h-5 w-5" />}
            kicker={copy.checksKicker}
            title={copy.steps.checks}
            done={progress.checksPassed}
            doneLabel={copy.checksPassed}
          />
          <p className="mb-4 text-[15px] text-muted-foreground">{copy.checksIntro}</p>
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
          data-lesson-status={progress.completed ? "complete" : "open"}
          className={cn(
            "relative mt-10 overflow-hidden rounded-[28px] border p-5 shadow-lab sm:p-7",
            progress.completed
              ? "course-app-hero border-lab-good/30"
              : "border-lab-line/80 bg-card",
          )}
        >
          <div role="status" aria-live="polite" className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="relative inline-flex">
                <ProgressRing
                  fraction={stepsDone / 3}
                  size={64}
                  stroke={6}
                  tone={progress.completed ? "good" : "accent"}
                  label={`${copy.stepsLabel}: ${stepsDone}/3`}
                >
                  {progress.completed ? (
                    <m.span
                      initial={justCompleted ? { scale: 0.3, opacity: 0 } : false}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.15 }}
                      className="flex"
                    >
                      <PartyPopper className="h-6 w-6 text-lab-good" aria-hidden="true" />
                    </m.span>
                  ) : (
                    `${stepsDone}/3`
                  )}
                </ProgressRing>
                <CelebrationBurst play={justCompleted} />
              </span>
              <div className="min-w-0">
                <h2 id="lesson-status-heading" className="text-xl font-bold tracking-[-0.01em] text-foreground">
                  {progress.completed ? copy.completeTitle : copy.openTitle}
                </h2>
                {progress.completed ? (
                  <p className="mt-1 text-[15px] text-muted-foreground">{copy.completeBody}</p>
                ) : !progress.ownerReady && progress.hydrated ? (
                  <p className="mt-1 text-[15px] text-muted-foreground">{copy.ownerHint}</p>
                ) : (
                  <ul className="mt-2 space-y-1.5 text-[15px] text-muted-foreground">
                    {!progress.exerciseDone ? (
                      <li className="flex items-center gap-2">
                        <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-lab-accent" />
                        {copy.missingExercise}
                      </li>
                    ) : null}
                    {!progress.checksPassed ? (
                      <li className="flex items-center gap-2">
                        <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-lab-accent" />
                        {copy.missingChecks}
                      </li>
                    ) : null}
                  </ul>
                )}
              </div>
            </div>
            {next ? (
              next.kind === "link" ? (
                <Link href={next.href} data-lesson-next className={nextClass}>
                  <span className="min-w-0 truncate">{next.label}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              ) : (
                <button
                  type="button"
                  data-lesson-next
                  onClick={next.onSelect}
                  className={nextClass}
                >
                  <span className="min-w-0 truncate">{next.label}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
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

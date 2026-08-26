"use client";

import { useEffect, useMemo, useState, type JSX } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, GraduationCap } from "lucide-react";
import {
  RenderWidget,
  resolveWidgetsForSlot,
} from "@/components/widgets/registry";
import { LessonProofCheckpoint } from "@/components/course/lesson-proof-checkpoint";
import { PathwayStageBanner } from "@/components/course/pathway-stage-banner";
import {
  isEvidenceBackedLessonCompleted,
  isCheckpointDone,
  recordLessonCompletionEvidenceDurably,
  subscribe,
} from "@/lib/progress";
import { getLearningOwnerContext } from "@/lib/progress/browser-learning-storage";
import {
  getOwnerRequiredHint,
  useLearningOwnerStateKey,
  useOwnerAwareProgressReadiness,
} from "@/components/course/owner-aware-progress";
import { getAiNativeOperatorCourseCopy } from "@/lib/ai-native-operator/course-copy";
import { OPERATOR_TRANSFER_CHECKPOINT_ID } from "@/lib/courses/completion";
import { getModuleMeta } from "@/lib/ai-native-operator/types";
import { courseHref } from "@/lib/ai-native-operator/routes";
import { Callout } from "./callout";
import type { AiNativeOperatorLesson } from "@/lib/ai-native-operator/types";
import type { LearningStage } from "@/lib/learning-graph/types";
import type { NextTarget } from "./lesson-page";
import type { Locale } from "@/lib/i18n/locale";

interface AiNativeOperatorLessonReaderProps {
  readonly locale?: Locale;
  readonly lesson: AiNativeOperatorLesson;
  readonly prevHref: string | null;
  readonly prevTitle: string | null;
  readonly next: NextTarget;
}

/**
 * Where this course sits on the six-stage path, mirroring the module-private
 * `COURSE_NODE_META["ai-native-operator"]` in `@/lib/learning-graph/data`.
 * Restated rather than looked up in `LEARNING_NODES`, which would pull the
 * whole graph (books, demos, workshops) into this client bundle.
 */
const COURSE_STAGE: LearningStage = "anwenden";

/**
 * LessonCompletionCheckpoint — owns the reader's progress-readiness state.
 *
 * This is deliberately a separate component. The store subscription flips
 * `readyLessonId` from null to the current lesson right after hydration, and
 * that is a real state change rather than a no-op bail-out. Keeping it in the
 * reader would re-render the reader's `<article>`, whose widgets render inside
 * a `React.lazy` Suspense boundary; re-rendering a boundary that has not
 * finished hydrating leaves the server markup in place and mounts a second
 * client copy, so the lesson's exercise prompt appears twice (reproduced on
 * Chromium). Scoping the state here keeps that re-render to the button alone.
 *
 * The server and first client render both take the "not ready" branch, so the
 * control is disabled and `aria-busy` in the server markup and hydrates
 * without a mismatch.
 */
function LessonCompletionCheckpoint({
  locale,
  lesson,
}: {
  readonly locale: Locale;
  readonly lesson: AiNativeOperatorLesson;
}): JSX.Element {
  const [completed, setCompleted] = useState(false);
  const [evidenceReady, setEvidenceReady] = useState(false);
  const [readyLessonId, setReadyLessonId] = useState<string | null>(null);
  const [loadedOwnerGeneration, setLoadedOwnerGeneration] = useState<
    number | null
  >(null);
  const identity = `ai-native-operator:${lesson.id}`;

  useEffect(() => {
    setCompleted(false);
    setEvidenceReady(false);
    setReadyLessonId(null);
    setLoadedOwnerGeneration(null);

    return subscribe(() => {
      const owner = getLearningOwnerContext();
      const resolved = owner.kind !== "unknown";
      setCompleted(
        resolved &&
          isEvidenceBackedLessonCompleted("ai-native-operator", lesson.id),
      );
      setEvidenceReady(
        lesson.kind === "quiz"
          ? lesson.quiz.every((question) =>
              isCheckpointDone(lesson.id, question.id),
            )
          : isCheckpointDone(lesson.id, OPERATOR_TRANSFER_CHECKPOINT_ID),
      );
      setLoadedOwnerGeneration(owner.generation);
      setReadyLessonId(lesson.id);
    });
  }, [lesson]);

  const readiness = useOwnerAwareProgressReadiness(
    identity,
    readyLessonId === lesson.id ? identity : null,
    loadedOwnerGeneration,
  );
  const lessonCompleted = readiness.interactionReady && completed;
  return (
    <LessonProofCheckpoint
      key={readiness.checkpointKey}
      locale={locale}
      completed={lessonCompleted}
      progressReady={readiness.hydrated}
      prerequisitesMet={readiness.ownerReady && evidenceReady}
      prerequisiteHint={
        !readiness.ownerReady
          ? getOwnerRequiredHint(locale)
          : lesson.kind === "quiz"
            ? locale === "de"
              ? "Beantworte zuerst jede Frage richtig."
              : "Answer every question correctly first."
            : locale === "de"
              ? "Schließe zuerst die Transferübung ab."
              : "Complete the transfer exercise first."
      }
      onCommit={() => {
        if (
          recordLessonCompletionEvidenceDurably("ai-native-operator", lesson.id)
        ) {
          setCompleted(true);
        }
      }}
    />
  );
}

/**
 * AiNativeOperatorLessonReader — bespoke content renderer for the
 * AI-Native Operator course, mirroring
 * ClaudeLessonReader/CodexLessonReader's precedent of a course-owned
 * reader rather than reusing `LessonContent` (German-hardcoded chrome).
 * Widgets render through the shared, kind-agnostic registry.
 *
 * `kind: "quiz"` lessons (the 9 module knowledge-checks) render their
 * questions as stacked "quiz" TIER_A widgets built from `lesson.quiz`
 * directly, mirroring claude's own convention of representing every
 * knowledge-check question as an individual quiz-widget instance — the
 * same reused kind, never a bespoke multi-question renderer.
 */
export function AiNativeOperatorLessonReader({
  locale = "en",
  lesson,
  prevHref,
  prevTitle,
  next,
}: AiNativeOperatorLessonReaderProps): JSX.Element {
  const meta = getModuleMeta(lesson.moduleId, locale);
  const courseCopy = getAiNativeOperatorCourseCopy(locale).lesson;
  const widgets = useMemo(() => lesson.widgets ?? [], [lesson.widgets]);
  const endWidgets = useMemo(
    () => resolveWidgetsForSlot(widgets, "end"),
    [widgets],
  );
  const ownerStateKey = useLearningOwnerStateKey(
    `ai-native-operator:${lesson.id}`,
  );

  const nextIcon =
    next.kind === "final-assessment" ? (
      <GraduationCap className="h-4 w-4" aria-hidden="true" />
    ) : (
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    );

  return (
    <div key={ownerStateKey} className="min-w-0 overflow-x-clip">
      <header className="mb-6 border-b border-border pb-5">
        <div className="font-mono text-[12px] text-muted-foreground">
          <Link
            href={courseHref(locale)}
            className="inline-flex min-h-11 min-w-11 items-center hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {courseCopy.course}
          </Link>
          <span className="mx-1.5" aria-hidden="true">
            /
          </span>
          {meta.name}
        </div>
        <p className="mt-2 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-brand-orange">
          {courseCopy.lessonLabel(
            meta.code.replace("M0", ""),
            lesson.lessonNumber,
          )}
        </p>
        <h1 className="mt-1 break-words text-[28px] font-bold tracking-[-0.03em] text-foreground md:text-[34px]">
          {lesson.title}
        </h1>
        <p className="mt-2 max-w-[68ch] break-words text-[16px] leading-[1.55] text-muted-foreground">
          {lesson.objective}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[12px] uppercase tracking-[0.06em] text-muted-foreground">
          <span>
            {lesson.kind === "quiz"
              ? courseCopy.knowledgeCheck
              : courseCopy.reading}
          </span>
          <span aria-hidden="true">·</span>
          <span>{courseCopy.minutes(lesson.durationMinutes)}</span>
        </div>
      </header>

      <PathwayStageBanner
        stage={COURSE_STAGE}
        locale={locale}
        className="mb-6"
      />

      {lesson.kind === "quiz" ? (
        <div className="flex flex-col gap-5">
          <p className="max-w-[68ch] break-words text-[14px] leading-relaxed text-muted-foreground">
            {courseCopy.quizIntro}
          </p>
          {lesson.quiz.map((question) => {
            const correctIndex = question.answerOptions.findIndex(
              (o) => o.isCorrect,
            );
            return (
              <RenderWidget
                key={question.id}
                kind="quiz"
                locale={locale}
                props={{
                  lessonId: lesson.id,
                  cpId: question.id,
                  question: question.questionText,
                  options: question.answerOptions.map((o) => o.text),
                  correct: correctIndex,
                  explanation: question.explanation,
                  copy: {
                    kindLabel: courseCopy.check,
                    optionsAriaLabel: courseCopy.answerOptions,
                    correctLabel: courseCopy.correct,
                    incorrectLabel: courseCopy.incorrect,
                  },
                  title: courseCopy.quickCheck,
                }}
              />
            );
          })}
        </div>
      ) : (
        <article className="space-y-6">
          {/*
            The measure cap belongs on each prose section, not on the
            <article>: the callout's spec listing and the end widgets below
            keep the shell's full column for their tables and diagrams.
          */}
          {lesson.sections.map((section) => (
            <section key={section.id} className="max-w-[68ch]">
              <h2 className="break-words text-[19px] font-semibold text-foreground">
                {section.title}
              </h2>
              <p className="mt-2 break-words text-[15px] leading-[1.65] text-foreground">
                {section.content}
              </p>
            </section>
          ))}
          {lesson.callout && <Callout c={lesson.callout} />}
          {endWidgets.map((widget, i) => (
            <div key={i} data-widget-kind={widget.kind} className="mt-6">
              <RenderWidget
                kind={widget.kind}
                props={widget.props ?? {}}
                locale={locale}
              />
            </div>
          ))}
        </article>
      )}

      <div className="mt-6 border-t border-border pt-5">
        <LessonCompletionCheckpoint locale={locale} lesson={lesson} />
      </div>

      <nav
        aria-label={locale === "de" ? "Lektionsroute" : "Lesson route"}
        className="mt-4 flex min-w-0 flex-wrap items-center justify-between gap-3"
      >
        {prevHref ? (
          <Link
            href={prevHref}
            className="inline-flex min-h-11 min-w-0 max-w-full items-center gap-1.5 break-words border-b border-border text-[13px] text-muted-foreground transition-colors hover:border-brand-orange hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {prevTitle ?? courseCopy.previous}
          </Link>
        ) : (
          <div />
        )}
        <Link
          href={next.href}
          className="inline-flex min-h-11 max-w-full items-center gap-2 break-words border border-foreground bg-brand-orange px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-foreground"
        >
          {next.label}
          {nextIcon}
        </Link>
      </nav>
    </div>
  );
}

export default AiNativeOperatorLessonReader;

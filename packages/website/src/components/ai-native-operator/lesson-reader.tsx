"use client";

import { useEffect, useMemo, useState, type JSX } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, GraduationCap } from "lucide-react";
import { RenderWidget, resolveWidgetsForSlot } from "@/components/widgets/registry";
import {
  isCheckpointDone,
  isLessonCompleted,
  markLessonCompleted,
  subscribe,
} from "@/lib/progress";
import { MODULE_META } from "@/lib/ai-native-operator/types";
import { courseHref } from "@/lib/ai-native-operator/routes";
import { Callout } from "./callout";
import type { AiNativeOperatorLesson } from "@/lib/ai-native-operator/types";
import type { NextTarget } from "./lesson-page";

interface AiNativeOperatorLessonReaderProps {
  readonly lesson: AiNativeOperatorLesson;
  readonly prevHref: string | null;
  readonly prevTitle: string | null;
  readonly next: NextTarget;
}

/**
 * LessonCompletionButton — owns the reader's progress-readiness state.
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
function LessonCompletionButton({
  lesson,
}: {
  readonly lesson: AiNativeOperatorLesson;
}): JSX.Element {
  const [completed, setCompleted] = useState(false);
  const [quizReady, setQuizReady] = useState(lesson.kind !== "quiz");
  const [readyLessonId, setReadyLessonId] = useState<string | null>(null);

  useEffect(
    () =>
      subscribe(() => {
        setCompleted(isLessonCompleted("ai-native-operator", lesson.id));
        setQuizReady(
          lesson.kind !== "quiz" ||
            lesson.quiz.every((question) =>
              isCheckpointDone(lesson.id, question.id),
            ),
        );
        setReadyLessonId(lesson.id);
      }),
    [lesson],
  );

  const progressReady = readyLessonId === lesson.id;
  const lessonCompleted = progressReady && completed;
  const canCompleteLesson = progressReady && quizReady;

  return (
    <button
      type="button"
      onClick={() => markLessonCompleted("ai-native-operator", lesson.id)}
      disabled={lessonCompleted || !canCompleteLesson}
      aria-busy={!progressReady || undefined}
      aria-pressed={lessonCompleted}
      className="inline-flex min-h-11 items-center border-2 border-foreground px-5 text-[12px] font-bold uppercase tracking-wide text-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {!progressReady
        ? "Loading progress"
        : lessonCompleted
          ? "Lesson completed"
          : canCompleteLesson
            ? "Complete lesson"
            : "Answer every question correctly first"}
    </button>
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
  lesson,
  prevHref,
  prevTitle,
  next,
}: AiNativeOperatorLessonReaderProps): JSX.Element {
  const meta = MODULE_META[lesson.moduleId];
  const widgets = useMemo(() => lesson.widgets ?? [], [lesson.widgets]);
  const endWidgets = useMemo(() => resolveWidgetsForSlot(widgets, "end"), [widgets]);

  const nextIcon =
    next.kind === "final-assessment" ? (
      <GraduationCap className="h-4 w-4" aria-hidden="true" />
    ) : (
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    );

  return (
    <div>
      <header className="mb-8">
        <div className="font-mono text-[11px] text-muted-foreground">
          <Link href={courseHref()} className="hover:text-foreground">
            Course
          </Link>
          <span className="mx-1.5" aria-hidden="true">
            /
          </span>
          {meta.name}
        </div>
        <p className="mt-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
          Lesson {meta.code.replace("M0", "")}.{lesson.lessonNumber}
        </p>
        <h1 className="mt-1 text-[28px] font-bold tracking-[-0.03em] text-foreground md:text-[34px]">
          {lesson.title}
        </h1>
        <p className="mt-2 max-w-[640px] text-[16px] leading-[1.5] text-muted-foreground">
          {lesson.objective}
        </p>
        <div className="mt-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
          <span>{lesson.kind === "quiz" ? "Knowledge check" : "Reading"}</span>
          <span aria-hidden="true">·</span>
          <span>{lesson.durationMinutes} min</span>
        </div>
      </header>

      {lesson.kind === "quiz" ? (
        <div className="flex flex-col gap-6">
          <p className="text-[14px] text-muted-foreground">
            Pick the best answer for each question. Your answers here are local to this device.
          </p>
          {lesson.quiz.map((question) => {
            const correctIndex = question.answerOptions.findIndex((o) => o.isCorrect);
            return (
              <RenderWidget
                key={question.id}
                kind="quiz"
                props={{
                  lessonId: lesson.id,
                  cpId: question.id,
                  question: question.questionText,
                  options: question.answerOptions.map((o) => o.text),
                  correct: correctIndex,
                  explanation: question.explanation,
                  copy: {
                    kindLabel: "Check",
                    optionsAriaLabel: "Answer options",
                    correctLabel: "Correct.",
                    incorrectLabel: "Not quite.",
                  },
                  title: "Quick Check",
                }}
              />
            );
          })}
        </div>
      ) : (
        <article className="space-y-8">
          {lesson.sections.map((section) => (
            <section key={section.id}>
              <h2 className="text-[19px] font-semibold text-foreground">{section.title}</h2>
              <p className="mt-2 text-[15px] leading-[1.65] text-foreground">{section.content}</p>
            </section>
          ))}
          {lesson.callout && <Callout c={lesson.callout} />}
          {endWidgets.map((widget, i) => (
            <div key={i} data-widget-kind={widget.kind} className="mt-6">
              <RenderWidget kind={widget.kind} props={widget.props ?? {}} />
            </div>
          ))}
        </article>
      )}

      <div className="mt-10 border-t border-border pt-6">
        <LessonCompletionButton lesson={lesson} />
      </div>

      <nav className="mt-6 flex items-center justify-between gap-4">
        {prevHref ? (
          <Link
            href={prevHref}
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {prevTitle ?? "Previous"}
          </Link>
        ) : (
          <div />
        )}
        <Link
          href={next.href}
          className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
        >
          {next.label}
          {nextIcon}
        </Link>
      </nav>
    </div>
  );
}

export default AiNativeOperatorLessonReader;

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, RotateCcw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LessonQuizQuestion } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n/locale";
import { getCourseReaderCopy } from "./course-ui-copy";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const SLIDE = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

interface LessonQuizProps {
  readonly questions: readonly LessonQuizQuestion[];
  readonly bestScore: { score: number; total: number } | null;
  readonly onComplete: (score: number, total: number) => void;
  readonly locale?: Locale;
}

export function LessonQuiz({
  questions,
  bestScore,
  onComplete,
  locale = "de",
}: LessonQuizProps) {
  const copy = getCourseReaderCopy(locale).quiz;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<(string | null)[]>(
    new Array(questions.length).fill(null),
  );
  const [finished, setFinished] = useState(false);
  const [direction, setDirection] = useState(1);

  // 7b: aria-live feedback region (present on mount, populated on selection)
  const feedbackRef = useRef<HTMLDivElement>(null);
  // 7g: focus restoration to score screen on completion
  const scoreRef = useRef<HTMLDivElement>(null);

  const question = questions[currentIndex];

  const handleSelect = useCallback(
    (optionId: string, optionIndex: number) => {
      if (showExplanation) return;
      setSelectedId(optionId);
      setFocusedIndex(optionIndex);
      setShowExplanation(true);
      const next = [...answers];
      next[currentIndex] = optionId;
      setAnswers(next);

      // 7b: Announce feedback to screen readers via the live region
      const correctOption = questions[currentIndex].answerOptions.find(
        (o) => o.isCorrect,
      );
      const isCorrect = optionId === correctOption?.id;
      const explanation = questions[currentIndex].explanation;
      if (feedbackRef.current) {
        feedbackRef.current.textContent = isCorrect
          ? copy.correctFeedback(explanation)
          : copy.incorrectFeedback(explanation);
      }
    },
    [showExplanation, answers, copy, currentIndex, questions],
  );

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
      setSelectedId(null);
      setFocusedIndex(0);
      setShowExplanation(false);
      // Clear feedback region for next question
      if (feedbackRef.current) {
        feedbackRef.current.textContent = "";
      }
    } else {
      const score = answers.reduce((sum, answerId, i) => {
        const correct = questions[i].answerOptions.find((o) => o.isCorrect);
        return sum + (answerId === correct?.id ? 1 : 0);
      }, 0);
      setFinished(true);
      onComplete(score, questions.length);
    }
  }, [currentIndex, questions, answers, onComplete]);

  const handleRetry = useCallback(() => {
    setCurrentIndex(0);
    setSelectedId(null);
    setFocusedIndex(0);
    setShowExplanation(false);
    setAnswers(new Array(questions.length).fill(null));
    setFinished(false);
    setDirection(-1);
    if (feedbackRef.current) {
      feedbackRef.current.textContent = "";
    }
  }, [questions.length]);

  // 7a: Roving tabindex for radiogroup — arrow key navigation
  const handleRadioKeyDown = useCallback(
    (e: React.KeyboardEvent, optionIndex: number, optionId: string) => {
      const options = question.answerOptions;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const next = (optionIndex + 1) % options.length;
        setFocusedIndex(next);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = (optionIndex - 1 + options.length) % options.length;
        setFocusedIndex(prev);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleSelect(optionId, optionIndex);
      }
    },
    [question, handleSelect],
  );

  // 7g: When finished state mounts, move focus to score element and announce result
  useEffect(() => {
    if (finished && scoreRef.current) {
      scoreRef.current.focus();
    }
  }, [finished]);

  useEffect(() => {
    if (finished && feedbackRef.current) {
      const score = answers.reduce((sum, answerId, i) => {
        const correct = questions[i].answerOptions.find((o) => o.isCorrect);
        return sum + (answerId === correct?.id ? 1 : 0);
      }, 0);
      feedbackRef.current.textContent = copy.completionAnnouncement(
        score,
        questions.length,
      );
    }
  }, [finished, answers, copy, questions]);

  if (questions.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        {copy.empty}
      </div>
    );
  }

  if (finished) {
    const score = answers.reduce((sum, answerId, i) => {
      const correct = questions[i].answerOptions.find((o) => o.isCorrect);
      return sum + (answerId === correct?.id ? 1 : 0);
    }, 0);
    const pct = Math.round((score / questions.length) * 100);

    return (
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
        className="py-8 text-center"
      >
        {/* 7b: aria-live feedback region (present in DOM from mount) */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          ref={feedbackRef}
        />
        {/* 7g: score element receives focus on mount for keyboard/SR users */}
        <div
          ref={scoreRef}
          tabIndex={-1}
          className={cn(
            "font-mono text-5xl font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
            pct === 100
              ? "text-brand-sand"
              : pct >= 50
                ? "text-brand-orange"
                : "text-destructive",
          )}
        >
          {pct}%
        </div>
        <p className="mt-2 text-lg font-semibold">
          {copy.score(score, questions.length)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {pct === 100
            ? copy.perfect
            : pct >= 50
              ? copy.partial
              : copy.retryLesson}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex min-h-11 items-center gap-2 border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-card"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {copy.retry}
          </button>
        </div>
      </m.div>
    );
  }

  const correctOption = question.answerOptions.find((o) => o.isCorrect);
  const isCorrectAnswer = selectedId === correctOption?.id;

  return (
    <div>
      {/* 7b: aria-live feedback region (present in DOM from mount, empty until selection) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        ref={feedbackRef}
      />
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">
          {copy.progress(currentIndex + 1, questions.length)}
        </span>
        {bestScore && (
          <span className="font-mono text-xs text-muted-foreground">
            {copy.previousBest(bestScore.score, bestScore.total)}
          </span>
        )}
      </div>
      <div className="mb-6 h-1 overflow-hidden bg-border">
        <div
          className="h-full bg-brand-orange transition-[width,background-color] duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <m.div
          key={currentIndex}
          custom={direction}
          variants={SLIDE}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
        >
          {/* 7a: question text as labelledby target */}
          <h3
            id={`quiz-question-${currentIndex}`}
            className="mb-5 text-base font-semibold leading-snug"
          >
            {question.questionText}
          </h3>

          {/* 7a: radiogroup with roving tabindex and ARIA roles */}
          <div
            role="radiogroup"
            aria-labelledby={`quiz-question-${currentIndex}`}
            className="space-y-2"
          >
            {question.answerOptions.map((option, i) => {
              const isSelected = selectedId === option.id;
              const isCorrect = option.isCorrect;
              const isFocused = focusedIndex === i;
              let optionClass =
                "border-border bg-card hover:border-brand-orange/30";
              if (showExplanation) {
                if (isCorrect)
                  optionClass = "border-brand-sand bg-brand-sand/5";
                else if (isSelected)
                  optionClass = "border-destructive/50 bg-destructive/5";
                else optionClass = "border-border bg-card opacity-50";
              }
              return (
                <div
                  key={option.id}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={isFocused && !showExplanation ? 0 : -1}
                  onClick={() => !showExplanation && handleSelect(option.id, i)}
                  onKeyDown={(e) =>
                    !showExplanation && handleRadioKeyDown(e, i, option.id)
                  }
                  aria-disabled={showExplanation}
                  className={cn(
                    "flex min-h-11 w-full cursor-pointer items-center gap-3 border px-4 py-3 text-left text-sm transition-[background-color,border-color,color,opacity]",
                    optionClass,
                    showExplanation && "cursor-default",
                  )}
                >
                  <span className="shrink-0 font-mono text-xs font-bold uppercase text-muted-foreground">
                    {option.id}
                  </span>
                  <span className="min-w-0 flex-1 break-words">
                    {option.text}
                  </span>
                  {showExplanation && isCorrect && (
                    <span className="sr-only">{copy.correctAnswer}</span>
                  )}
                  {showExplanation && isCorrect && (
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-brand-sand"
                      aria-hidden="true"
                    />
                  )}
                  {showExplanation && isSelected && !isCorrect && (
                    <>
                      <span className="sr-only">{copy.incorrectSelection}</span>
                      <XCircle
                        className="h-4 w-4 shrink-0 text-destructive"
                        aria-hidden="true"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {showExplanation && (
            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
              className={cn(
                "mt-4 border-l-2 px-4 py-3",
                isCorrectAnswer
                  ? "border-brand-sand bg-brand-sand/5"
                  : "border-destructive/50 bg-destructive/5",
              )}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {isCorrectAnswer ? copy.correct : copy.incorrect}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {question.explanation}
              </p>
            </m.div>
          )}

          {showExplanation && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-5"
            >
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex min-h-11 items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-foreground hover:text-background"
              >
                {currentIndex < questions.length - 1 ? copy.next : copy.result}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </m.div>
          )}
        </m.div>
      </AnimatePresence>
    </div>
  );
}

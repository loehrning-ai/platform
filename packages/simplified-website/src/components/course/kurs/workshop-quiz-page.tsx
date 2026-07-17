"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
// Config comes from the JSON-free config module; the question JSON itself is
// loaded per course via dynamic import on mount (performance hardening) so the
// quiz routes don't bundle every course's content up front.
import {
  getCourseConfig,
  getWorkshopPassThreshold,
  getWorkshopQuestionCount,
  getWorkshopTimeLimitMinutes,
} from "@/lib/course/config";
import { loadWorkshopQuestions } from "@/lib/course/questions";
import { saveWorkshopQuizResult } from "@/lib/course/progress";
import type { CourseSlug, QuizQuestion } from "@/lib/course/types";

/**
 * Shared workshop-quiz screen for every free course (shared course architecture,
 *). The route pages are thin wrappers that pass a
 * `courseSlug`; all course-specific copy + thresholds come from `CourseConfig`.
 */

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const SLIDE = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

/**
 * Fisher-Yates shuffle. Accepts an optional numeric `seed` for deterministic
 * output (used in tests). In production, pass no seed (uses Math.random).
 * A well-mixed seeded PRNG (mulberry32) is used when a seed is provided so the
 * function stays dependency-free and decorrelates sequential seeds.
 */
export function shuffleArray<T>(arr: readonly T[], seed?: number): T[] {
  const shuffled = [...arr];
  // Simple LCG PRNG when a seed is supplied
  let rng: () => number;
  if (seed !== undefined) {
    // mulberry32: a well-mixed seeded PRNG. A plain LCG leaves the first output
    // near-linear in the seed, which concentrates the first Fisher-Yates swap and
    // biases the correct-answer position for sequential seeds (1, 2, 3, ...).
    let s = seed >>> 0;
    rng = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
    };
  } else {
    rng = Math.random;
  }
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface WorkshopQuizPageProps {
  readonly courseSlug: CourseSlug;
}

export function WorkshopQuizPage({ courseSlug }: WorkshopQuizPageProps) {
  const config = getCourseConfig(courseSlug);
  const passThreshold = getWorkshopPassThreshold(courseSlug);
  const questionCount = getWorkshopQuestionCount(courseSlug);
  const timeLimitMinutes = getWorkshopTimeLimitMinutes(courseSlug);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    let cancelled = false;
    loadWorkshopQuestions(courseSlug)
      .then((allQuestions) => {
        if (cancelled) return;
        const selected = shuffleArray(allQuestions).slice(0, questionCount);
        setQuestions(selected);
        setAnswers(new Array(selected.length).fill(null));
      })
      .catch((error: unknown) => {
        // Chunk-load failure leaves the loading state visible; log so the
        // failure is diagnosable instead of silently swallowed.
        console.error("[workshop-quiz] Fragen konnten nicht geladen werden:", error);
      });
    return () => {
      cancelled = true;
    };
  }, [courseSlug, questionCount]);

  // Timer
  useEffect(() => {
    if (finished || questions.length === 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [finished, questions.length]);

  const question = questions[currentIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Per-question option shuffle — computed once per question (keyed on id),
  // so the order is stable while a question is on screen but different across
  // questions and across quiz sessions. The store uses option.id (not position)
  // so shuffle does not affect answer tracking.
  const shuffledOptions = useMemo(
    () => (question ? shuffleArray(question.answerOptions) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [question?.id],
  );

  const handleSelect = useCallback(
    (optionId: string) => {
      if (showExplanation) return;
      setSelectedId(optionId);
      setShowExplanation(true);
      const next = [...answers];
      next[currentIndex] = optionId;
      setAnswers(next);
    },
    [showExplanation, answers, currentIndex],
  );

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
      setSelectedId(null);
      setShowExplanation(false);
    } else {
      setFinished(true);
    }
  }, [currentIndex, questions.length]);

  // Calculate results
  const score = finished
    ? answers.reduce((sum, answerId, i) => {
        if (!questions[i]) return sum;
        const correct = questions[i].answerOptions.find((o) => o.isCorrect);
        return sum + (answerId === correct?.id ? 1 : 0);
      }, 0)
    : 0;
  const total = questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = total > 0 && score / total >= passThreshold;

  useEffect(() => {
    if (finished && total > 0) {
      saveWorkshopQuizResult(courseSlug, score / total, passed);
    }
  }, [finished, score, total, passed, courseSlug]);

  if (questions.length === 0) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-background">
        <h1 className="sr-only">Workshop-Quiz</h1>
        <p role="status" aria-live="polite" className="text-muted-foreground">
          Quiz wird geladen…
        </p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="min-h-[100svh] bg-background">
        <h1 className="sr-only">Workshop-Quiz</h1>
        <div className="mx-auto max-w-2xl px-6 py-16">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="text-center"
          >
            <Trophy className={cn("mx-auto h-16 w-16", passed ? "text-brand-sand" : "text-muted-foreground")} />
            <div aria-live="polite" className={cn("mt-4 font-mono text-6xl font-bold", passed ? "text-brand-sand" : "text-destructive")}>
              {pct}%
            </div>
            <p className="mt-2 text-xl font-semibold">
              {score}/{total} richtig
            </p>
            <p className="mt-2 text-muted-foreground">
              {passed
                ? config.quizPassMessage
                : `Du brauchst mindestens ${Math.round(passThreshold * 100)}% zum Bestehen. Versuch es noch einmal.`}
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              {passed ? (
                <Link
                  href={`${config.coursePath}/zertifikat`}
                  className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
                >
                  Teilnahmebestätigung herunterladen
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-card"
                >
                  <RotateCcw className="h-4 w-4" />
                  Erneut versuchen
                </button>
              )}
              <Link
                href={config.coursePath}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Zurück zum Kurs
              </Link>
            </div>
          </m.div>
        </div>
      </div>
    );
  }

  const correctOption = question?.answerOptions.find((o) => o.isCorrect);
  const isCorrectAnswer = selectedId === correctOption?.id;

  return (
    <div className="min-h-[100svh] bg-background">
      <h1 className="sr-only">Workshop-Quiz</h1>
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link
            href={config.coursePath}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Abbrechen
          </Link>
          <span className="font-mono text-sm font-bold text-brand-orange">
            Workshop-Quiz
          </span>
          <span
            role="timer"
            aria-live="off"
            aria-label={`Verbleibende Zeit: ${minutes} Minuten ${seconds} Sekunden`}
            className={cn("inline-flex items-center gap-1 font-mono text-sm font-bold", timeLeft < 120 ? "text-destructive" : "text-muted-foreground")}
          >
            <Clock className="h-3.5 w-3.5" />
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 pt-24 pb-16">
        {/* Progress */}
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground">
            Frage {currentIndex + 1} von {total}
          </span>
        </div>
        <div
          className="mb-8 h-1 overflow-hidden bg-border"
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={`Frage ${currentIndex + 1} von ${total}`}
        >
          <div
            className="h-full bg-brand-orange transition-[width,background-color] duration-300"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
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
            <h2 className="mb-6 text-lg font-semibold leading-snug">{question?.questionText}</h2>
            <div className="space-y-2">
              {shuffledOptions.map((option) => {
                const isSelected = selectedId === option.id;
                const isCorrect = option.isCorrect;
                let optionClass = "border-border bg-card hover:border-brand-orange/30";
                if (showExplanation) {
                  if (isCorrect) optionClass = "border-brand-sand bg-brand-sand/5";
                  else if (isSelected) optionClass = "border-destructive/50 bg-destructive/5";
                  else optionClass = "border-border bg-card opacity-50";
                }
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    disabled={showExplanation}
                    className={cn("flex w-full items-center gap-3 border px-4 py-3 text-left text-sm transition-[background-color,border-color,color,opacity,transform,box-shadow]", optionClass)}
                  >
                    <span className="shrink-0 font-mono text-xs font-bold uppercase text-muted-foreground">{option.id}</span>
                    <span className="flex-1">{option.text}</span>
                    {showExplanation && isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-sand" />}
                    {showExplanation && isSelected && !isCorrect && <XCircle className="h-4 w-4 shrink-0 text-destructive" />}
                  </button>
                );
              })}
            </div>

            {showExplanation && question && (
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                className={cn("mt-4 border-l-2 px-4 py-3", isCorrectAnswer ? "border-brand-sand bg-brand-sand/5" : "border-destructive/50 bg-destructive/5")}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {isCorrectAnswer ? "Richtig" : "Falsch"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{question.explanation}</p>
              </m.div>
            )}

            {showExplanation && (
              <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-5">
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
                >
                  {currentIndex < total - 1 ? "Weiter" : "Ergebnis"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </m.div>
            )}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

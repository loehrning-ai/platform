"use client";

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
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
import { isCourseFullyCompleted } from "@/lib/courses/completion";
import { reportClientBoundaryError } from "@/lib/observability/client-boundary-error";
import {
  getLearningOwnerContext,
  subscribeLearningOwner,
} from "@/lib/progress/browser-learning-storage";
import { subscribe } from "@/lib/progress/store";
import type { CourseSlug, QuizQuestion } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n/locale";
import { localizeHref } from "@/lib/i18n/locale";
import { MotionProvider } from "@/components/motion-provider";

/**
 * Shared workshop-quiz screen for every free course (shared course architecture,
 *). The route pages are thin wrappers that pass a
 * `courseSlug`; all course-specific copy + thresholds come from `CourseConfig`.
 */

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
// The persistent root nav is at most 64px tall and has a 1px bottom border.
// Keeping the quiz bar below that maximum avoids covered controls at every
// scroll position while preserving its fixed, always-visible timer.
const GLOBAL_NAV_OFFSET_PX = 65;
const SLIDE = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

interface QuizCopy {
  readonly title: string;
  readonly loading: string;
  readonly loadErrorTitle: string;
  readonly loadErrorBody: string;
  readonly retry: string;
  readonly backToCourse: string;
  readonly completeLessonsTitle: string;
  readonly completeLessonsBody: string;
  readonly correctCount: (score: number, total: number) => string;
  readonly passRequired: (threshold: number) => string;
  readonly downloadRecord: (label: string) => string;
  readonly cancel: string;
  readonly timeRemaining: (minutes: number, seconds: number) => string;
  readonly questionProgress: (current: number, total: number) => string;
  readonly correct: string;
  readonly incorrect: string;
  readonly correctAnswer: string;
  readonly selectedIncorrect: string;
  readonly next: string;
  readonly result: string;
  readonly answerFeedback: (correct: boolean, explanation: string) => string;
  readonly completionFeedback: (
    score: number,
    total: number,
    percentage: number,
  ) => string;
}

const QUIZ_COPY: Readonly<Record<"de" | "en", QuizCopy>> = {
  de: {
    title: "Workshop-Quiz",
    loading: "Quiz wird geladen…",
    loadErrorTitle: "Quiz konnte nicht geladen werden.",
    loadErrorBody:
      "Die Quizfragen konnten nicht geladen werden. Prüfe deine Verbindung und versuche es erneut.",
    retry: "Erneut versuchen",
    backToCourse: "Zurück zum Kurs",
    completeLessonsTitle: "Schließe zuerst alle Lektionen ab",
    completeLessonsBody:
      "Das Abschlussquiz wird freigeschaltet, sobald alle Kurslektionen als abgeschlossen markiert sind.",
    correctCount: (score, total) => `${score}/${total} richtig`,
    passRequired: (threshold) =>
      `Du brauchst mindestens ${threshold}% zum Bestehen. Versuch es noch einmal.`,
    downloadRecord: (label) => `${label} herunterladen`,
    cancel: "Abbrechen",
    timeRemaining: (minutes, seconds) =>
      `Verbleibende Zeit: ${minutes} ${
        minutes === 1 ? "Minute" : "Minuten"
      } ${seconds} ${seconds === 1 ? "Sekunde" : "Sekunden"}`,
    questionProgress: (current, total) => `Frage ${current} von ${total}`,
    correct: "Richtig",
    incorrect: "Falsch",
    correctAnswer: "Richtige Antwort.",
    selectedIncorrect: "Deine Auswahl ist falsch.",
    next: "Weiter",
    result: "Ergebnis",
    answerFeedback: (correct, explanation) =>
      `${correct ? "Richtig." : "Nicht korrekt."} ${explanation}`,
    completionFeedback: (score, total, percentage) =>
      `Quiz abgeschlossen: ${score} von ${total} Fragen richtig, ${percentage} Prozent.`,
  },
  en: {
    title: "Workshop quiz",
    loading: "Quiz is loading…",
    loadErrorTitle: "Quiz couldn't be loaded.",
    loadErrorBody:
      "The quiz questions could not be loaded. Check your connection and try again.",
    retry: "Try again",
    backToCourse: "Back to course",
    completeLessonsTitle: "Complete every lesson first",
    completeLessonsBody:
      "The final quiz becomes available after every course lesson is marked complete.",
    correctCount: (score, total) => `${score}/${total} correct`,
    passRequired: (threshold) =>
      `You need at least ${threshold}% to pass. Try again.`,
    downloadRecord: (label) => `Download ${label}`,
    cancel: "Cancel",
    timeRemaining: (minutes, seconds) =>
      `Time remaining: ${minutes} ${
        minutes === 1 ? "minute" : "minutes"
      } ${seconds} ${seconds === 1 ? "second" : "seconds"}`,
    questionProgress: (current, total) => `Question ${current} of ${total}`,
    correct: "Correct",
    incorrect: "Incorrect",
    correctAnswer: "Correct answer.",
    selectedIncorrect: "Your selection is incorrect.",
    next: "Next",
    result: "Result",
    answerFeedback: (correct, explanation) =>
      `${correct ? "Correct." : "Not correct."} ${explanation}`,
    completionFeedback: (score, total, percentage) =>
      `Quiz complete: ${score} of ${total} correct, ${percentage} percent.`,
  },
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
  readonly locale?: Locale;
}

export function WorkshopQuizPage({
  courseSlug,
  locale,
}: WorkshopQuizPageProps) {
  const config = getCourseConfig(courseSlug, locale);
  const passThreshold = getWorkshopPassThreshold(courseSlug, locale);
  const questionCount = getWorkshopQuestionCount(courseSlug, locale);
  const timeLimitMinutes = getWorkshopTimeLimitMinutes(courseSlug, locale);
  const copy = QUIZ_COPY[config.language];
  const localizedCoursePath = locale
    ? localizeHref(config.coursePath, locale)
    : config.coursePath;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedOptionIndex, setFocusedOptionIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60);
  const [direction, setDirection] = useState(1);
  const [accessAllowed, setAccessAllowed] = useState<boolean | null>(null);
  const [ownerGeneration, setOwnerGeneration] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const activeQuizGenerationRef = useRef<number | null>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const unsubscribeOwner = subscribeLearningOwner((owner) => {
      // Invalidate synchronously. React may batch unknown(A) -> resolved(B)
      // into one render; the ref still prevents A's timer/load/result effects
      // from writing into B's namespace during that gap.
      activeQuizGenerationRef.current = null;
      setOwnerGeneration(owner.generation);
      setAccessAllowed(null);
    });
    const unsubscribeProgress = subscribe((progress) => {
      const owner = getLearningOwnerContext();
      setOwnerGeneration(owner.generation);
      if (owner.kind === "unknown") {
        activeQuizGenerationRef.current = null;
        setAccessAllowed(null);
        return;
      }
      setAccessAllowed(isCourseFullyCompleted(progress, courseSlug));
    });
    return () => {
      unsubscribeOwner();
      unsubscribeProgress();
    };
  }, [courseSlug]);

  const resetQuizSession = useCallback(() => {
    activeQuizGenerationRef.current = null;
    setLoadError(false);
    setQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
    setSelectedId(null);
    setFocusedOptionIndex(0);
    setShowExplanation(false);
    setFinished(false);
    setTimeLeft(timeLimitMinutes * 60);
    setDirection(1);
    optionRefs.current = [];
    if (feedbackRef.current) feedbackRef.current.textContent = "";
  }, [timeLimitMinutes]);

  useEffect(() => {
    let cancelled = false;
    resetQuizSession();
    if (accessAllowed !== true || ownerGeneration === null) return;
    const quizGeneration = ownerGeneration;
    loadWorkshopQuestions(courseSlug, locale)
      .then((allQuestions) => {
        if (
          cancelled ||
          getLearningOwnerContext().generation !== quizGeneration
        ) {
          return;
        }
        const selected = shuffleArray(allQuestions).slice(0, questionCount);
        if (selected.length === 0) {
          throw new Error("Workshop quiz question set is empty");
        }
        activeQuizGenerationRef.current = quizGeneration;
        setQuestions(selected);
        setAnswers(new Array(selected.length).fill(null));
      })
      .catch((error: unknown) => {
        if (
          cancelled ||
          getLearningOwnerContext().generation !== quizGeneration
        ) {
          return;
        }
        // Expose a generic recoverable state, never the raw loader/provider
        // detail. The sanitized boundary reporter retains operational signal.
        activeQuizGenerationRef.current = quizGeneration;
        setLoadError(true);
        reportClientBoundaryError("workshop-quiz", error);
      });
    return () => {
      cancelled = true;
      if (activeQuizGenerationRef.current === quizGeneration) {
        activeQuizGenerationRef.current = null;
      }
    };
  }, [
    accessAllowed,
    courseSlug,
    locale,
    loadAttempt,
    ownerGeneration,
    questionCount,
    resetQuizSession,
  ]);

  // Timer
  useEffect(() => {
    if (
      accessAllowed !== true ||
      ownerGeneration === null ||
      activeQuizGenerationRef.current !== ownerGeneration ||
      finished ||
      questions.length === 0
    ) {
      return;
    }
    const quizGeneration = ownerGeneration;
    const interval = setInterval(() => {
      if (activeQuizGenerationRef.current !== quizGeneration) return;
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [accessAllowed, finished, ownerGeneration, questions.length]);

  useEffect(() => {
    if (
      accessAllowed === true &&
      ownerGeneration !== null &&
      activeQuizGenerationRef.current === ownerGeneration &&
      questions.length > 0 &&
      timeLeft === 0
    ) {
      setFinished(true);
    }
  }, [accessAllowed, ownerGeneration, questions.length, timeLeft]);

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
      if (
        accessAllowed !== true ||
        ownerGeneration === null ||
        activeQuizGenerationRef.current !== ownerGeneration ||
        showExplanation ||
        !question
      ) {
        return;
      }
      setSelectedId(optionId);
      setShowExplanation(true);
      const next = [...answers];
      next[currentIndex] = optionId;
      setAnswers(next);
      const correctOption = question.answerOptions.find(
        (option) => option.isCorrect,
      );
      if (feedbackRef.current) {
        feedbackRef.current.textContent = copy.answerFeedback(
          optionId === correctOption?.id,
          question.explanation,
        );
      }
    },
    [
      accessAllowed,
      answers,
      copy,
      currentIndex,
      ownerGeneration,
      question,
      showExplanation,
    ],
  );

  const handleNext = useCallback(() => {
    if (
      accessAllowed !== true ||
      ownerGeneration === null ||
      activeQuizGenerationRef.current !== ownerGeneration
    ) {
      return;
    }
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
      setSelectedId(null);
      setFocusedOptionIndex(0);
      setShowExplanation(false);
      if (feedbackRef.current) feedbackRef.current.textContent = "";
    } else {
      setFinished(true);
    }
  }, [accessAllowed, currentIndex, ownerGeneration, questions.length]);

  const handleOptionKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, optionIndex: number) => {
      if (showExplanation || shuffledOptions.length === 0) return;
      let nextIndex: number | null = null;
      switch (event.key) {
        case "ArrowDown":
        case "ArrowRight":
          nextIndex = (optionIndex + 1) % shuffledOptions.length;
          break;
        case "ArrowUp":
        case "ArrowLeft":
          nextIndex =
            (optionIndex - 1 + shuffledOptions.length) % shuffledOptions.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = shuffledOptions.length - 1;
          break;
      }
      if (nextIndex === null) return;
      event.preventDefault();
      setFocusedOptionIndex(nextIndex);
      optionRefs.current[nextIndex]?.focus();
    },
    [showExplanation, shuffledOptions.length],
  );

  const setQuestionHeadingRef = useCallback(
    (element: HTMLHeadingElement | null) => {
      questionHeadingRef.current = element;
      if (element && currentIndex > 0) element.focus();
    },
    [currentIndex],
  );

  useEffect(() => {
    if (showExplanation) nextButtonRef.current?.focus();
  }, [showExplanation]);

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
    if (
      accessAllowed === true &&
      ownerGeneration !== null &&
      activeQuizGenerationRef.current === ownerGeneration &&
      finished &&
      total > 0
    ) {
      saveWorkshopQuizResult(courseSlug, score / total, passed);
    }
  }, [
    accessAllowed,
    courseSlug,
    finished,
    ownerGeneration,
    passed,
    score,
    total,
  ]);

  useEffect(() => {
    if (
      accessAllowed !== true ||
      ownerGeneration === null ||
      activeQuizGenerationRef.current !== ownerGeneration ||
      !finished ||
      total === 0
    ) {
      return;
    }
    if (feedbackRef.current) {
      feedbackRef.current.textContent = copy.completionFeedback(
        score,
        total,
        pct,
      );
    }
    scoreRef.current?.focus();
  }, [accessAllowed, copy, finished, ownerGeneration, pct, score, total]);

  const sessionIsCurrent =
    accessAllowed === true &&
    ownerGeneration !== null &&
    activeQuizGenerationRef.current === ownerGeneration;

  if (accessAllowed === false) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-background px-6">
        <div className="max-w-lg text-center">
          <h1 className="text-2xl font-bold text-foreground">
            {copy.completeLessonsTitle}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {copy.completeLessonsBody}
          </p>
          <Link
            href={localizedCoursePath}
            className="mt-6 inline-flex min-h-11 items-center gap-2 border-2 border-foreground px-5 text-sm font-bold text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {copy.backToCourse}
          </Link>
        </div>
      </div>
    );
  }

  if (sessionIsCurrent && loadError) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-background px-6">
        <div className="max-w-lg text-center">
          <h1 className="text-2xl font-bold text-foreground">
            {copy.loadErrorTitle}
          </h1>
          <p role="alert" className="mt-3 text-muted-foreground">
            {copy.loadErrorBody}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setLoadAttempt((attempt) => attempt + 1)}
              className="inline-flex min-h-11 items-center gap-2 border-2 border-foreground bg-brand-orange px-5 text-sm font-bold text-white"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {copy.retry}
            </button>
            <Link
              href={localizedCoursePath}
              className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {copy.backToCourse}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionIsCurrent || questions.length === 0) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-background">
        <h1 className="sr-only">{copy.title}</h1>
        <p role="status" aria-live="polite" className="text-muted-foreground">
          {copy.loading}
        </p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="min-h-[100svh] bg-background">
        <h1 className="sr-only">{copy.title}</h1>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          ref={feedbackRef}
        />
        <div className="mx-auto max-w-2xl px-6 py-16">
          <MotionProvider>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
              className="text-center"
            >
            <Trophy
              aria-hidden="true"
              className={cn(
                "mx-auto h-16 w-16",
                passed ? "text-brand-sand" : "text-muted-foreground",
              )}
            />
            <div
              ref={scoreRef}
              tabIndex={-1}
              className={cn(
                "mt-4 font-mono text-6xl font-bold outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                passed ? "text-brand-sand" : "text-destructive",
              )}
            >
              {pct}%
            </div>
            <p className="mt-2 text-xl font-semibold">
              {copy.correctCount(score, total)}
            </p>
            <p className="mt-2 text-muted-foreground">
              {passed
                ? config.quizPassMessage
                : copy.passRequired(Math.round(passThreshold * 100))}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {passed ? (
                <Link
                  href={
                    locale
                      ? localizeHref(`${config.coursePath}/zertifikat`, locale)
                      : `${config.coursePath}/zertifikat`
                  }
                  className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
                >
                  {copy.downloadRecord(config.recordNoun.label)}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-card"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  {copy.retry}
                </button>
              )}
              <Link
                href={localizedCoursePath}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {copy.backToCourse}
              </Link>
            </div>
            </m.div>
          </MotionProvider>
        </div>
      </div>
    );
  }

  const correctOption = question?.answerOptions.find((o) => o.isCorrect);
  const isCorrectAnswer = selectedId === correctOption?.id;

  return (
    <div className="min-h-[100svh] overflow-x-clip bg-background">
      <h1 className="sr-only">{copy.title}</h1>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        ref={feedbackRef}
      />
      {/* Header */}
      <header
        data-testid="workshop-quiz-header"
        className="fixed left-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm"
        style={{ top: GLOBAL_NAV_OFFSET_PX }}
      >
        <div className="mx-auto grid min-h-14 max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-2 sm:flex sm:h-14 sm:px-6 sm:py-0">
          <Link
            href={localizedCoursePath}
            className="min-w-0 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {copy.cancel}
          </Link>
          <span className="order-3 col-span-2 min-w-0 break-words font-mono text-xs font-bold text-brand-orange sm:order-none sm:col-span-1 sm:text-sm">
            {copy.title}
          </span>
          <span
            role="timer"
            aria-live="off"
            aria-label={copy.timeRemaining(minutes, seconds)}
            className={cn(
              "order-2 inline-flex shrink-0 items-center gap-1 font-mono text-sm font-bold sm:order-none",
              timeLeft < 120 ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 pt-24 pb-16">
        {/* Progress */}
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground">
            {copy.questionProgress(currentIndex + 1, total)}
          </span>
        </div>
        <div
          className="mb-8 h-1 overflow-hidden bg-border"
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={copy.questionProgress(currentIndex + 1, total)}
        >
          <div
            className="h-full bg-brand-orange transition-[width,background-color] duration-300"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>

        <MotionProvider>
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
            <h2
              id={`workshop-quiz-question-${currentIndex}`}
              ref={setQuestionHeadingRef}
              tabIndex={-1}
              className="mb-6 text-lg font-semibold leading-snug outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              {question?.questionText}
            </h2>
            <div
              role="radiogroup"
              aria-labelledby={`workshop-quiz-question-${currentIndex}`}
              className="space-y-2"
            >
              {shuffledOptions.map((option, optionIndex) => {
                const isSelected = selectedId === option.id;
                const isCorrect = option.isCorrect;
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
                  <button
                    key={option.id}
                    ref={(element) => {
                      optionRefs.current[optionIndex] = element;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={
                      !showExplanation && focusedOptionIndex === optionIndex
                        ? 0
                        : -1
                    }
                    onFocus={() => setFocusedOptionIndex(optionIndex)}
                    onKeyDown={(event) =>
                      handleOptionKeyDown(event, optionIndex)
                    }
                    onClick={() => handleSelect(option.id)}
                    disabled={showExplanation}
                    className={cn(
                      "flex w-full items-center gap-3 border px-4 py-3 text-left text-sm transition-[background-color,border-color,color,opacity,transform,box-shadow]",
                      optionClass,
                    )}
                  >
                    <span className="shrink-0 font-mono text-xs font-bold uppercase text-muted-foreground">
                      {option.id}
                    </span>
                    <span className="min-w-0 flex-1 break-words">
                      {option.text}
                    </span>
                    {showExplanation && isCorrect && (
                      <>
                        <span className="sr-only">{copy.correctAnswer}</span>
                        <CheckCircle2
                          className="h-4 w-4 shrink-0 text-brand-sand"
                          aria-hidden="true"
                        />
                      </>
                    )}
                    {showExplanation && isSelected && !isCorrect && (
                      <>
                        <span className="sr-only">
                          {copy.selectedIncorrect}
                        </span>
                        <XCircle
                          className="h-4 w-4 shrink-0 text-destructive"
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {showExplanation && question && (
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
                  ref={nextButtonRef}
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
                >
                  {currentIndex < total - 1 ? copy.next : copy.result}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </m.div>
            )}
            </m.div>
          </AnimatePresence>
        </MotionProvider>
      </div>
    </div>
  );
}

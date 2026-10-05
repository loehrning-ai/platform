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
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  LockKeyhole,
  Trophy,
  RotateCcw,
  X,
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
import { isCourseFullyCompleted } from "@/lib/courses/completion";
import { reportClientBoundaryError } from "@/lib/observability/client-boundary-error";
import {
  getLearningOwnerContext,
  subscribeLearningOwner,
} from "@/lib/progress/browser-learning-storage";
import { saveWorkshopQuizResultDurably, subscribe } from "@/lib/progress/store";
import type { CourseSlug, QuizQuestion } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n/locale";
import { localizeHref } from "@/lib/i18n/locale";
import { MotionProvider } from "@/components/motion-provider";
import { trackCourseCompletion } from "@/lib/analytics/events";
import { ProgressRing } from "@/components/lesson-engine/progress-ring";
import { CelebrationBurst } from "@/components/lesson-engine/celebration-burst";
import {
  APP_CARD,
  APP_GHOST,
  APP_PRIMARY,
  APP_SECONDARY,
} from "@/components/lesson-engine/app-ui";

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
  readonly savingResult: string;
  readonly saveErrorTitle: string;
  readonly saveErrorBody: string;
  readonly retrySave: string;
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
  readonly passedTitle: string;
  readonly failedTitle: string;
  readonly statCorrect: string;
  readonly statPassMark: string;
  readonly statTime: string;
  readonly answersLabel: string;
  readonly answerFeedback: (correct: boolean, explanation: string) => string;
  readonly completionFeedback: (
    score: number,
    total: number,
    percentage: number,
  ) => string;
}

const QUIZ_COPY: Readonly<Record<"de" | "en", QuizCopy>> = {
  de: {
    title: "Abschlussquiz",
    loading: "Quiz wird geladen…",
    loadErrorTitle: "Quiz konnte nicht geladen werden.",
    loadErrorBody:
      "Prüfe deine Verbindung und versuch es erneut.",
    savingResult: "Ergebnis wird gespeichert…",
    saveErrorTitle: "Ergebnis wurde nicht gespeichert.",
    saveErrorBody:
      "Der Browserspeicher hat den Eintrag abgelehnt. Es wurde kein Abschluss freigeschaltet.",
    retrySave: "Speichern erneut versuchen",
    retry: "Erneut versuchen",
    backToCourse: "Zurück zum Kurs",
    completeLessonsTitle: "Schließe zuerst alle Lektionen ab",
    completeLessonsBody:
      "Danach wird das Quiz freigeschaltet.",
    correctCount: (score, total) => `${score}/${total} richtig`,
    passRequired: (threshold) =>
      `Zum Bestehen brauchst du mindestens ${threshold}%.`,
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
    passedTitle: "Bestanden",
    failedTitle: "Noch nicht bestanden",
    statCorrect: "Richtig",
    statPassMark: "Bestehen ab",
    statTime: "Zeit",
    answersLabel: "Deine Antworten",
    answerFeedback: (correct, explanation) =>
      `${correct ? "Richtig." : "Nicht korrekt."} ${explanation}`,
    completionFeedback: (score, total, percentage) =>
      `Quiz abgeschlossen: ${score} von ${total} Fragen richtig, ${percentage} Prozent.`,
  },
  en: {
    title: "Final quiz",
    loading: "Quiz is loading…",
    loadErrorTitle: "Quiz couldn't be loaded.",
    loadErrorBody:
      "Check your connection and try again.",
    savingResult: "Saving result…",
    saveErrorTitle: "Result was not saved.",
    saveErrorBody:
      "Browser storage rejected the write. No completion record was unlocked.",
    retrySave: "Retry saving",
    retry: "Try again",
    backToCourse: "Back to course",
    completeLessonsTitle: "Complete every lesson first",
    completeLessonsBody:
      "The quiz unlocks after that.",
    correctCount: (score, total) => `${score}/${total} correct`,
    passRequired: (threshold) =>
      `You need at least ${threshold}% to pass.`,
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
    passedTitle: "Passed",
    failedTitle: "Not passed yet",
    statCorrect: "Correct",
    statPassMark: "Pass mark",
    statTime: "Time",
    answersLabel: "Your answers",
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

/**
 * Outcome label for a saved attempt. The three outcomes are disjoint: a pass
 * is a pass however the attempt ended, and an attempt that ran out of time
 * without passing is a timeout, never a failure.
 */
export function examOutcomeStep(
  passed: boolean,
  timedOut: boolean,
): "exam_passed" | "exam_failed" | "exam_timeout" {
  if (passed) return "exam_passed";
  return timedOut ? "exam_timeout" : "exam_failed";
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
  const [resultSaveStatus, setResultSaveStatus] = useState<
    "pending" | "saved" | "error"
  >("pending");
  const [resultSaveAttempt, setResultSaveAttempt] = useState(0);
  const activeQuizGenerationRef = useRef<number | null>(null);
  // Per attempt: whether the timer ended it, and whether its outcome was sent.
  const finishedByTimeoutRef = useRef(false);
  const outcomeReportedRef = useRef(false);
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

  useEffect(() => {
    if (accessAllowed === false) trackCourseCompletion(courseSlug, "exam_blocked");
  }, [accessAllowed, courseSlug]);

  const resetQuizSession = useCallback(() => {
    activeQuizGenerationRef.current = null;
    finishedByTimeoutRef.current = false;
    outcomeReportedRef.current = false;
    setLoadError(false);
    setResultSaveStatus("pending");
    setResultSaveAttempt(0);
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
        trackCourseCompletion(courseSlug, "exam_started");
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
        trackCourseCompletion(courseSlug, "exam_unavailable");
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
      finishedByTimeoutRef.current = true;
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
      const saved = saveWorkshopQuizResultDurably(
        courseSlug,
        score / total,
        passed,
      );
      if (
        activeQuizGenerationRef.current === ownerGeneration &&
        getLearningOwnerContext().generation === ownerGeneration
      ) {
        setResultSaveStatus(saved ? "saved" : "error");
        // Covers both the last-question ending and the timer auto-finish.
        // Only the outcome label is sent, never the score or the answers.
        if (saved && !outcomeReportedRef.current) {
          outcomeReportedRef.current = true;
          trackCourseCompletion(
            courseSlug,
            examOutcomeStep(passed, finishedByTimeoutRef.current),
          );
        }
      }
    }
  }, [
    accessAllowed,
    courseSlug,
    finished,
    ownerGeneration,
    passed,
    resultSaveAttempt,
    score,
    total,
  ]);

  useEffect(() => {
    if (
      accessAllowed !== true ||
      ownerGeneration === null ||
      activeQuizGenerationRef.current !== ownerGeneration ||
      !finished ||
      total === 0 ||
      resultSaveStatus !== "saved"
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
  }, [
    accessAllowed,
    copy,
    finished,
    ownerGeneration,
    pct,
    resultSaveStatus,
    score,
    total,
  ]);

  const sessionIsCurrent =
    accessAllowed === true &&
    ownerGeneration !== null &&
    activeQuizGenerationRef.current === ownerGeneration;

  if (accessAllowed === false) {
    return (
      <div className="course-app-ground flex min-h-[100svh] items-center justify-center px-4">
        <div className={cn(APP_CARD, "max-w-lg p-6 text-center sm:p-8")}>
          <span aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lab-accent-soft text-lab-accent">
            <LockKeyhole className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-fluid-h2 font-bold tracking-[-0.02em] text-foreground">
            {copy.completeLessonsTitle}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {copy.completeLessonsBody}
          </p>
          <Link href={localizedCoursePath} className={cn(APP_SECONDARY, "mt-6 min-h-11")}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {copy.backToCourse}
          </Link>
        </div>
      </div>
    );
  }

  if (sessionIsCurrent && loadError) {
    return (
      <div className="course-app-ground flex min-h-[100svh] items-center justify-center px-4">
        <div className={cn(APP_CARD, "max-w-lg p-6 text-center sm:p-8")}>
          <h1 className="text-fluid-h2 font-bold tracking-[-0.02em] text-foreground">
            {copy.loadErrorTitle}
          </h1>
          <p role="alert" className="mt-3 text-muted-foreground">
            {copy.loadErrorBody}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setLoadAttempt((attempt) => attempt + 1)}
              className={cn(APP_PRIMARY, "min-h-11")}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {copy.retry}
            </button>
            <Link href={localizedCoursePath} className={cn(APP_GHOST, "min-h-11")}>
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
      <div className="course-app-ground flex min-h-[100svh] items-center justify-center">
        <h1 className="sr-only">{copy.title}</h1>
        <p role="status" aria-live="polite" className="text-muted-foreground">
          {copy.loading}
        </p>
      </div>
    );
  }

  if (finished) {
    if (resultSaveStatus === "pending") {
      return (
        <div className="course-app-ground flex min-h-[100svh] items-center justify-center px-4">
          <p role="status" aria-live="polite" className="text-muted-foreground">
            {copy.savingResult}
          </p>
        </div>
      );
    }

    if (resultSaveStatus === "error") {
      return (
        <div className="course-app-ground flex min-h-[100svh] items-center justify-center px-4">
          <div className={cn(APP_CARD, "max-w-lg p-6 text-center sm:p-8")}>
            <h1 className="text-fluid-h2 font-bold tracking-[-0.02em] text-foreground">
              {copy.saveErrorTitle}
            </h1>
            <p role="alert" className="mt-3 text-muted-foreground">
              {copy.saveErrorBody}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setResultSaveStatus("pending");
                  setResultSaveAttempt((attempt) => attempt + 1);
                }}
                className={cn(APP_PRIMARY, "min-h-11")}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {copy.retrySave}
              </button>
              <Link href={localizedCoursePath} className={cn(APP_GHOST, "min-h-11")}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {copy.backToCourse}
              </Link>
            </div>
          </div>
        </div>
      );
    }

    const usedSeconds = Math.max(0, timeLimitMinutes * 60 - timeLeft);
    const usedLabel = `${Math.floor(usedSeconds / 60)}:${(usedSeconds % 60).toString().padStart(2, "0")}`;

    return (
      <div className="course-app-ground min-h-[100svh]">
        <h1 className="sr-only">{copy.title}</h1>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          ref={feedbackRef}
        />
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
          <MotionProvider>
            <m.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
              data-quiz-result={passed ? "passed" : "failed"}
              className="course-app-hero relative overflow-hidden rounded-[28px] border border-lab-line/80 p-6 text-center shadow-lab-lg sm:p-10"
            >
              <p className={cn("inline-flex items-center gap-2 text-sm font-semibold", passed ? "text-lab-good" : "text-lab-accent")}>
                <Trophy className="h-4 w-4" aria-hidden="true" />
                {copy.result}
              </p>
              <div className="relative mx-auto mt-5 h-[168px] w-[168px]">
                <ProgressRing
                  fraction={total > 0 ? score / total : 0}
                  size={168}
                  stroke={14}
                  drawIn
                  tone={passed ? "good" : "accent"}
                  label={copy.completionFeedback(score, total, pct)}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    ref={scoreRef}
                    tabIndex={-1}
                    className={cn(
                      "rounded-2xl px-2 text-4xl font-bold tabular-nums tracking-[-0.03em] outline-none focus-visible:ring-2 focus-visible:ring-lab-accent",
                      passed ? "text-lab-good" : "text-foreground",
                    )}
                  >
                    {pct}%
                  </div>
                </div>
                <CelebrationBurst play={passed} radius={150} />
              </div>
              <p className="mt-5 text-2xl font-bold tracking-[-0.02em] text-foreground">
                {passed ? copy.passedTitle : copy.failedTitle}
              </p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-muted-foreground">
                {copy.correctCount(score, total)}
              </p>
              <p className="mx-auto mt-2 max-w-[48ch] text-muted-foreground">
                {passed
                  ? config.quizPassMessage
                  : copy.passRequired(Math.round(passThreshold * 100))}
              </p>
              <dl className="mt-6 grid grid-cols-3 gap-2 text-left">
                <div className="min-w-0 rounded-[18px] bg-paper/85 px-3 py-3 ring-1 ring-lab-line/80">
                  <dt className="truncate text-[12px] font-semibold text-muted-foreground">{copy.statCorrect}</dt>
                  <dd className="mt-0.5 truncate text-lg font-bold tabular-nums text-foreground">{score}/{total}</dd>
                </div>
                <div className="min-w-0 rounded-[18px] bg-paper/85 px-3 py-3 ring-1 ring-lab-line/80">
                  <dt className="truncate text-[12px] font-semibold text-muted-foreground">{copy.statPassMark}</dt>
                  <dd className="mt-0.5 truncate text-lg font-bold tabular-nums text-foreground">{Math.round(passThreshold * 100)}%</dd>
                </div>
                <div className="min-w-0 rounded-[18px] bg-paper/85 px-3 py-3 ring-1 ring-lab-line/80">
                  <dt className="truncate text-[12px] font-semibold text-muted-foreground">{copy.statTime}</dt>
                  <dd className="mt-0.5 truncate text-lg font-bold tabular-nums text-foreground">{usedLabel}</dd>
                </div>
              </dl>
              <ol aria-label={copy.answersLabel} className="mt-4 flex flex-wrap justify-center gap-1.5">
                {questions.map((entry, index) => {
                  const right = answers[index] === entry.answerOptions.find((option) => option.isCorrect)?.id;
                  return (
                    <li
                      key={entry.id}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold",
                        right ? "bg-lab-good text-paper" : "bg-lab-bad-soft text-lab-bad",
                      )}
                    >
                      <span aria-hidden="true">{index + 1}</span>
                      <span className="sr-only">
                        {copy.questionProgress(index + 1, total)}: {right ? copy.correct : copy.incorrect}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
                {passed ? (
                  <Link
                    href={
                      locale
                        ? localizeHref(
                            `${config.coursePath}/zertifikat`,
                            locale,
                          )
                        : `${config.coursePath}/zertifikat`
                    }
                    className={cn(APP_PRIMARY, "min-h-11")}
                  >
                    {copy.downloadRecord(config.recordNoun.label)}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className={cn(APP_PRIMARY, "min-h-11")}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    {copy.retry}
                  </button>
                )}
                <Link href={localizedCoursePath} className={cn(APP_SECONDARY, "min-h-11")}>
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

  // The wrapper below sets overflow-wrap: anywhere, which inherits to every
  // descendant. It clips rather than scrolls, so a German answer explanation
  // whose longest compound exceeds the column is cut off instead of wrapping —
  // visible only at phone widths, where the course shell leaves the least room.
  return (
    <div className="course-app-ground min-h-[100svh] overflow-x-clip [overflow-wrap:anywhere]">
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
        className="course-app-frost fixed left-0 z-40 w-full border-b border-lab-line/70"
        style={{ top: GLOBAL_NAV_OFFSET_PX }}
      >
        <div className="mx-auto grid min-h-14 max-w-2xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-3 py-2 sm:flex sm:h-14 sm:px-6 sm:py-0">
          <Link href={localizedCoursePath} className={cn(APP_GHOST, "min-h-11 min-w-0")}>
            <X className="h-4 w-4" aria-hidden="true" />
            {copy.cancel}
          </Link>
          <span className="order-3 col-span-2 min-w-0 break-words text-center text-[15px] font-semibold text-foreground sm:order-none sm:col-span-1 sm:flex-1">
            {copy.title}
          </span>
          <span
            role="timer"
            aria-live="off"
            aria-label={copy.timeRemaining(minutes, seconds)}
            className={cn(
              "order-2 inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-bold tabular-nums ring-1 sm:order-none",
              timeLeft < 120
                ? "bg-lab-bad-soft text-lab-bad ring-lab-bad/30"
                : "bg-paper text-foreground ring-lab-line",
            )}
          >
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pb-[calc(var(--tabbar-band-h)+6rem)] pt-[7.5rem] sm:px-6 sm:pt-[5.5rem] lg:pb-12 lg:pt-[4.75rem]">
        {/* Progress: one segment per question, coloured by the answer. */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-muted-foreground tabular-nums">
            {copy.questionProgress(currentIndex + 1, total)}
          </span>
        </div>
        <div
          className="mb-6 flex gap-1"
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={copy.questionProgress(currentIndex + 1, total)}
        >
          {questions.map((entry, index) => {
            const answer = answers[index];
            const right = answer !== null && answer === entry.answerOptions.find((option) => option.isCorrect)?.id;
            return (
              <span
                key={entry.id}
                aria-hidden="true"
                className={cn(
                  "h-1.5 min-w-0 flex-1 rounded-full transition-[background-color] duration-300 motion-reduce:transition-none",
                  answer !== null
                    ? right
                      ? "bg-lab-good"
                      : "bg-lab-bad"
                    : index === currentIndex
                      ? "bg-lab-accent"
                      : "bg-lab-line",
                )}
              />
            );
          })}
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
              className={cn(APP_CARD, "rounded-[28px] p-5 sm:p-8")}
            >
              <h2
                id={`workshop-quiz-question-${currentIndex}`}
                ref={setQuestionHeadingRef}
                tabIndex={-1}
                className="mb-5 rounded-lg text-xl font-bold leading-snug tracking-[-0.015em] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
              >
                {question?.questionText}
              </h2>
              <div
                role="radiogroup"
                aria-labelledby={`workshop-quiz-question-${currentIndex}`}
                className="space-y-2.5"
              >
                {shuffledOptions.map((option, optionIndex) => {
                  const isSelected = selectedId === option.id;
                  const isCorrect = option.isCorrect;
                  let optionClass =
                    "border-lab-line bg-paper hover:border-lab-accent/60 hover:bg-lab-accent-soft";
                  let badgeClass = "bg-card text-muted-foreground ring-1 ring-lab-line";
                  if (showExplanation) {
                    if (isCorrect) {
                      optionClass = "border-lab-good bg-lab-good-soft";
                      badgeClass = "bg-lab-good text-paper";
                    } else if (isSelected) {
                      optionClass = "border-lab-bad/50 bg-lab-bad-soft";
                      badgeClass = "bg-lab-bad text-paper";
                    } else {
                      optionClass = "border-lab-line bg-paper opacity-60";
                    }
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
                        "flex min-h-14 w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left text-base leading-snug text-foreground outline-none transition-[background-color,border-color,color,opacity] duration-150 focus-visible:ring-2 focus-visible:ring-lab-accent focus-visible:ring-offset-2 motion-reduce:transition-none",
                        optionClass,
                      )}
                    >
                      {/* Letters follow the shown order, not the stored id,
                          so shuffled options still read A, B, C, D. */}
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                          badgeClass,
                        )}
                      >
                        {showExplanation && isCorrect ? (
                          <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                        ) : showExplanation && isSelected ? (
                          <X className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                        ) : (
                          String.fromCharCode(65 + optionIndex)
                        )}
                      </span>
                      <span className="min-w-0 flex-1 break-words">
                        {option.text}
                      </span>
                      {showExplanation && isCorrect && (
                        <span className="sr-only">{copy.correctAnswer}</span>
                      )}
                      {showExplanation && isSelected && !isCorrect && (
                        <span className="sr-only">
                          {copy.selectedIncorrect}
                        </span>
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
                    "mt-4 flex gap-3 rounded-[18px] px-4 py-3",
                    isCorrectAnswer ? "bg-lab-good-soft" : "bg-lab-bad-soft",
                  )}
                >
                  {isCorrectAnswer ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lab-good" aria-hidden="true" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-lab-bad" aria-hidden="true" />
                  )}
                  <div className="min-w-0">
                    <p className={cn("font-semibold", isCorrectAnswer ? "text-lab-good" : "text-lab-bad")}>
                      {isCorrectAnswer ? copy.correct : copy.incorrect}
                    </p>
                    <p className="mt-1 text-[15px] leading-relaxed text-foreground">
                      {question.explanation}
                    </p>
                  </div>
                </m.div>
              )}
            </m.div>
          </AnimatePresence>

          {showExplanation && (
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
              data-quiz-action-bar
              className="fixed inset-x-0 bottom-[var(--tabbar-band-h)] z-30 border-t border-lab-line/80 bg-paper/95 px-4 py-3 backdrop-blur-xl lg:static lg:mt-5 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
            >
              <div className="mx-auto flex max-w-2xl justify-end">
                <button
                  ref={nextButtonRef}
                  type="button"
                  onClick={handleNext}
                  className={cn(APP_PRIMARY, "w-full min-h-11 sm:w-auto")}
                >
                  {currentIndex < total - 1 ? copy.next : copy.result}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </m.div>
          )}
        </MotionProvider>
      </div>
    </div>
  );
}

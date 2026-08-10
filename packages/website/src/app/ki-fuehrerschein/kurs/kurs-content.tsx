"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { m } from "framer-motion";
import {
  BookOpen,
  Trophy,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Share2,
  Check,
} from "lucide-react";
import {
  getBlockCompletedLessons,
  getCompletedLessonsCount,
  getOverallProgress,
  isWorkshopQuizPassed,
  importProgress,
  buildProgressUrl,
} from "@/lib/course/progress";
import type { BlockSummary } from "@/lib/course/types";
import { subscribe } from "@/lib/progress/store";
import {
  getLearningOwnerContext,
  subscribeLearningOwner,
} from "@/lib/progress/browser-learning-storage";
import type { Locale } from "@/lib/i18n/locale";
import { localizeHref } from "@/lib/i18n/locale";
import { getCourseConfig } from "@/lib/course/config";
import { MotionProvider } from "@/components/motion-provider";

// Client half of the course hub (performance hardening): receives slim
// `BlockSummary` props from the server page instead of importing
// `@/lib/course/data`, which would bundle the full lesson/quiz/glossary
// JSON graph (~420 KB) into this route's client JS.

const COURSE_SLUG = "ki-fuehrerschein" as const;

interface CourseHubCopy {
  readonly backHome: string;
  readonly eyebrow: string;
  readonly summary: (
    blockCount: number,
    lessonCount: number,
    recordLabel: string,
  ) => string;
  readonly noticeLabel: string;
  readonly notice: string;
  readonly importSuccess: string;
  readonly importError: string;
  readonly overall: string;
  readonly lessons: string;
  readonly blocks: string;
  readonly quiz: string;
  readonly progressAria: string;
  readonly shareCopied: string;
  readonly share: string;
  readonly shareError: string;
  readonly blockLabel: (number: number) => string;
  readonly minutes: (count: number) => string;
  readonly continue: string;
  readonly startBlock: string;
  readonly workshopQuiz: string;
  readonly quizDetails: (
    questions: number,
    threshold: number,
    minutes: number,
  ) => string;
  readonly startQuiz: string;
  readonly passedRecord: (recordLabel: string) => string;
  readonly locked: (lessonCount: number) => string;
}

const COURSE_HUB_COPY: Readonly<Record<Locale, CourseHubCopy>> = {
  de: {
    backHome: "Zurück zur Startseite",
    eyebrow: "Dein Kurs",
    summary: (blocks, lessons, record) =>
      `${blocks} Blöcke, ${lessons} Lektionen, 1 ${record}. Kostenlos.`,
    noticeLabel: "Hinweis",
    notice:
      "Dieser Kurs vermittelt Wissen über KI-Kompetenz nach Artikel 4 der EU-KI-Verordnung. Er ersetzt keine Rechtsberatung oder organisationsbezogene Compliance-Prüfung.",
    importSuccess: "Fortschritt erfolgreich importiert.",
    importError:
      "Dieser Fortschrittslink ist ungültig oder veraltet. Es wurde kein Fortschritt importiert.",
    overall: "Gesamtfortschritt",
    lessons: "Lektionen",
    blocks: "Blöcke",
    quiz: "Quiz",
    progressAria: "Gesamtfortschritt",
    shareCopied: "Link kopiert, auf anderem Gerät öffnen",
    share: "Fortschritt auf anderem Gerät fortsetzen",
    shareError: "Link konnte nicht kopiert werden. Bitte versuche es erneut.",
    blockLabel: (number) => `Block ${number}`,
    minutes: (count) => `${count} Min`,
    continue: "Weitermachen",
    startBlock: "Block starten",
    workshopQuiz: "Workshop-Quiz",
    quizDetails: (questions, threshold, minutes) =>
      `${questions} Praxisfragen · ${threshold}% zum Bestehen · ${minutes} Minuten`,
    startQuiz: "Quiz starten",
    passedRecord: (recordLabel) =>
      `Bestanden: ${recordLabel} herunterladen`,
    locked: (lessons) =>
      `Verfügbar nach Abschluss aller ${lessons} Lektionen.`,
  },
  en: {
    backHome: "Back to home",
    eyebrow: "Course reader",
    summary: (blocks, lessons, record) =>
      `${blocks} blocks, ${lessons} lessons, 1 ${record.toLowerCase()}. Free.`,
    noticeLabel: "Scope",
    notice:
      "This course covers AI literacy under Article 4 of the EU AI Act. It is not legal advice and does not replace an organization-specific compliance assessment.",
    importSuccess: "Progress imported.",
    importError:
      "This progress link is invalid or outdated. No progress was imported.",
    overall: "Overall progress",
    lessons: "Lessons",
    blocks: "Blocks",
    quiz: "Quiz",
    progressAria: "Overall course progress",
    shareCopied: "Link copied; open it on the other device",
    share: "Continue on another device",
    shareError: "The link could not be copied. Try again.",
    blockLabel: (number) => `Block ${number}`,
    minutes: (count) => `${count} min`,
    continue: "Continue",
    startBlock: "Start block",
    workshopQuiz: "Workshop quiz",
    quizDetails: (questions, threshold, minutes) =>
      `${questions} practical questions · ${threshold}% to pass · ${minutes} minutes`,
    startQuiz: "Start quiz",
    passedRecord: (recordLabel) => `Passed: download ${recordLabel.toLowerCase()}`,
    locked: (lessons) =>
      `Available after all ${lessons} lessons are complete.`,
  },
};

function refreshProgress(
  blocks: readonly BlockSummary[],
  totalLessons: number,
) {
  const blockProgress: Record<string, number> = {};
  for (const block of blocks) {
    blockProgress[block.id] = getBlockCompletedLessons(
      COURSE_SLUG,
      block.lessonIds,
    );
  }
  return {
    overall: getOverallProgress(COURSE_SLUG, totalLessons),
    completedLessons: getCompletedLessonsCount(COURSE_SLUG),
    quizPassed: isWorkshopQuizPassed(COURSE_SLUG),
    blockProgress,
  };
}

interface KursContentProps {
  readonly blocks: readonly BlockSummary[];
  readonly totalLessons: number;
  readonly locale?: Locale;
}

export function KursContent({
  blocks,
  totalLessons,
  locale = "de",
}: KursContentProps) {
  const copy = COURSE_HUB_COPY[locale];
  const config = getCourseConfig(COURSE_SLUG, locale);
  const [progress, setProgress] = useState({
    overall: 0,
    completedLessons: 0,
    quizPassed: false,
    blockProgress: {} as Record<string, number>,
  });
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const copyResetTimer = useRef<number | null>(null);
  const importResetTimer = useRef<number | null>(null);
  const importProcessedRef = useRef(false);
  const [importState, setImportState] = useState<"idle" | "success" | "error">(
    "idle",
  );

  useEffect(() => {
    const clearUnresolvedView = () => {
      setProgress({
        overall: 0,
        completedLessons: 0,
        quizPassed: false,
        blockProgress: {},
      });
      if (importResetTimer.current !== null) {
        window.clearTimeout(importResetTimer.current);
        importResetTimer.current = null;
      }
      setImportState("idle");
    };
    const refreshResolvedProgress = () => {
      if (getLearningOwnerContext().kind === "unknown") {
        clearUnresolvedView();
        return;
      }
      if (!importProcessedRef.current) {
        importProcessedRef.current = true;
        // Restore progress only after Auth selected anonymous or one verified
        // account namespace. Unknown-owner imports would report false success
        // and then disappear on the owner transition.
        const hash = window.location.hash;
        if (hash.startsWith("#progress=")) {
          const encoded = hash.slice("#progress=".length);
          let success = false;
          try {
            success = importProgress(COURSE_SLUG, encoded);
          } catch {
            // Learner payloads never reach logs or global error handlers.
          }
          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.search}`,
          );
          if (success) {
            setImportState("success");
            importResetTimer.current = window.setTimeout(() => {
              importResetTimer.current = null;
              setImportState("idle");
            }, 3000);
          } else {
            setImportState("error");
          }
        }
      }
      setProgress(refreshProgress(blocks, totalLessons));
    };
    const unsubscribeOwner = subscribeLearningOwner((owner) => {
      if (owner.kind === "unknown") clearUnresolvedView();
    });
    const unsubscribeProgress = subscribe(refreshResolvedProgress);
    return () => {
      unsubscribeOwner();
      unsubscribeProgress();
    };
  }, [blocks, totalLessons]);

  useEffect(
    () => () => {
      if (copyResetTimer.current !== null) {
        window.clearTimeout(copyResetTimer.current);
      }
      if (importResetTimer.current !== null) {
        window.clearTimeout(importResetTimer.current);
      }
    },
    [],
  );

  async function shareProgress(): Promise<void> {
    if (copyResetTimer.current !== null) {
      window.clearTimeout(copyResetTimer.current);
      copyResetTimer.current = null;
    }
    setShareState("idle");
    try {
      const url = buildProgressUrl(
        COURSE_SLUG,
        `${window.location.origin}${localizeHref("/ki-fuehrerschein/kurs", locale)}`,
      );
      if (!url) return;
      if (typeof navigator.clipboard?.writeText !== "function") {
        setShareState("error");
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      copyResetTimer.current = window.setTimeout(() => {
        copyResetTimer.current = null;
        setShareState("idle");
      }, 2000);
    } catch {
      // The URL contains learner progress. Do not forward the clipboard error
      // or URL to console/global handlers.
      setShareState("error");
    }
  }

  const completedBlocks = blocks.filter((b) => {
    const done = progress.blockProgress[b.id] ?? 0;
    return done >= b.lessonIds.length && b.lessonIds.length > 0;
  }).length;

  const clampedOverall = Math.min(100, Math.max(0, progress.overall));
  const allLessonsDone =
    totalLessons > 0 && progress.completedLessons === totalLessons;

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="mx-auto max-w-5xl px-4 pt-10 pb-16 sm:px-6 sm:pt-12">
        <MotionProvider>
          <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          {/* Back link */}
          <Link
            href={localizeHref("/", locale)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.backHome}
          </Link>

          {/* Header */}
          <div>
            <p className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-brand-orange">
              {copy.eyebrow}
            </p>
            <h1 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              {config.title}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {copy.summary(
                blocks.length,
                totalLessons,
                config.recordNoun.label,
              )}
            </p>
            <div className="mt-3 h-px w-10 bg-brand-orange" />
          </div>

          {/* Legal disclaimer */}
          <div className="border border-border/50 bg-card/30 px-5 py-4 text-xs leading-relaxed text-muted-foreground">
            <span className="font-bold uppercase tracking-wider text-muted">
              {copy.noticeLabel}
            </span>
            <span className="mx-2 text-border">|</span>
            {copy.notice}
          </div>

          {/* Import success notification */}
          {importState === "success" && (
            <m.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              role="status"
              className="flex items-center gap-2 border border-brand-sand/30 bg-brand-sand/10 px-4 py-3 text-sm text-foreground"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {copy.importSuccess}
            </m.div>
          )}
          {importState === "error" && (
            <p
              role="alert"
              className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {copy.importError}
            </p>
          )}

          {/* Progress Card */}
          <div className="border border-border bg-card p-6">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-sm font-medium">{copy.overall}</span>
                <p className="font-mono text-3xl font-bold text-brand-orange">
                  {clampedOverall}%
                </p>
              </div>
              <div className="grid w-full grid-cols-3 gap-2 text-sm text-muted-foreground sm:w-auto sm:gap-6">
                <div className="text-center">
                  <div className="font-mono font-semibold text-foreground">
                    {progress.completedLessons}/{totalLessons}
                  </div>
                  <div className="break-words text-xs sm:text-sm">
                    {copy.lessons}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-semibold text-foreground">
                    {completedBlocks}/{blocks.length}
                  </div>
                  <div className="break-words text-xs sm:text-sm">
                    {copy.blocks}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-semibold text-foreground">
                    {progress.quizPassed ? "1" : "0"}/1
                  </div>
                  <div className="break-words text-xs sm:text-sm">
                    {copy.quiz}
                  </div>
                </div>
              </div>
            </div>
            <div
              className="mt-4 h-1.5 bg-border"
              role="progressbar"
              aria-valuenow={clampedOverall}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={copy.progressAria}
            >
              <div
                className="h-full bg-brand-orange transition-[width,background-color] duration-500"
                style={{ width: `${clampedOverall}%` }}
              />
            </div>

            {/* Share progress button */}
            {progress.completedLessons > 0 && (
              <>
                <button
                  type="button"
                  onClick={shareProgress}
                  aria-describedby={
                    shareState === "error"
                      ? "ki-f-progress-share-error"
                      : undefined
                  }
                  className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {shareState === "copied" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-brand-sand" />
                      {copy.shareCopied}
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5" />
                      {copy.share}
                    </>
                  )}
                </button>
                {shareState === "error" && (
                  <p
                    id="ki-f-progress-share-error"
                    role="alert"
                    className="mt-2 text-xs text-destructive"
                  >
                    {copy.shareError}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Block Cards */}
          <div className="space-y-4">
            {blocks.map((block) => {
              const lessonCount = block.lessonIds.length;
              const completedInBlock = progress.blockProgress[block.id] ?? 0;
              const blockDone = completedInBlock >= lessonCount;

              return (
                <div
                  key={block.id}
                  className="group border border-border bg-card transition-[background-color,border-color,color,opacity,transform,box-shadow] duration-200 hover:border-brand-orange/40"
                >
                  <div className="p-6">
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center text-lg font-bold ${
                            blockDone
                              ? "bg-brand-sand/20 text-brand-sand"
                              : "bg-brand-orange text-white"
                          }`}
                        >
                          {blockDone ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            block.orderIndex + 1
                          )}
                        </div>
                        <div className="min-w-0">
                          <h2 className="break-words text-lg font-semibold">
                            {copy.blockLabel(block.orderIndex + 1)}: {block.title}
                          </h2>
                          <p className="mt-0.5 break-words text-sm text-muted-foreground">
                            {block.description}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {copy.minutes(block.durationMinutes)}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span className="font-mono">
                          {completedInBlock}/{lessonCount}
                        </span>
                        {copy.lessons}
                      </div>

                      <Link
                        href={localizeHref(
                          `/ki-fuehrerschein/kurs/${block.id}`,
                          locale,
                        )}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-orange transition-colors hover:text-kupfer-dark"
                      >
                        {completedInBlock > 0
                          ? copy.continue
                          : copy.startBlock}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>

                    {lessonCount > 0 && (
                      <div className="mt-3 h-1 bg-border">
                        <div
                          className="h-full bg-brand-sand transition-[width,background-color] duration-500"
                          style={{
                            width: `${(completedInBlock / lessonCount) * 100}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Workshop Quiz Card */}
            <div
              className={`border border-border ${allLessonsDone ? "bg-card" : "bg-card/50 opacity-60"}`}
            >
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center ${
                      progress.quizPassed
                        ? "bg-brand-sand/20"
                        : allLessonsDone
                          ? "bg-brand-orange"
                          : "bg-border"
                    }`}
                  >
                    <Trophy
                      className={`h-6 w-6 ${
                        progress.quizPassed
                          ? "text-brand-sand"
                          : allLessonsDone
                            ? "text-white"
                            : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {copy.workshopQuiz}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {copy.quizDetails(
                        config.workshopQuizQuestionCount,
                        Math.round(config.workshopQuizPassThreshold * 100),
                        config.workshopQuizTimeLimitMinutes,
                      )}
                    </p>
                  </div>
                </div>
                {allLessonsDone && !progress.quizPassed ? (
                  <Link
                    href={localizeHref("/ki-fuehrerschein/kurs/quiz", locale)}
                    className="mt-4 inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
                  >
                    {copy.startQuiz}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : progress.quizPassed ? (
                  <Link
                    href={localizeHref(
                      "/ki-fuehrerschein/kurs/zertifikat",
                      locale,
                    )}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-orange"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {copy.passedRecord(config.recordNoun.label)}
                  </Link>
                ) : (
                  <p className="mt-3 text-xs text-muted">
                    {copy.locked(totalLessons)}
                  </p>
                )}
              </div>
            </div>
          </div>
          </m.div>
        </MotionProvider>
      </div>
    </div>
  );
}

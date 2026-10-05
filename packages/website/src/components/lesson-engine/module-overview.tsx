"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type JSX } from "react";
import { m } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, Share2 } from "lucide-react";
import type { CourseSlug } from "@/lib/course/types";
import { getCourseConfig } from "@/lib/course/config";
import { buildProgressUrl, importProgress } from "@/lib/course/progress";
import { getEvidenceBackedCompletedLessonIds, subscribe } from "@/lib/progress";
import {
  getLearningOwnerContext,
  subscribeLearningOwner,
} from "@/lib/progress/browser-learning-storage";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { notifyUrlStateChanged } from "@/lib/navigation/url-state";
import { MotionProvider } from "@/components/motion-provider";
import { CourseAssessmentCta } from "@/components/course/kurs/course-assessment-cta";
import { cn } from "@/lib/utils";
import { ProgressRing } from "./progress-ring";
import { CelebrationBurst } from "./celebration-burst";
import { useCalmMotion } from "./use-calm-motion";
import {
  APP_CARD,
  APP_EASE,
  APP_EYEBROW,
  APP_FOCUS,
  APP_GHOST,
  APP_PILL,
  APP_PRIMARY,
  APP_SPRING,
} from "./app-ui";

export interface ModuleOverviewLesson {
  readonly id: string;
  readonly title: string;
  readonly durationMinutes: number;
}

export interface ModuleOverviewModule {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly durationMinutes: number;
  readonly orderIndex: number;
  readonly lessons: readonly ModuleOverviewLesson[];
}

export interface ModuleOverviewProps {
  readonly courseSlug: CourseSlug;
  readonly modules: readonly ModuleOverviewModule[];
  readonly locale?: Locale;
  /** One-line promise under the title. */
  readonly tagline: string;
  /** Scope note (not legal advice etc.). */
  readonly notice: string;
  /**
   * How lesson links are built. "block-hash" (default, block courses):
   * `<coursePath>/<moduleId>#lesson=<lessonId>`. "segment" (one route per
   * lesson, e.g. AI-Native): `<coursePath>/<moduleId>/<lessonId>`.
   */
  readonly lessonLinks?: "block-hash" | "segment";
}

const COPY = {
  de: {
    back: "Zurück zur Kursseite",
    summary: (modules: number, lessons: number, minutes: number) =>
      `${modules} Module · ${lessons} Lektionen · ca. ${minutes} Min.`,
    overall: (done: number, total: number) => `${done} von ${total} Lektionen abgeschlossen`,
    start: "Erste Lektion starten",
    continue: "Weitermachen",
    allDone: "Alle Lektionen geschafft",
    module: (number: number) => `Modul ${number}`,
    moduleRing: (done: number, total: number) => `${done} von ${total} Lektionen in diesem Modul`,
    minutes: (count: number) => `${count} Min.`,
    lessonDone: "abgeschlossen",
    share: "Auf anderem Gerät fortsetzen",
    shareCopied: "Link kopiert. Öffne ihn auf dem anderen Gerät.",
    shareError: "Link konnte nicht kopiert werden.",
    importSuccess: "Fortschritt importiert.",
    importError: "Der Fortschrittslink ist ungültig oder veraltet. Es wurde nichts importiert.",
    eyebrow: "Dein Kurs",
    upNext: "Als Nächstes",
    upNextFirst: "Dein Einstieg",
    nowBadge: "Jetzt",
    statLessons: "Lektionen",
    statModules: "Module fertig",
    statRemaining: "Restzeit ca.",
    remaining: (minutes: number) => `${minutes} Min.`,
    pathLabel: (done: number, total: number) => `Lernpfad: ${done} von ${total} Modulen fertig`,
    moduleShort: (number: number) => `M${number}`,
    path: "Dein Lernpfad",
    toAssessment: "Zum Abschluss",
    allDoneBody: "Alle Übungen erledigt und alle Fragen richtig. Jetzt wartet das Abschlussquiz.",
  },
  en: {
    back: "Back to the course page",
    summary: (modules: number, lessons: number, minutes: number) =>
      `${modules} modules · ${lessons} lessons · about ${minutes} min`,
    overall: (done: number, total: number) => `${done} of ${total} lessons complete`,
    start: "Start the first lesson",
    continue: "Continue",
    allDone: "All lessons complete",
    module: (number: number) => `Module ${number}`,
    moduleRing: (done: number, total: number) => `${done} of ${total} lessons in this module`,
    minutes: (count: number) => `${count} min`,
    lessonDone: "complete",
    share: "Continue on another device",
    shareCopied: "Link copied. Open it on the other device.",
    shareError: "The link could not be copied.",
    importSuccess: "Progress imported.",
    importError: "The progress link is invalid or outdated. Nothing was imported.",
    eyebrow: "Your course",
    upNext: "Up next",
    upNextFirst: "Where you start",
    nowBadge: "Now",
    statLessons: "Lessons",
    statModules: "Modules done",
    statRemaining: "Time left ~",
    remaining: (minutes: number) => `${minutes} min`,
    pathLabel: (done: number, total: number) => `Learning path: ${done} of ${total} modules done`,
    moduleShort: (number: number) => `M${number}`,
    path: "Your learning path",
    toAssessment: "Go to the final step",
    allDoneBody: "Every exercise done and every question right. The final quiz is next.",
  },
} as const;

/**
 * Course hub for lesson-engine courses: overall ring, one "continue" action
 * that deep-links the first unfinished lesson, module cards with progress
 * rings and lesson rows, then the shared final-assessment pathway.
 */
export function ModuleOverview({
  courseSlug,
  modules,
  locale = "de",
  tagline,
  notice,
  lessonLinks = "block-hash",
}: ModuleOverviewProps): JSX.Element {
  const copy = COPY[locale];
  const config = getCourseConfig(courseSlug, locale);
  const [completed, setCompleted] = useState<ReadonlySet<string>>(() => new Set());
  const [resolved, setResolved] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">("idle");
  const [importState, setImportState] = useState<"idle" | "success" | "error">("idle");
  const importProcessed = useRef(false);
  const calm = useCalmMotion();

  useEffect(() => {
    const unsubscribeOwner = subscribeLearningOwner((owner) => {
      if (owner.kind === "unknown") {
        setCompleted(new Set());
        setResolved(false);
      }
    });
    const unsubscribe = subscribe(() => {
      if (getLearningOwnerContext().kind === "unknown") {
        setCompleted(new Set());
        setResolved(false);
        return;
      }
      if (!importProcessed.current) {
        importProcessed.current = true;
        const hash = window.location.hash;
        if (hash.startsWith("#progress=")) {
          let success = false;
          try {
            success = importProgress(courseSlug, hash.slice("#progress=".length));
          } catch {
            // Learner payloads never reach logs.
          }
          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
          notifyUrlStateChanged();
          setImportState(success ? "success" : "error");
        }
      }
      setCompleted(new Set(getEvidenceBackedCompletedLessonIds(courseSlug)));
      setResolved(true);
    });
    return () => {
      unsubscribeOwner();
      unsubscribe();
    };
  }, [courseSlug]);

  const lessons = modules.flatMap((module) =>
    module.lessons.map((lesson) => ({ ...lesson, moduleId: module.id })),
  );
  const total = lessons.length;
  const done = lessons.filter((lesson) => completed.has(lesson.id)).length;
  const minutes = modules.reduce((sum, module) => sum + module.durationMinutes, 0);
  const nextLesson = lessons.find((lesson) => !completed.has(lesson.id));
  const lessonHref = (moduleId: string, lessonId: string) =>
    localizeHref(
      lessonLinks === "segment"
        ? `${config.coursePath}/${moduleId}/${encodeURIComponent(lessonId)}`
        : `${config.coursePath}/${moduleId}#lesson=${encodeURIComponent(lessonId)}`,
      locale,
    );

  const share = async () => {
    setShareState("idle");
    try {
      const url = buildProgressUrl(
        courseSlug,
        `${window.location.origin}${localizeHref(config.coursePath, locale)}`,
      );
      if (!url || typeof navigator.clipboard?.writeText !== "function") {
        setShareState("error");
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareState("copied");
    } catch {
      setShareState("error");
    }
  };

  const nextModule = nextLesson ? modules.find((module) => module.id === nextLesson.moduleId) : undefined;
  const modulesDone = modules.filter(
    (module) => module.lessons.length > 0 && module.lessons.every((lesson) => completed.has(lesson.id)),
  ).length;
  const remainingMinutes = lessons
    .filter((lesson) => !completed.has(lesson.id))
    .reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
  const allDone = total > 0 && done === total;
  // The hero path fills up to the current module's stop, plus the share of
  // that module already done, so the line never runs ahead of the learner.
  const currentModuleIndex = nextModule ? modules.indexOf(nextModule) : modules.length - 1;
  const currentModuleShare =
    nextModule && nextModule.lessons.length > 0
      ? nextModule.lessons.filter((lesson) => completed.has(lesson.id)).length / nextModule.lessons.length
      : 0;
  const pathFraction =
    modules.length > 1
      ? allDone
        ? 1
        : Math.min(1, (currentModuleIndex + currentModuleShare) / (modules.length - 1))
      : allDone
        ? 1
        : 0;

  return (
    <MotionProvider>
      <div className="course-app-ground min-h-[100svh]" data-course-hub={courseSlug}>
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-4 sm:px-6 sm:pt-8">
          <Link href={localizeHref(config.basePath, locale)} className={cn(APP_GHOST, "-ml-3")}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {copy.back}
          </Link>

          <div className="mt-3 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-10">
            {/* Left: hero, stats and the next lesson. Sticky on desktop. */}
            <div className="space-y-4 lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)]">
              <m.section
                initial={calm ? false : { opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: APP_EASE }}
                className="course-app-hero relative overflow-hidden rounded-[28px] border border-lab-line/80 p-5 shadow-lab-lg sm:p-7"
              >
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <p className={APP_EYEBROW}>{copy.eyebrow}</p>
                    <h1 className="mt-1 text-balance break-words text-[1.75rem] font-bold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[2.5rem] lg:text-[2.25rem] xl:text-[2.5rem]">
                      {config.title}
                    </h1>
                  </div>
                  <span className="relative -mb-[18px] -ml-[18px] mt-1 inline-flex shrink-0 origin-top-right scale-[0.8] sm:mb-0 sm:ml-0 sm:scale-100">
                    <ProgressRing
                      fraction={total > 0 ? done / total : 0}
                      size={92}
                      stroke={9}
                      drawIn
                      tone={allDone ? "good" : "accent"}
                      label={copy.overall(done, total)}
                      trackClassName="opacity-70"
                    >
                      <span className="flex flex-col items-center leading-none">
                        <span className="text-[1.625rem] font-bold tracking-[-0.02em]">
                          {total > 0 ? Math.round((done / total) * 100) : 0}%
                        </span>
                      </span>
                    </ProgressRing>
                    <CelebrationBurst play={allDone && resolved} radius={90} />
                  </span>
                </div>
                <p className="mt-3 max-w-[56ch] text-base leading-relaxed text-muted-foreground sm:text-[17px]">{tagline}</p>
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  {copy.summary(modules.length, total, minutes)}
                </p>

                {/* Hero path: the modules as stops on one line that draws itself. */}
                <div
                  role="img"
                  aria-label={copy.pathLabel(modulesDone, modules.length)}
                  data-hero-path
                  className="relative mt-5 rounded-[20px] bg-paper/70 px-4 pb-3 pt-4 ring-1 ring-lab-line/80"
                >
                  <div className="relative flex items-start justify-between">
                    <span aria-hidden="true" className="absolute left-[18px] right-[18px] top-[17px] h-1.5 overflow-hidden rounded-full bg-lab-line/80">
                      <m.span
                        className="block h-full origin-left rounded-full bg-gradient-to-r from-lab-good to-lab-accent"
                        initial={calm ? false : { scaleX: 0 }}
                        animate={{
                          scaleX: pathFraction,
                        }}
                        transition={{ duration: 1.3, ease: APP_EASE, delay: 0.35 }}
                      />
                    </span>
                    {modules.map((module, index) => {
                      const moduleDone = module.lessons.filter((lesson) => completed.has(lesson.id)).length;
                      const complete = moduleDone === module.lessons.length && module.lessons.length > 0;
                      const current = nextLesson?.moduleId === module.id;
                      return (
                        <m.span
                          key={module.id}
                          aria-hidden="true"
                          initial={calm ? false : { scale: 0.3, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.45 + index * 0.16 }}
                          className="relative z-10 flex flex-col items-center gap-1"
                        >
                          <span
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold shadow-lab-sm",
                              complete
                                ? "bg-lab-good text-paper"
                                : current
                                  ? "bg-lab-accent text-paper ring-4 ring-lab-accent/20"
                                  : "bg-card text-muted-foreground ring-2 ring-lab-line",
                            )}
                          >
                            {complete ? <Check className="h-4 w-4" strokeWidth={3} /> : module.orderIndex + 1}
                          </span>
                          <span className={cn("text-[12px] font-semibold", current ? "text-lab-accent" : "text-muted-foreground")}>
                            {copy.moduleShort(module.orderIndex + 1)}
                          </span>
                        </m.span>
                      );
                    })}
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: copy.statLessons, value: `${done}/${total}` },
                    { label: copy.statModules, value: `${modulesDone}/${modules.length}` },
                    { label: copy.statRemaining, value: copy.remaining(remainingMinutes) },
                  ].map((stat) => (
                    <div key={stat.label} className="flex min-w-0 flex-col justify-between rounded-[18px] bg-paper/80 px-3 py-3 ring-1 ring-lab-line/80">
                      {/* The label wraps on a narrow phone instead of being
                          cut to "Module fe…"; the value stays on its line. */}
                      <dt className="text-[12px] font-semibold leading-tight text-muted-foreground [overflow-wrap:anywhere]">{stat.label}</dt>
                      <dd className="mt-0.5 truncate text-lg font-bold tabular-nums tracking-[-0.01em] text-foreground">
                        {stat.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="sr-only" aria-live="polite">
                  {resolved ? copy.overall(done, total) : null}
                </p>
                {importState !== "idle" ? (
                  <p role={importState === "error" ? "alert" : "status"} className={cn("mt-4 rounded-[18px] px-4 py-3 text-sm", importState === "error" ? "bg-lab-bad-soft text-lab-bad" : "bg-lab-good-soft text-lab-good")}>
                    {importState === "error" ? copy.importError : copy.importSuccess}
                  </p>
                ) : null}
              </m.section>

              {/* Next lesson hero card */}
              <m.section
                initial={calm ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...APP_SPRING, delay: 0.12 }}
                aria-labelledby="course-hub-next-heading"
                data-course-next
                className={cn(APP_CARD, "relative overflow-hidden p-5 sm:p-6")}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full bg-lab-accent-soft/70 sm:-right-10 sm:-top-10 sm:h-36 sm:w-36"
                />
                {nextLesson ? (
                  <div className="relative">
                    <p className={APP_EYEBROW}>{done > 0 ? copy.upNext : copy.upNextFirst}</p>
                    <h2 id="course-hub-next-heading" className="mt-1 break-words pr-6 text-xl font-bold leading-snug tracking-[-0.015em] text-foreground sm:text-2xl">
                      {nextLesson.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {nextModule ? (
                        <span className={APP_PILL}>{copy.module(nextModule.orderIndex + 1)}</span>
                      ) : null}
                      <span className={APP_PILL}>
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {copy.minutes(nextLesson.durationMinutes)}
                      </span>
                    </div>
                    <Link
                      href={lessonHref(nextLesson.moduleId, nextLesson.id)}
                      className={cn(APP_PRIMARY, "mt-5 w-full")}
                    >
                      <span className="min-w-0 text-balance">
                        {done > 0 ? `${copy.continue}: ${nextLesson.title}` : copy.start}
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </Link>
                  </div>
                ) : (
                  <div className="relative">
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-lab-good">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      {copy.allDone}
                    </p>
                    <h2 id="course-hub-next-heading" className="mt-1 text-xl font-bold leading-snug tracking-[-0.015em] text-foreground">
                      {copy.allDoneBody}
                    </h2>
                    <a href="#final-assessment" className={cn(APP_PRIMARY, "mt-5 w-full")}>
                      {copy.toAssessment}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                )}
              </m.section>
            </div>

            {/* Right: the module path */}
            <div className="mt-10 lg:mt-0">
              <h2 className="px-1 text-lg font-bold tracking-[-0.01em] text-foreground">{copy.path}</h2>
              <ol className="relative mt-4 space-y-4">
                {/* The path draws itself once, top to bottom. */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-8 left-[25px] top-8 w-1 overflow-hidden rounded-full bg-lab-line/70 sm:left-[27px]"
                >
                  <m.span
                    className="block h-full w-full origin-top rounded-full bg-gradient-to-b from-lab-accent/70 via-lab-accent/40 to-lab-good/50"
                    initial={calm ? false : { scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 1.4, ease: APP_EASE, delay: 0.25 }}
                  />
                </span>
                {modules.map((module, index) => {
                  const moduleDone = module.lessons.filter((lesson) => completed.has(lesson.id)).length;
                  const complete = moduleDone === module.lessons.length && module.lessons.length > 0;
                  const current = nextLesson?.moduleId === module.id;
                  return (
                    <m.li
                      key={module.id}
                      initial={calm ? false : { opacity: 0, x: 28 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...APP_SPRING, delay: 0.3 + index * 0.09 }}
                      data-module-id={module.id}
                      data-module-state={complete ? "complete" : current ? "current" : "open"}
                      className="relative flex min-w-0 gap-3 sm:gap-4"
                    >
                      <span className="relative z-10 shrink-0 pt-4">
                        <span className="inline-flex rounded-full bg-card p-0.5 shadow-lab-sm">
                          <ProgressRing
                            fraction={module.lessons.length ? moduleDone / module.lessons.length : 0}
                            size={48}
                            stroke={5}
                            tone={complete ? "good" : "accent"}
                            label={copy.moduleRing(moduleDone, module.lessons.length)}
                          >
                            {complete ? (
                              <Check className="h-5 w-5 text-lab-good" strokeWidth={2.75} aria-hidden="true" />
                            ) : (
                              <span className="text-[13px]">{moduleDone}/{module.lessons.length}</span>
                            )}
                          </ProgressRing>
                        </span>
                      </span>
                      <div
                        className={cn(
                          APP_CARD,
                          "min-w-0 flex-1 p-4 sm:p-5",
                          current && "ring-2 ring-lab-accent/25",
                        )}
                      >
                        <p className={cn("text-sm font-semibold", complete ? "text-lab-good" : "text-lab-accent")}>
                          {copy.module(module.orderIndex + 1)}
                        </p>
                        <h3 className="mt-0.5 break-words text-lg font-bold leading-snug tracking-[-0.015em] text-foreground sm:text-xl">
                          {module.title}
                        </h3>
                        <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{module.description}</p>
                        <ul className="mt-3 space-y-1">
                          {module.lessons.map((lesson) => {
                            const lessonDone = completed.has(lesson.id);
                            const isNext = nextLesson?.id === lesson.id;
                            return (
                              <li key={lesson.id}>
                                <Link
                                  href={lessonHref(module.id, lesson.id)}
                                  className={cn(
                                    "flex min-h-12 items-center gap-3 rounded-[16px] px-3 py-2 text-[15px] leading-snug text-foreground transition-[background-color] duration-150 hover:bg-lab-accent-soft motion-reduce:transition-none",
                                    isNext && "bg-lab-accent-soft/70",
                                    APP_FOCUS,
                                  )}
                                >
                                  <span
                                    aria-hidden="true"
                                    className={cn(
                                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                                      lessonDone
                                        ? "bg-lab-good text-paper"
                                        : isNext
                                          ? "bg-lab-accent text-paper ring-4 ring-lab-accent/15"
                                          : "bg-card ring-2 ring-lab-line",
                                    )}
                                  >
                                    {lessonDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : isNext ? <span className="h-2 w-2 rounded-full bg-paper" /> : null}
                                  </span>
                                  <span className="min-w-0 flex-1 break-words">
                                    {lesson.title}
                                    {lessonDone ? <span className="sr-only"> ({copy.lessonDone})</span> : null}
                                  </span>
                                  {isNext ? (
                                    <span aria-hidden="true" className="shrink-0 rounded-full bg-lab-accent px-2 py-0.5 text-[12px] font-semibold text-paper">
                                      {copy.nowBadge}
                                    </span>
                                  ) : (
                                    <span className="inline-flex shrink-0 items-center gap-1 text-[13px] text-muted-foreground">
                                      <Clock className="h-3 w-3" aria-hidden="true" />
                                      {copy.minutes(lesson.durationMinutes)}
                                    </span>
                                  )}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </m.li>
                  );
                })}
              </ol>

              <div className="mt-8">
                <CourseAssessmentCta courseSlug={courseSlug} locale={locale} look="app" />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-[70ch] text-xs leading-relaxed text-muted-foreground">{notice}</p>
                {done > 0 ? (
                  <button type="button" onClick={share} className={cn(APP_GHOST, "shrink-0")}>
                    {shareState === "copied" ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
                    {shareState === "copied" ? copy.shareCopied : copy.share}
                  </button>
                ) : null}
              </div>
              {shareState === "error" ? (
                <p role="alert" className="mt-2 text-xs text-lab-bad">
                  {copy.shareError}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </MotionProvider>
  );
}

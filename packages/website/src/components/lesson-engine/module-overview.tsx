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

  return (
    <MotionProvider>
      <div className="min-h-[100svh] bg-background">
        <div className="mx-auto max-w-5xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
          <Link
            href={localizeHref(config.basePath, locale)}
            className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {copy.back}
          </Link>

          {/* Hero */}
          <m.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lab-wash-sky mt-4 rounded-3xl border border-lab-line bg-card p-5 shadow-lab sm:p-8"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-fluid-h1 font-bold text-foreground">{config.title}</h1>
                <p className="mt-2 max-w-[56ch] text-lead text-muted-foreground">{tagline}</p>
                <p className="mt-3 text-sm text-muted-foreground">{copy.summary(modules.length, total, minutes)}</p>
              </div>
              <ProgressRing
                fraction={total > 0 ? done / total : 0}
                size={112}
                stroke={9}
                tone={done === total && total > 0 ? "good" : "accent"}
                label={copy.overall(done, total)}
                className="self-start sm:self-center"
              >
                <span className="text-2xl">{total > 0 ? Math.round((done / total) * 100) : 0}%</span>
              </ProgressRing>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {nextLesson ? (
                <Link
                  href={lessonHref(nextLesson.moduleId, nextLesson.id)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-lab-accent px-6 text-sm font-semibold text-paper shadow-lab-sm transition-[background-color] duration-150 hover:bg-brand-cobalt/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent focus-visible:ring-offset-2"
                >
                  {done > 0 ? `${copy.continue}: ${nextLesson.title}` : copy.start}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-lab-good-soft px-5 text-sm font-semibold text-lab-good">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {copy.allDone}
                </span>
              )}
              <span className="text-sm text-muted-foreground" aria-live="polite">
                {resolved ? copy.overall(done, total) : null}
              </span>
            </div>
            {importState !== "idle" ? (
              <p role={importState === "error" ? "alert" : "status"} className={cn("mt-4 rounded-2xl px-4 py-3 text-sm", importState === "error" ? "bg-lab-bad-soft text-lab-bad" : "bg-lab-good-soft text-lab-good")}>
                {importState === "error" ? copy.importError : copy.importSuccess}
              </p>
            ) : null}
          </m.section>

          {/* Modules */}
          <ol className="mt-8 grid gap-4 md:grid-cols-2">
            {modules.map((module, index) => {
              const moduleDone = module.lessons.filter((lesson) => completed.has(lesson.id)).length;
              const complete = moduleDone === module.lessons.length && module.lessons.length > 0;
              return (
                <m.li
                  key={module.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  data-module-id={module.id}
                  className="flex min-w-0 flex-col rounded-3xl border border-lab-line bg-card p-5 shadow-lab sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-label text-muted-foreground">{copy.module(module.orderIndex + 1)}</p>
                      <h2 className="mt-1 text-xl font-bold tracking-[-0.01em] text-foreground">{module.title}</h2>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{module.description}</p>
                    </div>
                    <ProgressRing
                      fraction={module.lessons.length ? moduleDone / module.lessons.length : 0}
                      size={52}
                      tone={complete ? "good" : "accent"}
                      label={copy.moduleRing(moduleDone, module.lessons.length)}
                    >
                      {complete ? <Check className="h-4 w-4 text-lab-good" aria-hidden="true" /> : `${moduleDone}/${module.lessons.length}`}
                    </ProgressRing>
                  </div>
                  <ul className="mt-4 space-y-1.5">
                    {module.lessons.map((lesson) => {
                      const lessonDone = completed.has(lesson.id);
                      return (
                        <li key={lesson.id}>
                          <Link
                            href={lessonHref(module.id, lesson.id)}
                            className="flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-[15px] text-foreground transition-[background-color] duration-150 hover:bg-lab-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
                                lessonDone ? "border-lab-good bg-lab-good text-paper" : "border-border text-muted-foreground",
                              )}
                            >
                              {lessonDone ? <Check className="h-3.5 w-3.5" /> : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              {lesson.title}
                              {lessonDone ? <span className="sr-only"> ({copy.lessonDone})</span> : null}
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {copy.minutes(lesson.durationMinutes)}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </m.li>
              );
            })}
          </ol>

          <div className="mt-8">
            <CourseAssessmentCta courseSlug={courseSlug} locale={locale} />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-[70ch] text-xs leading-relaxed text-muted-foreground">{notice}</p>
            {done > 0 ? (
              <button
                type="button"
                onClick={share}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm text-muted-foreground transition-colors hover:bg-lab-accent-soft hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
              >
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
    </MotionProvider>
  );
}

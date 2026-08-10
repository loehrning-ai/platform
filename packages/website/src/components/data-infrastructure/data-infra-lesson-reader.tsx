"use client";

import { useEffect, useMemo, useState, type JSX } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Lightbulb, Tag } from "lucide-react";
import { CompletionCertificateCta } from "@/components/course/kurs/completion-certificate-cta";
import { MarkdownRenderer } from "@/components/course/kurs/markdown-renderer";
import {
  RenderWidget,
  resolveWidgetsForSlot,
} from "@/components/widgets/registry";
import {
  markSectionRead,
  markLessonCompleted,
  getReadSectionIds,
  isLessonCompleted,
} from "@/lib/course/progress";
import type { DataInfraLesson } from "@/lib/data-infrastructure/types";
import { subscribe } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { DataInfraBespokeInteractives } from "./bespoke-registry";
import { getDataInfraCourseCopy } from "@/lib/data-infrastructure/course-copy";
import type { Locale } from "@/lib/i18n/locale";

/**
 * DataInfraLessonReader — course-owned content renderer,
 * mirroring `ClaudeLessonReader`'s precedent: plain-markdown sections (this
 * course has no block system, unlike codex), widgets through the shared
 * registry, and an illustrative-model section rendering this lesson's
 * bespoke canvas/SVG widget(s) via `DataInfraBespokeInteractives`.
 */
interface DataInfraLessonReaderProps {
  readonly locale?: Locale;
  readonly lesson: DataInfraLesson;
  readonly totalLessons: number;
  readonly prevHref: string | null;
  readonly nextHref: string | null;
}

export function DataInfraLessonReader({
  locale = "en",
  lesson,
  totalLessons,
  prevHref,
  nextHref,
}: DataInfraLessonReaderProps): JSX.Element {
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(new Set());
  const [completed, setCompleted] = useState(false);
  const [readyLessonId, setReadyLessonId] = useState<string | null>(null);
  const copy = getDataInfraCourseCopy(locale).reader;

  useEffect(() => {
    return subscribe(() => {
      setReadIds(getReadSectionIds("data-infrastructure", lesson.id));
      setCompleted(isLessonCompleted("data-infrastructure", lesson.id));
      setReadyLessonId(lesson.id);
    });
  }, [lesson.id]);

  const progressReady = readyLessonId === lesson.id;

  const widgets = useMemo(() => lesson.widgets ?? [], [lesson.widgets]);
  const afterIntroWidgets = useMemo(
    () => resolveWidgetsForSlot(widgets, "after-intro"),
    [widgets],
  );
  const beforeQuizWidgets = useMemo(
    () => resolveWidgetsForSlot(widgets, "before-quiz"),
    [widgets],
  );
  const endWidgets = useMemo(
    () => resolveWidgetsForSlot(widgets, "end"),
    [widgets],
  );

  const markRead = (sectionId: string) => {
    markSectionRead("data-infrastructure", lesson.id, sectionId);
    setReadIds(getReadSectionIds("data-infrastructure", lesson.id));
  };

  const allSectionsRead = lesson.sections.every((s) => readIds.has(s.id));
  const canCompleteLesson = progressReady && allSectionsRead;
  const lessonCompleted = progressReady && completed;

  const completeLesson = () => {
    markLessonCompleted("data-infrastructure", lesson.id);
    setCompleted(true);
  };

  return (
    <div className="min-w-0">
      <header className="mb-8">
        <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
          {copy.progress(lesson.number, totalLessons)}
        </p>
        <h1 className="break-words text-[28px] font-bold tracking-[-0.03em] text-foreground [overflow-wrap:anywhere] md:text-[34px]">
          {lesson.title}
        </h1>
        <p className="mt-2 break-words text-[16px] leading-[1.5] text-muted-foreground [overflow-wrap:anywhere]">
          {lesson.subtitle}
        </p>
        {lesson.keyConcepts.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <Tag className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            {lesson.keyConcepts.map((concept) => (
              <span
                key={concept}
                className="max-w-full break-words border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground [overflow-wrap:anywhere]"
              >
                {concept}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="space-y-8">
        {lesson.sections.map((section, i) => (
          <div key={section.id}>
            {i > 0 && <div className="mb-8 h-px bg-border" />}
            <div className="space-y-4">
              <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <h2 className="min-w-0 break-words text-[19px] font-semibold text-foreground [overflow-wrap:anywhere]">
                  {section.title}
                </h2>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {copy.duration(section.readTimeMinutes)}
                </span>
              </div>
              <div className="min-w-0 max-w-full [overflow-wrap:anywhere] [&_pre]:max-w-full [&_pre]:overflow-x-auto">
                <MarkdownRenderer content={section.content} />
              </div>
              {section.keyTakeaway && (
                <div className="border-l-2 border-brand-orange bg-brand-orange/5 px-5 py-4">
                  <div className="flex items-start gap-2.5">
                    <Lightbulb
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-brand-orange">
                        {copy.takeaway}
                      </p>
                      <p className="mt-1.5 break-words text-[14px] leading-relaxed text-foreground [overflow-wrap:anywhere]">
                        {section.keyTakeaway}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => markRead(section.id)}
                disabled={!progressReady || readIds.has(section.id)}
                className="inline-flex max-w-full flex-wrap items-center gap-2 break-words text-left text-[13px] font-medium transition-colors [overflow-wrap:anywhere] disabled:cursor-default"
              >
                {readIds.has(section.id) ? (
                  <span className="inline-flex items-center gap-2 text-risk-green">
                    <CheckCircle2 className="h-4 w-4" />
                    {copy.read}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-muted-foreground hover:text-brand-orange">
                    <Circle className="h-4 w-4" />
                    {copy.markRead}
                  </span>
                )}
              </button>
            </div>
            {i === 0 &&
              afterIntroWidgets.map((widget, w) => (
                <WidgetSlot key={`after-intro-${w}`} widget={widget} />
              ))}
          </div>
        ))}

        {[...beforeQuizWidgets, ...endWidgets].map((widget, w) => (
          <WidgetSlot key={`end-${w}`} widget={widget} />
        ))}

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="break-words text-[19px] font-semibold text-foreground [overflow-wrap:anywhere]">
            {copy.simulatorTitle(
              lesson.id === "storage-formats" || lesson.id === "streaming",
            )}
          </h2>
          <p className="mt-1 break-words text-[13.5px] text-muted-foreground [overflow-wrap:anywhere]">
            {copy.simulatorBody}
          </p>
          <div className="mt-5">
            <DataInfraBespokeInteractives
              lessonId={lesson.id}
              locale={locale}
            />
          </div>
        </section>

        <div className="border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {lessonCompleted ? (
              <span className="inline-flex items-center gap-2 text-[14px] font-medium text-risk-green">
                <CheckCircle2 className="h-4 w-4" />
                {copy.completed}
              </span>
            ) : (
              <button
                type="button"
                onClick={completeLesson}
                disabled={!canCompleteLesson}
                className={cn(
                  "inline-flex max-w-full flex-wrap items-center gap-2 break-words border-2 border-foreground px-5 py-2.5 text-left text-[12px] font-bold uppercase tracking-wide [overflow-wrap:anywhere] shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow]",
                  canCompleteLesson
                    ? "bg-brand-orange text-white hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
                    : "cursor-not-allowed bg-border text-muted-foreground shadow-none",
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {copy.complete}
              </button>
            )}
            {nextHref && (
              <Link
                href={nextHref}
                className="inline-flex max-w-full flex-wrap items-center gap-1.5 break-words text-[14px] font-medium text-brand-orange [overflow-wrap:anywhere] transition-colors hover:opacity-80"
              >
                {copy.next}
              </Link>
            )}
          </div>
          {prevHref && (
            <Link
              href={prevHref}
              className="mt-4 inline-flex max-w-full flex-wrap items-center gap-1.5 break-words text-[13px] text-muted-foreground [overflow-wrap:anywhere] transition-colors hover:text-foreground"
            >
              {copy.previous}
            </Link>
          )}
          {!nextHref && (
            <CompletionCertificateCta
              courseSlug="data-infrastructure"
              locale={locale}
              className="mt-6"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function WidgetSlot({
  widget,
}: {
  readonly widget: { kind: string; props?: Readonly<Record<string, unknown>> };
}) {
  return (
    <div data-widget-kind={widget.kind} className="mt-6 min-w-0 max-w-full">
      <RenderWidget kind={widget.kind} props={widget.props ?? {}} />
    </div>
  );
}

export default DataInfraLessonReader;

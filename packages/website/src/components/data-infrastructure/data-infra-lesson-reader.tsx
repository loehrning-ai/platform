"use client";

import { useEffect, useMemo, useState, type JSX } from "react";
import Link from "next/link";
import { Lightbulb, Tag } from "lucide-react";
import { CompletionCertificateCta } from "@/components/course/kurs/completion-certificate-cta";
import { MarkdownRenderer } from "@/components/course/kurs/markdown-renderer";
import {
  LessonProofCheckpoint,
  LessonSectionCheckpoint,
} from "@/components/course/lesson-proof-checkpoint";
import {
  RenderWidget,
  resolveWidgetsForSlot,
} from "@/components/widgets/registry";
import { markSectionRead, getReadSectionIds } from "@/lib/course/progress";
import type { DataInfraLesson } from "@/lib/data-infrastructure/types";
import {
  isEvidenceBackedLessonCompleted,
  recordLessonCompletionEvidenceDurably,
  subscribe,
} from "@/lib/progress";
import { getLearningOwnerContext } from "@/lib/progress/browser-learning-storage";
import {
  getOwnerRequiredHint,
  persistForActiveLearningOwner,
  useOwnerAwareProgressReadiness,
} from "@/components/course/owner-aware-progress";
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
  const [loadedOwnerGeneration, setLoadedOwnerGeneration] = useState<
    number | null
  >(null);
  const copy = getDataInfraCourseCopy(locale).reader;
  const identity = `data-infrastructure:${lesson.id}`;

  useEffect(() => {
    return subscribe(() => {
      const owner = getLearningOwnerContext();
      const resolved = owner.kind !== "unknown";
      setReadIds(
        resolved
          ? getReadSectionIds("data-infrastructure", lesson.id)
          : new Set(),
      );
      setCompleted(
        resolved &&
          isEvidenceBackedLessonCompleted("data-infrastructure", lesson.id),
      );
      setLoadedOwnerGeneration(owner.generation);
      setReadyLessonId(lesson.id);
    });
  }, [lesson.id]);

  const readiness = useOwnerAwareProgressReadiness(
    identity,
    readyLessonId === lesson.id ? identity : null,
    loadedOwnerGeneration,
  );

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
    if (
      persistForActiveLearningOwner(
        () => markSectionRead("data-infrastructure", lesson.id, sectionId),
        () =>
          getReadSectionIds("data-infrastructure", lesson.id).has(sectionId),
      )
    ) {
      setReadIds(getReadSectionIds("data-infrastructure", lesson.id));
    }
  };

  const allSectionsRead = lesson.sections.every((s) => readIds.has(s.id));
  const lessonCompleted = readiness.interactionReady && completed;

  const completeLesson = () => {
    if (
      recordLessonCompletionEvidenceDurably("data-infrastructure", lesson.id)
    ) {
      setCompleted(true);
    }
  };

  return (
    <div key={readiness.checkpointKey} className="min-w-0">
      <header className="mb-6 border-b border-border pb-5">
        <p className="mb-1 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-brand-orange">
          {copy.progress(lesson.number, totalLessons)}
        </p>
        <h1 className="break-words text-[28px] font-bold tracking-[-0.03em] text-foreground [overflow-wrap:anywhere] md:text-[34px]">
          {lesson.title}
        </h1>
        <p className="mt-2 break-words text-[16px] leading-[1.5] text-muted-foreground [overflow-wrap:anywhere]">
          {lesson.subtitle}
        </p>
        {lesson.keyConcepts.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Tag className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {lesson.keyConcepts.map((concept) => (
              <span
                key={concept}
                className="max-w-full break-words border border-border bg-card px-2 py-1 text-[12px] font-medium text-muted-foreground [overflow-wrap:anywhere]"
              >
                {concept}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="space-y-6">
        {lesson.sections.map((section, i) => (
          <div key={section.id}>
            {i > 0 && <div className="mb-6 h-px bg-border" />}
            <div className="space-y-3">
              <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <h2 className="min-w-0 break-words text-[19px] font-semibold text-foreground [overflow-wrap:anywhere]">
                  {section.title}
                </h2>
                <span className="shrink-0 font-mono text-[12px] text-muted-foreground">
                  {copy.duration(section.readTimeMinutes)}
                </span>
              </div>
              <div className="min-w-0 max-w-full [overflow-wrap:anywhere] [&_pre]:max-w-full [&_pre]:overflow-x-auto">
                <MarkdownRenderer content={section.content} />
              </div>
              {section.keyTakeaway && (
                <div className="border-l-2 border-brand-orange bg-brand-orange/5 px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <Lightbulb
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold uppercase tracking-wider text-brand-orange">
                        {copy.takeaway}
                      </p>
                      <p className="mt-1.5 break-words text-[14px] leading-relaxed text-foreground [overflow-wrap:anywhere]">
                        {section.keyTakeaway}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <LessonSectionCheckpoint
                locale={locale}
                checked={readiness.interactionReady && readIds.has(section.id)}
                progressReady={readiness.interactionReady}
                onCheck={() => markRead(section.id)}
              />
            </div>
            {i === 0 &&
              afterIntroWidgets.map((widget, w) => (
                <WidgetSlot
                  key={`after-intro-${w}`}
                  locale={locale}
                  widget={widget}
                />
              ))}
            {i === 0 && (
              <section className="mt-6 border border-border p-4">
                <h2 className="break-words text-[19px] font-semibold text-foreground [overflow-wrap:anywhere]">
                  {copy.simulatorTitle(
                    lesson.id === "storage-formats" ||
                      lesson.id === "streaming",
                  )}
                </h2>
                <p className="mt-1 break-words text-[14px] leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                  {copy.simulatorBody}
                </p>
                <div className="mt-4">
                  <DataInfraBespokeInteractives
                    lessonId={lesson.id}
                    locale={locale}
                  />
                </div>
              </section>
            )}
          </div>
        ))}

        {[...beforeQuizWidgets, ...endWidgets].map((widget, w) => (
          <WidgetSlot key={`end-${w}`} locale={locale} widget={widget} />
        ))}

        <div className="border-t border-border pt-5">
          <LessonProofCheckpoint
            key={readiness.checkpointKey}
            locale={locale}
            completed={lessonCompleted}
            progressReady={readiness.hydrated}
            prerequisitesMet={readiness.ownerReady && allSectionsRead}
            prerequisiteHint={
              !readiness.ownerReady
                ? getOwnerRequiredHint(locale)
                : locale === "de"
                  ? "Bestätige zuerst jeden Abschnitt als geprüft."
                  : "Confirm every section as reviewed first."
            }
            onCommit={completeLesson}
          />
          <nav
            aria-label={locale === "de" ? "Lektionsroute" : "Lesson route"}
            className="mt-4 flex flex-wrap items-center justify-between gap-3"
          >
            {prevHref && (
              <Link
                href={prevHref}
                className="inline-flex min-h-11 max-w-full items-center border-b border-border text-[13px] text-muted-foreground [overflow-wrap:anywhere] transition-colors hover:border-brand-orange hover:text-foreground"
              >
                {copy.previous}
              </Link>
            )}
            {nextHref && (
              <Link
                href={nextHref}
                className="ml-auto inline-flex min-h-11 max-w-full items-center border border-foreground bg-brand-orange px-4 text-[13px] font-semibold text-white [overflow-wrap:anywhere] transition-colors hover:bg-foreground"
              >
                {copy.next}
              </Link>
            )}
          </nav>
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
  locale,
  widget,
}: {
  readonly locale: Locale;
  readonly widget: { kind: string; props?: Readonly<Record<string, unknown>> };
}) {
  return (
    <div data-widget-kind={widget.kind} className="mt-6 min-w-0 max-w-full">
      <RenderWidget
        kind={widget.kind}
        locale={locale}
        props={widget.props ?? {}}
      />
    </div>
  );
}

export default DataInfraLessonReader;

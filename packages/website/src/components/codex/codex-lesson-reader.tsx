"use client";

import { useEffect, useMemo, useState, type JSX } from "react";
import Link from "next/link";
import { Lightbulb, Tag } from "lucide-react";
import { CompletionCertificateCta } from "@/components/course/kurs/completion-certificate-cta";
import {
  LessonProofCheckpoint,
  LessonSectionCheckpoint,
} from "@/components/course/lesson-proof-checkpoint";
import {
  RenderWidget,
  resolveWidgetsForSlot,
} from "@/components/widgets/registry";
import { markSectionRead, getReadSectionIds } from "@/lib/course/progress";
import { getCodexCourseCopy } from "@/lib/codex/course-copy";
import type { CodexLesson } from "@/lib/codex/types";
import type { Locale } from "@/lib/i18n/locale";
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
import { CodexBlockView } from "./codex-blocks";
import { CodexBespokeInteractive } from "./bespoke-registry";

/**
 * CodexLessonReader — bespoke content renderer for the Codex Course,
 * mirroring `ClaudeLessonReader`'s own precedent of a
 * course-owned reader rather than reusing the shared `LessonLayout`
 * directly. Two reasons this course needs its own reader, not just one:
 * `CodexLesson` doesn't satisfy the shared `Lesson` type's `blockId`
 * requirement, AND its sections carry structured `CodexBlock`s (pull-quote
 * / callout / card-grid), not a single markdown string, so it renders
 * `CodexBlockView` per block instead of one `MarkdownRenderer` call.
 */
interface CodexLessonReaderProps {
  readonly locale?: Locale;
  readonly lesson: CodexLesson;
  readonly totalLessons: number;
  readonly prevHref: string | null;
  readonly nextHref: string | null;
}

export function CodexLessonReader({
  locale = "en",
  lesson,
  totalLessons,
  prevHref,
  nextHref,
}: CodexLessonReaderProps): JSX.Element {
  const copy = getCodexCourseCopy(locale).reader;
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(new Set());
  const [completed, setCompleted] = useState(false);
  const [readyLessonId, setReadyLessonId] = useState<string | null>(null);
  const [loadedOwnerGeneration, setLoadedOwnerGeneration] = useState<
    number | null
  >(null);
  const identity = `codex:${lesson.id}`;

  useEffect(() => {
    return subscribe(() => {
      const owner = getLearningOwnerContext();
      const resolved = owner.kind !== "unknown";
      setReadIds(resolved ? getReadSectionIds("codex", lesson.id) : new Set());
      setCompleted(
        resolved && isEvidenceBackedLessonCompleted("codex", lesson.id),
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
        () => markSectionRead("codex", lesson.id, sectionId),
        () => getReadSectionIds("codex", lesson.id).has(sectionId),
      )
    ) {
      setReadIds(getReadSectionIds("codex", lesson.id));
    }
  };

  const allSectionsRead = lesson.sections.every((s) => readIds.has(s.id));
  const lessonCompleted = readiness.interactionReady && completed;

  const completeLesson = () => {
    if (recordLessonCompletionEvidenceDurably("codex", lesson.id)) {
      setCompleted(true);
    }
  };

  return (
    <div key={readiness.checkpointKey} className="min-w-0">
      <header className="mb-6 min-w-0 border-b border-border pb-5">
        <p className="mb-1 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-brand-orange">
          {copy.progress(lesson.number, totalLessons)}
        </p>
        <h1 className="break-words text-[28px] font-bold tracking-[-0.03em] text-foreground md:text-[34px]">
          {lesson.title}
        </h1>
        <p className="mt-2 text-[16px] leading-[1.5] text-muted-foreground">
          {lesson.subtitle}
        </p>
        {lesson.keyConcepts.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Tag className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {lesson.keyConcepts.map((concept) => (
              <span
                key={concept}
                className="border border-border bg-card px-2 py-1 text-[12px] font-medium text-muted-foreground"
              >
                {concept}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="min-w-0 space-y-6">
        {lesson.sections.map((section, i) => (
          <div key={section.id} className="min-w-0">
            {i > 0 && <div className="mb-6 h-px bg-border" />}
            <div className="min-w-0 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <h2 className="min-w-0 break-words text-[19px] font-semibold text-foreground">
                  {section.title}
                </h2>
                <span className="shrink-0 font-mono text-[12px] text-muted-foreground">
                  {copy.duration(section.readTimeMinutes)}
                </span>
              </div>
              <div className="min-w-0 space-y-4">
                {section.blocks.map((block, b) => (
                  <CodexBlockView key={b} block={block} />
                ))}
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
                      <p className="mt-1.5 text-[14px] leading-relaxed text-foreground">
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
                <h2 className="text-[19px] font-semibold text-foreground">
                  {copy.practiceTitle}
                </h2>
                <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                  {copy.practiceBody}
                </p>
                <div className="mt-4 min-w-0">
                  <CodexBespokeInteractive
                    locale={locale}
                    lessonId={lesson.id}
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
                className="inline-flex min-h-11 items-center border-b border-border text-[13px] text-muted-foreground transition-colors hover:border-brand-orange hover:text-foreground"
              >
                {copy.previous}
              </Link>
            )}
            {nextHref && (
              <Link
                href={nextHref}
                className="ml-auto inline-flex min-h-11 items-center border border-foreground bg-brand-orange px-4 text-[13px] font-semibold text-white transition-colors hover:bg-foreground"
              >
                {copy.next}
              </Link>
            )}
          </nav>
          {!nextHref && (
            <CompletionCertificateCta
              courseSlug="codex"
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
    <div
      data-widget-kind={widget.kind}
      className="mt-6 min-w-0 max-w-full [&_*]:min-w-0 [&_button>span:last-child]:break-words [&_p]:break-words"
    >
      <RenderWidget
        locale={locale}
        kind={widget.kind}
        props={widget.props ?? {}}
      />
    </div>
  );
}

export default CodexLessonReader;

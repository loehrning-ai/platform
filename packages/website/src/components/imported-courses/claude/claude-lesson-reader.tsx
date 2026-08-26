"use client";

import { useEffect, useMemo, useState, type JSX } from "react";
import Link from "next/link";
import { Lightbulb, Tag } from "lucide-react";
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
import type { ClaudeLesson } from "@/lib/claude-course/types";
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
import { ClaudeWidgetLocaleProvider } from "@/components/widgets/claude/locale-context";

/**
 * ClaudeLessonReader, bespoke content renderer for the Claude Course
 *, mirroring AI-Native's own precedent of a course-owned
 * reader component rather than reusing `LessonContent`, whose course-specific
 * chrome has no copy override. Widgets render through the shared,
 * kind-agnostic registry.
 */
interface ClaudeLessonReaderProps {
  readonly lesson: ClaudeLesson;
  readonly totalLessons: number;
  readonly prevHref: string | null;
  readonly nextHref: string | null;
  readonly locale: Locale;
}

const READER_COPY = {
  de: {
    lessonProgress: (current: number, total: number) =>
      `Lektion ${current} von ${total}`,
    minute: "Min.",
    takeaway: "Kernaussage",
    prerequisite: "Bestätige zuerst jeden Abschnitt als geprüft.",
    route: "Lektionsroute",
    next: "Nächste Lektion →",
    previous: "← Vorherige Lektion",
  },
  en: {
    lessonProgress: (current: number, total: number) =>
      `Lesson ${current} of ${total}`,
    minute: "min",
    takeaway: "Key takeaway",
    prerequisite: "Confirm every section as reviewed first.",
    route: "Lesson route",
    next: "Next lesson →",
    previous: "← Previous lesson",
  },
} as const;

export function ClaudeLessonReader({
  lesson,
  totalLessons,
  prevHref,
  nextHref,
  locale,
}: ClaudeLessonReaderProps): JSX.Element {
  const copy = READER_COPY[locale];
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(new Set());
  const [completed, setCompleted] = useState(false);
  const [readyLessonId, setReadyLessonId] = useState<string | null>(null);
  const [loadedOwnerGeneration, setLoadedOwnerGeneration] = useState<
    number | null
  >(null);
  const identity = `claude:${lesson.id}`;

  useEffect(() => {
    return subscribe(() => {
      const owner = getLearningOwnerContext();
      const resolved = owner.kind !== "unknown";
      setReadIds(resolved ? getReadSectionIds("claude", lesson.id) : new Set());
      setCompleted(
        resolved && isEvidenceBackedLessonCompleted("claude", lesson.id),
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
        () => markSectionRead("claude", lesson.id, sectionId),
        () => getReadSectionIds("claude", lesson.id).has(sectionId),
      )
    ) {
      setReadIds(getReadSectionIds("claude", lesson.id));
    }
  };

  const allSectionsRead = lesson.sections.every((s) => readIds.has(s.id));
  const lessonCompleted = readiness.interactionReady && completed;

  const completeLesson = () => {
    if (recordLessonCompletionEvidenceDurably("claude", lesson.id)) {
      setCompleted(true);
    }
  };

  return (
    <ClaudeWidgetLocaleProvider locale={locale}>
      <div key={readiness.checkpointKey} lang={locale} className="min-w-0">
        <header className="mb-6 border-b border-border pb-5">
          <p className="mb-1 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-brand-orange">
            {copy.lessonProgress(lesson.number, totalLessons)}
          </p>
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-foreground md:text-[34px]">
            {lesson.title}
          </h1>
          <p className="mt-2 text-[16px] leading-[1.5] text-muted-foreground">
            {lesson.subtitle}
          </p>
          {lesson.keyConcepts.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Tag
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
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

        <div className="space-y-6">
          {lesson.sections.map((section, i) => (
            <div key={section.id}>
              {i > 0 && <div className="mb-6 h-px bg-border" />}
              <div className="space-y-3">
                <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <h2 className="break-words text-[19px] font-semibold text-foreground">
                    {section.title}
                  </h2>
                  <span className="shrink-0 font-mono text-[12px] text-muted-foreground">
                    ~{section.readTimeMinutes} {copy.minute}
                  </span>
                </div>
                <MarkdownRenderer content={section.content} />
                {section.keyTakeaway && (
                  <div className="border-l-2 border-brand-orange bg-brand-orange/5 px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <Lightbulb
                        className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange"
                        aria-hidden="true"
                      />
                      <div>
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
                  checked={
                    readiness.interactionReady && readIds.has(section.id)
                  }
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
                readiness.ownerReady
                  ? copy.prerequisite
                  : getOwnerRequiredHint(locale)
              }
              onCommit={completeLesson}
            />
            <nav
              aria-label={copy.route}
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
          </div>
        </div>
      </div>
    </ClaudeWidgetLocaleProvider>
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
    <div data-widget-kind={widget.kind} className="mt-6">
      <RenderWidget
        kind={widget.kind}
        locale={locale}
        props={widget.props ?? {}}
      />
    </div>
  );
}

export default ClaudeLessonReader;

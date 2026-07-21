"use client";

import { useEffect, useMemo, useState, type JSX } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Lightbulb, Tag } from "lucide-react";
import { MarkdownRenderer } from "@/components/course/kurs/markdown-renderer";
import { RenderWidget, resolveWidgetsForSlot } from "@/components/widgets/registry";
import {
  markSectionRead,
  markLessonCompleted,
  getReadSectionIds,
  isLessonCompleted,
} from "@/lib/course/progress";
import type { DataInfraLesson } from "@/lib/data-infrastructure/types";
import { cn } from "@/lib/utils";
import { DataInfraBespokeInteractives } from "./bespoke-registry";

/**
 * DataInfraLessonReader — course-owned content renderer (plan 010 stage 10),
 * mirroring `ClaudeLessonReader`'s precedent: plain-markdown sections (this
 * course has no block system, unlike codex), widgets through the shared
 * registry, and a fixed "live simulators" section rendering this lesson's
 * bespoke canvas/SVG widget(s) via `DataInfraBespokeInteractives`.
 */
interface DataInfraLessonReaderProps {
  readonly lesson: DataInfraLesson;
  readonly totalLessons: number;
  readonly prevHref: string | null;
  readonly nextHref: string | null;
}

export function DataInfraLessonReader({
  lesson,
  totalLessons,
  prevHref,
  nextHref,
}: DataInfraLessonReaderProps): JSX.Element {
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(new Set());
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setReadIds(getReadSectionIds("data-infrastructure", lesson.id));
    setCompleted(isLessonCompleted("data-infrastructure", lesson.id));
  }, [lesson.id]);

  const widgets = useMemo(() => lesson.widgets ?? [], [lesson.widgets]);
  const afterIntroWidgets = useMemo(() => resolveWidgetsForSlot(widgets, "after-intro"), [widgets]);
  const beforeQuizWidgets = useMemo(() => resolveWidgetsForSlot(widgets, "before-quiz"), [widgets]);
  const endWidgets = useMemo(() => resolveWidgetsForSlot(widgets, "end"), [widgets]);

  const markRead = (sectionId: string) => {
    markSectionRead("data-infrastructure", lesson.id, sectionId);
    setReadIds(getReadSectionIds("data-infrastructure", lesson.id));
  };

  const allSectionsRead = lesson.sections.every((s) => readIds.has(s.id));

  const completeLesson = () => {
    markLessonCompleted("data-infrastructure", lesson.id);
    setCompleted(true);
  };

  return (
    <div>
      <header className="mb-8">
        <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
          Lesson {lesson.number} of {totalLessons}
        </p>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-foreground md:text-[34px]">{lesson.title}</h1>
        <p className="mt-2 text-[16px] leading-[1.5] text-muted-foreground">{lesson.subtitle}</p>
        {lesson.keyConcepts.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <Tag className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            {lesson.keyConcepts.map((concept) => (
              <span
                key={concept}
                className="border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
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
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-[19px] font-semibold text-foreground">{section.title}</h2>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  ~{section.readTimeMinutes} min
                </span>
              </div>
              <MarkdownRenderer content={section.content} />
              {section.keyTakeaway && (
                <div className="border-l-2 border-brand-orange bg-brand-orange/5 px-5 py-4">
                  <div className="flex items-start gap-2.5">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange" aria-hidden="true" />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-brand-orange">
                        Key takeaway
                      </p>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-foreground">{section.keyTakeaway}</p>
                    </div>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => markRead(section.id)}
                disabled={readIds.has(section.id)}
                className="inline-flex items-center gap-2 text-[13px] font-medium transition-colors disabled:cursor-default"
              >
                {readIds.has(section.id) ? (
                  <span className="inline-flex items-center gap-2 text-[#22c55e]">
                    <CheckCircle2 className="h-4 w-4" />
                    Read
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-muted-foreground hover:text-brand-orange">
                    <Circle className="h-4 w-4" />
                    Mark as read
                  </span>
                )}
              </button>
            </div>
            {i === 0 &&
              afterIntroWidgets.map((widget, w) => <WidgetSlot key={`after-intro-${w}`} widget={widget} />)}
          </div>
        ))}

        {[...beforeQuizWidgets, ...endWidgets].map((widget, w) => (
          <WidgetSlot key={`end-${w}`} widget={widget} />
        ))}

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-[19px] font-semibold text-foreground">Live simulator{lesson.id === "storage-formats" || lesson.id === "streaming" ? "s" : ""}</h2>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            A hands-on simulation for this lesson. Click around and feel the shape of the concept.
          </p>
          <div className="mt-5">
            <DataInfraBespokeInteractives lessonId={lesson.id} />
          </div>
        </section>

        <div className="border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {completed ? (
              <span className="inline-flex items-center gap-2 text-[14px] font-medium text-[#22c55e]">
                <CheckCircle2 className="h-4 w-4" />
                Lesson complete
              </span>
            ) : (
              <button
                type="button"
                onClick={completeLesson}
                disabled={!allSectionsRead}
                className={cn(
                  "inline-flex items-center gap-2 border-2 border-foreground px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow]",
                  allSectionsRead
                    ? "bg-brand-orange text-white hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
                    : "cursor-not-allowed bg-border text-muted-foreground shadow-none",
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Complete lesson
              </button>
            )}
            {nextHref && (
              <Link
                href={nextHref}
                className="inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-orange transition-colors hover:opacity-80"
              >
                Next lesson →
              </Link>
            )}
          </div>
          {prevHref && (
            <Link
              href={prevHref}
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Previous lesson
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function WidgetSlot({ widget }: { readonly widget: { kind: string; props?: Readonly<Record<string, unknown>> } }) {
  return (
    <div data-widget-kind={widget.kind} className="mt-6">
      <RenderWidget kind={widget.kind} props={widget.props ?? {}} />
    </div>
  );
}

export default DataInfraLessonReader;

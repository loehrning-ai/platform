"use client";

import {
  useMemo,
  useState,
  useCallback,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { m, AnimatePresence } from "framer-motion";
import { BookOpen, HelpCircle, ArrowRight, CheckCircle2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionReader } from "./section-reader";
import { LessonQuiz } from "./lesson-quiz";
import { RenderWidget, resolveWidgetsForSlot } from "@/components/widgets/registry";
import { LessonProgressRing } from "@/components/progress/lesson-progress-ring";
import type { CourseSlug, Lesson } from "@/lib/course/types";
import type { Widget } from "@/lib/widgets/types";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
type Tab = "lernen" | "quiz";

interface LessonContentProps {
  readonly courseSlug: CourseSlug;
  readonly lesson: Lesson;
  readonly totalLessons: number;
  readonly readSectionIds: ReadonlySet<string>;
  readonly isCompleted: boolean;
  readonly quizBestScore: { score: number; total: number } | null;
  readonly hasNextLesson: boolean;
  readonly onMarkSectionRead: (sectionId: string) => void;
  readonly onMarkLessonComplete: () => void;
  readonly onQuizComplete: (score: number, total: number) => void;
  readonly onNextLesson: () => void;
}

export function LessonContent({
  courseSlug,
  lesson,
  totalLessons,
  readSectionIds,
  isCompleted,
  quizBestScore,
  hasNextLesson,
  onMarkSectionRead,
  onMarkLessonComplete,
  onQuizComplete,
  onNextLesson,
}: LessonContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>("lernen");
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const allSectionsRead = lesson.sections.every((s) => readSectionIds.has(s.id));
  const hasQuiz = lesson.quiz.length > 0;

  // Interactive widgets (shared course architecture). The widget registry is shared
  // across all three courses; KI-Führerschein lessons declare them in their
  // block JSON. "after-intro" renders below the first section, "before-quiz"
  // and "end" both render just above the completion bar (the free-course
  // reader has no separate quiz pane in the "lernen" tab).
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

  const handleQuizComplete = useCallback(
    (score: number, total: number) => onQuizComplete(score, total),
    [onQuizComplete],
  );

  const selectTab = (tab: Tab) => {
    setActiveTab(tab);
    tabRefs.current[tab]?.focus();
  };

  const handleTabKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    tab: Tab,
  ) => {
    const tabs: Tab[] = hasQuiz ? ["lernen", "quiz"] : ["lernen"];
    const current = tabs.indexOf(tab);
    let next: Tab | undefined;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = tabs[(current + 1) % tabs.length];
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = tabs[(current - 1 + tabs.length) % tabs.length];
    } else if (event.key === "Home") {
      next = tabs[0];
    } else if (event.key === "End") {
      next = tabs[tabs.length - 1];
    }
    if (!next) return;
    event.preventDefault();
    selectTab(next);
  };

  return (
    <div>
      {/* Lesson Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 font-mono text-xs font-bold uppercase tracking-wider text-brand-orange">
            Lektion {lesson.number} von {totalLessons}
          </p>
          <h2 className="text-2xl font-bold tracking-[-0.03em]">{lesson.title}</h2>
          {lesson.subtitle && <p className="mt-1 text-muted-foreground">{lesson.subtitle}</p>}

          {lesson.keyConcepts.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {lesson.keyConcepts.map((concept) => (
                <span key={concept} className="border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {concept}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Progress ring (shared course architecture): fills as sections are read,
            ported from AI-Native to the two free courses. */}
        <LessonProgressRing
          courseSlug={courseSlug}
          lessonId={lesson.id}
          totalSections={lesson.sections.length}
          className="shrink-0"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border" role="tablist" aria-label="Lektionsinhalt">
        <button
          ref={(element) => {
            tabRefs.current.lernen = element;
          }}
          type="button"
          role="tab"
          aria-selected={activeTab === "lernen"}
          aria-controls="tabpanel-lernen"
          id="tab-lernen"
          tabIndex={activeTab === "lernen" ? 0 : -1}
          onClick={() => setActiveTab("lernen")}
          onKeyDown={(event) => handleTabKeyDown(event, "lernen")}
          className={cn(
            "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
            activeTab === "lernen" ? "border-brand-orange text-brand-orange" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <BookOpen className="h-4 w-4" />
          Lernen
        </button>
        {hasQuiz && (
          <button
            ref={(element) => {
              tabRefs.current.quiz = element;
            }}
            type="button"
            role="tab"
            aria-selected={activeTab === "quiz"}
            aria-controls="tabpanel-quiz"
            id="tab-quiz"
            tabIndex={activeTab === "quiz" ? 0 : -1}
            onClick={() => setActiveTab("quiz")}
            onKeyDown={(event) => handleTabKeyDown(event, "quiz")}
            className={cn(
              "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === "quiz" ? "border-brand-orange text-brand-orange" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <HelpCircle className="h-4 w-4" />
            Quiz ({lesson.quiz.length})
          </button>
        )}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "lernen" ? (
          <m.div
            key="lernen"
            id="tabpanel-lernen"
            role="tabpanel"
            aria-labelledby="tab-lernen"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
            className="space-y-8"
          >
            {lesson.sections.map((section, i) => (
              <div key={section.id}>
                {i > 0 && <div className="mb-8 h-px bg-border" />}
                <SectionReader section={section} isRead={readSectionIds.has(section.id)} onMarkRead={onMarkSectionRead} />
                {/* after-intro widgets render below the first section */}
                {i === 0 &&
                  afterIntroWidgets.map((widget, w) => (
                    <WidgetSlot key={`ai-${w}`} widget={widget} label="after-intro" />
                  ))}
              </div>
            ))}

            {/* before-quiz + end widgets render after the prose, above the
                completion bar (no separate quiz pane in the lernen tab) */}
            {[...beforeQuizWidgets, ...endWidgets].map((widget, w) => (
              <WidgetSlot key={`end-${w}`} widget={widget} label="end" />
            ))}

            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between gap-4">
                {isCompleted ? (
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-sand">
                    <CheckCircle2 className="h-4 w-4" />
                    Lektion abgeschlossen
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onMarkLessonComplete}
                    disabled={!allSectionsRead}
                    className={cn(
                      "inline-flex items-center gap-2 border-2 border-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-wide shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow]",
                      allSectionsRead
                        ? "bg-brand-orange text-white hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
                        : "cursor-not-allowed bg-border text-muted-foreground shadow-none",
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Lektion abschließen
                  </button>
                )}
                {hasNextLesson && (
                  <button
                    type="button"
                    onClick={onNextLesson}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-orange transition-colors hover:text-kupfer-dark"
                  >
                    Nächste Lektion
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </m.div>
        ) : (
          <m.div
            key="quiz"
            id="tabpanel-quiz"
            role="tabpanel"
            aria-labelledby="tab-quiz"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
          >
            <LessonQuiz questions={lesson.quiz} bestScore={quizBestScore} onComplete={handleQuizComplete} />
          </m.div>
        )}
      </AnimatePresence>

      {/* Legal footer */}
      <p className="mt-8 border-t border-border/50 pt-4 text-[10px] leading-relaxed text-muted">
        Alle Angaben nach bestem Wissen, Stand April 2026. Keine Rechtsberatung.
      </p>
    </div>
  );
}

/** Render a single embedded widget via the shared registry (shared course architecture). */
function WidgetSlot({
  widget,
  label,
}: {
  readonly widget: Widget;
  readonly label: string;
}) {
  return (
    <div data-widget-slot={label} data-widget-kind={widget.kind} className="mt-6">
      <RenderWidget kind={widget.kind} props={widget.props ?? {}} />
    </div>
  );
}

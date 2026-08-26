"use client";

import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { m, AnimatePresence } from "framer-motion";
import { BookOpen, HelpCircle, ArrowRight, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionReader } from "./section-reader";
import { LessonQuiz } from "./lesson-quiz";
import { LessonProofCheckpoint } from "@/components/course/lesson-proof-checkpoint";
import {
  RenderWidget,
  resolveWidgetsForSlot,
} from "@/components/widgets/registry";
import { LessonProgressRing } from "@/components/progress/lesson-progress-ring";
import type { CourseSlug, Lesson } from "@/lib/course/types";
import type { Widget } from "@/lib/widgets/types";
import type { Locale } from "@/lib/i18n/locale";
import { localizeCourseWidgetProps } from "@/lib/course/widget-localization";
import { getCourseReaderCopy } from "./course-ui-copy";
import { getOwnerRequiredHint } from "@/components/course/owner-aware-progress";
import { notifyUrlStateChanged } from "@/lib/navigation/url-state";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
type Tab = "lernen" | "quiz";

interface LessonContentProps {
  readonly courseSlug: CourseSlug;
  readonly lesson: Lesson;
  readonly totalLessons: number;
  readonly progressReady: boolean;
  readonly progressHydrated: boolean;
  readonly ownerReady: boolean;
  readonly checkpointKey: string;
  readonly readSectionIds: ReadonlySet<string>;
  readonly isCompleted: boolean;
  readonly quizBestScore: { score: number; total: number } | null;
  readonly hasNextLesson: boolean;
  readonly onMarkSectionRead: (sectionId: string) => void;
  readonly onMarkLessonComplete: () => void;
  readonly onQuizComplete: (score: number, total: number) => void;
  readonly onNextLesson: () => void;
  readonly locale?: Locale;
}

export function LessonContent({
  courseSlug,
  lesson,
  totalLessons,
  progressReady,
  progressHydrated,
  ownerReady,
  checkpointKey,
  readSectionIds,
  isCompleted,
  quizBestScore,
  hasNextLesson,
  onMarkSectionRead,
  onMarkLessonComplete,
  onQuizComplete,
  onNextLesson,
  locale = "de",
}: LessonContentProps) {
  const copy = getCourseReaderCopy(locale).lesson;
  const [activeTab, setActiveTab] = useState<Tab>("lernen");
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const allSectionsRead = lesson.sections.every((s) =>
    readSectionIds.has(s.id),
  );
  const hasQuiz = lesson.quiz.length > 0;
  const knowledgeCheckComplete = !hasQuiz || quizBestScore !== null;
  const completionPrerequisitesMet = allSectionsRead && knowledgeCheckComplete;
  const completionPrerequisiteHint = !allSectionsRead
    ? locale === "de"
      ? "Bestätige zuerst jeden Abschnitt als geprüft."
      : "Confirm every section as reviewed first."
    : locale === "de"
      ? "Schließe zuerst den Verständnis-Check ab."
      : "Complete the knowledge check first.";

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

  useEffect(() => {
    const syncFromLocation = () => {
      const requested = new URLSearchParams(window.location.search).get("tab");
      setActiveTab(requested === "quiz" && hasQuiz ? "quiz" : "lernen");
    };

    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, [hasQuiz]);

  const selectTab = (tab: Tab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === "quiz") {
      url.searchParams.set("tab", "quiz");
    } else {
      url.searchParams.delete("tab");
    }
    const nextHref = `${url.pathname}${url.search}${url.hash}`;
    const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextHref !== currentHref) {
      window.history.pushState(window.history.state, "", nextHref);
      notifyUrlStateChanged();
    }
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
            {copy.position(lesson.number, totalLessons)}
          </p>
          <h2 className="break-words text-2xl font-bold tracking-[-0.03em]">
            {lesson.title}
          </h2>
          {lesson.subtitle && (
            <p className="mt-1 break-words text-muted-foreground">
              {lesson.subtitle}
            </p>
          )}

          {lesson.keyConcepts.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {lesson.keyConcepts.map((concept) => (
                <span
                  key={concept}
                  className="border border-border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
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
          locale={locale}
        />
      </div>

      {/* Tabs */}
      <div
        className="mb-6 flex gap-1 border-b border-border"
        role="tablist"
        aria-label={copy.tablist}
      >
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
          onClick={() => selectTab("lernen")}
          onKeyDown={(event) => handleTabKeyDown(event, "lernen")}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
            activeTab === "lernen"
              ? "border-brand-orange text-brand-orange"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          {copy.learn}
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
            onClick={() => selectTab("quiz")}
            onKeyDown={(event) => handleTabKeyDown(event, "quiz")}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === "quiz"
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            {copy.quiz} ({lesson.quiz.length})
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
                <SectionReader
                  section={section}
                  isRead={readSectionIds.has(section.id)}
                  interactionReady={progressReady}
                  onMarkRead={onMarkSectionRead}
                  locale={locale}
                />
                {/* after-intro widgets render below the first section */}
                {i === 0 &&
                  afterIntroWidgets.map((widget, w) => (
                    <WidgetSlot
                      key={`ai-${w}`}
                      widget={widget}
                      label="after-intro"
                      locale={locale}
                    />
                  ))}
              </div>
            ))}

            {/* before-quiz + end widgets render after the prose, above the
                completion bar (no separate quiz pane in the lernen tab) */}
            {[...beforeQuizWidgets, ...endWidgets].map((widget, w) => (
              <WidgetSlot
                key={`end-${w}`}
                widget={widget}
                label="end"
                locale={locale}
              />
            ))}

            <div className="border-t border-border pt-6">
              <LessonProofCheckpoint
                key={checkpointKey}
                locale={locale}
                completed={progressReady && isCompleted}
                progressReady={progressHydrated}
                prerequisitesMet={ownerReady && completionPrerequisitesMet}
                prerequisiteHint={
                  ownerReady
                    ? completionPrerequisiteHint
                    : getOwnerRequiredHint(locale)
                }
                onCommit={onMarkLessonComplete}
              />
              {hasNextLesson && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={onNextLesson}
                    className="inline-flex min-h-11 items-center gap-1.5 border-b border-border text-sm font-medium text-brand-orange transition-colors hover:border-brand-orange hover:text-kupfer-dark"
                  >
                    {copy.next}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}
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
            <LessonQuiz
              questions={lesson.quiz}
              bestScore={quizBestScore}
              onComplete={handleQuizComplete}
              locale={locale}
            />
          </m.div>
        )}
      </AnimatePresence>

      {/* Legal footer */}
      <p className="mt-8 border-t border-border/50 pt-4 text-xs leading-relaxed text-muted">
        {copy.legalNote}
      </p>
    </div>
  );
}

/** Render a single embedded widget via the shared registry (shared course architecture). */
function WidgetSlot({
  widget,
  label,
  locale,
}: {
  readonly widget: Widget;
  readonly label: string;
  readonly locale: Locale;
}) {
  const props = localizeCourseWidgetProps(widget, locale);
  return (
    <div
      data-widget-slot={label}
      data-widget-kind={widget.kind}
      className="mt-6"
    >
      <RenderWidget kind={widget.kind} props={props} locale={locale} />
    </div>
  );
}

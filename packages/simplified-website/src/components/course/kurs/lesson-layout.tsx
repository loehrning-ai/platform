"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { m } from "framer-motion";
import { Menu, X } from "lucide-react";
import { LessonSidebar } from "./lesson-sidebar";
import { LessonContent } from "./lesson-content";
import {
  markSectionRead,
  markLessonCompleted,
  saveLessonQuizScore,
  getCompletedLessonIds,
  getReadSectionIds,
  getLessonQuizScore,
} from "@/lib/course/progress";
import type { CourseSlug, Lesson } from "@/lib/course/types";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import type { BlockFreshness } from "@/lib/course/data";
import { useFocusTrap } from "@/lib/a11y/use-focus-trap";

interface LessonLayoutProps {
  readonly courseSlug: CourseSlug;
  readonly lessons: readonly Lesson[];
  readonly blockTitle: string;
  readonly freshnessMeta?: BlockFreshness | null;
}

export function LessonLayout({ courseSlug, lessons, freshnessMeta }: LessonLayoutProps) {
  const [activeLessonId, setActiveLessonId] = useState(lessons[0]?.id ?? "");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const sidebarRef = useFocusTrap<HTMLElement>(sidebarOpen, closeSidebar);
  const layoutRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // Keep sibling content behind the mobile drawer out of the accessibility tree.
  useEffect(() => {
    const layout = layoutRef.current;
    const drawer = sidebarRef.current;
    const toggle = toggleButtonRef.current;
    if (!sidebarOpen || !layout || !drawer) return;

    const toInert = Array.from(layout.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        el !== drawer &&
        !el.contains(drawer) &&
        !el.contains(toggle),
    );
    for (const el of toInert) {
      el.setAttribute("inert", "");
    }

    return () => {
      for (const el of toInert) {
        el.removeAttribute("inert");
      }
    };
  }, [sidebarOpen, sidebarRef]);

  // Hydrate progress from localStorage (client-side only)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [quizScores, setQuizScores] = useState<Record<string, { score: number; total: number }>>(
    {},
  );

  // Load from localStorage after mount
  useEffect(() => {
    setCompletedIds(new Set(getCompletedLessonIds(courseSlug)));
    setReadIds(new Set(getReadSectionIds(courseSlug, activeLessonId)));
    const score = getLessonQuizScore(courseSlug, activeLessonId);
    if (score) {
      setQuizScores((prev) => ({ ...prev, [activeLessonId]: score }));
    }
  }, [courseSlug, activeLessonId]);

  const activeLesson = lessons.find((l) => l.id === activeLessonId);
  const activeLessonIndex = lessons.findIndex((l) => l.id === activeLessonId);
  const hasNextLesson = activeLessonIndex < lessons.length - 1;

  const handleSelectLesson = useCallback((lessonId: string) => {
    setActiveLessonId(lessonId);
    setSidebarOpen(false);
    toggleButtonRef.current?.focus();
  }, []);

  const handleMarkSectionRead = useCallback(
    (sectionId: string) => {
      markSectionRead(courseSlug, activeLessonId, sectionId);
      setReadIds(new Set(getReadSectionIds(courseSlug, activeLessonId)));
    },
    [courseSlug, activeLessonId],
  );

  const handleMarkLessonComplete = useCallback(() => {
    markLessonCompleted(courseSlug, activeLessonId);
    setCompletedIds(new Set(getCompletedLessonIds(courseSlug)));
  }, [courseSlug, activeLessonId]);

  const handleQuizComplete = useCallback(
    (score: number, total: number) => {
      saveLessonQuizScore(courseSlug, activeLessonId, score, total);
      const best = getLessonQuizScore(courseSlug, activeLessonId);
      if (best) {
        setQuizScores((prev) => ({ ...prev, [activeLessonId]: best }));
      }
    },
    [courseSlug, activeLessonId],
  );

  const handleNextLesson = useCallback(() => {
    if (hasNextLesson) {
      setActiveLessonId(lessons[activeLessonIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [hasNextLesson, lessons, activeLessonIndex]);

  if (!activeLesson) return null;

  return (
    <div ref={layoutRef} className="flex min-h-[calc(100svh-7rem)]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-border bg-background p-4 md:block lg:w-64">
        <LessonSidebar
          lessons={lessons}
          activeLessonId={activeLessonId}
          completedLessonIds={completedIds}
          onSelectLesson={handleSelectLesson}
        />
      </aside>

      {/* Mobile Toggle */}
      <button
        ref={toggleButtonRef}
        type="button"
        onClick={() => setSidebarOpen((open) => !open)}
        aria-expanded={sidebarOpen}
        aria-controls="mobile-lesson-nav"
        aria-label={sidebarOpen ? "Navigation schließen" : "Navigation öffnen"}
        className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center border-2 border-foreground bg-brand-orange text-white shadow-[4px_4px_0_0_var(--color-foreground)] md:hidden"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-foreground/40 md:hidden"
            role="presentation"
            onClick={() => {
              setSidebarOpen(false);
              toggleButtonRef.current?.focus();
            }}
          />
          <m.aside
            ref={sidebarRef}
            id="mobile-lesson-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Lektionsnavigation"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 left-0 z-30 w-72 overflow-y-auto overscroll-contain border-r border-border bg-background p-4 pt-20 md:hidden"
          >
            <LessonSidebar
              lessons={lessons}
              activeLessonId={activeLessonId}
              completedLessonIds={completedIds}
              onSelectLesson={handleSelectLesson}
            />
          </m.aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-3xl">
          {freshnessMeta?.lastReviewed && freshnessMeta?.nextReview && (
            <div className="mb-4">
              <FreshnessBadge
                lastReviewed={freshnessMeta.lastReviewed}
                nextReview={freshnessMeta.nextReview}
                riskClass={freshnessMeta.riskClass}
              />
            </div>
          )}
          <LessonContent
            courseSlug={courseSlug}
            lesson={activeLesson}
            totalLessons={lessons.length}
            readSectionIds={readIds}
            isCompleted={completedIds.has(activeLessonId)}
            quizBestScore={quizScores[activeLessonId] ?? null}
            hasNextLesson={hasNextLesson}
            onMarkSectionRead={handleMarkSectionRead}
            onMarkLessonComplete={handleMarkLessonComplete}
            onQuizComplete={handleQuizComplete}
            onNextLesson={handleNextLesson}
          />
        </div>
      </div>
    </div>
  );
}

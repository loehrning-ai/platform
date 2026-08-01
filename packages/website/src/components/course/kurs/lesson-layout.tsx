"use client";

import { useState, useCallback, useEffect } from "react";
import { LessonSidebar } from "./lesson-sidebar";
import { LessonContent } from "./lesson-content";
import { LessonShell } from "@/components/course/lesson-shell";
import {
  markSectionRead,
  markLessonCompleted,
  saveLessonQuizScore,
  getCompletedLessonIds,
  getReadSectionIds,
  getLessonQuizScore,
} from "@/lib/course/progress";
import { subscribe } from "@/lib/progress";
import type { CourseSlug, Lesson } from "@/lib/course/types";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import type { BlockFreshness } from "@/lib/course/data";

interface LessonLayoutProps {
  readonly courseSlug: CourseSlug;
  readonly lessons: readonly Lesson[];
  readonly blockTitle: string;
  readonly freshnessMeta?: BlockFreshness | null;
}

export function LessonLayout({
  courseSlug,
  lessons,
  freshnessMeta,
}: LessonLayoutProps) {
  const [activeLessonId, setActiveLessonId] = useState(lessons[0]?.id ?? "");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Hydrate progress from localStorage (client-side only)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [quizScores, setQuizScores] = useState<
    ReadonlyMap<string, { score: number; total: number }>
  >(() => new Map());

  // Block-based course routes contain several lessons at one URL. Resume links
  // use a bounded `#lesson=<id>` fragment so they can restore the first
  // incomplete lesson without adding an unvalidated route segment.
  useEffect(() => {
    const syncLessonFragment = () => {
      const match = /^#lesson=([^&]+)$/.exec(window.location.hash);
      if (!match) return;
      let lessonId: string;
      try {
        lessonId = decodeURIComponent(match[1]);
      } catch {
        return;
      }
      if (lessons.some((lesson) => lesson.id === lessonId)) {
        setActiveLessonId(lessonId);
      }
    };

    syncLessonFragment();
    window.addEventListener("hashchange", syncLessonFragment);
    return () => {
      window.removeEventListener("hashchange", syncLessonFragment);
    };
  }, [lessons]);

  // Load from localStorage after mount
  useEffect(() => {
    return subscribe(() => {
      setCompletedIds(new Set(getCompletedLessonIds(courseSlug)));
      setReadIds(new Set(getReadSectionIds(courseSlug, activeLessonId)));
      const score = getLessonQuizScore(courseSlug, activeLessonId);
      setQuizScores((prev) => {
        const next = new Map(prev);
        if (score) next.set(activeLessonId, score);
        else next.delete(activeLessonId);
        return next;
      });
    });
  }, [courseSlug, activeLessonId]);

  const activateLesson = useCallback(
    (lessonId: string) => {
      if (!lessons.some((lesson) => lesson.id === lessonId)) return;

      const lessonFragment = `#lesson=${encodeURIComponent(lessonId)}`;
      if (window.location.hash !== lessonFragment) {
        window.history.replaceState(
          window.history.state,
          "",
          `${window.location.pathname}${window.location.search}${lessonFragment}`,
        );
      }
      setActiveLessonId(lessonId);
    },
    [lessons],
  );

  const activeLesson = lessons.find((l) => l.id === activeLessonId);
  const activeLessonIndex = lessons.findIndex((l) => l.id === activeLessonId);
  const hasNextLesson = activeLessonIndex < lessons.length - 1;

  const handleSelectLesson = useCallback(
    (lessonId: string) => {
      activateLesson(lessonId);
      // Closing hands focus back to the toggle button via LessonShell's
      // useFocusTrap restore-on-close (it snapshots whatever had focus when the
      // drawer opened, which is the toggle button itself).
      setSidebarOpen(false);
    },
    [activateLesson],
  );

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
        setQuizScores((prev) => new Map(prev).set(activeLessonId, best));
      }
    },
    [courseSlug, activeLessonId],
  );

  const handleNextLesson = useCallback(() => {
    if (hasNextLesson) {
      activateLesson(lessons[activeLessonIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activateLesson, hasNextLesson, lessons, activeLessonIndex]);

  if (!activeLesson) return null;

  const sidebar = (
    <LessonSidebar
      lessons={lessons}
      activeLessonId={activeLessonId}
      completedLessonIds={completedIds}
      onSelectLesson={handleSelectLesson}
    />
  );

  return (
    <LessonShell
      navOpen={sidebarOpen}
      onNavOpenChange={setSidebarOpen}
      navLabel="Lektionsnavigation"
      sidebar={sidebar}
    >
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
        quizBestScore={quizScores.get(activeLessonId) ?? null}
        hasNextLesson={hasNextLesson}
        onMarkSectionRead={handleMarkSectionRead}
        onMarkLessonComplete={handleMarkLessonComplete}
        onQuizComplete={handleQuizComplete}
        onNextLesson={handleNextLesson}
      />
    </LessonShell>
  );
}

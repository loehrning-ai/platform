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
import type { CourseSlug, Lesson } from "@/lib/course/types";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import type { BlockFreshness } from "@/lib/course/data";

interface LessonLayoutProps {
  readonly courseSlug: CourseSlug;
  readonly lessons: readonly Lesson[];
  readonly blockTitle: string;
  readonly freshnessMeta?: BlockFreshness | null;
}

export function LessonLayout({ courseSlug, lessons, freshnessMeta }: LessonLayoutProps) {
  const [activeLessonId, setActiveLessonId] = useState(lessons[0]?.id ?? "");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    // Closing hands focus back to the toggle button via LessonShell's
    // useFocusTrap restore-on-close (it snapshots whatever had focus when the
    // drawer opened, which is the toggle button itself).
    setSidebarOpen(false);
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
        quizBestScore={quizScores[activeLessonId] ?? null}
        hasNextLesson={hasNextLesson}
        onMarkSectionRead={handleMarkSectionRead}
        onMarkLessonComplete={handleMarkLessonComplete}
        onQuizComplete={handleQuizComplete}
        onNextLesson={handleNextLesson}
      />
    </LessonShell>
  );
}

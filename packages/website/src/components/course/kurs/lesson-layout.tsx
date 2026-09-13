"use client";

import { Fragment, useState, useCallback, useEffect } from "react";
import { LessonSidebar } from "./lesson-sidebar";
import { LessonContent } from "./lesson-content";
import { LessonShell } from "@/components/course/lesson-shell";
import { useLessonReaderBar } from "@/components/course/use-lesson-reader-bar";
import { LessonReference } from "@/components/course/lesson-reference";
import { CourseProjectStudio } from "@/components/course-projects/course-project-studio";
import { isCourseProjectCheckpointLesson } from "@/lib/course-projects/checkpoint-selector";
import {
  markSectionRead,
  saveLessonQuizScore,
  getReadSectionIds,
  getLessonQuizScore,
} from "@/lib/course/progress";
import {
  getEvidenceBackedCompletedLessonIds,
  recordLessonCompletionEvidenceDurably,
  subscribe,
} from "@/lib/progress";
import type { CourseSlug, Lesson } from "@/lib/course/types";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { MotionProvider } from "@/components/motion-provider";
import type { BlockFreshness } from "@/lib/course/data";
import type { Locale } from "@/lib/i18n/locale";
import { localizeHref } from "@/lib/i18n/locale";
import { getCourseReaderCopy } from "./course-ui-copy";
import { getLearningOwnerContext } from "@/lib/progress/browser-learning-storage";
import {
  persistForActiveLearningOwner,
  useOwnerAwareProgressReadiness,
} from "@/components/course/owner-aware-progress";
import { notifyUrlStateChanged } from "@/lib/navigation/url-state";
import { getMotionAwareScrollBehavior } from "@/lib/animation-policy";
import {
  lessonOrdinal,
  trackCourseStarted,
  trackLessonCompleted,
  trackLessonReached,
} from "@/lib/analytics/events";
import {
  ANALYTICS_BLOCK_COURSE_SLUGS,
  type AnalyticsBlockCourseSlug,
} from "@/lib/analytics/registry";

// Usage events are deduplicated per document. They are derived only from
// explicit navigation and from successful writes, never from the progress
// store: subscribe() replays current state to every subscriber and the
// cross-tab listener re-emits it, which would report fake repeats.
const reachedLessonKeys = new Set<string>();
const startedCourseSlugs = new Set<string>();

function isBlockCourse(
  courseSlug: CourseSlug,
): courseSlug is CourseSlug & AnalyticsBlockCourseSlug {
  return (ANALYTICS_BLOCK_COURSE_SLUGS as readonly string[]).includes(
    courseSlug,
  );
}

function reportLessonReached(courseSlug: CourseSlug, lessonId: string): void {
  if (!isBlockCourse(courseSlug)) return;
  const ordinal = lessonOrdinal(courseSlug, lessonId);
  if (ordinal === null) return;
  const key = `${courseSlug}:${ordinal}`;
  if (reachedLessonKeys.has(key)) return;
  reachedLessonKeys.add(key);
  trackLessonReached(courseSlug, ordinal);
}

function reportCourseStarted(courseSlug: CourseSlug): void {
  if (startedCourseSlugs.has(courseSlug)) return;
  startedCourseSlugs.add(courseSlug);
  trackCourseStarted(courseSlug);
}

/** Clears the per-document usage-event deduplication between test cases. */
export function __resetLessonUsageEventsForTests(): void {
  reachedLessonKeys.clear();
  startedCourseSlugs.clear();
}

interface LessonLayoutProps {
  readonly courseSlug: CourseSlug;
  readonly lessons: readonly Lesson[];
  readonly blockTitle: string;
  readonly freshnessMeta?: BlockFreshness | null;
  readonly locale?: Locale;
  readonly lessonOffset?: number;
  readonly courseLessonCount?: number;
  readonly followingHref?: string;
  readonly followingLabel?: string;
}

export function LessonLayout({
  courseSlug,
  lessons,
  freshnessMeta,
  locale = "de",
  lessonOffset = 0,
  courseLessonCount = lessons.length,
  followingHref,
  followingLabel,
}: LessonLayoutProps) {
  const copy = getCourseReaderCopy(locale);
  const [activeLessonId, setActiveLessonId] = useState(lessons[0]?.id ?? "");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Hydrate progress from localStorage (client-side only)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [quizScores, setQuizScores] = useState<
    ReadonlyMap<string, { score: number; total: number }>
  >(() => new Map());
  const [readyProgressKey, setReadyProgressKey] = useState<string | null>(null);
  const [loadedOwnerGeneration, setLoadedOwnerGeneration] = useState<
    number | null
  >(null);

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
      const owner = getLearningOwnerContext();
      const resolved = owner.kind !== "unknown";
      setCompletedIds(
        resolved
          ? new Set(getEvidenceBackedCompletedLessonIds(courseSlug))
          : new Set(),
      );
      setReadIds(
        resolved
          ? new Set(getReadSectionIds(courseSlug, activeLessonId))
          : new Set(),
      );
      const score = resolved
        ? getLessonQuizScore(courseSlug, activeLessonId)
        : null;
      setQuizScores((prev) => {
        const next = new Map(prev);
        if (score) next.set(activeLessonId, score);
        else next.delete(activeLessonId);
        return next;
      });
      setLoadedOwnerGeneration(owner.generation);
      setReadyProgressKey(`${courseSlug}:${activeLessonId}`);
    });
  }, [courseSlug, activeLessonId, lessons]);

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
        notifyUrlStateChanged();
      }
      setActiveLessonId(lessonId);
    },
    [lessons],
  );

  const activeLesson = lessons.find((l) => l.id === activeLessonId);
  const activeLessonIndex = lessons.findIndex((l) => l.id === activeLessonId);
  const hasNextLesson = activeLessonIndex < lessons.length - 1;
  const progressIdentity = `${courseSlug}:${activeLessonId}`;
  const readiness = useOwnerAwareProgressReadiness(
    progressIdentity,
    readyProgressKey,
    loadedOwnerGeneration,
  );

  // The active lesson changes through activateLesson and the #lesson= fragment
  // sync; both land here, and nothing is reported before the learning owner
  // and this lesson's progress have resolved.
  useEffect(() => {
    if (!readiness.interactionReady) return;
    reportLessonReached(courseSlug, activeLessonId);
  }, [readiness.interactionReady, courseSlug, activeLessonId]);

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
      const courseWasUnstarted =
        getEvidenceBackedCompletedLessonIds(courseSlug).size === 0;
      if (
        persistForActiveLearningOwner(
          () => markSectionRead(courseSlug, activeLessonId, sectionId),
          () => getReadSectionIds(courseSlug, activeLessonId).has(sectionId),
        )
      ) {
        setReadIds(new Set(getReadSectionIds(courseSlug, activeLessonId)));
        if (courseWasUnstarted) reportCourseStarted(courseSlug);
      }
    },
    [courseSlug, activeLessonId],
  );

  const handleMarkLessonComplete = useCallback(() => {
    const lesson = lessons.find((entry) => entry.id === activeLessonId);
    if (!lesson) return;
    const persistedReadIds = getReadSectionIds(courseSlug, activeLessonId);
    const everySectionReviewed = lesson.sections.every((section) =>
      persistedReadIds.has(section.id),
    );
    const knowledgeCheckComplete =
      lesson.quiz.length === 0 ||
      getLessonQuizScore(courseSlug, activeLessonId) !== null;
    if (!everySectionReviewed || !knowledgeCheckComplete) return;

    // Read before the write so a repeat completion and a later lesson are
    // told apart from the first durable progress in this course.
    const completedBefore = getEvidenceBackedCompletedLessonIds(courseSlug);
    const courseWasUnstarted = completedBefore.size === 0;
    const lessonWasCompleted = completedBefore.has(activeLessonId);
    const persisted = recordLessonCompletionEvidenceDurably(
      courseSlug,
      activeLessonId,
    );
    if (persisted) {
      setCompletedIds(new Set(getEvidenceBackedCompletedLessonIds(courseSlug)));
      const ordinal = lessonOrdinal(courseSlug, activeLessonId);
      if (!lessonWasCompleted && ordinal !== null) {
        trackLessonCompleted(courseSlug, ordinal);
      }
      if (courseWasUnstarted) reportCourseStarted(courseSlug);
    }
  }, [courseSlug, activeLessonId, lessons]);

  const handleQuizComplete = useCallback(
    (score: number, total: number) => {
      const persisted = persistForActiveLearningOwner(
        () => saveLessonQuizScore(courseSlug, activeLessonId, score, total),
        () => getLessonQuizScore(courseSlug, activeLessonId) !== null,
      );
      if (persisted) {
        const best = getLessonQuizScore(courseSlug, activeLessonId);
        if (!best) return;
        setQuizScores((prev) => new Map(prev).set(activeLessonId, best));
      }
    },
    [courseSlug, activeLessonId],
  );

  const handleNextLesson = useCallback(() => {
    if (hasNextLesson) {
      activateLesson(lessons[activeLessonIndex + 1].id);
      window.scrollTo({
        top: 0,
        behavior: getMotionAwareScrollBehavior(),
      });
    }
  }, [activateLesson, hasNextLesson, lessons, activeLessonIndex]);

  const reader = useLessonReaderBar({
    courseSlug, lessonId: activeLessonId,
    ordinal: lessonOffset + activeLessonIndex + 1, total: courseLessonCount, locale,
    next: hasNextLesson ? {
      kind: "button", label: locale === "de" ? "Weiter" : "Next",
      onSelect: handleNextLesson,
    } : {
      kind: "link", href: followingHref ?? localizeHref(`/${courseSlug}/kurs`, locale),
      label: followingLabel ?? (locale === "de" ? "Zum Kurs" : "Course hub"),
    },
  });

  if (!activeLesson) return null;
  const isProjectCheckpoint = isCourseProjectCheckpointLesson(
    courseSlug,
    activeLessonId,
  );

  const sidebar = (
    <LessonSidebar
      lessons={lessons}
      activeLessonId={activeLessonId}
      completedLessonIds={readiness.interactionReady ? completedIds : new Set()}
      onSelectLesson={handleSelectLesson}
      locale={locale}
    />
  );

  return (
    <MotionProvider>
      <LessonShell
        readerBar={reader.bar}
        contentRef={reader.contentRef}
        navOpen={sidebarOpen}
        onNavOpenChange={setSidebarOpen}
        navLabel={copy.shell.navigation}
        openNavLabel={copy.shell.open}
        closeNavLabel={copy.shell.close}
        collapseNavLabel={
          locale === "de"
            ? "Lektionsnavigation einklappen"
            : "Collapse lesson navigation"
        }
        expandNavLabel={
          locale === "de"
            ? "Lektionsnavigation ausklappen"
            : "Expand lesson navigation"
        }
        sidebar={sidebar}
      >
        <Fragment key={readiness.checkpointKey}>
          {freshnessMeta?.lastReviewed && freshnessMeta?.nextReview && (
            <div className="mb-4">
              <FreshnessBadge
                lastReviewed={freshnessMeta.lastReviewed}
                nextReview={freshnessMeta.nextReview}
                riskClass={freshnessMeta.riskClass}
                locale={locale}
              />
            </div>
          )}
          {isProjectCheckpoint ? (
            <div className="mb-10">
              <CourseProjectStudio
                courseSlug={courseSlug}
                lessonId={activeLessonId}
                locale={locale}
                lessonContext={{
                  title: activeLesson.title,
                  objective: activeLesson.subtitle,
                  keyConcepts: activeLesson.keyConcepts,
                }}
              />
            </div>
          ) : null}
          <LessonReference
            locale={locale}
            title={activeLesson.title}
            objective={activeLesson.subtitle}
            headingLevel={isProjectCheckpoint ? 2 : 1}
          >
            <LessonContent
              courseSlug={courseSlug}
              lesson={activeLesson}
              totalLessons={lessons.length}
              progressReady={readiness.interactionReady}
              progressHydrated={readiness.hydrated}
              ownerReady={readiness.ownerReady}
              checkpointKey={readiness.checkpointKey}
              readSectionIds={readiness.interactionReady ? readIds : new Set()}
              isCompleted={
                readiness.interactionReady && completedIds.has(activeLessonId)
              }
              quizBestScore={
                readiness.interactionReady
                  ? (quizScores.get(activeLessonId) ?? null)
                  : null
              }
              hasNextLesson={hasNextLesson}
              onMarkSectionRead={handleMarkSectionRead}
              onMarkLessonComplete={handleMarkLessonComplete}
              onQuizComplete={handleQuizComplete}
              onNextLesson={handleNextLesson}
              locale={locale}
            />
          </LessonReference>
        </Fragment>
      </LessonShell>
    </MotionProvider>
  );
}

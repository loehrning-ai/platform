"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { LessonShell } from "@/components/course/lesson-shell";
import { LessonReference } from "@/components/course/lesson-reference";
import { CourseProjectStudio } from "@/components/course-projects/course-project-studio";
import { isCourseProjectCheckpointLesson } from "@/lib/course-projects/checkpoint-selector";
import { DefChapterSidebar } from "@/components/data-engineering-fundamentals/def-chapter-sidebar";
import { getDataEngineeringFundamentalsCourseCopy } from "@/lib/data-engineering-fundamentals/course-copy";
import {
  isDefChapterId,
  type ChapterMeta,
} from "@/lib/data-engineering-fundamentals/types";
import { isInteractiveShortcutTarget } from "@/lib/a11y/keyboard-shortcuts";
import type { Locale } from "@/lib/i18n/locale";
import { technicalCourseHref } from "@/lib/technical-courses/routes";
import { getMotionAwareScrollBehavior } from "@/lib/animation-policy";
import "@/components/data-engineering-fundamentals/de-course.css";

export function DefChapterLayoutClient({
  children,
  locale,
  chapters,
}: {
  readonly children: ReactNode;
  readonly locale: Locale;
  readonly chapters: readonly ChapterMeta[];
}) {
  const params = useParams<{ chapterId: string }>();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const copy = getDataEngineeringFundamentalsCourseCopy(locale).reader;

  const currentId = isDefChapterId(params.chapterId) ? params.chapterId : null;
  const currentIndex = currentId
    ? chapters.findIndex((chapter) => chapter.id === currentId)
    : -1;
  const missionChapter = chapters.find(
    (chapter) => chapter.id === (currentId ?? "home"),
  );
  const projectLessonId = currentId ?? "home";
  const isProjectCheckpoint =
    missionChapter !== undefined &&
    isCourseProjectCheckpointLesson(
      "data-engineering-fundamentals",
      projectLessonId,
    );
  const prev = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const next =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isInteractiveShortcutTarget(event.target)
      ) {
        return;
      }
      if (event.key === "ArrowLeft" && prev) {
        event.preventDefault();
        router.push(
          technicalCourseHref("data-engineering-fundamentals", locale, {
            kind: "chapter",
            chapterId: prev.id,
          }),
        );
      } else if (event.key === "ArrowRight" && next) {
        event.preventDefault();
        router.push(
          technicalCourseHref("data-engineering-fundamentals", locale, {
            kind: "chapter",
            chapterId: next.id,
          }),
        );
      } else if (event.key === "j") {
        window.scrollBy({
          top: 120,
          behavior: getMotionAwareScrollBehavior(),
        });
      } else if (event.key === "k") {
        window.scrollBy({
          top: -120,
          behavior: getMotionAwareScrollBehavior(),
        });
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [locale, next, prev, router]);

  return (
    <div className="de-course min-w-0">
      <LessonShell
        navOpen={navOpen}
        onNavOpenChange={setNavOpen}
        navLabel={copy.navLabel}
        navId="def-mobile-chapter-nav"
        openNavLabel={copy.openNavLabel}
        closeNavLabel={copy.closeNavLabel}
        collapseNavLabel={
          locale === "de"
            ? "Kapitelnavigation einklappen"
            : "Collapse chapter navigation"
        }
        expandNavLabel={
          locale === "de"
            ? "Kapitelnavigation ausklappen"
            : "Expand chapter navigation"
        }
        sidebar={
          <DefChapterSidebar
            activeId={currentId}
            locale={locale}
            chapters={chapters}
            onNavigate={() => setNavOpen(false)}
          />
        }
      >
        {missionChapter && isProjectCheckpoint ? (
          <div className="mb-10">
            <CourseProjectStudio
              courseSlug="data-engineering-fundamentals"
              lessonId={projectLessonId}
              locale={locale}
              lessonContext={{
                title: missionChapter.title,
                objective: missionChapter.subtitle,
              }}
            />
          </div>
        ) : null}
        <LessonReference
          key={projectLessonId}
          locale={locale}
          title={missionChapter?.title ?? copy.navLabel}
          objective={missionChapter?.subtitle}
          headingLevel={isProjectCheckpoint ? 2 : 1}
        >
          {children}
        </LessonReference>
      </LessonShell>
    </div>
  );
}

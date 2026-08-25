"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LessonShell } from "@/components/course/lesson-shell";
import { LessonReference } from "@/components/course/lesson-reference";
import { CourseProjectStudio } from "@/components/course-projects/course-project-studio";
import { isCourseProjectCheckpointLesson } from "@/lib/course-projects/checkpoint-selector";
import { DsChapterSidebar } from "@/components/data-science/ds-chapter-sidebar";
import { isInteractiveShortcutTarget } from "@/lib/a11y/keyboard-shortcuts";
import { getDataScienceCourseCopy } from "@/lib/data-science/course-copy";
import type { ChapterMeta, DsChapterId } from "@/lib/data-science/types";
import { dsChapterHref } from "@/lib/data-science/routes";
import { DS_FONT_VARIABLES } from "@/lib/data-science/fonts";
import type { Locale } from "@/lib/i18n/locale";
import "@/components/data-science/ds-v8-scope.css";

// ─── DsReaderShell ─────────────────────────────────
//
// Reusable chrome for every reader route (the Overview at the course root
// AND every numbered [chapterSlug] route), built on the shared LessonShell
// instead of re-deriving App.js's vanilla-JS
// Sidebar/TopBar. A component, not a Next.js layout.tsx: the Overview
// lives at the course root (a sibling of [chapterSlug], not nested under
// it), so a shared layout.tsx file can't wrap both without also wrapping
// the certificate/verification routes (stage 13) that must NOT get this
// chrome. Ports 2 of the source's 2 global keyboard shortcuts —
// ArrowLeft/Right (prev/next chapter) — scoped to this component's mount
// lifetime so they never compete with any site-wide shortcut.

export interface DsReaderShellProps {
  readonly activeId: DsChapterId;
  readonly locale: Locale;
  readonly chapters: readonly ChapterMeta[];
  readonly children: ReactNode;
}

export function DsReaderShell({
  activeId,
  locale,
  chapters,
  children,
}: DsReaderShellProps) {
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  const copy = getDataScienceCourseCopy(locale).reader;
  const currentIndex = chapters.findIndex((c) => c.id === activeId);
  const currentChapter = currentIndex >= 0 ? chapters[currentIndex] : null;
  const isProjectCheckpoint =
    currentChapter !== null &&
    isCourseProjectCheckpointLesson("data-science", activeId);
  const prev = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const next =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isInteractiveShortcutTarget(e.target)) return;
      if (e.key === "ArrowLeft" && prev) {
        e.preventDefault();
        router.push(dsChapterHref(prev.id, locale));
      } else if (e.key === "ArrowRight" && next) {
        e.preventDefault();
        router.push(dsChapterHref(next.id, locale));
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [locale, prev, next, router]);

  return (
    <div className={`ds-v8-scope ${DS_FONT_VARIABLES}`}>
      <LessonShell
        navOpen={navOpen}
        onNavOpenChange={setNavOpen}
        navLabel={copy.navLabel}
        openNavLabel={
          locale === "de"
            ? "Kapitelnavigation öffnen"
            : "Open chapter navigation"
        }
        closeNavLabel={
          locale === "de"
            ? "Kapitelnavigation schließen"
            : "Close chapter navigation"
        }
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
          <DsChapterSidebar
            activeId={activeId}
            locale={locale}
            chapters={chapters}
            onNavigate={() => setNavOpen(false)}
          />
        }
      >
        {currentChapter && isProjectCheckpoint ? (
          <div className="mb-10">
            <CourseProjectStudio
              courseSlug="data-science"
              lessonId={activeId}
              locale={locale}
              lessonContext={{
                title: currentChapter.title,
                objective: currentChapter.subtitle,
              }}
            />
          </div>
        ) : null}
        <LessonReference
          key={activeId}
          locale={locale}
          title={currentChapter?.title ?? copy.navLabel}
          objective={currentChapter?.subtitle}
          headingLevel={isProjectCheckpoint ? 2 : 1}
        >
          {children}
        </LessonReference>
      </LessonShell>
    </div>
  );
}

export default DsReaderShell;

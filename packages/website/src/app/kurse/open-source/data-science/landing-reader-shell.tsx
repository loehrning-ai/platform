"use client";

import {
  useEffect,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { LessonShell } from "@/components/course/lesson-shell";
import { DsChapterSidebar } from "@/components/data-science/ds-chapter-sidebar";
import { isInteractiveShortcutTarget } from "@/lib/a11y/keyboard-shortcuts";
import { getDataScienceCourseCopy } from "@/lib/data-science/course-copy";
import { DS_FONT_VARIABLES } from "@/lib/data-science/fonts";
import { dsChapterHref } from "@/lib/data-science/routes";
import type { ChapterMeta } from "@/lib/data-science/types";
import type { Locale } from "@/lib/i18n/locale";
import "@/components/data-science/ds-v8-scope.css";

interface DataScienceLandingReaderShellProps {
  readonly locale: Locale;
  readonly chapters: readonly ChapterMeta[];
  readonly children: ReactNode;
}

/**
 * Landing-only reader chrome. The numbered chapter reader mounts the project
 * studio immediately because the learner has selected a canonical lesson.
 * The noncanonical landing keeps the same navigation but does not mount a
 * second project surface. Its authored overview already contains the course
 * map and interactive loop; the first canonical checkpoint owns project state.
 */
export function DataScienceLandingReaderShell({
  locale,
  chapters,
  children,
}: DataScienceLandingReaderShellProps): JSX.Element {
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const copy = getDataScienceCourseCopy(locale).reader;
  const overview = chapters[0];
  const next = chapters[1];

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
      if (event.key === "ArrowRight" && next) {
        event.preventDefault();
        router.push(dsChapterHref(next.id, locale));
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [locale, next, router]);

  if (!overview || overview.id !== "home") {
    throw new Error("Data Science landing shell is missing its overview.");
  }

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
            activeId="home"
            locale={locale}
            chapters={chapters}
            onNavigate={() => setNavOpen(false)}
          />
        }
      >
        {children}
      </LessonShell>
    </div>
  );
}

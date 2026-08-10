"use client";

import Link from "next/link";
import { getDataScienceCourseCopy } from "@/lib/data-science/course-copy";
import type { ChapterMeta, DsChapterId } from "@/lib/data-science/types";
import { dsChapterHref } from "@/lib/data-science/routes";
import type { Locale } from "@/lib/i18n/locale";

// ─── DsChapterSidebar ──────────────────────────────
//
// Nav rail consumed by both LessonShell's desktop rail and mobile drawer
// (see reader-shell.tsx). Uses this course's own scoped classNames
// (sb-*, from the ported ds-v8-scope.css) rather than the platform's
// Tailwind sidebar styling, so the reading experience stays visually
// consistent with the chapter content it sits beside.

export interface DsChapterSidebarProps {
  readonly activeId: DsChapterId | null;
  readonly locale: Locale;
  readonly chapters: readonly ChapterMeta[];
  readonly onNavigate?: () => void;
}

export function DsChapterSidebar({
  activeId,
  locale,
  chapters,
  onNavigate,
}: DsChapterSidebarProps) {
  const copy = getDataScienceCourseCopy(locale).reader;
  return (
    <nav className="sb-nav" aria-label={copy.navLabel}>
      {chapters.map((c) => {
        const active = activeId === c.id;
        return (
          <Link
            key={c.id}
            href={dsChapterHref(c.id, locale)}
            prefetch={false}
            className={`sb-item ${active ? "active" : ""}`}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
          >
            <div className="sb-num">{c.displayNumber}</div>
            <div className="sb-mid">
              <div className="sb-title">{c.title}</div>
              <div className="sb-sub">{c.subtitle}</div>
            </div>
            <div className="sb-time">
              {locale === "de"
                ? `${c.estimatedMinutes} Min.`
                : `${c.estimatedMinutes} min`}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

export default DsChapterSidebar;

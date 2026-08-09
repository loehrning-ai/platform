"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { getDataEngineeringFundamentalsCourseCopy } from "@/lib/data-engineering-fundamentals/course-copy";
import type {
  ChapterMeta,
  DefChapterId,
} from "@/lib/data-engineering-fundamentals/types";
import type { Locale } from "@/lib/i18n/locale";
import { technicalCourseHref } from "@/lib/technical-courses/routes";

// ─── DefChapterSidebar ───────────────────────────
// Nav rail consumed by both LessonShell's desktop rail and mobile drawer
// (see [chapterId]/layout.tsx). Uses this course's own scoped classNames
// (sb-*, from the ported de-course.css) rather than the platform's
// Tailwind sidebar styling, so the reading experience stays visually
// consistent with the chapter content it sits beside.

export interface DefChapterSidebarProps {
  readonly activeId: DefChapterId | null;
  readonly locale: Locale;
  readonly chapters: readonly ChapterMeta[];
  readonly onNavigate?: () => void;
}

export function DefChapterSidebar({
  activeId,
  locale,
  chapters,
  onNavigate,
}: DefChapterSidebarProps) {
  const copy = getDataEngineeringFundamentalsCourseCopy(locale);
  return (
    <nav className="sb-nav" aria-label={copy.reader.navLabel}>
      {chapters.map((c) => {
        const active = activeId === c.id;
        return (
          <Link
            key={c.id}
            href={technicalCourseHref("data-engineering-fundamentals", locale, {
              kind: "chapter",
              chapterId: c.id,
            })}
            className={`sb-item ${active ? "active" : ""}`}
            style={
              { "--ch-hex": c.accentHex, "--ch-ink": c.inkHex } as CSSProperties
            }
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
          >
            <div className="sb-num">{c.displayNumber}</div>
            <div className="sb-text">
              <div className="sb-title">{c.title}</div>
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

export default DefChapterSidebar;

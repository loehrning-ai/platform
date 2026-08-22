"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { getDataEngineeringFundamentalsCourseCopy } from "@/lib/data-engineering-fundamentals/course-copy";
import type {
  ChapterMeta,
  DefChapterId,
} from "@/lib/data-engineering-fundamentals/types";
import type { Locale } from "@/lib/i18n/locale";
import { technicalCourseHref } from "@/lib/technical-courses/routes";
import { cn } from "@/lib/utils";

// ─── DefChapterSidebar ───────────────────────────
// Nav rail consumed by both LessonShell's desktop rail and mobile drawer
// (see [chapterId]/layout.tsx). It follows the same visible hierarchy,
// spacing, active rail, and target-size contract as every technical course.

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
    <nav className="flex min-w-0 flex-col gap-0.5" aria-label={copy.reader.navLabel}>
      {chapters.map((c) => {
        const active = activeId === c.id;
        return (
          <Link
            key={c.id}
            href={technicalCourseHref("data-engineering-fundamentals", locale, {
              kind: "chapter",
              chapterId: c.id,
            })}
            className={cn(
              "flex min-h-11 min-w-0 items-start gap-2 border-l-2 px-2.5 py-2.5 text-[13px] leading-[1.35] transition-colors",
              active
                ? "active border-brand-orange bg-brand-orange/10 font-semibold text-foreground"
                : "border-transparent text-muted-foreground hover:border-brand-orange/40 hover:text-foreground",
            )}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
          >
            <span className="w-6 shrink-0 text-center font-mono text-[10px] font-bold text-brand-orange">
              {c.displayNumber}
            </span>
            <div className="min-w-0 flex-1">
              <div className="break-words [overflow-wrap:anywhere]">{c.title}</div>
              <div className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                {locale === "de"
                  ? `${c.estimatedMinutes} Min.`
                  : `${c.estimatedMinutes} min`}
              </div>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

export default DefChapterSidebar;

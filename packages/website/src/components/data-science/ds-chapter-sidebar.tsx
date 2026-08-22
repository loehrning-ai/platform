"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { getDataScienceCourseCopy } from "@/lib/data-science/course-copy";
import type { ChapterMeta, DsChapterId } from "@/lib/data-science/types";
import { dsChapterHref } from "@/lib/data-science/routes";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

// ─── DsChapterSidebar ──────────────────────────────
//
// Nav rail consumed by both LessonShell's desktop rail and mobile drawer
// (see reader-shell.tsx). It follows the shared technical-course hierarchy,
// spacing, active rail, and target-size contract.

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
    <nav className="flex min-w-0 flex-col gap-0.5" aria-label={copy.navLabel}>
      {chapters.map((c) => {
        const active = activeId === c.id;
        return (
          <Link
            key={c.id}
            href={dsChapterHref(c.id, locale)}
            prefetch={false}
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
              <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                {c.subtitle}
              </div>
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

export default DsChapterSidebar;

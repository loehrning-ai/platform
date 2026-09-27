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
              "relative flex min-h-11 min-w-0 items-start gap-2 py-2.5 pl-5 pr-2.5 text-[13px] leading-[1.35] transition-colors duration-[120ms] motion-reduce:transition-none",
              // Werkzeichnung: the current chapter is an ink square marker
              // plus 600 weight, not a copper tint.
              active
                ? "active font-semibold text-foreground"
                : "text-muted-foreground hover:bg-card-hover hover:text-foreground",
            )}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
          >
            {active ? (
              <span
                aria-hidden="true"
                data-active-marker
                className="absolute left-1.5 top-[1.0625rem] size-2 bg-foreground"
              />
            ) : null}
            <span className="w-6 shrink-0 text-center font-mono text-xs font-bold tabular-nums text-muted-foreground">
              {c.displayNumber}
            </span>
            <div className="min-w-0 flex-1">
              <div className="break-words [overflow-wrap:anywhere]">
                {c.title}
              </div>
              <div className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
                {c.subtitle}
              </div>
              <div className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
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

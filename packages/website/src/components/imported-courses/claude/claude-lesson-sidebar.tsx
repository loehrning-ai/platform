"use client";

import { useEffect, useState, type JSX } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import {
  CLAUDE_TRACKS_BY_LOCALE,
  type ClaudeLessonId,
} from "@/lib/claude-course/types";
import { canonicalLocalePathname, type Locale } from "@/lib/i18n/locale";
import { technicalCourseHref } from "@/lib/technical-courses/routes";
import { cn } from "@/lib/utils";
import { getEvidenceBackedCompletedLessonIds, subscribe } from "@/lib/progress";

export interface ClaudeLessonNavItem {
  readonly id: ClaudeLessonId;
  readonly number: number;
  readonly title: string;
  readonly trackId: string;
}

interface ClaudeLessonSidebarProps {
  readonly lessons: readonly ClaudeLessonNavItem[];
  readonly locale: Locale;
}

/**
 * ClaudeLessonSidebar, track-grouped lesson nav for `<LessonShell>`'s
 * `sidebar` slot ( primitive, reused per ).
 */
export function ClaudeLessonSidebar({
  lessons,
  locale,
}: ClaudeLessonSidebarProps): JSX.Element {
  const pathname = usePathname();
  const routePathname = canonicalLocalePathname(pathname);
  const tracks = CLAUDE_TRACKS_BY_LOCALE[locale];
  const [completedIds, setCompletedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  useEffect(() => {
    return subscribe(() => {
      setCompletedIds(getEvidenceBackedCompletedLessonIds("claude"));
    });
  }, [pathname]);

  return (
    <nav
      aria-label={locale === "de" ? "Lektionsnavigation" : "Lesson navigation"}
      className="flex flex-col gap-6"
    >
      {tracks.map((track) => {
        const trackLessons = lessons.filter((l) => l.trackId === track.id);
        if (trackLessons.length === 0) return null;
        return (
          <div key={track.id}>
            <p className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {track.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {trackLessons.map((lesson) => {
                const href = technicalCourseHref("claude", locale, {
                  kind: "lesson",
                  lessonId: lesson.id,
                });
                const active =
                  routePathname !== null &&
                  routePathname === canonicalLocalePathname(href);
                return (
                  <li key={lesson.id}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 min-w-0 items-start gap-2 border-l-2 px-2.5 py-2.5 text-[13px] leading-[1.35] transition-colors",
                        active
                          ? "border-brand-orange bg-brand-orange/10 font-semibold text-foreground"
                          : "border-transparent text-muted-foreground hover:border-brand-orange/40 hover:text-foreground",
                      )}
                    >
                      {completedIds.has(lesson.id) ? (
                        <CheckCircle2
                          size={13}
                          className="shrink-0 text-risk-green"
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="w-[13px] shrink-0 text-center font-mono text-xs text-muted-foreground">
                          {lesson.number}
                        </span>
                      )}
                      <span className="min-w-0 break-words">
                        {lesson.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export default ClaudeLessonSidebar;

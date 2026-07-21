"use client";

import { useEffect, useState, type JSX } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getCompletedLessonIds } from "@/lib/course/progress";
import { CODEX_TRACKS } from "@/lib/codex/types";
import { cn } from "@/lib/utils";

export interface CodexLessonNavItem {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly trackId: string;
}

interface CodexLessonSidebarProps {
  readonly lessons: readonly CodexLessonNavItem[];
}

/**
 * CodexLessonSidebar — track-grouped lesson nav for `<LessonShell>`'s
 * `sidebar` slot (plan 007 stage 7 primitive), mirroring
 * `ClaudeLessonSidebar`'s own precedent (plan 008 stage 9).
 */
export function CodexLessonSidebar({ lessons }: CodexLessonSidebarProps): JSX.Element {
  const pathname = usePathname();
  const [completedIds, setCompletedIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    setCompletedIds(getCompletedLessonIds("codex"));
  }, [pathname]);

  return (
    <nav aria-label="Lesson navigation" className="flex flex-col gap-6">
      {CODEX_TRACKS.map((track) => {
        const trackLessons = lessons.filter((l) => l.trackId === track.id);
        if (trackLessons.length === 0) return null;
        return (
          <div key={track.id}>
            <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {track.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {trackLessons.map((lesson) => {
                const href = `/kurse/open-source/codex/kurs/${lesson.id}`;
                const active = pathname === href;
                return (
                  <li key={lesson.id}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 border-l-2 px-2.5 py-1.5 text-[13px] transition-colors",
                        active
                          ? "border-brand-orange bg-brand-orange/10 font-semibold text-foreground"
                          : "border-transparent text-muted-foreground hover:border-brand-orange/40 hover:text-foreground",
                      )}
                    >
                      {completedIds.has(lesson.id) ? (
                        <CheckCircle2 size={13} className="shrink-0 text-[#22c55e]" aria-hidden="true" />
                      ) : (
                        <span className="w-[13px] shrink-0 text-center font-mono text-[10px] text-muted-foreground">
                          {lesson.number}
                        </span>
                      )}
                      <span className="truncate">{lesson.title}</span>
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

export default CodexLessonSidebar;

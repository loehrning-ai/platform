"use client";

import Link from "next/link";
import { DS_CHAPTERS, type DsChapterId } from "@/lib/data-science/types";
import { dsChapterHref } from "@/lib/data-science/routes";

// ─── DsChapterSidebar (plan 012 stage 5) ──────────────────────────────
//
// Nav rail consumed by both LessonShell's desktop rail and mobile drawer
// (see reader-shell.tsx). Uses this course's own scoped classNames
// (sb-*, from the ported ds-v8-scope.css) rather than the platform's
// Tailwind sidebar styling, so the reading experience stays visually
// consistent with the chapter content it sits beside.

export interface DsChapterSidebarProps {
  readonly activeId: DsChapterId | null;
  readonly onNavigate?: () => void;
}

export function DsChapterSidebar({ activeId, onNavigate }: DsChapterSidebarProps) {
  return (
    <nav className="sb-nav" aria-label="Chapters">
      {DS_CHAPTERS.map((c) => {
        const active = activeId === c.id;
        return (
          <Link
            key={c.id}
            href={dsChapterHref(c.id)}
            className={`sb-item ${active ? "active" : ""}`}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
          >
            <div className="sb-num">{c.displayNumber}</div>
            <div className="sb-mid">
              <div className="sb-title">{c.title}</div>
              <div className="sb-sub">{c.subtitle}</div>
            </div>
            <div className="sb-time">{c.estimatedMinutes} min</div>
          </Link>
        );
      })}
    </nav>
  );
}

export default DsChapterSidebar;

"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { DEF_CHAPTERS, type DefChapterId } from "@/lib/data-engineering-fundamentals/types";

// ─── DefChapterSidebar (plan 011 stage 10) ───────────────────────────
// Nav rail consumed by both LessonShell's desktop rail and mobile drawer
// (see [chapterId]/layout.tsx). Uses this course's own scoped classNames
// (sb-*, from the ported de-course.css) rather than the platform's
// Tailwind sidebar styling, so the reading experience stays visually
// consistent with the chapter content it sits beside.

export interface DefChapterSidebarProps {
  readonly activeId: DefChapterId | null;
  readonly onNavigate?: () => void;
}

export function DefChapterSidebar({ activeId, onNavigate }: DefChapterSidebarProps) {
  return (
    <nav className="sb-nav" aria-label="Chapters">
      {DEF_CHAPTERS.map((c) => {
        const active = activeId === c.id;
        return (
          <Link
            key={c.id}
            href={`/kurse/open-source/data-engineering-fundamentals/${c.id}`}
            className={`sb-item ${active ? "active" : ""}`}
            style={{ "--ch-hex": c.accentHex, "--ch-ink": c.inkHex } as CSSProperties}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
          >
            <div className="sb-num">{c.displayNumber}</div>
            <div className="sb-text">
              <div className="sb-title">{c.title}</div>
            </div>
            <div className="sb-time">{c.estimatedMinutes} min</div>
          </Link>
        );
      })}
    </nav>
  );
}

export default DefChapterSidebar;

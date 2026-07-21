"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LessonShell } from "@/components/course/lesson-shell";
import { DsChapterSidebar } from "@/components/data-science/ds-chapter-sidebar";
import { isInteractiveShortcutTarget } from "@/lib/a11y/keyboard-shortcuts";
import { DS_CHAPTERS, type DsChapterId } from "@/lib/data-science/types";
import { dsChapterHref } from "@/lib/data-science/routes";
import { DS_FONT_VARIABLES } from "@/lib/data-science/fonts";
import "@/components/data-science/ds-v8-scope.css";

// ─── DsReaderShell ─────────────────────────────────
//
// Reusable chrome for every reader route (the Overview at the course root
// AND every numbered [chapterSlug] route), built on the shared LessonShell
// instead of re-deriving App.js's vanilla-JS
// Sidebar/TopBar. A component, not a Next.js layout.tsx: the Overview
// lives at the course root (a sibling of [chapterSlug], not nested under
// it), so a shared layout.tsx file can't wrap both without also wrapping
// the certificate/verification routes (stage 13) that must NOT get this
// chrome. Ports 2 of the source's 2 global keyboard shortcuts —
// ArrowLeft/Right (prev/next chapter) — scoped to this component's mount
// lifetime so they never compete with any site-wide shortcut.

export interface DsReaderShellProps {
  readonly activeId: DsChapterId;
  readonly children: ReactNode;
}

export function DsReaderShell({ activeId, children }: DsReaderShellProps) {
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  const currentIndex = DS_CHAPTERS.findIndex((c) => c.id === activeId);
  const prev = currentIndex > 0 ? DS_CHAPTERS[currentIndex - 1] : null;
  const next =
    currentIndex >= 0 && currentIndex < DS_CHAPTERS.length - 1
      ? DS_CHAPTERS[currentIndex + 1]
      : null;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isInteractiveShortcutTarget(e.target)) return;
      if (e.key === "ArrowLeft" && prev) {
        e.preventDefault();
        router.push(dsChapterHref(prev.id));
      } else if (e.key === "ArrowRight" && next) {
        e.preventDefault();
        router.push(dsChapterHref(next.id));
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prev, next, router]);

  return (
    <div className={`ds-v8-scope ${DS_FONT_VARIABLES}`}>
      <LessonShell
        navOpen={navOpen}
        onNavOpenChange={setNavOpen}
        navLabel="Chapter navigation"
        sidebar={<DsChapterSidebar activeId={activeId} onNavigate={() => setNavOpen(false)} />}
      >
        {children}
      </LessonShell>
    </div>
  );
}

export default DsReaderShell;

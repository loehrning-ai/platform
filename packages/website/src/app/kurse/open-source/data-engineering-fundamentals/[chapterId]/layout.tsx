"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { LessonShell } from "@/components/course/lesson-shell";
import { DefChapterSidebar } from "@/components/data-engineering-fundamentals/def-chapter-sidebar";
import { isInteractiveShortcutTarget } from "@/lib/a11y/keyboard-shortcuts";
import { DEF_CHAPTERS, isDefChapterId, type DefChapterId } from "@/lib/data-engineering-fundamentals/types";
import "@/components/data-engineering-fundamentals/de-course.css";

// ─── Chapter-reader chrome (plan 011 stage 10) ───────────────────────
// Built on the shared LessonShell (plan 007 stage 7) instead of
// re-deriving App.js's vanilla-JS sidebar/topbar. Ports 2 of the source's
// 6 global keyboard shortcuts — ArrowLeft/Right (prev/next chapter) and
// j/k (scroll) — scoped to this route subtree's mount lifetime so they
// never compete with any site-wide shortcut. `t` (TweaksPanel toggle) and
// `[` (sidebar collapse, superseded by LessonShell's own mobile drawer)
// are intentionally dropped along with TweaksPanel itself.

function chapterHref(id: DefChapterId): string {
  return `/kurse/open-source/data-engineering-fundamentals/${id}`;
}

export default function DefChapterLayout({ children }: { readonly children: ReactNode }) {
  const params = useParams<{ chapterId: string }>();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  const currentId = isDefChapterId(params.chapterId) ? params.chapterId : null;
  const currentIndex = currentId ? DEF_CHAPTERS.findIndex((c) => c.id === currentId) : -1;
  const prev = currentIndex > 0 ? DEF_CHAPTERS[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < DEF_CHAPTERS.length - 1 ? DEF_CHAPTERS[currentIndex + 1] : null;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isInteractiveShortcutTarget(e.target)) return;
      if (e.key === "ArrowLeft" && prev) {
        e.preventDefault();
        router.push(chapterHref(prev.id));
      } else if (e.key === "ArrowRight" && next) {
        e.preventDefault();
        router.push(chapterHref(next.id));
      } else if (e.key === "j") {
        window.scrollBy({ top: 120, behavior: "smooth" });
      } else if (e.key === "k") {
        window.scrollBy({ top: -120, behavior: "smooth" });
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prev, next, router]);

  return (
    <div className="de-course">
      <LessonShell
        navOpen={navOpen}
        onNavOpenChange={setNavOpen}
        navLabel="Chapter navigation"
        sidebar={<DefChapterSidebar activeId={currentId} onNavigate={() => setNavOpen(false)} />}
      >
        {children}
      </LessonShell>
    </div>
  );
}

"use client";

import { useEffect, useState, type JSX } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { getAllProgress } from "@/lib/ai-native/progress";
import { getModules } from "@/lib/ai-native/data";
import { EASE_OUT_EXPO } from "@/lib/animations";

/**
 * AiNativeContinueBanner — returning-user hook on the landing hero.
 *
 * Hydration-safe: renders nothing on first paint; mounts after React
 * hydrates + reads localStorage. Dismissible within the session via
 * sessionStorage flag. Hides itself if the stored lesson no longer exists
 * (defensive against deleted content).
 *
 * See the AI-native challenge-flow implementation.
 */

const DISMISS_KEY = "ai-native-continue-dismissed";

interface ContinueState {
  readonly moduleId: string;
  readonly moduleNumber: number;
  readonly lessonsCompleted: number;
  readonly totalLessons: number;
}

function computeContinueState(): ContinueState | null {
  try {
    const progress = getAllProgress();
    const completedLessonIds = new Set(
      Object.entries(progress.lessons)
        .filter(([, v]) => v.completed)
        .map(([k]) => k),
    );
    if (completedLessonIds.size === 0) return null;

    const modules = getModules();
    // Find the module where the user has the most completions but isn't done
    for (const mod of modules) {
      const total = mod.lessonCount;
      // Count lessons of this module that are completed — lessonId prefix "modul_N_lesson"
      const moduleLessonsCompleted = Array.from(completedLessonIds).filter((id) =>
        id.startsWith(`${mod.id}_lesson`),
      ).length;
      if (moduleLessonsCompleted > 0 && moduleLessonsCompleted < total) {
        return {
          moduleId: mod.id,
          moduleNumber: mod.number,
          lessonsCompleted: moduleLessonsCompleted,
          totalLessons: total,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function AiNativeContinueBanner(): JSX.Element | null {
  const [state, setState] = useState<ContinueState | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") {
        setDismissed(true);
        return;
      }
    } catch {
      /* ignore */
    }
    setState(computeContinueState());
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (!mounted || dismissed || !state) return null;

  const pct = Math.round((state.lessonsCompleted / state.totalLessons) * 100);

  return (
    <AnimatePresence>
      <m.section
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
        className="dark-section border-b border-[var(--color-dark-border)] bg-[var(--color-dark-bg)] px-6 py-3 md:px-12"
        aria-label="Zurück zum letzten Kursschritt"
      >
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-brand-orange">
              ◆ Fortsetzen
            </span>
            <span className="text-[13.5px] text-[var(--color-dark-fg)]">
              Modul {state.moduleNumber}:{" "}
              <span className="font-mono text-[12.5px] text-[var(--color-dark-muted)]">
                {state.lessonsCompleted} / {state.totalLessons} Lektionen · {pct}%
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href={`/ai-native/kurs/${state.moduleId}`}
              className="inline-flex items-center gap-1.5 border border-brand-orange bg-brand-orange px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              Weiterlernen <ArrowRight size={13} />
            </Link>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Banner schließen"
              className="flex h-7 w-7 items-center justify-center border border-[var(--color-dark-border)] text-[var(--color-dark-muted)] transition-colors hover:border-brand-orange hover:text-brand-orange"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </m.section>
    </AnimatePresence>
  );
}

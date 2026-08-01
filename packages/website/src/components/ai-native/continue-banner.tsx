"use client";

import { useEffect, useState, type JSX } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { getAllProgress } from "@/lib/ai-native/progress";
import { getModules } from "@/lib/ai-native/data";
import { EASE_OUT_EXPO } from "@/lib/animations";
import {
  getLearningOwnerContext,
  getOwnedSessionLearningItem,
  setOwnedSessionLearningItem,
  subscribeLearningOwner,
} from "@/lib/progress/browser-learning-storage";

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
  const [ownerGeneration, setOwnerGeneration] = useState(
    () => getLearningOwnerContext().generation,
  );

  useEffect(() => {
    setMounted(true);
    const loadOwnedState = () => {
      setOwnerGeneration(getLearningOwnerContext().generation);
      setDismissed(false);
      setState(null);
      try {
        if (getOwnedSessionLearningItem(DISMISS_KEY) === "1") {
        setDismissed(true);
        return;
      }
      } catch {
        /* ignore */
      }
      setState(computeContinueState());
    };
    loadOwnedState();
    return subscribeLearningOwner(loadOwnedState);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    setOwnedSessionLearningItem(DISMISS_KEY, "1", ownerGeneration);
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
        className="absolute inset-x-0 top-16 z-40 border-b border-border bg-background/95 px-6 py-3 shadow-sm backdrop-blur-md md:px-12"
        aria-label="Zurück zum letzten Kursschritt"
      >
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-brand-orange">
              ◆ Fortsetzen
            </span>
            <span className="text-[13.5px] text-foreground">
              Modul {state.moduleNumber}:{" "}
              <span className="font-mono text-[12.5px] text-muted-foreground">
                {state.lessonsCompleted} / {state.totalLessons} Lektionen · {pct}%
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href={`/ai-native/kurs/${state.moduleId}`}
              prefetch={false}
              className="inline-flex items-center gap-1.5 border border-brand-orange bg-brand-orange px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              Weiterlernen <ArrowRight size={13} />
            </Link>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Banner schließen"
              className="flex h-7 w-7 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-brand-orange hover:text-brand-orange"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </m.section>
    </AnimatePresence>
  );
}

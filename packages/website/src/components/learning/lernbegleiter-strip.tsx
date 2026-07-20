"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { PATHWAY_STAGE_DISPLAY } from "@/lib/learning-graph";
import type { LearningStage } from "@/lib/learning-graph/types";

const STAGE_ORDER: readonly LearningStage[] = [
  "pruefen",
  "grundlagen",
  "regeln",
  "anwenden",
  "dokumentieren",
  "vertiefen",
];

const COURSE_STAGE: Readonly<Record<string, { stage: LearningStage; path: string; title: string; firstLesson: string }>> = {
  "ki-fuehrerschein": {
    stage: "grundlagen",
    path: "/ki-fuehrerschein/kurs/block_1",
    title: "KI-Führerschein",
    firstLesson: "Block 1: KI-Systeme erkennen",
  },
  "eu-ai-act-kurs": {
    stage: "regeln",
    path: "/eu-ai-act-kurs/kurs/block_1",
    title: "EU AI Act Kurs",
    firstLesson: "Block 1: EU AI Act im Überblick",
  },
  "ai-native": {
    stage: "anwenden",
    path: "/ai-native/kurs",
    title: "AI-Native Arbeitskurs",
    firstLesson: "Modul 1: Grundlagen der KI-Nutzung",
  },
} as const;

const PROGRESS_KEY = "loehrning-progress-v2";
const LAST_VISITED_KEY = "loehrning-last-visited";

interface StripState {
  currentStageIndex: number;
  nextLabel: string;
  nextHref: string;
}

function computeStripState(): StripState {
  const defaultState: StripState = {
    currentStageIndex: 0,
    nextLabel: "Starte mit Lektion 1: Block 1, KI-Systeme erkennen",
    nextHref: "/ki-fuehrerschein/kurs/block_1",
  };

  try {
    const lastVisited = localStorage.getItem(LAST_VISITED_KEY);
    if (lastVisited) {
      defaultState.nextLabel = `Weiter: ${lastVisited}`;
    }

    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaultState;

    const parsed = JSON.parse(raw) as { courses?: Record<string, { lessons?: Record<string, { completed?: boolean }> }> };
    if (!parsed?.courses) return defaultState;

    const completedCourses: string[] = [];
    for (const [slug, slice] of Object.entries(parsed.courses)) {
      const lessons = slice?.lessons ?? {};
      const completedCount = Object.values(lessons).filter((l) => l?.completed).length;
      if (completedCount > 0) {
        completedCourses.push(slug);
      }
    }

    if (completedCourses.length === 0) return defaultState;

    let highestStageIdx = 0;
    let bestNextHref = defaultState.nextHref;
    let bestNextLabel = defaultState.nextLabel;

    for (const slug of completedCourses) {
      const info = COURSE_STAGE[slug];
      if (!info) continue;
      const idx = STAGE_ORDER.indexOf(info.stage);
      if (idx > highestStageIdx) {
        highestStageIdx = idx;
        const nextSlugEntry = Object.entries(COURSE_STAGE).find(([, v]) =>
          STAGE_ORDER.indexOf(v.stage) === idx + 1
        );
        if (nextSlugEntry) {
          bestNextHref = nextSlugEntry[1].path;
          bestNextLabel = `Weiter: ${nextSlugEntry[1].firstLesson}`;
        }
      }
    }

    return {
      currentStageIndex: highestStageIdx,
      nextLabel: bestNextLabel,
      nextHref: bestNextHref,
    };
  } catch {
    return defaultState;
  }
}

export function LernbegleiterStrip() {
  const [state, setState] = useState<StripState | null>(null);

  useEffect(() => {
    setState(computeStripState());
  }, []);

  if (!state) return null;

  const stageCount = STAGE_ORDER.length;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm"
      aria-label="Lernbegleiter"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3">
        <div className="hidden shrink-0 gap-1 sm:flex" aria-hidden="true">
          {STAGE_ORDER.map((stage, i) => {
            const display = PATHWAY_STAGE_DISPLAY[stage];
            const isDone = i < state.currentStageIndex;
            const isCurrent = i === state.currentStageIndex;
            return (
              <div
                key={stage}
                title={display.displayLabel}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  isDone
                    ? "bg-brand-orange"
                    : isCurrent
                      ? "bg-brand-orange/60"
                      : "bg-border"
                }`}
              />
            );
          })}
        </div>

        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground hidden sm:block shrink-0">
          Stufe {state.currentStageIndex + 1}/{stageCount}
        </span>

        <Link
          href={state.nextHref}
          className="group flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-brand-orange"
        >
          <span className="truncate">{state.nextLabel}</span>
          <ChevronRight
            size={14}
            className="shrink-0 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </div>
  );
}

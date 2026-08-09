"use client";

import { useState, type JSX } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";

/**
 * L12 (capstone) bespoke interactive — "The daily loop".
 * Ported from `codex/js/lessons/L12.js` (functional parity; the source's
 * drag-onto-a-clock SVG is simplified to click-to-sequence — the
 * graded interaction is placing all 6 phases of the daily loop, in the
 * order they actually run, not the clock-face chrome).
 *
 * Six workflow blocks (triage, spec, launch, async review, iterate,
 * merge), each with a review artifact. Clicking a block places it next
 * in the workflow. The checkpoint awards once all 6 are sequenced.
 */

interface LoopBlock {
  readonly id: string;
  readonly evidence: Readonly<Record<Locale, string>>;
  readonly label: Readonly<Record<Locale, string>>;
}

const BLOCKS: readonly LoopBlock[] = [
  {
    id: "triage",
    evidence: { en: "request and owner", de: "Anfrage und Verantwortung" },
    label: { en: "triage", de: "einordnen" },
  },
  {
    id: "spec",
    evidence: { en: "scope and checks", de: "Umfang und Prüfungen" },
    label: { en: "specify", de: "spezifizieren" },
  },
  {
    id: "launch",
    evidence: {
      en: "environment and base revision",
      de: "Umgebung und Basisrevision",
    },
    label: { en: "execute", de: "ausführen" },
  },
  {
    id: "async review",
    evidence: { en: "diff and command logs", de: "Diff und Befehlsprotokolle" },
    label: { en: "async review", de: "asynchron prüfen" },
  },
  {
    id: "iterate",
    evidence: { en: "review findings", de: "Review-Befunde" },
    label: { en: "iterate", de: "überarbeiten" },
  },
  {
    id: "merge",
    evidence: {
      en: "release and rollback gate",
      de: "Release- und Rollback-Gate",
    },
    label: { en: "merge", de: "zusammenführen" },
  },
];

interface L12DailyLoopProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly locale?: Locale;
}

const COPY: Record<
  Locale,
  {
    readonly eyebrow: string;
    readonly phases: string;
    readonly allScheduled: string;
    readonly yourDay: string;
    readonly complete: string;
  }
> = {
  en: {
    eyebrow: "◆ Exercise · Reviewable workflow",
    phases: "phases",
    allScheduled: "All phases sequenced.",
    yourDay: "workflow and evidence",
    complete: "Workflow sequence recorded.",
  },
  de: {
    eyebrow: "◆ Interaktiv · Prüfbarer Arbeitsablauf",
    phases: "Phasen",
    allScheduled: "Alle Phasen sind geordnet.",
    yourDay: "Arbeitsablauf und Nachweis",
    complete: "Ablaufreihenfolge dokumentiert.",
  },
};

export function L12DailyLoop({
  lessonId,
  cpId,
  locale = "en",
}: L12DailyLoopProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const copy = COPY[locale];
  const [scheduled, setScheduled] = useState<readonly string[]>([]);

  const schedule = (id: string) => {
    if (scheduled.includes(id)) return;
    const next = [...scheduled, id];
    setScheduled(next);
    if (next.length === BLOCKS.length) complete();
  };

  const remaining = BLOCKS.filter((b) => !scheduled.includes(b.id));

  return (
    <div className="min-w-0 max-w-full border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        {copy.eyebrow}
      </p>
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <div className="min-w-0">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            {copy.phases}
          </p>
          <div className="flex flex-col gap-2">
            {remaining.map((block) => (
              <button
                key={block.id}
                type="button"
                onClick={() => schedule(block.id)}
                className="min-w-0 break-words border-2 border-border bg-background px-3 py-2 text-left font-mono text-[12.5px] text-foreground transition-colors hover:border-brand-orange"
              >
                {block.label[locale]} ({block.evidence[locale]})
              </button>
            ))}
            {remaining.length === 0 && (
              <p className="font-mono text-[12px] text-muted-foreground">
                {copy.allScheduled}
              </p>
            )}
          </div>
        </div>
        <div className="min-w-0 border-2 border-border bg-background p-3">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            {copy.yourDay}
          </p>
          <ol className="flex flex-col gap-1 font-mono text-[12.5px] text-foreground">
            {scheduled.map((id, i) => {
              const block = BLOCKS.find((b) => b.id === id)!;
              return (
                <li key={id} className="break-words">
                  {i + 1}. {block.label[locale]} ({block.evidence[locale]})
                </li>
              );
            })}
          </ol>
          {scheduled.length === BLOCKS.length && (
            <p
              className={cn(
                "mt-3 border-2 border-risk-green bg-risk-green/10 px-2 py-2 text-center font-mono text-[13px] font-bold text-risk-green",
              )}
            >
              {copy.complete} {done ? "✓" : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default L12DailyLoop;

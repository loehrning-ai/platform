"use client";

import { useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";

/**
 * L12 (capstone) bespoke interactive — "The daily loop".
 * Ported from `codex/js/lessons/L12.js` (functional parity; the source's
 * drag-onto-a-24-hour-clock SVG is simplified to click-to-schedule — the
 * graded interaction is placing all 6 phases of the daily loop, in the
 * order they actually run, not the clock-face chrome).
 *
 * Six workflow blocks (triage, spec, launch, async review, iterate,
 * merge), each with its own duration. Clicking a block schedules it next
 * on today's timeline. The checkpoint awards once all 6 are scheduled.
 */

interface LoopBlock {
  readonly id: string;
  readonly duration: string;
}

const BLOCKS: readonly LoopBlock[] = [
  { id: "triage", duration: "15m" },
  { id: "spec", duration: "30m" },
  { id: "launch", duration: "5m" },
  { id: "async review", duration: "20m" },
  { id: "iterate", duration: "15m" },
  { id: "merge", duration: "10m" },
];

interface L12DailyLoopProps {
  readonly lessonId: string;
  readonly cpId: string;
}

export function L12DailyLoop({ lessonId, cpId }: L12DailyLoopProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [scheduled, setScheduled] = useState<readonly string[]>([]);

  const schedule = (id: string) => {
    if (scheduled.includes(id)) return;
    const next = [...scheduled, id];
    setScheduled(next);
    if (next.length === BLOCKS.length) complete();
  };

  const remaining = BLOCKS.filter((b) => !scheduled.includes(b.id));

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        ◆ Bespoke · The daily loop
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            phases
          </p>
          <div className="flex flex-col gap-2">
            {remaining.map((block) => (
              <button
                key={block.id}
                type="button"
                onClick={() => schedule(block.id)}
                className="border-2 border-border bg-background px-3 py-2 text-left font-mono text-[12.5px] text-foreground transition-colors hover:border-brand-orange"
              >
                {block.id} ({block.duration})
              </button>
            ))}
            {remaining.length === 0 && (
              <p className="font-mono text-[12px] text-muted-foreground">All phases scheduled.</p>
            )}
          </div>
        </div>
        <div className="border-2 border-border bg-background p-3">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            your day
          </p>
          <ol className="flex flex-col gap-1 font-mono text-[12.5px] text-foreground">
            {scheduled.map((id, i) => {
              const block = BLOCKS.find((b) => b.id === id)!;
              return (
                <li key={id}>
                  {i + 1}. {block.id} ({block.duration})
                </li>
              );
            })}
          </ol>
          {scheduled.length === BLOCKS.length && (
            <p
              className={cn(
                "mt-3 border-2 border-[#22c55e] bg-[#22c55e]/10 px-2 py-2 text-center font-mono text-[13px] font-bold text-[#22c55e]",
              )}
            >
              You are Codex-fluent. {done ? "✓" : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default L12DailyLoop;

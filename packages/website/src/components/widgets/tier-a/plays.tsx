"use client";

import { useEffect, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { useDraftValue } from "./use-draft-value";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "./_frame";

/**
 * Plays — commit to a set of concrete next moves by toggling options on.
 * Ported from `ai-native/course-app.js:174` (Plays). German copy.
 *
 *  - Multi-select toggle list (native buttons → keyboard + aria-pressed).
 *  - Picks persist locally (private) via useDraftValue.
 *  - When at least `minPick` options are chosen, the commitment is "locked"
 *    and the checkpoint is awarded once.
 *  - No motion to gate (CSS color change only).
 */

export interface PlaysWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly title?: string;
  readonly scenario?: string;
  readonly options: readonly string[];
  /** Minimum picks needed to "lock" the commitment + award XP. Default 1. */
  readonly minPick?: number;
}

export function PlaysWidget({
  lessonId,
  cpId,
  title = "Deine nächsten Züge",
  scenario = "Wähle die Maßnahmen, zu denen du dich verpflichtest.",
  options,
  minPick = 1,
}: PlaysWidgetProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [picked, setPicked] = useDraftValue<readonly number[]>(
    `plays::${lessonId}::${cpId}`,
    [],
  );

  const locked = picked.length >= minPick;

  useEffect(() => {
    if (locked) complete();
  }, [locked, complete]);

  const toggle = (i: number) =>
    setPicked(
      picked.includes(i) ? picked.filter((x) => x !== i) : [...picked, i],
    );

  return (
    <WidgetFrame
      kindLabel="Commitment"
      title={title}
      scenario={scenario}
      done={done}
      xpLabel="+10 XP"
    >
      <div className="flex flex-col gap-2">
        {options.map((option, i) => {
          const active = picked.includes(i);
          return (
            <button
              key={i}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(i)}
              className={cn(
                "flex items-center gap-3 border-2 border-border bg-background px-3 py-2.5 text-left text-[14px] text-foreground transition-colors",
                active
                  ? "border-brand-orange bg-brand-orange/10"
                  : "hover:border-brand-orange/60",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "inline-flex h-4 w-4 shrink-0 items-center justify-center border-2 text-[10px] font-bold",
                  active
                    ? "border-brand-orange bg-brand-orange text-white"
                    : "border-border text-transparent",
                )}
              >
                ✓
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>
      <p
        className={cn(
          "mt-4 font-mono text-[11px] tracking-[0.08em]",
          locked ? "text-[#22c55e]" : "text-muted-foreground",
        )}
      >
        {picked.length} / {minPick} gewählt
        {locked ? " · ✓ Commitment gesetzt" : ""}
      </p>
    </WidgetFrame>
  );
}

export default PlaysWidget;

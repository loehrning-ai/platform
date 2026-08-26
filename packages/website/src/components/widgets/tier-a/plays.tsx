"use client";

import { useEffect, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { useDraftValue } from "./use-draft-value";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "./_frame";
import type { Locale } from "@/lib/i18n/locale";

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
  /** Minimum picks needed to lock the commitment and record completion. Default 1. */
  readonly minPick?: number;
  readonly locale?: Locale;
  readonly kindLabel?: string;
  readonly selectedLabel?: string;
  readonly confirmedLabel?: string;
}

export function PlaysWidget({
  lessonId,
  cpId,
  title,
  scenario,
  options,
  minPick = 1,
  locale = "de",
  kindLabel = "Commitment",
  selectedLabel,
  confirmedLabel,
}: PlaysWidgetProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [picked, setPicked, draftReady] = useDraftValue<readonly number[]>(
    `plays::${lessonId}::${cpId}`,
    [],
  );

  const visiblePicks = draftReady ? picked : [];
  const locked = draftReady && visiblePicks.length >= minPick;

  useEffect(() => {
    if (draftReady && locked) complete();
  }, [draftReady, locked, complete]);

  const toggle = (i: number) =>
    setPicked(
      picked.includes(i) ? picked.filter((x) => x !== i) : [...picked, i],
    );

  return (
    <WidgetFrame
      kindLabel={kindLabel}
      title={title ?? (locale === "de" ? "Nächste Schritte" : "Next controls")}
      scenario={
        scenario ??
        (locale === "de"
          ? "Wähle die Maßnahmen, die du verbindlich umsetzen wirst."
          : "Select the controls you will implement.")
      }
      done={done}
      doneLabel={locale === "de" ? "Erledigt" : "Done"}
    >
      <div className="flex flex-col gap-2">
        {options.map((option, i) => {
          const active = visiblePicks.includes(i);
          return (
            <button
              key={i}
              type="button"
              aria-pressed={active}
              disabled={!draftReady}
              onClick={() => toggle(i)}
              className={cn(
                "flex min-h-11 items-center gap-3 border-2 border-border bg-background px-3 py-2.5 text-left text-[14px] text-foreground transition-colors disabled:cursor-wait disabled:opacity-60",
                active
                  ? "border-brand-orange bg-brand-orange/10"
                  : "hover:border-brand-orange/60",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "inline-flex h-5 w-5 shrink-0 items-center justify-center border-2 text-xs font-bold",
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
          "mt-4 font-mono text-xs tracking-[0.08em]",
          locked ? "text-risk-green" : "text-muted-foreground",
        )}
      >
        {visiblePicks.length} / {minPick}{" "}
        {selectedLabel ?? (locale === "de" ? "gewählt" : "selected")}
        {locked
          ? locale === "de"
            ? ` · ${confirmedLabel ?? "Commitment gesetzt"}`
            : ` · ${confirmedLabel ?? "Confirmed"}`
          : ""}
      </p>
    </WidgetFrame>
  );
}

export default PlaysWidget;

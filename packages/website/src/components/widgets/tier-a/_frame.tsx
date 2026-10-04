"use client";

import { useEffect, useRef, type JSX, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLabEmbed } from "@/components/widgets/lab/lab-context";

/**
 * WidgetFrame — shared, course-agnostic UI frame for the Tier-A drop-in
 * widgets (shared course architecture). A lighter sibling of the AI-Native
 * `exercises/_shell.tsx`: it does NOT depend on `lib/ai-native` types
 * (ModuleId / ExerciseKind) so it works for all three courses.
 *
 *  - Renders a kind label + title + scenario header in CI v3.0 styling.
 *  - Shows a static completion state driven by the caller (the unified-store
 *    `useCheckpoint` result). The frame never exposes reward totals.
 *  - Full keyboard navigation remains the responsibility of each widget body
 *    (see per-widget tests).
 *
 * German copy throughout. No em dashes.
 */

export interface WidgetFrameProps {
  /** Short uppercase kind chip, e.g. "Check", "Karten", "Vergleich". */
  readonly kindLabel: string;
  readonly title: string;
  /** One-line author-facing instruction shown above the body. */
  readonly scenario?: string;
  /** Whether the associated checkpoint is complete. */
  readonly done?: boolean;
  /** Localized completion label. Defaults to a language-neutral checkmark. */
  readonly doneLabel?: string;
  readonly children: ReactNode;
}

export function WidgetFrame({
  kindLabel,
  title,
  scenario,
  done = false,
  doneLabel = "✓",
  children,
}: WidgetFrameProps): JSX.Element {
  // A title that only repeats the kind chip ("◆ Kurzprüfung" over
  // "Kurzprüfung") stays a heading for assistive technology but is not
  // shown twice.
  const titleRepeatsKind =
    title.trim().toLocaleLowerCase() === kindLabel.trim().toLocaleLowerCase();
  const { embedded, onComplete } = useLabEmbed();
  // Tell the lesson-engine reader when the widget shows its done state. The
  // reader ignores bare checkpoints after a course reset; Tier-A widgets keep
  // their done state from the checkpoint, so they report it themselves.
  const notified = useRef(false);
  useEffect(() => {
    if (done && !notified.current) {
      notified.current = true;
      onComplete?.();
    }
  }, [done, onComplete]);
  if (embedded) {
    // Inside the lesson-engine reader the stage already shows the exercise
    // title and instructions; keep the heading for assistive technology only.
    return (
      <div data-widget-frame data-embedded="1" data-done={done ? "1" : "0"}>
        <h3 className="sr-only">{title}</h3>
        {scenario && (
          <p className="mb-4 max-w-[640px] text-[15px] leading-[1.6] text-muted-foreground">
            {scenario}
          </p>
        )}
        {children}
      </div>
    );
  }
  return (
    <div
      className="border-l-[3px] border-brand-orange bg-card/40 p-5 md:p-6"
      data-widget-frame
      data-done={done ? "1" : "0"}
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
          ◆ {kindLabel}
        </p>
        {done ? (
          <span
            data-completion-state
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-risk-green"
          >
            <CheckCircle2 aria-hidden="true" size={12} />
            {doneLabel}
          </span>
        ) : null}
      </div>
      <h3
        className={
          titleRepeatsKind
            ? "sr-only"
            : "mb-2 text-[18px] font-bold leading-[1.25] tracking-[-0.02em] text-foreground md:text-[20px]"
        }
      >
        {title}
      </h3>
      {scenario && (
        <p className="mb-5 max-w-[640px] text-[14px] leading-[1.6] text-muted-foreground">
          {scenario}
        </p>
      )}
      <div className={cn("mt-4")}>{children}</div>
    </div>
  );
}

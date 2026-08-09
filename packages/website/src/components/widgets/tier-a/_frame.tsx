"use client";

import { type JSX, type ReactNode } from "react";
import { m, useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * WidgetFrame — shared, course-agnostic UI frame for the Tier-A drop-in
 * widgets (shared course architecture). A lighter sibling of the AI-Native
 * `exercises/_shell.tsx`: it does NOT depend on `lib/ai-native` types
 * (ModuleId / ExerciseKind) so it works for all three courses.
 *
 *  - Renders a kind label + title + scenario header in CI v3.0 styling.
 *  - Shows a "done" badge driven by the caller (the unified-store
 *    `useCheckpoint` result), so XP and badges stay in one place.
 *  - `prefers-reduced-motion` skips the badge spring; full keyboard nav is
 *    the responsibility of each widget body (see per-widget tests).
 *
 * German copy throughout. No em dashes.
 */

export interface WidgetFrameProps {
  /** Short uppercase kind chip, e.g. "Check", "Karten", "Vergleich". */
  readonly kindLabel: string;
  readonly title: string;
  /** One-line author-facing instruction shown above the body. */
  readonly scenario?: string;
  /** Whether the associated checkpoint is complete (drives the done badge). */
  readonly done?: boolean;
  /** Optional XP amount shown in the done badge, e.g. "+15 XP". */
  readonly xpLabel?: string;
  /** Localized completion label. Defaults to the established German copy. */
  readonly doneLabel?: string;
  readonly children: ReactNode;
}

export function WidgetFrame({
  kindLabel,
  title,
  scenario,
  done = false,
  xpLabel,
  doneLabel = "Erledigt",
  children,
}: WidgetFrameProps): JSX.Element {
  const reduced = useReducedMotion();

  return (
    <div
      className="border-l-[3px] border-brand-orange bg-card/40 p-5 md:p-6"
      data-widget-frame
      data-done={done ? "1" : "0"}
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
          ◆ {kindLabel}
        </p>
        {done && (
          <m.span
            initial={reduced ? false : { scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={
              reduced
                ? { duration: 0 }
                : { type: "spring", stiffness: 400, damping: 15 }
            }
            className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-risk-green"
          >
            <CheckCircle2 size={12} />
            {xpLabel ? `${xpLabel} ✓` : doneLabel}
          </m.span>
        )}
      </div>
      <h3 className="mb-2 text-[18px] font-bold leading-[1.25] tracking-[-0.02em] text-foreground md:text-[20px]">
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

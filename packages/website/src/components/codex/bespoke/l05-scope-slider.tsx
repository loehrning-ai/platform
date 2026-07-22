"use client";

import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";

/**
 * L05 bespoke interactive — "Scope slider".
 * Ported from `codex/js/lessons/L05.js` (functional parity; the source's
 * confused-avatar rotation + SVG probability curve is simplified to a
 * numeric readout — the graded interaction is dwelling the slider in the
 * "sweet spot" (task size ≤ 1/3 of the range, roughly "morning-sized"),
 * not the avatar chrome).
 *
 * A slider from "1h" to "1w" of task size. Success probability follows the
 * source's exact formula (`0.92 * (1 - val) ** 2.5 + 0.08`). Dwelling in
 * the sweet spot (val ≤ 1/3) for 800ms awards the checkpoint once — the
 * dwell timer is cleared on unmount so it never fires after the component
 * is gone, mirroring the source's own guarded `setTimeout`.
 */

const SWEET_SPOT_MAX = 1 / 3;
const DWELL_MS = 800;

function successProbability(val: number): number {
  return 0.92 * Math.pow(1 - val, 2.5) + 0.08;
}

function toneFor(pct: number): "ok" | "warn" | "bad" {
  if (pct > 70) return "ok";
  if (pct > 40) return "warn";
  return "bad";
}

interface L05ScopeSliderProps {
  readonly lessonId: string;
  readonly cpId: string;
}

export function L05ScopeSlider({ lessonId, cpId }: L05ScopeSliderProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [value, setValue] = useState(0.6);
  const [locked, setLocked] = useState(false);
  const dwellTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDwell = useCallback(() => {
    if (dwellTimeoutRef.current) {
      clearTimeout(dwellTimeoutRef.current);
      dwellTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearDwell, [clearDwell]);

  useEffect(() => {
    if (locked) return;
    if (value <= SWEET_SPOT_MAX) {
      if (!dwellTimeoutRef.current) {
        dwellTimeoutRef.current = setTimeout(() => {
          dwellTimeoutRef.current = null;
          setLocked(true);
          complete();
        }, DWELL_MS);
      }
    } else {
      clearDwell();
    }
  }, [value, locked, complete, clearDwell]);

  const pct = Math.round(successProbability(value) * 100);
  const tone = toneFor(pct);
  const inSweetSpot = value <= SWEET_SPOT_MAX;

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        ◆ Bespoke · Scope slider
      </p>
      <div className="flex flex-col gap-3">
        <div className="relative">
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 bg-brand-orange/15",
            )}
            style={{ width: `${SWEET_SPOT_MAX * 100}%` }}
            aria-hidden="true"
          />
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(value * 100)}
            onChange={(e) => setValue(Number(e.target.value) / 100)}
            aria-label="Task size, from an hour to a week"
            aria-valuetext={`${Math.round(value * 100)} percent of the range`}
            disabled={locked}
            className="relative z-10 w-full accent-[var(--brand-orange)]"
          />
        </div>
        <div className="flex justify-between font-mono text-[10.5px] text-muted-foreground">
          <span>1h</span>
          <span>1d</span>
          <span>3d</span>
          <span>1w</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span
            className={cn(
              "font-mono text-[15px] font-bold",
              tone === "ok" ? "text-[#22c55e]" : tone === "warn" ? "text-brand-amber" : "text-destructive",
            )}
          >
            success: {pct}%
          </span>
          {inSweetSpot && !locked && (
            <span className="font-mono text-[11px] text-muted-foreground">holding sweet spot…</span>
          )}
          {locked && (
            <span className="font-mono text-[11px] font-bold text-[#22c55e]">
              sweet spot locked {done ? "✓" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default L05ScopeSlider;

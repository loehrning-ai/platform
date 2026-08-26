"use client";

import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/**
 * L05 bespoke interactive — "Scope slider".
 * Ported from `codex/js/lessons/L05.js` (functional parity; the source's
 * confused-avatar rotation + SVG probability curve is simplified to a
 * numeric readout — the graded interaction is dwelling the slider in the
 * focused end of an explicitly illustrative coupling range,
 * not the avatar chrome).
 *
 * The source's curve
 * (`0.92 * (1 - val) ** 2.5 + 0.08`) is retained only as an illustrative
 * scope-fit score, not presented as an empirical success probability. Dwelling in
 * the focused range (val ≤ 1/3) for 800ms awards the checkpoint once — the
 * dwell timer is cleared on unmount so it never fires after the component
 * is gone, mirroring the source's own guarded `setTimeout`.
 */

const FOCUSED_RANGE_MAX = 1 / 3;
const DWELL_MS = 800;

function illustrativeScopeFit(val: number): number {
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
  readonly locale?: Locale;
}

const COPY = {
  en: {
    heading: "◆ Exercise · Scope coupling",
    sliderLabel: "Task scope from one behavior to a multi-change initiative",
    valueText: (value: number) =>
      `${value} percent of the illustrative coupling range`,
    units: ["one behavior", "coupled", "multi-change", "initiative"],
    score: "illustrative reviewability",
    holding: "holding target range…",
    locked: "target range confirmed",
  },
  de: {
    heading: "◆ Praxis · Aufgabenumfang",
    sliderLabel:
      "Aufgabenumfang von einem Verhalten bis zu einer Initiative mit mehreren Änderungen",
    valueText: (value: number) =>
      `${value} Prozent des illustrativen Kopplungsbereichs`,
    units: ["ein Verhalten", "gekoppelt", "mehrere Änderungen", "Initiative"],
    score: "illustrative Prüfbarkeit",
    holding: "Zielbereich halten…",
    locked: "Zielbereich bestätigt",
  },
} as const satisfies Record<
  Locale,
  {
    readonly heading: string;
    readonly sliderLabel: string;
    readonly valueText: (value: number) => string;
    readonly units: readonly string[];
    readonly score: string;
    readonly holding: string;
    readonly locked: string;
  }
>;

export function L05ScopeSlider({
  lessonId,
  cpId,
  locale = "en",
}: L05ScopeSliderProps): JSX.Element {
  const copy = COPY[locale];
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
    if (value <= FOCUSED_RANGE_MAX) {
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

  const pct = Math.round(illustrativeScopeFit(value) * 100);
  const tone = toneFor(pct);
  const inFocusedRange = value <= FOCUSED_RANGE_MAX;

  return (
    <div className="min-w-0 max-w-full border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
        {copy.heading}
      </p>
      <div className="flex flex-col gap-3">
        <div className="relative">
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 bg-brand-orange/15",
            )}
            style={{ width: `${FOCUSED_RANGE_MAX * 100}%` }}
            aria-hidden="true"
          />
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(value * 100)}
            onChange={(e) => setValue(Number(e.target.value) / 100)}
            aria-label={copy.sliderLabel}
            aria-valuetext={copy.valueText(Math.round(value * 100))}
            disabled={locked}
            className="relative z-10 min-h-11 w-full accent-[var(--brand-orange)]"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 font-mono text-xs text-muted-foreground sm:grid-cols-4">
          {copy.units.map((unit, index) => (
            <span
              key={unit}
              className={cn(
                "min-w-0",
                index === 0 && "text-left",
                index === copy.units.length - 1 && "text-right",
                index > 0 && index < copy.units.length - 1
                  ? "hidden text-center sm:block"
                  : "block",
              )}
            >
              {unit}
            </span>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span
            className={cn(
              "font-mono text-[15px] font-bold",
              tone === "ok"
                ? "text-risk-green"
                : tone === "warn"
                  ? "text-brand-amber"
                  : "text-destructive",
            )}
          >
            {copy.score}: {pct}/100
          </span>
          {inFocusedRange && !locked && (
            <span className="font-mono text-xs text-muted-foreground">
              {copy.holding}
            </span>
          )}
          {locked && (
            <span className="font-mono text-xs font-bold text-risk-green">
              {copy.locked} {done ? "✓" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default L05ScopeSlider;

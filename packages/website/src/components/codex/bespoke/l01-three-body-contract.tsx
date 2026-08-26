"use client";

import { useEffect, useMemo, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/**
 * L01 bespoke interactive — "Three-body contract".
 * Ported from `codex/js/lessons/L01.js` (functional parity; the source's
 * CSS 3D transform + SVG glow filter is simplified to plain meter bars —
 * the graded interaction is which of task/repo/sandbox the learner has
 * weakened, not the visual chrome).
 *
 * Three levers (task / repo / sandbox) start at full strength. Each button
 * weakens one lever once; Reset restores all three. The overall "PR
 * quality" score is a weighted blend, mirroring the source's exact weights
 * (0.4 / 0.3 / 0.3). The checkpoint awards once every lever has been
 * weakened at least once.
 */

const LEVERS = ["task", "repo", "sandbox"] as const;
type Lever = (typeof LEVERS)[number];

const WEAK_VALUE: Record<Lever, number> = {
  task: 0.3,
  repo: 0.4,
  sandbox: 0.35,
};

const WEIGHT: Record<Lever, number> = {
  task: 0.4,
  repo: 0.3,
  sandbox: 0.3,
};

const COPY = {
  en: {
    heading: "◆ Exercise · Task contract inputs",
    labels: { task: "Task", repo: "Repo", sandbox: "Sandbox" },
    actions: {
      task: "Vague the task",
      repo: "Drop AGENTS.md",
      sandbox: "Cut sandbox tests",
    },
    reset: "Reset",
    quality: "Illustrative PR fit",
    complete: "$ contract-invariant confirmed",
  },
  de: {
    heading: "◆ Praxis · Drei Bestandteile des Auftragsrahmens",
    labels: { task: "Aufgabe", repo: "Repository", sandbox: "Sandbox" },
    actions: {
      task: "Aufgabe unklar machen",
      repo: "AGENTS.md entfernen",
      sandbox: "Sandbox-Tests entfernen",
    },
    reset: "Zurücksetzen",
    quality: "Illustrative Passung",
    complete: "$ Auftragsrahmen vollständig geprüft",
  },
} as const satisfies Record<
  Locale,
  {
    readonly heading: string;
    readonly labels: Record<Lever, string>;
    readonly actions: Record<Lever, string>;
    readonly reset: string;
    readonly quality: string;
    readonly complete: string;
  }
>;

interface L01ThreeBodyContractProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly locale?: Locale;
}

export function L01ThreeBodyContract({
  lessonId,
  cpId,
  locale = "en",
}: L01ThreeBodyContractProps): JSX.Element {
  const copy = COPY[locale];
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [values, setValues] = useState<Record<Lever, number>>({
    task: 1,
    repo: 1,
    sandbox: 1,
  });
  const [weakened, setWeakened] = useState<ReadonlySet<Lever>>(() => new Set());

  const quality = useMemo(() => {
    const raw = LEVERS.reduce(
      (sum, lever) => sum + values[lever] * WEIGHT[lever],
      0,
    );
    return Math.round(raw * 95);
  }, [values]);

  useEffect(() => {
    if (weakened.size === LEVERS.length && !done) complete();
  }, [complete, done, weakened]);

  const weaken = (lever: Lever) => {
    setValues((prev) => ({ ...prev, [lever]: WEAK_VALUE[lever] }));
    setWeakened((prev) => {
      if (prev.has(lever)) return prev;
      const next = new Set(prev);
      next.add(lever);
      return next;
    });
  };

  const reset = () => {
    setValues({ task: 1, repo: 1, sandbox: 1 });
    setWeakened(new Set());
  };

  const tone = quality < 40 ? "bad" : quality < 70 ? "warn" : "ok";

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
        {copy.heading}
      </p>
      <div className="grid gap-6 md:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-3">
          {LEVERS.map((lever) => (
            <div key={lever}>
              <div className="mb-1 flex items-center justify-between font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
                <span
                  className={cn(weakened.has(lever) && "text-brand-orange")}
                >
                  {copy.labels[lever]}
                </span>
                <span>{Math.round(values[lever] * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-border">
                <div
                  className="h-full bg-brand-orange transition-[width] duration-300"
                  style={{ width: `${values[lever] * 100}%` }}
                />
              </div>
            </div>
          ))}
          <div className="mt-2 flex flex-wrap gap-2">
            {LEVERS.map((lever) => (
              <button
                key={lever}
                type="button"
                onClick={() => weaken(lever)}
                className="min-h-11 border-2 border-border bg-background px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-foreground transition-colors hover:border-brand-orange"
              >
                {copy.actions[lever]}
              </button>
            ))}
            <button
              type="button"
              onClick={reset}
              className="min-h-11 border-2 border-brand-orange bg-background px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-brand-orange transition-colors hover:bg-brand-orange/10"
            >
              {copy.reset}
            </button>
          </div>
        </div>
        <div className="flex w-24 flex-col items-center gap-2">
          <div className="relative h-40 w-6 border-2 border-border bg-background">
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 transition-[height,background-color] duration-500",
                tone === "bad"
                  ? "bg-destructive"
                  : tone === "warn"
                    ? "bg-brand-amber"
                    : "bg-risk-green",
              )}
              style={{ height: `${quality}%` }}
            />
          </div>
          <span className="font-mono text-[14px] font-bold text-foreground">
            {quality}
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
            {copy.quality}
          </span>
        </div>
      </div>
      {weakened.size === LEVERS.length && (
        <p
          className="mt-4 font-mono text-xs text-risk-green"
          data-testid="l01-completion-message"
        >
          {copy.complete} {done ? "✓" : ""}
        </p>
      )}
    </div>
  );
}

export default L01ThreeBodyContract;

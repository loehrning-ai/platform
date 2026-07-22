"use client";

import { useEffect, useMemo, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "./_frame";

/**
 * TaskSpec — toggle the building blocks of a strong task spec and watch the
 * assembled brief + a "weak / mittel / stark" score bar update live.
 * Ported from `codex/js/widgets.js:128` (TaskSpec). German copy.
 *
 *  - Each item is a toggle button (native button → keyboard + a11y for free).
 *  - Once `threshold` items are on, awards the checkpoint once.
 *  - No animation that needs `prefers-reduced-motion` gating: the score bar
 *    is a CSS width transition (respects the global reduced-motion CSS).
 */

export interface TaskSpecItem {
  /** Section heading, e.g. "Kontext", "Akzeptanzkriterien". */
  readonly section: string;
  /** Short hint shown under the section label. */
  readonly hint?: string;
  /** Lines rendered into the assembled brief when the item is on. */
  readonly body?: readonly string[];
}

/**
 * Tier-label override: the "schwach/mittel/stark" score
 * band was a hardcoded German internal display string with NO override
 * mechanism at all (unlike `title`/`desc`/`goal`, which were already plain
 * per-instance props) — reusing this widget verbatim for an English course
 * would have rendered German tier words inside otherwise-English chrome.
 * Additive and default-preserving: defaults to the original German literals
 * so the 3 native courses render byte-identical.
 */
export interface TaskSpecTierLabels {
  readonly weak: string;
  readonly meh: string;
  readonly strong: string;
}

const DEFAULT_TIER_LABELS: TaskSpecTierLabels = {
  weak: "schwach",
  meh: "mittel",
  strong: "stark",
};

export interface TaskSpecWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly title?: string;
  readonly desc?: string;
  readonly goal?: string;
  readonly items: readonly TaskSpecItem[];
  /** How many items must be on to count as "stark" + award XP. Default 3. */
  readonly threshold?: number;
  readonly tierLabels?: Partial<TaskSpecTierLabels>;
}

type TierLevel = "weak" | "meh" | "strong";

function tierLevelFor(on: number, threshold: number): TierLevel {
  if (on >= threshold) return "strong";
  if (on >= 1) return "meh";
  return "weak";
}

export function TaskSpecWidget({
  lessonId,
  cpId,
  title = "Bau eine Aufgaben-Spezifikation",
  desc = "Schalte die Bausteine an, die in eine starke Spezifikation gehören. Rechts siehst du die zusammengesetzte Vorgabe.",
  goal = "Beschreibe die Änderung in einem Satz.",
  items,
  threshold = 3,
  tierLabels,
}: TaskSpecWidgetProps): JSX.Element {
  const labels = { ...DEFAULT_TIER_LABELS, ...tierLabels };
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [on, setOn] = useState<ReadonlySet<number>>(() => new Set());

  const total = items.length;
  const count = on.size;

  useEffect(() => {
    if (total > 0 && count >= threshold) complete();
  }, [count, threshold, total, complete]);

  const toggle = (i: number) =>
    setOn((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const tierLevel = tierLevelFor(count, threshold);
  const tier = labels[tierLevel];
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);

  const assembled = useMemo(() => {
    const lines: string[] = ["# aufgabe.md", "", "## Ziel", goal];
    items.forEach((it, i) => {
      if (!on.has(i)) return;
      lines.push("", `## ${it.section}`);
      (it.body ?? []).forEach((b) => lines.push(`  ${b}`));
    });
    return lines.join("\n");
  }, [items, on, goal]);

  return (
    <WidgetFrame
      kindLabel="Drill"
      title={title}
      scenario={desc}
      done={done}
      xpLabel="+20 XP"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {/* Toggles */}
        <div className="flex flex-col gap-2">
          {items.map((it, i) => {
            const active = on.has(i);
            return (
              <button
                key={i}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(i)}
                className={cn(
                  "flex items-start gap-3 border-2 border-border bg-background px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-brand-orange bg-brand-orange/10"
                    : "hover:border-brand-orange/60",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center border-2 text-[10px] font-bold",
                    active
                      ? "border-brand-orange bg-brand-orange text-white"
                      : "border-border text-transparent",
                  )}
                >
                  ✓
                </span>
                <span>
                  <span className="block text-[14px] font-semibold text-foreground">
                    {it.section}
                  </span>
                  {it.hint && (
                    <span className="block text-[12.5px] leading-[1.45] text-muted-foreground">
                      {it.hint}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Assembled output + score */}
        <div>
          <pre className="min-h-[120px] overflow-x-auto border-2 border-border bg-background p-3 font-mono text-[12px] leading-[1.6] text-foreground">
            {assembled}
          </pre>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[18px] font-bold text-brand-orange">
                {count}
              </span>
              <span className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground">
                / {total} Signale
              </span>
              <span
                data-tier={tierLevel}
                className={cn(
                  "ml-auto font-mono text-[10.5px] font-bold uppercase tracking-[0.14em]",
                  tierLevel === "strong"
                    ? "text-[#22c55e]"
                    : tierLevel === "meh"
                      ? "text-brand-amber"
                      : "text-muted-foreground",
                )}
              >
                {tier}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full bg-border">
              <div
                className={cn(
                  "h-full transition-[width,background-color] duration-300",
                  tierLevel === "strong"
                    ? "bg-[#22c55e]"
                    : tierLevel === "meh"
                      ? "bg-brand-amber"
                      : "bg-muted-foreground",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </WidgetFrame>
  );
}

export default TaskSpecWidget;

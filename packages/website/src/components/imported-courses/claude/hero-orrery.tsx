"use client";

import { useMemo, useState, type JSX } from "react";
import { cn } from "@/lib/utils";
import { genericAnswer, simulatedDelayMs } from "@/lib/claude-course/simulated-claude";

/**
 * HeroOrrery, the claude-course landing-page hero demo. Ported from
 * `claude/js/widgets.js:847` (PromptOrrery). Confirmed zero props, no
 * checkpoint, never mounted inside a lesson (only `index.html`'s hero
 * section), this is a deliberately bespoke, non-registry component, not a
 * `WidgetKind`.
 */
interface PromptPart {
  readonly id: string;
  readonly label: string;
  readonly weight: number;
  readonly default: boolean;
  readonly content: string;
  readonly hint: string;
}

const PARTS: readonly PromptPart[] = [
  {
    id: "role",
    label: "Role",
    weight: 18,
    default: true,
    content: "You are a staff engineer writing internal documentation.",
    hint: "Who Claude is being. Sets vocabulary, seniority, tone.",
  },
  {
    id: "context",
    label: "Context",
    weight: 22,
    default: true,
    content: "We're launching AuthKit v2 next Monday, a drop-in replacement for legacy SSO.",
    hint: "Background the model cannot know. The world your task lives in.",
  },
  {
    id: "task",
    label: "Task",
    weight: 28,
    default: true,
    content: "Draft the internal launch email.",
    hint: "The single thing you want. One verb, one object.",
  },
  {
    id: "constraints",
    label: "Constraints",
    weight: 16,
    default: false,
    content: "Under 180 words. No marketing language. One clear migration action at the top.",
    hint: "The invisible rails. Prevents Claude from wandering.",
  },
  {
    id: "format",
    label: "Format",
    weight: 16,
    default: false,
    content: "Subject line, then body. No sign-off. CLI command in a code block.",
    hint: "The shape of the answer. Where structure lives.",
  },
];

function qualityLabel(quality: number): string {
  if (quality >= 90) return "production-ready";
  if (quality >= 70) return "solid";
  if (quality >= 40) return "thin";
  if (quality >= 20) return "weak";
  return "a wish, not a prompt";
}

export function HeroOrrery(): JSX.Element {
  const [active, setActive] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PARTS.map((p) => [p.id, p.default])),
  );
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeParts = useMemo(() => PARTS.filter((p) => active[p.id]), [active]);
  const quality = Math.min(100, activeParts.reduce((sum, p) => sum + p.weight, 0));
  const assembled = useMemo(
    () => activeParts.map((p) => `${p.label.toUpperCase()}\n${p.content}`).join("\n\n"),
    [activeParts],
  );

  const toggle = (id: string) => setActive((prev) => ({ ...prev, [id]: !prev[id] }));

  const run = async () => {
    if (!assembled.trim()) return;
    setLoading(true);
    setOutput(null);
    await new Promise((resolve) => setTimeout(resolve, simulatedDelayMs(assembled)));
    setOutput(genericAnswer(assembled));
    setLoading(false);
  };

  const qColor = quality >= 80 ? "text-[#22c55e]" : quality >= 40 ? "text-brand-amber" : "text-destructive";
  const qBar = quality >= 80 ? "bg-[#22c55e]" : quality >= 40 ? "bg-brand-amber" : "bg-destructive";

  return (
    <div className="border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_var(--color-foreground)] md:p-8">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            prompt foundry
          </p>
          <h3 className="mt-2 text-[22px] font-bold tracking-[-0.02em] text-foreground">
            Five parts. Toggle each.
          </h3>
          <p className="mt-1 max-w-[380px] text-[14px] leading-[1.5] text-muted-foreground">
            Click a card to include or remove it. The quality score responds live.
          </p>
        </div>
        <div className="min-w-[120px] border border-border bg-background p-4 text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            quality
          </p>
          <p className={cn("mt-1 font-mono text-[32px] font-bold leading-none", qColor)}>
            {quality}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
            {qualityLabel(quality)}
          </p>
          <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-border">
            <div
              className={cn("h-full transition-[width] duration-500", qBar)}
              style={{ width: `${quality}%` }}
            />
          </div>
        </div>
      </div>

      <div role="group" aria-label="Prompt parts" className="mt-6 flex flex-col gap-2">
        {PARTS.map((part) => {
          const on = !!active[part.id];
          return (
            <button
              key={part.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(part.id)}
              className={cn(
                "flex flex-col gap-0.5 border-2 px-4 py-2.5 text-left transition-colors",
                on
                  ? "border-brand-orange bg-brand-orange/10"
                  : "border-border bg-background hover:border-brand-orange/60",
              )}
            >
              <span className="flex items-center justify-between font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-brand-orange">
                {part.label}
                <span className="text-muted-foreground">
                  {on ? "on" : "off"} · +{part.weight}
                </span>
              </span>
              <span className="text-[13px] leading-[1.45] text-muted-foreground">
                {on ? part.content : part.hint}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={loading || !assembled.trim()}
          className="border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? "Running…" : output ? "Run again →" : "Run live →"}
        </button>
        {!loading && output && (
          <span className="font-mono text-[11px] text-muted-foreground">
            {output.split(/\s+/).filter(Boolean).length} words · from {activeParts.length} parts
          </span>
        )}
      </div>

      {output && (
        <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap border border-border bg-background p-4 text-[13px] leading-[1.55] text-foreground">
          {output}
        </pre>
      )}
    </div>
  );
}

export default HeroOrrery;

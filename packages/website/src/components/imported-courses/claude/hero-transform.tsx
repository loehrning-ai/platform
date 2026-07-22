"use client";

import { useState, type JSX } from "react";
import { cn } from "@/lib/utils";
import { genericAnswer, simulatedDelayMs } from "@/lib/claude-course/simulated-claude";

/**
 * HeroTransform, the claude-course landing-page hero demo. Ported from
 * `claude/js/widgets.js:638` (PromptTransform). Confirmed zero props, no
 * checkpoint, never mounted inside a lesson (only `index.html`'s hero
 * section), a deliberately bespoke, non-registry component.
 */
interface Stage {
  readonly label: string;
  readonly quality: number;
  readonly prompt: string;
  readonly note: string;
}

const STAGES: readonly Stage[] = [
  {
    label: "vague",
    quality: 18,
    prompt: "write a launch email",
    note: "No role. No audience. No goal. No format. Claude has to guess everything.",
  },
  {
    label: "specific",
    quality: 58,
    prompt:
      "Write a launch email announcing our new authentication service to internal engineers. Keep it short.",
    note: "Better: audience, subject, tone-hint. Still missing structure and success criteria.",
  },
  {
    label: "structured",
    quality: 94,
    prompt: `You are a staff engineer drafting an internal launch announcement.

CONTEXT
We're rolling out AuthKit v2, a new authentication service replacing the legacy SSO. It ships next Monday, opt-in for 2 weeks, then default.

AUDIENCE
Internal engineers (mixed seniority). They skim. They hate ceremony.

TASK
Write the launch email.

CONSTRAINTS
- Under 180 words
- One clear migration action at the top
- No marketing language
- Code-block the CLI command

FORMAT
Subject line, then body. No sign-off.`,
    note: "Role. Context. Task. Constraints. Format. Claude has everything it needs to nail it first try.",
  },
];

export function HeroTransform(): JSX.Element {
  const [stageIdx, setStageIdx] = useState(0);
  const [outputs, setOutputs] = useState<(string | null)[]>([null, null, null]);
  const [loading, setLoading] = useState(false);

  const active = STAGES[stageIdx];

  const run = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, simulatedDelayMs(active.prompt)));
    const result = genericAnswer(active.prompt);
    setOutputs((prev) => prev.map((o, i) => (i === stageIdx ? result : o)));
    setLoading(false);
  };

  return (
    <div className="grid gap-0 border-2 border-foreground shadow-[6px_6px_0_var(--color-foreground)] md:grid-cols-2">
      <div className="border-b border-border bg-card p-6 md:border-b-0 md:border-r">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              the prompt
            </p>
            <p className="mt-1 text-[16px] font-semibold text-foreground">
              stage {stageIdx + 1} / 3 · {active.label}
            </p>
          </div>
          <div role="group" aria-label="Choose stage" className="flex gap-1.5">
            {STAGES.map((stage, i) => (
              <button
                key={stage.label}
                type="button"
                aria-pressed={i === stageIdx}
                onClick={() => setStageIdx(i)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[12px]",
                  i === stageIdx
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        <pre className="max-h-[220px] overflow-y-auto whitespace-pre-wrap border border-border bg-background p-3 text-[12.5px] leading-[1.5] text-foreground">
          {active.prompt}
        </pre>
        <div className="mt-3 border border-border bg-background p-3">
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] text-brand-amber">
            diagnosis
          </p>
          <p className="mt-1 text-[13px] leading-[1.5] text-muted-foreground">{active.note}</p>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              prompt quality
            </p>
            <div className="h-[6px] w-full overflow-hidden rounded-full bg-border">
              <div
                className={cn(
                  "h-full transition-[width] duration-500",
                  active.quality > 80 ? "bg-[#22c55e]" : active.quality > 40 ? "bg-brand-amber" : "bg-destructive",
                )}
                style={{ width: `${active.quality}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="shrink-0 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? "Running…" : `Run stage ${stageIdx + 1} →`}
          </button>
        </div>
      </div>
      <div className="bg-background p-6">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          claude's output
        </p>
        <p className="mt-1 text-[16px] font-semibold text-foreground">
          {outputs[stageIdx] ? "here's what you got" : "waiting for you"}
        </p>
        <div
          className={cn(
            "mt-4 min-h-[260px] whitespace-pre-wrap border p-4 text-[13.5px] leading-[1.6] text-foreground",
            stageIdx === 2 ? "border-brand-amber/40 bg-brand-amber/5" : "border-border bg-card/40",
          )}
        >
          {outputs[stageIdx] ?? (
            <span className="italic text-muted-foreground">
              Hit &quot;Run stage {stageIdx + 1}&quot; to see Claude&apos;s response. Try stages 1 to 2 to 3 to
              feel the jump.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default HeroTransform;

"use client";

import { useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "../tier-a/_frame";
import { RunConsole } from "./_run-console";
import { genericAnswer, simulatedDelayMs } from "@/lib/claude-course/simulated-claude";

/**
 * PromptSandbox, free-form prompt box run against the simulated Claude.
 * Ported from `claude/js/widgets.js:54` (PromptSandbox). No network call
 * (see `lib/claude-course/simulated-claude.ts`); the checkpoint awards once
 * the learner runs a prompt of at least `minChars` characters.
 */
export interface PromptSandboxWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly title?: string;
  readonly hint?: string;
  readonly placeholder?: string;
  readonly starter?: string;
  readonly minChars?: number;
}

const RUN_BUTTON_CLASS = cn(
  "inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0",
);

export function PromptSandboxWidget({
  lessonId,
  cpId,
  title = "Prompt sandbox",
  hint,
  placeholder = "Type a prompt…",
  starter = "",
  minChars = 10,
}: PromptSandboxWidgetProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [value, setValue] = useState(starter);
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!value.trim()) return;
    setLoading(true);
    setOutput(null);
    await new Promise((resolve) => setTimeout(resolve, simulatedDelayMs(value)));
    setOutput(genericAnswer(value));
    setLoading(false);
    if (value.length >= minChars) complete();
  };

  return (
    <WidgetFrame kindLabel="Try it" title={title} scenario={hint} done={done} xpLabel="+10 XP">
      <textarea
        rows={5}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={title}
        className="w-full border-2 border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] text-muted-foreground">
          {value.length} chars
        </span>
        <button
          type="button"
          onClick={run}
          disabled={loading || !value.trim()}
          className={RUN_BUTTON_CLASS}
        >
          {loading ? "Running…" : "Run prompt →"}
        </button>
      </div>
      <RunConsole
        loading={loading}
        output={output}
        onClear={() => setOutput(null)}
        emptyHint="Output appears here."
      />
    </WidgetFrame>
  );
}

export default PromptSandboxWidget;

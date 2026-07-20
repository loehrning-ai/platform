"use client";

import { type JSX, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Dots + RunConsole — shared chrome for the claude-course "simulated Claude"
 * widgets (plan 008 stage 4). Ported from `claude/js/widgets.js`'s `Dots`
 * and `RunConsole`, simplified to a loading -> output swap (no word-by-word
 * streaming reveal) to match this platform's existing Practice Room widgets
 * (`usePracticeApi` callers) rather than the source's bespoke animation.
 */
export function Dots(): JSX.Element {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
      <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
      <span className="h-1 w-1 animate-bounce rounded-full bg-current" />
    </span>
  );
}

export type RunConsoleTone = "default" | "bad" | "ok" | "amber";

const TONE_BORDER: Record<RunConsoleTone, string> = {
  default: "border-border",
  bad: "border-destructive",
  ok: "border-[#22c55e]",
  amber: "border-brand-amber",
};

const TONE_DOT: Record<RunConsoleTone, string> = {
  default: "bg-border",
  bad: "bg-destructive",
  ok: "bg-[#22c55e]",
  amber: "bg-brand-amber",
};

export interface RunConsoleProps {
  readonly loading: boolean;
  readonly output: string | null;
  readonly onClear?: () => void;
  readonly label?: string;
  readonly emptyHint?: string;
  readonly tone?: RunConsoleTone;
  readonly children?: ReactNode;
}

export function RunConsole({
  loading,
  output,
  onClear,
  label = "claude's output",
  emptyHint = "Output will appear here.",
  tone = "default",
  children,
}: RunConsoleProps): JSX.Element | null {
  const open = loading || !!output || !!children;
  if (!open) return null;

  return (
    <div className={cn("mt-3 border-2 bg-background", TONE_BORDER[tone])}>
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="inline-flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          <span
            aria-hidden="true"
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              loading ? "bg-brand-amber" : output ? TONE_DOT[tone] : "bg-border",
            )}
          />
          {label}
          {loading && <Dots />}
        </span>
        {!loading && output && onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Dismiss output"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            ×
          </button>
        )}
      </div>
      <div className="max-h-[280px] overflow-y-auto p-3 text-[13px] leading-[1.6] text-foreground">
        {children ? (
          children
        ) : output ? (
          <p className="whitespace-pre-wrap">{output}</p>
        ) : loading ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            Thinking <Dots />
          </p>
        ) : (
          <p className="italic text-muted-foreground">{emptyHint}</p>
        )}
      </div>
    </div>
  );
}

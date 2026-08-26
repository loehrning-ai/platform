"use client";

import { type JSX, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useClaudeWidgetLocale } from "./locale-context";

/**
 * Shared output chrome for deterministic Claude-course exercises. The label
 * states that the result comes from fixed local rules without an API call.
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
  ok: "border-risk-green",
  amber: "border-brand-amber",
};

const TONE_DOT: Record<RunConsoleTone, string> = {
  default: "bg-border",
  bad: "bg-destructive",
  ok: "bg-risk-green",
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
  label,
  emptyHint,
  tone = "default",
  children,
}: RunConsoleProps): JSX.Element | null {
  const locale = useClaudeWidgetLocale();
  const resolvedLabel =
    label ?? (locale === "de" ? "Lokale Simulation" : "Local simulation");
  const resolvedEmptyHint =
    emptyHint ??
    (locale === "de"
      ? "Die Ausgabe erscheint hier."
      : "Output will appear here.");
  const open = loading || !!output || !!children;
  if (!open) return null;

  return (
    <div className={cn("mt-3 border-2 bg-background", TONE_BORDER[tone])}>
      <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-2">
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          <span
            aria-hidden="true"
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              loading
                ? "bg-brand-amber"
                : output
                  ? TONE_DOT[tone]
                  : "bg-border",
            )}
          />
          {resolvedLabel}
          <span className="font-normal normal-case tracking-normal text-muted-foreground/80">
            ·{" "}
            {locale === "de"
              ? "feste Regeln, kein API-Aufruf"
              : "fixed rules, no API call"}
          </span>
          {loading && <Dots />}
        </span>
        {!loading && output && onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label={
              locale === "de" ? "Ausgabe schließen" : "Dismiss output"
            }
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            ×
          </button>
        )}
      </div>
      <div className="min-w-0 max-h-[280px] overflow-y-auto p-3 text-[13px] leading-[1.6] text-foreground">
        {children ? (
          children
        ) : output ? (
          <p className="whitespace-pre-wrap break-words">{output}</p>
        ) : loading ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            {locale === "de"
              ? "Lokale Regeln werden ausgeführt"
              : "Running local rules"}{" "}
            <Dots />
          </p>
        ) : (
          <p className="italic text-muted-foreground">{resolvedEmptyHint}</p>
        )}
      </div>
    </div>
  );
}

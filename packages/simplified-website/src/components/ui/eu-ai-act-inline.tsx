"use client";

import { Term } from "./term";
import { glossary } from "@/lib/methodology-copy";

export interface EuAiActInlineProps {
  /** Set on the first occurrence on the page to render the expanded definition inline. */
  firstMention?: boolean;
  testId?: string;
}

const entry = glossary.eu_ai_act;

/**
 * Specialised <Term> preset for the single most-used jargon term on the
 * homepage. On its first occurrence on the page (firstMention=true) it
 * renders an always-visible definition pill next to the label. On every
 * other occurrence it falls back to the regular <Term> behaviour.
 */
export function EuAiActInline({ firstMention, testId }: EuAiActInlineProps) {
  if (firstMention) {
    return (
      <span
        data-eu-ai-act-first="true"
        data-testid={testId ?? "eu-ai-act-first-mention"}
        className="inline-flex flex-wrap items-baseline gap-2"
      >
        <span className="font-semibold text-foreground">EU AI Act</span>
        <span className="inline-block border border-border/60 bg-card/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {entry.short}
        </span>
      </span>
    );
  }

  return (
    <Term
      id="eu_ai_act"
      label={entry.label}
      short={entry.short}
      testId={testId}
    />
  );
}

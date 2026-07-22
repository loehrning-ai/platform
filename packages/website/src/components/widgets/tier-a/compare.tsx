"use client";

import { type JSX } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "./_frame";

/**
 * Compare — side-by-side weak vs strong columns.
 * Ported from `codex/js/widgets.js:367` (Compare). German copy.
 *
 * Stateless and presentational (no checkpoint): a teaching exhibit, not a
 * graded interaction. Hover lifts the column subtly via CSS only, so it is
 * inherently `prefers-reduced-motion` safe. Keyboard-irrelevant (no controls).
 */

export interface CompareWidgetProps {
  readonly title?: string;
  /** The weak / wrong example. */
  readonly bad: string;
  /** The strong / right example. */
  readonly good: string;
  readonly badLabel?: string;
  readonly goodLabel?: string;
  /** Optional takeaway note shown below the columns. */
  readonly note?: string;
  /**
   * Chrome kindLabel override: was hardcoded German with
   * no override, unlike `title`/`badLabel`/`goodLabel` which were already
   * plain per-instance props. Defaults to the original German literal so
   * the 3 native courses render byte-identical; codex passes "Compare".
   */
  readonly kindLabel?: string;
}

export function CompareWidget({
  title = "Gleiche Aufgabe, zwei Formen",
  bad,
  good,
  badLabel = "Schwach",
  goodLabel = "Stark",
  note,
  kindLabel = "Vergleich",
}: CompareWidgetProps): JSX.Element {
  return (
    <WidgetFrame kindLabel={kindLabel} title={title}>
      <div className="grid gap-3 md:grid-cols-2">
        <CompareColumn label={badLabel} body={bad} tone="bad" />
        <CompareColumn label={goodLabel} body={good} tone="good" />
      </div>
      {note && (
        <div className="mt-4 flex items-start gap-2 border-l-[3px] border-brand-orange bg-brand-orange/5 p-3 text-[13.5px] leading-[1.55] text-foreground">
          <span aria-hidden="true" className="text-brand-orange">
            ▸
          </span>
          <span>{note}</span>
        </div>
      )}
    </WidgetFrame>
  );
}

function CompareColumn({
  label,
  body,
  tone,
}: {
  readonly label: string;
  readonly body: string;
  readonly tone: "bad" | "good";
}): JSX.Element {
  const good = tone === "good";
  return (
    <div
      className={cn(
        "border-2 bg-background p-4 transition-transform hover:-translate-y-0.5",
        good ? "border-[#22c55e]" : "border-destructive",
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className={cn(
            "font-mono text-[10.5px] font-bold uppercase tracking-[0.14em]",
            good ? "text-[#22c55e]" : "text-destructive",
          )}
        >
          {label}
        </span>
        {good ? (
          <ThumbsUp size={14} className="text-[#22c55e]" aria-hidden="true" />
        ) : (
          <ThumbsDown size={14} className="text-destructive" aria-hidden="true" />
        )}
      </div>
      <p className="text-[14px] leading-[1.6] text-foreground">{body}</p>
    </div>
  );
}

export default CompareWidget;

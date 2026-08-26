import { type JSX } from "react";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "./_frame";

/**
 * DiffViewer — stateless unified-diff line list.
 * Ported from `codex/js/widgets.js` (Diff).
 *
 * Stateless and presentational (no checkpoint), matching `compare.tsx`'s
 * pattern: a teaching exhibit, not a graded interaction. Line numbers only
 * increment for non-removed lines, matching the source's own numbering.
 */

export interface DiffViewerLine {
  readonly type: "add" | "remove" | "context";
  readonly text: string;
}

export interface DiffViewerWidgetProps {
  readonly title?: string;
  readonly file?: string;
  readonly lines: readonly DiffViewerLine[];
  readonly note?: string;
}

export function DiffViewerWidget({
  title = "The patch Codex produces",
  file = "patch.diff",
  lines,
  note,
}: DiffViewerWidgetProps): JSX.Element {
  const plus = lines.filter((l) => l.type === "add").length;
  const minus = lines.filter((l) => l.type === "remove").length;

  let lineNumber = 1;

  return (
    <WidgetFrame kindLabel="Diff" title={title}>
      <div className="border-2 border-border bg-background">
        <div className="flex items-center justify-between border-b border-border bg-card/60 px-3 py-2 font-mono text-xs text-muted-foreground">
          <span>{file}</span>
          <span className="flex gap-2">
            <span className="text-risk-green">+{plus}</span>
            <span className="text-destructive">&minus;{minus}</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          {lines.map((line, i) => {
            const shown = line.type === "remove" ? "" : lineNumber++;
            const marker =
              line.type === "add" ? "+" : line.type === "remove" ? "−" : " ";
            return (
              <div
                key={i}
                className={cn(
                  "flex gap-3 px-3 py-0.5 font-mono text-[12.5px] leading-[1.6]",
                  line.type === "add" && "bg-risk-green/10",
                  line.type === "remove" && "bg-destructive/10",
                )}
              >
                <span className="w-6 shrink-0 select-none text-right text-muted-foreground/60">
                  {shown}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "w-3 shrink-0 select-none",
                    line.type === "add" && "text-risk-green",
                    line.type === "remove" && "text-destructive",
                  )}
                >
                  {marker}
                </span>
                <span className="whitespace-pre-wrap break-words text-foreground">
                  {line.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {note && (
        <p className="mt-3 text-[13px] leading-[1.55] text-muted-foreground">
          {note}
        </p>
      )}
    </WidgetFrame>
  );
}

export default DiffViewerWidget;

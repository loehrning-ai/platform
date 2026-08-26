"use client";

import { useMemo, type JSX } from "react";
import { WidgetFrame } from "../tier-a/_frame";
import { useClaudeWidgetLocale } from "./locale-context";

/**
 * PromptDiff, word-by-word diff between a weak and a strong prompt. Ported
 * from `claude/js/widgets.js:832` (PromptDiff). Purely a display widget in
 * the source (no `lessonId`/`cpId`, no live call, no checkpoint), this port
 * keeps that shape exactly.
 */
export interface PromptDiffWidgetProps {
  readonly weak: string;
  readonly strong: string;
  readonly takeaway?: string;
}

interface DiffToken {
  readonly text: string;
  readonly changed: boolean;
}

function diffTokens(
  source: string,
  otherWordSet: ReadonlySet<string>,
): DiffToken[] {
  return source.split(/(\s+)/).map((token) => {
    const bare = token.toLowerCase().trim();
    const changed = bare.length > 0 && !otherWordSet.has(bare);
    return { text: token, changed };
  });
}

export function PromptDiffWidget({
  weak,
  strong,
  takeaway,
}: PromptDiffWidgetProps): JSX.Element {
  const locale = useClaudeWidgetLocale();
  const german = locale === "de";
  const weakTokens = useMemo(() => {
    const strongWords = new Set(strong.toLowerCase().split(/\s+/));
    return diffTokens(weak, strongWords);
  }, [weak, strong]);
  const strongTokens = useMemo(() => {
    const weakWords = new Set(weak.toLowerCase().split(/\s+/));
    return diffTokens(strong, weakWords);
  }, [weak, strong]);

  return (
    <WidgetFrame
      kindLabel={german ? "Diff-Ansicht" : "Diff view"}
      title={
        german ? "Änderungen im direkten Vergleich" : "Changes side by side"
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-destructive">
            {german ? "Vorher" : "Before"}
          </p>
          <div className="border border-destructive/30 bg-destructive/5 p-3 text-[13px] leading-[1.7] text-foreground">
            {weakTokens.map((token, i) =>
              token.changed ? (
                <span
                  key={i}
                  className="bg-destructive/20 line-through decoration-destructive"
                >
                  {token.text}
                </span>
              ) : (
                <span key={i}>{token.text}</span>
              ),
            )}
          </div>
        </div>
        <div>
          <p className="mb-1.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-risk-green">
            {german ? "Nachher" : "After"}
          </p>
          <div className="border border-risk-green/30 bg-risk-green/5 p-3 text-[13px] leading-[1.7] text-foreground">
            {strongTokens.map((token, i) =>
              token.changed ? (
                <span key={i} className="bg-risk-green/20 font-semibold">
                  {token.text}
                </span>
              ) : (
                <span key={i}>{token.text}</span>
              ),
            )}
          </div>
        </div>
      </div>
      {takeaway && (
        <div className="mt-4 border-l-[3px] border-brand-amber bg-brand-amber/5 px-3 py-2 text-[13.5px] leading-[1.5] text-foreground">
          <strong>{german ? "Kernaussage:" : "Takeaway:"}</strong> {takeaway}
        </div>
      )}
    </WidgetFrame>
  );
}

export default PromptDiffWidget;

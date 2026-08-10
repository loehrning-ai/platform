"use client";

import { useMemo, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "../tier-a/_frame";
import { useClaudeWidgetLocale } from "./locale-context";

/**
 * Tokenizer, local tokenization illustration. Ported from
 * `claude/js/widgets.js:741` (Tokenizer). Pure client-side, no simulated
 * Claude call.
 */
export interface TokenizerWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
}

interface Token {
  readonly text: string;
  readonly whitespace?: boolean;
  readonly subword?: boolean;
}

const HUES = [40, 55, 130, 250, 310, 20, 160, 285];

function tokenize(text: string): Token[] {
  if (!text) return [];
  const chunks = text.match(/(\s+|[\w']+|[^\w\s])/g) ?? [];
  const result: Token[] = [];
  for (const chunk of chunks) {
    if (/^\s+$/.test(chunk)) {
      result.push({ text: chunk, whitespace: true });
      continue;
    }
    if (chunk.length <= 4) {
      result.push({ text: chunk });
      continue;
    }
    let i = 0;
    while (i < chunk.length) {
      const chunkLen = i === 0 ? 3 : Math.min(4, chunk.length - i);
      result.push({ text: chunk.slice(i, i + chunkLen), subword: i > 0 });
      i += chunkLen;
    }
  }
  return result;
}

export function TokenizerWidget({
  lessonId,
  cpId,
}: TokenizerWidgetProps): JSX.Element {
  const locale = useClaudeWidgetLocale();
  const german = locale === "de";
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [text, setText] = useState(
    german
      ? "Der schnelle braune Fuchs springt über den faulen Hund."
      : "The quick brown fox jumps over the lazy dog.",
  );
  const tokens = useMemo(() => tokenize(text), [text]);
  const nonWhitespaceCount = tokens.filter((t) => !t.whitespace).length;

  return (
    <WidgetFrame
      kindLabel={german ? "Technik" : "Under the hood"}
      title={
        german ? "Tokenisierung veranschaulichen" : "Tokenization illustration"
      }
      scenario={
        german
          ? "Lokale Heuristik, kein Claude-Tokenizer. Verwende für echte Zählungen das Tool des gewählten Modells."
          : "Local heuristic, not a Claude tokenizer. Use the selected model's tool for real counts."
      }
      done={done}
      xpLabel="+10 XP"
    >
      <textarea
        rows={3}
        value={text}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          if (next.length > 80) complete();
        }}
        aria-label={german ? "Zu tokenisierender Text" : "Text to tokenize"}
        className="w-full border-2 border-border bg-background px-3 py-2 text-[14px] text-foreground focus-visible:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
      />
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
        {nonWhitespaceCount}{" "}
        {german ? "simulierte Segmente" : "simulated segments"} · {text.length}{" "}
        {german ? "Zeichen" : "chars"}
      </p>
      <div className="mt-3 border border-border bg-card/40 p-4 text-[15px] leading-[2.2]">
        {tokens.map((token, i) =>
          token.whitespace ? (
            <span key={i}> </span>
          ) : (
            <span
              key={i}
              className={cn(
                "mr-0.5 rounded px-1.5 py-0.5 font-mono text-[13px]",
                token.subword
                  ? "border border-dashed border-muted-foreground"
                  : "border border-transparent",
              )}
              style={{
                background: `oklch(0.88 0.08 ${HUES[i % HUES.length]} / 0.6)`,
              }}
            >
              {token.text}
            </span>
          ),
        )}
      </div>
      <p className="mt-2 text-[12.5px] italic text-muted-foreground">
        {german
          ? "Gestrichelte Rahmen markieren lokal erzeugte Teilstücke. Die tatsächliche Tokenisierung hängt von Modell und Inhalt ab."
          : "Dashed borders mark locally generated pieces. Actual tokenization depends on the model and content."}
      </p>
    </WidgetFrame>
  );
}

export default TokenizerWidget;

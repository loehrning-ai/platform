"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";

/**
 * L07 bespoke interactive — "PR x-ray".
 * Ported from `codex/js/lessons/L07.js` (functional parity; the source's
 * syntax-highlighted code + hover tooltip + confetti burst is simplified to
 * a plain code list — the graded interaction is finding the 3 real bugs
 * without racking up false alarms, not the syntax coloring).
 *
 * A short rate-limiter snippet with 3 real bugs (lines 4, 11, 15). Clicking
 * a buggy line marks it caught; clicking a clean line counts as a false
 * alarm (transient shake feedback). The checkpoint awards once all 3 bugs
 * are found.
 */

const CODE_LINES: readonly string[] = [
  "const redis = require('redis');",
  "const client = redis.createClient();",
  "",
  "const WINDOW = 60000; // 1 minute in ms",
  "const MAX_REQUESTS = 100;",
  "",
  "async function isRateLimited(userId) {",
  "  const key = `rate-limit:${userId}`;",
  "  const count = await client.incr(key);",
  "",
  "  if (count > MAX_REQUESTS) {",
  "    return true;",
  "  }",
  "  if (count === 1) {",
  "    await client.expire(key, 60); // Expire per second",
  "  }",
  "  return false;",
  "}",
];

const BUGS: Record<number, string> = {
  4: "Inconsistent units, WINDOW (ms) is never used",
  11: "Off-by-one, > allows a 101st request",
  15: "TTL unit mismatch, hardcoded 60, comment is wrong",
};

const TOTAL_BUGS = Object.keys(BUGS).length;

interface L07PrXrayProps {
  readonly lessonId: string;
  readonly cpId: string;
}

export function L07PrXray({ lessonId, cpId }: L07PrXrayProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [found, setFound] = useState<ReadonlySet<number>>(() => new Set());
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [flashLine, setFlashLine] = useState<number | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  const handleClick = (lineNumber: number) => {
    if (found.size === TOTAL_BUGS) return;
    if (BUGS[lineNumber] && !found.has(lineNumber)) {
      const next = new Set(found);
      next.add(lineNumber);
      setFound(next);
      if (next.size === TOTAL_BUGS) complete();
    } else if (!BUGS[lineNumber]) {
      setFalseAlarms((n) => n + 1);
      setFlashLine(lineNumber);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => {
        setFlashLine((cur) => (cur === lineNumber ? null : cur));
        flashTimeoutRef.current = null;
      }, 400);
    }
  };

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        ◆ Bespoke · PR x-ray
      </p>
      <div className="grid gap-5 md:grid-cols-[1fr_220px]">
        <div className="border-2 border-border bg-background p-3">
          {CODE_LINES.map((line, i) => {
            const lineNumber = i + 1;
            const isFound = found.has(lineNumber);
            return (
              <button
                key={lineNumber}
                type="button"
                onClick={() => handleClick(lineNumber)}
                aria-label={`Line ${lineNumber}${isFound ? " (bug caught)" : ""}`}
                className={cn(
                  "flex w-full items-start gap-3 px-1.5 py-0.5 text-left font-mono text-[12.5px] transition-colors",
                  isFound && "border border-[#22c55e] bg-[#22c55e]/10",
                  flashLine === lineNumber && "bg-destructive/20",
                  !isFound && "hover:bg-card",
                )}
              >
                <span className="w-6 shrink-0 select-none text-right text-muted-foreground/60">
                  {lineNumber}
                </span>
                <span className="whitespace-pre text-foreground">{line}</span>
              </button>
            );
          })}
        </div>
        <div className="border-2 border-border bg-background p-3">
          <h3 className="mb-2 font-mono text-[13px] font-bold text-foreground">PR x-ray</h3>
          <p className="font-mono text-[11px] text-muted-foreground">
            Bugs caught: {found.size} / {TOTAL_BUGS}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">False alarms: {falseAlarms}</p>
          <h4 className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            Caught:
          </h4>
          <div className="mt-1 flex flex-col gap-1 font-mono text-[11.5px] text-foreground">
            {[...found].sort((a, b) => a - b).map((line) => (
              <span key={line}>✓ {BUGS[line]}</span>
            ))}
            {found.size === 0 && <span className="text-muted-foreground/70">None yet.</span>}
          </div>
          {found.size === TOTAL_BUGS && (
            <p className="mt-3 border-2 border-[#22c55e] bg-[#22c55e]/10 px-2 py-1 font-mono text-[11px] font-bold text-[#22c55e]">
              🏅 REVIEWER {done ? "✓" : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default L07PrXray;

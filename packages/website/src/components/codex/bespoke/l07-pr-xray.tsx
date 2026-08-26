"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import type { Locale } from "@/lib/i18n/locale";
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

const BUG_LINES = [4, 11, 15] as const;

const COPY: Record<
  Locale,
  {
    readonly eyebrow: string;
    readonly ariaLine: string;
    readonly ariaCaught: string;
    readonly title: string;
    readonly bugsCaught: string;
    readonly falseAlarms: string;
    readonly caught: string;
    readonly noneYet: string;
    readonly reviewer: string;
    readonly bugs: Readonly<Record<(typeof BUG_LINES)[number], string>>;
  }
> = {
  en: {
    eyebrow: "◆ Exercise · PR review",
    ariaLine: "Line",
    ariaCaught: "bug caught",
    title: "PR x-ray",
    bugsCaught: "Bugs caught",
    falseAlarms: "False alarms",
    caught: "Caught",
    noneYet: "None yet.",
    reviewer: "🏅 REVIEWER",
    bugs: {
      4: "Inconsistent units, WINDOW (ms) is never used",
      11: "Off-by-one, > allows a 101st request",
      15: "TTL unit mismatch, hardcoded 60, comment is wrong",
    },
  },
  de: {
    eyebrow: "◆ Interaktiv · PR-Prüfung",
    ariaLine: "Zeile",
    ariaCaught: "Fehler gefunden",
    title: "PR-Prüfung",
    bugsCaught: "Gefundene Fehler",
    falseAlarms: "Fehlalarme",
    caught: "Gefunden",
    noneYet: "Noch keiner.",
    reviewer: "🏅 REVIEW ABGESCHLOSSEN",
    bugs: {
      4: "Inkonsistente Einheiten: WINDOW (ms) wird nie verwendet",
      11: "Off-by-one: > erlaubt eine 101. Anfrage",
      15: "Falsche TTL-Einheit: 60 ist fest codiert, der Kommentar ist falsch",
    },
  },
};

const TOTAL_BUGS = BUG_LINES.length;

interface L07PrXrayProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly locale?: Locale;
}

export function L07PrXray({
  lessonId,
  cpId,
  locale = "en",
}: L07PrXrayProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const copy = COPY[locale];
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
    if (
      BUG_LINES.includes(lineNumber as (typeof BUG_LINES)[number]) &&
      !found.has(lineNumber)
    ) {
      const next = new Set(found);
      next.add(lineNumber);
      setFound(next);
      if (next.size === TOTAL_BUGS) complete();
    } else if (!BUG_LINES.includes(lineNumber as (typeof BUG_LINES)[number])) {
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
    <div className="min-w-0 max-w-full border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
        {copy.eyebrow}
      </p>
      <div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0 overflow-x-auto border-2 border-border bg-background p-3">
          <div className="min-w-max">
            {CODE_LINES.map((line, i) => {
              const lineNumber = i + 1;
              const isFound = found.has(lineNumber);
              return (
                <button
                  key={lineNumber}
                  type="button"
                  onClick={() => handleClick(lineNumber)}
                  aria-label={`${copy.ariaLine} ${lineNumber}${isFound ? ` (${copy.ariaCaught})` : ""}`}
                  className={cn(
                    "flex min-h-11 w-full items-start gap-3 px-1.5 py-0.5 text-left font-mono text-[12.5px] transition-colors",
                    isFound && "border border-risk-green bg-risk-green/10",
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
        </div>
        <div className="min-w-0 border-2 border-border bg-background p-3">
          <h3 className="mb-2 font-mono text-[13px] font-bold text-foreground">
            {copy.title}
          </h3>
          <p className="font-mono text-xs text-muted-foreground">
            {copy.bugsCaught}: {found.size} / {TOTAL_BUGS}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {copy.falseAlarms}: {falseAlarms}
          </p>
          <h4 className="mt-3 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
            {copy.caught}:
          </h4>
          <div className="mt-1 flex flex-col gap-1 font-mono text-xs text-foreground">
            {[...found]
              .sort((a, b) => a - b)
              .map((line) => (
                <span key={line} className="break-words">
                  ✓ {copy.bugs[line as (typeof BUG_LINES)[number]]}
                </span>
              ))}
            {found.size === 0 && (
              <span className="text-muted-foreground/70">{copy.noneYet}</span>
            )}
          </div>
          {found.size === TOTAL_BUGS && (
            <p className="mt-3 border-2 border-risk-green bg-risk-green/10 px-2 py-1 font-mono text-xs font-bold text-risk-green">
              {copy.reviewer} {done ? "✓" : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default L07PrXray;

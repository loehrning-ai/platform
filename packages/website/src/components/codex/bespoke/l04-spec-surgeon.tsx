"use client";

import { useEffect, useMemo, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/**
 * L04 bespoke interactive — "Spec surgeon".
 * Ported from `codex/js/lessons/L04.js` (functional parity; the source's
 * typewriter-reveal + x-ray-scan-line animation is simplified to a plain
 * reveal — the graded interaction is toggling all 5 spec sections on, and
 * watching the ambiguous task get progressively resolved, not the scan
 * chrome).
 *
 * A vague task ("refactor our auth module") sits on the left. Five spec
 * sections (goal / constraints / acceptance / out-of-scope / context) can
 * be toggled on, each appending real content to the assembled spec on the
 * right and advancing a 0-5 "ambiguous → surgical" score. The checkpoint
 * awards once all 5 are on.
 */

interface SpecSection {
  readonly id: "goal" | "constraints" | "acceptance" | "outOfScope" | "context";
  readonly title: string;
  readonly content: string;
}

const SECTIONS_EN: readonly SpecSection[] = [
  {
    id: "goal",
    title: "Goal",
    content:
      "Add per-IP rate limiting to POST /auth/login. 5 requests per 60 seconds. Redis-backed.",
  },
  {
    id: "constraints",
    title: "Constraints",
    content:
      "Do not modify the user model. Reuse the existing Redis client at src/redis.ts.",
  },
  {
    id: "acceptance",
    title: "Acceptance Criteria",
    content:
      "The documented test command passes and its log is reviewed. New tests cover below, at, and above the limit plus reset behavior. Requests above the limit return 429 with Retry-After.",
  },
  {
    id: "outOfScope",
    title: "Out of scope",
    content: "Do not touch other auth endpoints. No new dependencies.",
  },
  {
    id: "context",
    title: "Context",
    content:
      "See docs/rate-limits.md. Pattern used elsewhere in repo: src/rateLimit.ts.",
  },
];

const SECTIONS_DE: readonly SpecSection[] = [
  {
    id: "goal",
    title: "Ziel",
    content:
      "POST /auth/login auf fünf Anfragen pro IP innerhalb von 60 Sekunden begrenzen. Redis als Speicher verwenden.",
  },
  {
    id: "constraints",
    title: "Einschränkungen",
    content:
      "Benutzermodell nicht ändern. Bestehenden Redis-Client aus src/redis.ts wiederverwenden.",
  },
  {
    id: "acceptance",
    title: "Akzeptanzkriterien",
    content:
      "Der dokumentierte Testbefehl besteht und sein Protokoll wird geprüft. Neue Tests decken Werte unterhalb, an und oberhalb der Grenze sowie das Reset-Verhalten ab. Oberhalb der Grenze Status 429 mit Retry-After zurückgeben.",
  },
  {
    id: "outOfScope",
    title: "Nicht Bestandteil",
    content: "Andere Auth-Endpunkte nicht ändern. Keine neuen Abhängigkeiten.",
  },
  {
    id: "context",
    title: "Kontext",
    content: "Siehe docs/rate-limits.md. Bestehendes Muster: src/rateLimit.ts.",
  },
];

const COPY = {
  en: {
    heading: "◆ Exercise · Complete the task contract",
    source: "refactor our auth module",
    statuses: [
      "undefined",
      "partial",
      "reviewable",
      "bounded",
      "complete",
    ] as const,
    complete: "required fields present",
    sections: SECTIONS_EN,
  },
  de: {
    heading: "◆ Praxis · Spezifikation präzisieren",
    source: "Unser Auth-Modul refaktorisieren",
    statuses: [
      "undefiniert",
      "teilweise",
      "prüfbar",
      "abgegrenzt",
      "vollständig",
    ] as const,
    complete: "erforderliche Felder vorhanden",
    sections: SECTIONS_DE,
  },
} as const satisfies Record<
  Locale,
  {
    readonly heading: string;
    readonly source: string;
    readonly statuses: readonly [string, string, string, string, string];
    readonly complete: string;
    readonly sections: readonly SpecSection[];
  }
>;

function statusFor(score: number, statuses: readonly string[]): string {
  if (score >= 5) return statuses[4] ?? "";
  if (score >= 4) return statuses[3] ?? "";
  if (score >= 3) return statuses[2] ?? "";
  if (score >= 2) return statuses[1] ?? "";
  return statuses[0] ?? "";
}

interface L04SpecSurgeonProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly locale?: Locale;
}

export function L04SpecSurgeon({
  lessonId,
  cpId,
  locale = "en",
}: L04SpecSurgeonProps): JSX.Element {
  const copy = COPY[locale];
  const sections = copy.sections;
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [on, setOn] = useState<ReadonlySet<SpecSection["id"]>>(() => new Set());

  const score = on.size;
  const status = statusFor(score, copy.statuses);
  const pct = (score / sections.length) * 100;

  useEffect(() => {
    if (score === sections.length && !done) complete();
  }, [complete, done, score, sections.length]);

  const toggle = (id: SpecSection["id"]) => {
    if (score === sections.length) return;
    setOn((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const assembledSections = useMemo(
    () => sections.filter((s) => on.has(s.id)),
    [on, sections],
  );

  return (
    <div className="min-w-0 max-w-full border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
        {copy.heading}
      </p>
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <div className="min-w-0 break-words border-2 border-border bg-background p-3 font-mono text-[13px] text-muted-foreground">
          {copy.source}
        </div>
        <div
          className={cn(
            "min-w-0 border-2 bg-background p-3 transition-colors",
            score === sections.length ? "border-risk-green" : "border-border",
          )}
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 min-w-0 flex-1 bg-border">
              <div
                className={cn(
                  "h-full transition-[width,background-color] duration-500",
                  score >= 4
                    ? "bg-risk-green"
                    : score >= 2
                      ? "bg-brand-amber"
                      : "bg-destructive",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {score}/{sections.length} {status}
            </span>
          </div>
          <div className="flex flex-col gap-2 font-mono text-[12px] text-foreground">
            {assembledSections.map((s) => (
              <div key={s.id}>
                <p className="font-bold text-brand-orange">{s.title}</p>
                <p className="break-words text-muted-foreground">{s.content}</p>
              </div>
            ))}
          </div>
          {score === sections.length && (
            <p className="mt-2 font-mono text-xs font-bold text-risk-green">
              {copy.complete} {done ? "✓" : ""}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => toggle(s.id)}
            disabled={on.has(s.id)}
            aria-pressed={on.has(s.id)}
            className={cn(
              "min-h-11 min-w-0 break-words border-2 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.06em] transition-colors",
              on.has(s.id)
                ? "border-brand-orange bg-brand-orange text-white"
                : "border-border bg-background text-foreground hover:border-brand-orange",
            )}
          >
            {s.title}
          </button>
        ))}
      </div>
    </div>
  );
}

export default L04SpecSurgeon;

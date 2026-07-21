"use client";

import { useMemo, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
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

const SECTIONS: readonly SpecSection[] = [
  {
    id: "goal",
    title: "Goal",
    content: "Add per-IP rate limiting to POST /auth/login. 5 requests per 60 seconds. Redis-backed.",
  },
  {
    id: "constraints",
    title: "Constraints",
    content: "Do not modify the user model. Reuse the existing Redis client at src/redis.ts.",
  },
  {
    id: "acceptance",
    title: "Acceptance Criteria",
    content:
      "All 34 existing tests pass. New tests cover under-limit, at-limit, over-limit, TTL reset. Returns 429 with Retry-After header on over-limit.",
  },
  {
    id: "outOfScope",
    title: "Out of scope",
    content: "Do not touch other auth endpoints. No new dependencies.",
  },
  {
    id: "context",
    title: "Context",
    content: "See docs/rate-limits.md. Pattern used elsewhere in repo: src/rateLimit.ts.",
  },
];

const STATUS_FOR: readonly { readonly min: number; readonly label: string }[] = [
  { min: 5, label: "surgical" },
  { min: 4, label: "strong" },
  { min: 3, label: "ok" },
  { min: 2, label: "thin" },
  { min: 0, label: "ambiguous" },
];

function statusFor(score: number): string {
  return STATUS_FOR.find((s) => score >= s.min)?.label ?? "ambiguous";
}

interface L04SpecSurgeonProps {
  readonly lessonId: string;
  readonly cpId: string;
}

export function L04SpecSurgeon({ lessonId, cpId }: L04SpecSurgeonProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [on, setOn] = useState<ReadonlySet<SpecSection["id"]>>(() => new Set());

  const score = on.size;
  const status = statusFor(score);
  const pct = (score / SECTIONS.length) * 100;

  const toggle = (id: SpecSection["id"]) => {
    if (score === SECTIONS.length) return;
    setOn((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (next.size === SECTIONS.length) complete();
      return next;
    });
  };

  const assembledSections = useMemo(
    () => SECTIONS.filter((s) => on.has(s.id)),
    [on],
  );

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        ◆ Bespoke · Spec surgeon
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border-2 border-border bg-background p-3 font-mono text-[13px] text-muted-foreground">
          refactor our auth module
        </div>
        <div
          className={cn(
            "border-2 bg-background p-3 transition-colors",
            score === SECTIONS.length ? "border-[#22c55e]" : "border-border",
          )}
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 flex-1 bg-border">
              <div
                className={cn(
                  "h-full transition-[width,background-color] duration-500",
                  score >= 4
                    ? "bg-[#22c55e]"
                    : score >= 2
                      ? "bg-brand-amber"
                      : "bg-destructive",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              {score}/{SECTIONS.length} {status}
            </span>
          </div>
          <div className="flex flex-col gap-2 font-mono text-[12px] text-foreground">
            {assembledSections.map((s) => (
              <div key={s.id}>
                <p className="font-bold text-brand-orange">{s.title}</p>
                <p className="text-muted-foreground">{s.content}</p>
              </div>
            ))}
          </div>
          {score === SECTIONS.length && (
            <p className="mt-2 font-mono text-[11px] font-bold text-[#22c55e]">
              surgery complete {done ? "✓" : ""}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => toggle(s.id)}
            disabled={on.has(s.id)}
            aria-pressed={on.has(s.id)}
            className={cn(
              "border-2 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] transition-colors",
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

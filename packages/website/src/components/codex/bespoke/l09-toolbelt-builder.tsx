"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";

/**
 * L09 bespoke interactive — "Toolbelt builder".
 * Ported from `codex/js/lessons/L09.js` (functional parity; the source's
 * physical "rack → belt slot" drag chrome is simplified to click-to-add —
 * the graded interaction is picking the 5 tools that actually fit a
 * Node.js + Postgres + Docker CI scenario, not the drag mechanics).
 *
 * 8 tools, only 5 fit the stated scenario. Clicking a fitting tool adds it
 * to the belt permanently; clicking a mismatched one flashes "overkill" and
 * reverts after a beat (timer cleaned up on unmount). The checkpoint awards
 * once all 5 fitting tools are on the belt.
 */

interface Tool {
  readonly id: string;
  readonly purpose: string;
  readonly needed: boolean;
  readonly command?: string;
}

const TOOLS: readonly Tool[] = [
  { id: "pytest", purpose: "python tests", needed: false },
  { id: "vitest", purpose: "js tests", needed: true, command: "npx vitest run · 34 passed" },
  { id: "eslint", purpose: "js linter", needed: true, command: "npx eslint · 0 errors" },
  { id: "ruff", purpose: "python linter", needed: false },
  { id: "mypy", purpose: "python types", needed: false },
  {
    id: "docker-compose",
    purpose: "container orchestration",
    needed: true,
    command: "docker compose up test-db · OK",
  },
  {
    id: "postgres-test-db",
    purpose: "isolated test database",
    needed: true,
    command: "pg_ctl start · test-db ready",
  },
  { id: "make ci", purpose: "CI entrypoint", needed: true, command: "make ci · green · OK" },
];

const NEEDED_COUNT = TOOLS.filter((t) => t.needed).length;

interface L09ToolbeltBuilderProps {
  readonly lessonId: string;
  readonly cpId: string;
}

export function L09ToolbeltBuilder({ lessonId, cpId }: L09ToolbeltBuilderProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [placed, setPlaced] = useState<ReadonlySet<string>>(() => new Set());
  const [rejected, setRejected] = useState<string | null>(null);
  const [log, setLog] = useState<readonly string[]>([]);
  const rejectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (rejectTimeoutRef.current) clearTimeout(rejectTimeoutRef.current);
    };
  }, []);

  const pick = (tool: Tool) => {
    if (placed.has(tool.id)) return;
    if (tool.needed) {
      const next = new Set(placed);
      next.add(tool.id);
      setPlaced(next);
      setLog((prev) => [...prev, tool.command ?? `${tool.id} ready`]);
      if (next.size === NEEDED_COUNT) complete();
    } else {
      setRejected(tool.id);
      if (rejectTimeoutRef.current) clearTimeout(rejectTimeoutRef.current);
      rejectTimeoutRef.current = setTimeout(() => {
        setRejected((cur) => (cur === tool.id ? null : cur));
        rejectTimeoutRef.current = null;
      }, 800);
    }
  };

  const ready = placed.size === NEEDED_COUNT;

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        ◆ Bespoke · Toolbelt builder
      </p>
      <p className="mb-4 font-mono text-[11px] text-muted-foreground">
        scenario: medium Node.js service, PG database, docker-based CI
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {TOOLS.map((tool) => {
          const isPlaced = placed.has(tool.id);
          const isRejected = rejected === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => pick(tool)}
              disabled={isPlaced}
              className={cn(
                "border-2 border-border bg-background px-3 py-2 text-left font-mono transition-colors",
                isPlaced && "border-[#22c55e] bg-[#22c55e]/10",
                isRejected && "border-brand-amber bg-brand-amber/10",
                !isPlaced && "hover:border-brand-orange/60",
              )}
            >
              <span className="block text-[12.5px] font-bold text-foreground">{tool.id}</span>
              <span className="block text-[11px] text-muted-foreground">{tool.purpose}</span>
              {isPlaced && <span className="text-[10px] text-[#22c55e]">✓ fit: 100%</span>}
              {isRejected && <span className="text-[10px] text-brand-amber">⚠ fit: overkill</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-4 border-2 border-border bg-background p-3">
        <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          belt: {placed.size} / {NEEDED_COUNT}
        </p>
        <div className="flex flex-col gap-0.5 font-mono text-[11.5px] text-foreground">
          {log.map((line, i) => (
            <span key={i}>&gt; {line}</span>
          ))}
          {ready && <span className="font-bold text-[#22c55e]">&gt; READY FOR CODEX {done ? "✓" : ""}</span>}
        </div>
      </div>
    </div>
  );
}

export default L09ToolbeltBuilder;

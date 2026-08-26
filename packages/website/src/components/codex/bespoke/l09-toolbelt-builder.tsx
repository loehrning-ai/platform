"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import type { Locale } from "@/lib/i18n/locale";
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
 * to the belt permanently; clicking a mismatched one shows that the tool is
 * reverts after a beat (timer cleaned up on unmount). The checkpoint awards
 * once all 5 fitting tools are on the belt.
 */

interface Tool {
  readonly id: string;
  readonly purpose: Readonly<Record<Locale, string>>;
  readonly needed: boolean;
  readonly command?: string;
}

const TOOLS: readonly Tool[] = [
  {
    id: "pytest",
    purpose: { en: "python tests", de: "Python-Tests" },
    needed: false,
  },
  {
    id: "vitest",
    purpose: { en: "js tests", de: "JavaScript-Tests" },
    needed: true,
    command: "configured check: npx vitest run",
  },
  {
    id: "eslint",
    purpose: { en: "js linter", de: "JavaScript-Linter" },
    needed: true,
    command: "configured check: npx eslint",
  },
  {
    id: "ruff",
    purpose: { en: "python linter", de: "Python-Linter" },
    needed: false,
  },
  {
    id: "mypy",
    purpose: { en: "python types", de: "Python-Typprüfung" },
    needed: false,
  },
  {
    id: "docker-compose",
    purpose: { en: "container orchestration", de: "Container-Orchestrierung" },
    needed: true,
    command: "test service: docker compose up test-db",
  },
  {
    id: "postgres-test-db",
    purpose: { en: "isolated test database", de: "isolierte Testdatenbank" },
    needed: true,
    command: "test database: postgres-test-db",
  },
  {
    id: "make ci",
    purpose: { en: "CI entrypoint", de: "CI-Einstiegspunkt" },
    needed: true,
    command: "configured CI entrypoint: make ci",
  },
];

const NEEDED_COUNT = TOOLS.filter((t) => t.needed).length;

interface L09ToolbeltBuilderProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly locale?: Locale;
}

const COPY: Record<
  Locale,
  {
    readonly eyebrow: string;
    readonly scenario: string;
    readonly fit: string;
    readonly overkill: string;
    readonly belt: string;
    readonly ready: string;
    readonly readySuffix: string;
  }
> = {
  en: {
    eyebrow: "◆ Exercise · Tool selection",
    scenario: "scenario: medium Node.js service, PG database, docker-based CI",
    fit: "selected for this scenario",
    overkill: "not required by this scenario",
    belt: "belt",
    ready: "TOOL SET RECORDED",
    readySuffix: "selected",
  },
  de: {
    eyebrow: "◆ Interaktiv · Werkzeugauswahl",
    scenario:
      "Szenario: mittelgroßer Node.js-Dienst, PostgreSQL-Datenbank, Docker-basierte CI",
    fit: "für dieses Szenario ausgewählt",
    overkill: "für dieses Szenario nicht erforderlich",
    belt: "Auswahl",
    ready: "WERKZEUGAUSWAHL DOKUMENTIERT",
    readySuffix: "ausgewählt",
  },
};

export function L09ToolbeltBuilder({
  lessonId,
  cpId,
  locale = "en",
}: L09ToolbeltBuilderProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const copy = COPY[locale];
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
      setLog((prev) => [
        ...prev,
        tool.command ?? `${tool.id} ${copy.readySuffix}`,
      ]);
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
    <div className="min-w-0 max-w-full border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-1 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
        {copy.eyebrow}
      </p>
      <p className="mb-4 font-mono text-xs text-muted-foreground">
        {copy.scenario}
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
                "min-h-11 min-w-0 break-words border-2 border-border bg-background px-3 py-2 text-left font-mono transition-colors",
                isPlaced && "border-risk-green bg-risk-green/10",
                isRejected && "border-brand-amber bg-brand-amber/10",
                !isPlaced && "hover:border-brand-orange/60",
              )}
            >
              <span className="block text-[12.5px] font-bold text-foreground">
                {tool.id}
              </span>
              <span className="block text-xs text-muted-foreground">
                {tool.purpose[locale]}
              </span>
              {isPlaced && (
                <span className="text-xs text-risk-green">✓ {copy.fit}</span>
              )}
              {isRejected && (
                <span className="text-xs text-brand-amber">
                  ⚠ {copy.overkill}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-4 border-2 border-border bg-background p-3">
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
          {copy.belt}: {placed.size} / {NEEDED_COUNT}
        </p>
        <div className="flex flex-col gap-0.5 font-mono text-xs text-foreground">
          {log.map((line, i) => (
            <span key={i} className="break-words">
              &gt; {line}
            </span>
          ))}
          {ready && (
            <span className="font-bold text-risk-green">
              &gt; {copy.ready} {done ? "✓" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default L09ToolbeltBuilder;

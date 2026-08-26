"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { m, AnimatePresence } from "framer-motion";
import { DemoOverline } from "./_shared";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";

/**
 * AgentDemo — Multi-Agent Workflow.
 *
 * Four specialized agents (Scout, Analyst, Kritiker, Redakteur) run a
 * simulated research-to-memo pipeline. Live log streams step-by-step,
 * agent tile pulses while active, final memo slides in on completion.
 *
 * Provenance: first-party loehrning.ai implementation by Tim Löhr.
 * Ported 2026-04-21. See AI-native demo gallery implementation.
 */

interface Agent {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly model: string;
  readonly task: string;
}

const AGENTS: readonly Agent[] = [
  {
    id: "scout",
    name: "Scout",
    role: "Research",
    model: "small-classifier",
    task: "Sucht im Archiv nach relevanten Präzedenzfällen",
  },
  {
    id: "analyst",
    name: "Analyst",
    role: "Synthese",
    model: "analysis-model",
    task: "Fasst Kernthesen zusammen und bewertet Evidenz",
  },
  {
    id: "critic",
    name: "Kritiker",
    role: "Red Team",
    model: "general-model",
    task: "Identifiziert Schwachstellen und Gegenargumente",
  },
  {
    id: "writer",
    name: "Redakteur",
    role: "Output",
    model: "general-model",
    task: "Verfasst strukturiertes Memo für Geschäftsführung",
  },
];

interface LogEntry {
  readonly id: string;
  readonly agentIdx: number;
  readonly source: string;
  readonly text: string;
}

interface ScriptedStep {
  readonly agentIdx: number;
  readonly source: string;
  readonly text: string;
  readonly delayMs: number;
}

const SCRIPT: readonly ScriptedStep[] = [
  { agentIdx: 0, source: "Scout", text: "Starte Archiv-Suche…", delayMs: 200 },
  {
    agentIdx: 0,
    source: "Scout",
    text: "42 Dokumente gefunden, filtere relevante 8",
    delayMs: 600,
  },
  {
    agentIdx: 0,
    source: "Scout → Analyst",
    text: "Übergabe: 8 Dokumente + Kontext",
    delayMs: 1000,
  },
  {
    agentIdx: 1,
    source: "Analyst",
    text: "Extrahiere 4 Kernthesen",
    delayMs: 1400,
  },
  {
    agentIdx: 1,
    source: "Analyst",
    text: "Evidenz-Score pro These: 0.82 / 0.67 / 0.91 / 0.54",
    delayMs: 1700,
  },
  {
    agentIdx: 1,
    source: "Analyst → Kritiker",
    text: "Übergabe: Thesen + Evidenz-Matrix",
    delayMs: 2000,
  },
  {
    agentIdx: 2,
    source: "Kritiker",
    text: "Prüfe These 3: Gegenthese identifiziert",
    delayMs: 2400,
  },
  {
    agentIdx: 2,
    source: "Kritiker",
    text: "Empfehle Nachrecherche zu These 4",
    delayMs: 2700,
  },
  {
    agentIdx: 2,
    source: "Kritiker → Scout",
    text: "Rückfrage: Branchenvergleich zu These 4",
    delayMs: 3000,
  },
  {
    agentIdx: 0,
    source: "Scout",
    text: "Ergänze 3 weitere Quellen",
    delayMs: 3400,
  },
  {
    agentIdx: 0,
    source: "Scout → Redakteur",
    text: "Übergabe: Finale Evidenz",
    delayMs: 3700,
  },
  {
    agentIdx: 3,
    source: "Redakteur",
    text: "Strukturiere Memo · 4 Abschnitte",
    delayMs: 4000,
  },
  { agentIdx: 3, source: "Redakteur", text: "Review + Polish", delayMs: 4400 },
  {
    agentIdx: 3,
    source: "Redakteur",
    text: "✓ Memo fertig (2,4k Tokens, 18 Quellen)",
    delayMs: 4800,
  },
];

export function AgentDemo(): JSX.Element {
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState<number>(-1);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [done, setDone] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (!running) return;
    setActive(0);
    setLogs([]);
    setDone(false);

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scale = reducedMotion ? 0.2 : 1;

    SCRIPT.forEach((step, i) => {
      timerRefs.current.push(
        setTimeout(() => {
          setActive(step.agentIdx);
          setLogs((prev) => [
            ...prev,
            {
              id: `${i}-${step.agentIdx}-${step.delayMs}`,
              agentIdx: step.agentIdx,
              source: step.source,
              text: step.text,
            },
          ]);
        }, step.delayMs * scale),
      );
    });

    timerRefs.current.push(
      setTimeout(() => {
        setRunning(false);
        setActive(-1);
        setDone(true);
      }, 5100 * scale),
    );

    const refs = timerRefs.current;
    return () => {
      refs.forEach(clearTimeout);
      timerRefs.current = [];
    };
  }, [running]);

  return (
    <div
      className="flex flex-col gap-4 overflow-hidden"
      role="region"
      aria-label="Praxisbeispiel: Multi-Agent-Workflow"
    >
      <div>
        <DemoOverline>Multi-Agent Workflow</DemoOverline>
        <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-foreground md:text-[26px]">
          Vier Agenten. <span className="text-brand-orange">Ein Memo.</span>
        </h3>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          Spezialisierte Agenten arbeiten koordiniert, wie eine Redaktion. Am
          Ende: ein strukturiertes Entscheidungs-Memo.
        </p>
      </div>

      {/* Agent tiles */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {AGENTS.map((a, i) => {
          const isActive = active === i;
          return (
            <div
              key={a.id}
              className={cn(
                "relative border p-3.5 transition-[background-color,border-color,color,opacity,transform,box-shadow] duration-200",
                isActive
                  ? "border-brand-orange border-t-[3px] border-t-brand-orange bg-foreground text-background"
                  : "border-border border-t-[3px] border-t-border bg-card/60 text-foreground",
              )}
            >
              {isActive && (
                <div
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-pulse bg-brand-orange"
                  aria-hidden="true"
                />
              )}
              <div
                className={cn(
                  "font-mono text-[12px] font-bold tracking-[0.12em]",
                  isActive ? "text-brand-amber" : "text-muted-foreground",
                )}
              >
                {String(i + 1).padStart(2, "0")} · {a.role.toUpperCase()}
              </div>
              <div className="mt-1 text-[16px] font-bold leading-[1.15] tracking-[-0.02em] md:text-[17px]">
                {a.name}
              </div>
              <div
                className={cn(
                  "mt-1 font-mono text-[12px]",
                  isActive ? "text-background/70" : "text-muted-foreground",
                )}
              >
                {a.model}
              </div>
              <div
                className={cn(
                  "mt-2 text-[12px] leading-[1.4]",
                  isActive ? "text-background/85" : "text-muted-foreground",
                )}
              >
                {a.task}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => !running && setRunning(true)}
        disabled={running}
        className={cn(
          "min-h-11 self-start border-2 border-foreground bg-brand-orange px-4 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow]",
          running
            ? "cursor-wait opacity-75"
            : "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-foreground)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--color-foreground)]",
        )}
      >
        {running
          ? "◆ Läuft…"
          : done
            ? "↻ Erneut starten"
            : "▶ Pipeline starten"}
      </button>

      {/* Output panels */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:min-h-[320px]">
        {/* Live log */}
        <div
          ref={logRef}
          className="dark-section min-h-[220px] overflow-y-auto border-l-[3px] border-brand-orange bg-[var(--color-dark-bg)] p-4 font-mono text-[12px] text-[var(--color-dark-fg)]"
        >
          <div className="sticky top-0 mb-2 flex items-center justify-between border-b border-[var(--color-dark-border)] bg-[var(--color-dark-bg)] pb-2 font-mono text-[12px] tracking-[0.14em] text-[var(--color-dark-muted)]">
            <span>› AGENT.LOG</span>
            <span>{logs.length} ereignisse</span>
          </div>
          {logs.length === 0 && (
            <div className="text-muted-foreground">
              // warten auf pipeline start…
            </div>
          )}
          {logs.map((l, i) => (
            <m.div
              key={l.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
              className="py-0.5 text-[var(--color-dark-fg)]"
            >
              <span className="mr-2 text-brand-orange">
                [{String(i + 1).padStart(2, "0")}]
              </span>
              <span className="mr-2 text-brand-amber">{l.source}</span>
              <span>{l.text}</span>
            </m.div>
          ))}
        </div>

        {/* Final memo — always reserved */}
        <div
          className={cn(
            "relative overflow-hidden border border-border p-4 transition-[opacity,border-top-color] duration-300",
            done
              ? "border-t-[3px] border-t-brand-orange bg-background opacity-100"
              : "border-t-[3px] border-t-border bg-card/40 opacity-60",
          )}
        >
          {!done && !running && (
            <div className="flex h-full items-center justify-center p-5 text-center font-mono text-[12px] tracking-[0.14em] text-muted-foreground">
              → MEMO ERSCHEINT NACH PIPELINE-ABSCHLUSS
            </div>
          )}
          {running && !done && (
            <div className="flex h-full items-center justify-center font-mono text-[12px] tracking-[0.14em] text-brand-orange">
              <span
                className="mr-2 inline-block h-2 w-2 animate-pulse bg-brand-orange"
                aria-hidden="true"
              />
              MEMO WIRD VERFASST…
            </div>
          )}
          <AnimatePresence>
            {done && (
              <m.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                className="flex h-full flex-col"
              >
                <div className="mb-2 flex items-center justify-between">
                  <DemoOverline>◆ Memo · Geschäftsführung</DemoOverline>
                  <span className="font-mono text-[12px] tracking-[0.1em] text-muted-foreground">
                    2,4k TOKENS · 18 QUELLEN
                  </span>
                </div>
                <h4 className="mb-2 text-[15px] font-bold leading-[1.25] tracking-[-0.02em] text-foreground">
                  Empfehlung:{" "}
                  <span className="text-brand-orange">
                    KI-Einführung in 2 Phasen, Start Q3/2026.
                  </span>
                </h4>
                <div className="flex-1 space-y-2 overflow-y-auto text-[12px] leading-[1.55] text-muted-foreground">
                  <MemoSection title="§1 · KERNTHESE">
                    3 von 4 Thesen tragen. Evidenz-Score Ø 0,84, robust genug
                    für Vorstands-Vorlage.
                  </MemoSection>
                  <MemoSection title="§2 · RISIKEN">
                    These 3 benötigt Branchenvergleich (vom Kritiker markiert,
                    durch Scout nachgereicht).
                  </MemoSection>
                  <MemoSection title="§3 · NÄCHSTE SCHRITTE">
                    Phase 1: Excel-Add-In, 2 Abteilungen · Phase 2:
                    Multi-Agent-Pipeline, Q4. Budget: €180k.
                  </MemoSection>
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-dashed border-border pt-2.5">
                  <span className="font-mono text-[12px] tracking-[0.1em] text-muted-foreground">
                    4 SEKTIONEN · PEER-REVIEWED
                  </span>
                  <span className="font-mono text-[12px] font-bold tracking-[0.12em] text-brand-orange">
                    PDF EXPORT →
                  </span>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function MemoSection({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <div>
      <div className="mb-0.5 font-mono text-[12px] font-bold tracking-[0.14em] text-brand-orange">
        {title}
      </div>
      <p>{children}</p>
    </div>
  );
}

export default AgentDemo;

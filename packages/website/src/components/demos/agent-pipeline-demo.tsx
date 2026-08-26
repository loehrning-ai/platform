"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO } from "@/lib/demo-tokens";
import {
  DEMO_HEIGHT,
  usePrefersReducedMotion,
  useVisibleAutoplay,
} from "./demo-utils";
import { useDemoLocale } from "./demo-locale";

interface Agent {
  readonly id: string;
  readonly n: string;
  readonly r: string;
  readonly model: string;
  readonly task: string;
}

const AGENTS: readonly Agent[] = [
  {
    id: "scout",
    n: "Scout",
    r: "Research",
    model: "Haiku 4.5",
    task: "Sucht im Archiv nach relevanten Präzedenzfällen",
  },
  {
    id: "analyst",
    n: "Analyst",
    r: "Synthese",
    model: "Opus 4.5",
    task: "Fasst Kernthesen zusammen und bewertet Evidenz",
  },
  {
    id: "critic",
    n: "Kritiker",
    r: "Red Team",
    model: "Sonnet 4.6",
    task: "Identifiziert Schwachstellen und Gegenargumente",
  },
  {
    id: "writer",
    n: "Redakteur",
    r: "Output",
    model: "Sonnet 4.6",
    task: "Verfasst strukturiertes Memo für Geschäftsführung",
  },
];

const AGENTS_EN: readonly Agent[] = [
  {
    id: "scout",
    n: "Scout",
    r: "Research",
    model: "Haiku 4.5",
    task: "Searches a sample archive for relevant prior cases",
  },
  {
    id: "analyst",
    n: "Analyst",
    r: "Synthesis",
    model: "Opus 4.5",
    task: "Combines claims and rates the available evidence",
  },
  {
    id: "critic",
    n: "Critic",
    r: "Red team",
    model: "Sonnet 4.6",
    task: "Identifies weak claims and counterarguments",
  },
  {
    id: "writer",
    n: "Editor",
    r: "Output",
    model: "Sonnet 4.6",
    task: "Writes a structured memo for management review",
  },
];

// Tint per agent index for log color-coding
const AGENT_TINT: readonly string[] = [
  "#f7b267", // Scout, warm sand
  "var(--color-brand-orange)", // Analyst, kupfer
  "#ef4444", // Kritiker, red (red-team)
  "#f3f0e9", // Redakteur, kalk (final output)
];

interface LogEntry {
  readonly id: number;
  readonly ag: number;
  readonly src: string;
  readonly t: string;
  readonly ts: string; // timestamp HH:MM:SS.mmm
}

const SCRIPT: readonly [number, string, string, number][] = [
  [0, "Scout", "Starte Archiv-Suche…", 200],
  [0, "Scout", "42 Dokumente gefunden, filtere 8", 600],
  [0, "Scout → Analyst", "Übergabe: 8 Dokumente + Kontext", 1000],
  [1, "Analyst", "Extrahiere 4 Kernthesen", 1400],
  [1, "Analyst", "Evidenz-Score: 0,82 / 0,67 / 0,91 / 0,54", 1700],
  [1, "Analyst → Kritiker", "Übergabe: Thesen + Evidenz-Matrix", 2000],
  [2, "Kritiker", "Prüfe These 3: Gegenthese identifiziert", 2400],
  [2, "Kritiker", "Empfehle Nachrecherche zu These 4", 2700],
  [2, "Kritiker → Scout", "Rückfrage: Branchenvergleich These 4", 3000],
  [0, "Scout", "Ergänze 3 weitere Quellen", 3400],
  [0, "Scout → Redakteur", "Übergabe: Finale Evidenz", 3700],
  [3, "Redakteur", "Strukturiere Memo · 4 Abschnitte", 4000],
  [3, "Redakteur", "Review + Polish", 4400],
  [3, "Redakteur", "✓ Memo fertig (2,4k Tokens, 18 Quellen)", 4800],
];

const SCRIPT_EN: readonly [number, string, string, number][] = [
  [0, "Scout", "Starting archive search…", 200],
  [0, "Scout", "42 documents found; retaining 8", 600],
  [0, "Scout → Analyst", "Handoff: 8 documents and context", 1000],
  [1, "Analyst", "Extracting 4 core claims", 1400],
  [1, "Analyst", "Evidence score: 0.82 / 0.67 / 0.91 / 0.54", 1700],
  [1, "Analyst → Critic", "Handoff: claims and evidence matrix", 2000],
  [2, "Critic", "Checking claim 3: counterclaim identified", 2400],
  [2, "Critic", "Further research required for claim 4", 2700],
  [2, "Critic → Scout", "Request: industry comparison for claim 4", 3000],
  [0, "Scout", "Adding 3 further sources", 3400],
  [0, "Scout → Editor", "Handoff: final evidence set", 3700],
  [3, "Editor", "Structuring a four-section memo", 4000],
  [3, "Editor", "Reviewing wording and citations", 4400],
  [3, "Editor", "Memo complete (2.4k tokens, 18 sources)", 4800],
];

// Deterministic timestamp base so SSR/CSR match: 10:42:15.000
const TS_BASE_MS = 10 * 3600_000 + 42 * 60_000 + 15_000;

function fmtTs(offsetMs: number): string {
  const total = TS_BASE_MS + offsetMs;
  const h = Math.floor(total / 3600_000) % 24;
  const m = Math.floor(total / 60_000) % 60;
  const s = Math.floor(total / 1000) % 60;
  const ms = total % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

export default function AgentPipelineDemo() {
  const { locale, text } = useDemoLocale();
  const agents = locale === "de" ? AGENTS : AGENTS_EN;
  const script = locale === "de" ? SCRIPT : SCRIPT_EN;
  const reduced = usePrefersReducedMotion();
  const { ref, visible } = useVisibleAutoplay<HTMLDivElement>();
  const [active, setActive] = useState(-1);
  const [logs, setLogs] = useState<readonly LogEntry[]>([]);
  const [done, setDone] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (reduced) {
      setActive(-1);
      setLogs(
        script.map(([ag, src, t, delay], id) => ({
          id,
          ag,
          src,
          t,
          ts: fmtTs(delay),
        })),
      );
      setDone(true);
      return;
    }
    if (!visible) {
      setActive(-1);
      return;
    }
    setActive(0);
    setLogs([]);
    setDone(false);
    const timers = script.map(([ag, src, t, delay], i) =>
      setTimeout(() => {
        setActive(ag);
        setLogs((l) => [...l, { id: i, ag, src, t, ts: fmtTs(delay) }]);
      }, delay),
    );
    const endT = setTimeout(() => {
      setActive(-1);
      setDone(true);
    }, 5100);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(endT);
    };
  }, [visible, reduced, script]);

  return (
    <div
      ref={ref}
      data-demo-id="agent-pipeline"
      role="region"
      aria-label={text(
        "Aufgezeichnete Agenten-Pipeline",
        "Recorded agent pipeline",
      )}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minHeight: DEMO_HEIGHT,
        fontFamily: DEMO.font.sans,
        color: DEMO.kalk,
      }}
    >
      <style>{`
        @keyframes agent-pipeline-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.55), 0 0 0 0 rgba(249,115,22,0.25); }
          50%      { box-shadow: 0 0 0 3px rgba(249,115,22,0.35), 0 0 18px 2px rgba(249,115,22,0.35); }
        }
        @keyframes agent-pipeline-dot {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.35); }
        }
        @keyframes agent-pipeline-caret {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes agent-pipeline-log-in {
          from { opacity: 0; transform: translateX(-4px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div>
        <div
          style={{
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            color: "var(--color-brand-orange)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {text("Multi-Agent Workflow", "Multi-agent workflow")}
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            marginTop: 6,
            color: DEMO.kalk,
          }}
        >
          {text("Vier Agenten.", "Four agents.")}{" "}
          <span style={{ color: "var(--color-brand-orange)" }}>
            {text("Ein Memo.", "One memo.")}
          </span>
        </h2>
      </div>

      {/* Agent card grid — 2 cols on mobile, 4 cols >=640px */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,minmax(0,1fr))",
          gap: 8,
        }}
        className="agent-pipeline-grid"
      >
        {agents.map((a, i) => {
          const activeCard = active === i;
          const inactiveTextBase = "rgba(243,240,233,0.6)";
          return (
            <div
              key={a.id}
              aria-current={activeCard ? "step" : undefined}
              style={{
                background: activeCard
                  ? "linear-gradient(180deg, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0.04) 100%)"
                  : "rgba(243,240,233,0.04)",
                color: DEMO.kalk,
                padding: 12,
                borderTop: `3px solid ${activeCard ? "var(--color-brand-orange)" : "rgba(243,240,233,0.22)"}`,
                borderRight: `1px solid ${activeCard ? "rgba(249,115,22,0.6)" : "rgba(243,240,233,0.14)"}`,
                borderBottom: `1px solid ${activeCard ? "rgba(249,115,22,0.6)" : "rgba(243,240,233,0.14)"}`,
                borderLeft: `1px solid ${activeCard ? "rgba(249,115,22,0.6)" : "rgba(243,240,233,0.14)"}`,
                transition: "background 240ms, border-color 240ms",
                position: "relative",
                minWidth: 0,
                animation:
                  activeCard && visible && !reduced
                    ? "agent-pipeline-pulse 1.4s ease-in-out infinite"
                    : undefined,
              }}
            >
              {/* status dot (top-right) */}
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: activeCard
                    ? "var(--color-brand-orange)"
                    : "rgba(243,240,233,0.22)",
                  animation:
                    activeCard && visible && !reduced
                      ? "agent-pipeline-dot 1.2s ease-in-out infinite"
                      : undefined,
                }}
              />
              <div
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 12,
                  color: activeCard
                    ? "var(--color-brand-orange)"
                    : "rgba(243,240,233,0.5)",
                  letterSpacing: "0.12em",
                  fontWeight: 700,
                }}
              >
                0{i + 1} · {a.r.toUpperCase()}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  marginTop: 3,
                  color: DEMO.kalk,
                }}
              >
                {a.n}
              </div>
              <div
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 12,
                  color: activeCard
                    ? "rgba(243,240,233,0.8)"
                    : inactiveTextBase,
                  marginTop: 3,
                  letterSpacing: "0.04em",
                }}
              >
                {a.model}
              </div>
              <div
                style={{
                  fontSize: 12,
                  lineHeight: 1.4,
                  marginTop: 6,
                  color: activeCard
                    ? "rgba(243,240,233,0.88)"
                    : "rgba(243,240,233,0.65)",
                  overflowWrap: "anywhere",
                }}
              >
                {a.task}
              </div>
            </div>
          );
        })}
      </div>

      {/* Log + memo — stack on narrow, side-by-side on wider */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 10,
          flex: 1,
        }}
        className="agent-pipeline-output"
      >
        <div
          ref={logRef}
          style={{
            background: "#070606",
            color: DEMO.kalk,
            padding: 14,
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            overflowY: "auto",
            maxHeight: 260,
            minHeight: 180,
            borderLeft: `3px solid var(--color-brand-orange)`,
            boxShadow: "inset 0 0 0 1px rgba(243,240,233,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
              paddingBottom: 6,
              borderBottom: "1px solid rgba(243,240,233,0.08)",
              fontSize: 12,
              color: "rgba(243,240,233,0.55)",
              letterSpacing: "0.14em",
            }}
          >
            <span
              style={{ display: "inline-flex", gap: 6, alignItems: "center" }}
            >
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background:
                    active >= 0
                      ? "var(--color-brand-orange)"
                      : "rgba(243,240,233,0.3)",
                  animation:
                    active >= 0 && visible && !reduced
                      ? "agent-pipeline-dot 1.2s ease-in-out infinite"
                      : undefined,
                }}
              />
              › AGENT.LOG
            </span>
            <span
              style={{
                fontFamily: DEMO.font.mono,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {String(logs.length).padStart(2, "0")}{" "}
              {text("EREIGNISSE", "EVENTS")}
            </span>
          </div>
          {logs.length === 0 && active < 0 && (
            <div style={{ color: "rgba(243,240,233,0.45)" }}>
              //{" "}
              {text("warten auf pipeline start", "waiting for pipeline start")}
            </div>
          )}
          {logs.map((l, i) => {
            const tint = AGENT_TINT[l.ag] ?? "rgba(243,240,233,0.85)";
            return (
              <div
                key={l.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  padding: "2px 0",
                  color: "rgba(243,240,233,0.85)",
                  fontVariantNumeric: "tabular-nums",
                  animation: reduced
                    ? undefined
                    : "agent-pipeline-log-in 200ms ease-out",
                }}
              >
                <span
                  style={{ color: "rgba(243,240,233,0.32)", flexShrink: 0 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  style={{ color: "rgba(243,240,233,0.42)", flexShrink: 0 }}
                >
                  {l.ts}
                </span>
                <span
                  style={{
                    color: tint,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {l.src}
                </span>
                <span
                  style={{
                    minWidth: 0,
                    flex: "1 1 140px",
                    overflowWrap: "anywhere",
                  }}
                >
                  {l.t}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            background: done
              ? "linear-gradient(180deg, rgba(243,240,233,0.08) 0%, rgba(243,240,233,0.03) 100%)"
              : "rgba(243,240,233,0.04)",
            borderTop: `3px solid ${done ? "var(--color-brand-orange)" : "rgba(243,240,233,0.15)"}`,
            borderRight: `1px solid ${done ? "rgba(249,115,22,0.3)" : "rgba(243,240,233,0.12)"}`,
            borderBottom: `1px solid ${done ? "rgba(249,115,22,0.3)" : "rgba(243,240,233,0.12)"}`,
            borderLeft: `1px solid ${done ? "rgba(249,115,22,0.3)" : "rgba(243,240,233,0.12)"}`,
            padding: 14,
            minHeight: 200,
            position: "relative",
            opacity: done ? 1 : 0.5,
            transition: "opacity 320ms, background 320ms, border-color 320ms",
          }}
        >
          {!done ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(243,240,233,0.5)",
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                letterSpacing: "0.14em",
                textAlign: "center",
                padding: 20,
              }}
            >
              <span>
                {text(
                  "→ MEMO ERSCHEINT NACH PIPELINE-ABSCHLUSS",
                  "→ MEMO APPEARS AFTER THE PIPELINE FINISHES",
                )}
              </span>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    fontFamily: DEMO.font.mono,
                    fontSize: 12,
                    color: "var(--color-brand-orange)",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  ◆{" "}
                  {text("Memo · Geschäftsführung", "Memo · management review")}
                </div>
                <span
                  style={{
                    fontFamily: DEMO.font.mono,
                    fontSize: 12,
                    color: "rgba(243,240,233,0.6)",
                    letterSpacing: "0.1em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {text("2,4k TOKENS · 18 QUELLEN", "2.4k TOKENS · 18 SOURCES")}
                </span>
              </div>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  marginBottom: 8,
                  lineHeight: 1.3,
                  color: DEMO.kalk,
                }}
              >
                {text("Empfehlung:", "Recommendation:")}{" "}
                <span style={{ color: "var(--color-brand-orange)" }}>
                  {text(
                    "KI-Einführung in 2 Phasen, Start Q3/2026.",
                    "Two-phase AI rollout, starting Q3 2026.",
                  )}
                </span>
              </h3>
              <div
                style={{
                  fontSize: 12,
                  lineHeight: 1.55,
                  color: "rgba(243,240,233,0.82)",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <MemoSection
                  title={text("§1 · KERNTHESE", "§1 · CORE CLAIM")}
                  body={text(
                    "Drei von vier Thesen werden durch die Beispielquellen gestützt. Eine These bleibt offen.",
                    "The sample sources support three of four claims. One claim remains unresolved.",
                  )}
                />
                <MemoSection
                  title={text("§2 · RISIKEN", "§2 · RISKS")}
                  body={text(
                    "These 3 benötigt einen Branchenvergleich. Der Kritiker markiert die Lücke, der Scout ergänzt Quellen.",
                    "Claim 3 requires an industry comparison. The critic marks the gap and the scout adds sources.",
                  )}
                />
                <MemoSection
                  title={text("§3 · NÄCHSTE SCHRITTE", "§3 · NEXT STEPS")}
                  body={text(
                    "Phase 1: begrenzter Tabellenpilot in zwei Teams. Phase 2 nur nach Ergebnis- und Risikoprüfung.",
                    "Phase 1: a bounded spreadsheet pilot in two teams. Phase 2 only after outcome and risk review.",
                  )}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) {
          [data-demo-id="agent-pipeline"] .agent-pipeline-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
        }
        @media (min-width: 768px) {
          [data-demo-id="agent-pipeline"] .agent-pipeline-output {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function MemoSection({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: DEMO.font.mono,
          fontSize: 12,
          color: "var(--color-brand-orange)",
          letterSpacing: "0.14em",
          fontWeight: 700,
          marginBottom: 2,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {title}
      </div>
      <p style={{ margin: 0 }}>{body}</p>
    </div>
  );
}

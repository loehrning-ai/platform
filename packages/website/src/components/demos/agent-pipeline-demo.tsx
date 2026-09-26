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

// Muted text on the graphit frame (Leinen, 11.8:1 on #141414).
const DARK_MUTED = "rgba(243,240,233,0.72)";
const DARK_EDGE = "rgba(243,240,233,0.4)";
const DARK_HAIRLINE = "rgba(243,240,233,0.16)";
// Mennige on graphit (5.79:1), for the one mark in this frame: the step.
const DARK_ACCENT = "#e07050";

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

// Second briefing — same four roles, a different question and a different
// memo outcome, so the "task" selector genuinely changes what the pipeline
// produces rather than just relabelling the same run.
type Scenario = "contracts" | "pricing";

const SCRIPT_PRICING: readonly [number, string, string, number][] = [
  [0, "Scout", "Sammelt Wettbewerbspreise in 6 Marktsegmenten", 200],
  [0, "Scout → Analyst", "Übergabe: Preisdaten + Marktkontext", 700],
  [1, "Analyst", "Berechnet Preiselastizität je Segment", 1300],
  [1, "Analyst → Kritiker", "Übergabe: Elastizitäts-Modell", 1900],
  [2, "Kritiker", "Modell weicht in Segment 3 von Ist-Umsätzen ab", 2500],
  [2, "Kritiker → Redakteur", "Freigabe mit Vorbehalt zu Segment 3", 3100],
  [3, "Redakteur", "✓ Memo fertig (1,1k Tokens, 6 Quellen)", 3700],
];

const SCRIPT_PRICING_EN: readonly [number, string, string, number][] = [
  [0, "Scout", "Gathering competitor prices across 6 market segments", 200],
  [0, "Scout → Analyst", "Handoff: pricing data and market context", 700],
  [1, "Analyst", "Calculating price elasticity per segment", 1300],
  [1, "Analyst → Critic", "Handoff: elasticity model", 1900],
  [2, "Critic", "Model diverges from actuals in segment 3", 2500],
  [2, "Critic → Editor", "Approved with a caveat on segment 3", 3100],
  [3, "Editor", "Memo complete (1.1k tokens, 6 sources)", 3700],
];

interface MemoContent {
  readonly meta: readonly [string, string];
  readonly recommendation: readonly [string, string];
  readonly sections: readonly {
    readonly title: readonly [string, string];
    readonly body: readonly [string, string];
  }[];
}

const MEMO_CONTENT: Readonly<Record<Scenario, MemoContent>> = {
  contracts: {
    meta: ["2,4k Tokens · 18 Quellen", "2.4k tokens · 18 sources"],
    recommendation: [
      "KI-Einführung in 2 Phasen, Start Q3/2026.",
      "Two-phase AI rollout, starting Q3 2026.",
    ],
    sections: [
      {
        title: ["§1 · Kernthese", "§1 · Core claim"],
        body: [
          "Drei von vier Thesen werden durch die Beispielquellen gestützt. Eine These bleibt offen.",
          "The sample sources support three of four claims. One claim remains unresolved.",
        ],
      },
      {
        title: ["§2 · Risiken", "§2 · Risks"],
        body: [
          "These 3 benötigt einen Branchenvergleich. Der Kritiker markiert die Lücke, der Scout ergänzt Quellen.",
          "Claim 3 requires an industry comparison. The critic marks the gap and the scout adds sources.",
        ],
      },
      {
        title: ["§3 · Nächste schritte", "§3 · Next steps"],
        body: [
          "Phase 1: begrenzter Tabellenpilot in zwei Teams. Phase 2 nur nach Ergebnis- und Risikoprüfung.",
          "Phase 1: a bounded spreadsheet pilot in two teams. Phase 2 only after outcome and risk review.",
        ],
      },
    ],
  },
  pricing: {
    meta: ["1,1k Tokens · 6 Quellen", "1.1k tokens · 6 sources"],
    recommendation: [
      "Preiserhöhung von 4 % in 5 von 6 Segmenten; Segment 3 zurückstellen.",
      "4% price increase in 5 of 6 segments; hold segment 3 pending review.",
    ],
    sections: [
      {
        title: ["§1 · Kernthese", "§1 · Core claim"],
        body: [
          "Die Preiselastizität erlaubt in 5 Segmenten eine moderate Erhöhung ohne Nachfrageeinbruch.",
          "Price elasticity supports a moderate increase in 5 segments without a demand drop.",
        ],
      },
      {
        title: ["§2 · Risiken", "§2 · Risks"],
        body: [
          "Segment 3 weicht vom Modell ab; ein regionaler Sondereffekt ist wahrscheinlich, aber unbestätigt.",
          "Segment 3 diverges from the model; a regional one-off effect is likely but unconfirmed.",
        ],
      },
      {
        title: ["§3 · Nächste schritte", "§3 · Next steps"],
        body: [
          "Erhöhung in 5 Segmenten zum Quartalswechsel. Segment 3 erst nach Regionalanalyse.",
          "Roll out the increase in 5 segments at quarter-end. Hold segment 3 for a regional review.",
        ],
      },
    ],
  },
};

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

// minHeight/minWidth are set inline at each JSX call site (not spread from
// here) because public-demo-interface-floor.test.ts's target-size scanner
// reads the literal JSX attribute text, not values reachable through a
// helper-function call.
function controlButtonStyle(disabled: boolean) {
  return {
    padding: "8px 14px",
    ...DEMO.label,
    background: "transparent",
    color: disabled ? "rgba(243,240,233,0.45)" : DEMO.kalk,
    border: `1px solid ${disabled ? DARK_HAIRLINE : DARK_EDGE}`,
    cursor: disabled ? "not-allowed" : "pointer",
  } as const;
}

const replayButtonStyle = {
  padding: "8px 14px",
  ...DEMO.label,
  background: "transparent",
  color: DEMO.kalk,
  border: `1px solid ${DARK_EDGE}`,
  cursor: "pointer",
} as const;

// Selected = filled (paper on graphit), like the site's filter chips.
function scenarioButtonStyle(active: boolean) {
  return {
    padding: "8px 12px",
    textAlign: "left",
    ...DEMO.label,
    background: active ? DEMO.kalk : "transparent",
    color: active ? "#141414" : DEMO.kalk,
    border: `1px solid ${active ? DEMO.kalk : DARK_EDGE}`,
    cursor: "pointer",
  } as const;
}

function scriptFor(scenario: Scenario, locale: string) {
  if (scenario === "contracts") return locale === "de" ? SCRIPT : SCRIPT_EN;
  return locale === "de" ? SCRIPT_PRICING : SCRIPT_PRICING_EN;
}

export default function AgentPipelineDemo() {
  const { locale, text } = useDemoLocale();
  const agents = locale === "de" ? AGENTS : AGENTS_EN;
  const reduced = usePrefersReducedMotion();
  const { ref, visible } = useVisibleAutoplay<HTMLDivElement>();
  const [scenario, setScenario] = useState<Scenario>("contracts");
  // Final state first (design direction, principle 6): the full trace and
  // the memo render on load. "Neu abspielen" is the only way into a replay.
  const [stepIndex, setStepIndex] = useState(
    () => scriptFor("contracts", locale).length,
  );
  const [autoplay, setAutoplay] = useState(false);
  const [runId, setRunId] = useState(0);
  const logRef = useRef<HTMLDivElement | null>(null);

  const script = scriptFor(scenario, locale);

  const logs: readonly LogEntry[] = script
    .slice(0, stepIndex)
    .map(([ag, src, t, delay], id) => ({ id, ag, src, t, ts: fmtTs(delay) }));
  const done = stepIndex >= script.length;
  // During a replay the first agent is marked as soon as the run starts,
  // before its first timer fires. At rest (the final state) no card is
  // current: every step has run.
  const active = done
    ? -1
    : stepIndex > 0
      ? script[stepIndex - 1][0]
      : visible && autoplay && !reduced
        ? script[0][0]
        : -1;

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [stepIndex]);

  useEffect(() => {
    if (reduced) {
      setStepIndex(script.length);
      setAutoplay(false);
      return;
    }
    if (!visible || !autoplay) return;
    setStepIndex(0);
    const timers = script.map((entry, i) =>
      setTimeout(() => {
        setStepIndex(i + 1);
      }, entry[3]),
    );
    const endT = setTimeout(() => setAutoplay(false), 5100);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(endT);
    };
  }, [visible, reduced, autoplay, script, runId]);

  const stepBack = () => {
    setAutoplay(false);
    setStepIndex((i) => Math.max(0, i - 1));
  };
  const stepForward = () => {
    setAutoplay(false);
    setStepIndex((i) => Math.min(script.length, i + 1));
  };
  const replay = () => {
    setStepIndex(0);
    setAutoplay(true);
    setRunId((n) => n + 1);
  };
  // A new task shows its own final state; replay stays a separate choice.
  const selectScenario = (next: Scenario) => {
    if (next === scenario) return;
    setScenario(next);
    setStepIndex(scriptFor(next, locale).length);
    setAutoplay(false);
  };

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
        @keyframes agent-pipeline-log-in {
          from { opacity: 0; transform: translateX(-4px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* The page H1 and lead name the demo; this heading only gives
          screen-reader users a landmark into the instrument. */}
      <h2 className="sr-only">
        {text("Agent-Pipeline: Spur und Memo", "Agent pipeline: trace and memo")}
      </h2>

      <div
        role="group"
        aria-label={text("Aufgabe wählen", "Choose a task")}
        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
      >
        <button
          type="button"
          aria-pressed={scenario === "contracts"}
          onClick={() => selectScenario("contracts")}
          style={{ minHeight: 44, ...scenarioButtonStyle(scenario === "contracts") }}
        >
          {text("Vertragsanalyse", "Contract analysis")}
        </button>
        <button
          type="button"
          aria-pressed={scenario === "pricing"}
          onClick={() => selectScenario("pricing")}
          style={{ minHeight: 44, ...scenarioButtonStyle(scenario === "pricing") }}
        >
          {text("Preisanalyse", "Pricing analysis")}
        </button>
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
          const inactiveTextBase = DARK_MUTED;
          return (
            <div
              key={a.id}
              aria-current={activeCard ? "step" : undefined}
              style={{
                // Flat: the current step is marked by tone and a Mennige
                // edge, with no glow and no looping pulse.
                background: activeCard
                  ? "rgba(243,240,233,0.08)"
                  : "transparent",
                color: DEMO.kalk,
                padding: 12,
                border: `1px solid ${activeCard ? DARK_ACCENT : DARK_HAIRLINE}`,
                transition: "background-color 120ms, border-color 120ms",
                position: "relative",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  ...DEMO.label,
                  color: activeCard ? DEMO.kalk : DARK_MUTED,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                0{i + 1} · {a.r}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "-0.005em",
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

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={stepBack}
            disabled={stepIndex === 0}
            style={{ minHeight: 44, minWidth: 44, ...controlButtonStyle(stepIndex === 0) }}
          >
            {text("◀ Zurück", "◀ Back")}
          </button>
          <span
            style={{
              ...DEMO.label,
              color: DARK_MUTED,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {text(
              `Schritt ${stepIndex} / ${script.length}`,
              `Step ${stepIndex} / ${script.length}`,
            )}
          </span>
          <button
            type="button"
            onClick={stepForward}
            disabled={stepIndex === script.length}
            style={{
              minHeight: 44,
              minWidth: 44,
              ...controlButtonStyle(stepIndex === script.length),
            }}
          >
            {text("Weiter ▶", "Next ▶")}
          </button>
        </div>
        <button
          type="button"
          onClick={replay}
          style={{ minHeight: 44, ...replayButtonStyle }}
        >
          {text("↻ Neu abspielen", "↻ Replay")}
        </button>
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
          // Scrollable log: keyboard users need a focus stop to scroll it.
          tabIndex={0}
          role="region"
          aria-label={text("Agentenprotokoll", "Agent log")}
          style={{
            background: "#070606",
            color: DEMO.kalk,
            padding: 14,
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            overflowY: "auto",
            maxHeight: 260,
            minHeight: 180,
            borderTop: `2px solid ${DARK_EDGE}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
              paddingBottom: 6,
              borderBottom: `1px solid ${DARK_HAIRLINE}`,
              fontSize: 12,
              color: DARK_MUTED,
            }}
          >
            <span>agent.log</span>
            <span
              style={{
                ...DEMO.label,
                color: DARK_MUTED,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {logs.length} {text("Ereignisse", "events")}
            </span>
          </div>
          {logs.length === 0 && active < 0 && (
            <div style={{ color: DARK_MUTED }}>
              {text("Wartet auf den ersten Schritt …", "Waiting for the first step …")}
            </div>
          )}
          {logs.map((l, i) => {
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
                <span style={{ color: DARK_MUTED, flexShrink: 0 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ color: DARK_MUTED, flexShrink: 0 }}>
                  {l.ts}
                </span>
                <span
                  style={{
                    color: DEMO.kalk,
                    fontWeight: 700,
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

        {/* The memo is the result, so it is always on screen: at rest it is
            the final state, and during a replay the trace fills in beside
            it. */}
        <div
          data-agent-memo
          style={{
            border: `1px solid ${DARK_HAIRLINE}`,
            borderTop: `2px solid ${DARK_EDGE}`,
            padding: 14,
            minHeight: 200,
          }}
        >
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
                alignItems: "baseline",
                marginBottom: 8,
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <div style={{ ...DEMO.label, color: DEMO.kalk }}>
                {text("Memo an die Geschäftsführung", "Memo to management")}
              </div>
              <span
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 12,
                  color: DARK_MUTED,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {text(...MEMO_CONTENT[scenario].meta)}
              </span>
            </div>
            <div style={{ ...DEMO.label, color: DARK_MUTED, marginTop: 4 }}>
              {text("Empfehlung", "Recommendation")}
            </div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "-0.005em",
                margin: "2px 0 10px",
                lineHeight: 1.3,
                color: DEMO.kalk,
              }}
            >
              {text(...MEMO_CONTENT[scenario].recommendation)}
            </h3>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: "rgba(243,240,233,0.86)",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {MEMO_CONTENT[scenario].sections.map((section) => (
                <MemoSection
                  key={section.title[0]}
                  title={text(...section.title)}
                  body={text(...section.body)}
                />
              ))}
            </div>
          </div>
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
    <div style={{ borderTop: `1px solid ${DARK_HAIRLINE}`, paddingTop: 6 }}>
      <div
        style={{
          ...DEMO.label,
          color: DEMO.kalk,
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

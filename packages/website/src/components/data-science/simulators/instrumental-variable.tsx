"use client";

import { useState, type ReactNode } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { useDataScienceLocale } from "../locale-context";

// ─── InstrumentalVariable ──────────────────────────
//
// Typed port of Ch09_Causal.js's `InstrumentalVariable`: IV strength
// selector. No RNG. `arrow` closes over this component's own `nodes`/
// `W`/`H`/`strength` state — kept local to this file across the split.

interface Strength {
  readonly label: string;
  readonly corr: number;
  readonly fStat: number;
  readonly ivEst: number;
  readonly olesBias: number;
}

const STRENGTHS: readonly Strength[] = [
  { label: "Weak", corr: 0.12, fStat: 4.2, ivEst: 0.31, olesBias: 0.18 },
  { label: "Moderate", corr: 0.38, fStat: 22.1, ivEst: 0.62, olesBias: 0.18 },
  { label: "Strong", corr: 0.71, fStat: 89.4, ivEst: 0.68, olesBias: 0.18 },
];
const STRENGTH_LABELS_DE = ["Schwach", "Mittel", "Stark"] as const;

const trueEffect = 0.65;
const W = 400;
const H = 220;
const R = 26;

interface NodeSpec {
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly sub: string;
  readonly color: string;
}

const NODES: Record<"Z" | "X" | "Y" | "U", NodeSpec> = {
  Z: {
    x: 0.08,
    y: 0.5,
    label: "Z",
    sub: "Proximity\nto college",
    color: "var(--warn-ink)",
  },
  X: {
    x: 0.45,
    y: 0.5,
    label: "X",
    sub: "Education",
    color: "var(--blue-ink)",
  },
  Y: { x: 0.82, y: 0.5, label: "Y", sub: "Earnings", color: "var(--good-ink)" },
  U: {
    x: 0.63,
    y: 0.1,
    label: "U",
    sub: "Unobserved\nconfounders",
    color: "var(--magenta-ink)",
  },
};
const NODE_SUBS_DE: Readonly<Record<keyof typeof NODES, string>> = {
  Z: "Nähe zur\nHochschule",
  X: "Bildung",
  Y: "Einkommen",
  U: "Unbeobachtete\nConfounder",
};

const MARKER_COLORS = ["#E8A031", "#5B9BE8", "#FF4DA2", "#C7C4BC"];

function arrow(
  from: keyof typeof NODES,
  to: keyof typeof NODES,
  color: string,
  strength: number,
  dashed = false,
  curved = false,
): ReactNode {
  const nf = NODES[from];
  const nt = NODES[to];
  const dx = nt.x * W - nf.x * W;
  const dy = nt.y * H - nf.y * H;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const x1 = nf.x * W + ux * R;
  const y1 = nf.y * H + uy * R;
  const x2 = nt.x * W - ux * R;
  const y2 = nt.y * H - uy * R;
  const markerId = `iv-arr-${color.replace("#", "")}`;

  if (curved) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 - 30;
    return (
      <path
        d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeDasharray={dashed ? "5 4" : ""}
        opacity={0.85}
        markerEnd={`url(#${markerId})`}
      />
    );
  }
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={from === "Z" ? 2 + strength * 0.6 : 1.8}
      strokeDasharray={dashed ? "5 4" : ""}
      opacity={dashed ? 0.65 : 0.9}
      markerEnd={`url(#${markerId})`}
    />
  );
}

export function InstrumentalVariable() {
  const { locale, text } = useDataScienceLocale();
  const [strength, setStrength] = useState(1);
  const [showBias, setShowBias] = useState(false);
  const s = STRENGTHS[strength]!;
  const bias = Math.abs(s.ivEst - trueEffect);

  return (
    <Panel
      eyebrow={text("SIMULATION", "SIMULATION")}
      title={text("Instrumental Variables", "Instrumentalvariablen")}
      meta={`F-stat: ${s.fStat}`}
      caption={text(
        "This lookup-table demo changes the displayed first stage and estimates together; it does not fit IV data. Relevance is only one requirement. Exogeneity, exclusion, the estimand, and weak-instrument-robust inference need separate design evidence.",
        "Diese Lookup-Table-Simulation verändert die angezeigte erste Stufe und die Schätzungen gemeinsam; sie passt keine IV-Daten an. Relevanz ist nur eine Anforderung. Exogenität, Exklusion, Estimand und Weak-IV-robuste Inferenz benötigen separate Designevidenz.",
      )}
    >
      <div className="sim-row" style={{ gridTemplateColumns: "220px 1fr" }}>
        <div className="sim-controls">
          <div className="sim-ctrl">
            <label>{text("Instrument strength", "Instrumentstärke")}</label>
            <div className="seg" style={{ flexDirection: "column", gap: 4 }}>
              {STRENGTHS.map((st, i) => (
                <button
                  key={i}
                  type="button"
                  className={strength === i ? "on" : ""}
                  onClick={() => setStrength(i)}
                >
                  {locale === "de" ? STRENGTH_LABELS_DE[i] : st.label}{" "}
                  <span style={{ opacity: 0.5, fontSize: 12 }}>
                    r={st.corr}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="sim-ctrl" style={{ marginTop: 8 }}>
            <button
              type="button"
              className={`btn btn-sm ${showBias ? "btn-primary" : ""}`}
              onClick={() => setShowBias((b) => !b)}
            >
              {showBias
                ? text("Hide OLS bias", "OLS-Bias ausblenden")
                : text("Compare OLS", "Mit OLS vergleichen")}
            </button>
          </div>
          <div
            className="sim-stats"
            style={{ gridTemplateColumns: "1fr 1fr", marginTop: 10 }}
          >
            <div>
              <div className="k">{text("IV estimate", "IV-Schätzung")}</div>
              <div
                className="v"
                style={{ fontSize: 20, color: "var(--blue-ink)" }}
              >
                {s.ivEst.toFixed(2)}
              </div>
              <div className="sub">
                {text("bias", "Bias")}: {bias.toFixed(2)}
              </div>
            </div>
            {showBias && (
              <div>
                <div className="k">{text("OLS estimate", "OLS-Schätzung")}</div>
                <div
                  className="v"
                  style={{ fontSize: 20, color: "var(--magenta-ink)" }}
                >
                  {(trueEffect + s.olesBias).toFixed(2)}
                </div>
                <div className="sub">
                  {text("bias", "Bias")}: {s.olesBias.toFixed(2)}
                </div>
              </div>
            )}
          </div>
          <div
            style={{
              marginTop: 8,
              padding: "8px 10px",
              borderRadius: 6,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              fontSize: 12,
            }}
          >
            <div
              style={{
                color: "var(--ink-3)",
                fontFamily: "'JetBrains Mono',monospace",
                marginBottom: 4,
              }}
            >
              {text("F-statistic (first stage)", "F-Statistik (erste Stufe)")}
            </div>
            <div
              style={{
                color: s.fStat < 10 ? "var(--magenta-ink)" : "var(--good-ink)",
                fontWeight: 700,
                fontSize: 16,
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              {s.fStat} {s.fStat < 10 ? text("⚠ weak", "⚠ schwach") : "✓"}
            </div>
            <div style={{ color: "var(--ink-3)", fontSize: 12, marginTop: 4 }}>
              {text(
                "F=10 is a conventional screen, not an instrument-validity test",
                "F=10 ist ein konventioneller Screen, kein Gültigkeitstest für das Instrument",
              )}
            </div>
          </div>
        </div>
        <div className="plot-wrap">
          <svg viewBox={`0 0 ${W} ${H}`}>
            <defs>
              {MARKER_COLORS.map((c) => (
                <marker
                  key={c}
                  id={`iv-arr-${c.replace("#", "")}`}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill={c} />
                </marker>
              ))}
            </defs>
            {arrow("Z", "X", "#E8A031", strength)}
            {arrow("X", "Y", "#C7C4BC", strength)}
            {arrow("U", "X", "#FF4DA2", strength, true)}
            {arrow("U", "Y", "#FF4DA2", strength, true)}
            {(Object.entries(NODES) as [keyof typeof NODES, NodeSpec][]).map(
              ([id, n]) => {
                const lines = (
                  locale === "de" ? NODE_SUBS_DE[id] : n.sub
                ).split("\n");
                return (
                  <g key={id}>
                    <circle
                      cx={n.x * W}
                      cy={n.y * H}
                      r={R}
                      fill={`${n.color}18`}
                      stroke={n.color}
                      strokeWidth="2"
                      strokeDasharray={id === "U" ? "4 3" : ""}
                    />
                    <text
                      x={n.x * W}
                      y={n.y * H + 5}
                      textAnchor="middle"
                      fill="#F4F2EC"
                      fontSize="15"
                      fontFamily="'JetBrains Mono',monospace"
                      fontWeight="700"
                    >
                      {n.label}
                    </text>
                    {lines.map((line, li) => (
                      <text
                        key={li}
                        x={n.x * W}
                        y={n.y * H + R + 14 + li * 13}
                        textAnchor="middle"
                        fill={n.color}
                        fontSize="9"
                        fontFamily="'JetBrains Mono',monospace"
                        opacity={0.8}
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                );
              },
            )}
            <text
              x={(NODES.Z.x * W + NODES.X.x * W) / 2}
              y={NODES.Z.y * H - 14}
              textAnchor="middle"
              fontSize="10"
              fill="#E8A031"
              fontFamily="'JetBrains Mono',monospace"
            >
              {locale === "de" ? STRENGTH_LABELS_DE[strength] : s.label} · r=
              {s.corr}
            </text>
            <g transform={`translate(${W - 130}, ${H - 50})`}>
              <rect width="120" height="42" rx="4" fill="rgba(0,0,0,0.25)" />
              <line
                x1="8"
                y1="12"
                x2="28"
                y2="12"
                stroke="#E8A031"
                strokeWidth="2"
              />
              <text
                x="32"
                y="16"
                fontSize="9"
                fill="#C7C4BC"
                fontFamily="'JetBrains Mono',monospace"
              >
                {text("causal path", "kausaler Pfad")}
              </text>
              <line
                x1="8"
                y1="30"
                x2="28"
                y2="30"
                stroke="#FF4DA2"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x="32"
                y="34"
                fontSize="9"
                fill="#C7C4BC"
                fontFamily="'JetBrains Mono',monospace"
              >
                {text("unobserved", "unbeobachtet")}
              </text>
            </g>
          </svg>
        </div>
      </div>
    </Panel>
  );
}

export default InstrumentalVariable;

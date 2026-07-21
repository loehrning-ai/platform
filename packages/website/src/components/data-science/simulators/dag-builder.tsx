"use client";

import { useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { inkOf } from "@/lib/data-science/sim-kit";

// ─── DAGBuilder ────────────────────────────────────
//
// Typed port of Ch09_Causal.js's `DAGBuilder`: 4-pattern DAG selector
// (direct/fork/mediator/collider). No RNG. `edgePath` closes over this
// component's own `W`/`H` — kept local to this file across the split.

interface DagNode {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly role: "treatment" | "outcome" | "confounder" | "mediator" | "collider";
}

type EdgeType = "causal" | "spurious" | "direct";

interface DagEdge {
  readonly from: string;
  readonly to: string;
  readonly type: EdgeType;
}

interface DagPattern {
  readonly title: string;
  readonly tag: string;
  readonly nodes: readonly DagNode[];
  readonly edges: readonly DagEdge[];
  readonly question: string;
  readonly answer: string;
  readonly adjustZ: boolean | null;
  readonly adjustIcon: string;
  readonly explanation: string;
}

const DAGS: readonly DagPattern[] = [
  {
    title: "Direct effect",
    tag: "X → Y",
    nodes: [
      { id: "X", x: 0.2, y: 0.5, label: "X", role: "treatment" },
      { id: "Y", x: 0.8, y: 0.5, label: "Y", role: "outcome" },
    ],
    edges: [{ from: "X", to: "Y", type: "causal" }],
    question: "Can we estimate X → Y?",
    answer: "Yes, directly.",
    adjustZ: null,
    adjustIcon: "—",
    explanation: "No confounders, no colliders. A simple regression of Y on X recovers the causal effect. This is the ideal scenario.",
  },
  {
    title: "Fork / Confounder",
    tag: "X ← Z → Y",
    nodes: [
      { id: "Z", x: 0.5, y: 0.15, label: "Z", role: "confounder" },
      { id: "X", x: 0.2, y: 0.75, label: "X", role: "treatment" },
      { id: "Y", x: 0.8, y: 0.75, label: "Y", role: "outcome" },
    ],
    edges: [
      { from: "Z", to: "X", type: "causal" },
      { from: "Z", to: "Y", type: "causal" },
      { from: "X", to: "Y", type: "spurious" },
    ],
    question: "Can we estimate X → Y?",
    answer: "Yes, but only after controlling for Z.",
    adjustZ: true,
    adjustIcon: "✓ Adjust for Z",
    explanation: "Z opens a backdoor path X ← Z → Y. Including Z in the regression blocks this path and isolates the X → Y effect. Classic omitted-variable bias if you skip it.",
  },
  {
    title: "Mediator",
    tag: "X → Z → Y",
    nodes: [
      { id: "X", x: 0.15, y: 0.5, label: "X", role: "treatment" },
      { id: "Z", x: 0.5, y: 0.5, label: "Z", role: "mediator" },
      { id: "Y", x: 0.85, y: 0.5, label: "Y", role: "outcome" },
    ],
    edges: [
      { from: "X", to: "Z", type: "causal" },
      { from: "Z", to: "Y", type: "causal" },
      { from: "X", to: "Y", type: "direct" },
    ],
    question: "Can we estimate X → Y total effect?",
    answer: "Yes, but do NOT control for Z.",
    adjustZ: false,
    adjustIcon: "✗ Do not adjust for Z",
    explanation: "Z is on the causal path from X to Y. Conditioning on it blocks the indirect pathway and you measure only the direct effect, not the total. Control for Z only when you explicitly want the direct effect.",
  },
  {
    title: "Collider",
    tag: "X → Z ← Y",
    nodes: [
      { id: "X", x: 0.2, y: 0.25, label: "X", role: "treatment" },
      { id: "Y", x: 0.8, y: 0.25, label: "Y", role: "outcome" },
      { id: "Z", x: 0.5, y: 0.75, label: "Z", role: "collider" },
    ],
    edges: [
      { from: "X", to: "Z", type: "causal" },
      { from: "Y", to: "Z", type: "causal" },
      { from: "X", to: "Y", type: "spurious" },
    ],
    question: "Can we estimate X → Y?",
    answer: "Yes, but NEVER condition on Z.",
    adjustZ: false,
    adjustIcon: "✗ Do not adjust for Z",
    explanation: 'Z is a collider: both X and Y point into it. Conditioning on Z opens a fake association between X and Y. This is selection bias, e.g., conditioning on "hired by top firm" creates spurious talent-looks tradeoff.',
  },
];

const ROLE_COLOR: Record<DagNode["role"], string> = {
  treatment: "#5B9BE8",
  outcome: "#1FAF7E",
  confounder: "#FFC266",
  mediator: "#9A6BFF",
  collider: "#FF4DA2",
};

const EDGE_COLOR: Record<EdgeType, string> = { causal: "#C7C4BC", spurious: "#FF4DA2", direct: "#D1FF3A" };

function markerFor(type: EdgeType): string {
  return type === "spurious" ? "arr-red9" : type === "direct" ? "arr-lime9" : "arr9";
}

const W = 360;
const H = 200;

function edgePath(from: string, to: string, nodes: readonly DagNode[]) {
  const nf = nodes.find((n) => n.id === from)!;
  const nt = nodes.find((n) => n.id === to)!;
  const r = 26;
  const dx = nt.x * W - nf.x * W;
  const dy = nt.y * H - nf.y * H;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  return {
    x1: nf.x * W + ux * r,
    y1: nf.y * H + uy * r,
    x2: nt.x * W - ux * r,
    y2: nt.y * H - uy * r,
  };
}

export function DAGBuilder() {
  const [active, setActive] = useState(0);
  const dag = DAGS[active]!;
  const adjustColor = dag.adjustZ === null ? "#8A8680" : dag.adjustZ ? "#1FAF7E" : "#FF4DA2";

  return (
    <Panel
      eyebrow="SIMULATION"
      title="DAG patterns · should you adjust for Z?"
      meta={dag.tag}
      caption="Four structural patterns. Each has a different answer to 'should I include Z in my regression?' The answer is never obvious from data alone, only the DAG tells you."
    >
      <div className="sim-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="seg" style={{ flexDirection: "column", gap: 4 }}>
            {DAGS.map((d, i) => (
              <button key={i} type="button" className={active === i ? "on" : ""} onClick={() => setActive(i)}>
                {d.title} <span style={{ opacity: 0.55, fontSize: 10 }}>{d.tag}</span>
              </button>
            ))}
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "12px 14px", marginTop: 4 }}>
            <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>{dag.question}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-1)", marginBottom: 8 }}>{dag.answer}</div>
            <div
              style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "'JetBrains Mono',monospace",
                background: `${adjustColor}22`,
                color: inkOf(adjustColor),
                border: `1px solid ${adjustColor}66`,
                marginBottom: 8,
              }}
            >
              {dag.adjustIcon}
            </div>
            <p className="prose" style={{ fontSize: 11.5, margin: 0, color: "var(--ink-3)" }}>
              {dag.explanation}
            </p>
          </div>
        </div>
        <div className="plot-wrap">
          <svg viewBox={`0 0 ${W} ${H}`}>
            <defs>
              {(["arr9", "arr-red9", "arr-lime9"] as const).map((id, idx) => {
                const colors = ["#C7C4BC", "#FF4DA2", "#D1FF3A"];
                return (
                  <marker key={id} id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M0,0 L10,5 L0,10 z" fill={colors[idx]} />
                  </marker>
                );
              })}
            </defs>
            {dag.edges.map((e, i) => {
              const { x1, y1, x2, y2 } = edgePath(e.from, e.to, dag.nodes);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={EDGE_COLOR[e.type]}
                  strokeWidth={1.8}
                  strokeDasharray={e.type === "spurious" ? "5 4" : ""}
                  markerEnd={`url(#${markerFor(e.type)})`}
                  opacity={0.85}
                />
              );
            })}
            {dag.nodes.map((n) => {
              const col = ROLE_COLOR[n.role] || "#C7C4BC";
              return (
                <g key={n.id}>
                  <circle cx={n.x * W} cy={n.y * H} r="26" fill={`${col}18`} stroke={col} strokeWidth="2" />
                  <text x={n.x * W} y={n.y * H + 5} textAnchor="middle" fill="#F4F2EC" fontSize="15" fontFamily="'JetBrains Mono',monospace" fontWeight="700">
                    {n.label}
                  </text>
                  <text
                    x={n.x * W}
                    y={n.y * H + 42}
                    textAnchor="middle"
                    fill={col}
                    fontSize="9"
                    fontFamily="'JetBrains Mono',monospace"
                    style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}
                  >
                    {n.role}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </Panel>
  );
}

export default DAGBuilder;

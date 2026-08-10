"use client";

// ─── DAGDiagram ───────────────────────────────────
// Ported from `src/chapters/Ch4_Orchestrate.js`: static pipeline DAG —
// raw_events -> clean_events/deduped_sessions -> daily_rollup -> two sinks.
// No client state; pure presentational SVG.

import { useDataEngineeringFundamentalsLocale } from "../locale-context";

interface DagNode {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly kind: "source" | "etl" | "sink";
}

const NODES: readonly DagNode[] = [
  { id: "raw", x: 80, y: 150, label: "raw_events", kind: "source" },
  { id: "clean", x: 300, y: 80, label: "clean_events", kind: "etl" },
  { id: "dedup", x: 300, y: 220, label: "deduped_sessions", kind: "etl" },
  { id: "agg", x: 540, y: 150, label: "daily_rollup", kind: "etl" },
  { id: "dash", x: 780, y: 80, label: "exec_dashboard", kind: "sink" },
  { id: "ml", x: 780, y: 220, label: "ml_features", kind: "sink" },
];

const EDGES: readonly (readonly [string, string])[] = [
  ["raw", "clean"],
  ["raw", "dedup"],
  ["clean", "agg"],
  ["dedup", "agg"],
  ["agg", "dash"],
  ["agg", "ml"],
];

export function DAGDiagram() {
  const { text } = useDataEngineeringFundamentalsLocale();
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

  return (
    <div style={{ background: "#fff", border: "1px solid var(--theme-gray-200)", borderRadius: 10, padding: 14 }}>
      <svg viewBox="0 0 860 300" style={{ width: "100%", display: "block", aspectRatio: "860/300" }}>
        <defs>
          <marker id="arr4" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--theme-gray-400)" />
          </marker>
        </defs>
        {EDGES.map(([a, b], i) => {
          const n1 = byId[a];
          const n2 = byId[b];
          return (
            <line key={i} x1={n1.x + 60} y1={n1.y} x2={n2.x - 60} y2={n2.y} stroke="var(--theme-gray-300)" strokeWidth="1.5" markerEnd="url(#arr4)" />
          );
        })}
        {NODES.map((n) => {
          const fill = n.kind === "source" ? "#FFFBF2" : n.kind === "sink" ? "#F4FBF5" : "#F3F8FF";
          const stroke = n.kind === "source" ? "#F7B928" : n.kind === "sink" ? "var(--theme-green)" : "var(--theme-blue)";
          return (
            <g key={n.id}>
              <rect x={n.x - 66} y={n.y - 24} width={132} height={50} rx={9} fill={fill} stroke={stroke} strokeWidth="1.6" />
              <text x={n.x} y={n.y - 4} textAnchor="middle" style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, fill: "var(--fg-1)" }}>
                {n.label}
              </text>
              <text
                x={n.x}
                y={n.y + 14}
                textAnchor="middle"
                style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fill: "var(--fg-2)", letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                {n.kind === "source" ? text("source", "Quelle") : n.kind === "sink" ? text("sink", "Ziel") : text("etl", "ETL")}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default DAGDiagram;

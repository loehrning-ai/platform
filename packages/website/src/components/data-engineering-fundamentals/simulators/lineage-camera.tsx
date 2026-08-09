"use client";

import { useState } from "react";
import { Panel } from "../primitives";
import { useDataEngineeringFundamentalsLocale } from "../locale-context";

// ─── LineageCamera ────────────────────────────────
// Ported from `src/chapters/Ch6_Discover.js`: click a node in the lineage
// graph to re-focus the camera; unrelated edges fade.

interface LNode {
  readonly x: number;
  readonly y: number;
  readonly kind: "source" | "etl" | "metric" | "dash";
  readonly label: string;
}

const NODES: Readonly<Record<string, LNode>> = {
  raw_scans: { x: 90, y: 80, kind: "source", label: "raw_scans" },
  raw_accounts: { x: 90, y: 180, kind: "source", label: "raw_accounts" },
  raw_pageviews: { x: 90, y: 280, kind: "source", label: "raw_pageviews" },
  fct_events: { x: 380, y: 140, kind: "etl", label: "fct_events" },
  dim_users: { x: 380, y: 240, kind: "etl", label: "dim_users" },
  "metric:conversion": { x: 680, y: 80, kind: "metric", label: "conversion_rate" },
  "metric:dau_7d": { x: 680, y: 180, kind: "metric", label: "dau_7d" },
  "dash:weekly_exec": { x: 680, y: 280, kind: "dash", label: "weekly_exec_dash" },
};

const EDGES: readonly (readonly [string, string])[] = [
  ["raw_scans", "fct_events"],
  ["raw_accounts", "fct_events"],
  ["raw_accounts", "dim_users"],
  ["raw_pageviews", "dim_users"],
  ["fct_events", "metric:conversion"],
  ["fct_events", "metric:dau_7d"],
  ["dim_users", "metric:dau_7d"],
  ["fct_events", "dash:weekly_exec"],
];

export function LineageCamera() {
  const { text } = useDataEngineeringFundamentalsLocale();
  const [focus, setFocus] = useState("fct_events");

  const highlighted = new Set([focus]);
  for (const [a, b] of EDGES) {
    if (a === focus) highlighted.add(b);
    if (b === focus) highlighted.add(a);
  }

  return (
    <Panel
      eyebrow={text("bonus sim · lineage camera", "Zusatzsimulation · Lineage-Ansicht")}
      title={`${text("Lineage of", "Lineage von")} ${focus}`}
      meta={text("click a node to pan", "Knoten auswählen und Ansicht fokussieren")}
      caption={text("Illustrative catalog graph. Actual edges depend on emitted lineage, ingestion, and integration coverage.", "Beispielhafter Kataloggraph. Reale Kanten hängen von ausgegebener Lineage, Aufnahme und Integrationsabdeckung ab.")}
    >
      <div className="lc-stage">
        <svg viewBox="0 0 800 360" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", display: "block", userSelect: "none" }}>
          <defs>
            <marker id="lc-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--theme-gray-400)" />
            </marker>
          </defs>
          {EDGES.map(([a, b], i) => {
            const n1 = NODES[a];
            const n2 = NODES[b];
            const on = highlighted.has(a) && highlighted.has(b);
            return (
              <line
                key={i}
                x1={n1.x + 62}
                y1={n1.y}
                x2={n2.x - 62}
                y2={n2.y}
                stroke={on ? "var(--theme-blue)" : "var(--theme-gray-200)"}
                strokeWidth={on ? 2 : 1}
                markerEnd="url(#lc-arr)"
                opacity={on ? 1 : 0.35}
                style={{ transition: "opacity 280ms cubic-bezier(0.32,0.72,0,1), stroke 280ms cubic-bezier(0.32,0.72,0,1), stroke-width 280ms cubic-bezier(0.32,0.72,0,1)" }}
              />
            );
          })}
          {Object.entries(NODES).map(([id, n]) => {
            const on = highlighted.has(id);
            const isFocus = id === focus;
            const fill = n.kind === "source" ? "#FFFBF2" : n.kind === "metric" ? "#F4FBF5" : n.kind === "dash" ? "#F3F8FF" : "#fff";
            const stroke = isFocus
              ? "var(--theme-blue)"
              : n.kind === "source"
                ? "#F7B928"
                : n.kind === "metric"
                  ? "var(--theme-green)"
                  : n.kind === "dash"
                    ? "var(--theme-blue)"
                    : "var(--theme-gray-300)";
            return (
              <g
                key={id}
                className="lineage-node"
                role="button"
                tabIndex={0}
                aria-label={`${text("Focus lineage on", "Lineage fokussieren auf")} ${n.label}`}
                aria-pressed={isFocus}
                style={{ cursor: "pointer", opacity: on ? 1 : 0.4, transition: "opacity 280ms cubic-bezier(0.32,0.72,0,1)" }}
                onClick={() => setFocus(id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setFocus(id);
                  }
                }}
              >
                <rect className="lineage-node-shape" x={n.x - 62} y={n.y - 22} width={124} height={46} rx={9} fill={fill} stroke={stroke} strokeWidth={isFocus ? 2.5 : 1.5} />
                <text x={n.x} y={n.y - 2} textAnchor="middle" style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, fill: "var(--fg-1)" }}>
                  {n.label}
                </text>
                <text
                  x={n.x}
                  y={n.y + 13}
                  textAnchor="middle"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--fg-2)", letterSpacing: "0.1em", textTransform: "uppercase" }}
                >
                  {n.kind === "source" ? text("source", "Quelle") : n.kind === "metric" ? text("metric", "Metrik") : n.kind === "dash" ? "Dashboard" : "ETL"}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </Panel>
  );
}

export default LineageCamera;

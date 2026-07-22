"use client";

import { useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";

// ─── DAGViewer ─────────────────────────────────────
//
// Typed port of Ch09_Causal.js's `DAGViewer`: 3-scenario reference DAG
// viewer (confounding/collider/mediation). No RNG.

type Role = "confounder" | "collider" | "mediator" | "outcome" | undefined;

interface ViewerNode {
  readonly id: string;
  readonly lab: string;
  readonly x: number;
  readonly y: number;
  readonly role?: Role;
}

type ViewerEdgeType = "spurious" | "direct" | undefined;
type ViewerEdge = readonly [string, string, ViewerEdgeType?];

interface ViewerScenario {
  readonly name: string;
  readonly blurb: string;
  readonly nodes: readonly ViewerNode[];
  readonly edges: readonly ViewerEdge[];
}

type ScenarioKey = "confounder" | "collider" | "mediator";

const SCENARIOS: Record<ScenarioKey, ViewerScenario> = {
  confounder: {
    name: "Confounding",
    blurb: `"Coffee correlates with heart disease", but age causes both. Age is the confounder. Control for it and coffee's effect vanishes.`,
    nodes: [
      { id: "age", lab: "Age", x: 0.5, y: 0.15, role: "confounder" },
      { id: "cof", lab: "Coffee", x: 0.2, y: 0.65 },
      { id: "hd", lab: "Heart disease", x: 0.8, y: 0.65, role: "outcome" },
    ],
    edges: [
      ["age", "cof"],
      ["age", "hd"],
      ["cof", "hd", "spurious"],
    ],
  },
  collider: {
    name: "Collider bias",
    blurb: '"Talent is negatively correlated with looks in Hollywood." Both cause success, conditioning on success creates a fake negative link.',
    nodes: [
      { id: "tal", lab: "Talent", x: 0.2, y: 0.25 },
      { id: "loo", lab: "Looks", x: 0.8, y: 0.25 },
      { id: "suc", lab: "Success", x: 0.5, y: 0.75, role: "collider" },
    ],
    edges: [
      ["tal", "suc"],
      ["loo", "suc"],
      ["tal", "loo", "spurious"],
    ],
  },
  mediator: {
    name: "Mediation",
    blurb: '"Exercise → better sleep → weight loss." Sleep is a mediator. Controlling for it hides the true effect of exercise on weight.',
    nodes: [
      { id: "ex", lab: "Exercise", x: 0.15, y: 0.5 },
      { id: "sl", lab: "Sleep", x: 0.5, y: 0.5, role: "mediator" },
      { id: "wl", lab: "Weight loss", x: 0.85, y: 0.5, role: "outcome" },
    ],
    edges: [
      ["ex", "sl"],
      ["sl", "wl"],
      ["ex", "wl", "direct"],
    ],
  },
};

const W = 400;
const H = 240;

export function DAGViewer() {
  const [scenario, setScenario] = useState<ScenarioKey>("confounder");
  const s = SCENARIOS[scenario];

  return (
    <Panel
      eyebrow="REFERENCE"
      title="DAGs · the three patterns"
      meta={s.name}
      caption="Every causal mistake is one of these three. Learn to spot them on paper before you code anything."
    >
      <div className="sim-row">
        <div className="sim-controls">
          <div className="sim-ctrl">
            <label>Pattern</label>
            <div className="seg" style={{ flexDirection: "column", gap: 4 }}>
              {Object.entries(SCENARIOS).map(([k, v]) => (
                <button key={k} type="button" className={scenario === k ? "on" : ""} onClick={() => setScenario(k as ScenarioKey)}>
                  {v.name}
                </button>
              ))}
            </div>
          </div>
          <p className="prose" style={{ fontSize: 12.5, margin: 0 }}>
            {s.blurb}
          </p>
        </div>
        <div className="plot-wrap">
          <svg viewBox={`0 0 ${W} ${H}`}>
            <defs>
              <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="#C7C4BC" />
              </marker>
              <marker id="arr-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="#FF4DA2" />
              </marker>
              <marker id="arr-lime" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="#D1FF3A" />
              </marker>
            </defs>
            {s.edges.map(([a, b, type], i) => {
              const na = s.nodes.find((n) => n.id === a)!;
              const nb = s.nodes.find((n) => n.id === b)!;
              const color = type === "spurious" ? "#FF4DA2" : type === "direct" ? "#D1FF3A" : "#C7C4BC";
              const marker = type === "spurious" ? "arr-red" : type === "direct" ? "arr-lime" : "arr";
              return (
                <line
                  key={i}
                  x1={na.x * W}
                  y1={na.y * H}
                  x2={nb.x * W}
                  y2={nb.y * H}
                  stroke={color}
                  strokeWidth={type ? 2 : 1.5}
                  strokeDasharray={type === "spurious" ? "5 4" : ""}
                  markerEnd={`url(#${marker})`}
                  opacity={type === "spurious" ? 0.7 : 0.9}
                />
              );
            })}
            {s.nodes.map((n) => (
              <g key={n.id}>
                <circle
                  cx={n.x * W}
                  cy={n.y * H}
                  r="28"
                  fill={
                    n.role === "confounder"
                      ? "rgba(255,194,102,0.15)"
                      : n.role === "collider"
                        ? "rgba(255,77,162,0.15)"
                        : n.role === "mediator"
                          ? "rgba(154,107,255,0.15)"
                          : "rgba(244,242,236,0.05)"
                  }
                  stroke={
                    n.role === "confounder"
                      ? "#FFC266"
                      : n.role === "collider"
                        ? "#FF4DA2"
                        : n.role === "mediator"
                          ? "#9A6BFF"
                          : "#C7C4BC"
                  }
                  strokeWidth="2"
                />
                <text x={n.x * W} y={n.y * H + 4} textAnchor="middle" fill="#F4F2EC" fontSize="11" fontFamily="'JetBrains Mono',monospace" fontWeight="600">
                  {n.lab}
                </text>
                {n.role && (
                  <text
                    x={n.x * W}
                    y={n.y * H + 44}
                    textAnchor="middle"
                    fill="#8A8680"
                    fontSize="9"
                    fontFamily="'JetBrains Mono',monospace"
                    letterSpacing="0.1em"
                    style={{ textTransform: "uppercase" }}
                  >
                    {n.role}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>
    </Panel>
  );
}

export default DAGViewer;

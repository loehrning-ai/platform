"use client";

import { useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { inkOf } from "@/lib/data-science/sim-kit";

interface ArchNode {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly label: string;
  readonly color: string;
  readonly desc: string;
  readonly fail: string;
}

const ARCH_NODES: readonly ArchNode[] = [
  { id: "client", x: 30, y: 85, w: 80, h: 36, label: "Client", color: "#7B8CDE", desc: "Browser, mobile app, or internal service sending a prediction request.", fail: "Timeout on slow model inference; unbounded retries can flood the system." },
  { id: "lb", x: 155, y: 85, w: 80, h: 36, label: "Load Balancer", color: "#A78BFA", desc: "Distributes traffic across API replicas. Implements health checks and circuit breakers.", fail: "Single point of failure if not redundant; sticky sessions break horizontal scaling." },
  { id: "api1", x: 285, y: 55, w: 80, h: 36, label: "REST API ①", color: "#64E2B5", desc: "Stateless prediction server. Validates input, fetches features, calls model artifact.", fail: "Memory leak from model object not being shared across workers." },
  { id: "api2", x: 285, y: 115, w: 80, h: 36, label: "REST API ②", color: "#64E2B5", desc: "Replica of API ①. Autoscales based on request queue depth or CPU.", fail: "Version mismatch with API ①: different model artifact loaded after rolling deploy." },
  { id: "fs", x: 415, y: 55, w: 90, h: 36, label: "Feature Store", color: "#F4C542", desc: "Precomputed feature vectors keyed by entity ID. Serves sub-millisecond lookups from Redis or DynamoDB.", fail: "Stale features: ingestion pipeline lags → model sees yesterday's data in production." },
  { id: "registry", x: 415, y: 115, w: 90, h: 36, label: "Model Registry", color: "#FF9F6B", desc: 'Stores model artifacts with version tags, metrics, and lineage. Source of truth for "which model is live".', fail: "No champion/challenger tagging → rollback picks wrong artifact." },
  { id: "monitor", x: 285, y: 185, w: 90, h: 36, label: "Monitoring", color: "#FF6B80", desc: "Captures prediction logs, feature drift (PSI), latency p99, and ground-truth error rate when labels arrive.", fail: "Alert fatigue: too many noisy metrics → real drift goes unnoticed." },
];

const ARCH_ARROWS: readonly { x1: number; y1: number; x2: number; y2: number }[] = [
  { x1: 110, y1: 103, x2: 155, y2: 103 },
  { x1: 235, y1: 103, x2: 285, y2: 73 },
  { x1: 235, y1: 103, x2: 285, y2: 133 },
  { x1: 365, y1: 73, x2: 415, y2: 73 },
  { x1: 365, y1: 133, x2: 415, y2: 133 },
  { x1: 325, y1: 91, x2: 325, y2: 185 },
  { x1: 415, y1: 133, x2: 375, y2: 203 },
];

export function ModelServingArchitecture() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const activeId = hovered ?? selected;
  const node = ARCH_NODES.find((n) => n.id === activeId);

  return (
    <Panel
      eyebrow="DIAGRAM"
      title="Model serving architecture"
      caption="Hover, focus, or select each component to see its role and common failure modes in production."
    >
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <svg viewBox="0 0 560 240" style={{ flex: "1 1 320px", minWidth: 300, overflow: "visible" }}>
          <defs>
            <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="rgba(244,242,236,0.25)" />
            </marker>
          </defs>
          {ARCH_ARROWS.map((a, i) => (
            <line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke="rgba(244,242,236,0.2)" strokeWidth="1.5" markerEnd="url(#arr)" />
          ))}
          {ARCH_NODES.map((n) => (
            <g
              key={n.id}
              role="button"
              tabIndex={0}
              aria-label={`Inspect ${n.label}`}
              aria-pressed={selected === n.id}
              style={{ cursor: "pointer", outline: "none" }}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(n.id)}
              onBlur={() => setHovered(null)}
              onClick={() => setSelected((current) => current === n.id ? null : n.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelected((current) => current === n.id ? null : n.id);
                }
              }}
            >
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                rx="6"
                fill={activeId === n.id ? n.color : "rgba(244,242,236,0.06)"}
                stroke={n.color}
                strokeWidth={activeId === n.id ? 2 : 1}
                style={{ transition: "fill 0.18s, stroke-width 0.18s" }}
              />
              <text
                x={n.x + n.w / 2}
                y={n.y + n.h / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={activeId === n.id ? "#0D0D0C" : n.color}
                fontSize="9.5"
                fontFamily="'JetBrains Mono',monospace"
                fontWeight="600"
                style={{ pointerEvents: "none", transition: "fill 0.18s" }}
              >
                {n.label}
              </text>
            </g>
          ))}
        </svg>
        <div
          style={{
            flex: "1 1 200px",
            minWidth: 180,
            minHeight: 120,
            padding: "14px 16px",
            borderRadius: 8,
            background: "rgba(244,242,236,0.04)",
            border: "1px solid rgba(244,242,236,0.1)",
            transition: "background-color 0.18s, border-color 0.18s",
          }}
        >
          {node ? (
            <>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: inkOf(node.color),
                  marginBottom: 8,
                }}
              >
                {node.label}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink-1)", marginBottom: 10 }}>{node.desc}</div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--coral-ink)",
                  marginBottom: 6,
                }}
              >
                Common failure
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)" }}>{node.fail}</div>
            </>
          ) : (
            <div style={{ fontSize: 12.5, color: "var(--ink-3)", fontStyle: "italic", paddingTop: 8 }}>
              Hover, focus, or select a component to inspect it.
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

export default ModelServingArchitecture;

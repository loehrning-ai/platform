"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { clamp, inkOf, mulberry32, round } from "@/lib/data-science/sim-kit";

type StrategyKey = "shadow" | "canary" | "bluegreen";

const STRATEGY_INFO: Record<StrategyKey, { label: string; color: string; desc: string }> = {
  shadow: {
    label: "Shadow deploy",
    color: "#A78BFA",
    desc: "v2 gets all traffic mirrored silently. Its predictions are logged but never served. Zero user impact, the safest way to evaluate.",
  },
  canary: {
    label: "Canary deploy",
    color: "#F4C542",
    desc: "A small % of live traffic hits v2. Real users. Real labels soon. Roll back instantly if error rate spikes.",
  },
  bluegreen: {
    label: "Blue-green",
    color: "#64E2B5",
    desc: "Two identical environments. One flip switches all traffic. Instant rollback by flipping back. High infra cost.",
  },
};

interface PredictionRow {
  readonly id: string;
  readonly v1: number;
  readonly v2: number;
  readonly diff: boolean;
}

function makePredictions(seed: number, shift: number): readonly PredictionRow[] {
  const rng = mulberry32(seed);
  return Array.from({ length: 8 }, (_, i) => {
    const base = round(0.3 + rng() * 0.6, 2);
    const v2 = round(clamp(base + shift * (rng() - 0.5) * 0.4, 0.01, 0.99), 2);
    return { id: `user_${1000 + i}`, v1: base, v2, diff: Math.abs(base - v2) > 0.15 };
  });
}

export function ShadowDeployment() {
  const [trafficPct, setTrafficPct] = useState(0);
  const [strategy, setStrategy] = useState<StrategyKey>("shadow");
  const rows = useMemo(() => makePredictions(42, trafficPct / 40), [trafficPct]);
  const discRate = round(rows.filter((r) => r.diff).length / rows.length, 2);
  const info = STRATEGY_INFO[strategy];

  return (
    <Panel
      eyebrow="SIMULATION"
      title="Shadow & canary deployment"
      caption="Slide the traffic knob to ramp v2 from 0% to 100%. The discrepancy rate reveals how differently the new model behaves before it serves real users."
    >
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 12 }}>
        <div className="sim-controls" style={{ flex: "0 0 210px" }}>
          <div className="sim-ctrl">
            <label>
              v2 traffic share <span className="mono">{trafficPct}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={trafficPct}
              aria-label="v2 traffic share percent"
              onChange={(e) => setTrafficPct(+e.target.value)}
            />
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(Object.entries(STRATEGY_INFO) as [StrategyKey, (typeof STRATEGY_INFO)[StrategyKey]][]).map(([k, v]) => (
              <button
                key={k}
                type="button"
                className="btn"
                style={{
                  background: strategy === k ? v.color : "transparent",
                  color: strategy === k ? "#0D0D0C" : inkOf(v.color),
                  borderColor: v.color,
                  fontSize: 10.5,
                  padding: "4px 8px",
                }}
                onClick={() => setStrategy(k)}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 7,
              background: "rgba(244,242,236,0.04)",
              border: `1px solid ${info.color}44`,
              fontSize: 11.5,
              color: "var(--ink-2)",
              lineHeight: 1.55,
            }}
          >
            <strong style={{ color: inkOf(info.color) }}>{info.label}:</strong> {info.desc}
          </div>
          <div
            style={{
              marginTop: 8,
              padding: "8px 12px",
              borderRadius: 7,
              background: discRate > 0.3 ? "rgba(255,107,128,0.1)" : "rgba(100,226,181,0.07)",
              border: `1px solid ${discRate > 0.3 ? "rgba(255,107,128,0.35)" : "rgba(100,226,181,0.25)"}`,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
            }}
          >
            <span style={{ color: discRate > 0.3 ? "var(--coral-ink)" : "var(--good-ink)" }}>
              {discRate > 0.3 ? "⚠" : "✓"} Discrepancy rate: {(discRate * 100).toFixed(0)}%
            </span>
            <div style={{ color: "var(--ink-3)", marginTop: 3, fontFamily: "inherit", fontSize: 10.5 }}>
              {discRate > 0.3 ? "High, investigate v2 before promoting." : "Low, safe to ramp v2 further."}
            </div>
          </div>
        </div>
        <div style={{ flex: "1 1 260px", overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "center" }}>
            <div
              style={{
                flex: 1,
                padding: "6px 12px",
                borderRadius: 6,
                background: "rgba(100,226,181,0.1)",
                border: "1px solid rgba(100,226,181,0.25)",
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: "var(--good-ink)",
              }}
            >
              v1 live · {100 - trafficPct}%
            </div>
            <div
              style={{
                flex: 1,
                padding: "6px 12px",
                borderRadius: 6,
                background: "rgba(167,139,250,0.1)",
                border: "1px solid rgba(167,139,250,0.25)",
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: "var(--violet-ink)",
              }}
            >
              v2 shadow · {trafficPct}%
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
            <thead>
              <tr>
                {["Entity ID", "v1 score", "v2 score", "Δ > 0.15"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "5px 8px",
                      borderBottom: "1px solid rgba(244,242,236,0.1)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 9.5,
                      color: "var(--ink-3)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ background: r.diff ? "rgba(255,107,128,0.04)" : "transparent" }}>
                  <td style={{ padding: "5px 8px", fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-2)" }}>{r.id}</td>
                  <td style={{ padding: "5px 8px", fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--good-ink)" }}>{r.v1}</td>
                  <td style={{ padding: "5px 8px", fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--violet-ink)" }}>{r.v2}</td>
                  <td style={{ padding: "5px 8px", textAlign: "center", fontSize: 12, color: r.diff ? "var(--coral-ink)" : "var(--ink-3)" }}>
                    {r.diff ? "✗" : "·"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}

export default ShadowDeployment;

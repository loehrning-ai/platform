"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { round } from "@/lib/data-science/sim-kit";

interface PrPoint {
  readonly t: number;
  readonly precision: number;
  readonly recall: number;
}

export function PrecisionRecallTradeoff() {
  const [threshold, setThreshold] = useState(0.3);
  const [missedFraudCost, setMissedFraudCost] = useState(500);
  const [falseAlertCost, setFalseAlertCost] = useState(20);

  const prCurve = useMemo(() => {
    const pts: PrPoint[] = [];
    for (let t = 0.01; t <= 0.99; t += 0.01) {
      const recall = Math.max(0, 1 - Math.pow(t, 0.6) * 0.98);
      const precision = Math.min(1, 0.05 + 0.95 * Math.pow(t, 0.25));
      pts.push({ t: round(t, 2), precision, recall });
    }
    return pts;
  }, []);

  const current = useMemo(() => {
    const closest = prCurve.reduce(
      (best, p) => (Math.abs(p.t - threshold) < Math.abs(best.t - threshold) ? p : best),
      prCurve[0]!,
    );
    const f1 = closest.precision + closest.recall > 0 ? (2 * closest.precision * closest.recall) / (closest.precision + closest.recall) : 0;
    return { ...closest, f1 };
  }, [threshold, prCurve]);

  const totalFraudTxns = 492;
  const totalLegitTxns = 284315;
  const missedFraud = Math.round(totalFraudTxns * (1 - current.recall));
  const falseAlerts = Math.round(totalLegitTxns * (1 - current.precision) * current.recall);
  const totalCost = missedFraud * missedFraudCost + falseAlerts * falseAlertCost;

  const W = 300;
  const H = 200;
  const px = (recall: number) => recall * W;
  const py = (precision: number) => H - precision * H;
  const pathD = prCurve.map((p, i) => `${i === 0 ? "M" : "L"} ${px(p.recall).toFixed(1)} ${py(p.precision).toFixed(1)}`).join(" ");
  const dotX = px(current.recall);
  const dotY = py(current.precision);

  return (
    <Panel
      eyebrow="SIMULATOR"
      title="Precision–recall tradeoff"
      meta={`Threshold: ${threshold.toFixed(2)} · F1: ${round(current.f1, 3)}`}
      caption="In fraud detection, a missed fraud costs far more than a false alarm. Choose your threshold based on business costs, not just F1."
    >
      <div className="sim-row" style={{ alignItems: "flex-start" }}>
        <div className="plot-wrap" style={{ minWidth: 320 }}>
          <svg viewBox={`-24 -10 ${W + 40} ${H + 34}`} style={{ width: "100%" }}>
            <line x1="0" y1="0" x2="0" y2={H} stroke="var(--hair-2)" strokeWidth="1" />
            <line x1="0" y1={H} x2={W} y2={H} stroke="var(--hair-2)" strokeWidth="1" />
            <text x={W / 2} y={H + 22} textAnchor="middle" fill="var(--ink-4)" fontSize="9" fontFamily="'JetBrains Mono',monospace">
              Recall
            </text>
            <text x="-16" y={H / 2} textAnchor="middle" fill="var(--ink-4)" fontSize="9" fontFamily="'JetBrains Mono',monospace" transform={`rotate(-90, -16, ${H / 2})`}>
              Precision
            </text>
            {[0, 0.5, 1].map((v) => (
              <g key={v}>
                <text x={px(v)} y={H + 12} textAnchor="middle" fill="var(--ink-4)" fontSize="8" fontFamily="'JetBrains Mono',monospace">
                  {v}
                </text>
                <text x="-4" y={py(v) + 3} textAnchor="end" fill="var(--ink-4)" fontSize="8" fontFamily="'JetBrains Mono',monospace">
                  {v}
                </text>
              </g>
            ))}
            <path d={pathD} stroke="var(--lime)" strokeWidth="2" fill="none" opacity="0.8" />
            <circle cx={dotX} cy={dotY} r="6" fill="var(--lime)" opacity="0.9" />
            <line x1={dotX} y1={dotY} x2={dotX} y2={H} stroke="var(--lime)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
          <div className="sim-ctrl">
            <label>
              Decision threshold &nbsp;<span className="mono">{threshold.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.01"
              aria-label="Decision threshold"
              value={threshold}
              onChange={(e) => setThreshold(+e.target.value)}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { k: "Precision", v: round(current.precision, 3), color: "var(--mint-ink)" },
              { k: "Recall", v: round(current.recall, 3), color: "var(--coral-ink)" },
              { k: "F1", v: round(current.f1, 3), color: "var(--lime-ink)" },
            ].map((m) => (
              <div key={m.k} style={{ padding: "10px 12px", borderRadius: 7, background: "var(--bg-hi)", border: "1px solid var(--hair)", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--ink-4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
                  {m.k}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: m.color }}>{m.v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "var(--panel-hi)", borderRadius: 8, border: "1px solid var(--hair-2)", padding: "12px 14px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--lime-ink)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
              Business cost calculator
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div className="sim-ctrl" style={{ margin: 0 }}>
                <label>
                  Cost / missed fraud ($)
                  <br />
                  <span className="mono">${missedFraudCost}</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  aria-label="Cost per missed fraud in dollars"
                  value={missedFraudCost}
                  onChange={(e) => setMissedFraudCost(+e.target.value)}
                />
              </div>
              <div className="sim-ctrl" style={{ margin: 0 }}>
                <label>
                  Cost / false alert ($)
                  <br />
                  <span className="mono">${falseAlertCost}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="200"
                  step="1"
                  aria-label="Cost per false alert in dollars"
                  value={falseAlertCost}
                  onChange={(e) => setFalseAlertCost(+e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
              <div style={{ color: "var(--ink-3)" }}>
                Missed frauds
                <br />
                <strong style={{ color: "var(--coral-ink)", fontSize: 16 }}>{missedFraud}</strong>
              </div>
              <div style={{ color: "var(--ink-3)" }}>
                False alerts
                <br />
                <strong style={{ color: "var(--ink-2)", fontSize: 16 }}>{falseAlerts.toLocaleString()}</strong>
              </div>
              <div style={{ color: "var(--ink-3)" }}>
                Total cost
                <br />
                <strong style={{ color: "var(--lime-ink)", fontSize: 16 }}>${totalCost.toLocaleString()}</strong>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.6 }}>
            {threshold <= 0.25 && (
              <>
                <strong style={{ color: "var(--coral-ink)" }}>Low threshold:</strong> Catches most fraud but flags many legitimate
                transactions. High operational cost.
              </>
            )}
            {threshold > 0.25 && threshold <= 0.45 && (
              <>
                <strong style={{ color: "var(--lime-ink)" }}>Sweet spot (0.25–0.45):</strong> Threshold {threshold.toFixed(2)} catches ~
                {round(current.recall * 100, 0)}% of fraud with manageable false-positive rate.
              </>
            )}
            {threshold > 0.45 && (
              <>
                <strong style={{ color: "var(--mint-ink)" }}>High threshold:</strong> Very precise — catches only the most obvious fraud.
                Misses edge cases.
              </>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default PrecisionRecallTradeoff;

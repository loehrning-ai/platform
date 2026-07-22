"use client";

import { useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { clamp } from "@/lib/data-science/sim-kit";

type StrategyKey = "none" | "smote" | "undersample";

interface Strategy {
  readonly label: string;
  readonly legit: number;
  readonly fraud: number;
}

export function DatasetExplorer() {
  const [strategy, setStrategy] = useState<StrategyKey>("none");
  const strategies: Record<StrategyKey, Strategy> = {
    none: { label: "None (raw)", legit: 284315, fraud: 492 },
    smote: { label: "SMOTE (oversample)", legit: 284315, fraud: 284315 },
    undersample: { label: "Undersampling", legit: 492, fraud: 492 },
  };
  const s = strategies[strategy];
  const total = s.legit + s.fraud;
  const fraudPct = ((s.fraud / total) * 100).toFixed(2);
  const legitPct = ((s.legit / total) * 100).toFixed(2);
  const W = 380;
  const H = 120;
  const legitW = clamp((s.legit / Math.max(total, 1)) * W, 2, W - 2);
  const fraudW = clamp((s.fraud / Math.max(total, 1)) * W, 2, W);
  const naiveAcc = ((284315 / 284807) * 100).toFixed(2);

  return (
    <Panel
      eyebrow="SIMULATOR"
      title="Dataset explorer, class imbalance"
      meta={`Strategy: ${s.label}`}
      caption="Real-world fraud datasets are severely imbalanced. A naive model predicting 'always legitimate' scores 99.83% accuracy, a useless metric here."
    >
      <div className="sim-row">
        <div className="sim-controls">
          <div className="sim-ctrl">
            <label>Sampling strategy</label>
            {(Object.entries(strategies) as [StrategyKey, Strategy][]).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => setStrategy(k)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  marginBottom: 6,
                  borderRadius: 6,
                  background: strategy === k ? "var(--bg-hi)" : "transparent",
                  border: strategy === k ? "1px solid var(--hair-2)" : "1px solid var(--hair)",
                  color: strategy === k ? "var(--lime-ink)" : "var(--ink-3)",
                  font: "inherit",
                  fontSize: 12.5,
                  cursor: "pointer",
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div
            style={{
              marginTop: 12,
              padding: "12px 14px",
              borderRadius: 8,
              background: "rgba(209,255,58,0.07)",
              border: "1px solid rgba(209,255,58,0.15)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: "var(--lime-ink)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Naive model
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
              Predict all-legit → <strong style={{ color: "var(--ink-1)" }}>{naiveAcc}% accuracy</strong>
              <br />
              Catches <strong style={{ color: "var(--coral-ink)" }}>0 of 492 frauds</strong>
            </div>
          </div>
        </div>
        <div className="plot-wrap" style={{ flex: 1 }}>
          <svg viewBox={`0 0 ${W} ${H + 60}`} style={{ width: "100%" }}>
            <text x="0" y="18" fill="var(--ink-3)" fontSize="10" fontFamily="'JetBrains Mono',monospace">
              Legitimate
            </text>
            <rect x="0" y="24" width={legitW} height="28" rx="4" fill="rgba(100,226,181,0.35)" stroke="rgba(100,226,181,0.6)" strokeWidth="1" style={{ transition: "width 0.5s ease" }} />
            <text x={Math.min(legitW + 4, W - 60)} y="43" fill="var(--mint)" fontSize="10" fontFamily="'JetBrains Mono',monospace">
              {legitPct}%
            </text>
            <text x="0" y="76" fill="var(--ink-3)" fontSize="10" fontFamily="'JetBrains Mono',monospace">
              Fraud
            </text>
            <rect x="0" y="82" width={fraudW} height="28" rx="4" fill="rgba(255,107,128,0.35)" stroke="rgba(255,107,128,0.6)" strokeWidth="1" style={{ transition: "width 0.5s ease" }} />
            <text x={Math.min(fraudW + 4, W - 60)} y="101" fill="#FF6B80" fontSize="10" fontFamily="'JetBrains Mono',monospace">
              {fraudPct}%
            </text>
            <text x="0" y="148" fill="var(--ink-4)" fontSize="9.5" fontFamily="'JetBrains Mono',monospace">
              Legit: {s.legit.toLocaleString()}   Fraud: {s.fraud.toLocaleString()}   Total: {total.toLocaleString()}
            </text>
          </svg>
          {strategy === "smote" && (
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.6 }}>
              <strong style={{ color: "var(--mint-ink)" }}>SMOTE:</strong> Synthetic Minority Oversampling ,
              interpolates new fraud samples between existing ones. Balanced dataset, but adds synthetic data
              risk.
            </div>
          )}
          {strategy === "undersample" && (
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.6 }}>
              <strong style={{ color: "var(--lime-ink)" }}>Undersampling:</strong> Drops majority class to match
              minority. Fast and clean, but discards 99.8% of your legitimate transaction data.
            </div>
          )}
          {strategy === "none" && (
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.6 }}>
              <strong style={{ color: "var(--ink-2)" }}>Raw data:</strong> 0.17% fraud rate. Use PR-AUC, not
              accuracy. Weight classes during training.
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

export default DatasetExplorer;

"use client";

import { useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";

// ─── LeakageDetector ────────────────────────────────
//
// Typed port of Ch03_Clean.js's `LeakageDetector`. Feature pool is
// hardcoded (no RNG in source).

interface FeatureDef {
  readonly name: string;
  readonly leaky: boolean;
  readonly reason: string;
}

const FEATURE_POOL: readonly FeatureDef[] = [
  { name: "user_age", leaky: false, reason: "" },
  { name: "session_duration", leaky: false, reason: "" },
  { name: "plan_type", leaky: false, reason: "" },
  { name: "support_tickets", leaky: false, reason: "" },
  { name: "last_login_days_ago", leaky: false, reason: "" },
  { name: "target_mean_encoded", leaky: true, reason: "Computed using the target label across all rows — the model literally sees the answer." },
  { name: "days_after_churn", leaky: true, reason: "A post-event feature: it's only defined if the user already churned. Instant 100% accuracy, zero prod value." },
  { name: "customer_id_hash", leaky: true, reason: "High-cardinality ID proxy. Model memorises IDs that churn — perfectly fitted to training set, useless on new users." },
  { name: "total_revenue_lifetime", leaky: true, reason: "If computed using future periods, revenue after the churn date leaks into the label window." },
  { name: "email_domain_target", leaky: true, reason: "Target-encoded without out-of-fold splits — each row saw its own label during encoding." },
];

const DEFAULT_SELECTED = ["user_age", "session_duration", "plan_type"];

export function LeakageDetector() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set(DEFAULT_SELECTED));
  const [revealed, setReveal] = useState(false);

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        if (next.size > 1) next.delete(name);
      } else if (next.size < 5) {
        next.add(name);
      }
      return next;
    });
    setReveal(false);
  };

  const selectedFeatures = FEATURE_POOL.filter((f) => selected.has(f.name));
  const leakyCount = selectedFeatures.filter((f) => f.leaky).length;

  return (
    <Panel
      eyebrow="SIMULATION"
      title="Leakage Detector"
      meta={`${selected.size} features selected · ${leakyCount} leaky`}
      caption="Pick up to 5 features for your churn model, then click Audit. Leaky features will be exposed."
    >
      <div className="sim-row" style={{ flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {FEATURE_POOL.map((f) => {
            const isSelected = selected.has(f.name);
            const isLeaky = revealed && isSelected && f.leaky;
            const isSafe = revealed && isSelected && !f.leaky;
            return (
              <button
                key={f.name}
                type="button"
                onClick={() => toggle(f.name)}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 4,
                  border: isLeaky
                    ? "1.5px solid #FF6B80"
                    : isSafe
                      ? "1.5px solid #D1FF3A"
                      : isSelected
                        ? "1.5px solid #4DE2FF"
                        : "1.5px solid #E8E2DA",
                  background: isLeaky ? "#FF6B8018" : isSafe ? "#D1FF3A18" : isSelected ? "#4DE2FF12" : "transparent",
                  color: isLeaky ? "var(--coral-ink)" : isSafe ? "var(--lime-ink)" : isSelected ? "var(--cyan-ink)" : "var(--ink-3)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {f.name}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setReveal(true)}>
            Audit features
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => {
              setSelected(new Set(DEFAULT_SELECTED));
              setReveal(false);
            }}
          >
            Reset
          </button>
          {revealed && (
            <span
              style={{
                fontSize: 12.5,
                color: leakyCount > 0 ? "var(--coral-ink)" : "var(--lime-ink)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {leakyCount > 0 ? `${leakyCount} leaky feature${leakyCount > 1 ? "s" : ""} found` : "All clear"}
            </span>
          )}
        </div>
        {revealed && leakyCount > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {selectedFeatures
              .filter((f) => f.leaky)
              .map((f) => (
                <div
                  key={f.name}
                  style={{
                    background: "#FF6B8012",
                    border: "1px solid #FF6B8040",
                    borderLeft: "3px solid #FF6B80",
                    borderRadius: 6,
                    padding: "10px 14px",
                  }}
                >
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--coral-ink)", fontWeight: 700, marginBottom: 4 }}>
                    {f.name}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#3A3540" }}>{f.reason}</div>
                </div>
              ))}
          </div>
        )}
        {revealed && leakyCount === 0 && (
          <div
            style={{
              background: "#D1FF3A10",
              border: "1px solid #D1FF3A40",
              borderLeft: "3px solid #D1FF3A",
              borderRadius: 6,
              padding: "10px 14px",
              fontSize: 12.5,
              color: "#3A3540",
            }}
          >
            Clean feature set. No leakage detected — none of the selected features encode future
            information or the target directly.
          </div>
        )}
      </div>
    </Panel>
  );
}

export default LeakageDetector;

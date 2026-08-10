"use client";

import { useMemo, useState } from "react";
import { useDataScienceLocale } from "@/components/data-science/locale-context";
import { Panel } from "@/components/data-science/shared/primitives";
import { clamp, inkOf, mulberry32, round } from "@/lib/data-science/sim-kit";

type StrategyKey = "shadow" | "canary" | "bluegreen";

const STRATEGY_INFO: Record<
  StrategyKey,
  { label: string; color: string; desc: string }
> = {
  shadow: {
    label: "Shadow deploy",
    color: "#A78BFA",
    desc: "Eligible requests are mirrored to v2 and its outputs are not used for decisions. Capacity, latency, logging, privacy, and downstream side effects still require controls.",
  },
  canary: {
    label: "Canary deploy",
    color: "#F4C542",
    desc: "A defined subset of eligible live traffic uses v2. Labels may be delayed, and rollback speed depends on state and downstream effects.",
  },
  bluegreen: {
    label: "Blue-green",
    color: "#64E2B5",
    desc: "Two separately deployed environments support a traffic switch. Data, schema, cache, and side-effect compatibility determine whether switching back is sufficient.",
  },
};

const STRATEGY_INFO_DE: Record<
  StrategyKey,
  { label: string; color: string; desc: string }
> = {
  shadow: {
    label: "Shadow-Deployment",
    color: "#A78BFA",
    desc: "Geeignete Anfragen werden an v2 gespiegelt; dessen Ausgaben steuern keine Entscheidungen. Kapazität, Latenz, Protokollierung, Datenschutz und Folgewirkungen benötigen weiterhin Kontrollen.",
  },
  canary: {
    label: "Canary-Deployment",
    color: "#F4C542",
    desc: "Ein definierter Anteil geeigneten Live-Verkehrs verwendet v2. Labels können verzögert sein; die Rollback-Geschwindigkeit hängt von Zustand und Folgewirkungen ab.",
  },
  bluegreen: {
    label: "Blue-Green",
    color: "#64E2B5",
    desc: "Zwei getrennt bereitgestellte Umgebungen erlauben einen Verkehrswechsel. Daten-, Schema-, Cache- und Seiteneffektkompatibilität bestimmen, ob Zurückschalten ausreicht.",
  },
};

interface PredictionRow {
  readonly id: string;
  readonly v1: number;
  readonly v2: number;
  readonly diff: boolean;
}

function makePredictions(
  seed: number,
  shift: number,
): readonly PredictionRow[] {
  const rng = mulberry32(seed);
  return Array.from({ length: 8 }, (_, i) => {
    const base = round(0.3 + rng() * 0.6, 2);
    const v2 = round(clamp(base + shift * (rng() - 0.5) * 0.4, 0.01, 0.99), 2);
    return {
      id: `user_${1000 + i}`,
      v1: base,
      v2,
      diff: Math.abs(base - v2) > 0.15,
    };
  });
}

export function ShadowDeployment() {
  const { locale, text } = useDataScienceLocale();
  const strategyInfo = locale === "de" ? STRATEGY_INFO_DE : STRATEGY_INFO;
  const [trafficPct, setTrafficPct] = useState(0);
  const [strategy, setStrategy] = useState<StrategyKey>("shadow");
  const rows = useMemo(
    () => makePredictions(42, trafficPct / 40),
    [trafficPct],
  );
  const discRate = round(rows.filter((r) => r.diff).length / rows.length, 2);
  const info = strategyInfo[strategy];

  return (
    <Panel
      eyebrow={text("SIMULATION", "SIMULATION")}
      title={text(
        "Shadow & canary deployment",
        "Shadow- und Canary-Deployment",
      )}
      caption={text(
        "The slider changes a synthetic v2 score shift; it does not route requests. The eight fixed rows and the 0.30 discrepancy line are illustrative. Real promotion criteria need representative traffic, outcome guardrails, uncertainty, and a tested abort path.",
        "Der Regler verändert eine synthetische Verschiebung der v2-Scores; er leitet keine Anfragen weiter. Die acht festen Zeilen und die Abweichungsgrenze von 0.30 sind illustrativ. Reale Freigabekriterien benötigen repräsentativen Verkehr, Ergebnisleitplanken, Unsicherheit und einen getesteten Abbruchpfad.",
      )}
    >
      <div
        style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div className="sim-controls" style={{ flex: "0 0 210px" }}>
          <div className="sim-ctrl">
            <label>
              {text("Synthetic v2 shift", "Synthetische v2-Verschiebung")}{" "}
              <span className="mono">{trafficPct}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={trafficPct}
              aria-label={text(
                "Synthetic v2 shift percent",
                "Prozentuale synthetische v2-Verschiebung",
              )}
              onChange={(e) => setTrafficPct(+e.target.value)}
            />
          </div>
          <div
            style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}
          >
            {(
              Object.entries(strategyInfo) as [
                StrategyKey,
                (typeof strategyInfo)[StrategyKey],
              ][]
            ).map(([k, v]) => (
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
            <strong style={{ color: inkOf(info.color) }}>{info.label}:</strong>{" "}
            {info.desc}
          </div>
          <div
            style={{
              marginTop: 8,
              padding: "8px 12px",
              borderRadius: 7,
              background:
                discRate > 0.3
                  ? "rgba(255,107,128,0.1)"
                  : "rgba(100,226,181,0.07)",
              border: `1px solid ${discRate > 0.3 ? "rgba(255,107,128,0.35)" : "rgba(100,226,181,0.25)"}`,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
            }}
          >
            <span
              style={{
                color: discRate > 0.3 ? "var(--coral-ink)" : "var(--good-ink)",
              }}
            >
              {discRate > 0.3 ? "⚠" : "✓"}{" "}
              {text("Discrepancy rate", "Abweichungsrate")}:{" "}
              {(discRate * 100).toFixed(0)}%
            </span>
            <div
              style={{
                color: "var(--ink-3)",
                marginTop: 3,
                fontFamily: "inherit",
                fontSize: 10.5,
              }}
            >
              {discRate > 0.3
                ? text(
                    "High, investigate v2 before promoting.",
                    "Hoch: v2 vor der Freigabe untersuchen.",
                  )
                : text(
                    "Within the demo line; production checks are still required.",
                    "Innerhalb der Demogrenze; Produktionsprüfungen bleiben erforderlich.",
                  )}
            </div>
          </div>
        </div>
        <div
          data-horizontal-scroll
          role="region"
          aria-label={text(
            "Shadow deployment comparison",
            "Vergleich des Shadow-Deployments",
          )}
          tabIndex={0}
          style={{ flex: "1 1 260px", overflowX: "auto" }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 8,
              alignItems: "center",
            }}
          >
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
              v1 {text("reference", "Referenz")}
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
              v2 {text("candidate", "Kandidat")} · {trafficPct}%{" "}
              {text("shift", "Verschiebung")}
            </div>
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 11.5,
            }}
          >
            <thead>
              <tr>
                {[
                  text("Entity ID", "Entitäts-ID"),
                  text("v1 score", "v1-Score"),
                  text("v2 score", "v2-Score"),
                  "Δ > 0.15",
                ].map((h) => (
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
                <tr
                  key={r.id}
                  style={{
                    background: r.diff
                      ? "rgba(255,107,128,0.04)"
                      : "transparent",
                  }}
                >
                  <td
                    style={{
                      padding: "5px 8px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 10.5,
                      color: "var(--ink-2)",
                    }}
                  >
                    {r.id}
                  </td>
                  <td
                    style={{
                      padding: "5px 8px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 10.5,
                      color: "var(--good-ink)",
                    }}
                  >
                    {r.v1}
                  </td>
                  <td
                    style={{
                      padding: "5px 8px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 10.5,
                      color: "var(--violet-ink)",
                    }}
                  >
                    {r.v2}
                  </td>
                  <td
                    style={{
                      padding: "5px 8px",
                      textAlign: "center",
                      fontSize: 12,
                      color: r.diff ? "var(--coral-ink)" : "var(--ink-3)",
                    }}
                  >
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

"use client";

import { useMemo, useState } from "react";
import { useDataScienceLocale } from "@/components/data-science/locale-context";
import { Panel } from "@/components/data-science/shared/primitives";
import {
  clamp,
  mulberry32,
  normCdf,
  randn,
  round,
} from "@/lib/data-science/sim-kit";

// ─── MultipleTesting ───────────────────────────────
//
// Typed port of Ch10_Peeking.js's `MultipleTesting`: FWER/Bonferroni
// slider demo. Seeded with `mulberry32(n * 17 + 3)`, reseeded per `n`.

const BAD = "#C92424";
const MINT = "#0E7250";
const BLUE = "#2257C7";
const AMB = "#935C00";
const INK3 = "#5C5650";
const HAIR = "rgba(20,18,22,0.10)";
const BGHT = "var(--panel-hi)";
const alpha = 0.05;

export function MultipleTesting() {
  const { text } = useDataScienceLocale();
  const [n, setN] = useState(10);

  const fwer = useMemo(() => (1 - Math.pow(1 - alpha, n)) * 100, [n]);
  const bonferroni = useMemo(() => round(alpha / n, 6), [n]);
  const expectedFP = useMemo(() => round(alpha * n, 2), [n]);
  const pValues = useMemo(() => {
    const rng = mulberry32(n * 17 + 3);
    return Array.from({ length: n }, () => {
      const z = randn(rng);
      return 2 * (1 - normCdf(Math.abs(z)));
    });
  }, [n]);
  const nomSig = pValues.filter((p) => p < alpha).length;
  const bonfSig = pValues.filter((p) => p < bonferroni).length;

  return (
    <Panel
      eyebrow={text("SIMULATION", "SIMULATION")}
      title={text("Multiple Testing & FWER", "Mehrfachtests und FWER")}
      caption={text(
        "The formula assumes independent tests with valid uniform null p-values. The dots are one deterministic seeded draw, not an estimate from observed experiments; correlated tests have a different family-wise error rate.",
        "Die Formel setzt unabhängige Tests mit gültigen, unter der Nullhypothese gleichverteilten p-Werten voraus. Die Punkte sind eine deterministische initialisierte Ziehung, keine Schätzung aus beobachteten Experimenten; korrelierte Tests haben eine andere Family-Wise Error Rate.",
      )}
    >
      <div className="ds-responsive-split">
        <div>
          <div
            style={{
              marginBottom: 6,
              fontSize: 11,
              color: INK3,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {text(
              "Number of hypotheses tested",
              "Anzahl getesteter Hypothesen",
            )}
            : <strong style={{ color: "var(--ink-1)" }}>{n}</strong>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            value={n}
            onChange={(e) => setN(+e.target.value)}
            aria-label={text(
              "Number of hypotheses tested",
              "Anzahl getesteter Hypothesen",
            )}
            style={{ width: "100%", marginBottom: 16 }}
          />
          <div className="ds-responsive-metrics" style={{ marginBottom: 16 }}>
            {[
              {
                label: "FWER",
                value: `${round(fwer, 1)}%`,
                sub: "1−(1−α)ⁿ",
                color: BAD,
              },
              {
                label: "Bonferroni α",
                value: bonferroni,
                sub: "α / n",
                color: BLUE,
              },
              {
                label: text("Expected FP", "Erwartete FP"),
                value: expectedFP,
                sub: "α × n",
                color: AMB,
              },
              {
                label: text("Nominal α", "Nominales α"),
                value: "5%",
                sub: text("per test", "pro Test"),
                color: MINT,
              },
            ].map(({ label, value, sub, color }) => (
              <div
                key={label}
                style={{
                  padding: "10px 12px",
                  background: BGHT,
                  borderRadius: 8,
                  border: `1px solid ${HAIR}`,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontFamily: "var(--font-serif,serif)",
                    color,
                    marginTop: 2,
                  }}
                >
                  {value}
                </div>
                <div style={{ fontSize: 11, color: INK3 }}>{sub}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(245,158,11,0.08)",
              borderRadius: 8,
              fontSize: 12.5,
              color: AMB,
              lineHeight: 1.6,
            }}
          >
            {text("Out of", "Bei")} <strong>{n}</strong>{" "}
            {text("tests, expect", "Tests sind")} <strong>~{expectedFP}</strong>{" "}
            {text(
              "false positives by chance at α=0.05.",
              "zufällige falsch-positive Ergebnisse bei α=0.05 zu erwarten.",
            )}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              color: INK3,
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {text(
              "Simulated p-values (all null)",
              "Simulierte p-Werte (alle Nullhypothesen gelten)",
            )}
          </div>
          <svg
            width="100%"
            viewBox={`0 0 220 ${Math.max(n * 14 + 30, 60)}`}
            style={{ overflow: "visible" }}
          >
            <line
              x1={alpha * 200}
              y1={0}
              x2={alpha * 200}
              y2={n * 14 + 10}
              stroke={MINT}
              strokeWidth={1}
              strokeDasharray="3,2"
              opacity={0.7}
            />
            <line
              x1={Math.min(bonferroni * 200, 200)}
              y1={0}
              x2={Math.min(bonferroni * 200, 200)}
              y2={n * 14 + 10}
              stroke={BLUE}
              strokeWidth={1}
              strokeDasharray="3,2"
              opacity={0.7}
            />
            <text x={alpha * 200 + 2} y={10} fontSize={8} fill={MINT}>
              α=0.05
            </text>
            <text x={0} y={n * 14 + 26} fontSize={8} fill={MINT}>
              {nomSig} {text("sig (uncorrected)", "sign. (unkorrigiert)")}
            </text>
            <text x={100} y={n * 14 + 26} fontSize={8} fill={BLUE}>
              {bonfSig} {text("sig (Bonferroni)", "sign. (Bonferroni)")}
            </text>
            {pValues.map((p, i) => {
              const x = clamp(p * 200, 1, 199);
              const y = i * 14 + 20;
              const sigNom = p < alpha;
              const sigBonf = p < bonferroni;
              const color = sigBonf ? BLUE : sigNom ? BAD : INK3;
              return (
                <g key={i}>
                  <rect
                    x={0}
                    y={y - 5}
                    width={x}
                    height={8}
                    rx={2}
                    fill={color}
                    opacity={sigNom ? 0.4 : 0.15}
                  />
                  <circle cx={x} cy={y} r={3} fill={color} />
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </Panel>
  );
}

export default MultipleTesting;

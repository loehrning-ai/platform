"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { mulberry32, randn } from "@/lib/data-science/sim-kit";
import { useDataScienceLocale } from "../locale-context";

// ─── OutlierDetector ────────────────────────────────
//
// Typed port of Ch02_Explore.js's `OutlierDetector`. Seeded with
// `mulberry32(99)` — never reseed or swap for `Math.random()`.

type Method = "zscore" | "iqr" | "isoforest";

interface Point {
  readonly x: number;
  readonly y: number;
  readonly isOutlier: boolean;
}

const METHODS: readonly {
  readonly id: Method;
  readonly label: string;
  readonly desc: string;
  readonly descDe: string;
}[] = [
  {
    id: "zscore",
    label: "Z-score",
    desc: "Flag points more than 3 standard deviations from the mean. Fast and interpretable, but assumes normality.",
    descDe:
      "Markiert Punkte, die mehr als 3 Standardabweichungen vom Mittelwert entfernt sind. Das Verfahren ist schnell und nachvollziehbar, setzt aber Normalverteilung voraus.",
  },
  {
    id: "iqr",
    label: "IQR",
    desc: "Flag points beyond 1.5 × IQR from the quartiles (Tukey fences). Robust to skew; no normality assumption.",
    descDe:
      "Markiert Punkte jenseits von 1.5 × IQR ab den Quartilen (Tukey-Grenzen). Das Verfahren ist robust gegen Schiefe und setzt keine Normalverteilung voraus.",
  },
  {
    id: "isoforest",
    label: "Isolation Forest",
    desc: "Isolates anomalies by random partitioning. Points that require fewer splits are anomalies. Works in high dimensions.",
    descDe:
      "Isoliert Anomalien durch zufällige Partitionierung. Punkte mit weniger erforderlichen Teilungen gelten als anomal. Das Verfahren arbeitet auch in hohen Dimensionen.",
  },
];

export function OutlierDetector() {
  const { locale, text } = useDataScienceLocale();
  const [method, setMethod] = useState<Method>("zscore");
  const W = 380;
  const H = 260;
  const PADL = 28;
  const PADR = 12;
  const PADT = 16;
  const PADB = 28;
  const plotW = W - PADL - PADR;
  const plotH = H - PADT - PADB;

  const { points, meanX, sdX, meanY, sdY, q1X, q3X, q1Y, q3Y } = useMemo(() => {
    const rng = mulberry32(99);
    const rawX: number[] = [];
    const rawY: number[] = [];
    for (let i = 0; i < 44; i++) {
      rawX.push(randn(rng) * 1);
      rawY.push(randn(rng) * 1);
    }
    const outlierCoords: readonly (readonly [number, number])[] = [
      [4.1, 0.3],
      [-3.8, 0.5],
      [0.2, 4.2],
      [3.5, 3.5],
      [-3, -3.2],
      [0.5, -4.5],
    ];
    for (const [ox, oy] of outlierCoords) {
      rawX.push(ox);
      rawY.push(oy);
    }
    const meanX2 = rawX.reduce((s, v) => s + v, 0) / rawX.length;
    const meanY2 = rawY.reduce((s, v) => s + v, 0) / rawY.length;
    const sdX2 = Math.sqrt(
      rawX.reduce((s, v) => s + (v - meanX2) ** 2, 0) / rawX.length,
    );
    const sdY2 = Math.sqrt(
      rawY.reduce((s, v) => s + (v - meanY2) ** 2, 0) / rawY.length,
    );
    const sortedX = [...rawX].sort((a, b) => a - b);
    const sortedY = [...rawY].sort((a, b) => a - b);
    const q1X2 = sortedX[Math.floor(sortedX.length * 0.25)] ?? 0;
    const q3X2 = sortedX[Math.floor(sortedX.length * 0.75)] ?? 0;
    const q1Y2 = sortedY[Math.floor(sortedY.length * 0.25)] ?? 0;
    const q3Y2 = sortedY[Math.floor(sortedY.length * 0.75)] ?? 0;
    const points2: Point[] = rawX.map((x, i) => ({
      x,
      y: rawY[i] ?? 0,
      isOutlier: i >= 44,
    }));
    return {
      points: points2,
      meanX: meanX2,
      sdX: sdX2,
      meanY: meanY2,
      sdY: sdY2,
      q1X: q1X2,
      q3X: q3X2,
      q1Y: q1Y2,
      q3Y: q3Y2,
    };
  }, []);

  const flagged = useMemo(() => {
    return points.map((p) => {
      if (method === "zscore") {
        const zx = Math.abs((p.x - meanX) / sdX);
        const zy = Math.abs((p.y - meanY) / sdY);
        return zx > 3 || zy > 3;
      }
      if (method === "iqr") {
        const iqrX = q3X - q1X;
        const iqrY = q3Y - q1Y;
        const outX = p.x < q1X - 1.5 * iqrX || p.x > q3X + 1.5 * iqrX;
        const outY = p.y < q1Y - 1.5 * iqrY || p.y > q3Y + 1.5 * iqrY;
        return outX || outY;
      }
      const dist = Math.sqrt((p.x - meanX) ** 2 + (p.y - meanY) ** 2);
      return dist > 3.2;
    });
  }, [method, points, meanX, sdX, meanY, sdY, q1X, q3X, q1Y, q3Y]);

  const numFlagged = flagged.filter(Boolean).length;
  const xMin = -5.5;
  const xMax = 5.5;
  const yMin = -5.5;
  const yMax = 5.5;
  const px = (v: number) => PADL + ((v - xMin) / (xMax - xMin)) * plotW;
  const py = (v: number) => PADT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const activeMethod = METHODS.find((m) => m.id === method);
  const activeDesc =
    locale === "de" ? (activeMethod?.descDe ?? "") : (activeMethod?.desc ?? "");

  return (
    <Panel
      eyebrow={text("SIMULATOR", "SIMULATION")}
      title={text("Outlier Detector", "Ausreißer erkennen")}
      meta={text(
        "toggle method → see highlights",
        "Verfahren wechseln → Markierungen vergleichen",
      )}
      caption={text(
        `Flagged: ${numFlagged} / ${points.length} points.  ${activeDesc}`,
        `Markiert: ${numFlagged} / ${points.length} Punkte. ${activeDesc}`,
      )}
    >
      <div className="sim-row">
        <div className="sim-controls">
          <div className="sim-ctrl">
            <label>{text("Method", "Verfahren")}</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`btn btn-sm${method === m.id ? " active" : ""}`}
                  onClick={() => setMethod(m.id)}
                  style={{ textAlign: "left" }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="sim-stats" style={{ marginTop: 12 }}>
            <div>
              <div className="k">{text("Flagged", "Markiert")}</div>
              <div className="v mono" style={{ color: "var(--coral-ink)" }}>
                {numFlagged}
              </div>
            </div>
            <div>
              <div className="k">{text("Clean", "Unauffällig")}</div>
              <div className="v mono" style={{ color: "var(--good-ink)" }}>
                {points.length - numFlagged}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#4ADE80",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 12, opacity: 0.6 }}>
                {text("inlier", "unauffälliger Punkt")}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#F87171",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 12, opacity: 0.6 }}>
                {text("flagged outlier", "markierter Ausreißer")}
              </span>
            </div>
          </div>
        </div>
        <div className="plot-wrap">
          <svg viewBox={`0 0 ${W} ${H}`}>
            <line
              x1={px(0)}
              y1={PADT}
              x2={px(0)}
              y2={PADT + plotH}
              stroke="rgba(244,242,236,0.08)"
              strokeWidth="1"
            />
            <line
              x1={PADL}
              y1={py(0)}
              x2={PADL + plotW}
              y2={py(0)}
              stroke="rgba(244,242,236,0.08)"
              strokeWidth="1"
            />
            {method === "zscore" && (
              <ellipse
                cx={px(meanX)}
                cy={py(meanY)}
                rx={((3 * sdX) / (xMax - xMin)) * plotW}
                ry={((3 * sdY) / (yMax - yMin)) * plotH}
                fill="none"
                stroke="#A78BFA"
                strokeWidth="1"
                strokeDasharray="5 3"
                opacity="0.4"
              />
            )}
            {method === "iqr" &&
              (() => {
                const iqrX = q3X - q1X;
                const iqrY = q3Y - q1Y;
                const lx = px(q1X - 1.5 * iqrX);
                const rx = px(q3X + 1.5 * iqrX);
                const ty = py(q3Y + 1.5 * iqrY);
                const by = py(q1Y - 1.5 * iqrY);
                return (
                  <rect
                    x={lx}
                    y={ty}
                    width={rx - lx}
                    height={by - ty}
                    fill="none"
                    stroke="#FBBF24"
                    strokeWidth="1"
                    strokeDasharray="5 3"
                    opacity="0.4"
                  />
                );
              })()}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={px(p.x)}
                cy={py(p.y)}
                r={flagged[i] ? 5 : 3.5}
                fill={flagged[i] ? "#F87171" : "#4ADE80"}
                opacity={flagged[i] ? 0.95 : 0.65}
                style={{ transition: "fill 0.3s, r 0.3s" }}
              />
            ))}
            <text
              x={PADL + plotW / 2}
              y={H - 4}
              textAnchor="middle"
              fill="rgba(244,242,236,0.3)"
              fontSize="8"
            >
              {text("Feature X", "Merkmal X")}
            </text>
            <text
              x={8}
              y={PADT + plotH / 2}
              textAnchor="middle"
              fill="rgba(244,242,236,0.3)"
              fontSize="8"
              transform={`rotate(-90,8,${PADT + plotH / 2})`}
            >
              {text("Feature Y", "Merkmal Y")}
            </text>
          </svg>
        </div>
      </div>
    </Panel>
  );
}

export default OutlierDetector;

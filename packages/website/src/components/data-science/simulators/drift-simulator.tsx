"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { clamp, mulberry32, randn, round } from "@/lib/data-science/sim-kit";

interface SeriesPoint {
  readonly day: number;
  readonly acc: number;
  readonly psi: number;
  readonly boundary: number;
}

function computeSeries(driftIntensity: number, seed = 7): readonly SeriesPoint[] {
  const rng = mulberry32(seed);
  return Array.from({ length: 60 }, (_, i) => {
    const stable = i < 30;
    const driftFactor = stable ? 0 : (i - 30) * driftIntensity * 0.018;
    const conceptShift = stable ? 0 : (i - 30) * driftIntensity * 8e-3;
    const acc = clamp(0.876 - driftFactor + 0.012 * randn(rng), 0.5, 0.98);
    const psi = clamp(
      stable
        ? 0.02 + 5e-3 * Math.abs(randn(rng))
        : 0.02 + (i - 30) * driftIntensity * 0.012 + 0.01 * Math.abs(randn(rng)),
      0,
      0.8,
    );
    const boundary = stable ? 0.5 : clamp(0.5 + conceptShift + 0.02 * randn(rng), 0.3, 0.7);
    return { day: i + 1, acc, psi, boundary };
  });
}

type SeriesKey = "acc" | "psi";

interface LineChartProps {
  readonly series: readonly SeriesPoint[];
  readonly yKey: SeriesKey;
  readonly yMin: number;
  readonly yMax: number;
  readonly width?: number;
  readonly height?: number;
  readonly color: string;
  readonly thresholdVal?: number;
  readonly thresholdLabel?: string;
  readonly cursorDay?: number;
  readonly label: string;
}

function LineChart({
  series,
  yKey,
  yMin,
  yMax,
  width = 420,
  height = 130,
  color,
  thresholdVal,
  thresholdLabel,
  cursorDay,
  label,
}: LineChartProps) {
  const pts = series.map((p, i) => {
    const x = (i / (series.length - 1)) * width;
    const y = height - ((p[yKey] - yMin) / (yMax - yMin)) * height;
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const thY = thresholdVal != null ? height - ((thresholdVal - yMin) / (yMax - yMin)) * height : null;

  return (
    <svg viewBox={`0 0 ${width} ${height + 20}`} style={{ width: "100%" }}>
      {thY != null && (
        <>
          <line x1="0" y1={thY} x2={width} y2={thY} stroke="rgba(255,107,128,0.45)" strokeDasharray="5 4" />
          <text x="4" y={thY - 3} fill="#FF6B80" fontSize="8.5" fontFamily="'JetBrains Mono',monospace">
            {thresholdLabel} · {thresholdVal}
          </text>
        </>
      )}
      <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke="rgba(244,242,236,0.08)" strokeDasharray="3 3" />
      <text x={width / 2 + 3} y="10" fill="#8A8680" fontSize="8" fontFamily="'JetBrains Mono',monospace">
        day 30 · drift start
      </text>
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.8" opacity="0.85" />
      {series.map((p, i) => {
        const x = (i / (series.length - 1)) * width;
        const y = height - ((p[yKey] - yMin) / (yMax - yMin)) * height;
        const alarm = thresholdVal != null && (yKey === "psi" ? p[yKey] > thresholdVal : p[yKey] < thresholdVal);
        if (cursorDay == null || (i !== cursorDay - 1 && !alarm)) return null;
        return <circle key={i} cx={x} cy={y} r={i === cursorDay - 1 ? 4 : 2.5} fill={alarm ? "#FF6B80" : "#D1FF3A"} />;
      })}
      {cursorDay != null &&
        (() => {
          const idx = cursorDay - 1;
          if (idx < 0 || idx >= series.length) return null;
          const point = series[idx];
          if (!point) return null;
          const x = (idx / (series.length - 1)) * width;
          const y = height - ((point[yKey] - yMin) / (yMax - yMin)) * height;
          return (
            <>
              <line x1={x} y1="0" x2={x} y2={height} stroke="rgba(244,242,236,0.2)" strokeWidth="1" />
              <text x={x + 4} y={y - 5} fill="rgba(244,242,236,0.7)" fontSize="8.5" fontFamily="'JetBrains Mono',monospace">
                {round(point[yKey], 3)}
              </text>
            </>
          );
        })()}
      <text x="4" y={height + 14} fill="#8A8680" fontSize="8.5" fontFamily="'JetBrains Mono',monospace">
        {label}
      </text>
    </svg>
  );
}

export function DriftSimulator() {
  const [running, setRunning] = useState(false);
  const [day, setDay] = useState(1);
  const [driftIntensity, setDriftIntensity] = useState(1);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const series = useMemo(() => computeSeries(driftIntensity), [driftIntensity]);
  const current = series[Math.min(day - 1, series.length - 1)]!;
  const psiAlarm = current.psi > 0.2;
  const accAlarm = current.acc < 0.82;

  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(() => {
        setDay((d) => {
          if (d >= 60) {
            setRunning(false);
            return 60;
          }
          return d + 1;
        });
      }, 120);
    } else {
      clearInterval(tickRef.current ?? undefined);
    }
    return () => clearInterval(tickRef.current ?? undefined);
  }, [running]);

  const handleStart = () => {
    if (day >= 60) setDay(1);
    setRunning(true);
  };

  return (
    <Panel
      eyebrow="SIMULATION"
      title="Drift simulator"
      meta={`Day ${day} / 60`}
      caption="Days 1–30: distribution is stable. Days 31–60: data drift intensifies. PSI > 0.2 triggers an alarm. Watch accuracy and PSI decay together."
    >
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 12 }}>
        <div className="sim-controls" style={{ flex: "0 0 200px" }}>
          <div className="sim-ctrl">
            <label>
              Drift intensity <span className="mono">{driftIntensity.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={driftIntensity}
              aria-label="Drift intensity"
              onChange={(e) => {
                setDriftIntensity(+e.target.value);
                setDay(1);
                setRunning(false);
              }}
            />
          </div>
          <div className="sim-ctrl" style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button type="button" className="btn" onClick={handleStart} disabled={running}>
              {day >= 60 ? "↺ Restart" : "▶ Start"}
            </button>
            <button type="button" className="btn" onClick={() => setRunning(false)} disabled={!running}>
              ⏸ Pause
            </button>
          </div>
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 7,
              background: psiAlarm ? "rgba(255,107,128,0.1)" : "rgba(100,226,181,0.07)",
              border: `1px solid ${psiAlarm ? "rgba(255,107,128,0.35)" : "rgba(100,226,181,0.25)"}`,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: psiAlarm ? "var(--coral-ink)" : "var(--good-ink)",
              }}
            >
              {psiAlarm ? "⚠ PSI ALARM" : "✓ PSI OK"}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginTop: 5 }}>
              PSI = {round(current.psi, 3)} {psiAlarm ? "> 0.2 → retrain!" : "≤ 0.2 → stable"}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginTop: 3 }}>
              Accuracy = {round(current.acc, 3)} {accAlarm ? "⬇ degraded" : ""}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginTop: 3 }}>
              Decision boundary = {round(current.boundary, 3)}
            </div>
          </div>
          <div
            style={{
              marginTop: 10,
              padding: "8px 12px",
              borderRadius: 7,
              background: "rgba(244,242,236,0.04)",
              border: "1px solid rgba(244,242,236,0.08)",
              fontSize: 11,
              color: "var(--ink-3)",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: "var(--ink-2)" }}>PSI</strong> = Σ (actual% − expected%) × ln(actual%/expected%).
            Values &lt;0.1 = no shift. 0.1–0.2 = slight. &gt;0.2 = retrain.
          </div>
        </div>
        <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 8 }}>
          <LineChart
            series={series}
            yKey="acc"
            yMin={0.6}
            yMax={1}
            color="#D1FF3A"
            thresholdVal={0.82}
            thresholdLabel="alert"
            cursorDay={day}
            label="Model accuracy (AUC) over 60 days"
          />
          <LineChart
            series={series}
            yKey="psi"
            yMin={0}
            yMax={0.6}
            color="#7B8CDE"
            thresholdVal={0.2}
            thresholdLabel="PSI alarm"
            cursorDay={day}
            label="PSI (Population Stability Index)"
          />
        </div>
      </div>
    </Panel>
  );
}

export default DriftSimulator;

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDataScienceLocale } from "@/components/data-science/locale-context";
import { Panel } from "@/components/data-science/shared/primitives";
import { clamp, mulberry32, randn, round } from "@/lib/data-science/sim-kit";

interface SeriesPoint {
  readonly day: number;
  readonly acc: number;
  readonly psi: number;
  readonly boundary: number;
}

function computeSeries(
  driftIntensity: number,
  seed = 7,
): readonly SeriesPoint[] {
  const rng = mulberry32(seed);
  return Array.from({ length: 60 }, (_, i) => {
    const stable = i < 30;
    const driftFactor = stable ? 0 : (i - 30) * driftIntensity * 0.018;
    const conceptShift = stable ? 0 : (i - 30) * driftIntensity * 8e-3;
    const acc = clamp(0.876 - driftFactor + 0.012 * randn(rng), 0.5, 0.98);
    const psi = clamp(
      stable
        ? 0.02 + 5e-3 * Math.abs(randn(rng))
        : 0.02 +
            (i - 30) * driftIntensity * 0.012 +
            0.01 * Math.abs(randn(rng)),
      0,
      0.8,
    );
    const boundary = stable
      ? 0.5
      : clamp(0.5 + conceptShift + 0.02 * randn(rng), 0.3, 0.7);
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
  readonly driftStartLabel: string;
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
  driftStartLabel,
}: LineChartProps) {
  const pts = series.map((p, i) => {
    const x = (i / (series.length - 1)) * width;
    const y = height - ((p[yKey] - yMin) / (yMax - yMin)) * height;
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const thY =
    thresholdVal != null
      ? height - ((thresholdVal - yMin) / (yMax - yMin)) * height
      : null;

  return (
    <svg viewBox={`0 0 ${width} ${height + 20}`} style={{ width: "100%" }}>
      {thY != null && (
        <>
          <line
            x1="0"
            y1={thY}
            x2={width}
            y2={thY}
            stroke="rgba(255,107,128,0.45)"
            strokeDasharray="5 4"
          />
          <text
            x="4"
            y={thY - 3}
            fill="#FF6B80"
            fontSize="8.5"
            fontFamily="'JetBrains Mono',monospace"
          >
            {thresholdLabel} · {thresholdVal}
          </text>
        </>
      )}
      <line
        x1={width / 2}
        y1="0"
        x2={width / 2}
        y2={height}
        stroke="rgba(244,242,236,0.08)"
        strokeDasharray="3 3"
      />
      <text
        x={width / 2 + 3}
        y="10"
        fill="#8A8680"
        fontSize="8"
        fontFamily="'JetBrains Mono',monospace"
      >
        {driftStartLabel}
      </text>
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        opacity="0.85"
      />
      {series.map((p, i) => {
        const x = (i / (series.length - 1)) * width;
        const y = height - ((p[yKey] - yMin) / (yMax - yMin)) * height;
        const alarm =
          thresholdVal != null &&
          (yKey === "psi" ? p[yKey] > thresholdVal : p[yKey] < thresholdVal);
        if (cursorDay == null || (i !== cursorDay - 1 && !alarm)) return null;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i === cursorDay - 1 ? 4 : 2.5}
            fill={alarm ? "#FF6B80" : "#D1FF3A"}
          />
        );
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
              <line
                x1={x}
                y1="0"
                x2={x}
                y2={height}
                stroke="rgba(244,242,236,0.2)"
                strokeWidth="1"
              />
              <text
                x={x + 4}
                y={y - 5}
                fill="rgba(244,242,236,0.7)"
                fontSize="8.5"
                fontFamily="'JetBrains Mono',monospace"
              >
                {round(point[yKey], 3)}
              </text>
            </>
          );
        })()}
      <text
        x="4"
        y={height + 14}
        fill="#8A8680"
        fontSize="8.5"
        fontFamily="'JetBrains Mono',monospace"
      >
        {label}
      </text>
    </svg>
  );
}

export function DriftSimulator() {
  const { text } = useDataScienceLocale();
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
      eyebrow={text("SIMULATION", "SIMULATION")}
      title={text("Drift simulator", "Drift-Simulator")}
      meta={`${text("Day", "Tag")} ${day} / 60`}
      caption={text(
        "Constructed scenario: days 1–30 use a fixed baseline and days 31–60 add deterministic input and concept shift. The 0.2 PSI line is a demo threshold. Production PSI depends on bins and sample size, does not measure model quality, and must be calibrated with outcome evidence.",
        "Konstruiertes Szenario: Tage 1–30 verwenden eine feste Basis; Tage 31–60 ergänzen deterministischen Eingabe- und Konzeptdrift. Die PSI-Linie bei 0.2 ist eine Demogrenze. PSI hängt in Produktion von Buckets und Stichprobengröße ab, misst keine Modellgüte und muss mit Ergebnisevidenz kalibriert werden.",
      )}
    >
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div className="sim-controls" style={{ flex: "0 0 200px" }}>
          <div className="sim-ctrl">
            <label>
              {text("Drift intensity", "Drift-Intensität")}{" "}
              <span className="mono">{driftIntensity.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={driftIntensity}
              aria-label={text("Drift intensity", "Drift-Intensität")}
              onChange={(e) => {
                setDriftIntensity(+e.target.value);
                setDay(1);
                setRunning(false);
              }}
            />
          </div>
          <div
            className="sim-ctrl"
            style={{ display: "flex", gap: 8, marginTop: 4 }}
          >
            <button
              type="button"
              className="btn"
              onClick={handleStart}
              disabled={running}
            >
              {day >= 60
                ? text("↺ Restart", "↺ Neu starten")
                : text("▶ Start", "▶ Starten")}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setRunning(false)}
              disabled={!running}
            >
              {text("⏸ Pause", "⏸ Pausieren")}
            </button>
          </div>
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 7,
              background: psiAlarm
                ? "rgba(255,107,128,0.1)"
                : "rgba(100,226,181,0.07)",
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
              {psiAlarm
                ? text("DEMO LINE CROSSED", "DEMOGRENZE ÜBERSCHRITTEN")
                : text("WITHIN DEMO LINE", "INNERHALB DER DEMOGRENZE")}
            </div>
            <div
              style={{ fontSize: 11.5, color: "var(--ink-2)", marginTop: 5 }}
            >
              PSI = {round(current.psi, 3)}{" "}
              {psiAlarm
                ? text("> 0.2 → investigate", "> 0.2 → untersuchen")
                : text("≤ 0.2 → no demo alert", "≤ 0.2 → kein Demoalarm")}
            </div>
            <div
              style={{ fontSize: 11.5, color: "var(--ink-2)", marginTop: 3 }}
            >
              {text("Accuracy", "Genauigkeit")} = {round(current.acc, 3)}{" "}
              {accAlarm ? text("⬇ degraded", "⬇ verschlechtert") : ""}
            </div>
            <div
              style={{ fontSize: 11.5, color: "var(--ink-2)", marginTop: 3 }}
            >
              {text("Decision boundary", "Entscheidungsgrenze")} ={" "}
              {round(current.boundary, 3)}
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
            <strong style={{ color: "var(--ink-2)" }}>PSI</strong> = Σ (actual%
            − expected%) × ln(actual%/expected%).{" "}
            {text(
              "This chart marks 0.2 for demonstration only. Choose bins, reference window, sample checks, and an action threshold from the deployed system.",
              "Dieses Diagramm markiert 0.2 nur zur Veranschaulichung. Buckets, Referenzfenster, Stichprobenprüfungen und eine Aktionsgrenze müssen aus dem eingesetzten System abgeleitet werden.",
            )}
          </div>
        </div>
        <div
          style={{
            flex: "1 1 260px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <LineChart
            series={series}
            yKey="acc"
            yMin={0.6}
            yMax={1}
            color="#D1FF3A"
            thresholdVal={0.82}
            thresholdLabel="alert"
            cursorDay={day}
            label={text(
              "Model accuracy (AUC) over 60 days",
              "Modellgenauigkeit (AUC) über 60 Tage",
            )}
            driftStartLabel={text(
              "day 30 · drift start",
              "Tag 30 · Drift beginnt",
            )}
          />
          <LineChart
            series={series}
            yKey="psi"
            yMin={0}
            yMax={0.6}
            color="#7B8CDE"
            thresholdVal={0.2}
            thresholdLabel={text("demo line", "Demogrenze")}
            cursorDay={day}
            label="PSI (Population Stability Index)"
            driftStartLabel={text(
              "day 30 · drift start",
              "Tag 30 · Drift beginnt",
            )}
          />
        </div>
      </div>
    </Panel>
  );
}

export default DriftSimulator;

"use client";

import { m } from "framer-motion";

export interface RadarDimension {
  readonly nameDe: string;
  readonly rawScore: number;
}

interface RadarChartProps {
  dimensions: readonly RadarDimension[];
}

const SIZE = 340;
const CENTER = SIZE / 2;
const RADIUS = 120;
const LEVELS = 4;

function polarToCartesian(angle: number, radius: number): [number, number] {
  // Start from top (-90deg), go clockwise
  const rad = ((angle - 90) * Math.PI) / 180;
  return [CENTER + radius * Math.cos(rad), CENTER + radius * Math.sin(rad)];
}

export function RadarChart({ dimensions }: RadarChartProps) {
  const n = dimensions.length;
  const angleStep = 360 / n;

  // Build grid polygons for each level
  const gridPolygons = Array.from({ length: LEVELS }, (_, level) => {
    const r = (RADIUS / LEVELS) * (level + 1);
    const points = Array.from({ length: n }, (_, i) => {
      const [x, y] = polarToCartesian(i * angleStep, r);
      return `${x},${y}`;
    }).join(" ");
    return points;
  });

  // Build data polygon — normalize rawScore 4-16 to 0-RADIUS
  const dataPoints = dimensions.map((d, i) => {
    const normalized = (d.rawScore - 4) / 12; // 0 to 1
    const r = normalized * RADIUS;
    return polarToCartesian(i * angleStep, r);
  });

  const dataPath = dataPoints.map(([x, y]) => `${x},${y}`).join(" ");

  // Labels
  const labels = dimensions.map((d, i) => {
    const [x, y] = polarToCartesian(i * angleStep, RADIUS + 28);
    return { x, y, text: d.nameDe, score: d.rawScore };
  });

  // Build a screen-reader summary so AT users get the same data as sighted
  // users without needing to interpret the rendered polygon.
  const ariaSummary = dimensions
    .map((d) => `${d.nameDe} ${d.rawScore} von 16`)
    .join(", ");

  return (
    <div className="flex items-center justify-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-[280px] w-[280px] sm:h-[320px] sm:w-[320px]"
        role="img"
        aria-labelledby="radar-chart-title radar-chart-desc"
      >
        <title id="radar-chart-title">KI-Readiness Score-Radar</title>
        <desc id="radar-chart-desc">
          5-Achsen-Radardiagramm mit den KI-Readiness-Scores: {ariaSummary}.
        </desc>
        {/* Grid lines */}
        {gridPolygons.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-border"
          />
        ))}

        {/* Axis lines */}
        {Array.from({ length: n }, (_, i) => {
          const [x, y] = polarToCartesian(i * angleStep, RADIUS);
          return (
            <line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeWidth={0.5}
              className="text-border"
            />
          );
        })}

        {/* Data polygon */}
        <m.polygon
          points={dataPath}
          fill="rgba(196, 67, 26, 0.15)"
          stroke="#C4431A"
          strokeWidth={2}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
        />

        {/* Data points */}
        {dataPoints.map(([x, y], i) => (
          <m.circle
            key={i}
            cx={x}
            cy={y}
            r={4}
            fill="#C4431A"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          />
        ))}

        {/* Labels */}
        {labels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-muted-foreground text-[9px] sm:text-[10px]"
          >
            <tspan x={label.x} dy="-0.5em">
              {label.text}
            </tspan>
            <tspan
              x={label.x}
              dy="1.2em"
              className="fill-foreground font-semibold"
            >
              {label.score}/16
            </tspan>
          </text>
        ))}
      </svg>
    </div>
  );
}

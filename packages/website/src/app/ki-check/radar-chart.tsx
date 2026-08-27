"use client";

import { m, useReducedMotion } from "framer-motion";
import type { DimensionResult } from "@/lib/ki-check/types";

/*
 * Five-axis literacy radar, hand-drawn as SVG (no chart dependency). The shape
 * gives an at-a-glance profile; the exact per-dimension numbers live in the
 * bars below, so the chart itself is decorative (aria-hidden).
 */

const CX = 130;
const CY = 130;
const R = 94;
const RINGS = [0.25, 0.5, 0.75, 1] as const;

function pointOnAxis(index: number, count: number, radius: number) {
  const angle = (-90 + (index * 360) / count) * (Math.PI / 180);
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  };
}

function polygonPoints(radii: readonly number[], count: number): string {
  return radii
    .map((r, i) => {
      const p = pointOnAxis(i, count, r);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");
}

export function RadarChart({
  dimensions,
}: {
  readonly dimensions: readonly DimensionResult[];
}) {
  const prefersReducedMotion = useReducedMotion();
  const count = dimensions.length;
  const dataRadii = dimensions.map((d) => (d.normalizedScore / 100) * R);

  return (
    <svg
      viewBox="0 0 260 260"
      className="h-auto w-full max-w-[280px]"
      aria-hidden="true"
      data-competency-shape
    >
      {/* Grid rings */}
      {RINGS.map((ring) => (
        <polygon
          key={ring}
          points={polygonPoints(
            dimensions.map(() => R * ring),
            count,
          )}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={1}
        />
      ))}

      {/* Axis spokes */}
      {dimensions.map((dim, i) => {
        const outer = pointOnAxis(i, count, R);
        return (
          <line
            key={dim.id}
            x1={CX}
            y1={CY}
            x2={outer.x}
            y2={outer.y}
            stroke="var(--color-border)"
            strokeWidth={1}
          />
        );
      })}

      {/* Data polygon */}
      <m.polygon
        points={polygonPoints(dataRadii, count)}
        fill="var(--color-brand-orange)"
        fillOpacity={0.16}
        stroke="var(--color-brand-orange)"
        strokeWidth={2}
        strokeLinejoin="round"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
      />

      {/* Vertex dots */}
      {dimensions.map((dim, i) => {
        const p = pointOnAxis(i, count, (dim.normalizedScore / 100) * R);
        return (
          <circle
            key={dim.id}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill="var(--color-brand-orange)"
          />
        );
      })}
    </svg>
  );
}

/** HTML owns every label so SVG viewBox clipping can never remove meaning. */
export function CompetencyLegend({
  dimensions,
  label,
}: {
  readonly dimensions: readonly DimensionResult[];
  readonly label: string;
}) {
  return (
    <ul aria-label={label} className="min-w-0 border-y border-border/70">
      {dimensions.map((dimension) => (
        <li
          key={dimension.id}
          className="grid min-w-0 grid-cols-[0.5rem_minmax(0,1fr)_auto] items-center gap-2 border-b border-border/70 py-2 last:border-b-0"
          data-competency-legend-item
        >
          <span
            className="h-2 w-2"
            style={{ backgroundColor: `var(${dimension.ratingToneVar})` }}
            aria-hidden="true"
          />
          <span className="min-w-0 break-words text-xs font-semibold text-foreground">
            {dimension.short}
          </span>
          <span className="font-mono text-xs font-bold tabular-nums text-foreground">
            {Math.round(dimension.normalizedScore)}
          </span>
        </li>
      ))}
    </ul>
  );
}

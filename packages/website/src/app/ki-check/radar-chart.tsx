"use client";

import { m, useReducedMotion } from "framer-motion";
import type { DimensionResult } from "@/lib/ki-check/types";

/*
 * Five-axis literacy radar, hand-drawn as SVG (no chart dependency). The shape
 * gives an at-a-glance profile; the exact per-dimension numbers live in the
 * bars below, so the chart itself is decorative (aria-hidden).
 */

const CX = 170;
const CY = 148;
const R = 94;
const LABEL_R = 120;
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

function anchorFor(x: number): "start" | "middle" | "end" {
  if (x < CX - 8) return "end";
  if (x > CX + 8) return "start";
  return "middle";
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
      viewBox="0 0 340 300"
      className="h-auto w-full max-w-[380px]"
      aria-hidden="true"
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

      {/* Axis labels */}
      {dimensions.map((dim, i) => {
        const p = pointOnAxis(i, count, LABEL_R);
        return (
          <text
            key={dim.id}
            x={p.x}
            y={p.y}
            textAnchor={anchorFor(p.x)}
            dominantBaseline="middle"
            fill="var(--color-muted-foreground)"
            className="text-xs font-medium"
          >
            <tspan x={p.x} dy="-0.35em">
              {dim.short}
            </tspan>
            <tspan
              x={p.x}
              dy="1.2em"
              fill="var(--color-foreground)"
              className="text-xs font-semibold"
            >
              {Math.round(dim.normalizedScore)}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}

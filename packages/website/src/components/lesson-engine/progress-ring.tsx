"use client";

import type { JSX, ReactNode } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCalmMotion } from "./use-calm-motion";

/**
 * Animated SVG progress ring. Finite tween to the new fraction; under
 * reduced motion MotionConfig resolves it to the final arc immediately.
 */
export function ProgressRing({
  fraction,
  size = 48,
  stroke = 5,
  label,
  children,
  className,
  tone = "accent",
  drawIn = false,
  trackClassName,
}: {
  readonly fraction: number;
  readonly size?: number;
  readonly stroke?: number;
  /** Accessible description, e.g. "1 von 2 Lektionen abgeschlossen". */
  readonly label: string;
  readonly children?: ReactNode;
  readonly className?: string;
  readonly tone?: "accent" | "good";
  /** Draw the arc from empty on mount (skipped under calm motion). */
  readonly drawIn?: boolean;
  /** Track colour override, e.g. on a tinted hero. */
  readonly trackClassName?: string;
}): JSX.Element {
  const calm = useCalmMotion();
  const clamped = Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0));
  const radius = size / 2 - stroke;
  const circumference = 2 * Math.PI * radius;
  return (
    <span
      role="img"
      aria-label={label}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-lab-line)"
          strokeWidth={stroke}
          className={trackClassName}
        />
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone === "good" ? "var(--color-lab-good)" : "var(--color-lab-accent)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={drawIn && !calm ? { strokeDashoffset: circumference } : false}
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          transition={{ duration: drawIn ? 1.2 : 0.6, ease: [0.16, 1, 0.3, 1], delay: drawIn ? 0.2 : 0 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {children ? (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums text-foreground">
          {children}
        </span>
      ) : null}
    </span>
  );
}

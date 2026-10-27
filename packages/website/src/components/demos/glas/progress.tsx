"use client";

import { cx } from "@/components/werk/cx";

/**
 * Progress (a 6px capsule, Mennige fill): reading or replay progress. A
 * determinate bar with an accessible name and value text.
 */
export function GlasProgress({
  value,
  label,
  valueText,
  className,
}: {
  /** 0 to 1. */
  readonly value: number;
  readonly label: string;
  readonly valueText?: string;
  readonly className?: string;
}) {
  const share = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(share * 100)}
      aria-valuetext={valueText}
      className={cx("glas-progress", className)}
    >
      <div className="glas-progress-bar" style={{ transform: `scaleX(${share})` }} />
    </div>
  );
}

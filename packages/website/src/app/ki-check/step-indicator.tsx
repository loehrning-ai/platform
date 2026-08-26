"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DIMENSIONS } from "@/lib/ki-check/questions";
import type { DimensionId, DimensionMeta } from "@/lib/ki-check/types";

interface StepIndicatorProps {
  /** The dimension the current question belongs to. */
  readonly currentDimensionId: DimensionId;
  /** Number of answered questions per dimension. */
  readonly answeredByDimension: Record<DimensionId, number>;
  /** Total questions per dimension. */
  readonly totalByDimension: Record<DimensionId, number>;
  /** Locale-owned display labels in canonical dimension order. */
  readonly dimensions?: readonly DimensionMeta[];
}

/**
 * Labeled step indicator across the five literacy dimensions. Each dimension is
 * a rung; it fills as its questions get answered and highlights while active.
 * Decorative (the live progress counter carries the accessible state), so the
 * whole strip is aria-hidden.
 */
export function StepIndicator({
  currentDimensionId,
  answeredByDimension,
  totalByDimension,
  dimensions = DIMENSIONS,
}: StepIndicatorProps) {
  return (
    <ol
      className="grid grid-cols-5 divide-x divide-border border-y border-border"
      aria-hidden="true"
    >
      {dimensions.map((dim, i) => {
        const answered = answeredByDimension[dim.id] ?? 0;
        const total = totalByDimension[dim.id] ?? 0;
        const isDone = total > 0 && answered >= total;
        const isCurrent = dim.id === currentDimensionId;
        const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;
        return (
          <li
            key={dim.id}
            className={cn(
              "min-w-0 border-b-2 px-1.5 py-2",
              isCurrent ? "border-brand-orange" : "border-transparent",
            )}
          >
            <div className="flex min-w-0 items-center justify-between gap-1">
              <span
                className={cn(
                  "font-mono text-xs font-bold tabular-nums",
                  isDone || isCurrent
                    ? "text-brand-orange"
                    : "text-muted-foreground",
                )}
              >
                {isDone ? (
                  <Check
                    className="h-3.5 w-3.5"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {answered}/{total}
              </span>
            </div>
            <span
              className={cn(
                "mt-1 hidden text-xs font-medium leading-tight sm:block",
                isCurrent ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {dim.short}
            </span>
            <span className="mt-1 block h-0.5 bg-track">
              <span
                className="block h-full bg-brand-orange transition-[width] motion-reduce:transition-none"
                style={{ width: `${percentage}%` }}
              />
            </span>
          </li>
        );
      })}
    </ol>
  );
}

"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DIMENSIONS } from "@/lib/ki-check/questions";
import type { DimensionId } from "@/lib/ki-check/types";

interface StepIndicatorProps {
  /** The dimension the current question belongs to. */
  readonly currentDimensionId: DimensionId;
  /** Number of answered questions per dimension. */
  readonly answeredByDimension: Record<DimensionId, number>;
  /** Total questions per dimension. */
  readonly totalByDimension: Record<DimensionId, number>;
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
}: StepIndicatorProps) {
  const lastIndex = DIMENSIONS.length - 1;

  return (
    <ol className="flex items-start justify-between gap-1" aria-hidden="true">
      {DIMENSIONS.map((dim, i) => {
        const answered = answeredByDimension[dim.id] ?? 0;
        const total = totalByDimension[dim.id] ?? 0;
        const isDone = total > 0 && answered >= total;
        const isCurrent = dim.id === currentDimensionId;
        return (
          <li key={dim.id} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-center">
              <span
                className={cn(
                  "h-0.5 flex-1 rounded-full transition-colors",
                  i === 0
                    ? "bg-transparent"
                    : answered > 0 || isDone
                      ? "bg-brand-orange/40"
                      : "bg-border",
                )}
              />
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isDone && "bg-kupfer-mist text-brand-orange",
                  isCurrent && "bg-brand-orange text-white shadow-tile",
                  !isDone && !isCurrent && "bg-card text-muted-foreground",
                )}
              >
                {isDone ? <Check className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
              </span>
              <span
                className={cn(
                  "h-0.5 flex-1 rounded-full transition-colors",
                  i === lastIndex
                    ? "bg-transparent"
                    : isDone
                      ? "bg-brand-orange/40"
                      : "bg-border",
                )}
              />
            </div>
            <span
              className={cn(
                "text-center text-[11px] font-medium leading-tight transition-colors",
                isCurrent ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {dim.short}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

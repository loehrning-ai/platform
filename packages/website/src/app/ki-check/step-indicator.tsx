"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DIMENSIONS } from "@/lib/ki-check/questions";
import type { DimensionId, DimensionMeta } from "@/lib/ki-check/types";

interface DimensionRailProps {
  /** Localized group label for the complete rail. */
  readonly label: string;
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
 * The separate live progress counter announces question changes. This rail is
 * a labelled status group, not a navigation landmark.
 */
export function DimensionRail({
  label,
  currentDimensionId,
  answeredByDimension,
  totalByDimension,
  dimensions = DIMENSIONS,
}: DimensionRailProps) {
  const currentIndex = Math.max(
    0,
    dimensions.findIndex((dimension) => dimension.id === currentDimensionId),
  );
  const currentDimension = dimensions[currentIndex];

  return (
    <div role="group" aria-label={label} data-dimension-rail>
      <ol className="grid grid-cols-5 divide-x divide-border border-b border-border lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
        {dimensions.map((dim, i) => {
          const answered = answeredByDimension[dim.id] ?? 0;
          const total = totalByDimension[dim.id] ?? 0;
          const isDone = total > 0 && answered >= total;
          const isCurrent = dim.id === currentDimensionId;
          const percentage = total > 0 ? answered / total : 0;
          return (
            <li
              key={dim.id}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "relative min-w-0 px-2 py-2.5 lg:px-4 lg:py-4",
                isCurrent && "bg-kupfer-mist",
              )}
            >
              <div className="flex min-w-0 items-center justify-between gap-1.5">
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
                <span className="hidden font-mono text-xs tabular-nums text-muted-foreground min-[360px]:inline lg:inline">
                  {answered}/{total}
                </span>
              </div>
              <span
                className={cn(
                  "mt-1.5 hidden break-words text-xs font-semibold leading-tight lg:block",
                  isCurrent ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {dim.short}
              </span>
              <span className="mt-2 block h-0.5 origin-left bg-track">
                <span
                  className="block h-full origin-left bg-brand-orange transition-transform duration-150 motion-reduce:transition-none"
                  style={{ transform: `scaleX(${percentage})` }}
                />
              </span>
              {isCurrent ? (
                <span
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-orange lg:inset-y-0 lg:left-0 lg:right-auto lg:h-auto lg:w-1"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="flex min-w-0 items-baseline justify-between gap-3 border-b border-border px-3 py-2 lg:hidden">
        <span className="min-w-0 break-words text-sm font-semibold text-foreground">
          {currentDimension?.name}
        </span>
        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
          {currentIndex + 1}/{dimensions.length}
        </span>
      </p>
    </div>
  );
}

"use client";

import { m, useReducedMotion } from "framer-motion";
import { dimensionIcon } from "./dimension-icons";
import type { DimensionResult } from "@/lib/ki-check/types";

/** Per-dimension breakdown: icon tile, score, rating and an animated bar. */
export function DimensionBars({
  dimensions,
}: {
  readonly dimensions: readonly DimensionResult[];
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <ul className="border-y border-border">
      {dimensions.map((dim) => {
        const Icon = dimensionIcon(dim.iconName);
        const tone = `var(${dim.ratingToneVar})`;
        return (
          <li
            key={dim.id}
            className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-border py-3 last:border-b-0"
          >
            <span className="flex h-10 w-10 items-center justify-center border border-border text-foreground">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-semibold text-foreground">
                  {dim.name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {Math.round(dim.normalizedScore)}
                  </span>
                  {" / 100 · "}
                  {dim.ratingLabel}
                </span>
              </div>
              <div
                className="mt-2 h-2 w-full overflow-hidden bg-track"
                role="progressbar"
                aria-label={`${dim.name}: ${Math.round(dim.normalizedScore)} / 100 · ${dim.ratingLabel}`}
                aria-valuenow={Math.round(dim.normalizedScore)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <m.div
                  className="h-full"
                  style={{ backgroundColor: tone }}
                  initial={prefersReducedMotion ? false : { width: 0 }}
                  animate={{ width: `${dim.normalizedScore}%` }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.45 }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

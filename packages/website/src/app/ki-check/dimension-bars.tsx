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
    <ul className="border border-border" data-capability-ledger>
      {dimensions.map((dim) => {
        const Icon = dimensionIcon(dim.iconName);
        const tone = `var(${dim.ratingToneVar})`;
        return (
          <li
            key={dim.id}
            className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-border p-3 last:border-b-0 sm:p-4"
            data-capability-row
          >
            <span className="flex h-10 w-10 items-center justify-center border border-border text-foreground">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="grid min-w-0 gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-3">
                <span className="min-w-0 break-words text-sm font-semibold text-foreground">
                  {dim.name}
                  {dim.description ? (
                    <span className="mt-0.5 block break-words text-xs font-normal text-muted-foreground">
                      {dim.description}
                    </span>
                  ) : null}
                </span>
                <span className="break-words text-xs text-muted-foreground sm:shrink-0 sm:text-right">
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
                  className="h-full w-full origin-left"
                  style={{ backgroundColor: tone }}
                  initial={prefersReducedMotion ? false : { scaleX: 0 }}
                  animate={{ scaleX: dim.normalizedScore / 100 }}
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

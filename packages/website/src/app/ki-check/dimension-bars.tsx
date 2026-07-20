"use client";

import { m } from "framer-motion";
import { IconTile } from "@/components/ui/card";
import { dimensionIcon } from "./dimension-icons";
import type { DimensionResult } from "@/lib/ki-check/types";

/** Per-dimension breakdown: icon tile, score, rating and an animated bar. */
export function DimensionBars({
  dimensions,
}: {
  readonly dimensions: readonly DimensionResult[];
}) {
  return (
    <ul className="flex flex-col gap-5">
      {dimensions.map((dim, i) => {
        const Icon = dimensionIcon(dim.iconName);
        const tone = `var(${dim.ratingToneVar})`;
        return (
          <li key={dim.id} className="flex items-center gap-4">
            <IconTile icon={Icon} accent={dim.accent} />
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
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border/60">
                <m.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: tone }}
                  initial={{ width: 0 }}
                  animate={{ width: `${dim.normalizedScore}%` }}
                  transition={{ duration: 0.7, delay: 0.15 + i * 0.08 }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

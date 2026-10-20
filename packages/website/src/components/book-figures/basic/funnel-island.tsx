"use client";

import { useMemo } from "react";
import {
  formatDecimal,
  formatValue,
  funnelLimits,
  zForCoverage,
  type FigureSpecOf,
} from "@/lib/figures";
import { HINT } from "./copy";
import { FigureCanvas } from "./figure-canvas";
import type { CanvasItem } from "./types";

/** The labelled points outside the outer control limit, left to right by sample size. */
export function funnelOutliers(spec: FigureSpecOf<"funnel">): CanvasItem[] {
  const { data } = spec;
  const coverage = data.limits?.[data.limits.length - 1] ?? 99.8;
  const z = zForCoverage(coverage);
  const p0 = data.overall / 100;
  const coverageText = `${formatDecimal(coverage, coverage % 1 === 0 ? 0 : 1)}-%-Zufallsband`;
  return data.points
    .flatMap((pt) => {
      const [lo, hi] = funnelLimits(p0, pt.n, z);
      const v = pt.value / 100;
      const side = v > hi ? "über" : v < lo ? "unter" : null;
      if (side === null || !pt.label) return [];
      const rate = formatValue(data.fmt, pt.value);
      return [
        {
          n: pt.n,
          item: {
            id: pt.id,
            label: `${pt.label}: ${rate}`,
            detail: `${pt.label}: ${rate} bei n\u00a0=\u00a0${formatDecimal(pt.n, 0)} Firmen, ${side} dem ${coverageText} (Gesamt ${formatValue(data.fmt, data.overall)}).`,
          } satisfies CanvasItem,
        },
      ];
    })
    .sort((a, b) => a.n - b.n)
    .map((x) => x.item);
}

/** C8: rate against sample size with control limits; only the outliers are pointable. */
export function FunnelIsland({ spec }: { readonly spec: FigureSpecOf<"funnel"> }) {
  const items = useMemo(() => funnelOutliers(spec), [spec]);
  return (
    <FigureCanvas
      spec={spec}
      items={items}
      summary={items.length > 0 ? HINT.point : "Kein Kreis liegt außerhalb des Zufallsbands."}
      groupLabel="Kreise außerhalb des Zufallsbands"
    />
  );
}

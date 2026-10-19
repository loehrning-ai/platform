"use client";

import { useId, useMemo, useState } from "react";
import { formatDecimal, type FigureSpecOf } from "@/lib/figures";
import { barItems } from "./bars-island";
import { Controls } from "./controls";
import { HINT } from "./copy";
import { FigureCanvas } from "./figure-canvas";

/** Cumulative share (0 to 100) at x, linear between the points. */
export function readCurve(points: readonly (readonly [number, number])[], x: number): number {
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < sorted.length; i += 1) {
    const a = sorted[i - 1];
    const b = sorted[i];
    if (a && b && x <= b[0]) {
      const span = b[0] - a[0];
      return span === 0 ? b[1] : a[1] + ((b[1] - a[1]) * (x - a[0])) / span;
    }
  }
  return sorted[sorted.length - 1]?.[1] ?? 0;
}

export const SLIDER_MIN = 1;
export const SLIDER_MAX = 50;

export function shareSentence(spec: FigureSpecOf<"lorenz">, top: number): string {
  const share = 100 - readCurve(spec.data.points, 100 - top);
  return `Die größten ${formatDecimal(top, 0)}\u00a0% der Arbeitgeber halten ${formatDecimal(Math.round(share), 0)}\u00a0% der Stellen.`;
}

/**
 * C10: the curve plus the top shares as bars. A native range input reads the
 * curve ("die größten x Prozent"), so the same reading works with a finger
 * and with the arrow keys.
 */
export function LorenzIsland({
  spec,
  bars,
}: {
  readonly spec: FigureSpecOf<"lorenz">;
  readonly bars: FigureSpecOf<"bars">;
}) {
  const [top, setTop] = useState(10);
  const sliderId = useId();
  const sentence = shareSentence(spec, top);
  const shown = useMemo<FigureSpecOf<"lorenz">>(
    () => ({ ...spec, data: { ...spec.data, marks: [{ x: 100 - top, label: sentence }] } }),
    [spec, top, sentence],
  );
  const barRows = useMemo(() => barItems(bars, "source"), [bars]);
  return (
    <>
      <Controls>
        <div className="bf-slider">
          <label className="bf-control-label" htmlFor={sliderId}>
            Größte Arbeitgeber, Anteil
          </label>
          <div className="bf-slider-row">
            <input
              id={sliderId}
              className="bf-range"
              type="range"
              min={SLIDER_MIN}
              max={SLIDER_MAX}
              step={1}
              value={top}
              aria-valuetext={sentence}
              onChange={(event) => setTop(Number(event.currentTarget.value))}
            />
            <output htmlFor={sliderId}>{`${formatDecimal(top, 0)}\u00a0%`}</output>
          </div>
        </div>
      </Controls>
      <FigureCanvas spec={shown} summary={sentence} quiet />
      <FigureCanvas
        spec={bars}
        items={barRows}
        summary={HINT.row}
        groupLabel="Einzelne Balken"
      />
    </>
  );
}

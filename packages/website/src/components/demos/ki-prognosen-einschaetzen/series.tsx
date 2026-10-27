"use client";

import type { Checker } from "@/lib/demo-cases/ki-prognosen-einschaetzen/check";
import type { Model } from "@/lib/demo-cases/ki-prognosen-einschaetzen/model";
import { extent, linear, linePath, PAD, weekScale, type WeekScale } from "./plot";

/**
 * The weekly series on the field, shared by scenes 1 to 3: sales as Butter
 * bars, the tool's forecast as a Kalkweiß line with small dots, the rule as
 * a dashed Butter line. Pure geometry plus one SVG group (#w01-chart), the
 * group the lens magnifies.
 */
export interface SeriesGeometry {
  readonly scale: WeekScale;
  readonly y: (value: number) => number;
  readonly top: number;
  readonly bottom: number;
  readonly bar: number;
}

export function seriesGeometry(model: Model, width: number, top: number, bottom: number, extra: readonly number[] = []): SeriesGeometry {
  const { check, span } = model;
  const values: number[] = [...extra];
  for (const t of span) {
    const ist = check.rows[t]?.ist;
    if (ist !== null && ist !== undefined) values.push(ist);
    const forecast = check.forecast(t);
    if (forecast !== null) values.push(forecast);
  }
  const [lo, hi] = extent(values, 0.1);
  const scale = weekScale(span, PAD.left, width - PAD.right);
  return { scale, y: linear(lo, hi, bottom, top), top, bottom, bar: Math.max(1.5, scale.step * 0.56) };
}

export function SalesBars({ check, weeks, geometry, dim }: { readonly check: Checker; readonly weeks: readonly number[]; readonly geometry: SeriesGeometry; readonly dim?: boolean }) {
  const { scale, y, bottom, bar } = geometry;
  let d = "";
  for (const t of weeks) {
    const ist = check.rows[t]?.ist;
    if (ist === null || ist === undefined) continue;
    const x = scale.x(t) - bar / 2;
    d += `M${x.toFixed(1)} ${bottom.toFixed(1)}V${y(ist).toFixed(1)}h${bar.toFixed(1)}V${bottom.toFixed(1)}z`;
  }
  return <path d={d} className={dim ? "w01-sales is-dim" : "w01-sales"} />;
}

export function ForecastLine({ check, weeks, geometry, dots = true }: { readonly check: Checker; readonly weeks: readonly number[]; readonly geometry: SeriesGeometry; readonly dots?: boolean }) {
  const { scale, y } = geometry;
  const points = weeks.map((t) => {
    const value = check.forecast(t);
    return value === null ? null : ([scale.x(t), y(value)] as const);
  });
  return (
    <g className="w01-forecast">
      <path d={linePath(points)} />
      {dots && scale.step >= 5
        ? points.map((point, i) => (point ? <circle key={weeks[i]} cx={point[0]} cy={point[1]} r={1.6} /> : null))
        : null}
    </g>
  );
}

export function RuleLine({ check, weeks, geometry }: { readonly check: Checker; readonly weeks: readonly number[]; readonly geometry: SeriesGeometry }) {
  const { scale, y } = geometry;
  const points = weeks.map((t) => {
    const value = check.rule(t);
    return value === null ? null : ([scale.x(t), y(value)] as const);
  });
  return <path d={linePath(points)} className="w01-rule" />;
}

/** The playhead: a hairline over the chart and the week's gap between forecast and sales. */
export function Playhead({ check, t, geometry }: { readonly check: Checker; readonly t: number; readonly geometry: SeriesGeometry }) {
  const { scale, y, top, bottom } = geometry;
  const x = scale.x(t);
  const ist = check.rows[t]?.ist;
  const forecast = check.forecast(t);
  return (
    <g className="w01-playhead" aria-hidden="true">
      <path d={`M${x.toFixed(1)} ${top - 4}V${bottom}`} />
      {ist !== null && ist !== undefined && forecast !== null ? (
        <path className="w01-gap" d={`M${x.toFixed(1)} ${y(ist).toFixed(1)}V${y(forecast).toFixed(1)}`} />
      ) : null}
    </g>
  );
}

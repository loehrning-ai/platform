"use client";

import type { PointerEvent } from "react";
import { SvgLens } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { fill, formatNumber } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";
import { hitsUpTo, sortedWindow, type Model } from "@/lib/demo-cases/ki-prognosen-einschaetzen/model";
import { extent, linear, Readline, SceneFrame, usePlotSize, useScrub } from "./plot";
import { ForecastLine, Playhead, SalesBars, seriesGeometry } from "./series";

const ROW_H = 46;

/** A hit (filled square) or a miss (hollow square with a diagonal), centred on (x, y). */
export function HitMark({ x, y, hit, size = 6 }: { readonly x: number; readonly y: number; readonly hit: boolean; readonly size?: number }) {
  const h = size / 2;
  return hit ? (
    <rect x={x - h} y={y - h} width={size} height={size} className="w01-hitmark is-in" />
  ) : (
    <g className="w01-hitmark is-out">
      <rect x={x - h} y={y - h} width={size} height={size} />
      <path d={`M${x - h} ${y + h}L${x + h} ${y - h}`} />
    </g>
  );
}

const signed = (value: number, locale: DemoPack["locale"]) => (value > 0 ? `+${formatNumber(value, locale, 1)}` : formatNumber(value, locale, 1));

/**
 * Scene 3, "Die Spanne": for the playhead week, the 26 errors before it lie
 * as a sorted row of dots under the chart, two ticks cut off the lowest and
 * the highest tenth, and the band they give hangs around that week's
 * forecast. Each passed week lands as a hit or a miss. Moving the playhead
 * runs the window like a conveyor belt; across 7 April the new errors land
 * far below zero and the band widens only slowly.
 */
export function SceneRange({
  copy,
  model,
  playhead,
  filled,
  onPlayhead,
  onCommit,
}: {
  readonly copy: DemoPack;
  readonly model: Model;
  readonly playhead: number;
  /** The completion week was reached: every week shows its hit or miss. */
  readonly filled: boolean;
  readonly onPlayhead: (t: number) => void;
  readonly onCommit: (t: number, share: number) => void;
}) {
  const { check, span } = model;
  const locale = copy.locale;
  const [plotRef, { width, height }] = usePlotSize();
  const chartBottom = Math.max(80, height - ROW_H - 10);
  const win = sortedWindow(check, playhead);
  const bands = span.map((t) => {
    const forecast = check.forecast(t);
    const band = check.band(t);
    return forecast === null || band === null ? null : ([forecast + band[0], forecast + band[1]] as const);
  });
  const geometry = seriesGeometry(
    model,
    width,
    6,
    chartBottom,
    bands.flatMap((band) => (band ? [band[0], band[1]] : [])),
  );
  const { scale, y } = geometry;
  const scrub = useScrub(scale, onPlayhead, (t) => onCommit(t, scale.x(t) / width));

  // The sorted row shares one x scale over every error the scene can show, so dots slide, never rescale.
  const allErrors = check.wochen.flatMap((t) => {
    const forecast = check.forecast(t);
    const ist = check.rows[t]?.ist;
    return forecast === null || ist === null || ist === undefined ? [] : [ist - forecast];
  });
  const [e0, e1] = extent(allErrors, 0.04);
  const ex = linear(e0, e1, 14, width - 14);
  const rowY = chartBottom + 10 + ROW_H / 2;

  const tally = hitsUpTo(check, playhead);
  const hit = check.hit(playhead);
  const head = (
    <Readline live className="w01-tabular">
      {fill(copy.s3.counter, { hits: tally.hits, seen: tally.seen })}
      {win ? <span className="w01-soft"> · {fill(copy.s3.edges, { low: signed(win.low, locale), high: signed(win.high, locale) })}</span> : null}
    </Readline>
  );

  const onRowTap = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!box) return;
    const t = scale.at(event.clientX - box.left);
    onPlayhead(t);
    onCommit(t, scale.x(t) / width);
  };
  const current = bands[span.indexOf(playhead)] ?? null;
  const ist = check.rows[playhead]?.ist;

  return (
    <SceneFrame head={head} plotRef={plotRef}>
      <svg width={width} height={height} className="w01-svg" role="img" aria-label={copy.s3.rowLabel}>
        <g id="w01-chart">
          <SalesBars check={check} weeks={span} geometry={geometry} dim />
          <g className="w01-bandtrail" aria-hidden="true">
            {span.map((t, i) => {
              const band = bands[i];
              if (!band || t > playhead) return null;
              return <path key={t} d={`M${scale.x(t).toFixed(1)} ${y(band[1]).toFixed(1)}V${y(band[0]).toFixed(1)}`} />;
            })}
          </g>
          <ForecastLine check={check} weeks={span} geometry={geometry} dots={false} />
          {current ? (
            <rect
              className="w01-band"
              x={scale.x(playhead) - Math.max(5, scale.step * 0.9)}
              y={y(current[1])}
              width={Math.max(10, scale.step * 1.8)}
              height={Math.max(2, y(current[0]) - y(current[1]))}
              rx={3}
            />
          ) : null}
          <Playhead check={check} t={playhead} geometry={geometry} />
          {span.map((t) => {
            if (!filled && t > playhead) return null;
            const isHit = check.hit(t);
            const value = check.rows[t]?.ist;
            if (isHit === null || value === null || value === undefined) return null;
            return <HitMark key={t} x={scale.x(t)} y={y(value)} hit={isHit} size={t === playhead ? 8 : 5} />;
          })}
        </g>
        <rect x={0} y={0} width={width} height={chartBottom} className="w01-hit" {...scrub.handlers} />
        <g className="w01-row" aria-hidden="true">
          <path className="w01-zero" d={`M${ex(0).toFixed(1)} ${rowY - 16}V${rowY + 16}`} />
          {win
            ? win.errors.map((error, index) => {
                const outside = error < win.low || error > win.high;
                return (
                  <circle
                    key={index}
                    cx={0}
                    cy={rowY}
                    r={3.4}
                    className={outside ? "w01-dot is-out" : "w01-dot"}
                    style={{ transform: `translateX(${ex(error).toFixed(1)}px)` }}
                  />
                );
              })
            : null}
          {win ? (
            <>
              <path className="w01-cut" d={`M${ex(win.low).toFixed(1)} ${rowY - 13}V${rowY + 13}`} />
              <path className="w01-cut" d={`M${ex(win.high).toFixed(1)} ${rowY - 13}V${rowY + 13}`} />
              <text x={ex(win.low)} y={rowY + 24} textAnchor="middle" className="w01-label is-tick">
                {signed(win.low, locale)}
              </text>
              <text x={ex(win.high)} y={rowY + 24} textAnchor="middle" className="w01-label is-tick">
                {signed(win.high, locale)}
              </text>
            </>
          ) : null}
        </g>
        <rect x={0} y={chartBottom} width={width} height={Math.max(0, height - chartBottom)} className="w01-hit is-tap" onPointerUp={onRowTap} />
        <SvgLens contentId="w01-chart" cx={scale.x(playhead)} cy={ist !== null && ist !== undefined ? y(ist) : chartBottom / 2} r={34} visible={scrub.active} />
        <title>{hit === null ? copy.s3.weekNone : hit ? copy.s3.weekIn : copy.s3.weekOut}</title>
      </svg>
    </SceneFrame>
  );
}

"use client";

import { useId } from "react";
import type { Checker } from "@/lib/demo-cases/ki-prognosen-einschaetzen/check";
import { formatNumber, formatShortDay, type DemoLocale } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";
import { useSize } from "./use-size";

/**
 * The weekly series as flat bars in real pixels: the kit CSV's `ist` column,
 * the stored forecast as Mennige ticks, the "same as last week" rule as a
 * dashed ink line that slides one week to the right, the 80 % range as a
 * corridor with the actual as a filled square (inside) or a Mennige outline
 * (outside). Every layer is a pure function of the props the beat computes
 * from the clock's progress.
 */
export interface SeriesChartProps {
  readonly check: Checker;
  readonly locale: DemoLocale;
  /** First and last row index drawn (inclusive). */
  readonly from: number;
  readonly to: number;
  readonly labels: {
    readonly soldOut: string;
    readonly noForecast: string;
    readonly baseline: string;
    readonly forecast: string;
  };
  /** Height share of bar t (the arrival rise); 1 when omitted. */
  readonly rise?: (t: number) => number;
  /** Bars before this row are drawn at 40 % ink (the year before). */
  readonly fadeBefore?: number;
  /** Draws the actual as bars (off in the range beat, where the actual is a square). */
  readonly bars?: boolean;
  /** 0..1: the "same as last week" line, from on the bars (0) to one week right (1); null hides it. */
  readonly ruleShift?: number | null;
  /** How many scored weeks show their forecast and rule ticks. */
  readonly ticks?: number;
  /** How many scored weeks with a range show corridor and square; null hides the range layer. */
  readonly bands?: number | null;
  /** The pinned week (a hairline to the top). */
  readonly pin?: number | null;
  /** The plan week's dashed stub: the forecast, later the planning number. */
  readonly stub?: { readonly t: number; readonly value: number; readonly label: string } | null;
  /** The week the range sweep is on (its corridor drawn heavier). */
  readonly focus?: number | null;
  /** Marks the week without a stored forecast. */
  readonly noForecastLabel?: boolean;
  /** Labels the bottom edge with the years ("2024", "2025") under their weeks instead of the first and last date. */
  readonly years?: boolean;
}

/** left leaves room for the axis floor ("340") at the foot of the bars. */
const PAD = { left: 26, right: 6, top: 10, bottom: 18 } as const;

function niceFloor(value: number): number {
  const step = value > 400 ? 100 : value > 40 ? 10 : 1;
  return Math.max(0, Math.floor(value / step) * step);
}

export function SeriesChart(props: SeriesChartProps) {
  const { check, locale, from, to, labels } = props;
  const [ref, size] = useSize({ width: 340, height: 180 });
  const hatch = `fl-hatch-${useId().replace(/:/g, "")}`;
  const n = Math.max(1, to - from + 1);
  const width = size.width;
  const height = size.height;
  const innerW = Math.max(1, width - PAD.left - PAD.right);
  const innerH = Math.max(1, height - PAD.top - PAD.bottom);
  const step = innerW / n;
  const barW = Math.max(1, step * (n > 60 ? 0.62 : 0.7));
  const x = (t: number) => PAD.left + (t - from) * step + step / 2;

  const values: number[] = [];
  for (let t = from; t <= to; t += 1) {
    const row = check.rows[t];
    if (!row) continue;
    if (row.ist !== null) values.push(row.ist);
    const f = check.forecast(t);
    if (f !== null) values.push(f);
    if (props.bands !== undefined && props.bands !== null && f !== null) {
      const band = check.band(t);
      if (band) values.push(f + band[0], f + band[1]);
    }
  }
  if (props.stub) values.push(props.stub.value);
  const max = values.length > 0 ? Math.max(...values) : 1;
  const min = values.length > 0 ? Math.min(...values) : 0;
  const floor = niceFloor(min - (max - min) * 0.25);
  const top = max + (max - floor) * 0.06;
  const y = (value: number) => PAD.top + innerH * (1 - (value - floor) / Math.max(1, top - floor));
  const base = y(floor);

  const scored = check.wochen.filter((t) => t >= from && t <= to);
  const ticked = new Set(scored.slice(0, props.ticks ?? 0));
  const ranged = scored.filter((t) => check.hit(t) !== null);
  const banded = new Set(props.bands === null || props.bands === undefined ? [] : ranged.slice(0, props.bands));
  const showBars = props.bars ?? true;
  // The one week inside the frame with an actual but no stored forecast (a hairline and its label).
  let gap: number | null = null;
  if (check.hasForecast && props.noForecastLabel) {
    for (let t = Math.max(from, 1); t <= to && gap === null; t += 1) {
      const row = check.rows[t];
      if (row && row.ist !== null && row.f === null && t !== check.naechste) gap = t;
    }
  }

  const rulePath: string[] = [];
  if (props.ruleShift !== null && props.ruleShift !== undefined) {
    const shift = props.ruleShift;
    for (let t = Math.max(from, 1); t <= to; t += 1) {
      const previous = check.rows[t - 1]?.ist;
      if (previous === null || previous === undefined) {
        rulePath.push("");
        continue;
      }
      const px = x(t - 1) + shift * step;
      rulePath.push(`${rulePath.length === 0 || rulePath[rulePath.length - 1] === "" ? "M" : "L"}${px.toFixed(1)} ${y(previous).toFixed(1)}`);
      rulePath.push(`L${(px + step).toFixed(1)} ${y(previous).toFixed(1)}`);
    }
  }

  const firstLabel = check.rows[from]?.woche;
  const lastLabel = check.rows[to]?.woche;
  // The years under their weeks: each label centred under its own span of bars.
  const yearSpans: { year: string; from: number; to: number }[] = [];
  if (props.years) {
    for (let t = from; t <= to; t += 1) {
      const year = check.rows[t]?.woche.slice(0, 4);
      if (!year) continue;
      const last = yearSpans[yearSpans.length - 1];
      if (last && last.year === year) last.to = t;
      else yearSpans.push({ year, from: t, to: t });
    }
  }

  return (
    <div ref={ref} className="fl-chart" aria-hidden="true">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="presentation">
        <defs>
          <pattern id={hatch} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="4" height="4" className="fl-hatch-ground" />
            <line x1="0" y1="0" x2="0" y2="4" className="fl-hatch-line" />
          </pattern>
        </defs>
        <line x1={PAD.left} x2={width - PAD.right} y1={base + 0.5} y2={base + 0.5} className="fl-axis" />

        {showBars
          ? Array.from({ length: n }, (_, i) => {
              const t = from + i;
              const row = check.rows[t];
              if (!row || row.ist === null) return null;
              const share = props.rise ? props.rise(t) : 1;
              if (share <= 0) return null;
              const h = (base - y(row.ist)) * share;
              const faded = props.fadeBefore !== undefined && t < props.fadeBefore;
              return (
                <rect
                  key={t}
                  x={x(t) - barW / 2}
                  y={base - h}
                  width={barW}
                  height={h}
                  className={faded ? "fl-bar is-faded" : "fl-bar"}
                  fill={row.zensiert ? `url(#${hatch})` : undefined}
                />
              );
            })
          : null}

        {showBars && gap !== null ? (
          <g>
            <line x1={x(gap)} x2={x(gap)} y1={PAD.top + 10} y2={base} className="fl-gap" />
            <text
              x={x(gap) + (x(gap) > width * 0.6 ? -4 : 4)}
              y={PAD.top + 8}
              textAnchor={x(gap) > width * 0.6 ? "end" : "start"}
              className="fl-label"
            >
              {labels.noForecast}
            </text>
          </g>
        ) : null}

        {[...banded].map((t) => {
          const f = check.forecast(t) as number;
          const band = check.band(t) as readonly [number, number];
          const hit = check.hit(t) === true;
          const ist = check.rows[t]?.ist as number;
          const w = Math.max(2, step * 0.8);
          const s = Math.max(4, Math.min(9, step * 0.8));
          return (
            <g key={`b${t}`}>
              <rect
                x={x(t) - w / 2}
                y={y(f + band[1])}
                width={w}
                height={Math.max(1, y(f + band[0]) - y(f + band[1]))}
                className={t === props.focus ? "fl-band is-focus" : "fl-band"}
              />
              <rect
                x={x(t) - s / 2}
                y={y(ist) - s / 2}
                width={s}
                height={s}
                className={hit ? "fl-hit" : "fl-miss"}
              />
            </g>
          );
        })}

        {rulePath.length > 0 ? <path d={rulePath.join(" ")} className="fl-rule" /> : null}

        {[...ticked].map((t) => {
          const f = check.forecast(t);
          const rule = check.rule(t);
          const tw = Math.max(3, step * 0.9);
          return (
            <g key={`t${t}`}>
              {rule !== null ? <line x1={x(t) - tw / 2} x2={x(t) + tw / 2} y1={y(rule)} y2={y(rule)} className="fl-tick-rule" /> : null}
              {f !== null ? <line x1={x(t) - tw / 2} x2={x(t) + tw / 2} y1={y(f)} y2={y(f)} className="fl-tick" /> : null}
            </g>
          );
        })}

        {props.pin !== null && props.pin !== undefined && props.pin >= from && props.pin <= to ? (
          <line x1={x(props.pin)} x2={x(props.pin)} y1={PAD.top - 6} y2={base} className="fl-pin" />
        ) : null}

        {props.stub ? (
          <g>
            <line x1={x(props.stub.t) - step} x2={x(props.stub.t) + step / 2} y1={y(props.stub.value)} y2={y(props.stub.value)} className="fl-stub" />
            <text x={x(props.stub.t) - step - 3} y={y(props.stub.value) + 3.5} textAnchor="end" className="fl-label is-accent">
              {props.stub.label}
            </text>
          </g>
        ) : null}

        {/* The axis does not start at 0: its floor stands at the foot of the bars, where a reader looks for it. */}
        <text x={PAD.left - 4} y={base + 3.5} textAnchor="end" className="fl-label" data-fl-floor="">
          {formatNumber(floor, locale)}
        </text>
        {props.years ? (
          yearSpans.map((span) => (
            <text key={span.year} x={(x(span.from) + x(span.to)) / 2} y={height - 4} textAnchor="middle" className="fl-label is-year">
              {span.year}
            </text>
          ))
        ) : (
          <>
            <text x={PAD.left} y={height - 4} className="fl-label">
              {firstLabel ? formatShortDay(firstLabel, locale) : ""}
            </text>
            <text x={width - PAD.right} y={height - 4} textAnchor="end" className="fl-label">
              {lastLabel ? formatShortDay(lastLabel, locale) : ""}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

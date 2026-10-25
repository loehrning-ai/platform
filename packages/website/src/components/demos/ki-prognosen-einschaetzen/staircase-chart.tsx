"use client";

import { useId } from "react";
import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import {
  fill,
  formatNumber,
} from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";
import type { Band } from "@/lib/demo-cases/ki-prognosen-einschaetzen/quantile";
import {
  columnPaths,
  NEAR_PX,
  niceTicks,
  redLabelBox,
  yOf,
  type Frame,
} from "./geometry";

export interface Detent {
  readonly id: "today" | "forecast" | "p90" | "best";
  readonly value: number;
  readonly name: string;
}

/** The fills shared by the chart and its legend: solid red with a sparse paper hairline, dotted grey. */
export function PatternDefs({ id }: { readonly id: string }) {
  return (
    <defs>
      <pattern
        id={`${id}-hatch`}
        width="9"
        height="9"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width="9" height="9" className="hw-mennige" />
        <rect width="1.4" height="9" className="hw-paper" />
      </pattern>
      <pattern
        id={`${id}-dots`}
        width="4.5"
        height="4.5"
        patternUnits="userSpaceOnUse"
      >
        <rect width="4.5" height="4.5" className="hw-paper" />
        <circle cx="2.25" cy="2.25" r="1.05" className="hw-grey" />
      </pattern>
    </defs>
  );
}

interface Props {
  readonly copy: DemoPack;
  readonly frame: Frame;
  readonly samples: readonly number[];
  readonly band: Band;
  readonly cap: number;
  readonly short: number;
  /** Weeks settled from the left (0..100) while the count-in scans; 100 at rest. */
  readonly scanned: number;
  readonly detents: readonly Detent[];
  readonly request: number | null;
  readonly lo: number;
  readonly showAxisTag: boolean;
  /** Bumps when the line lands on a detent: its tag flashes once. */
  readonly snapKey: number;
}

/** Rough width of a 12px bold label, enough to size its box. */
const labelWidth = (text: string) => Math.ceil(text.length * 6.9) + 14;
const TAG_H = 20;

function Tag({
  x,
  y,
  text,
  inverted,
  className = "",
}: {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly inverted: boolean;
  readonly className?: string;
}) {
  const w = labelWidth(text);
  return (
    <g className={`hw-tag ${inverted ? "is-inverted" : ""} ${className}`}>
      <rect x={x} y={y - TAG_H / 2} width={w} height={TAG_H} />
      <text x={x + w / 2} y={y + 4.5} textAnchor="middle">
        {text}
      </text>
    </g>
  );
}

export function StaircaseChart({
  copy,
  frame,
  samples,
  band,
  cap,
  short,
  scanned,
  detents,
  request,
  lo,
  showAxisTag,
  snapKey,
}: Props) {
  const ids = useId().replace(/:/g, "");
  const locale = copy.locale;
  const n = (value: number) => formatNumber(value, locale);
  const capY = yOf(frame, cap);
  const paths = columnPaths(frame, samples, cap, scanned);
  const seam = Math.min(1.4, Math.max(0.5, frame.unit * 0.24));
  const tenSeam = Math.min(2.2, Math.max(0.9, frame.unit * 0.5));
  const scanX = frame.left + scanned * frame.unit;
  const base = yOf(frame, frame.lo);
  const ticks = niceTicks(frame.lo, frame.hi);
  const rounded = Math.round(cap);

  // Only the mark the line sits on is named; the chips name every value, so
  // no permanent tags crowd the line.
  const active = detents.find(
    (detent) => Math.abs(yOf(frame, detent.value) - capY) <= NEAR_PX,
  );
  const redText = fill(copy.chart.redLabel, { n: short });
  const redW = Math.ceil(redText.length * 8.6) + 18;
  const redBox =
    scanned >= 100 && short > 0
      ? redLabelBox(frame, samples, cap, redW, 28)
      : null;
  const best = detents.find((detent) => detent.id === "best");
  const xp = (index: number) => frame.left + index * frame.unit;
  const axisWords = [
    { index: 10, label: copy.chart.xp.p10, value: band.p10 },
    { index: 50, label: copy.chart.xp.p50, value: band.p50 },
    { index: 90, label: copy.chart.xp.p90, value: band.p90 },
  ];
  const clampX = (x: number, text: string) => {
    const half = (text.length * 6.6) / 2 + 2;
    return Math.min(frame.W - half, Math.max(half + 2, x));
  };

  return (
    <svg
      className="hw-svg"
      width="100%"
      height={frame.H}
      viewBox={`0 0 ${frame.W} ${frame.H}`}
      role="img"
      aria-label={fill(copy.chart.chartLabel, { cap: n(rounded), n: short })}
    >
      <desc>
        {fill(copy.chart.chartDesc, {
          p10: n(band.p10),
          p50: n(band.p50),
          p90: n(band.p90),
        })}
      </desc>
      <PatternDefs id={ids} />

      {ticks.map((tick) => (
        <g key={tick}>
          <line
            className="hw-gridline"
            x1={frame.left}
            x2={frame.right}
            y1={yOf(frame, tick)}
            y2={yOf(frame, tick)}
          />
          <text
            className="hw-axis"
            x={frame.left - 5}
            y={yOf(frame, tick) + 4}
            textAnchor="end"
          >
            {n(tick)}
          </text>
        </g>
      ))}

      <path d={paths.pending} className="hw-pending" />
      <path d={paths.left} fill={`url(#${ids}-dots)`} />
      <path d={paths.short} fill={`url(#${ids}-hatch)`} />
      <path d={paths.ink} className="hw-ink" />
      <path d={paths.seams} className="hw-seam" strokeWidth={seam} />
      <path d={paths.tens} className="hw-seam" strokeWidth={tenSeam} />
      <path d={paths.tails} className="hw-tails" fill="none" />
      {scanned > 0 && scanned < 100 ? (
        <line
          className="hw-scan"
          x1={scanX}
          x2={scanX}
          y1={frame.top - 6}
          y2={base + 6}
        />
      ) : null}

      {request !== null ? (
        <line
          className="hw-request"
          x1={frame.left}
          x2={frame.right}
          y1={yOf(frame, request)}
          y2={yOf(frame, request)}
        />
      ) : null}

      {detents.map((detent) => (
        <g key={detent.id}>
          {detent === active && detent.id !== "today" ? (
            <line
              className="hw-detent"
              x1={frame.left}
              x2={frame.right}
              y1={yOf(frame, detent.value)}
              y2={yOf(frame, detent.value)}
            />
          ) : null}
          <line
            className="hw-notch"
            x1={frame.right - 9}
            x2={frame.right}
            y1={yOf(frame, detent.value)}
            y2={yOf(frame, detent.value)}
          />
        </g>
      ))}

      <line
        className="hw-capline"
        x1={frame.left}
        x2={frame.W - 4}
        y1={capY}
        y2={capY}
      />

      {best ? (
        <rect
          className="hw-diamond"
          x={frame.right - 25}
          y={yOf(frame, best.value) - 7}
          width="14"
          height="14"
          transform={`rotate(45 ${frame.right - 18} ${yOf(frame, best.value)})`}
        />
      ) : null}

      {redBox ? (
        <g className="hw-red-label">
          <rect x={redBox.x} y={redBox.y} width={redBox.w} height={redBox.h} />
          <text
            x={redBox.x + redBox.w / 2}
            y={redBox.y + redBox.h / 2 + 5.5}
            textAnchor="middle"
          >
            {redText}
          </text>
        </g>
      ) : null}

      {active ? (
        <Tag
          key={`${active.id}-${snapKey}`}
          x={frame.left + 5}
          y={capY - 16}
          text={active.name}
          inverted
          className={snapKey > 0 ? "is-snap" : ""}
        />
      ) : null}

      <path
        className="hw-xtick hw-xtick-minor"
        d={Array.from(
          { length: 11 },
          (_, i) => `M${xp(i * 10)} ${base}v4`,
        ).join("")}
      />
      {axisWords.map((item) => {
        const text = `${item.label} ${n(item.value)}`;
        return (
          <g key={item.label}>
            <line
              className="hw-xtick"
              x1={xp(item.index)}
              x2={xp(item.index)}
              y1={base}
              y2={base + 5}
            />
            <text
              className="hw-axis"
              x={clampX(xp(item.index), text)}
              y={base + 19}
              textAnchor="middle"
            >
              {text}
            </text>
          </g>
        );
      })}
      {showAxisTag ? (
        <g>
          <path
            className="hw-break"
            d={`M5 ${base + 34}l3.5 -5l3.5 5l3.5 -5`}
            fill="none"
          />
          <text className="hw-axis" x="23" y={base + 34}>
            {fill(copy.chart.axisFrom, { lo: n(lo) })}
          </text>
        </g>
      ) : null}
    </svg>
  );
}

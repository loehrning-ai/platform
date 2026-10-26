"use client";

import { useMemo, useState } from "react";
import { DataHandle, GlasIcon, GlasReadout } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { CRAFT_MODELS, CRAFT_SKUS, REPORT, WEEK_STARTS } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { clampRange, matchesReport, rowsIn, TRACE_ROWS, type WeekRange } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/trace";
import type { Fmt } from "./fmt";
import { lerpNumber, useMorph } from "./use-morph";

const VIEW = { w: 360, h: 128 } as const;
const LEFT = 6;
const TOP = 30;
const COL = (VIEW.w - LEFT * 2) / WEEK_STARTS.length;
const ROW = 3.6;
const CARPET_H = CRAFT_SKUS.length * ROW;
const BOTTOM = TOP + CARPET_H;

const edgeX = (index: number) => LEFT + index * COL;
const nearestEdge = (x: number) => Math.round((x - LEFT) / COL);

/**
 * Scene 5: the 171 CRAFT rows of demand_actuals.csv as a carpet, one column
 * per shipping week. Two handles brush the weeks; the rows inside stream
 * into the three model bins and the sum counts only rows that have landed.
 */
export function TraceCarpet({
  pack,
  fmt,
  range,
  reducedMotion,
  onRange,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly range: WeekRange;
  readonly reducedMotion: boolean;
  readonly onRange: (range: WeekRange) => void;
}) {
  const t = pack.trace;
  const [active, setActive] = useState<"start" | "end" | null>(null);
  const rows = useMemo(() => rowsIn(range), [range]);
  const landed = useMorph(rows.length, `${range.from}/${range.to}`, (a, b, share) => (share >= 1 ? b : Math.min(b, lerpNumber(0, b, share))), reducedMotion);
  const count = Math.floor(landed);
  const arrived = rows.slice(0, count);
  const bins = CRAFT_MODELS.map((model) => {
    const mine = arrived.filter((row) => row.model === model.code);
    return {
      ...model,
      units: mine.reduce((sum, row) => sum + row.units, 0),
      revenue: mine.reduce((sum, row) => sum + row.revenue, 0),
    };
  });
  const sum = bins.reduce((total, bin) => total + bin.revenue, 0);
  const done = count >= rows.length;
  const match = done && matchesReport(range);
  const maxBin = Math.max(1, ...bins.map((bin) => bin.revenue), REPORT.craftRevenueEur / 2.2);
  const landedIds = useMemo(() => new Set(arrived.map((row) => `${row.weekIndex}/${row.skuIndex}`)), [arrived]);
  const rangeText = (r: WeekRange) =>
    fmt.t(t.range, {
      from: fmt.date(WEEK_STARTS[r.from] as string),
      to: fmt.date(WEEK_STARTS[r.to] as string),
    });

  return (
    <div className="w02-trace" data-match={match ? "" : undefined}>
      <div className="w02-trace-head">
        <p className="w02-report-cell" data-w02-report-cell="">
          {fmt.t(t.reportCell, { eur: fmt.eur(REPORT.craftRevenueEur) })}
          {match ? (
            <span className="w02-check">
              <GlasIcon name="check" />
              <span className="sr-only">{t.reportMatch}</span>
            </span>
          ) : null}
        </p>
        <p className="w02-trace-sum" data-w02-trace-sum="">
          {fmt.t(t.readout, { rows: fmt.n(count), sum: fmt.eur(sum) })}
        </p>
      </div>
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="w02-carpet" role="group" aria-label={rangeText(range)}>
        <defs>
          <pattern id="w02-e2" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="3" height="3" className="w02-carpet-ground" />
            <line x1="0" y1="0" x2="0" y2="3" className="w02-carpet-ink" />
          </pattern>
          <pattern id="w02-g1" width="3" height="3" patternUnits="userSpaceOnUse">
            <rect width="3" height="3" className="w02-carpet-ground" />
            <circle cx="1.5" cy="1.5" r="0.8" className="w02-carpet-dot" />
          </pattern>
        </defs>
        {WEEK_STARTS.map((week, index) => (
          <text key={week} x={edgeX(index) + COL / 2} y={TOP - 14} textAnchor="middle" className="w02-carpet-week">
            {fmt.n(Number(week.slice(8, 10)))}.{fmt.n(Number(week.slice(5, 7)))}.
          </text>
        ))}
        <rect x={edgeX(range.from)} y={TOP - 4} width={edgeX(range.to + 1) - edgeX(range.from)} height={CARPET_H + 8} rx={6} className="w02-brush" />
        <g className="w02-carpet-rows">
          {TRACE_ROWS.map((row) => {
            const inside = row.weekIndex >= range.from && row.weekIndex <= range.to;
            return (
              <rect
                key={`${row.weekIndex}/${row.skuIndex}`}
                x={edgeX(row.weekIndex) + 2}
                y={TOP + row.skuIndex * ROW}
                width={COL - 4}
                height={ROW - 0.8}
                className="w02-carpet-row"
                data-model={row.model}
                data-in={inside ? "" : undefined}
                data-landed={landedIds.has(`${row.weekIndex}/${row.skuIndex}`) ? "" : undefined}
                fill={row.model === "E2" ? "url(#w02-e2)" : row.model === "G1" ? "url(#w02-g1)" : undefined}
              />
            );
          })}
        </g>
        <DataHandle
          x={edgeX(range.from)}
          y={TOP - 4}
          label={t.start}
          valueText={rangeText(range)}
          onActiveChange={(on) => setActive(on ? "start" : null)}
          onMove={(point) =>
            onRange(
              clampRange({
                from: Math.min(nearestEdge(point.x), range.to),
                to: range.to,
              }),
            )
          }
          onStep={(dx, dy) =>
            onRange(
              clampRange({
                from: Math.min(range.to, range.from + (dx || dy)),
                to: range.to,
              }),
            )
          }
        />
        <DataHandle
          x={edgeX(range.to + 1)}
          y={BOTTOM + 4}
          label={t.end}
          valueText={rangeText(range)}
          onActiveChange={(on) => setActive(on ? "end" : null)}
          onMove={(point) =>
            onRange(
              clampRange({
                from: range.from,
                to: Math.max(range.from, nearestEdge(point.x) - 1),
              }),
            )
          }
          onStep={(dx, dy) =>
            onRange(
              clampRange({
                from: range.from,
                to: Math.max(range.from, range.to + (dx || dy)),
              }),
            )
          }
        />
      </svg>
      {active ? (
        <div
          className="w02-trace-readout"
          style={{
            left: `${((active === "start" ? edgeX(range.from) : edgeX(range.to + 1)) / VIEW.w) * 100}%`,
          }}
        >
          <GlasReadout hidden>{rangeText(range)}</GlasReadout>
        </div>
      ) : null}
      <ul className="w02-bins" aria-label={fmt.t(t.legend, { e1: "E1", e2: "E2", g1: "G1" })}>
        {bins.map((bin) => (
          <li key={bin.code} className="w02-bin" data-model={bin.code} data-locked={match ? "" : undefined}>
            <span className="w02-bin-name">{fmt.t(t.bin, { model: bin.code, price: fmt.eur(bin.price) })}</span>
            <span className="w02-bin-bar" aria-hidden="true">
              <span
                style={{
                  transform: `scaleX(${Math.min(1, bin.revenue / maxBin)})`,
                }}
              />
            </span>
            <span className="w02-bin-value">{fmt.eur(bin.revenue)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

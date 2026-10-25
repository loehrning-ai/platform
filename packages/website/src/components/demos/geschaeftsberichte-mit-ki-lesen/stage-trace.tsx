"use client";

import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { CRAFT_SEP_ROWS, DEMAND_ROWS, REPORT } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { unitsShipped } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import {
  BIN_BOTTOM,
  BIN_TOP,
  BIN_X,
  binLanded,
  CHIP_SIZE,
  chipFlight,
  chipSource,
  chipTarget,
  ease,
  landedRows,
  lerp,
  span,
  TRACE_MODELS,
  TRACE_MS,
  TRACE_VIEW,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/timelines";
import { landedSum, traceGroups } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/trace";
import { fill, type Fmt } from "./fmt";
import { LINES_SECTION } from "./stage-weeks";

const pct = (value: number, of: number) => `${(value / of) * 100}%`;
/** A bin is this wide in viewBox units (nine chips and their gaps). */
const BIN_W = 98;

/**
 * Beat 4: CRAFT's September revenue traced to its 95 rows. The file count
 * falls from all rows to CRAFT's, the rows fly from the file at the bottom
 * into their model's bin, each bin writes its product (rows, units × list
 * price) once its last row has landed, and the sum adds only landed rows.
 */
export function StageTrace({
  pack,
  fmt,
  ms,
  started,
  onTrace,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  /** Milliseconds since the tap, 0 before it. */
  readonly ms: number;
  readonly started: boolean;
  readonly onTrace: () => void;
}) {
  const copy = pack.trace;
  const filter = ease(span(ms, 0, 500));
  const rows = Math.round(lerp(DEMAND_ROWS, CRAFT_SEP_ROWS.length, filter));
  const landed = landedRows(ms);
  const sum = landedSum(landed);
  const done = started && ms >= TRACE_MS;
  const groups = traceGroups();
  return (
    <div className="nw-trace">
      <div className="nw-top">
        <p className="nw-strip">{fill(copy.strip, { section: LINES_SECTION, units: fmt.n(unitsShipped("sep")) })}</p>
      </div>
      <p className="nw-trace-file">
        <button
          type="button"
          className="nw-figure-button"
          data-trace-figure=""
          aria-label={`${fmt.eur(REPORT.craftRevenueEur)}: ${copy.hint}`}
          onClick={onTrace}
        >
          {fmt.eur(REPORT.craftRevenueEur)}
        </button>
        <span className="nw-trace-rows">{fill(copy.file, { n: fmt.n(started ? rows : DEMAND_ROWS) })}</span>
      </p>
      <div className="nw-area">
        <svg className="nw-svg" viewBox={`0 0 ${TRACE_VIEW.width} ${TRACE_VIEW.height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {TRACE_MODELS.map((model) => (
            <line
              key={model}
              x1={BIN_X[model]}
              x2={BIN_X[model] + BIN_W}
              y1={BIN_TOP - 4}
              y2={BIN_TOP - 4}
              className="nw-track"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {CRAFT_SEP_ROWS.map(([model], index) => {
            const from = chipSource(index);
            const to = chipTarget(index);
            const share = ease(chipFlight(index, ms));
            return (
              <rect
                key={index}
                x={lerp(from.x, to.x, share)}
                y={lerp(from.y, to.y, share)}
                width={CHIP_SIZE}
                height={CHIP_SIZE}
                className={model === "E2" ? "nw-chip-fill" : model === "E1" ? "nw-chip-half" : "nw-chip-line"}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        {groups.map((group) => {
          const shown = started && binLanded(group.code, ms);
          return (
            <div key={group.code}>
              <p
                className="nw-bin-label"
                style={{ left: pct(BIN_X[group.code], TRACE_VIEW.width), width: pct(BIN_W, TRACE_VIEW.width), bottom: pct(TRACE_VIEW.height - BIN_TOP + 6, TRACE_VIEW.height) }}
              >
                {fill(copy.bin, { code: group.code, price: fmt.eur(group.price) })}
              </p>
              <p
                className="nw-bin-product"
                data-bin-product={group.code}
                data-show={shown ? "" : undefined}
                style={{ left: pct(BIN_X[group.code], TRACE_VIEW.width), width: pct(BIN_W + 8, TRACE_VIEW.width), top: pct(BIN_BOTTOM + 4, TRACE_VIEW.height) }}
              >
                <span>{fill(copy.binRows, { n: fmt.n(group.rows) })}</span>
                <span>{fill(copy.binTimes, { units: fmt.n(group.units), price: fmt.eur(group.price) })}</span>
                <strong>= {fmt.eur(group.revenue)}</strong>
              </p>
            </div>
          );
        })}
      </div>
      <p className="nw-sum" data-trace-sum="" data-done={done ? "" : undefined}>
        <span>{fill(copy.path.sum, { eur: fmt.eur(sum) })}</span>
        {done ? (
          <span className="nw-match">
            <span aria-hidden="true">✓ </span>
            {fill(copy.match, { section: LINES_SECTION })}
          </span>
        ) : null}
      </p>
    </div>
  );
}

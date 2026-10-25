"use client";

import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { CRAFT_WEEKS } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { growth, unitsShipped, weekCount, type Month } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import {
  MONTH_X,
  monthTop,
  WEEK_BASE_Y,
  WEEK_VIEW,
  weekFrame,
  type WeekView,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/timelines";
import { fill, type Fmt } from "./fmt";

/** Section 2 of the September report holds the line table with CRAFT's +22,4 %. */
export const LINES_SECTION = 2;
const MONTHS: readonly Month[] = ["aug", "sep"];
const pct = (value: number, of: number) => `${(value / of) * 100}%`;

/**
 * Beat 4: the nine CRAFT weeks of demand_actuals.csv. Month total stacks a
 * month's weeks into one column; per shipping week slides them together into
 * one bar at the mean: the fifth week is divided out, and the motion shows it.
 */
export function StageWeeks({
  pack,
  fmt,
  grow,
  from,
  to,
  share,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  /** Entry motion 0..1: the blocks rise from the baseline. */
  readonly grow: number;
  readonly from: WeekView;
  readonly to: WeekView;
  readonly share: number;
}) {
  const settled = share >= 1 ? to : null;
  return (
    <div className="nw-weeks">
      <div className="nw-top">
        <p className="nw-strip">{fill(pack.period.strip, { section: LINES_SECTION, g: fmt.pct(growth("month")) })}</p>
      </div>
      <p className="nw-file">demand_actuals.csv · CRAFT · units_actual</p>
      <div className="nw-area">
        <svg className="nw-svg" viewBox={`0 0 ${WEEK_VIEW.width} ${WEEK_VIEW.height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <line x1="6" x2={WEEK_VIEW.width - 6} y1={WEEK_BASE_Y + 1} y2={WEEK_BASE_Y + 1} className="nw-track" vectorEffect="non-scaling-stroke" />
          {CRAFT_WEEKS.map((week, index) => {
            const block = weekFrame(index, from, to, share, grow);
            const sep = week.start >= "2023-09";
            return (
              <rect
                key={week.start}
                x={block.x}
                y={block.y}
                width={block.w}
                height={Math.max(0, block.h)}
                className={sep ? "nw-week-sep" : "nw-week-aug"}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        {settled === "month" || settled === "week"
          ? MONTHS.map((month) => {
              const value = settled === "month" ? unitsShipped(month) : unitsShipped(month) / weekCount(month);
              return (
                <div
                  key={month}
                  className="nw-col-label"
                  style={{
                    left: pct(MONTH_X[month] - 18, WEEK_VIEW.width),
                    width: pct(100, WEEK_VIEW.width),
                    top: `calc(${pct(monthTop(month, settled), WEEK_VIEW.height)} - 2.6rem)`,
                  }}
                >
                  <strong data-week-value={month}>{fmt.n(value)}</strong>
                  {settled === "week" ? (
                    <span>{fill(pack.period.divided, { total: fmt.n(unitsShipped(month)), weeks: weekCount(month) })}</span>
                  ) : (
                    <span>{fill(pack.period.weeksIn, { w: weekCount(month) })}</span>
                  )}
                </div>
              );
            })
          : null}
        <div className="nw-month-axis" aria-hidden="true">
          {MONTHS.map((month) => (
            <span key={month} style={{ left: pct(MONTH_X[month] + 32, WEEK_VIEW.width) }}>
              {pack.months[month]}
            </span>
          ))}
        </div>
        {settled === "month" || settled === "week" ? (
          <p className="nw-delta" data-period-delta="">
            {fmt.pct(growth(settled))}
          </p>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { DataHandle, GlasReadout } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { WEEK_STARTS, type WeekStart } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import {
  addDays,
  daysCovered,
  demand,
  growthWith,
  weeklyUnits,
  weeksOf,
  type Month,
  type Period,
  type SeptemberEnds,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import type { Fmt } from "./fmt";
import { lerpNumber, useMorph } from "./use-morph";

const VIEW = { w: 360, h: 132 } as const;
const LEFT = 6;
const DAYS = 68;
const DAY = (VIEW.w - LEFT * 2) / DAYS;
const BASE = 104;
const BAR_MAX = 72;
const LAST_WEEK = WEEK_STARTS[WEEK_STARTS.length - 1] as WeekStart;
const DROP_AT = 12;

/** Days since 1 August 2023. */
function dayIndex(iso: string): number {
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));
  return (month === 8 ? 0 : month === 9 ? 31 : 61) + day - 1;
}
const dayX = (iso: string) => LEFT + dayIndex(iso) * DAY;
const MAX_UNITS = Math.max(...WEEK_STARTS.map(weeklyUnits));
const barHeight = (units: number) => (units / MAX_UNITS) * BAR_MAX;

function monthOfWeek(week: WeekStart, ends: SeptemberEnds): Month | "oct" {
  if (weeksOf("aug", ends).includes(week)) return "aug";
  if (weeksOf("sep", ends).includes(week)) return "sep";
  return "oct";
}

/**
 * Scene 4: the calendar from 1 August to 7 October, one hairline per day,
 * the nine shipping weeks as bars on their seven days. Lift the week from
 * 30 September into October (or use the arrow keys on it); "Je
 * Versandwoche" levels each month's bars to its mean.
 */
export function PeriodCalendar({
  pack,
  fmt,
  ends,
  period,
  reducedMotion,
  onEnds,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly ends: SeptemberEnds;
  readonly period: Period;
  readonly reducedMotion: boolean;
  readonly onEnds: (ends: SeptemberEnds) => void;
}) {
  const p = pack.period;
  const [offset, setOffset] = useState(0);
  const [active, setActive] = useState(false);
  const heights = useMemo(
    () =>
      WEEK_STARTS.map((week) => {
        const month = monthOfWeek(week, ends);
        return period === "week" && month !== "oct" ? barHeight(demand(month, "week", ends)) : barHeight(weeklyUnits(week));
      }),
    [ends, period],
  );
  const shown = useMorph(heights, `${ends}/${period}`, (a, b, t) => b.map((value, index) => lerpNumber(a[index] ?? value, value, t)), reducedMotion);
  const growth = useMorph(growthWith(ends, period), `${ends}/${period}`, lerpNumber, reducedMotion);
  const lastX = dayX(LAST_WEEK) + (7 * DAY) / 2;
  const lastTop = BASE - (shown[WEEK_STARTS.length - 1] ?? 0);
  const aug = daysCovered("aug", ends);
  const sep = daysCovered("sep", ends);
  const endsText = (value: SeptemberEnds) =>
    fmt.t(p.endValue, {
      date: fmt.date(value === "oct6" ? addDays(LAST_WEEK, 6) : addDays(LAST_WEEK, -1)),
    });

  return (
    <div className="w02-period">
      <p className="w02-big-readout" aria-live="polite">
        <span className="w02-big-label">{fmt.t(p.readout, { g: "" }).replace(/:\s*$/, "")}</span>
        <span className="w02-big-number" data-w02-growth="">
          {fmt.pct(growth)}
        </span>
      </p>
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="w02-calendar" role="group" aria-label={p.endLabel}>
        <defs>
          <pattern id="w02-cal-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="4" className="w02-hatch-line" />
          </pattern>
        </defs>
        {Array.from({ length: DAYS + 1 }, (_, day) => (
          <line key={day} x1={LEFT + day * DAY} x2={LEFT + day * DAY} y1={BASE - 4} y2={BASE} className="w02-day" />
        ))}
        <rect x={LEFT} y={BASE - BAR_MAX} width={4 * DAY} height={BAR_MAX} fill="url(#w02-cal-hatch)" className="w02-norows" />
        {[
          { iso: "2023-08-01", label: pack.monthOf.aug },
          { iso: "2023-09-01", label: pack.monthOf.sep },
          { iso: "2023-10-01", label: p.october },
        ].map(({ iso, label }) => (
          <g key={iso}>
            <line x1={dayX(iso)} x2={dayX(iso)} y1={10} y2={BASE + 2} className="w02-month-line" />
            <text x={dayX(iso) + 3} y={12} className="w02-month-label">
              {label}
            </text>
          </g>
        ))}
        {WEEK_STARTS.map((week, index) => {
          const month = monthOfWeek(week, ends);
          const height = shown[index] ?? 0;
          const isLast = week === LAST_WEEK;
          const shift = isLast && active ? offset : 0;
          return (
            <rect
              key={week}
              x={dayX(week) + 0.75 + shift}
              y={BASE - height}
              width={7 * DAY - 1.5}
              height={height}
              rx={2.5}
              className="w02-week"
              data-month={month}
              data-last={isLast ? "" : undefined}
              data-lifted={isLast && active ? "" : undefined}
            >
              <title>
                {fmt.t(p.bar, {
                  date: fmt.date(week),
                  units: fmt.n(weeklyUnits(week)),
                })}
              </title>
            </rect>
          );
        })}
        <line x1={dayX(aug.from)} x2={dayX(addDays(aug.to, 1))} y1={BASE + 10} y2={BASE + 10} className="w02-bracket" data-month="aug" />
        <line x1={dayX(sep.from)} x2={dayX(addDays(sep.to, 1))} y1={BASE + 18} y2={BASE + 18} className="w02-bracket" data-month="sep" />
        <DataHandle
          x={lastX + (active ? offset : 0)}
          y={Math.max(18, lastTop - 8)}
          label={fmt.t(p.handle, { date: fmt.date(LAST_WEEK) })}
          valueText={endsText(ends)}
          onActiveChange={(on) => {
            setActive(on);
            if (!on) setOffset(0);
          }}
          onMove={(point) => {
            const dx = Math.max(-40, Math.min(40, point.x - lastX));
            setOffset(dx);
            if (dx > DROP_AT && ends !== "sep29") onEnds("sep29");
            if (dx < -DROP_AT && ends !== "oct6") onEnds("oct6");
          }}
          onStep={(dx) => {
            if (dx > 0) onEnds("sep29");
            if (dx < 0) onEnds("oct6");
          }}
        />
      </svg>
      {active ? (
        <div className="w02-period-readout" style={{ left: `${((lastX + offset) / VIEW.w) * 100}%` }}>
          <GlasReadout hidden>
            {fmt.t(p.bar, {
              date: fmt.date(LAST_WEEK),
              units: fmt.n(weeklyUnits(LAST_WEEK)),
            })}
          </GlasReadout>
        </div>
      ) : null}
      <ul className="w02-brackets">
        <li data-month="aug">
          {fmt.t(p.bracket, {
            month: pack.monthOf.aug,
            from: fmt.date(aug.from),
            to: fmt.date(aug.to),
            days: aug.days,
          })}
        </li>
        <li data-month="sep">
          {fmt.t(p.bracket, {
            month: pack.monthOf.sep,
            from: fmt.date(sep.from),
            to: fmt.date(sep.to),
            days: sep.days,
          })}
        </li>
        <li data-month="none">{p.noRows}</li>
      </ul>
    </div>
  );
}

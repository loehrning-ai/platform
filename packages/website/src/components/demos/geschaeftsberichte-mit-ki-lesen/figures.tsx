"use client";

import { useId } from "react";
import { cx } from "@/components/werk";
import type { Locale } from "@/lib/i18n/locale";
import { MONTHS } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import type { NorthwindCopy } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy-types";
import { formatInt, formatPct } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/format";
import {
  STRIP,
  STRIP_SCALE,
  stripLabels,
  weekStripFrame,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/frames";
import type { CompareRow } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/logic";
import styles from "./northwind.module.css";

function safeId(raw: string): string {
  return `nw${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

const AUG = MONTHS["2023-08"];
const SEP = MONTHS["2023-09"];
const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
const AUG_TOTAL = sum(AUG.weeklyUnits);
const SEP_TOTAL = sum(SEP.weeklyUnits);
const AUG_AVG = AUG_TOTAL / AUG.weekStarts.length;
const SEP_AVG = SEP_TOTAL / SEP.weekStarts.length;

/** Frame x/y to a percentage of the strip box, for the HTML labels. */
const pctX = (x: number) => `${(x / STRIP.width) * 100}%`;
const pctY = (y: number) => `${(y / STRIP.height) * 100}%`;
/** Frame y the weekly number centres on: half way between the top and the columns. */
const WEEKLY_CENTRE_Y = 125;
/** Distance from the box bottom, so a label can stand on a frame y. */
const fromBottom = (y: number) => `${100 - (y / STRIP.height) * 100}%`;

/**
 * M1, the week strip: at p = 0 the report's view, two monthly stacks (the
 * +26 %); at p = 1 the nine week starts on one baseline, the 30.09 week
 * hatched. Pure geometry from weekStripFrame(p). The shapes scale with the
 * SVG; the labels are HTML at a constant 14 to 15px, placed by percentage, so
 * they stay readable on a phone and never outshout the copy at 1440.
 * aria-hidden, because the caption and the result say everything it shows.
 */
export function WeekStrip({ p, locale, copy }: { p: number; locale: Locale; copy: NorthwindCopy }) {
  const pattern = safeId(useId());
  const segments = weekStripFrame(p);
  const labels = stripLabels(p);
  const augAvgY = STRIP.baseline - AUG_AVG * STRIP_SCALE;
  const last = segments[segments.length - 1];
  const lastRight = labels.lastX + STRIP.columnWidth / 2;

  return (
    <div aria-hidden="true" className="pt-2" data-strip-p={p.toFixed(2)}>
      <div className="relative">
        <svg
          focusable="false"
          viewBox={`0 0 ${STRIP.width} ${STRIP.height}`}
          className="block h-auto w-full"
        >
          <defs>
            <pattern
              id={pattern}
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="3" height="8" className="fill-himbeere-tief" />
            </pattern>
          </defs>

          {/* The August weekly average, carried across: the weeks are flat. */}
          <line
            x1="24"
            x2={STRIP.width - 24}
            y1={augAvgY}
            y2={augAvgY}
            className="stroke-kobalt"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            opacity={labels.weekly}
          />

          {segments.map((segment) => (
            <rect
              key={segment.index}
              data-week={segment.index}
              x={segment.x}
              y={segment.y}
              width={segment.w}
              height={segment.h}
              strokeWidth="2"
              className={cx(
                segment.hatched
                  ? "stroke-himbeere-tief"
                  : segment.month === 0
                    ? "fill-card stroke-kobalt"
                    : "fill-kobalt stroke-kobalt",
              )}
              fill={segment.hatched ? `url(#${pattern})` : undefined}
            />
          ))}

          <line
            x1="12"
            x2={STRIP.width - 12}
            y1={STRIP.baseline + 1}
            y2={STRIP.baseline + 1}
            className="stroke-foreground"
            strokeWidth="2"
          />
        </svg>

        <div
          className="pointer-events-none absolute inset-0 text-[0.875rem] leading-tight text-foreground tabular-nums sm:text-[0.9375rem]"
          data-strip-labels
        >
          {[copy.compare.figureAug, copy.compare.figureSep].map((month, index) => (
            <span
              key={month}
              className="absolute -translate-x-1/2 whitespace-nowrap font-bold"
              style={{ left: pctX(labels.monthX[index]), top: pctY(STRIP.baseline + 10) }}
            >
              {month}
            </span>
          ))}

          {[AUG_TOTAL, SEP_TOTAL].map((total, index) => (
            <span
              key={total}
              className="absolute -translate-x-1/2 whitespace-nowrap font-bold"
              style={{
                left: pctX(labels.monthX[index]),
                bottom: fromBottom(labels.totalsY[index] - 8),
                opacity: labels.totals,
              }}
            >
              {formatInt(locale, total)}
            </span>
          ))}

          {/* The weekly view's one number, centred in the room above the columns. */}
          <span
            className="absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center whitespace-nowrap"
            style={{ top: pctY(WEEKLY_CENTRE_Y), opacity: labels.weekly }}
          >
            <span className="font-semibold text-muted-foreground">{copy.compare.figurePerWeek}</span>
            <span className="mt-1 text-[1.25rem] font-bold sm:text-[1.5rem]">
              {`${formatInt(locale, AUG_AVG)} → ${formatInt(locale, SEP_AVG)}`}
            </span>
          </span>

          <span
            className="absolute whitespace-nowrap font-bold text-himbeere-tief"
            style={{
              right: `${100 - (lastRight / STRIP.width) * 100}%`,
              bottom: fromBottom(last.y - 8),
              opacity: labels.weekly,
            }}
          >
            {copy.compare.figureFrom}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Station 1 bars                                                      */
/* ------------------------------------------------------------------ */

/** One shared scale for both bases, so per-week growth visibly collapses. */
const DOMAIN = { min: -0.05, max: 0.35 } as const;
const span = DOMAIN.max - DOMAIN.min;
const toPct = (value: number) => ((value - DOMAIN.min) / span) * 100;
const ZERO = toPct(0);

export function CompareBars({
  rows,
  locale,
  copy,
}: {
  rows: readonly CompareRow[];
  locale: Locale;
  copy: NorthwindCopy;
}) {
  return (
    <ul className="flex flex-col" data-testid="compare-bars">
      {rows.map((row) => {
        const value = Math.max(DOMAIN.min, Math.min(DOMAIN.max, row.value));
        const left = value >= 0 ? ZERO : toPct(value);
        const width = Math.abs(toPct(value) - ZERO);
        const negative = row.value < 0;
        const total = row.line === "TOTAL";
        return (
          <li
            key={row.line}
            data-row={row.line}
            className={cx(
              "grid min-h-9 grid-cols-[4.5rem_minmax(0,1fr)_4.75rem] items-center gap-x-3 border-b border-hairline last:border-b-0",
              total && "border-t-2 border-t-foreground",
            )}
          >
            <span className={cx("text-[0.9375rem]", (row.line === "CRAFT" || total) && "font-bold")}>
              {copy.lines[row.line]}
            </span>
            <span aria-hidden="true" className="relative block h-6">
              <span className="absolute inset-y-[-0.25rem] w-px bg-foreground" style={{ left: `${ZERO}%` }} />
              <span
                className={cx(
                  styles.bar,
                  negative
                    ? styles.hatch
                    : total
                      ? "border-2 border-kobalt bg-card"
                      : row.line === "CRAFT"
                        ? "border-2 border-foreground bg-kobalt"
                        : "bg-kobalt",
                )}
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            </span>
            <span
              className={cx(
                "text-right text-[0.9375rem] tabular-nums",
                negative ? "font-bold text-himbeere-tief" : "text-foreground",
                (row.line === "CRAFT" || total) && "font-bold",
              )}
            >
              {formatPct(locale, row.value)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

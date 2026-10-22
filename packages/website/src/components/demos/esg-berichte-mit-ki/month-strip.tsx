"use client";

import { useId, useRef } from "react";
import { BILLS_2025 } from "@/lib/demo-cases/esg-berichte-mit-ki/constants";
import { countFrame, septemberFrame } from "@/lib/demo-cases/esg-berichte-mit-ki/core";
import { useSeek, useSeenOnce } from "./use-seek";

/** Month initials; the same letters in German and English. */
const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"] as const;

const BASE = 122;
const HEIGHT = 92;
const STEP = 29;
const WIDTH = 21;
const LEFT = 8;
const SEPT = 8;

interface Props {
  /** "count": M1 on Friday's card. "september": M4 on Monday's reveal. */
  readonly mode: "count" | "september";
  readonly label: string;
  readonly noBill: string;
  readonly septLabel: string;
  /** The year line under the strip; M4 swaps it at t = 0.5, never a count-up. */
  readonly year: { readonly before: string; readonly after?: string };
}

/**
 * Twelve months of electricity. M1 counts the months: the bars rise one after
 * another and September stays a hatched slot with no bill. M4 brings the
 * September invoice: the slot fills to the tallest bar of the year. One scale
 * (41,200 kWh at the top) on both days, direct labels, no legend.
 */
export function MonthStrip({ mode, label, noBill, septLabel, year }: Props) {
  const pattern = `eb-hatch-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  // The clock starts only once the strip is 60 % in view: nobody misses it below the fold.
  const ref = useRef<HTMLDivElement>(null);
  const seen = useSeenOnce(ref, 0.6);
  const t = useSeek(mode === "count" ? 600 : 900, mode, seen);
  const bars = countFrame(BILLS_2025, mode === "count" ? t : 1);
  const sept = mode === "september" ? septemberFrame(t) : null;
  const gapOpacity = sept ? sept.hatchOpacity : (bars[SEPT]?.gapOpacity ?? 0);
  const septScale = sept ? sept.septScaleY : 0;
  const x = (index: number) => LEFT + index * STEP;

  return (
    <div ref={ref} className="eb-strip" data-mode={mode} data-t={t === 1 ? "end" : t === 0 ? "start" : "run"}>
      <svg viewBox="0 0 360 146" role="img" aria-label={label} className="eb-strip-svg">
        <defs>
          <pattern id={pattern} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#944d44" strokeWidth="2" />
          </pattern>
        </defs>
        <line x1="0" x2="360" y1={BASE} y2={BASE} stroke="#121212" strokeWidth="1.5" />
        {bars.map((bar, index) =>
          index === SEPT ? null : (
            <g key={bar.month} transform={`translate(${x(index)} ${BASE})`}>
              <rect
                x="0"
                y={-HEIGHT}
                width={WIDTH}
                height={HEIGHT}
                fill="#944d44"
                transform={`scale(1 ${bar.scaleY})`}
              />
            </g>
          ),
        )}
        <g transform={`translate(${x(SEPT)} ${BASE})`}>
          <rect
            x="0"
            y={-HEIGHT}
            width={WIDTH}
            height={HEIGHT}
            fill={`url(#${pattern})`}
            stroke="#944d44"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity={gapOpacity}
          />
          <rect
            x="0"
            y={-HEIGHT}
            width={WIDTH}
            height={HEIGHT}
            fill="#121212"
            transform={`scale(1 ${septScale})`}
          />
        </g>
        <text
          x={x(SEPT) + WIDTH / 2}
          y="16"
          textAnchor="middle"
          className="eb-strip-label"
          opacity={sept ? Math.max(1 - gapOpacity, 0) : gapOpacity}
        >
          {sept ? septLabel : noBill}
        </text>
        {MONTHS.map((month, index) => (
          <text
            key={`${month}-${index}`}
            x={x(index) + WIDTH / 2}
            y="141"
            textAnchor="middle"
            className="eb-strip-month"
            fontWeight={index === SEPT ? 700 : 400}
          >
            {month}
          </text>
        ))}
      </svg>
      <p className="eb-strip-year">
        {sept && sept.year === "after" && year.after ? year.after : year.before}
      </p>
    </div>
  );
}

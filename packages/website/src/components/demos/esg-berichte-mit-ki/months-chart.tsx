"use client";

import { useEffect, useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { keyToValue } from "@/components/demos/glas";
import { MONTHS_VIEW, monthsLayout, valueToY, yToValue } from "@/lib/demo-cases/esg-berichte-mit-ki/months-layout";
import type { BillRow } from "@/lib/demo-cases/esg-berichte-mit-ki/rules";

/*
 * The bill file as rows that become bars (months-layout.ts): the finger
 * scrubs t, every rectangle is a pure function of it. At the months end the
 * empty slots show, the doubled booking peeks out from under its twin, and in
 * scene 4 the late invoice fills September. Drawing only (aria-hidden parts);
 * the readout next to it says what it means.
 */

export interface ChartGuess {
  /** In the chart's unit (kWh for electricity), or null before a guess. */
  readonly value: number | null;
  readonly max: number;
  readonly step: number;
  readonly label: string;
  readonly valueText: (value: number) => string;
  readonly onChange: (value: number) => void;
}

export interface ChartFill {
  readonly month: number;
  readonly amount: number;
  readonly filled: boolean;
  /** Where the bar rises from (the guess), in the chart's unit. */
  readonly from: number;
}

export interface ChartGhost {
  readonly month: number;
  readonly amount: number;
  readonly tag: string;
  readonly kind: "guess" | "scale";
}

const SETTLE_MS = 420;
const smooth = (x: number) => x * x * (3 - 2 * x);

function svgPoint(svg: SVGSVGElement | null, clientX: number, clientY: number): { x: number; y: number } | null {
  const matrix = svg?.getScreenCTM();
  if (!svg || !matrix) return null;
  const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
  return { x: point.x, y: point.y };
}

export function MonthsChart({
  rows,
  year,
  t,
  scaleMax,
  monthLabels,
  label,
  twice,
  rowText,
  guess,
  fill,
  ghosts = [],
  dropTarget = false,
  className,
}: {
  readonly rows: readonly BillRow[];
  readonly year: number;
  readonly t: number;
  readonly scaleMax?: number;
  readonly monthLabels: readonly string[];
  readonly label: string;
  /** The tab on a doubled booking: „doppelt". */
  readonly twice: string;
  readonly rowText: (row: BillRow) => string;
  readonly guess?: ChartGuess;
  readonly fill?: ChartFill;
  readonly ghosts?: readonly ChartGhost[];
  /** The empty September slot is a drop zone for the invoice photo. */
  readonly dropTarget?: boolean;
  readonly className?: string;
}) {
  const svg = useRef<SVGSVGElement | null>(null);
  const layout = monthsLayout(rows, year, t, scaleMax);
  // The month labels fade in over the last part of the morph (t = 1 gives 0.9999…, so the guess checks t itself).
  const reveal = Math.max(0, Math.min(1, (t - 0.55) / 0.45));
  const guessSlot = guess ? layout.slots[8] : undefined;
  const fillSlot = fill ? layout.slots[fill.month - 1] : undefined;

  const guessFrom = (event: ReactPointerEvent<SVGGElement>) => {
    if (!guess) return;
    const point = svgPoint(svg.current, event.clientX, event.clientY);
    if (point) guess.onChange(Math.round(yToValue(point.y, layout) / guess.step) * guess.step);
  };
  const guessKey = (event: KeyboardEvent<SVGGElement>) => {
    if (!guess) return;
    const next = keyToValue(event.key, guess.value ?? 0, 0, guess.max, guess.step, guess.step * 10);
    if (next === null) return;
    event.preventDefault();
    guess.onChange(next);
  };

  return (
    <svg
      ref={svg}
      className={`w4-months${className ? ` ${className}` : ""}`}
      viewBox={`0 0 ${MONTHS_VIEW.w} ${MONTHS_VIEW.h}`}
      role="group"
      aria-label={label}
      data-end={t >= 0.5 ? "months" : "rows"}
    >
      <g aria-hidden="true">
        <line x1="4" x2={MONTHS_VIEW.w - 4} y1={layout.baseline} y2={layout.baseline} className="w4-months-axis" opacity={reveal} />
        {layout.slots.map((slot) => (
          <g key={slot.month} opacity={reveal}>
            <text x={slot.x + slot.w / 2} y={layout.baseline + 15} className="w4-months-label" textAnchor="middle">
              {monthLabels[slot.month - 1]}
            </text>
            {slot.missing && !(fill?.filled && fill.month === slot.month) ? (
              <rect
                x={slot.barX - 1}
                y={layout.chartTop + 12}
                width={slot.barW + 2}
                height={layout.baseline - layout.chartTop - 12}
                rx="6"
                className="w4-months-slot"
                data-w4-month-slot={slot.month}
                data-drop={dropTarget && slot.month === 9 ? "" : undefined}
              />
            ) : null}
          </g>
        ))}
        {layout.items.map((item) => (
          <g key={`${item.index}`} data-kind={item.kind}>
            <rect x={item.x} y={item.y} width={item.w} height={item.h} rx={2 + item.p * 3} className="w4-months-row" data-kind={item.kind} data-stack={item.stack} />
            {item.p < 0.4 ? (
              <text x={item.x + 6} y={item.y + item.h / 2} className="w4-months-rowtext" dominantBaseline="middle" opacity={1 - item.p * 2.5}>
                {rowText(item.row)}
              </text>
            ) : null}
            {item.kind === "duplicate" && item.p > 0.9 ? (
              <g className="w4-months-twin">
                {/* Wide enough for the word (about 4.6 units per letter at 7.5px bold). */}
                <rect x={item.x + item.w / 2 - Math.max(item.w + 12, twice.length * 4.6 + 10) / 2} y={item.y - 15} width={Math.max(item.w + 12, twice.length * 4.6 + 10)} height="12" rx="6" />
                <text x={item.x + item.w / 2} y={item.y - 8.5} textAnchor="middle" dominantBaseline="middle">
                  {twice}
                </text>
              </g>
            ) : null}
          </g>
        ))}
        {fill && fillSlot ? (
          <rect
            x={fillSlot.barX}
            y={valueToY(fill.amount, layout)}
            width={fillSlot.barW}
            height={layout.baseline - valueToY(fill.amount, layout)}
            rx="5"
            className="w4-months-fill"
            data-filled={fill.filled ? "" : undefined}
            style={{ transform: `scaleY(${fill.filled ? 1 : Math.max(0.001, Math.min(1, fill.from / fill.amount))})` }}
          />
        ) : null}
        {ghosts.map((ghost) => {
          const slot = layout.slots[ghost.month - 1];
          if (!slot) return null;
          const y = valueToY(ghost.amount, layout);
          return (
            <g key={ghost.kind} className="w4-months-ghost" data-kind={ghost.kind}>
              <line x1={slot.barX - 6} x2={slot.barX + slot.barW + 6} y1={y} y2={y} />
              <text x={slot.barX + slot.barW + 9} y={y} dominantBaseline="middle">
                {ghost.tag}
              </text>
            </g>
          );
        })}
      </g>
      {guess && guessSlot && t >= 1 ? (
        <g
          className="w4-months-guess"
          role="slider"
          tabIndex={0}
          aria-label={guess.label}
          aria-valuemin={0}
          aria-valuemax={guess.max}
          aria-valuenow={guess.value ?? 0}
          aria-valuetext={guess.valueText(guess.value ?? 0)}
          onKeyDown={guessKey}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture?.(event.pointerId);
            guessFrom(event);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture?.(event.pointerId)) guessFrom(event);
          }}
          data-w4-guess=""
        >
          <rect x={guessSlot.x} y={layout.chartTop - 8} width={guessSlot.w} height={layout.baseline - layout.chartTop + 8} className="w4-months-guess-hit" />
          {guess.value !== null ? (
            <rect
              x={guessSlot.barX}
              y={valueToY(guess.value, layout)}
              width={guessSlot.barW}
              height={layout.baseline - valueToY(guess.value, layout)}
              rx="5"
              className="w4-months-guess-bar"
            />
          ) : null}
          <circle cx={guessSlot.barX + guessSlot.barW / 2} cy={valueToY(guess.value ?? 0, layout)} r="9" className="w4-months-guess-knob" />
          <path
            d={`M${guessSlot.barX + guessSlot.barW / 2 - 4} ${valueToY(guess.value ?? 0, layout) - 1.5}l4 -3.5l4 3.5M${guessSlot.barX + guessSlot.barW / 2 - 4} ${valueToY(guess.value ?? 0, layout) + 1.5}l4 3.5l4 -3.5`}
            className="w4-months-guess-arrows"
          />
        </g>
      ) : null}
    </svg>
  );
}

/**
 * The capsule under the file that the finger pulls: down orders the rows by
 * month, up turns them back into rows. A tap (or Enter) runs it to the other
 * end; letting go settles at the nearer end.
 */
export function MorphGrabber({
  t,
  onChange,
  label,
  valueText,
  text,
  reducedMotion,
}: {
  readonly t: number;
  readonly onChange: (t: number) => void;
  readonly label: string;
  readonly valueText: (t: number) => string;
  readonly text: string;
  readonly reducedMotion: boolean;
}) {
  const drag = useRef<{ y: number; t: number; moved: boolean; id: number } | null>(null);
  const frame = useRef<number | null>(null);
  const latest = useRef({ t, onChange });
  useEffect(() => {
    latest.current = { t, onChange };
  });
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const settle = (to: number) => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    const from = latest.current.t;
    if (reducedMotion || from === to) {
      latest.current.onChange(to);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const share = Math.min(1, (now - start) / SETTLE_MS);
      latest.current.onChange(from + (to - from) * smooth(share));
      frame.current = share < 1 ? requestAnimationFrame(step) : null;
    };
    frame.current = requestAnimationFrame(step);
  };

  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      settle(t < 0.5 ? 1 : 0);
      return;
    }
    const next = keyToValue(event.key, Math.round(t * 100), 0, 100, 10, 50);
    if (next === null) return;
    event.preventDefault();
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    onChange(next / 100);
  };

  return (
    <div
      className="w4-grabber"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(t * 100)}
      aria-valuetext={valueText(t)}
      aria-orientation="vertical"
      data-end={t >= 0.5 ? "months" : "rows"}
      data-w4-grabber=""
      onKeyDown={keys}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        drag.current = { y: event.clientY, t, moved: false, id: event.pointerId };
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        const begun = drag.current;
        if (!begun || begun.id !== event.pointerId) return;
        const dy = event.clientY - begun.y;
        if (!begun.moved && Math.abs(dy) < 6) return;
        begun.moved = true;
        onChange(Math.min(1, Math.max(0, begun.t + dy / 160)));
      }}
      onPointerUp={(event) => {
        const begun = drag.current;
        drag.current = null;
        if (!begun || begun.id !== event.pointerId) return;
        settle(begun.moved ? (latest.current.t >= 0.5 ? 1 : 0) : begun.t < 0.5 ? 1 : 0);
      }}
      onPointerCancel={() => {
        drag.current = null;
        settle(latest.current.t >= 0.5 ? 1 : 0);
      }}
    >
      <span className="w4-grabber-bar" aria-hidden="true" />
      <span className="w4-grabber-text">{text}</span>
    </div>
  );
}

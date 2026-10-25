"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { HOLE } from "@/lib/demo-cases/esg-berichte-mit-ki/data";
import { clamp, formatNumber, round } from "@/lib/demo-cases/esg-berichte-mit-ki/numbers";
import { fill } from "@/lib/demo-cases/esg-berichte-mit-ki/takeaways";
import type { DemoPack, IntroFrame, MonthCell, SceneFrame } from "@/lib/demo-cases/esg-berichte-mit-ki/types";
import { BAR_WIDTH, PITCH } from "./strip";

const VIEW_W = PITCH * 12;
const VIEW_H = 150;
const BASE = 144;
const TOP = 8;
const PLOT = BASE - TOP;
const PAD = (PITCH - BAR_WIDTH) / 2;

export interface HoleControl {
  /** 1..12 */
  readonly month: number;
  readonly guess: number | null;
  readonly locked: boolean;
  readonly scene: SceneFrame;
  readonly onGuess: (value: number) => void;
  readonly onCommit: (value: number) => void;
}

interface Props {
  readonly pack: DemoPack;
  readonly cells: readonly MonthCell[];
  readonly unit: string;
  readonly digits: number;
  readonly axisMax: number;
  readonly intro: IntroFrame;
  readonly hole?: HoleControl;
}

const MIN_GUESS = 0;
const MAX_GUESS = HOLE.axisMax;
/** Where the idle handle waits, mid-plot. */
const IDLE_LEVEL = 21;
/** A press within this many px of the handle grabs it instead of jumping. */
const GRAB_PX = 30;

interface Grab {
  readonly y0: number;
  readonly v0: number;
  readonly relative: boolean;
  readonly ppu: number;
  moved: boolean;
}

/**
 * Twelve bars on one axis. With `hole`, one month is a slot the visitor fills:
 * drag (pointer or touch) or the arrow keys; the same slot later shows the
 * real bill, the guess as a ghost outline and the distance between them. No
 * average, no maximum, no ruler: they would spoil the guess. Text lives in
 * HTML around the SVG so it never scales below 12 px.
 */
export function MonthChart({ pack, cells, unit, digits, axisMax, intro, hole }: Props) {
  const plotRef = useRef<HTMLDivElement>(null);
  const grab = useRef<Grab | null>(null);
  const [grabbed, setGrabbed] = useState(false);
  const scale = PLOT / axisMax;
  const yOf = (value: number) => BASE - value * scale;
  const column = (index: number) => index * PITCH;

  const holeIndex = hole ? hole.month - 1 : -1;
  const guess = hole?.guess ?? null;
  const frame = hole?.scene;
  const showGuess = guess !== null && guess > 0;
  const bracket = showGuess && frame && frame.ghost > 0 ? Math.abs(HOLE.truth - (guess as number)) >= 0.05 : false;

  function valueAt(clientY: number): number {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect || rect.height === 0) return 0;
    const y = ((clientY - rect.top) / rect.height) * VIEW_H;
    return round(clamp((BASE - y) / (PLOT / HOLE.axisMax), MIN_GUESS, MAX_GUESS), 1);
  }

  /*
   * Touch drags the handle relative to where it stands, so the guess never
   * leaps under the finger. A mouse press away from the handle sets the value
   * there (a click on a chart); a press on the handle grabs it.
   */
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!hole || hole.locked) return;
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect || rect.height === 0) return;
    const ppu = (rect.height / VIEW_H) * (PLOT / HOLE.axisMax);
    const level = guess !== null && guess > 0 ? guess : IDLE_LEVEL;
    const near = Math.abs(valueAt(event.clientY) - level) * ppu <= GRAB_PX;
    const relative = event.pointerType === "touch" || near;
    grab.current = { y0: event.clientY, v0: level, relative, ppu, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus({ preventScroll: true });
    setGrabbed(true);
    if (!relative) hole.onGuess(valueAt(event.clientY));
  }
  function nextValue(state: Grab, clientY: number): number {
    if (!state.relative) return valueAt(clientY);
    return round(clamp(state.v0 + (state.y0 - clientY) / state.ppu, MIN_GUESS, MAX_GUESS), 1);
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const state = grab.current;
    if (!hole || !state) return;
    if (Math.abs(event.clientY - state.y0) > 3) state.moved = true;
    if (state.relative && !state.moved) return;
    hole.onGuess(nextValue(state, event.clientY));
  }
  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const state = grab.current;
    if (!hole || !state) return;
    grab.current = null;
    setGrabbed(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    // A tap on the idle handle makes a first guess, so a tap is never a dead end.
    const value = state.relative && !state.moved && !showGuess ? IDLE_LEVEL : nextValue(state, event.clientY);
    if (value !== (guess ?? 0)) hole.onGuess(value);
    hole.onCommit(value);
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!hole || hole.locked) return;
    const now = hole.guess ?? 0;
    const steps: Readonly<Record<string, number>> = {
      ArrowUp: 0.5, ArrowRight: 0.5, ArrowDown: -0.5, ArrowLeft: -0.5, PageUp: 5, PageDown: -5,
    };
    let next: number | null = null;
    if (event.key in steps) next = now + (steps[event.key] as number);
    else if (event.key === "Home") next = MIN_GUESS;
    else if (event.key === "End") next = MAX_GUESS;
    if (next === null) return;
    event.preventDefault();
    hole.onGuess(round(clamp(next, MIN_GUESS, MAX_GUESS), 1));
  }

  const pct = (y: number) => `${(y / VIEW_H) * 100}%`;
  const holeLeft = hole ? `${((holeIndex + 0.5) / 12) * 100}%` : "0";
  const guessText = formatNumber(guess ?? 0, pack.locale, 1);
  const idle = hole && !showGuess && !hole.locked;
  const level = showGuess ? (guess as number) : IDLE_LEVEL;
  const handleTop = pct(yOf(level));

  return (
    <div className="esg-plot" ref={plotRef} role="group" aria-label={pack.chart.aria} data-grab={grabbed ? "" : undefined}>
      <svg className="esg-plot__svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" focusable="false">
        <defs>
          <pattern id="esg-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="var(--esg-paper)" />
            <rect width="2" height="6" fill="var(--esg-ink)" />
          </pattern>
        </defs>
        <line x1={0} x2={VIEW_W} y1={BASE + 0.5} y2={BASE + 0.5} stroke="var(--esg-ink)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {cells.map((cell, index) => {
          if (index === holeIndex) return null;
          const x = column(index) + PAD;
          const rise = intro.bars[index] ?? 1;
          const label =
            cell.value === null
              ? fill(pack.chart.barMissingAria, { month: pack.months[index] ?? "" })
              : fill(pack.chart.barAria, { month: pack.months[index] ?? "", x: formatNumber(cell.value, pack.locale, digits), unit });
          if (cell.value === null) {
            return (
              <g key={cell.month} role="img" aria-label={label}>
                <rect x={x} y={TOP} width={BAR_WIDTH} height={PLOT} fill="none" stroke="var(--esg-mark)" strokeWidth={2} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" opacity={0.7 * rise} />
              </g>
            );
          }
          const full = cell.value * scale;
          // A value far above the axis (a unit slip such as 21.400 among 20,6) is cut at the top of the plot, in
          // Mennige behind a slanted break, so one number does not flatten the other eleven.
          const cut = full > PLOT + 0.5;
          const height = Math.max(0, Math.min(full, PLOT) * rise);
          return (
            <g key={cell.month} role="img" aria-label={label}>
              {cut && rise >= 1 ? (
                <>
                  <rect x={x} y={BASE - height} width={BAR_WIDTH} height={height} fill="var(--esg-ink)" />
                  <polygon points={`${x},${TOP + 17} ${x + BAR_WIDTH},${TOP + 11} ${x + BAR_WIDTH},${TOP + 16} ${x},${TOP + 22}`} fill="var(--esg-paper)" />
                  <polygon points={`${x},${TOP} ${x + BAR_WIDTH},${TOP} ${x + BAR_WIDTH},${TOP + 11} ${x},${TOP + 17}`} fill="var(--esg-mark)" />
                </>
              ) : null}
              {cut && rise >= 1 ? null : cell.state === "estimate" ? (
                <rect x={x} y={BASE - height} width={BAR_WIDTH} height={height} fill="url(#esg-hatch)" stroke="var(--esg-ink)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
              ) : (
                <rect x={x} y={BASE - height} width={BAR_WIDTH} height={height} fill="var(--esg-ink)" />
              )}
            </g>
          );
        })}
        {hole && frame ? (
          <g>
            <rect
              x={column(holeIndex) + PAD}
              y={TOP}
              width={BAR_WIDTH}
              height={PLOT}
              fill="none"
              stroke="var(--esg-mark)"
              strokeWidth={2}
              strokeDasharray="5 4"
              vectorEffect="non-scaling-stroke"
              opacity={(1 - clamp(frame.barHeight / HOLE.truth, 0, 1)) * (0.5 + 0.5 * intro.pulse) * intro.hole}
            />
            {showGuess ? (
              <rect
                x={column(holeIndex) + PAD}
                y={yOf(guess as number)}
                width={BAR_WIDTH}
                height={(guess as number) * scale}
                fill="url(#esg-hatch)"
                stroke="var(--esg-ink)"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
                opacity={1 - frame.ghost * 0.55}
              />
            ) : null}
            {frame.barHeight > 0 ? (
              <rect
                x={column(holeIndex) + PAD}
                y={yOf(frame.barHeight)}
                width={BAR_WIDTH}
                height={frame.barHeight * scale}
                fill="var(--esg-mark)"
              />
            ) : null}
            {showGuess && frame.ghost > 0 ? (
              <rect
                x={column(holeIndex) + PAD - 1}
                y={yOf(guess as number)}
                width={BAR_WIDTH + 2}
                height={(guess as number) * scale}
                fill="none"
                stroke="var(--esg-ink)"
                strokeWidth={2.5}
                strokeDasharray="6 3"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            {bracket ? (
              <g stroke="var(--esg-ink)" strokeWidth={2} vectorEffect="non-scaling-stroke" opacity={frame.ghost}>
                <line x1={column(holeIndex) + PITCH - 0.5} x2={column(holeIndex) + PITCH - 0.5} y1={yOf(guess as number)} y2={yOf(HOLE.truth)} vectorEffect="non-scaling-stroke" />
                <line x1={column(holeIndex) + PITCH - 4} x2={column(holeIndex) + PITCH + 3} y1={yOf(guess as number)} y2={yOf(guess as number)} vectorEffect="non-scaling-stroke" />
                <line x1={column(holeIndex) + PITCH - 4} x2={column(holeIndex) + PITCH + 3} y1={yOf(HOLE.truth)} y2={yOf(HOLE.truth)} vectorEffect="non-scaling-stroke" />
              </g>
            ) : null}
          </g>
        ) : null}
      </svg>
      {hole && frame && frame.sheetOpacity > 0 ? (
        <div className="esg-sheet" aria-hidden="true" style={{ left: holeLeft, top: pct(yOf(frame.sheetBottom)), opacity: frame.sheetOpacity }}>
          <span className="esg-sheet__no">{HOLE.invoiceNo}</span>
          <span className="esg-sheet__val">{formatNumber(HOLE.truth, pack.locale, 1)} {unit}</span>
        </div>
      ) : null}
      {bracket && frame && frame.offLabel > 0 ? (
        <p className="esg-off" aria-hidden="true" style={{ left: holeLeft, top: pct(yOf(Math.max(guess as number, HOLE.truth))), opacity: frame.offLabel }}>
          {fill(pack.chart.off, { x: formatNumber(Math.abs(HOLE.truth - (guess as number)), pack.locale, 1), unit })}
        </p>
      ) : null}
      {hole ? (
        <div
          className="esg-slot"
          style={{ left: holeLeft }}
          role="slider"
          tabIndex={0}
          aria-label={`${pack.chart.holeAria} ${fill(pack.chart.valueAria, { unit })}`}
          aria-orientation="vertical"
          aria-valuemin={MIN_GUESS}
          aria-valuemax={MAX_GUESS}
          aria-valuenow={guess ?? 0}
          aria-valuetext={showGuess ? fill(pack.chart.holeValue, { x: guessText, unit }) : pack.chart.holeNone}
          aria-readonly={hole.locked ? true : undefined}
          data-locked={hole.locked ? "" : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
        />
      ) : null}
      {hole && !hole.locked ? (
        <>
          <span
            className="esg-grip"
            style={{
              left: holeLeft,
              top: handleTop,
              transform: `translate(-50%, calc(-50% - ${idle ? intro.pulse * 5 : 0}px))`,
              opacity: intro.hole,
            }}
            aria-hidden="true"
            data-idle={idle ? "" : undefined}
          >
            <svg viewBox="0 0 12 22" className="esg-grip__arrows" focusable="false">
              <path d="M6 1l5 7H1z M6 21l5-7H1z" fill="currentColor" />
            </svg>
          </span>
          <span className="esg-flag" style={{ left: holeLeft, opacity: intro.hole }} aria-hidden="true" data-idle={idle ? "" : undefined}>
            {showGuess ? guessText : pack.chart.drag}
          </span>
        </>
      ) : null}
    </div>
  );
}

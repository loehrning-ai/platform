"use client";

import { useId, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { capAt, GUTTER, HANDLE, yOf, type Frame } from "./geometry";

interface Props {
  readonly frame: Frame;
  readonly cap: number;
  readonly detents: readonly number[];
  readonly label: string;
  /** Spoken once after the label: which keys do what. */
  readonly hint: string;
  readonly valueText: string;
  /** The line's value, printed on the handle. */
  readonly display: string;
  /** The intro's ghost finger rides on the handle. */
  readonly ghost: boolean;
  /** Called on every change; `final` is true on pointer release and after a key press. */
  readonly onChange: (cap: number, final: boolean) => void;
  /** The visitor touched the control: the intro hands over. */
  readonly onTouch: () => void;
}

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

/** An arrow lands on a mark it crosses or comes within this many units of. */
export const KEY_MAGNET = 8;

/**
 * Where an arrow step from `from` to `to` really lands: on the nearest mark
 * the step crosses or ends within KEY_MAGNET units of (in the direction of
 * travel), else on `to`. The mark the line already sits on never holds it.
 */
export function magnet(
  from: number,
  to: number,
  detents: readonly number[],
): number {
  const up = to > from;
  const hits = detents.filter((detent) =>
    up
      ? detent > from && detent <= to + KEY_MAGNET
      : detent < from && detent >= to - KEY_MAGNET,
  );
  if (hits.length === 0) return to;
  return hits.reduce((best, detent) =>
    Math.abs(detent - from) < Math.abs(best - from) ? detent : best,
  );
}

/** The next mark above (dir 1) or below (dir -1) the value, wrapping around the ends. */
export function nextDetent(
  value: number,
  detents: readonly number[],
  dir: 1 | -1,
): number {
  const sorted = [...new Set(detents)].sort((a, b) => a - b);
  if (sorted.length === 0) return value;
  if (dir === 1)
    return sorted.find((detent) => detent > value + 0.5) ?? (sorted[0] as number);
  return (
    [...sorted].reverse().find((detent) => detent < value - 0.5) ??
    (sorted[sorted.length - 1] as number)
  );
}

/**
 * The right gutter: a strip that takes vertical drags (touch-action: none
 * only here, so the page still scrolls everywhere else) and the 48 px
 * handle, a real slider for keyboard and screen reader users.
 */
export function LineHandle({
  frame,
  cap,
  detents,
  label,
  hint,
  valueText,
  display,
  ghost,
  onChange,
  onTouch,
}: Props) {
  const hintId = useId();
  const grab = useRef(0);
  const dragging = useRef(false);
  const range = frame.hi - frame.lo;
  const small = range >= 400 ? 10 : Math.max(1, Math.round(range / 100));

  const localY = (event: PointerEvent<HTMLDivElement>) =>
    event.clientY - event.currentTarget.getBoundingClientRect().top;

  const down = (event: PointerEvent<HTMLDivElement>) => {
    onTouch();
    const y = localY(event);
    const handleY = yOf(frame, cap);
    grab.current = Math.abs(y - handleY) <= HANDLE / 2 ? handleY - y : 0;
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange(capAt(frame, y + grab.current, detents), false);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    onChange(capAt(frame, localY(event) + grab.current, detents), false);
  };
  const up = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    onChange(capAt(frame, localY(event) + grab.current, detents), true);
  };

  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? small * 5 : small;
    let next: number | null = null;
    switch (event.key) {
      case "ArrowUp":
      case "ArrowRight":
        next = magnet(cap, cap + step, detents);
        break;
      case "ArrowDown":
      case "ArrowLeft":
        next = magnet(cap, cap - step, detents);
        break;
      case "PageUp":
        next = magnet(cap, cap + small * 10, detents);
        break;
      case "PageDown":
        next = magnet(cap, cap - small * 10, detents);
        break;
      case "Home":
        next = frame.lo;
        break;
      case "End":
        next = frame.hi;
        break;
      case "Enter":
        // Every mark in turn (Shift: backwards), wrapping at the ends, so a
        // keyboard visitor lands on Prognose and the best value without chips.
        next = nextDetent(cap, detents, event.shiftKey ? -1 : 1);
        break;
    }
    if (next === null) return;
    event.preventDefault();
    onTouch();
    onChange(clamp(Math.round(next), frame.lo, frame.hi), true);
  };

  return (
    <div
      className="hw-gutter"
      style={{ width: GUTTER, height: frame.H }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <span id={hintId} className="hw-sr">
        {hint}
      </span>
      <div
        className="hw-handle"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-describedby={hintId}
        aria-orientation="vertical"
        aria-valuemin={frame.lo}
        aria-valuemax={frame.hi}
        aria-valuenow={Math.round(cap)}
        aria-valuetext={valueText}
        style={{
          top: yOf(frame, cap) - HANDLE / 2,
          height: HANDLE,
          width: HANDLE,
        }}
        onKeyDown={key}
        onFocus={onTouch}
      >
        <svg
          viewBox="0 0 24 14"
          width="22"
          height="13"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M12 0l7 6H5zM12 14l-7-6h14z" />
        </svg>
        <span className="hw-handle-value" aria-hidden="true">
          {display}
        </span>
      </div>
      {ghost ? (
        <svg
          className="hw-ghost"
          viewBox="0 0 28 36"
          width="28"
          height="36"
          aria-hidden="true"
          focusable="false"
          style={{ top: yOf(frame, cap) + 14 }}
        >
          <path d="M9 1.5h5v14h2.5V11h4.5v4.5h1.5V13.5H27v16l-4 6H11.5L4 25l3-3 2 2z" />
        </svg>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { cx } from "@/components/werk/cx";
import { ESCAPE_PRIORITY, pushEscapeLayer } from "./escape-stack";
import { useGlas } from "./glas-root";
import { GlasReadout } from "./readout";
import { keyToValue, lensTransform, pointerToValue, valueToShare } from "./slider-math";

export interface SliderTick {
  readonly value: number;
  /** Printed under the track; label only min, max and the kit default. */
  readonly label?: string;
}

const THUMB_HALF = 19;
const LENS_W = 64;
const LENS_H = 44;
/** Delay of the spoken result after a release (glass-spec 4.4). */
export const SLIDER_ANNOUNCE_MS = 500;

function Track({ share, ticks, min, max }: { readonly share: number; readonly ticks: readonly SliderTick[]; readonly min: number; readonly max: number }) {
  return (
    <div className="glas-slider-track">
      <div className="glas-slider-fill" style={{ width: `${share * 100}%` }} />
      {ticks.map((tick) => (
        <span key={tick.value} className="glas-slider-tick" style={{ left: `${valueToShare(tick.value, min, max) * 100}%` }} />
      ))}
    </div>
  );
}

/**
 * Slider with a lens thumb (glass-spec 4.4). At rest the thumb is a Bogen
 * capsule; while dragged it becomes clear glass, grows, and shows the track
 * magnified 1.25x under it, with the value floating above the finger.
 * Keyboard: arrows one step, PageUp/PageDown ten, Home/End. Escape during a
 * drag puts the value back. `announce` speaks the resulting sentence 500ms
 * after a release ("Angebot B liegt jetzt vorne.").
 */
export function GlasSlider({
  label,
  value,
  min,
  max,
  step = 1,
  bigStep,
  onChange,
  onCommit,
  format,
  valueText,
  announce,
  ticks = [],
  disabled,
  className,
  hint,
}: {
  /** What you change plus the unit: "Kosten für ein übriges Glas, in Euro". */
  readonly label: ReactNode;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly bigStep?: number;
  readonly onChange: (value: number) => void;
  /** After a release or a key press. */
  readonly onCommit?: (value: number) => void;
  /** The visible value ("0,40 €"). */
  readonly format: (value: number) => string;
  /** The value as a phrase for screen readers ("40 Cent je Glas"). */
  readonly valueText: (value: number) => string;
  /** The result sentence spoken after a release. */
  readonly announce?: (value: number) => string;
  readonly ticks?: readonly SliderTick[];
  readonly disabled?: boolean;
  readonly className?: string;
  /** One sentence under the slider (what changes when you move it). */
  readonly hint?: ReactNode;
}) {
  const id = useId();
  const { reducedMotion, noteDrag } = useGlas();
  const hit = useRef<HTMLDivElement | null>(null);
  const thumb = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(false);
  const [spoken, setSpoken] = useState("");
  const dragStart = useRef<number | null>(null);
  const pointerId = useRef<number | null>(null);
  const latest = useRef(value);
  latest.current = value;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const element = hit.current;
    if (!element) return;
    setWidth(element.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const speak = (next: number) => {
    if (!announce) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSpoken(announce(next)), SLIDER_ANNOUNCE_MS);
  };
  const commit = (next: number) => {
    onCommit?.(next);
    speak(next);
  };

  // Escape during a drag: back to where the drag began.
  useEffect(() => {
    if (!active) return;
    return pushEscapeLayer(ESCAPE_PRIORITY.drag, () => {
      const start = dragStart.current;
      if (start !== null) onChange(start);
      if (pointerId.current !== null) hit.current?.releasePointerCapture?.(pointerId.current);
      pointerId.current = null;
      dragStart.current = null;
      setActive(false);
    });
  }, [active, onChange]);

  const valueAt = (clientX: number) => {
    const box = hit.current?.getBoundingClientRect();
    if (!box) return value;
    return pointerToValue(clientX, box.left + THUMB_HALF, box.width - THUMB_HALF * 2, min, max, step);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    hit.current?.setPointerCapture?.(event.pointerId);
    pointerId.current = event.pointerId;
    dragStart.current = value;
    setActive(true);
    noteDrag();
    thumb.current?.focus({ preventScroll: true });
    const next = valueAt(event.clientX);
    if (next !== value) onChange(next);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId) return;
    const next = valueAt(event.clientX);
    if (next !== latest.current) onChange(next);
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId) return;
    pointerId.current = null;
    dragStart.current = null;
    setActive(false);
    commit(latest.current);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const next = keyToValue(event.key, value, min, max, step, bigStep);
    if (next === null) return;
    event.preventDefault();
    if (next !== value) onChange(next);
    commit(next);
  };

  const share = valueToShare(value, min, max);
  const thumbX = THUMB_HALF + share * Math.max(0, width - THUMB_HALF * 2);
  const left = `calc(${THUMB_HALF}px + ${share} * (100% - ${THUMB_HALF * 2}px))`;
  const labelled = ticks.filter((tick) => tick.label);

  return (
    <div className={cx("glas-slider", className)} data-disabled={disabled ? "" : undefined}>
      <div className="glas-slider-head">
        <span id={`${id}-label`}>{label}</span>
        <span className="glas-slider-value" aria-hidden="true">
          {format(value)}
        </span>
      </div>
      <div
        ref={hit}
        className="glas-slider-hit"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <Track share={share} ticks={ticks} min={min} max={max} />
        <div
          ref={thumb}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-labelledby={`${id}-label`}
          aria-describedby={hint ? `${id}-hint` : undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={valueText(value)}
          aria-disabled={disabled ? "true" : undefined}
          className="glas-slider-thumb"
          data-active={active ? "" : undefined}
          style={{ left } as CSSProperties}
          onKeyDown={onKeyDown}
        />
        <div className="glas-slider-lens" data-active={active ? "" : undefined} data-reduced={reducedMotion ? "" : undefined} style={{ left }} aria-hidden="true">
          <div className="glas-slider-lens-content" style={{ width, transform: lensTransform(thumbX, LENS_W, LENS_H, LENS_H / 2) }}>
            <Track share={share} ticks={ticks} min={min} max={max} />
          </div>
        </div>
        {active ? (
          <span className="glas-slider-readout" style={{ left }}>
            <GlasReadout hidden live={false}>
              {format(value)}
            </GlasReadout>
          </span>
        ) : null}
      </div>
      {labelled.length > 0 ? (
        <div className="glas-slider-ticklabels" aria-hidden="true">
          {labelled.map((tick) => (
            <span key={tick.value} data-edge={tick.value <= min ? "start" : tick.value >= max ? "end" : undefined} style={{ left: `${valueToShare(tick.value, min, max) * 100}%` }}>
              {tick.label}
            </span>
          ))}
        </div>
      ) : null}
      {hint ? (
        <p id={`${id}-hint`} className="glas-slider-hint">
          {hint}
        </p>
      ) : null}
      <span className="sr-only" aria-live="polite">
        {spoken}
      </span>
    </div>
  );
}

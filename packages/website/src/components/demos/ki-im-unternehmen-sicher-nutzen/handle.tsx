"use client";

import type { CSSProperties, KeyboardEvent, RefObject } from "react";
import { LockGlyph, ArrowGlyph } from "./glyphs";

interface Props {
  readonly id: string;
  readonly label: string;
  /** Displayed value, 0..1. */
  readonly value: number;
  readonly valueText: string;
  readonly disabled: boolean;
  readonly closed: boolean;
  readonly lockText: string;
  /** Boundaries between hits, 0..1 ascending, for PageUp and PageDown. */
  readonly stops: readonly number[];
  /**
   * Reduced motion: the picture only has end frames, so an arrow key must not
   * move through frames nobody can see. Arrows then jump from stop to stop,
   * one hit per press, and value text, counter and pills agree at every press.
   */
  readonly quantized: boolean;
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly onChange: (p: number) => void;
  /** Pointer up, key up or blur: the moment a release can snap. */
  readonly onRelease: (p: number) => void;
}

const KEY_STEP = 0.05;

/**
 * The handle: one native range input, so touch, mouse, keyboard and screen
 * readers all work. Horizontal drags move the thumb, vertical ones still
 * scroll the page (touch-action: pan-y). Arrow keys move by 0.05, PageUp and
 * PageDown jump to the next or previous hit boundary, Home and End go to the
 * ends. The rail and the fill are drawn behind it, moved by transform only.
 */
export function Handle(props: Props) {
  const { id, label, value, valueText, disabled, closed, lockText, stops, quantized, inputRef, onChange, onRelease } = props;
  /*
   * The exact p, not the range's rounded integer: a stop such as 0.53846 shows
   * as 538 in the input, and reading that back would find the same stop again
   * (the reduced-motion keyboard stuck there). A release reads the input, whose
   * drag value is the truth at that moment.
   */
  const current = () => Number(inputRef.current?.value ?? 0) / 1000;

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const now = value;
    let next: number | null = null;
    const forward = () => stops.find((stop) => stop > now + 1e-6) ?? 1;
    const back = () => [...stops].reverse().find((stop) => stop < now - 1e-6) ?? 0;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = quantized ? forward() : now + KEY_STEP;
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = quantized ? back() : now - KEY_STEP;
    else if (event.key === "PageUp") next = forward();
    else if (event.key === "PageDown") next = back();
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 1;
    if (next === null) return;
    event.preventDefault();
    const clamped = Math.min(1, Math.max(0, next));
    onChange(clamped);
    onRelease(clamped);
  };

  const style = { "--p": value } as CSSProperties;
  return (
    <div className="w05-handle" style={style} data-disabled={disabled ? "" : undefined}>
      <label htmlFor={id} className="w05-handle-label">
        <ArrowGlyph />
        {label}
      </label>
      <div className="w05-handle-row">
        <span className="w05-lock-wrap" role="img" aria-label={lockText}>
          <LockGlyph closed={closed} />
        </span>
        <div className="w05-track">
          <span className="w05-rail" aria-hidden="true">
            <span className="w05-rail-cap" />
            <span className="w05-rail-fill" />
          </span>
          <input
            ref={inputRef}
            id={id}
            type="range"
            min={0}
            max={1000}
            step={1}
            value={Math.round(value * 1000)}
            disabled={disabled}
            aria-valuetext={valueText}
            onChange={(event) => onChange(Number(event.currentTarget.value) / 1000)}
            onKeyDown={onKeyDown}
            onPointerUp={() => onRelease(current())}
            onPointerCancel={() => onRelease(current())}
            onTouchEnd={() => onRelease(current())}
            onMouseUp={() => onRelease(current())}
          />
        </div>
      </div>
    </div>
  );
}

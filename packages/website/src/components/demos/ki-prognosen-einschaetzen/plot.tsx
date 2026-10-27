"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useSize, type Size } from "./use-size";

/**
 * The geometry every scene shares: a row of consecutive week indices laid
 * out left to right in real pixels, a linear value scale, and scrubbing
 * along x on the data itself (pointer capture, touch-action pan-y, so a
 * vertical swipe still scrolls the page). Pure helpers plus one hook; the
 * scenes draw their own marks.
 */
export const PAD = { left: 10, right: 10 } as const;

export interface WeekScale {
  readonly first: number;
  readonly last: number;
  readonly step: number;
  readonly x: (t: number) => number;
  /** The week under a pixel, clamped to the domain. */
  readonly at: (px: number) => number;
}

export function weekScale(domain: readonly number[], left: number, right: number): WeekScale {
  const first = domain[0] ?? 0;
  const last = domain[domain.length - 1] ?? first;
  const n = Math.max(1, last - first + 1);
  const step = Math.max(1, right - left) / n;
  return {
    first,
    last,
    step,
    x: (t) => left + (t - first + 0.5) * step,
    at: (px) => Math.min(last, Math.max(first, first + Math.floor((px - left) / step))),
  };
}

/** A linear map from [d0, d1] onto [r0, r1]. */
export function linear(d0: number, d1: number, r0: number, r1: number): (v: number) => number {
  const span = d1 - d0 || 1;
  return (v) => r0 + ((v - d0) / span) * (r1 - r0);
}

/** A rounded extent with some air, so marks never touch the edges. */
export function extent(values: readonly number[], air = 0.08): readonly [number, number] {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return [0, 1];
  const lo = Math.min(...finite);
  const hi = Math.max(...finite);
  const pad = (hi - lo || Math.abs(hi) || 1) * air;
  return [lo - pad, hi + pad];
}

/** An SVG polyline path through the points that exist; a gap breaks the line. */
export function linePath(points: readonly (readonly [number, number] | null)[]): string {
  let d = "";
  let open = false;
  for (const point of points) {
    if (!point) {
      open = false;
      continue;
    }
    d += `${open ? "L" : "M"}${point[0].toFixed(1)} ${point[1].toFixed(1)}`;
    open = true;
  }
  return d;
}

/**
 * Scrub along x on the data: a press picks the week under the finger, a
 * drag follows it, the release commits. Pixels are measured against the
 * element itself, so the scale's left and right edges line up with the SVG.
 */
export function useScrub(scale: WeekScale, onChange: (t: number) => void, onCommit?: (t: number) => void) {
  const pointer = useRef<number | null>(null);
  const latest = useRef(scale.first);
  const [active, setActive] = useState(false);
  const pick = (event: PointerEvent<Element>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const t = scale.at(event.clientX - box.left);
    latest.current = t;
    onChange(t);
  };
  const handlers = {
    onPointerDown: (event: PointerEvent<Element>) => {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      pointer.current = event.pointerId;
      setActive(true);
      pick(event);
    },
    onPointerMove: (event: PointerEvent<Element>) => {
      if (pointer.current !== event.pointerId) return;
      pick(event);
    },
    onPointerUp: (event: PointerEvent<Element>) => {
      if (pointer.current !== event.pointerId) return;
      pointer.current = null;
      setActive(false);
      onCommit?.(latest.current);
    },
    onPointerCancel: () => {
      pointer.current = null;
      setActive(false);
    },
  };
  return { handlers, active } as const;
}

/** A content line over the chart (counters, a note): plain text on the field, never glass. */
export function Readline({ children, live, className }: { readonly children: ReactNode; readonly live?: boolean; readonly className?: string }) {
  return (
    <p className={className ? `w01-line ${className}` : "w01-line"} aria-live={live ? "polite" : undefined}>
      {children}
    </p>
  );
}

/** A small person glyph (head and shoulders) centred on (x, y): a red week, where a person decides. */
export function PersonGlyph({ x, y, size }: { readonly x: number; readonly y: number; readonly size: number }) {
  const r = size * 0.2;
  return (
    <g className="w01-person" aria-hidden="true">
      <circle cx={x} cy={y - size * 0.18} r={r} />
      <path d={`M${x - size * 0.32} ${y + size * 0.36}a${size * 0.32} ${size * 0.3} 0 0 1 ${size * 0.64} 0`} />
    </g>
  );
}

/** The plot's pixel size, measured; a phone-sized guess for the first paint. */
export function usePlotSize(): readonly [(element: HTMLElement | null) => void, Size] {
  return useSize({ width: 358, height: 220 });
}

/**
 * One scene's frame on the field: a head line (counters, the week, a chip)
 * and the plot measured in real pixels (usePlotSize). The plot fills the
 * data row of the stage, whatever height the phone leaves it.
 */
export function SceneFrame({
  head,
  plotRef,
  children,
  className,
  foot,
}: {
  readonly head?: ReactNode;
  readonly plotRef: (element: HTMLElement | null) => void;
  readonly children: ReactNode;
  readonly className?: string;
  readonly foot?: ReactNode;
}) {
  return (
    <div className={className ? `w01-scene ${className}` : "w01-scene"}>
      {head ? <div className="w01-head">{head}</div> : null}
      <div className="w01-plot" ref={plotRef}>
        {children}
      </div>
      {foot ? <div className="w01-foot">{foot}</div> : null}
    </div>
  );
}

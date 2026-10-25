"use client";

import { useRef } from "react";
import { clamp01 } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/scene";
import { fill } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/text";
import type { DemoPack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/pack";

const HANDLE = 56;
const SNAP = 0.015;

/** Values near an end land exactly on it, so a drag can reach the settled states. */
const snapEnds = (value: number): number => (value < SNAP ? 0 : value > 1 - SNAP ? 1 : value);

export function sliderText(ui: DemoPack["ui"], p: number): string {
  if (p <= 0.05) return ui.sliderChange;
  if (p >= 0.95) return ui.sliderLevel;
  return fill(ui.sliderMid, { n: Math.round(p * 100) });
}

/** The vertical lever: pointer capture on the track, a slider on the handle. */
export function Lever({
  p,
  ui,
  onScrub,
  onRelease,
  onTouch,
}: {
  readonly p: number;
  readonly ui: DemoPack["ui"];
  readonly onScrub: (value: number) => void;
  readonly onRelease: (value: number) => void;
  readonly onTouch: () => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const valueAt = (clientY: number): number => {
    const box = track.current?.getBoundingClientRect();
    if (!box) return p;
    return snapEnds(clamp01(1 - (clientY - box.top - HANDLE / 2) / (box.height - HANDLE)));
  };

  const nudge = (delta: number) => {
    onScrub(snapEnds(clamp01(p + delta)));
  };

  return (
    <div className="dr3-lever">
      <span className="dr3-lever-end" aria-hidden="true">
        {ui.treppe}
      </span>
      <div
        ref={track}
        className="dr3-track"
        onPointerDown={(event) => {
          onTouch();
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          onScrub(valueAt(event.clientY));
        }}
        onPointerMove={(event) => {
          if (dragging.current) onScrub(valueAt(event.clientY));
        }}
        onPointerUp={(event) => {
          if (!dragging.current) return;
          dragging.current = false;
          event.currentTarget.releasePointerCapture(event.pointerId);
          onRelease(valueAt(event.clientY));
        }}
        onPointerCancel={() => {
          dragging.current = false;
          onRelease(p);
        }}
      >
        <div
          role="slider"
          tabIndex={0}
          aria-label={ui.leverLabel}
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(p * 100)}
          aria-valuetext={sliderText(ui, p)}
          className="dr3-handle"
          style={{ top: `calc((1 - ${p}) * (100% - ${HANDLE}px))` }}
          onKeyDown={(event) => {
            const steps: Record<string, () => void> = {
              ArrowUp: () => nudge(0.05),
              ArrowRight: () => nudge(0.05),
              ArrowDown: () => nudge(-0.05),
              ArrowLeft: () => nudge(-0.05),
              PageUp: () => nudge(0.25),
              PageDown: () => nudge(-0.25),
              Home: () => nudge(-1),
              End: () => nudge(1),
            };
            const step = steps[event.key];
            if (!step) return;
            event.preventDefault();
            onTouch();
            step();
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 3l6 7H6zM12 21l-6-7h12z" />
          </svg>
          <span className="dr3-handle-cue" aria-hidden="true">
            {ui.leverCue}
          </span>
        </div>
      </div>
      <span className="dr3-lever-end" aria-hidden="true">
        {ui.stufe}
      </span>
    </div>
  );
}

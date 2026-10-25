"use client";

import { useRef, type ChangeEvent, type PointerEvent } from "react";
import { formatNumber } from "@/lib/demo-cases/esg-berichte-mit-ki/numbers";
import { fill } from "@/lib/demo-cases/esg-berichte-mit-ki/takeaways";
import type { DemoPack } from "@/lib/demo-cases/esg-berichte-mit-ki/types";

interface Props {
  readonly pack: DemoPack;
  /** 0..1 */
  readonly progress: number;
  /** The visitor has made a guess: until then the bill stays shut, so the guess cannot be skipped. */
  readonly armed: boolean;
  /** The bill has been opened once: only then the rewind slider appears. */
  readonly seen: boolean;
  readonly onToggle: () => void;
  readonly onScrub: (value: number) => void;
  readonly onSettle: () => void;
}

function Envelope() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="esg-btn__icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter">
      <path d="M2.5 5.5h19v13h-19z" />
      <path d="M2.5 6l9.5 7.5L21.5 6" />
    </svg>
  );
}

/**
 * Open the bill: a button (tap = run to the end, tap again = back), a slider
 * that scrubs both ways, and a hold-and-drag on the button that scrubs too.
 * The control only writes the progress; scene.ts draws everything from it.
 */
export function RevealControl({ pack, progress, armed, seen, onToggle, onScrub, onSettle }: Props) {
  const drag = useRef<{ x: number; start: number; moved: boolean } | null>(null);
  const suppress = useRef(false);
  const percent = Math.round(progress * 100);
  const done = progress >= 0.999;
  const waiting = !armed && progress === 0;

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (waiting) return;
    drag.current = { x: event.clientX, start: progress, moved: false };
  }
  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const state = drag.current;
    if (!state) return;
    const dx = event.clientX - state.x;
    if (!state.moved && Math.abs(dx) < 8) return;
    if (!state.moved) event.currentTarget.setPointerCapture(event.pointerId);
    state.moved = true;
    const width = event.currentTarget.getBoundingClientRect().width || 1;
    onScrub(Math.min(1, Math.max(0, state.start + dx / width)));
  }
  function onPointerEnd(event: PointerEvent<HTMLButtonElement>) {
    const state = drag.current;
    drag.current = null;
    if (state?.moved) {
      suppress.current = true;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      onSettle();
    }
  }

  return (
    <div className="esg-reveal">
      <button
        type="button"
        className={done ? "esg-btn esg-btn--ghost" : "esg-btn esg-btn--primary"}
        data-done={done ? "" : undefined}
        aria-disabled={waiting ? true : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClick={() => {
          if (waiting) return;
          if (suppress.current) {
            suppress.current = false;
            return;
          }
          onToggle();
        }}
      >
        {done ? null : <Envelope />}
        <span>{done ? pack.reveal.back : waiting ? pack.reveal.guessFirst : pack.reveal.open}</span>
      </button>
      {seen ? (
        <label className="esg-reveal__slider">
        <span className="esg-reveal__label">{pack.reveal.slider}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          aria-valuetext={fill(pack.reveal.sliderValue, { x: formatNumber(percent, pack.locale, 0) })}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onScrub(Number(event.target.value))}
          onPointerUp={onSettle}
          onKeyUp={onSettle}
        />
      </label>
      ) : null}
      {progress > 0 && !done ? <p id="esg-locked" className="esg-reveal__hint">{pack.reveal.locked}</p> : null}
    </div>
  );
}

"use client";

import { memo, useId, type ChangeEvent, type CSSProperties } from "react";
import { controlKindOf, controlLabelOf, detentsOf, type FigureSpec } from "@/lib/figures";

interface VariantControlProps {
  readonly spec: FigureSpec;
  /** Detent id in force. */
  readonly value: string;
  readonly onChange: (id: string) => void;
}

/** More stops than this cannot all carry a label under a phone-wide range without running into each other. */
const MAX_LABELLED_TICKS = 6;

/** Sparse row: the two ends and the stop the range stands on (unless it sits next to an end, where it would collide). */
function shownTick(i: number, current: number, count: number): boolean {
  if (i === 0 || i === count - 1) return true;
  const gap = Math.ceil(count * 0.2);
  return i === current && current > gap - 1 && current < count - gap;
}

/**
 * The control of a hero figure, always visible, never a disclosure:
 * - two or three detents: native radio buttons (arrow keys move, 44 px high)
 * - more: a native range with real detents and their labels under it
 * - the random split of H06: one button that moves to the next baked split
 * Every change is a real detent; no value between two of them is ever shown.
 */
export const VariantControl = memo(function VariantControl({ spec, value, onChange }: VariantControlProps) {
  const name = useId();
  const kind = controlKindOf(spec);
  const detents = detentsOf(spec);
  const label = controlLabelOf(spec);
  if (kind === "none") return null;
  const index = Math.max(0, detents.findIndex((d) => d.id === value));

  if (kind === "cycle") {
    const next = detents[(index + 1) % detents.length];
    return (
      <div className="hv" data-hv="cycle">
        <button type="button" className="hv-btn" onClick={() => next && onChange(next.id)}>
          {label}
        </button>
      </div>
    );
  }

  if (kind === "segmented") {
    return (
      <fieldset className="hv" data-hv="segmented">
        <legend className="hv-legend">{label}</legend>
        <div className="hv-seg">
          {detents.map((d) => (
            <label key={d.id} className="hv-opt">
              <input
                type="radio"
                className="hv-radio"
                name={name}
                value={d.id}
                checked={d.id === value}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
              />
              <span className="hv-face">{d.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  const current = detents[index];
  const sparse = detents.length > MAX_LABELLED_TICKS;
  return (
    <div className="hv" data-hv="range">
      <label className="hv-legend" htmlFor={`${name}-range`}>
        {label}
        <span className="hv-now" data-hv-now aria-hidden="true">
          {current?.label}
        </span>
      </label>
      <input
        id={`${name}-range`}
        type="range"
        className="hv-range"
        min={0}
        max={detents.length - 1}
        step={1}
        value={index}
        aria-valuetext={current?.label}
        onChange={(event) => {
          const next = detents[Number(event.target.value)];
          if (next) onChange(next.id);
        }}
      />
      <ol className="hv-ticks" aria-hidden="true" data-sparse={sparse ? "true" : undefined}>
        {detents.map((d, i) => {
          if (sparse && !shownTick(i, index, detents.length)) return null;
          // A sparse row positions each label under its stop: the first starts at the left end, the last ends at the right end.
          const at = detents.length > 1 ? (i / (detents.length - 1)) * 100 : 0;
          return (
            <li
              key={d.id}
              className="hv-tick"
              data-on={d.id === value}
              style={sparse ? ({ left: `${at}%`, transform: `translateX(-${at}%)` } as CSSProperties) : undefined}
            >
              {d.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
});

"use client";

import type { ReactNode } from "react";
import { useHydrated } from "./use-stage";

/** The row above a stage. Reserved in the server markup, shown once the island runs. */
export function Controls({ children }: { readonly children: ReactNode }) {
  const hydrated = useHydrated();
  return (
    <div className="bf-controls" data-ready={hydrated}>
      {children}
    </div>
  );
}

export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

interface SegmentedProps<T extends string> {
  readonly label: string;
  readonly value: T;
  readonly options: readonly SegmentedOption<T>[];
  readonly onChange: (value: T) => void;
}

/**
 * One choice out of a few, as plain buttons: each is a tab stop, 44px high,
 * and says "gedrückt" through aria-pressed, a heavier frame and a square mark.
 */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <>
      <span className="bf-control-label">
        {label}
      </span>
      <div className="bf-seg" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="bf-btn"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  );
}

/** A single on/off button, for example "Alle Branchen zeigen". */
export function Toggle({
  label,
  pressedLabel,
  expanded,
  onChange,
}: {
  readonly label: string;
  readonly pressedLabel: string;
  readonly expanded: boolean;
  readonly onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="bf-btn"
      onClick={() => onChange(!expanded)}
    >
      {expanded ? pressedLabel : label}
    </button>
  );
}

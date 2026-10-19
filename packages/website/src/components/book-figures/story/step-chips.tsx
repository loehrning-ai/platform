"use client";

import type { ReactNode } from "react";

export interface Chip {
  readonly id: string;
  readonly label: ReactNode;
  readonly ariaLabel?: string;
}

interface StepChipsProps {
  readonly label: string;
  readonly chips: readonly Chip[];
  readonly selected: string | null;
  readonly onSelect: (id: string) => void;
  readonly current?: "step" | "true";
}

/** A row of toggle buttons (aria-pressed). Plain buttons: Tab moves, Enter and Space select. */
export function StepChips({ label, chips, selected, onSelect, current }: StepChipsProps) {
  return (
    <div className="bf-chips" role="group" aria-label={label}>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className="bf-chip"
          aria-pressed={selected === chip.id}
          aria-current={selected === chip.id ? current : undefined}
          aria-label={chip.ariaLabel}
          data-chip={chip.id}
          onClick={() => onSelect(chip.id)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

"use client";

import { useRef } from "react";

export interface RadioOption<T extends string> {
  readonly id: T;
  readonly label: string;
}

/**
 * A radiogroup of buttons that swaps a variant in place (nothing hides):
 * one tab stop, arrow keys move and select, Home and End jump.
 */
export function Radios<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  readonly label: string;
  readonly options: readonly RadioOption<T>[];
  readonly value: T | null;
  readonly onChange: (id: T) => void;
  readonly className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (from: number, step: number) => {
    const next = (from + step + options.length) % options.length;
    const option = options[next];
    if (!option) return;
    onChange(option.id);
    refs.current[next]?.focus();
  };
  const active = options.findIndex((option) => option.id === value);
  return (
    <div role="radiogroup" aria-label={label} className={className}>
      {options.map((option, index) => (
        <button
          key={option.id}
          ref={(node) => {
            refs.current[index] = node;
          }}
          type="button"
          role="radio"
          aria-checked={option.id === value}
          tabIndex={index === (active < 0 ? 0 : active) ? 0 : -1}
          className="dr3-radio"
          onClick={() => onChange(option.id)}
          onKeyDown={(event) => {
            const keys: Record<string, () => void> = {
              ArrowRight: () => move(index, 1),
              ArrowDown: () => move(index, 1),
              ArrowLeft: () => move(index, -1),
              ArrowUp: () => move(index, -1),
              Home: () => move(index, -index),
              End: () => move(index, options.length - 1 - index),
            };
            const handler = keys[event.key];
            if (handler) {
              event.preventDefault();
              handler();
            }
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

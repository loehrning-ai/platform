"use client";

import { cx } from "@/components/werk/cx";
import { usePointerChoice } from "./pointer-choice";

/**
 * One radio group drawn as square chips: native radios, so arrow keys move
 * the choice and the shell leaves keys inside it alone. A tap hands focus to
 * "Weiter" (pointer-choice.ts). Nothing preselected unless `value` says so.
 */
export function ChipGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  className,
}: {
  readonly legend: string;
  readonly name: string;
  readonly value: T | null;
  readonly options: readonly { readonly value: T; readonly label: string }[];
  readonly onChange: (value: T) => void;
  readonly className?: string;
}) {
  const pointer = usePointerChoice();
  return (
    <fieldset
      className={cx("nw-chips", className)}
      data-chip-group={name}
      onPointerDown={pointer.onPointerDown}
      onKeyDown={pointer.onKeyDown}
    >
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => (
        <label key={option.value} className="nw-chip" data-checked={value === option.value ? "" : undefined}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => {
              onChange(option.value);
              pointer.settle();
            }}
            className="nw-chip-input"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

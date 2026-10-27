"use client";

import { useId, useState, type ReactNode } from "react";
import { cx } from "@/components/werk/cx";

/**
 * Toggle (glass-spec 4.6): a switch in a row, with a sentence label on the
 * left. For on/off of a setting; compare two views with a segmented control.
 * While pressed the knob stretches and turns clear.
 */
export function GlasToggle({
  checked,
  onChange,
  label,
  description,
  className,
  disabled,
}: {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly className?: string;
  readonly disabled?: boolean;
}) {
  const id = useId();
  const [pressed, setPressed] = useState(false);
  return (
    <div className={cx("glas-toggle-row", className)}>
      <span>
        <span id={`${id}-label`}>{label}</span>
        {description ? (
          <span id={`${id}-desc`} className="glas-toggle-desc">
            {description}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        className="glas-toggle"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        data-pressed={pressed ? "" : undefined}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        onClick={() => onChange(!checked)}
      >
        <span className="glas-toggle-knob" aria-hidden="true" />
      </button>
    </div>
  );
}

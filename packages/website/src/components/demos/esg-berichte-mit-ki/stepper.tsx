"use client";

import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";

const MAX = 21;

/** The prediction lever: minus, the estimate (0 to 21), plus, and the action that reveals. */
export function Stepper({
  pack,
  value,
  onChange,
  action,
  onAction,
  disabled,
  primary = true,
}: {
  readonly pack: Pack;
  readonly value: number | null;
  readonly onChange: (value: number) => void;
  readonly action: string;
  readonly onAction: () => void;
  readonly disabled?: boolean;
  /** Filled until the action ran; afterwards "Weiter" is the one filled button. */
  readonly primary?: boolean;
}) {
  const shown = value ?? null;
  // Untouched, the estimate shows "?"; the first tap counts from 0, so no number is suggested.
  const step = (delta: number) => onChange(Math.max(0, Math.min(MAX, (value ?? 0) + delta)));
  return (
    <div className="nw-stepper" role="group" aria-label={pack.folder.guessLabel}>
      <button type="button" className="nw-step" aria-label={pack.folder.less} disabled={disabled || value === null || value === 0} onClick={() => step(-1)}>
        −
      </button>
      <output className="nw-step-value" aria-live="polite" aria-label={pack.folder.guessLabel} data-guess={shown ?? ""}>
        {shown ?? "?"}
      </output>
      <button type="button" className="nw-step" aria-label={pack.folder.more} disabled={disabled || value === MAX} onClick={() => step(1)}>
        +
      </button>
      <button type="button" className={`nw-button nw-step-action${primary ? " nw-button-primary" : ""}`} disabled={disabled} onClick={onAction} data-step-action="">
        {action}
      </button>
    </div>
  );
}

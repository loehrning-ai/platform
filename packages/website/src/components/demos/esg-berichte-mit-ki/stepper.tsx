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
}: {
  readonly pack: Pack;
  readonly value: number | null;
  readonly onChange: (value: number) => void;
  readonly action: string;
  readonly onAction: () => void;
  readonly disabled?: boolean;
}) {
  const shown = value ?? null;
  const step = (delta: number) => onChange(Math.max(0, Math.min(MAX, (value ?? 10) + delta)));
  return (
    <div className="nw-stepper" role="group" aria-label={pack.folder.guessLabel}>
      <button type="button" className="nw-step" aria-label={pack.folder.less} disabled={disabled || value === 0} onClick={() => step(-1)}>
        −
      </button>
      <output className="nw-step-value" aria-live="polite" aria-label={pack.folder.guessLabel} data-guess={shown ?? ""}>
        {shown ?? "?"}
      </output>
      <button type="button" className="nw-step" aria-label={pack.folder.more} disabled={disabled || value === MAX} onClick={() => step(1)}>
        +
      </button>
      <button type="button" className="nw-button nw-button-primary nw-step-action" disabled={disabled} onClick={onAction} data-step-action="">
        {action}
      </button>
    </div>
  );
}

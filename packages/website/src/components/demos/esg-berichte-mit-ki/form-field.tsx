import type { ReactNode } from "react";

/**
 * The bank-form field: a label, one big mono figure with its unit, and the
 * stamp, which sits inside the box on the right. `strike` (0..1) is a pure
 * progress: it draws the Mennige line through the stamp and a small impact.
 */
export function FormField({
  label,
  prefix,
  value,
  unit,
  unitMissing,
  note,
  action,
  stamp,
  strike,
  stampIn = 1,
  valueAria,
  status,
  statusText,
}: {
  readonly label: string;
  readonly prefix?: string;
  readonly value: string;
  readonly unit: string;
  /** Shown in the unit slot when the visitor typed no unit: the tool never asserts one. */
  readonly unitMissing?: string;
  readonly note: ReactNode;
  /** A control that belongs to the note (a chip that fixes the doubtful reading), directly under it. */
  readonly action?: ReactNode;
  readonly stamp?: string;
  readonly strike: number;
  readonly stampIn?: number;
  readonly valueAria: string;
  readonly status: string;
  readonly statusText: string;
}) {
  const impact = Math.sin(Math.PI * Math.min(1, Math.max(0, strike)));
  return (
    <div className="esg-field">
      <div className="esg-field__head">
        <p className="esg-field__label">{label}</p>
        <span className="esg-pill" data-status={status}>{statusText}</span>
      </div>
      <div className="esg-field__box">
        <div className="esg-field__main">
          <p className="esg-field__figure">
            {prefix ? <span className="esg-field__prefix">{prefix}</span> : null}
            <output className="esg-field__num" aria-label={valueAria}>{value}</output>
            {unit === "" && unitMissing ? (
              <span className="esg-field__unit esg-field__unit--ask">{unitMissing}</span>
            ) : (
              <span className="esg-field__unit" aria-hidden="true">{unit}</span>
            )}
          </p>
          <p className="esg-field__note">{note}</p>
          {action}
        </div>
        {stamp ? (
          <span
            className="esg-stamp"
            data-struck={strike >= 0.5 ? "" : undefined}
            style={{
              opacity: stampIn,
              transform: `rotate(3deg) scale(${(1 + (1 - stampIn) * 0.8) * (1 + 0.16 * impact)})`,
            }}
          >
            <span className="esg-stamp__text">{stamp}</span>
            <span className="esg-stamp__strike" style={{ transform: `scaleX(${strike})` }} aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

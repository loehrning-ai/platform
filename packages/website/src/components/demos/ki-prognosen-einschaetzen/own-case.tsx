"use client";

import { useId } from "react";
import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import type {
  FieldError,
  FieldName,
  RawCase,
} from "@/lib/demo-cases/ki-prognosen-einschaetzen/validate";

interface Props {
  readonly copy: DemoPack;
  readonly fields: RawCase;
  readonly errors: readonly FieldError[];
  /** Under the stock field: it was moved onto the forecast, or sits far outside the range. */
  readonly supplyNote: "moved" | "far" | null;
  readonly onChange: (field: FieldName, text: string) => void;
  readonly onReset: () => void;
  /** The visitor left a field: validate now, do not wait for the pause. */
  readonly onCommit: () => void;
}

const ORDER: readonly {
  name: FieldName;
  hint?: "p10Hint" | "p50Hint" | "p90Hint" | "ratioHint";
}[] = [
  { name: "p10", hint: "p10Hint" },
  { name: "p50", hint: "p50Hint" },
  { name: "p90", hint: "p90Hint" },
  { name: "supply" },
  { name: "ratio", hint: "ratioHint" },
  { name: "unit" },
];

/** "Mein Fall": always visible, prefilled with the workshop case, six plain fields. */
export function OwnCase({
  copy,
  fields,
  errors,
  supplyNote,
  onChange,
  onReset,
  onCommit,
}: Props) {
  const base = useId();
  const form = copy.form;
  return (
    <section
      className="hw-form"
      data-hw-form=""
      aria-labelledby={`${base}-title`}
    >
      <h2 id={`${base}-title`} className="hw-h2">
        {form.title}
      </h2>
      <p className="hw-lead">{form.lead}</p>
      <div className="hw-fields">
        {ORDER.map(({ name, hint }) => {
          const error = errors.find((item) => item.field === name);
          const first = errors[0]?.field === name;
          const id = `${base}-${name}`;
          return (
            <div
              key={name}
              className={
                name === "ratio" ? "hw-field hw-field-ratio" : "hw-field"
              }
            >
              <label htmlFor={id}>{form[name]}</label>
              <input
                id={id}
                name={name}
                type="text"
                inputMode={name === "unit" ? "text" : "decimal"}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                value={fields[name]}
                placeholder={name === "unit" ? form.unitHint : undefined}
                aria-invalid={error ? true : undefined}
                aria-describedby={`${id}-note`}
                onChange={(event) => onChange(name, event.target.value)}
                onBlur={onCommit}
              />
              <p
                id={`${id}-note`}
                className={
                  error
                    ? "hw-field-note is-error"
                    : name === "supply" && supplyNote
                      ? "hw-field-note is-notice"
                      : "hw-field-note"
                }
                aria-live="polite"
              >
                {error ? form.errors[error.key] : hint ? form[hint] : " "}
                {error && first ? (
                  <span className="hw-last-valid">{form.lastValid}</span>
                ) : null}
              </p>
            </div>
          );
        })}
      </div>
      <div className="hw-form-foot">
        <button type="button" className="hw-btn" onClick={onReset}>
          {form.reset}
        </button>
        <p className="hw-privacy">{form.privacy}</p>
      </div>
    </section>
  );
}

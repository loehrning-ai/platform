"use client";

import { forwardRef, useId } from "react";
import type { Pack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import { fill, type ParseError } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stack";

/**
 * The own beat's form: the visitor's cost lines, pasted or typed, read by the same parser as the kit's
 * file. Nothing leaves the tab; "Von vorn" never clears it, only "Eigene Eingaben löschen" does.
 */
export const OwnLines = forwardRef<
  HTMLElement,
  {
    readonly pack: Pack;
    readonly text: string;
    readonly applied: boolean;
    readonly errors: readonly ParseError[];
    readonly onText: (text: string) => void;
    readonly onApply: () => void;
    readonly onLoadSecond: () => void;
    readonly onClear: () => void;
  }
>(function OwnLines({ pack, text, applied, errors, onText, onApply, onLoadSecond, onClear }, ref) {
  const fieldId = useId();
  const hintId = useId();
  const copy = pack.deins;
  return (
    <section ref={ref} className="av-own" aria-labelledby={`${fieldId}-head`} data-av-own="">
      <h2 id={`${fieldId}-head`} className="av-own-head">
        {copy.heading}
      </h2>
      <p className="av-own-stays">{copy.stays}</p>
      <label htmlFor={fieldId} className="av-own-label">
        {copy.field}
      </label>
      <p id={hintId} className="av-own-hint">
        {copy.hint}
      </p>
      <textarea
        id={fieldId}
        className="av-own-field"
        aria-describedby={hintId}
        rows={7}
        spellCheck={false}
        autoComplete="off"
        value={text}
        onChange={(event) => onText(event.target.value)}
      />
      <div className="av-own-actions">
        <button type="button" className="av-button av-button-primary" onClick={onApply} disabled={text.trim() === ""}>
          {copy.apply}
        </button>
        <button type="button" className="av-button" onClick={onLoadSecond}>
          {copy.load}
        </button>
        <button type="button" className="av-button av-button-quiet" onClick={onClear} disabled={text === "" && !applied}>
          {copy.clear}
        </button>
      </div>
      {errors.length > 0 ? (
        <ul className="av-own-errors" role="alert">
          {errors.map((error, index) => (
            <li key={index}>{errorText(pack, error)}</li>
          ))}
        </ul>
      ) : (
        <p className="av-own-state" aria-live="polite">
          {applied ? copy.ownShown : copy.kitShown}
        </p>
      )}
    </section>
  );
});

function errorText(pack: Pack, error: ParseError): string {
  const template = pack.deins.errors[error.kind];
  const vars: Record<string, string | number> = {};
  if ("n" in error) vars.n = error.n;
  if ("max" in error) vars.max = error.max;
  if ("value" in error) vars.value = error.value;
  if ("column" in error) vars.column = error.column;
  return fill(template, vars);
}

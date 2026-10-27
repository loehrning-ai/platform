"use client";

import { useId } from "react";
import { GlasButton } from "@/components/demos/glas";
import type { AppCopy } from "@/lib/demo-cases/esg-berichte-mit-ki/app-copy";
import { fill } from "@/lib/demo-cases/esg-berichte-mit-ki/app-data";
import type { StepId } from "@/lib/demo-cases/esg-berichte-mit-ki/app-steps";
import type { KitText } from "@/lib/demo-cases/esg-berichte-mit-ki/kit-text";
import type { Fmt } from "../fmt";
import { predictionText } from "./captions";

/** The range of each step's prediction: counts of the kit's answers, F4 in half years. */
export const PREDICT_RANGE: Readonly<Record<StepId, { readonly min: number; readonly max: number; readonly step: number }>> = {
  "schritt-1": { min: 0, max: 8, step: 1 },
  "schritt-2": { min: 0, max: 7, step: 1 },
  "schritt-3": { min: 0, max: 15, step: 0.5 },
  "schritt-4": { min: 0, max: 21, step: 1 },
  "schritt-5": { min: 0, max: 21, step: 1 },
};

/** The next value after a press: the first press starts in the middle of the range. */
export function stepPrediction(id: StepId, value: number | null, direction: 1 | -1): number {
  const { min, max, step } = PREDICT_RANGE[id];
  if (value === null) return Math.round((min + max) / 2 / step) * step;
  return Math.min(max, Math.max(min, value + direction * step));
}

/**
 * The kit's prediction before a step (START-HIER.md: „Vorhersage auf
 * Papier"), as a tap in the dock: one question and a stepper. It is optional
 * and never scored; after the answer the caption sets it beside Claude's.
 */
export function Prediction({
  copy,
  fmt,
  kit,
  step,
  value,
  onChange,
}: {
  readonly copy: AppCopy;
  readonly fmt: Fmt;
  readonly kit: KitText;
  readonly step: StepId;
  readonly value: number | null;
  readonly onChange: (value: number) => void;
}) {
  const id = useId();
  const { min, max } = PREDICT_RANGE[step];
  const shown = value === null ? copy.predict.unset : predictionText(copy, fmt, step, value);
  return (
    <div className="w4a-predict" role="group" aria-labelledby={`${id}-q`} data-w4a-predict={step}>
      <p className="w4a-predict-q" id={`${id}-q`}>
        <span className="w4a-predict-label">{copy.predict.label}: </span>
        {copy.predict.steps[step].question}
      </p>
      <div className="w4a-predict-row">
        <GlasButton
          variant="icon"
          size="compact"
          icon="minus"
          label={copy.predict.less}
          disabled={value !== null && value <= min}
          onClick={() => onChange(stepPrediction(step, value, -1))}
          data-w4a-predict-less=""
        />
        <output className="w4a-predict-value" aria-live="polite" data-w4a-predict-value={value ?? ""}>
          {shown}
        </output>
        <GlasButton
          variant="icon"
          size="compact"
          icon="plus"
          label={copy.predict.more}
          disabled={value !== null && value >= max}
          onClick={() => onChange(stepPrediction(step, value, 1))}
          data-w4a-predict-more=""
        />
      </div>
      {step === "schritt-3" ? <p className="w4a-predict-hint">{fill(copy.predict.f4Hint, { pv: kit.fileNames.pv, strom: kit.fileNames.strom })}</p> : null}
    </div>
  );
}

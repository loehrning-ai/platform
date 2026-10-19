"use client";

import { useId, useMemo, useState } from "react";
import { formatDecimal, type FigureSpecOf } from "@/lib/figures";
import { FigureShell } from "./figure-shell";
import { FigureSvg } from "./figure-svg";

/** Weeks in an average month. */
export const WEEKS_PER_MONTH = 4.33;

export interface CalculatorInputs {
  readonly hours: number;
  readonly rate: number;
  readonly tool: number;
}

export interface CalculatorResult {
  /** Euro per month the saved time is worth at the entered rate. */
  readonly timeValue: number;
  readonly net: number;
  /** Hours per week at which the saved time is worth exactly the tool cost; null when the rate is 0. */
  readonly breakEvenHours: number | null;
}

/** Plain arithmetic on the reader's own numbers. No return rate, no promise. */
export function calculate({ hours, rate, tool }: CalculatorInputs): CalculatorResult {
  const timeValue = hours * rate * WEEKS_PER_MONTH;
  return {
    timeValue,
    net: timeValue - tool,
    breakEvenHours: rate > 0 ? tool / (rate * WEEKS_PER_MONTH) : null,
  };
}

export const CALCULATOR_DEFAULTS: CalculatorInputs = { hours: 4, rate: 50, tool: 40 };

interface Field {
  readonly key: keyof CalculatorInputs;
  readonly label: string;
  readonly unit: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly valueText: (value: number) => string;
}

const FIELDS: readonly Field[] = [
  {
    key: "hours",
    label: "Stunden pro Woche, die das Werkzeug dir spart",
    unit: "h",
    min: 0,
    max: 20,
    step: 1,
    valueText: (v) => `${formatDecimal(v, 0)} ${v === 1 ? "Stunde" : "Stunden"} pro Woche`,
  },
  {
    key: "rate",
    label: "Wert einer Stunde",
    unit: "€",
    min: 10,
    max: 150,
    step: 5,
    valueText: (v) => `${formatDecimal(v, 0)} Euro pro Stunde`,
  },
  {
    key: "tool",
    label: "Kosten des Werkzeugs pro Monat",
    unit: "€",
    min: 0,
    max: 500,
    step: 10,
    valueText: (v) => `${formatDecimal(v, 0)} Euro pro Monat`,
  },
];

const euro = (value: number): string => `${formatDecimal(Math.round(value), 0)} €`;

function sentence(inputs: CalculatorInputs, result: CalculatorResult): string {
  const worth = `${euro(result.timeValue)} im Monat`;
  const tail =
    result.net >= 0
      ? `Nach ${euro(inputs.tool)} Werkzeugkosten bleiben ${euro(result.net)} Zeitwert.`
      : `Das Werkzeug kostet ${euro(-result.net)} mehr, als die gesparte Zeit wert ist.`;
  const breakEven =
    result.breakEvenHours === null
      ? ""
      : inputs.tool === 0
        ? " Das Werkzeug kostet nichts, es zählt nur dein Einrichtungsaufwand."
        : ` Die Kosten sind ab ${formatDecimal(Math.ceil(result.breakEvenHours * 10) / 10, 1)} Stunden pro Woche gedeckt.`;
  return `${formatDecimal(inputs.hours, 0)} ${inputs.hours === 1 ? "Stunde" : "Stunden"} pro Woche zu ${euro(inputs.rate)} sind ${worth}. ${tail}${breakEven}`;
}

function buildSpec(inputs: CalculatorInputs, result: CalculatorResult): FigureSpecOf<"waterfall"> {
  const fmt = { style: "number", digits: 0, unit: "€" } as const;
  return {
    id: "c13-rechner",
    kind: "waterfall",
    title: "Dein Rechenbeispiel pro Monat",
    alt: `Waagerechte Balken pro Monat: Zeitwert ${euro(result.timeValue)}, Werkzeugkosten ${euro(inputs.tool)}, Unterschied ${euro(result.net)}.`,
    caption: "Rechnung mit deinen eigenen Zahlen. Keine Messung, keine Prognose.",
    n: 0,
    source: "Deine Eingaben im Browser",
    asOf: "2026-10-18",
    limitation:
      "Gesparte Zeit wird nur dann zu Geld, wenn du sie anders einsetzt. Ob ein Werkzeug Zeit spart, misst du vorher und nachher an einem Vorgang. Die Rechnung enthält keine Einrichtung, keine Schulung und keinen Rückgang der Qualität.",
    data: {
      fmt,
      orientation: "horizontal",
      items: [
        { id: "value", label: "Zeitwert pro Monat", kind: "total", value: Math.round(result.timeValue) },
        { id: "tool", label: "Werkzeugkosten", kind: "delta", value: inputs.tool === 0 ? 0 : -inputs.tool },
        { id: "net", label: "Unterschied", kind: "total", value: Math.round(result.net) },
      ],
    },
  };
}

/**
 * C13, the pilot calculator. Three range inputs with spoken values, the
 * arithmetic as a waterfall and one sentence. It asserts no return rate and
 * stores or sends nothing.
 */
export function Calculator({ provisional, csvHref }: { readonly provisional?: boolean; readonly csvHref?: string }) {
  const [inputs, setInputs] = useState<CalculatorInputs>(CALCULATOR_DEFAULTS);
  const baseId = useId();
  const result = useMemo(() => calculate(inputs), [inputs]);
  const spec = useMemo(() => buildSpec(inputs, result), [inputs, result]);

  return (
    <FigureShell spec={spec} provisional={provisional} csvHref={csvHref} className="bf-calc-figure" ownInput>
      <div className="bf-calc">
        <p className="bf-calc-hint">Setze deine eigenen Zahlen ein. Die Startwerte sind Beispiele.</p>
        <div className="bf-fields">
          {FIELDS.map((field) => {
            const id = `${baseId}-${field.key}`;
            const value = inputs[field.key];
            return (
              <div key={field.key} className="bf-field">
                <div className="bf-field-head">
                  <label htmlFor={id} className="bf-field-label">
                    {field.label}
                  </label>
                  <span className="bf-field-value" aria-hidden="true">
                    {formatDecimal(value, 0)} {field.unit}
                  </span>
                </div>
                <input
                  id={id}
                  className="bf-range"
                  type="range"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={value}
                  aria-valuetext={field.valueText(value)}
                  onChange={(event) => {
                    const next = Number(event.currentTarget.value);
                    setInputs((previous) => ({ ...previous, [field.key]: next }));
                  }}
                />
              </div>
            );
          })}
        </div>
        <FigureSvg spec={spec} layout="pair" />
        <p className="bf-result" role="status">
          {sentence(inputs, result)}
        </p>
        <button type="button" className="bf-button" onClick={() => setInputs(CALCULATOR_DEFAULTS)}>
          Startwerte
        </button>
      </div>
    </FigureShell>
  );
}

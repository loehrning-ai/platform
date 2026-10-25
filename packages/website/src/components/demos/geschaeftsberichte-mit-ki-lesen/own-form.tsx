"use client";

import { useId } from "react";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import {
  FIELD_LIMITS,
  type Comparison,
  type Finding,
  type NumeratorKind,
  type OwnCard,
  type PeriodKind,
  type TextField,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/steckbrief";

type Field = keyof DemoPack["own"]["fields"];

function FindingLines({ pack, findings, field }: { readonly pack: DemoPack; readonly findings: readonly Finding[]; readonly field: string }) {
  const mine = findings.filter((finding) => finding.field === field);
  if (mine.length === 0) return null;
  return (
    <ul className="nw-findings">
      {mine.map((finding) => (
        <li key={finding.rule} data-finding={finding.rule}>
          {pack.own.rules[finding.rule]}
          {finding.rule === "R6" ? <span className="nw-cite"> {pack.own.cite}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function TextInput({
  pack,
  card,
  field,
  findings,
  onChange,
  multiline = false,
  disabled = false,
}: {
  readonly pack: DemoPack;
  readonly card: OwnCard;
  readonly field: Field & TextField;
  readonly findings: readonly Finding[];
  readonly onChange: (field: TextField, value: string) => void;
  readonly multiline?: boolean;
  readonly disabled?: boolean;
}) {
  const id = useId();
  const words = pack.own.fields[field];
  const common = {
    id,
    name: field,
    value: card[field],
    maxLength: FIELD_LIMITS[field],
    placeholder: words.placeholder,
    disabled,
    "data-own-field": field,
    className: "nw-input",
    autoComplete: "off",
    spellCheck: false,
  } as const;
  return (
    <div className="nw-field">
      <label htmlFor={id}>{words.label}</label>
      {multiline ? (
        <textarea {...common} rows={2} onChange={(event) => onChange(field, event.target.value)} />
      ) : (
        <input type="text" {...common} onChange={(event) => onChange(field, event.target.value)} />
      )}
      <FindingLines pack={pack} findings={findings} field={field} />
    </div>
  );
}

function Choice<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  findings,
  pack,
  field,
}: {
  readonly legend: string;
  readonly name: string;
  readonly value: T | "";
  readonly options: readonly { readonly value: T; readonly label: string }[];
  readonly onChange: (value: T) => void;
  readonly findings: readonly Finding[];
  readonly pack: DemoPack;
  readonly field: string;
}) {
  return (
    <fieldset className="nw-field nw-fieldset">
      <legend>{legend}</legend>
      <div className="nw-radios">
        {options.map((option) => (
          <label key={option.value} className="nw-radio">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      <FindingLines pack={pack} findings={findings} field={field} />
    </fieldset>
  );
}

/** Beat 7, below the lever: the card form. State lives in the demo, so a restart keeps it. */
export function OwnForm({
  pack,
  card,
  findings,
  onText,
  onKind,
  onNoDenominator,
  onPeriod,
  onComparison,
}: {
  readonly pack: DemoPack;
  readonly card: OwnCard;
  readonly findings: readonly Finding[];
  readonly onText: (field: TextField, value: string) => void;
  readonly onKind: (kind: NumeratorKind) => void;
  readonly onNoDenominator: (value: boolean) => void;
  readonly onPeriod: (period: PeriodKind) => void;
  readonly onComparison: (comparison: Comparison) => void;
}) {
  const own = pack.own;
  const noDenominatorId = useId();
  return (
    <form className="nw-form" data-own-form="" onSubmit={(event) => event.preventDefault()} noValidate>
      <TextInput pack={pack} card={card} field="name" findings={findings} onChange={onText} />
      <TextInput pack={pack} card={card} field="decision" findings={findings} onChange={onText} multiline />
      <TextInput pack={pack} card={card} field="numerator" findings={findings} onChange={onText} />
      <Choice
        pack={pack}
        legend={own.kindLegend}
        name="nw-kind"
        value={card.numeratorKind}
        options={[
          { value: "events", label: own.kinds.events },
          { value: "quantity", label: own.kinds.quantity },
        ]}
        onChange={onKind}
        findings={[]}
        field="numeratorKind"
      />
      <TextInput pack={pack} card={card} field="denominator" findings={findings} onChange={onText} disabled={card.noDenominator} />
      <label className="nw-check" htmlFor={noDenominatorId}>
        <input
          id={noDenominatorId}
          type="checkbox"
          checked={card.noDenominator}
          onChange={(event) => onNoDenominator(event.target.checked)}
          data-own-field="noDenominator"
        />
        <span>{own.noDenominator}</span>
      </label>
      <Choice
        pack={pack}
        legend={own.periodLegend}
        name="nw-period"
        value={card.period}
        options={(["month", "week", "quarter", "year", "other"] as const).map((value) => ({ value, label: own.periods[value] }))}
        onChange={onPeriod}
        findings={findings}
        field="period"
      />
      <Choice
        pack={pack}
        legend={own.comparisonLegend}
        name="nw-comparison"
        value={card.comparison}
        options={(["previous", "lastYear", "plan"] as const).map((value) => ({ value, label: own.comparisons[value] }))}
        onChange={onComparison}
        findings={[]}
        field="comparison"
      />
      <div className="nw-field-pair">
        <TextInput pack={pack} card={card} field="sourceFile" findings={findings} onChange={onText} />
        <TextInput pack={pack} card={card} field="sourceColumn" findings={findings} onChange={onText} />
      </div>
      <TextInput pack={pack} card={card} field="limit" findings={findings} onChange={onText} multiline />
      <TextInput pack={pack} card={card} field="trigger" findings={findings} onChange={onText} multiline />
    </form>
  );
}

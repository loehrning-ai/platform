"use client";

import { useId, useState } from "react";
import { GlasButton, GlasChip, GlasSegmented } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import {
  canAddCard,
  cardToMarkdown,
  FIELD_LIMITS,
  lintCard,
  MAX_CARDS,
  withExample,
  type Finding,
  type NumeratorKind,
  type OwnCard,
  type TextField,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/steckbrief";
import type { Fmt } from "./fmt";
import { OwnFile } from "./own-file";

type Fields = DemoPack["own"]["fields"];
const TEXT_FIELDS: readonly (keyof Fields & TextField)[] = ["name", "decision", "numerator", "denominator", "sourceFile", "sourceColumn", "limit", "trigger"];
const LONG = new Set<TextField>(["limit", "trigger", "decision"]);
const OWN_PERIODS: readonly ("month" | "week" | "workday")[] = ["month", "week", "workday"];

/** The example the preview shows in grey until the visitor types (the placeholders, as a card). */
export function exampleCard(pack: DemoPack): OwnCard {
  const f = pack.own.fields;
  return {
    name: f.name.placeholder,
    decision: f.decision.placeholder,
    numerator: f.numerator.placeholder,
    numeratorKind: "quantity",
    denominator: f.denominator.placeholder,
    noDenominator: false,
    period: "month",
    comparison: "lastYear",
    sourceFile: f.sourceFile.placeholder,
    sourceColumn: f.sourceColumn.placeholder,
    limit: f.limit.placeholder,
    trigger: f.trigger.placeholder,
    adjusted: false,
  };
}

function Findings({ pack, findings, field }: { readonly pack: DemoPack; readonly findings: readonly Finding[]; readonly field: string }) {
  const mine = findings.filter((finding) => finding.field === field);
  if (mine.length === 0) return null;
  return (
    <ul className="w02-findings">
      {mine.map((finding) => (
        <li key={finding.rule} data-finding={finding.rule} className="w02-finding">
          {pack.own.rules[finding.rule]}
          {finding.rule === "R6" ? <span className="w02-cite"> {pack.own.cite}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function Field({
  pack,
  card,
  field,
  findings,
  onChange,
}: {
  readonly pack: DemoPack;
  readonly card: OwnCard;
  readonly field: keyof Fields & TextField;
  readonly findings: readonly Finding[];
  readonly onChange: (field: TextField, value: string) => void;
}) {
  const id = useId();
  const words = pack.own.fields[field];
  const disabled = field === "denominator" && card.noDenominator;
  const common = {
    id,
    name: field,
    value: card[field],
    maxLength: FIELD_LIMITS[field],
    placeholder: words.placeholder,
    disabled,
    autoComplete: "off",
    className: "w02-input",
    "data-own-field": field,
  };
  return (
    <div className="w02-field">
      <label htmlFor={id}>{words.label}</label>
      {LONG.has(field) ? (
        <textarea {...common} rows={2} onChange={(event) => onChange(field, event.target.value)} />
      ) : (
        <input {...common} type="text" onChange={(event) => onChange(field, event.target.value)} />
      )}
      <Findings pack={pack} findings={findings} field={field} />
    </div>
  );
}

/** A fork the visitor has not answered yet: chips, none selected. */
function ForkChips<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  readonly label: string;
  readonly hint: string;
  readonly options: readonly { value: T; label: string }[];
  readonly value: T | "";
  readonly onChange: (value: T) => void;
}) {
  return (
    <div className="w02-fork" role="group" aria-label={label}>
      <p className="w02-fork-label">
        {label} <span className="w02-fork-hint">{hint}</span>
      </p>
      <div className="w02-row">
        {options.map((option) => (
          <GlasChip key={option.value} kind="filter" selected={option.value === value} onClick={() => onChange(option.value)}>
            {option.label}
          </GlasChip>
        ))}
      </div>
    </div>
  );
}

/**
 * "Deine Kennzahl": the four forks of the skill, the text fields, the shared
 * lint R1 to R8 as sentences under their field, and the live Markdown in the
 * skill's format. Nothing leaves this tab.
 */
export function OwnCardForm({
  pack,
  fmt,
  card,
  cards,
  onCard,
  onAdd,
  onRemove,
  onClear,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly card: OwnCard;
  readonly cards: readonly OwnCard[];
  readonly onCard: (card: OwnCard) => void;
  readonly onAdd: () => void;
  readonly onRemove: (index: number) => void;
  readonly onClear: () => void;
}) {
  const o = pack.own;
  const [fileOpen, setFileOpen] = useState(false);
  const findings = lintCard(card);
  const preview = withExample(card, exampleCard(pack));
  const markdown = cardToMarkdown(preview.card, o.card).split("\n");
  const set = (patch: Partial<OwnCard>) => onCard({ ...card, ...patch });
  const full = cards.length >= MAX_CARDS;
  return (
    <div className="w02-own" data-w02-own="">
      <p className="w02-privacy">{o.privacy}</p>
      <div className="w02-own-grid">
        <div className="w02-own-form">
          <ForkChips
            label={o.forks.kind.label}
            hint={o.forks.kind.hint}
            options={(["events", "quantity"] as const).map((value) => ({
              value,
              label: o.forks.kind[value],
            }))}
            value={card.numeratorKind}
            onChange={(numeratorKind: Exclude<NumeratorKind, "">) => set({ numeratorKind })}
          />
          <div className="w02-fork">
            <p className="w02-fork-label">
              {o.forks.denom.label} <span className="w02-fork-hint">{o.forks.denom.hint}</span>
            </p>
            <GlasSegmented
              label={o.forks.denom.label}
              options={[
                { value: "without", label: o.forks.denom.without },
                { value: "with", label: o.forks.denom.with },
              ]}
              value={card.noDenominator ? "without" : "with"}
              onChange={(value) => set({ noDenominator: value === "without" })}
            />
          </div>
          <ForkChips
            label={o.forks.period.label}
            hint={o.forks.period.hint}
            options={OWN_PERIODS.map((value) => ({
              value,
              label: o.forks.period[value],
            }))}
            value={card.period === "month" || card.period === "week" || card.period === "workday" ? card.period : ""}
            onChange={(period) => set({ period, comparison: card.comparison || "previous" })}
          />
          <div className="w02-fork">
            <p className="w02-fork-label">
              {o.forks.reported.label} <span className="w02-fork-hint">{o.forks.reported.hint}</span>
            </p>
            <GlasSegmented
              label={o.forks.reported.label}
              options={[
                { value: "reported", label: o.forks.reported.reported },
                { value: "adjusted", label: o.forks.reported.adjusted },
              ]}
              value={card.adjusted ? "adjusted" : "reported"}
              onChange={(value) => set({ adjusted: value === "adjusted" })}
            />
            <Findings pack={pack} findings={findings} field="name" />
          </div>
          {TEXT_FIELDS.map((field) => (
            <Field key={field} pack={pack} card={card} field={field} findings={findings} onChange={(name, value) => set({ [name]: value } as Partial<OwnCard>)} />
          ))}
          <Findings pack={pack} findings={findings} field="period" />
        </div>
        <div className="w02-own-preview">
          <p className="w02-doc-kicker">{o.preview}</p>
          <pre className="w02-markdown" data-w02-preview="">
            {markdown.map((line, index) => (
              <span key={index} data-example={preview.typed[index] === false ? "" : undefined}>
                {line}
                {"\n"}
              </span>
            ))}
          </pre>
          <p className="w02-note">{o.exampleNote}</p>
          <div className="w02-row">
            <GlasButton variant="prominent" size="compact" icon="plus" onClick={onAdd} disabled={!canAddCard(card) || full}>
              {o.add}
            </GlasButton>
            <span className="w02-note">{fmt.t(o.count, { n: cards.length, max: MAX_CARDS })}</span>
          </div>
          {full ? <p className="w02-note">{fmt.t(o.full, { max: MAX_CARDS })}</p> : !canAddCard(card) ? <p className="w02-note">{o.needs}</p> : null}
          {cards.length > 0 ? (
            <div className="w02-own-added">
              <p className="w02-doc-kicker">{o.added}</p>
              <ul>
                {cards.map((added, index) => (
                  <li key={`${added.name}-${index}`}>
                    <span>{added.name}</span>
                    <GlasButton variant="plain" size="compact" onClick={() => onRemove(index)}>
                      {o.remove}
                    </GlasButton>
                  </li>
                ))}
              </ul>
              <GlasButton variant="plain" size="compact" onClick={onClear}>
                {o.clear}
              </GlasButton>
            </div>
          ) : null}
        </div>
      </div>
      <div className="w02-own-file-wrap">
        <GlasButton variant="fill" size="compact" icon="upload" aria-expanded={fileOpen} onClick={() => setFileOpen((open) => !open)}>
          {fileOpen ? o.file.close : o.file.open}
        </GlasButton>
        {fileOpen ? <OwnFile pack={pack} fmt={fmt} onTake={(numeratorKind) => set({ numeratorKind })} /> : null}
      </div>
    </div>
  );
}

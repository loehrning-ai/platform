"use client";

import { forwardRef, useId, useMemo, useState, type ReactNode } from "react";
import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import {
  fill,
  missingDocMails,
  missingText,
  periodText,
  reasonText,
  safeWording,
  toMarkdownTable,
  toRegisterCsv,
  type ExportWords,
} from "@/lib/demo-cases/esg-berichte-mit-ki/export";
import {
  addRow,
  cleanSentence,
  DESTINATIONS,
  effectiveGates,
  EMPTY_INPUT,
  EVIDENCE,
  forcesNotFinal,
  GATE_IDS,
  isConsumer,
  MAX_ROWS,
  MAX_SENTENCE,
  probeOwn,
  usesMonths,
  usesValidity,
  validate,
  validityOptional,
  type GateId,
  type OwnInput,
  type OwnRow,
} from "@/lib/demo-cases/esg-berichte-mit-ki/own";
import { StatusTag } from "./parts";

export function exportWords(pack: Pack): ExportWords {
  const own = pack.own;
  return {
    statuses: pack.statuses,
    destinations: own.destinations,
    evidenceAfterLaut: own.evidenceAfterLaut,
    evidence: own.evidenceOptions,
    months: own.monthNames,
    and: own.and,
    to: own.to,
    monthsCount: own.monthsCount,
    wholeYear: own.wholeYear,
    decisions: own.decisions,
    reasons: own.reasons,
    missing: own.missing,
    safe: own.safe,
    table: own.table,
    csv: own.csv,
    mail: own.mail,
  };
}

function Segmented<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  disabled,
}: {
  readonly legend: ReactNode;
  readonly name: string;
  readonly options: readonly (readonly [T, string])[];
  readonly value: T | undefined;
  readonly onChange: (value: T) => void;
  readonly disabled?: boolean;
}) {
  return (
    <fieldset className="nw-field" disabled={disabled}>
      <legend className="nw-label">{legend}</legend>
      <div className="nw-segmented">
        {options.map(([key, label]) => (
          <label key={key} className="nw-segment">
            <input type="radio" name={name} value={key} checked={value === key} onChange={() => onChange(key)} />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * "Deine Sätze": one card, always visible. The probe of the demo applied to
 * the visitor's own sentence, a list of up to 20, and the exports. Nothing is
 * sent or stored; "Von vorn" never clears it, only its own button does.
 */
export const OwnSentences = forwardRef<HTMLElement, { readonly pack: Pack; readonly onRows: (rows: readonly OwnRow[]) => void }>(
  function OwnSentences({ pack, onRows }, ref) {
    const own = pack.own;
    const words = useMemo(() => exportWords(pack), [pack]);
    const id = useId();
    const [input, setInput] = useState<OwnInput>(EMPTY_INPUT);
    const [rows, setRows] = useState<readonly OwnRow[]>([]);
    const [shown, setShown] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const sentence = cleanSentence(input.sentence);
    const errors = validate(input);
    const result = probeOwn(input);
    const consumer = isConsumer(input.destination);
    const forced = forcesNotFinal(input.evidence);
    const gates = effectiveGates(input);
    const safe = safeWording(input, result, sentence, words);
    const full = rows.length >= MAX_ROWS;

    const update = (patch: Partial<OwnInput>) => {
      setInput((previous) => ({ ...previous, ...patch }));
      setShown(false);
    };
    const setRowsAndTell = (next: readonly OwnRow[]) => {
      setRows(next);
      onRows(next);
    };
    const flash = async (key: string, text: string) => {
      if (await copyText(text)) setCopied(key);
    };

    const add = () => {
      if (errors.length > 0 || full) return;
      setRowsAndTell(addRow(rows, { sentence, destination: input.destination, evidence: input.evidence, result, safe, period: periodText(input, words) }));
    };

    const gateAnswer = (gate: GateId) => {
      const answer = input.gates[gate];
      if (gate === "4b" && answer === undefined) return input.scope !== "yes" ? "yes" : "no";
      return answer === undefined ? undefined : answer ? "yes" : "no";
    };
    const mails = missingDocMails(rows, words);

    return (
      <section ref={ref} className="nw-own" aria-labelledby={`${id}-heading`} data-own-sentences="">
        <h2 id={`${id}-heading`} className="nw-own-heading">
          {own.heading}
        </h2>
        <p className="nw-own-privacy">{own.privacy}</p>

        <div className="nw-own-form">
          <div className="nw-field">
            <label className="nw-label" htmlFor={`${id}-sentence`}>
              {own.sentence}
            </label>
            <textarea
              id={`${id}-sentence`}
              className="nw-input"
              rows={2}
              maxLength={MAX_SENTENCE}
              placeholder={own.sentencePlaceholder}
              value={input.sentence}
              onChange={(event) => update({ sentence: event.target.value })}
              aria-describedby={`${id}-counter`}
            />
            <p id={`${id}-counter`} className="nw-hint" data-over={input.sentence.length >= MAX_SENTENCE ? "" : undefined}>
              {fill(own.counter, { n: input.sentence.length })}
            </p>
          </div>

          <Segmented
            legend={own.destination}
            name={`${id}-destination`}
            options={DESTINATIONS.map((key) => [key, own.destinations[key]] as const)}
            value={input.destination}
            onChange={(destination) => update({ destination })}
          />

          <div className="nw-field">
            <label className="nw-label" htmlFor={`${id}-evidence`}>
              {own.evidence}
            </label>
            <select
              id={`${id}-evidence`}
              className="nw-input"
              value={input.evidence}
              onChange={(event) => update({ evidence: event.target.value as OwnInput["evidence"] })}
            >
              {EVIDENCE.map((key) => (
                <option key={key} value={key}>
                  {own.evidenceOptions[key]}
                </option>
              ))}
            </select>
          </div>

          {input.evidence !== "nothing" && usesMonths(input.evidence) ? (
            <>
              <fieldset className="nw-field">
                <legend className="nw-label">{own.months}</legend>
                <div className="nw-months">
                  {own.monthsShort.map((label, index) => (
                    <button
                      key={label + index}
                      type="button"
                      className="nw-month"
                      aria-pressed={input.months[index] === true}
                      aria-label={own.monthNames[index]}
                      onClick={() => update({ months: input.months.map((on, i) => (i === index ? !on : on)) })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="nw-inline-actions">
                  <button type="button" className="nw-text-button" onClick={() => update({ months: input.months.map(() => true) })}>
                    {own.allMonths}
                  </button>
                  <button type="button" className="nw-text-button" onClick={() => update({ months: input.months.map(() => false) })}>
                    {own.noMonths}
                  </button>
                </div>
              </fieldset>
              <Segmented
                legend={own.period}
                name={`${id}-period`}
                options={[
                  ["year", own.wholeYear],
                  ["months", own.someMonths],
                ]}
                value={input.wholeYear ? "year" : "months"}
                onChange={(value) => update({ wholeYear: value === "year" })}
              />
            </>
          ) : null}

          {usesValidity(input.evidence) ? (
            <div className="nw-field-row">
              <div className="nw-field">
                <label className="nw-label" htmlFor={`${id}-valid`}>
                  {validityOptional(input.evidence) ? own.validUntilOptional : own.validUntil}
                </label>
                <input
                  id={`${id}-valid`}
                  className="nw-input"
                  inputMode="numeric"
                  placeholder={own.datePlaceholder}
                  value={input.validUntil}
                  onChange={(event) => update({ validUntil: event.target.value })}
                />
                {errors.includes("validUntilFormat") ? <p className="nw-error">{own.errors.validUntilFormat}</p> : null}
              </div>
              <div className="nw-field">
                <label className="nw-label" htmlFor={`${id}-stichtag`}>
                  {own.stichtagLabel}
                </label>
                <input
                  id={`${id}-stichtag`}
                  className="nw-input"
                  inputMode="numeric"
                  placeholder={own.datePlaceholder}
                  value={input.stichtag}
                  onChange={(event) => update({ stichtag: event.target.value })}
                />
                {errors.includes("stichtagFormat") ? <p className="nw-error">{own.errors.stichtagFormat}</p> : null}
                {errors.includes("stichtagNeeded") ? <p className="nw-error">{own.errors.stichtagNeeded}</p> : null}
              </div>
            </div>
          ) : null}

          {input.evidence !== "nothing" ? (
            <>
              <Segmented
                legend={own.scope}
                name={`${id}-scope`}
                options={(["yes", "part", "unsure"] as const).map((key) => [key, own.scopeOptions[key]] as const)}
                value={input.scope}
                onChange={(scope) => update({ scope })}
              />
              <Segmented
                legend={own.final}
                name={`${id}-final`}
                options={(["yes", "no", "unsure"] as const).map((key) => [key, own.finalOptions[key]] as const)}
                value={forced ? "no" : input.final}
                onChange={(final) => update({ final })}
                disabled={forced}
              />
              {forced ? <p className="nw-hint">{own.finalForced}</p> : null}
            </>
          ) : null}

          {consumer ? (
            <div className="nw-gates">
              <p className="nw-label">{own.gatesHeading}</p>
              {GATE_IDS.map((gate) => (
                <Segmented
                  key={gate}
                  legend={
                    <>
                      <span className="nw-gate-id">{gate === "zukunft" ? "Art. 6" : gate}</span> {own.gates[gate]}
                    </>
                  }
                  name={`${id}-gate-${gate}`}
                  options={[
                    ["yes", own.yes],
                    ["no", own.no],
                  ]}
                  value={gateAnswer(gate)}
                  onChange={(value) => update({ gates: { ...input.gates, [gate]: value === "yes" } })}
                />
              ))}
              {input.gates.zukunft === true ? (
                <Segmented
                  legend={own.plan}
                  name={`${id}-plan`}
                  options={[
                    ["yes", own.yes],
                    ["no", own.no],
                  ]}
                  value={input.plan === undefined ? undefined : input.plan ? "yes" : "no"}
                  onChange={(value) => update({ plan: value === "yes" })}
                />
              ) : null}
            </div>
          ) : null}

          <div className="nw-own-actions">
            <button type="button" className="nw-button nw-button-primary" disabled={errors.includes("sentenceEmpty")} onClick={() => setShown(true)}>
              {pack.folder.check}
            </button>
            {errors.includes("sentenceEmpty") ? <p className="nw-hint">{own.errors.sentenceEmpty}</p> : null}
          </div>
        </div>

        {shown && !errors.includes("sentenceEmpty") ? (
          <div className="nw-own-result" aria-live="polite" data-own-result="">
            <p className="nw-label">{own.resultHeading}</p>
            <p className="nw-own-verdict">
              <StatusTag status={result.status} pack={pack} />
              <span data-own-decision="">{own.decisions[result.decision]}</span>
            </p>
            {gates.length > 0 || result.reasons.length > 0 ? (
              <ul className="nw-own-reasons">
                {result.reasons.map((reason, index) => (
                  <li key={index}>{reasonText(reason, words)}</li>
                ))}
              </ul>
            ) : null}
            {result.missing.length > 0 ? (
              <p>
                <strong>{own.missingLabel}: </strong>
                {result.missing.map((doc) => missingText(doc, words)).join("; ")}
              </p>
            ) : null}
            <p>
              <strong>{own.safeLabel}: </strong>
              {safe ?? own.safe.cut}
            </p>
            {errors.length > 0 ? (
              <p className="nw-error" data-own-errors="">
                {errors.map((error) => own.errors[error]).join(" ")}
              </p>
            ) : null}
            <p className="nw-hint">{own.limit}</p>
            <div className="nw-own-actions">
              <button type="button" className="nw-button" disabled={full || errors.length > 0} onClick={add}>
                {own.add}
              </button>
              {full ? <p className="nw-error">{own.full}</p> : null}
            </div>
          </div>
        ) : null}

        <div className="nw-own-list">
          <p className="nw-label">{fill(own.listHeading, { n: rows.length })}</p>
          {rows.length === 0 ? (
            <p className="nw-hint">{own.listEmpty}</p>
          ) : (
            <>
              <ol className="nw-own-rows">
                {rows.map((row, index) => (
                  <li key={index}>
                    <StatusTag status={row.result.status} pack={pack} />
                    <span className="nw-own-row-text">{row.sentence}</span>
                    <span className="nw-hint">{own.decisions[row.result.decision]}</span>
                  </li>
                ))}
              </ol>
              <div className="nw-own-actions">
                <button type="button" className="nw-button" onClick={() => flash("table", toMarkdownTable(rows, words))}>
                  {copied === "table" ? own.copied : own.copyTable}
                </button>
                <button type="button" className="nw-button" data-own-download="" onClick={() => download(own.downloadName, toRegisterCsv(rows, words))}>
                  {own.download}
                </button>
              </div>
              {mails.length > 0 ? (
                <div className="nw-mails">
                  <p className="nw-label">{own.mailsHeading}</p>
                  {mails.map((mail) => (
                    <div key={mail.doc} className="nw-mail">
                      <pre className="nw-mail-text">{mail.text}</pre>
                      <button type="button" className="nw-button" onClick={() => flash(mail.doc, mail.text)}>
                        {copied === mail.doc ? own.copied : own.copyMail}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
          <button
            type="button"
            className="nw-text-button"
            onClick={() => {
              setInput(EMPTY_INPUT);
              setShown(false);
              setRowsAndTell([]);
            }}
          >
            {own.clear}
          </button>
        </div>
      </section>
    );
  },
);

"use client";

import { useId } from "react";
import { GlasButton, GlasDropZone, GlasSegmented } from "@/components/demos/glas";
import { MIN_LERNEN, PRUEF, RULES, type RuleName } from "@/lib/demo-cases/ki-prognosen-einschaetzen/check";
import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { fill, formatDay } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";
import { LAMP_WEEKS, type OwnOutcome, type OwnProblem } from "@/lib/demo-cases/ki-prognosen-einschaetzen/own";
import { MAX_ROWS } from "@/lib/demo-cases/ki-prognosen-einschaetzen/parse";
import { jars, notANumber } from "./helpers";

export interface OwnInputs {
  readonly text: string;
  readonly series: string;
  readonly rule: RuleName;
  readonly short: string;
  readonly left: string;
}

export const EMPTY_OWN: OwnInputs = { text: "", series: "", rule: "wie letzte Woche", short: "", left: "" };

/** What is wrong with the file and how to fix it, as the copy's two sentences. */
export function problemText(copy: DemoPack, problem: OwnProblem | { readonly key: "tooBig" | "fileType" }): string {
  const errors = copy.own.errors;
  const date = (iso: string) => formatDay(iso, copy.locale, true);
  switch (problem.key) {
    case "empty":
    case "tooBig":
    case "header":
    case "daily":
    case "fileType":
    case "zeroSales":
      return errors[problem.key];
    case "tooManyRows":
      return fill(errors.tooManyRows, { rows: problem.rows, max: MAX_ROWS });
    case "date":
      return fill(errors.date, { line: problem.line, value: problem.value });
    case "number":
    case "negative":
      return fill(errors[problem.key], { line: problem.line, column: problem.column, value: problem.value });
    case "conflict":
      return fill(errors.conflict, { date: date(problem.date), first: problem.first, line: problem.line });
    case "tooFew":
      return fill(errors.tooFew, { weeks: problem.weeks, min: PRUEF });
  }
}

/** The parse report as sentences: what was read, what was doubled or missing, what is still needed. */
export function reportLines(copy: DemoPack, outcome: OwnOutcome & { readonly kind: "ok" }): readonly string[] {
  const { check, result, notices, ignored, manyZeros, lampsReady, forecastWeeks } = outcome;
  const locale = copy.locale;
  const date = (iso: string) => formatDay(iso, locale, true);
  const lines: string[] = [fill(copy.own.read, { weeks: check.rows.filter((row) => row.line !== null).length })];
  for (const notice of notices) lines.push(fill(notice.key === "duplicate" ? copy.own.duplicate : copy.own.gap, { date: date(notice.date) }));
  const missing = check.hasForecast ? check.rows.filter((row) => row.ist !== null && row.f === null).length : 0;
  if (missing > 0) lines.push(fill(copy.own.missingForecast, { count: missing }));
  if (ignored.length > 0) lines.push(fill(copy.own.ignored, { columns: ignored.join(", ") }));
  if (manyZeros) lines.push(copy.own.zeros);
  if (!check.hasForecast) {
    lines.push(fill(copy.own.noForecast, { min: LAMP_WEEKS }));
    const mae = result.tabelle[result.messlatte]?.mae;
    if (mae !== undefined) lines.push(fill(copy.own.noForecastRule, { rule: copy.own.ruleNames[result.messlatte], mae: jars(mae, locale) }));
  } else if (!lampsReady) {
    lines.push(fill(copy.own.needMore, { min: LAMP_WEEKS, weeks: forecastWeeks }));
  } else if (result.spanne_wochen < result.wochen) {
    lines.push(fill(copy.s3.fewWeeks, { rangeWeeks: result.spanne_wochen, weeks: result.wochen }));
  }
  lines.push(fill(copy.own.ready, { from: date(result.von), to: date(result.bis), weeks: result.wochen }));
  return lines;
}

/**
 * Step 6, "Deine Daten": the visitor's own file, read in this tab only. A
 * drop zone, a paste area, the parse report as sentences, and the three
 * fields the check needs (the rule without a tool, the two costs, the
 * person). Then the same five scenes replay on their file. Nothing is sent,
 * nothing is stored, and r never clears it; "Eigene Eingaben löschen" does.
 */
export function OwnStep({
  copy,
  inputs,
  outcome,
  fileProblem,
  owner,
  onInputs,
  onCheck,
  onFile,
  onKitTry,
  onTemplate,
  onClear,
  onReplay,
  onExplore,
  onOwner,
}: {
  readonly copy: DemoPack;
  readonly inputs: OwnInputs;
  readonly outcome: OwnOutcome;
  readonly fileProblem: "tooBig" | "fileType" | null;
  readonly owner: string;
  readonly onInputs: (next: OwnInputs) => void;
  readonly onCheck: () => void;
  readonly onFile: (file: File) => void;
  readonly onKitTry: () => void;
  readonly onTemplate: () => void;
  readonly onClear: () => void;
  readonly onReplay: () => void;
  readonly onExplore: () => void;
  readonly onOwner: (owner: string) => void;
}) {
  const id = useId();
  const ok = outcome.kind === "ok";
  const error = fileProblem ? problemText(copy, { key: fileProblem }) : outcome.kind === "problem" ? problemText(copy, outcome.problem) : null;
  const set = (patch: Partial<OwnInputs>) => onInputs({ ...inputs, ...patch });
  const costError = [inputs.short, inputs.left].find((text) => notANumber(text));
  return (
    <div className="w01-own" data-w01-own="">
      <p className="w01-line is-strong">{copy.own.privacy}</p>
      <GlasDropZone text={copy.own.drop} buttonLabel={copy.own.pick} accept=".csv,.txt,text/csv,text/plain" onFile={onFile} error={error ?? undefined} />
      <div className="w01-own-links">
        <GlasButton variant="plain" size="compact" icon="download" onClick={onTemplate}>
          {copy.own.template}
        </GlasButton>
        <GlasButton variant="plain" size="compact" icon="doc" onClick={onKitTry}>
          {copy.own.kitTry}
        </GlasButton>
      </div>
      <label className="w01-field" htmlFor={`${id}-paste`}>
        <span className="w01-field-label">{copy.own.paste}</span>
        <textarea
          id={`${id}-paste`}
          className="w01-input is-area"
          value={inputs.text}
          placeholder={copy.own.pastePlaceholder}
          onChange={(event) => set({ text: event.target.value })}
          rows={4}
          spellCheck={false}
          data-w01-paste=""
        />
      </label>
      <div className="w01-own-links">
        <GlasButton variant="glass" size="compact" icon="check" onClick={onCheck} data-w01-check="">
          {copy.own.check}
        </GlasButton>
      </div>
      {outcome.kind === "empty" && !fileProblem ? <p className="w01-line w01-soft">{fill(copy.own.empty, { min: MIN_LERNEN + PRUEF })}</p> : null}
      {ok ? (
        <div className="w01-report" data-w01-report="">
          {reportLines(copy, outcome).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}
      <div className="w01-own-fields">
        <label className="w01-field" htmlFor={`${id}-series`}>
          <span className="w01-field-label">{copy.own.series}</span>
          <input id={`${id}-series`} className="w01-input" value={inputs.series} placeholder={copy.own.seriesFallback} onChange={(event) => set({ series: event.target.value })} maxLength={60} autoComplete="off" />
        </label>
        <div className="w01-field">
          <span className="w01-field-label">{copy.own.rule}</span>
          <GlasSegmented
            label={copy.own.rule}
            options={RULES.map((rule) => ({ value: rule, label: copy.own.ruleNames[rule] }))}
            value={inputs.rule}
            onChange={(rule) => set({ rule })}
            wrap
            glass
          />
        </div>
        <label className="w01-field" htmlFor={`${id}-short`}>
          <span className="w01-field-label">{copy.own.costShort}</span>
          <input id={`${id}-short`} className="w01-input" inputMode="decimal" value={inputs.short} onChange={(event) => set({ short: event.target.value })} placeholder="1,50" autoComplete="off" />
        </label>
        <label className="w01-field" htmlFor={`${id}-left`}>
          <span className="w01-field-label">{copy.own.costLeft}</span>
          <input id={`${id}-left`} className="w01-input" inputMode="decimal" value={inputs.left} onChange={(event) => set({ left: event.target.value })} placeholder="0,40" autoComplete="off" />
        </label>
        {costError ? <p className="w01-line" role="alert">{fill(copy.own.notNumber, { value: costError })}</p> : null}
        <label className="w01-field" htmlFor={`${id}-owner`}>
          <span className="w01-field-label">{copy.s5.owner}</span>
          <input id={`${id}-owner`} className="w01-input" value={owner} placeholder={copy.s5.ownerPlaceholder} onChange={(event) => onOwner(event.target.value)} maxLength={80} autoComplete="off" />
        </label>
      </div>
      <div className="w01-own-links">
        {ok ? (
          <>
            <GlasButton variant="prominent" icon="play" onClick={onReplay} data-w01-replay="">
              {copy.own.replay}
            </GlasButton>
            <GlasButton variant="glass" icon="sliders" onClick={onExplore}>
              {copy.own.explore}
            </GlasButton>
          </>
        ) : null}
        {inputs.text || inputs.series || inputs.short || inputs.left ? (
          <GlasButton variant="plain" size="compact" icon="close" onClick={onClear} data-w01-clear="">
            {copy.own.clear}
          </GlasButton>
        ) : null}
      </div>
    </div>
  );
}

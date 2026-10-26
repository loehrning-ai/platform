"use client";

import { useId, type ChangeEvent, type ReactNode } from "react";
import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { RULES, PRUEF, type RuleName } from "@/lib/demo-cases/ki-prognosen-einschaetzen/check";
import { formatNumber, formatOne, formatPercent, formatShortDay, fill } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";
import { LAMP_WEEKS, type OwnOutcome, type OwnProblem } from "@/lib/demo-cases/ki-prognosen-einschaetzen/own";
import { MAX_ROWS } from "@/lib/demo-cases/ki-prognosen-einschaetzen/parse";
import { SeriesChart } from "./series-chart";

type OwnCopy = DemoPack["own"];

/** One sentence per problem, naming the line and the fix. */
export function problemText(problem: OwnProblem | { readonly key: "fileType" }, copy: OwnCopy, locale: DemoPack["locale"]): string {
  const errors = copy.errors;
  switch (problem.key) {
    case "tooManyRows":
      return fill(errors.tooManyRows, { rows: formatNumber(problem.rows, locale), max: formatNumber(MAX_ROWS, locale) });
    case "date":
      return fill(errors.date, { line: problem.line, value: problem.value });
    case "number":
    case "negative":
      return fill(errors[problem.key], { line: problem.line, column: problem.column, value: problem.value });
    case "conflict":
      return fill(errors.conflict, { date: problem.date, first: problem.first, line: problem.line });
    case "tooFew":
      return fill(errors.tooFew, { weeks: problem.weeks, min: PRUEF });
    default:
      return errors[problem.key];
  }
}

export interface OwnInputs {
  readonly text: string;
  readonly series: string;
  readonly messlatte: RuleName;
  readonly short: string;
  readonly left: string;
}

/**
 * The stage of "Deine Daten": the visitor's series once checked. Before, the
 * file's shape (the header and the last weeks of the kit CSV, the real file,
 * not an invented one) and one tap that loads the kit file, so a phone
 * without a CSV still sees the four checks run on a file it did not type.
 */
export function OwnStage({
  copy,
  outcome,
  series,
  example,
  onKitTry,
}: {
  readonly copy: DemoPack;
  readonly outcome: OwnOutcome;
  readonly series: string;
  /** The kit CSV's header and last rows, verbatim. */
  readonly example: readonly string[];
  readonly onKitTry: () => void;
}) {
  if (outcome.kind !== "ok") {
    return (
      <div className="fl-stage fl-own-empty">
        <p className="fl-own-title">{copy.own.heading}</p>
        <p className="fl-own-hint">{fill(copy.own.empty, { min: PRUEF })}</p>
        <div className="fl-own-example">
          <p className="fl-mini-label">{fill(copy.own.exampleLabel, { file: copy.files.csv })}</p>
          <pre className="fl-own-header" data-fl-example="">
            {example.join("\n")}
          </pre>
        </div>
        <button type="button" className="fl-button is-primary fl-own-try" onClick={onKitTry} data-fl-kit-try="">
          {copy.own.kitTry}
        </button>
        <p className="fl-own-hint is-small">{fill(copy.own.kitTryNote, { file: copy.files.csv, costs: copy.files.costs })}</p>
      </div>
    );
  }
  const { check, result } = outcome;
  const from = Math.max(0, (check.wochen[0] ?? 0) - 1);
  const to = check.naechste ?? check.letzte;
  return (
    <div className="fl-stage">
      <div className="fl-stage-head">
        <div className="fl-card" data-fl-card="own">
          <span className="fl-card-file">{series}</span>
        </div>
      </div>
      {/* The summary on its own full-width line, so the week count is never cut. */}
      <p className="fl-files" data-fl-files="own">
        {fill(copy.own.summary, { from: formatShortDay(result.von, copy.locale), to: formatShortDay(result.bis, copy.locale), weeks: result.wochen })}
      </p>
      <SeriesChart
        check={check}
        locale={copy.locale}
        from={from}
        to={to}
        labels={{ soldOut: copy.chart.soldOut, noForecast: copy.chart.noForecast, baseline: copy.chart.baseline, forecast: copy.chart.forecast }}
        ruleShift={1}
        ticks={check.wochen.length}
        bands={outcome.lampsReady ? check.wochen.length : null}
        bars={!outcome.lampsReady}
        stub={
          result.naechste?.planzahl !== undefined && check.naechste !== null
            ? { t: check.naechste, value: result.naechste.planzahl, label: formatNumber(result.naechste.planzahl, copy.locale) }
            : null
        }
      />
    </div>
  );
}

/** Below the lever: paste area, fields, the four results and the two downloads. */
export function OwnPanel({
  copy,
  inputs,
  onChange,
  onCheck,
  onClear,
  outcome,
  fileProblem,
  ownerField,
  onDownloadRule,
  onDownloadCsv,
}: {
  readonly copy: DemoPack;
  readonly inputs: OwnInputs;
  readonly onChange: (next: Partial<OwnInputs>) => void;
  readonly onCheck: () => void;
  readonly onClear: () => void;
  readonly outcome: OwnOutcome;
  readonly fileProblem: "tooBig" | "fileType" | null;
  readonly ownerField: ReactNode;
  readonly onDownloadRule: () => void;
  readonly onDownloadCsv: () => void;
}) {
  const id = useId();
  const own = copy.own;
  const locale = copy.locale;
  const ruleName = (name: RuleName) => copy.ruleNames[name];
  const problem = fileProblem ? problemText({ key: fileProblem }, own, locale) : outcome.kind === "problem" ? problemText(outcome.problem, own, locale) : null;
  const text = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => event.target.value;

  return (
    <div className="fl-own" data-fl-own="">
      <p className="fl-own-privacy">{own.privacy}</p>
      <label className="fl-field" htmlFor={`${id}-paste`}>
        <span className="fl-field-label">{own.paste}</span>
        <textarea
          id={`${id}-paste`}
          className="fl-textarea"
          rows={5}
          spellCheck={false}
          placeholder={own.pastePlaceholder}
          value={inputs.text}
          onChange={(event) => onChange({ text: text(event) })}
          data-fl-paste=""
        />
      </label>
      <p className="fl-hint">{own.excel}</p>
      <div className="fl-row">
        <button type="button" className="fl-button is-primary" onClick={onCheck} data-fl-check="">
          {own.check}
        </button>
        <button type="button" className="fl-button" onClick={onClear} data-fl-clear="">
          {own.clear}
        </button>
      </div>
      <div className="fl-fields">
        <label className="fl-field">
          <span className="fl-field-label">{own.series}</span>
          <input className="fl-input" value={inputs.series} onChange={(event) => onChange({ series: text(event) })} autoComplete="off" />
        </label>
        <label className="fl-field">
          <span className="fl-field-label">{own.baseline}</span>
          <select className="fl-input" value={inputs.messlatte} onChange={(event) => onChange({ messlatte: text(event) as RuleName })}>
            {RULES.map((name) => (
              <option key={name} value={name}>
                {ruleName(name)}
              </option>
            ))}
          </select>
        </label>
        <label className="fl-field">
          <span className="fl-field-label">{copy.planzahl.costShort}</span>
          <input className="fl-input" inputMode="decimal" value={inputs.short} onChange={(event) => onChange({ short: text(event) })} autoComplete="off" data-fl-own-short="" />
        </label>
        <label className="fl-field">
          <span className="fl-field-label">{copy.planzahl.costLeft}</span>
          <input className="fl-input" inputMode="decimal" value={inputs.left} onChange={(event) => onChange({ left: text(event) })} autoComplete="off" data-fl-own-left="" />
        </label>
        {ownerField}
      </div>

      <div className="fl-own-result" aria-live="polite" data-fl-own-result="">
        {problem ? (
          <p className="fl-problem" role="alert" data-fl-problem="">
            {problem}
          </p>
        ) : null}
        {outcome.kind === "empty" && !problem ? <p className="fl-hint">{fill(own.empty, { min: PRUEF })}</p> : null}
        {outcome.kind === "ok" ? <OwnResult copy={copy} outcome={outcome} /> : null}
        {outcome.kind === "ok" ? (
          <div className="fl-row">
            <button type="button" className="fl-button is-primary" onClick={onDownloadRule} data-fl-own-rule="">
              {own.downloadRule}
            </button>
            <button type="button" className="fl-button" onClick={onDownloadCsv} data-fl-own-csv="">
              {own.downloadCsv}
            </button>
          </div>
        ) : null}
      </div>
      <p className="fl-hint">{fill(own.templateLink, { file: copy.files.template })}</p>
    </div>
  );
}

function OwnResult({ copy, outcome }: { readonly copy: DemoPack; readonly outcome: Extract<OwnOutcome, { kind: "ok" }> }) {
  const own = copy.own;
  const locale = copy.locale;
  const { result, check } = outcome;
  const chosen = result.messlatte;
  const scores = result.tabelle;
  const lines: { readonly key: string; readonly head: string; readonly body: string }[] = [];

  const forecast = scores.Prognose;
  const rule = scores[chosen];
  if (check.hasForecast && forecast && rule) {
    const lead = result.vorsprung ?? 0;
    lines.push({
      key: "baseline",
      head: own.checks[0] as string,
      body: fill(lead >= 0 ? own.lineBaseline : own.lineBaselineWorse, {
        mae: formatOne(forecast.mae, locale),
        rule: copy.ruleNames[chosen],
        maeRule: formatOne(rule.mae, locale),
        lead: formatPercent(Math.abs(lead), locale, { decimals: 0 }),
        closer: result.naeher,
        weeks: result.wochen,
        bias: formatPercent(forecast.bias, locale, { sign: true }),
      }),
    });
  } else {
    const best = scores[result.beste_regel];
    lines.push({
      key: "baseline",
      head: own.checks[0] as string,
      body: fill(own.noForecast, { min: LAMP_WEEKS, rule: copy.ruleNames[result.beste_regel], mae: best ? formatOne(best.mae, locale) : "" }),
    });
  }

  if (outcome.lampsReady) {
    lines.push({
      key: "range",
      head: own.checks[1] as string,
      body: fill(own.lineRange, { hits: result.spanne_treffer, weeks: result.spanne_wochen, promised: Math.round(result.spanne_wochen * 0.8) }),
    });
  } else if (check.hasForecast) {
    lines.push({ key: "range", head: own.checks[1] as string, body: fill(own.needMore, { min: LAMP_WEEKS, weeks: outcome.forecastWeeks }) });
  }

  const next = result.naechste;
  if (check.hasForecast) {
    lines.push({
      key: "plan",
      head: own.checks[2] as string,
      body:
        next?.planzahl !== undefined && next.p10 !== undefined && next.p90 !== undefined
          ? fill(own.linePlan, {
              date: formatShortDay(next.woche, locale),
              forecast: formatNumber(next.prognose, locale),
              p10: formatNumber(Math.floor(next.p10 + 0.5), locale),
              p90: formatNumber(Math.floor(next.p90 + 0.5), locale),
              tau: formatNumber(result.anteil ?? 0, locale, 2, 2),
              plan: formatNumber(next.planzahl, locale),
            })
          : result.anteil === undefined
            ? copy.planzahl.noCosts
            : own.linePlanMissing,
    });
  }

  if (outcome.lampsReady) {
    lines.push({
      key: "rule",
      head: own.checks[3] as string,
      body: fill(own.lineRule, { free: result.regel_frei, total: result.regel_wochen, red: result.regel_wochen - result.regel_frei }),
    });
  }

  const betterRule =
    result.beste_regel !== chosen && scores[result.beste_regel] && rule
      ? fill(own.betterRule, {
          best: copy.ruleNames[result.beste_regel],
          chosen: copy.ruleNames[chosen],
          bestMae: formatOne((scores[result.beste_regel] as { mae: number }).mae, locale),
          chosenMae: formatOne(rule.mae, locale),
        })
      : null;

  return (
    <div className="fl-own-lines">
      <p className="fl-own-summary">
        {fill(own.summary, { from: formatShortDay(result.von, locale), to: formatShortDay(result.bis, locale), weeks: result.wochen })}
      </p>
      {outcome.ignored.length > 0 ? <p className="fl-hint">{fill(own.ignored, { columns: outcome.ignored.join(", ") })}</p> : null}
      {outcome.notices.map((notice, i) => (
        <p key={`${notice.key}${i}`} className="fl-hint">
          {fill(own.notices[notice.key], { date: notice.date })}
        </p>
      ))}
      {outcome.manyZeros ? <p className="fl-hint">{own.zeros}</p> : null}
      {lines.map((line) => (
        <p key={line.key} className="fl-own-line" data-fl-own-line={line.key}>
          <strong>{line.head}</strong>
          <span>{line.body}</span>
        </p>
      ))}
      {betterRule ? (
        <p className="fl-own-line" data-fl-own-line="better">
          <span>{betterRule}</span>
        </p>
      ) : null}
    </div>
  );
}

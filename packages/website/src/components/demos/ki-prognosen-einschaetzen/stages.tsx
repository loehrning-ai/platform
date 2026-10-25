"use client";

import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import type { CheckResult, Checker } from "@/lib/demo-cases/ki-prognosen-einschaetzen/check";
import { runningHits, runningMeans, type Pin } from "@/lib/demo-cases/ki-prognosen-einschaetzen/derive";
import { formatNumber, formatOne, formatPercent, formatShortDay, fill } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";
import { quantile7 } from "@/lib/demo-cases/ki-prognosen-einschaetzen/check";
import { barRise, messlatteFrame, sweep } from "@/lib/demo-cases/ki-prognosen-einschaetzen/timeline";
import { SeriesChart } from "./series-chart";

/**
 * The stages of the first two beats and the range beat, each a pure
 * function of the clock's progress p and the check. The planning number,
 * the rule strip, the own file and the kit tree have their own views.
 */

export function FileCard({
  file,
  label,
  value,
  accent = false,
  testId,
}: {
  readonly file: string;
  readonly label: string;
  readonly value: string;
  readonly accent?: boolean;
  readonly testId?: string;
}) {
  return (
    <div className={accent ? "fl-card is-accent" : "fl-card"} data-fl-card={testId}>
      <span className="fl-card-file">{file}</span>
      <span className="fl-card-label">{label}</span>
      <span className="fl-card-value">{value}</span>
    </div>
  );
}

export interface KitFacts {
  readonly check: Checker;
  readonly result: CheckResult;
  readonly toolAccuracy: number;
  readonly ruleAccuracy: number;
  readonly year: string;
}

function chartLabels(copy: DemoPack) {
  return { soldOut: copy.chart.soldOut, noForecast: copy.chart.noForecast, baseline: copy.chart.baseline, forecast: copy.chart.forecast };
}

/** Beat 1 before the bet: two years of bars rising, the tool's claim quoted from tool-export.txt. */
export function GuessStage({ copy, kit, p }: { readonly copy: DemoPack; readonly kit: KitFacts; readonly p: number }) {
  const { check } = kit;
  const from = 0;
  const to = check.letzte;
  const n = to - from + 1;
  return (
    <div className="fl-stage">
      <div className="fl-stage-head">
        <FileCard
          file={copy.files.export}
          label={fill(copy.guess.accuracyLabel, { year: kit.year })}
          value={formatPercent(kit.toolAccuracy, copy.locale)}
          testId="tool"
        />
      </div>
      <SeriesChart
        check={check}
        locale={copy.locale}
        from={from}
        to={to}
        labels={chartLabels(copy)}
        rise={(t) => barRise(t - from, n, p)}
        fadeBefore={check.wochen[0]}
        noForecastLabel
      />
      <p className="fl-stage-foot">
        {fill(copy.dataLine, { product: copy.product, weeks: check.rows.filter((row) => row.ist !== null).length })}
      </p>
    </div>
  );
}

/** Beat 1 after the bet: the rule line slides one week, the counter runs, the replay counts both error lists. */
export function BaselineStage({
  copy,
  kit,
  p,
  guess,
  pin,
}: {
  readonly copy: DemoPack;
  readonly kit: KitFacts;
  readonly p: number;
  readonly guess: number | null;
  readonly pin: (Pin & { readonly ruleError: number; readonly forecastError: number }) | null;
}) {
  const { check } = kit;
  const scored = check.wochen.length;
  const frame = messlatteFrame(p, scored, guess ?? kit.toolAccuracy * 100, kit.ruleAccuracy * 100);
  const means = runningMeans(check, frame.revealed);
  const pinShown = pin !== null && check.wochen.indexOf(pin.t) < frame.revealed;
  const max = Math.max(1, means.forecast, means.rule);
  const unit = copy.messlatte.unit;
  return (
    <div className="fl-stage">
      <div className="fl-stage-head">
        <FileCard file={copy.files.export} label={copy.messlatte.toolCard} value={formatPercent(kit.toolAccuracy, copy.locale)} testId="tool" />
        <FileCard
          file={copy.files.csv}
          label={copy.messlatte.ruleCard}
          value={`${formatOne(frame.counter, copy.locale)}\u00a0%`}
          accent
          testId="rule"
        />
      </div>
      <SeriesChart
        check={check}
        locale={copy.locale}
        from={check.wochen[0] as number}
        to={check.letzte}
        labels={chartLabels(copy)}
        ruleShift={frame.shift}
        ticks={frame.revealed}
        pin={pinShown ? pin.t : null}
        noForecastLabel
      />
      <div className="fl-tally" data-fl-tally="" aria-live="off">
        <p className="fl-tally-row">
          <span className="fl-tally-name">{copy.chart.forecast}</span>
          <span className="fl-tally-track">
            <span className="fl-tally-bar is-accent" style={{ width: `${(means.forecast / max) * 100}%` }} />
          </span>
          <span className="fl-tally-value">{frame.revealed > 0 ? formatOne(means.forecast, copy.locale) : "·"}</span>
        </p>
        <p className="fl-tally-row">
          <span className="fl-tally-name">{copy.chart.rule}</span>
          <span className="fl-tally-track">
            <span className="fl-tally-bar" style={{ width: `${(means.rule / max) * 100}%` }} />
          </span>
          <span className="fl-tally-value">{frame.revealed > 0 ? formatOne(means.rule, copy.locale) : "·"}</span>
        </p>
        <p className="fl-tally-caption">
          {copy.messlatte.tally} ({unit}) · {frame.revealed}/{scored}
        </p>
      </div>
      <p className="fl-pin-line" data-fl-pin="" style={{ opacity: pinShown ? 1 : 0 }}>
        {pin
          ? fill(copy.messlatte.pin, {
              date: formatShortDay(pin.woche, copy.locale),
              note: pin.note,
              rule: pin.ruleError,
              forecast: pin.forecastError,
            })
          : ""}
      </p>
    </div>
  );
}

/** Beat 2: the corridor from the 26 errors before each week, the actual inside (ink square) or outside (Mennige outline). */
export function RangeStage({
  copy,
  kit,
  p,
  cause,
  showBars,
}: {
  readonly copy: DemoPack;
  readonly kit: KitFacts;
  readonly p: number;
  readonly cause: Pin | null;
  readonly showBars: boolean;
}) {
  const { check, result } = kit;
  const ranged = check.wochen.filter((t) => check.hit(t) !== null);
  const shown = sweep(p, ranged.length);
  const focus = shown > 0 ? (ranged[shown - 1] as number) : null;
  const hits = runningHits(check, shown);
  const promised = Math.round(result.spanne_wochen * 0.8);
  const causeShown = cause !== null && focus !== null && focus >= cause.t;
  const errors = focus === null ? [] : [...check.errorsBefore(focus, 26).errors].sort((a, b) => a - b);
  const lo = errors.length > 0 ? quantile7(errors, 0.1) : 0;
  const hi = errors.length > 0 ? quantile7(errors, 0.9) : 0;
  const span = errors.length > 0 ? Math.max(1, (errors[errors.length - 1] as number) - (errors[0] as number)) : 1;
  const pos = (e: number) => (errors.length > 0 ? ((e - (errors[0] as number)) / span) * 100 : 0);
  const actual = focus === null ? null : (check.rows[focus]?.ist as number) - (check.forecast(focus) as number);
  return (
    <div className="fl-stage">
      <div className="fl-stage-head">
        <div className="fl-card" data-fl-card="range">
          <span className="fl-card-file">{copy.files.csv}</span>
          <span className="fl-card-label">{copy.spanne.counter}</span>
          <span className="fl-card-value" data-fl-hits="">
            {formatNumber(hits, copy.locale)} / {formatNumber(shown, copy.locale)}
          </span>
          <span className="fl-card-label">{fill(copy.spanne.promised, { promised })}</span>
        </div>
      </div>
      <div className="fl-range-body">
        <SeriesChart
          check={check}
          locale={copy.locale}
          from={check.wochen[0] as number}
          to={check.letzte}
          labels={chartLabels(copy)}
          bars={showBars}
          bands={shown}
          focus={focus}
          pin={causeShown ? cause.t : null}
        />
        <div className="fl-dots" aria-hidden="true">
          {errors.map((e, i) => (
            <span key={i} className={e < lo || e > hi ? "fl-dot is-out" : "fl-dot"} style={{ bottom: `${pos(e)}%` }} />
          ))}
          {errors.length > 0 ? (
            <>
              <span className="fl-cut" style={{ bottom: `${pos(lo)}%` }} />
              <span className="fl-cut" style={{ bottom: `${pos(hi)}%` }} />
            </>
          ) : null}
          {actual !== null && errors.length > 0 ? (
            <span
              className={check.hit(focus as number) ? "fl-dot-actual" : "fl-dot-actual is-miss"}
              style={{ bottom: `${Math.min(100, Math.max(0, pos(actual)))}%` }}
            />
          ) : null}
        </div>
      </div>
      <p className="fl-pin-line" style={{ opacity: causeShown ? 1 : 0 }}>
        {cause ? fill(copy.spanne.pin, { date: formatShortDay(cause.woche, copy.locale), note: cause.note }) : ""}
      </p>
    </div>
  );
}

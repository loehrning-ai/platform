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
 *
 * One colour code from the first frame on: Mennige is the tool (its card,
 * its forecast ticks, its tally bar), ink with a dashed edge is "same as
 * last week" (its card, its dashed line, its tally bar).
 */

/** A number card: the tool (Mennige edge), the simple rule (dashed ink edge) or a plain count. */
export function StatCard({
  label,
  value,
  tone,
  testId,
}: {
  readonly label: string;
  readonly value: string;
  readonly tone: "tool" | "rule" | "plain";
  readonly testId?: string;
}) {
  return (
    <div className={`fl-card is-${tone}`} data-fl-card={testId}>
      <span className="fl-card-label">{label}</span>
      <span className="fl-card-value">{value}</span>
    </div>
  );
}

/** The kit files a stage reads, on their own full-width line: "aus tool-export.txt · linsensuppe-woechentlich.csv". */
export function FilesLine({ template, files, testId }: { readonly template: string; readonly files: readonly string[]; readonly testId: string }) {
  const [before = "", after = ""] = template.split("{files}");
  return (
    <p className="fl-files" data-fl-files={testId}>
      {before}
      <span className="fl-files-names">{files.join(" · ")}</span>
      {after}
    </p>
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

/** The two cards of the hook: the tool's claim and the plain rule it has to beat. */
function HookCards({ copy, kit, ruleValue }: { readonly copy: DemoPack; readonly kit: KitFacts; readonly ruleValue: string }) {
  return (
    <div className="fl-stage-head">
      <StatCard label={copy.messlatte.toolCard} value={formatPercent(kit.toolAccuracy, copy.locale)} tone="tool" testId="tool" />
      <StatCard label={copy.messlatte.ruleCard} value={ruleValue} tone="rule" testId="rule" />
    </div>
  );
}

/** Beat 1 before the bet: two years of bars rising, the tool's claim next to the open question. */
export function GuessStage({ copy, kit, p }: { readonly copy: DemoPack; readonly kit: KitFacts; readonly p: number }) {
  const { check } = kit;
  const from = 0;
  const to = check.letzte;
  const n = to - from + 1;
  const [before = "", after = ""] = copy.guess.formulaLine.split("{file}");
  return (
    <div className="fl-stage">
      <HookCards copy={copy} kit={kit} ruleValue={"?\u00a0%"} />
      <p className="fl-files" data-fl-files="guess">
        {fill(before, { year: kit.year })}
        <span className="fl-files-names">{copy.files.export}</span>
        {fill(after, { year: kit.year })}
      </p>
      <SeriesChart
        check={check}
        locale={copy.locale}
        from={from}
        to={to}
        labels={chartLabels(copy)}
        rise={(t) => barRise(t - from, n, p)}
        fadeBefore={check.wochen[0]}
        years
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
      <HookCards copy={copy} kit={kit} ruleValue={`${formatOne(frame.counter, copy.locale)}\u00a0%`} />
      <FilesLine template={copy.filesLine} files={[copy.files.export, copy.files.csv]} testId="messlatte" />
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
          <span className="fl-tally-name">
            <span className="fl-swatch is-tool" aria-hidden="true" />
            {copy.chart.forecast}
          </span>
          <span className="fl-tally-track">
            <span className="fl-tally-bar is-accent" style={{ width: `${(means.forecast / max) * 100}%` }} />
          </span>
          <span className="fl-tally-value">{frame.revealed > 0 ? formatOne(means.forecast, copy.locale) : "·"}</span>
        </p>
        <p className="fl-tally-row">
          <span className="fl-tally-name">
            <span className="fl-swatch is-rule" aria-hidden="true" />
            {copy.chart.rule}
          </span>
          <span className="fl-tally-track">
            <span className="fl-tally-bar is-rule" style={{ width: `${(means.rule / max) * 100}%` }} />
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
  // Before the sweep there is no count yet: "? / 50", never "0 / 0".
  const counted = shown === 0 ? "?" : formatNumber(hits, copy.locale);
  const of = formatNumber(shown === 0 ? ranged.length : shown, copy.locale);
  return (
    <div className="fl-stage">
      <div className="fl-stage-head">
        <div className="fl-card is-plain" data-fl-card="range">
          <span className="fl-card-label">
            {copy.spanne.counter} · <span className="is-muted">{fill(copy.spanne.promised, { promised })}</span>
          </span>
          <span className="fl-card-value" data-fl-hits="">
            {`${counted}\u00a0/\u00a0${of}`}
          </span>
        </div>
      </div>
      <FilesLine template={copy.filesLine} files={[copy.files.csv]} testId="spanne" />
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

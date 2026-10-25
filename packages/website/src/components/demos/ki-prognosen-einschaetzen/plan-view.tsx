"use client";

import type { CheckResult } from "@/lib/demo-cases/ki-prognosen-einschaetzen/check";
import { formatEuro, formatNumber, fill, type DemoLocale } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";

/**
 * Beat 3: the last 26 errors as jars in a sorted row, the order line the
 * costs pick, the planning number, and the three-bar ledger "Kosten der
 * Fehler". `jars` and `line` come from timeline.planFrame(p).
 */
export interface PlanViewProps {
  readonly locale: DemoLocale;
  readonly result: CheckResult;
  readonly errors: readonly number[];
  readonly buffer: number | null;
  readonly jars: number;
  readonly line: number;
  readonly copy: {
    readonly planLabel: string;
    readonly forecastLabel: string;
    readonly jarsLabel: string;
    readonly short: string;
    readonly left: string;
    readonly even: string;
    readonly ledgerTitle: string;
    readonly ledger: Readonly<Record<"Messlatte" | "Prognose" | "Planzahl", string>>;
    readonly noCosts: string;
  };
  readonly year: string;
  readonly dateLabel: string;
}

const LEDGER_KEYS = ["Messlatte", "Prognose", "Planzahl"] as const;

export function PlanView({ locale, result, errors, buffer, jars, line, copy, year, dateLabel }: PlanViewProps) {
  const next = result.naechste;
  const plan = next?.planzahl;
  const costs = result.kosten;
  const maxCost = costs ? Math.max(costs.Messlatte, costs.Prognose, costs.Planzahl) : 1;
  // Where the order line sits in the row: between the last jar at or under the buffer and the next.
  const cut = buffer === null ? errors.length : errors.filter((e) => e <= buffer).length;
  const linePos = errors.length === 0 ? 0 : (cut / errors.length) * 100;
  const anyEven = buffer !== null && errors.some((e) => e === buffer);
  const signed = (value: number) => (value > 0 ? `+${formatNumber(value, locale)}` : formatNumber(value, locale));

  return (
    <div className="fl-plan">
      <div className="fl-plan-head">
        <p className="fl-plan-label">{fill(copy.planLabel, { date: dateLabel })}</p>
        <p className="fl-plan-number" data-fl-plan="">
          {plan !== undefined ? formatNumber(plan, locale) : "·"}
        </p>
        <p className="fl-plan-forecast">
          {next ? fill(copy.forecastLabel, { forecast: formatNumber(next.prognose, locale) }) : ""}
        </p>
      </div>

      <div className="fl-jars" role="img" aria-label={fill(copy.jarsLabel, { count: errors.length })}>
        <p className="fl-mini-label">{fill(copy.jarsLabel, { count: errors.length })}</p>
        <div className="fl-jar-row">
          {errors.map((e, i) => {
            const shown = i < jars;
            const state = buffer === null ? "is-plain" : e > buffer ? "is-short" : e < buffer ? "is-left" : "is-even";
            return <span key={i} className={`fl-jar ${state}`} style={{ opacity: shown ? 1 : 0 }} />;
          })}
          {buffer !== null ? (
            <span className="fl-order-line" style={{ left: `${linePos}%`, opacity: line, transform: `scaleY(${line})` }}>
              <span className="fl-order-value" data-fl-buffer="">
                {signed(buffer)}
              </span>
            </span>
          ) : null}
        </div>
        {errors.length > 0 ? (
          <p className="fl-jar-scale" aria-hidden="true">
            <span>{signed(errors[0] as number)}</span>
            <span>{signed(errors[errors.length - 1] as number)}</span>
          </p>
        ) : null}
        {buffer !== null ? (
          <p className="fl-jar-legend">
            <span className="fl-key is-left" /> {copy.left}
            {anyEven ? (
              <>
                <span className="fl-key is-even" /> {copy.even}
              </>
            ) : null}
            <span className="fl-key is-short" /> {copy.short}
          </p>
        ) : (
          <p className="fl-jar-legend">{copy.noCosts}</p>
        )}
      </div>

      {costs ? (
        <div className="fl-ledger" data-fl-ledger="">
          <p className="fl-mini-label">{fill(copy.ledgerTitle, { year })}</p>
          {LEDGER_KEYS.map((key) => (
            <div key={key} className="fl-ledger-row">
              <span className="fl-ledger-name">{copy.ledger[key]}</span>
              <span className="fl-ledger-track">
                <span
                  className={key === "Planzahl" ? "fl-ledger-bar is-accent" : "fl-ledger-bar"}
                  style={{ width: `${(costs[key] / maxCost) * 100 * line}%` }}
                />
              </span>
              <span className="fl-ledger-value">{formatEuro(costs[key], locale)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

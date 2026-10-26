"use client";

import type { ReactNode } from "react";
import { GlasSheet } from "@/components/demos/glas";
import { BIAS_MAX, LAMP_KEYS, TREFFER_MIN, PRUEF } from "@/lib/demo-cases/ki-prognosen-einschaetzen/check";
import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { fill, formatNumber } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";
import type { Model } from "@/lib/demo-cases/ki-prognosen-einschaetzen/model";
import { biasSentence, day, euro0, jars, percent, weekOf, weekSentence } from "./helpers";
import { lampValue } from "./scene-rule";

export type SheetState =
  | { readonly kind: "export" }
  | { readonly kind: "row"; readonly t: number }
  | { readonly kind: "range" }
  | { readonly kind: "year" }
  | { readonly kind: "week"; readonly t: number }
  | { readonly kind: "files" };

function Sheet({ copy, open, onClose, title, children, footer }: { readonly copy: DemoPack; readonly open: boolean; readonly onClose: () => void; readonly title: ReactNode; readonly children: ReactNode; readonly footer?: ReactNode }) {
  return (
    <GlasSheet open={open} onClose={onClose} title={title} closeLabel={copy.ui.close} resizeLabel={copy.ui.resize} modal={false} footer={footer}>
      <div className="w01-sheet">{children}</div>
    </GlasSheet>
  );
}

/** tool-export.txt from the kit, the accuracy line and its definition marked. */
export function ExportSheet({ copy, open, onClose }: { readonly copy: DemoPack; readonly open: boolean; readonly onClose: () => void }) {
  const lines = copy.kitText.export.replace(/\r\n/g, "\n").trimEnd().split("\n");
  const at = lines.findIndex((line) => /Prognosegenauigkeit|Forecast accuracy/.test(line));
  return (
    <Sheet copy={copy} open={open} onClose={onClose} title={copy.s1.exportTitle}>
      <p>{copy.s1.exportNote}</p>
      <pre className="w01-mono" data-w01-export="">
        {lines.map((line, index) => (
          <span key={index} className={index === at || (at >= 0 && index === at + 1) ? "w01-mono-mark" : undefined}>
            {line}
            {"\n"}
          </span>
        ))}
      </pre>
    </Sheet>
  );
}

/** Scene 2's step down: the raw CSV line of a week, its number and the two misses. */
export function RowSheet({ copy, model, source, file, t, onClose }: { readonly copy: DemoPack; readonly model: Model; readonly source: string; readonly file: string; readonly t: number | null; readonly onClose: () => void }) {
  const { check } = model;
  const row = t === null ? undefined : check.rows[t];
  const raw = row?.line ? (source.replace(/\r\n/g, "\n").split("\n")[row.line - 1] ?? "") : "";
  const forecast = t === null ? null : check.forecast(t);
  const rule = t === null ? null : check.rule(t);
  const scored = t !== null && check.wochen.includes(t);
  return (
    <Sheet copy={copy} open={t !== null} onClose={onClose} title={row?.line ? fill(copy.s2.rowTitle, { line: row.line, file }) : t === null ? "" : weekOf(copy, check, t)}>
      {raw ? (
        <pre className="w01-mono" data-w01-row="">
          {raw}
        </pre>
      ) : null}
      <p>
        {scored && row?.ist !== null && row?.ist !== undefined && forecast !== null && rule !== null
          ? fill(copy.s2.rowLine, { forecastError: jars(Math.abs(row.ist - forecast), copy.locale), ruleError: jars(Math.abs(row.ist - rule), copy.locale) })
          : copy.s2.rowSkipped}
      </p>
    </Sheet>
  );
}

/** Scene 3's "Mehr dazu": the term, the chance line and the hand calculation for the cause week. */
export function RangeSheet({ copy, model, open, onClose }: { readonly copy: DemoPack; readonly model: Model; readonly open: boolean; readonly onClose: () => void }) {
  const { check, result, split, cause } = model;
  const locale = copy.locale;
  const band = cause ? check.band(cause.t) : null;
  const forecast = cause ? check.forecast(cause.t) : null;
  const actual = cause ? check.rows[cause.t]?.ist : null;
  return (
    <Sheet copy={copy} open={open} onClose={onClose} title={copy.s3.moreTitle}>
      <p>{copy.s3.term}</p>
      {split ? (
        <p>
          {fill(copy.s3.chance, {
            chance: percent(model.chance.year, locale, 0),
            hits: result.spanne_treffer,
            missesAfter: split.missesAfter,
            misses: split.misses,
            date: day(copy, check, split.cause.t),
          })}
        </p>
      ) : null}
      {cause && band && forecast !== null && actual !== null && actual !== undefined ? (
        <>
          <h3 className="w01-sheet-head">{fill(copy.s3.handTitle, { date: day(copy, check, cause.t) })}</h3>
          <p>
            {fill(copy.s3.hand, {
              low: formatNumber(band[0], locale, 1),
              high: formatNumber(band[1], locale, 1),
              forecast: jars(forecast, locale),
              from: formatNumber(forecast + band[0], locale, 1),
              to: formatNumber(forecast + band[1], locale, 1),
              actual: jars(actual, locale),
            })}
          </p>
        </>
      ) : null}
    </Sheet>
  );
}

/** Scene 4's year in euros: three content bars and the honest close. */
export function YearSheet({ copy, model, open, onClose, gap }: { readonly copy: DemoPack; readonly model: Model; readonly open: boolean; readonly onClose: () => void; readonly gap: string | null }) {
  const { result } = model;
  const locale = copy.locale;
  const costs = result.kosten;
  const max = costs ? Math.max(costs.Messlatte, costs.Prognose, costs.Planzahl, 1) : 1;
  return (
    <Sheet copy={copy} open={open} onClose={onClose} title={copy.s4.yearTitle}>
      {costs ? (
        <>
          <ul className="w01-ledger">
            {(["Messlatte", "Prognose", "Planzahl"] as const).map((key) => (
              <li key={key}>
                <span className="w01-ledger-name">{copy.s4.ledger[key]}</span>
                <span className="w01-ledger-bar" style={{ width: `${(costs[key] / max) * 100}%` }} aria-hidden="true" />
                <span className="w01-ledger-value">{euro0(costs[key], locale)}</span>
              </li>
            ))}
          </ul>
          <p>
            {fill(copy.s4.honest, {
              costPlan: euro0(costs.Planzahl, locale),
              costForecast: euro0(costs.Prognose, locale),
              costRule: euro0(costs.Messlatte, locale),
            })}
          </p>
          <p>
            {fill(copy.s4.euro, {
              weeks: result.kosten_wochen ?? result.wochen,
              saveTool: euro0(costs.Messlatte - costs.Prognose, locale),
              saveBuffer: euro0(costs.Prognose - costs.Planzahl, locale),
            })}
          </p>
        </>
      ) : (
        <p>{copy.s4.noCosts}</p>
      )}
      {gap ? <p>{gap}</p> : null}
    </Sheet>
  );
}

/** Scene 5's square sheet: the four lamps of one week, the bias in words, and who decides. */
export function WeekSheet({ copy, model, t, owner, onClose }: { readonly copy: DemoPack; readonly model: Model; readonly t: number | null; readonly owner: string; readonly onClose: () => void }) {
  const { check } = model;
  const lamps = t === null ? null : check.lamps(t);
  return (
    <Sheet copy={copy} open={t !== null} onClose={onClose} title={t === null ? "" : weekOf(copy, check, t)}>
      <p>{weekSentence(copy, lamps, owner)}</p>
      {lamps && t !== null ? (
        <ul className="w01-sheet-lamps">
          {LAMP_KEYS.map((key) => {
            const value = lamps[key];
            const state = value === null ? "none" : value ? "green" : "red";
            const sentence =
              key === "bias"
                ? fill(copy.s5.lamps.bias, { max: percent(BIAS_MAX, copy.locale, 0) })
                : key === "spanne"
                  ? fill(copy.s5.lamps.spanne, { min: TREFFER_MIN, of: PRUEF })
                  : copy.s5.lamps[key];
            return (
              <li key={key} className="w01-lamp" data-state={state}>
                <span className="w01-lamp-disc" aria-hidden="true" />
                <span>
                  <strong>
                    {copy.s5.lampNames[key]}: {copy.s5.state[state]}
                  </strong>{" "}
                  ({lampValue(copy, check, t, key, lamps)}). {sentence}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
      {lamps ? <p>{biasSentence(copy, lamps, BIAS_MAX)}</p> : null}
    </Sheet>
  );
}

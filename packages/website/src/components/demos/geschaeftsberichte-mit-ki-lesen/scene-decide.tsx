"use client";

import { GlasIcon } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { checkTrigger, decide } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/decide";
import { COUNTERS, PERIODS, recordsOf, maxMerges, type Counter, type Period } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import type { Fmt } from "./fmt";

/**
 * The Entscheidungsraster: three Zähler by two Zeiträume, each cell holding
 * the decision its card leads to (four distinct decisions in six cells).
 * The visitor's cell gets the accent rim, the report's cell the tag.
 */
export function DecisionRaster({ pack, fmt, counter, period }: { readonly pack: DemoPack; readonly fmt: Fmt; readonly counter: Counter; readonly period: Period }) {
  const d = pack.decide;
  return (
    <div className="w02-raster" data-w02-raster="">
      <p className="w02-doc-kicker">{d.rasterTitle}</p>
      <table className="w02-raster-table">
        <thead>
          <tr>
            <td />
            {PERIODS.map((value) => (
              <th key={value} scope="col">
                {pack.period.options[value]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COUNTERS.map((rowCounter) => (
            <tr key={rowCounter}>
              <th scope="row">{pack.counters[rowCounter].label}</th>
              {PERIODS.map((value) => {
                const decision = decide(rowCounter, value);
                const mine = rowCounter === counter && value === period;
                const report = rowCounter === "records" && value === "month";
                return (
                  <td key={value} data-mine={mine ? "" : undefined} data-decision={decision.key}>
                    {report ? <span className="w02-tag">{pack.scale.reportTag}</span> : null}
                    {mine ? (
                      <span className="w02-tag" data-mine="">
                        {d.yours}
                      </span>
                    ) : null}
                    <span className="w02-raster-text">{fmt.t(d.decisions[decision.key])}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The three checks of a trigger, each a glyph plus a full sentence, live with the slider. */
export function TriggerChecks({ pack, fmt, counter, threshold }: { readonly pack: DemoPack; readonly fmt: Fmt; readonly counter: Counter; readonly threshold: number }) {
  const check = checkTrigger(counter, threshold);
  const c = pack.decide.checks;
  const rows = [
    {
      id: "units",
      ok: check.countsUnits,
      text: check.countsUnits ? c.units : c.unitsNo,
    },
    {
      id: "notMet",
      ok: check.notMetToday,
      text: check.notMetToday ? c.notMet : c.notMetNo,
    },
    { id: "named", ok: check.named, text: check.named ? c.named : c.namedNo },
  ];
  return (
    <div className="w02-checks" data-w02-checks="">
      <ul>
        {rows.map((row) => (
          <li key={row.id} data-ok={row.ok ? "" : undefined} data-check={row.id}>
            <span className="w02-check-glyph" aria-hidden="true">
              {row.ok ? <GlasIcon name="check" /> : <GlasIcon name="close" />}
            </span>
            {row.text}
          </li>
        ))}
      </ul>
      {check.mergeGameable ? (
        <p className="w02-finding" data-w02-gameable="">
          {fmt.t(c.gameable, {
            from: recordsOf("sep").length,
            to: recordsOf("sep").length - maxMerges(),
            r: fmt.n(check.mergedToday, 2),
          })}
        </p>
      ) : null}
    </div>
  );
}

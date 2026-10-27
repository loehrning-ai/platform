"use client";

import { useState } from "react";
import { GlasButton } from "@/components/demos/glas";
import type { BeatId } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/beats";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { REPORT, WEEK_STARTS } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { SCRAP_PRICE_EUR, scrapValue } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/decide";
import {
  companyGrowth,
  COUNTERS,
  maxMerges,
  mergeStepRate,
  reading,
  SAME_BAND,
  weeklyUnits,
  weeksOf,
  type Denom,
  type Period,
  type SeptemberEnds,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import { renderKitCards, type KitCardWords } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/skill-file";
import { AUGUST_RANGE, revenuePerWeek, SEPTEMBER_RANGE, traceGroups, type WeekRange } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/trace";
import type { CraftChoice } from "./craft-card";
import { triggerText } from "./craft-card";
import type { Fmt } from "./fmt";

const DENOMS: readonly Denom[] = ["per1000", "none"];

/** "Als Tabelle lesen": the numbers behind the picture of a scene. */
export function SceneTable({
  pack,
  fmt,
  beat,
  ends,
  range,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly beat: BeatId | "free";
  readonly ends: SeptemberEnds;
  readonly range: WeekRange;
}) {
  const t = pack.table;
  if (beat === "zusammenfassen") {
    return (
      <table className="w02-table">
        <thead>
          <tr>
            <th scope="col">{pack.merge.all_button}</th>
            <th scope="col">{fmt.t(pack.merge.gauges.records)}</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxMerges() + 1 }, (_, merges) => (
            <tr key={merges}>
              <td>{fmt.n(merges)}</td>
              <td>{fmt.n(mergeStepRate(merges), 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (beat === "zeitraum") {
    return (
      <table className="w02-table">
        <tbody>
          {WEEK_STARTS.map((week) => (
            <tr key={week}>
              <th scope="row">{fmt.t(pack.merge.week, { date: fmt.date(week) })}</th>
              <td>{fmt.n(weeklyUnits(week))}</td>
              <td>{weeksOf("aug", ends).includes(week) ? pack.monthOf.aug : weeksOf("sep", ends).includes(week) ? pack.monthOf.sep : pack.period.october}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (beat === "nachrechnen") {
    return (
      <table className="w02-table">
        <tbody>
          {traceGroups(range).map((group) => (
            <tr key={group.code}>
              <th scope="row">
                {fmt.t(pack.trace.bin, {
                  model: group.code,
                  price: fmt.eur(group.price),
                })}
              </th>
              <td>{fmt.n(group.units)}</td>
              <td>{fmt.eur(group.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return (
    <table className="w02-table">
      <thead>
        <tr>
          <th scope="col">{t.what}</th>
          <th scope="col">{t.aug}</th>
          <th scope="col">{t.sep}</th>
          <th scope="col">{t.change}</th>
        </tr>
      </thead>
      <tbody>
        {DENOMS.flatMap((denom) =>
          COUNTERS.map((counter) => {
            const r = reading({ counter, denom });
            const perBase = denom === "per1000";
            return (
              <tr key={`${counter}/${denom}`}>
                <th scope="row">
                  {pack.counters[counter].label}, {perBase ? fmt.t(pack.per) : pack.absolute}
                </th>
                <td>{fmt.value(counter, r.aug, perBase)}</td>
                <td>{fmt.value(counter, r.sep, perBase)}</td>
                <td>
                  {fmt.pct(r.change)}, {pack.verdicts[r.verdict]}
                </td>
              </tr>
            );
          }),
        )}
      </tbody>
    </table>
  );
}

function CopyBlock({ pack, text }: { readonly pack: DemoPack; readonly text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="w02-copyblock">
      <pre className="w02-markdown">{text}</pre>
      <GlasButton
        variant="fill"
        size="compact"
        icon={copied ? "check" : "copy"}
        onClick={() =>
          navigator.clipboard?.writeText(text).then(
            () => setCopied(true),
            () => setCopied(false),
          )
        }
      >
        {copied ? pack.decide.copied : pack.decide.copy}
      </GlasButton>
    </div>
  );
}

/** "Mehr dazu": the second layer of each scene, never needed to follow the path. */
export function SceneMore({
  pack,
  fmt,
  beat,
  choice,
  trigger,
  kitCounters,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly beat: BeatId | "free";
  readonly choice: CraftChoice;
  readonly trigger: number;
  readonly kitCounters: KitCardWords["counters"];
}) {
  if (beat === "zaehlen" || beat === "free" || beat === "schaetzen") {
    return (
      <>
        <p>{pack.trays.legend}</p>
        <p>{pack.trays.small}</p>
        <p>{fmt.t(pack.scale.more, { band: fmt.share(SAME_BAND.value, 0) })}</p>
      </>
    );
  }
  if (beat === "zeitraum") {
    return (
      <>
        <p>
          {fmt.t(pack.period.company, {
            cm: fmt.pct(companyGrowth("month")),
            cw: fmt.pct(companyGrowth("week")),
            section: 6,
          })}
        </p>
        <p>{pack.period.rule}</p>
      </>
    );
  }
  if (beat === "nachrechnen") {
    return (
      <>
        <p>
          {fmt.t(pack.trace.perWeek, {
            sep: fmt.eur(revenuePerWeek(SEPTEMBER_RANGE)),
            aug: fmt.eur(revenuePerWeek(AUGUST_RANGE)),
          })}
        </p>
        <p>
          {fmt.t(pack.trace.prices, {
            report: fmt.eur(REPORT.avgPriceCents / 100, 2),
            scrap: fmt.eur(SCRAP_PRICE_EUR),
          })}
        </p>
      </>
    );
  }
  if (beat === "entscheiden") {
    const scrap = scrapValue();
    const words: KitCardWords = {
      ...pack.kit,
      counters: kitCounters,
      denominatorLine: fmt.t(pack.kit.denominatorLine),
      releases: Object.fromEntries(COUNTERS.map((counter) => [counter, triggerText(pack, fmt, counter, trigger)])) as KitCardWords["releases"],
      defectsHeading: fmt.t(pack.kit.defectsHeading),
      demandHeading: fmt.t(pack.kit.demandHeading),
    };
    return (
      <>
        <p>
          {fmt.t(pack.decide.scrap, {
            units: fmt.n(scrap.units),
            price: fmt.eur(SCRAP_PRICE_EUR),
            eur: fmt.eur(scrap.eur),
            share: fmt.share(scrap.shareOfRevenue),
          })}
        </p>
        <p>{pack.decide.kitBlock}</p>
        <CopyBlock pack={pack} text={renderKitCards({ counter: choice.counter, basis: choice.period as Period }, words, "all")} />
      </>
    );
  }
  return null;
}

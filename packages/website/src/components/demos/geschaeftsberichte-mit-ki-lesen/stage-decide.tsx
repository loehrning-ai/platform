"use client";

import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { REPORT } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { growth, rate, type Basis, type Counter } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import { span } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/timelines";
import type { DecisionText } from "./decision-text";
import { fill, type Fmt } from "./fmt";

/** Beat 6: the kit dashboard's three tiles, each saying how it was counted, and the decision they produce. */
export function StageDecide({
  pack,
  fmt,
  counter,
  basis,
  decision,
  progress,
  suggested,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly counter: Counter;
  readonly basis: Basis;
  readonly decision: DecisionText;
  readonly progress: number;
  /** The shell's "Vorschlag übernommen" when a lever was skipped, else null. */
  readonly suggested: string | null;
}) {
  const tiles = pack.decide.tiles;
  const rows = [
    { id: "revenue", label: tiles.revenue, value: fmt.eur(REPORT.craftRevenueEur), how: tiles.revenueHow },
    { id: "demand", label: tiles.demand, value: fmt.pct(growth(basis)), how: pack.bases[basis].long },
    {
      id: "defects",
      label: tiles.defects,
      value: fmt.rate(counter, rate(counter, "sep")),
      how: fill(tiles.defectsHow, { counter: pack.counters[counter].long, per: fmt.per }),
    },
  ];
  const head = span(progress, 0.35, 0.8);
  return (
    <div className="nw-decide">
      <div className="nw-top">
        <p className="nw-caps">dashboard/index.html</p>
      </div>
      <ul className="nw-tiles">
        {rows.map((row, index) => (
          <li key={row.id} className="nw-tile" data-tile={row.id} style={{ opacity: span(progress, index * 0.1, index * 0.1 + 0.3) }}>
            <span className="nw-tile-label">{row.label}</span>
            <strong className="nw-tile-value">{row.value}</strong>
            <span className="nw-tile-how">
              {tiles.counted}: {row.how}
            </span>
          </li>
        ))}
      </ul>
      <div className="nw-decision" data-decision="" style={{ opacity: head }}>
        <p className="nw-decision-label">
          {pack.decide.fields.decision}
          {suggested ? <span className="nw-suggested"> · {suggested}</span> : null}
        </p>
        <p className="nw-decision-head" data-decision-headline="">
          {decision.headline}
        </p>
        <ul className="nw-checks" aria-label={pack.decide.fields.trigger}>
          {decision.checks.map((check, index) => (
            <li key={index} data-check={check.ok ? "ok" : "fail"}>
              <span className="nw-check-mark">{check.ok ? "✓" : "✗"}</span> {check.short}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

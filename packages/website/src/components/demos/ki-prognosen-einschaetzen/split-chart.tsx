"use client";

import type { CSSProperties } from "react";
import { ASKS, MEDIANS, SUPPLY_CAP, type Triple } from "@/lib/demo-cases/ki-prognosen-einschaetzen/data";
import type { ForecastCopy } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy-types";
import { fmtInt } from "@/lib/demo-cases/ki-prognosen-einschaetzen/fmt";
import { sumOf } from "@/lib/demo-cases/ki-prognosen-einschaetzen/logic";
import type { Locale } from "@/lib/i18n/locale";
import { clamp01, easeOutCubic } from "./use-progress";

interface Props {
  readonly alloc: Triple;
  /** The split has been checked: segments travel to their stores. */
  readonly placed: boolean;
  /** Motion progress 0..1 (1 at rest and under reduced motion). */
  readonly t: number;
  readonly copy: ForecastCopy;
  readonly locale: Locale;
}

const pct = (units: number) => `${(Math.min(units, SUPPLY_CAP) / SUPPLY_CAP) * 100}%`;

/**
 * One delivery, three sites. The pool row holds the 1.050 as one bar; the
 * three store rows share its scale, with a tick at the median and a dashed
 * tick at the ask. On "Prüfen" each store's segment slides out of the pool
 * onto its own row (seek(t), 700 ms, staggered), which shows that a unit in
 * one store is missing from another. Units above a median are hatched.
 */
export function SplitChart({ alloc, placed, t, copy, locale }: Props) {
  const s = copy.split;
  const n = (value: number) => fmtInt(value, locale);
  const given = sumOf(alloc);
  const free = Math.max(0, SUPPLY_CAP - given);
  const starts = alloc.map((_, i) => sumOf(alloc.slice(0, i)));

  return (
    <div className="fr-chart" data-placed={placed ? "" : undefined}>
      <div className="fr-row" role="img" aria-label={placed ? s.poolPlacedAria : s.poolAria(n(given), n(free))}>
        <div className="fr-row-label" aria-hidden="true">
          <span className="fr-row-name">{placed ? s.poolPlaced : s.pool(n(given))}</span>
        </div>
        <div className="fr-track fr-track-pool" aria-hidden="true">
          {/* Where the three segments sat: a dashed outline, so the empty pool reads as "all handed out". */}
          {placed
            ? alloc.map((units, i) =>
                units > 0 ? (
                  <span
                    key={i}
                    className="fr-pool-ghost"
                    style={{ left: pct(starts[i] ?? 0), width: pct(units), opacity: clamp01((t - 0.12 * i) / 0.64) }}
                  />
                ) : null,
              )
            : null}
        </div>
      </div>

      {alloc.map((units, i) => {
        const median = MEDIANS[i] ?? 0;
        const ask = ASKS[i] ?? 0;
        const short = Math.max(0, median - units);
        const over = Math.max(0, units - median);
        const note = over > 0 ? s.left(n(over)) : short > 0 ? s.short(n(short)) : s.exact;
        const name = copy.stores.names[i] ?? "";
        return (
          <div
            key={name}
            className="fr-row"
            role="img"
            aria-label={placed ? s.barAria(name, n(units), n(median), n(ask), note) : `${name}: ${s.rowBefore(n(median))}, ${copy.split.legend.ask} ${n(ask)}.`}
          >
            <div className="fr-row-label" aria-hidden="true">
              <span className="fr-row-name">{name}</span>
              <span className="fr-row-value">{placed ? s.rowAfter(n(units), n(median)) : s.rowBefore(n(median))}</span>
            </div>
            <div className="fr-track" aria-hidden="true">
              <span className="fr-tick fr-tick-median" style={{ left: pct(median) }} />
              <span className="fr-tick fr-tick-ask" style={{ left: pct(ask) }} />
            </div>
            <p className="fr-row-note" aria-hidden="true">
              {placed ? note : " "}
            </p>
          </div>
        );
      })}

      {/* The travelling segments, drawn over the rows on one shared scale. */}
      <div className="fr-segments" aria-hidden="true">
        {alloc.map((units, i) => {
          if (units <= 0) return null;
          const u = placed ? easeOutCubic(clamp01((t - 0.12 * i) / 0.64)) : 0;
          const median = MEDIANS[i] ?? 0;
          const start = starts[i] ?? 0;
          // Own-width units: the pool offset is start / units of the segment's width.
          const fromX = (start / units) * 100;
          const style = {
            "--fr-seg-row": i + 1,
            width: pct(units),
            transform: `translate(${(fromX * (1 - u)).toFixed(3)}%, calc(${(-(i + 1) * (1 - u)).toFixed(4)} * var(--fr-row-h)))`,
          } as CSSProperties;
          const overShare = units > median ? ((units - median) / units) * 100 : 0;
          return (
            <span key={i} className="fr-seg" style={style}>
              {overShare > 0 ? (
                <span className="fr-seg-over" style={{ width: `${overShare}%`, opacity: placed ? clamp01((t - 0.7) / 0.3) : 0 }} />
              ) : null}
            </span>
          );
        })}
      </div>

      <ul className="fr-legend" aria-hidden="true">
        <li>
          <span className="fr-key fr-key-median" />
          {s.legend.median}
        </li>
        <li>
          <span className="fr-key fr-key-ask" />
          {s.legend.ask}
        </li>
        <li>
          <span className="fr-key fr-key-over" />
          {s.legend.over}
        </li>
      </ul>
    </div>
  );
}

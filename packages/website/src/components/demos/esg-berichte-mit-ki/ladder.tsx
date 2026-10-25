import { HOLE } from "@/lib/demo-cases/esg-berichte-mit-ki/data";
import { formatNumber, formatPercent } from "@/lib/demo-cases/esg-berichte-mit-ki/numbers";
import { fill } from "@/lib/demo-cases/esg-berichte-mit-ki/takeaways";
import { maxMissingFor, shortfall, valueCoverage } from "@/lib/demo-cases/esg-berichte-mit-ki/analyse";
import type { Ref } from "react";
import type { Analysis, DemoPack, LadderRow } from "@/lib/demo-cases/esg-berichte-mit-ki/types";
import { CoverageGauge } from "./coverage-gauge";

/**
 * The axis is cut at 270 MWh (a labelled break at the left of every track):
 * from 0 the four ways to the year would sit 1 to 3 px apart. Zoomed, the
 * misses of 41,2 / 15,8 / 2,5 can be read at a glance; the break and the
 * scale under the rows say so.
 */
export const AXIS_MIN = 270;
export const AXIS_MAX = 330;
const SCALE = [AXIS_MIN, 300, AXIS_MAX] as const;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
export const along = (value: number) => clamp01((value - AXIS_MIN) / (AXIS_MAX - AXIS_MIN));

/** The rows' labels in the order of a full ladder, for the placeholder before the bill. */
const PENDING_ROWS = ["guess", "draft", "average", "maxFill", "bill"] as const;

function Scale({ unit }: { readonly unit: string }) {
  return (
    <div className="esg-ladder__scale" aria-hidden="true">
      {SCALE.map((tick, index) => (
        <span key={tick} data-at={index === 0 ? "start" : index === SCALE.length - 1 ? "end" : "mid"} style={{ left: `${along(tick) * 100}%` }}>
          {tick}
          {index === SCALE.length - 1 ? ` ${unit}` : ""}
        </span>
      ))}
    </div>
  );
}

/** Before the bill is open (desktop only): the five ways as labelled empty tracks, so the lesson has a place and the page does not jump. */
export function LadderPending({ pack, draft }: { readonly pack: DemoPack; readonly draft: Analysis }) {
  const locale = pack.locale;
  return (
    <section className="esg-ladder esg-ladder--pending" aria-hidden="true">
      <h3 className="esg-h">{pack.ladder.title}</h3>
      <p className="esg-ladder__axis">{pack.ladder.axis}</p>
      <ol className="esg-ladder__rows">
        {PENDING_ROWS.map((id) => {
          const known = id === "draft";
          return (
            <li key={id} className="esg-ladder__row" data-pending={known ? undefined : ""}>
              <span className="esg-ladder__label">{pack.ladder.rows[id]}</span>
              <span className="esg-ladder__nums">
                <span className="esg-ladder__value">{known ? formatNumber(draft.provenSum, locale, 1) : "?"}</span>
              </span>
              <span className="esg-ladder__bar">
                {known ? <span className="esg-ladder__fill" style={{ width: `${along(draft.provenSum) * 100}%` }} /> : null}
                <span className="esg-ladder__cut" />
              </span>
            </li>
          );
        })}
      </ol>
      <Scale unit="MWh" />
      <p className="esg-ladder__text">{pack.ladder.pending}</p>
    </section>
  );
}

/**
 * Die Leiter: every way to an annual figure as a bar on the cut axis with its
 * number above it, the bill last. A Mennige tick on each track marks the
 * bill; the distance of each way to it is hatched and written out ("41,2
 * daneben"). Each row arrives by `reveal` (from sceneAt): first its bar, then
 * its miss. The visitor's own guess leads.
 */
export function Ladder({
  innerRef,
  pack,
  rows,
  reveal,
  draft,
  threshold,
}: {
  readonly innerRef?: Ref<HTMLElement>;
  readonly pack: DemoPack;
  readonly rows: readonly LadderRow[];
  /** One 0..1 per row slot, from sceneAt. */
  readonly reveal: readonly number[];
  readonly draft: Analysis;
  readonly threshold: number;
}) {
  const locale = pack.locale;
  const unit = "MWh";
  const bill = HOLE.truthTotal;
  const billAt = along(bill) * 100;
  const cap = maxMissingFor(draft.provenSum, threshold);
  const thr = Math.round(threshold * 100);
  return (
    <section className="esg-ladder" ref={innerRef} aria-labelledby="esg-ladder-title">
      <h3 id="esg-ladder-title" className="esg-h">{pack.ladder.title}</h3>
      <p className="esg-ladder__axis">{pack.ladder.axis}</p>
      <ol className="esg-ladder__rows">
        {rows.map((row, index) => {
          const shown = reveal[index] ?? 1;
          const label = pack.ladder.rows[row.id];
          const value = formatNumber(row.value, locale, 1);
          const isBill = row.id === "bill";
          const apart = isBill ? 0 : Math.abs(bill - row.value);
          const gapText = apart < 0.05 ? "" : fill(row.value > bill ? pack.ladder.over : pack.ladder.gap, { x: formatNumber(apart, locale, 1) });
          const from = Math.min(along(row.value), along(bill)) * 100;
          const span = Math.abs(along(bill) - along(row.value)) * 100;
          // The bar first (first 55 % of the row's clock), then the miss it leaves to the bill.
          const missShown = clamp01((shown - 0.55) / 0.45);
          return (
            <li key={row.id} className="esg-ladder__row" data-bill={isBill ? "" : undefined} data-guess={row.id === "guess" ? "" : undefined} style={{ opacity: Math.min(1, shown * 3) }}>
              <span className="esg-sr">{`${fill(pack.ladder.rowAria, { label, x: value, unit })}${gapText ? `, ${gapText}` : ""}`}</span>
              <span className="esg-ladder__label" aria-hidden="true">{label}</span>
              <span className="esg-ladder__nums" aria-hidden="true">
                {gapText ? <span className="esg-ladder__off" style={{ opacity: missShown }}>{gapText}</span> : null}
                <span className="esg-ladder__value">{value}</span>
              </span>
              <span className="esg-ladder__bar" aria-hidden="true">
                <span className="esg-ladder__fill" style={{ width: `${along(row.value) * 100 * clamp01(shown / 0.55)}%` }} />
                {isBill || span === 0 ? null : (
                  <span className="esg-ladder__gap" style={{ left: `${from}%`, width: `${span * missShown}%`, marginLeft: row.value > bill ? `${span * (1 - missShown)}%` : 0 }} />
                )}
                <span className="esg-ladder__cut" />
                <span className="esg-ladder__mark" style={{ left: `${billAt}%`, opacity: clamp01(shown * 2) }} />
              </span>
            </li>
          );
        })}
      </ol>
      <Scale unit={unit} />
      <p className="esg-ladder__kicker">
        {fill(pack.ladder.kicker, {
          x: formatNumber(HOLE.truth, locale, 1),
          pct: formatPercent(shortfall(draft.provenSum, bill), locale, 1),
        })}
      </p>
      <CoverageGauge pack={pack} label={pack.gauge.draftMonths} value={draft.monthCoverage} threshold={threshold} />
      <CoverageGauge
        pack={pack}
        label={pack.gauge.draftKwh}
        value={valueCoverage(draft.provenSum, bill)}
        threshold={threshold}
        computed
      />
      <p className="esg-ladder__text">
        {fill(pack.ladder.note, {
          thr,
          cap: formatNumber(cap, locale, 1),
          min: formatNumber(draft.band?.min ?? 0, locale, 1),
        })}
      </p>
    </section>
  );
}

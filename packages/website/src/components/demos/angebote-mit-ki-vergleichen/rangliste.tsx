"use client";

import type { CSSProperties, ReactNode } from "react";
import { GlasPanel } from "@/components/demos/glas";
import { span, type BarRow, type Segment } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/bars";
import type { DemoPack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import type { Fmt } from "./fmt";

export type RankMode = "printed" | "outline" | "bars";
/**
 * How much room the Rangliste takes on a phone (a desktop always shows "full"): two lines per offer
 * with a full-width bar, one line with a short bar while a slider needs the room, or the three
 * totals in a row while a workbench needs it.
 */
export type RankSize = "full" | "compact" | "mini";

export interface RankRow {
  readonly option: string;
  /** "A", "B", "C" for the kit, the option's first letter for own offers. */
  readonly badge: string;
  readonly name: string;
  /** The price as the letter prints it (kit only). */
  readonly printed?: string;
  readonly printedUnit?: string;
  /** The price of one box once the unit is per box. */
  readonly perBox?: string;
  readonly bar: BarRow | null;
}

const SEGMENT_CLASS: Record<Segment["kind"], string> = {
  Ware: "av4-seg-ware",
  Fracht: "av4-seg-fracht",
  Lager: "av4-seg-lager",
  Einmalig: "av4-seg-einmalig",
  Papier: "av4-seg-papier",
  Ghost: "av4-seg-ghost",
  Other: "av4-seg-other",
  Open: "av4-seg-open",
};

/** The legend's order and the kinds it may name (the ghost is explained by the paper beat's caption). */
const LEGEND: readonly Segment["kind"][] = ["Ware", "Fracht", "Lager", "Einmalig", "Papier", "Other", "Open"];

/** Width of an open (missing) segment, as a share of the track. */
const OPEN_SHARE = 0.1;
/** A segment this wide (share of the track) carries its name inside. */
const LABEL_SHARE = 0.16;

/** A printed price as quoted, with a bracketed note ("(Stück)") moved to the second line of the cell. */
export function printedParts(printed: string | undefined): { readonly price: string; readonly note: string } {
  const text = printed ?? "";
  const at = text.indexOf(" (");
  return at > 0 && text.endsWith(")") ? { price: text.slice(0, at), note: text.slice(at + 1) } : { price: text, note: "" };
}

function segmentName(pack: DemoPack, segment: Segment): string {
  return pack.lineNames[segment.line as keyof DemoPack["lineNames"]] ?? segment.line;
}

/** One offer's bar: tinted capsules from the floor, the discount as a notch cut from the end. */
function Bar({
  pack,
  fmt,
  row,
  bar,
  scale,
  floor,
  outline,
  onSegment,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly row: RankRow;
  readonly bar: BarRow | null;
  readonly scale: number;
  readonly floor: number;
  readonly outline: boolean;
  readonly onSegment?: (option: string, line: string) => void;
}) {
  const shown = bar?.segments ?? [];
  let lastReal = -1;
  shown.forEach((segment, index) => {
    if (segment.kind !== "Ghost") lastReal = index;
  });
  const segments: ReactNode[] = [];
  let cursor = 0;
  let at = 0;
  for (const [index, segment] of shown.entries()) {
    let left: number;
    let width: number;
    if (segment.kind === "Open") {
      left = at;
      width = OPEN_SHARE;
    } else {
      ({ left, width } = span(cursor, segment.cents, floor, scale));
      cursor += segment.cents;
    }
    at = left + width;
    if (width <= 0) continue;
    const name = segmentName(pack, segment);
    const amount = segment.kind === "Open" ? pack.rank.open : fmt.money(segment.cents);
    const ghost = segment.kind === "Ghost";
    segments.push(
      <button
        key={`${segment.line}-${segment.kind}-${index}`}
        type="button"
        className={`av4-seg ${SEGMENT_CLASS[segment.kind]}`}
        style={{ left: `${left * 100}%`, width: `${width * 100}%` }}
        data-av4-seg={segment.line}
        data-kind={segment.kind}
        data-first={index === 0 ? "" : undefined}
        data-last={index === lastReal ? "" : undefined}
        aria-label={fmt.t(pack.rank.segmentSr, { line: name, option: row.name, amount })}
        tabIndex={ghost ? -1 : 0}
        aria-hidden={ghost ? true : undefined}
        onClick={() => onSegment?.(row.option, segment.line)}
      >
        {width >= LABEL_SHARE || segment.kind === "Open" ? (
          <span className="av4-seg-label" aria-hidden="true">
            {segment.kind === "Open" ? pack.rank.open : name}
          </span>
        ) : null}
      </button>,
    );
  }
  let notch: ReactNode = null;
  if (bar && bar.discount > 0) {
    const { left, width } = span(bar.gross - bar.discount, bar.discount, floor, scale);
    notch = <span className="av4-notch" style={{ left: `${left * 100}%`, width: `${width * 100}%` }} aria-hidden="true" data-av4-notch="" />;
  }
  return (
    <span className="av4-bar" data-outline={outline ? "" : undefined}>
      {segments}
      {notch}
    </span>
  );
}

/**
 * The Rangliste on regular glass: one row per offer, cheapest first. Rows keep their DOM order and
 * move by transform when the ranking changes, so a change of lead is a row swap anyone can follow.
 * Each positive cost line is a tinted capsule (tap it to read where its number stands); the discount
 * is a notch cut from the bar's end; a missing line is a dashed open segment, never 0. The bars start
 * at `floor`, and the foot says so.
 */
export function Rangliste({
  pack,
  fmt,
  rows,
  order,
  mode,
  scale,
  floor,
  guess,
  cheapest,
  label,
  onSegment,
  onRow,
  rowAction,
  highlight,
  size = "full",
  perBox = false,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly rows: readonly RankRow[];
  /** Options in display order (cheapest first, or as listed while there is no ranking). */
  readonly order: readonly string[];
  readonly mode: RankMode;
  readonly scale: number;
  readonly floor: number;
  readonly guess: string | null;
  readonly cheapest: string | null;
  readonly label: string;
  readonly onSegment?: (option: string, line: string) => void;
  /** Beat 1: a tap on a row is the guess. */
  readonly onRow?: (option: string) => void;
  readonly rowAction?: (row: RankRow) => string;
  /** An option to light (our check's jump). */
  readonly highlight?: string | null;
  readonly size?: RankSize;
  /** Show each offer's price of one box beside its name (move 2b). */
  readonly perBox?: boolean;
}) {
  const rank = (option: string) => Math.max(0, order.indexOf(option));
  const kinds = new Set(rows.flatMap((row) => row.bar?.segments.map((segment) => segment.kind) ?? []));
  const legend = mode === "bars" ? LEGEND.filter((kind) => kinds.has(kind)) : [];
  const discount = mode === "bars" && rows.some((row) => (row.bar?.discount ?? 0) > 0);
  return (
    <GlasPanel material="regular" className="av4-rank-glass" data-size={size} data-av4-rank-glass="">
      <div className="av4-rank" role="list" aria-label={label} style={{ "--av4-rows": rows.length } as CSSProperties} data-av4-rank={mode} data-size={size}>
        {rows.map((row) => {
          const position = rank(row.option);
          const bar = row.bar;
          const total = bar && mode === "bars" ? (bar.open ? pack.rank.open : fmt.money(bar.total)) : null;
          const body = (
            <>
              <span className="av4-row-head">
                <span className="av4-badge" aria-hidden="true">
                  {row.badge}
                </span>
                <span className="av4-row-id">
                  <span className="av4-row-line">
                    <span className="av4-row-name">{row.name}</span>
                    {guess === row.option ? (
                      <span className="av4-guess" data-av4-guess="">
                        {pack.rank.guess}
                      </span>
                    ) : null}
                  </span>
                  {perBox && row.perBox ? (
                    <span className="av4-per-box" data-av4-per-box="">
                      {row.perBox}
                    </span>
                  ) : null}
                </span>
              </span>
              {mode === "printed" ? (
                <span className="av4-printed" data-av4-printed="">
                  <span className="av4-printed-price">{printedParts(row.printed).price}</span>
                  {row.printedUnit || printedParts(row.printed).note ? <span className="av4-printed-unit">{row.printedUnit || printedParts(row.printed).note}</span> : null}
                </span>
              ) : (
                <>
                  <span className="av4-total" data-av4-total="">
                    {total ?? ""}
                  </span>
                  <Bar pack={pack} fmt={fmt} row={row} bar={mode === "bars" ? bar : null} scale={scale} floor={floor} outline={mode === "outline"} onSegment={onSegment} />
                </>
              )}
            </>
          );
          return (
            <div
              key={row.option}
              role="listitem"
              className="av4-row"
              style={{ "--av4-at": position } as CSSProperties}
              data-av4-row={row.option}
              data-mode={mode}
              data-cheapest={cheapest === row.option ? "" : undefined}
              data-highlight={highlight === row.option ? "" : undefined}
              aria-label={total ? `${position + 1}. ${fmt.t(pack.rank.totalSr, { option: row.name, total })}` : undefined}
            >
              {onRow ? (
                <button type="button" className="av4-row-pick" aria-pressed={guess === row.option} onClick={() => onRow(row.option)} data-av4-pick={row.option}>
                  <span className="sr-only">{rowAction?.(row)}</span>
                  {body}
                </button>
              ) : (
                body
              )}
            </div>
          );
        })}
      </div>
      {mode === "bars" ? (
        <p className="av4-rank-foot" data-av4-axis="">
          <span className="av4-axis">{fmt.t(pack.rank.axisFrom, { amount: fmt.money(floor) })}</span>
          {legend.map((kind) => (
            <span key={kind} className="av4-legend" data-kind={kind}>
              <span className={`av4-legend-swatch ${SEGMENT_CLASS[kind]}`} aria-hidden="true" />
              {kind === "Open" ? pack.rank.open : kind === "Other" ? pack.rank.other : pack.lineNames[kind as keyof DemoPack["lineNames"]]}
            </span>
          ))}
          {discount ? (
            <span className="av4-legend" data-kind="Skonto">
              <span className="av4-legend-swatch av4-legend-notch" aria-hidden="true" />
              {pack.lineNames.Skonto}
            </span>
          ) : null}
        </p>
      ) : null}
    </GlasPanel>
  );
}

"use client";

import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import type { BarRow, Segment } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/bars";
import type { DemoPack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import type { Fmt } from "./fmt";

export type RankMode = "printed" | "outline" | "bars";

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

export interface CapHandle {
  readonly option: string;
  /** The cap in per cent rise (null: no cap yet, the handle sits at the full surcharge). */
  readonly cap: number | null;
  readonly v: number;
  /** Cents of surcharge per percentage point. */
  readonly perPoint: number;
  readonly label: string;
  readonly valueText: string;
  readonly onCap: (cap: number) => void;
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

/** Width of an open (missing) segment, as a share of the scale. */
const OPEN_SHARE = 0.08;

function CapStop({ handle, scale, left }: { readonly handle: CapHandle; readonly scale: number; readonly left: number }) {
  const drag = useRef<{ id: number; x: number; start: number; width: number } | null>(null);
  const value = handle.cap === null ? handle.v : Math.min(handle.cap, handle.v);
  const set = (next: number) => handle.onCap(Math.max(0, Math.min(handle.v, Math.round(next * 10) / 10)));
  const onKey = (event: KeyboardEvent<HTMLSpanElement>) => {
    const steps: Record<string, number> = { ArrowLeft: -0.1, ArrowDown: -0.1, ArrowRight: 0.1, ArrowUp: 0.1, PageDown: -1, PageUp: 1 };
    if (event.key === "Home") set(0);
    else if (event.key === "End") set(handle.v);
    else if (event.key in steps) set(value + (steps[event.key] ?? 0));
    else return;
    // The cap stop is its own slider: its arrows never move the guided path.
    event.preventDefault();
    event.stopPropagation();
  };
  const onDown = (event: PointerEvent<HTMLSpanElement>) => {
    const track = event.currentTarget.parentElement;
    drag.current = { id: event.pointerId, x: event.clientX, start: value, width: track?.getBoundingClientRect().width ?? 1 };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onMove = (event: PointerEvent<HTMLSpanElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const cents = ((event.clientX - current.x) / current.width) * scale;
    set(current.start + cents / handle.perPoint);
  };
  const onUp = () => {
    drag.current = null;
  };
  return (
    <span
      role="slider"
      tabIndex={0}
      aria-label={handle.label}
      aria-valuemin={0}
      aria-valuemax={handle.v}
      aria-valuenow={value}
      aria-valuetext={handle.valueText}
      className="av4-cap"
      style={{ left: `${left * 100}%` }}
      onKeyDown={onKey}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      data-av4-cap=""
    >
      <span className="av4-cap-grip" aria-hidden="true" />
    </span>
  );
}

/** A printed price as quoted, with a bracketed note ("(Stück)") moved to the second line of the cell. */
export function printedParts(printed: string | undefined): { readonly price: string; readonly note: string } {
  const text = printed ?? "";
  const at = text.indexOf(" (");
  return at > 0 && text.endsWith(")") ? { price: text.slice(0, at), note: text.slice(at + 1) } : { price: text, note: "" };
}

/**
 * The Rangliste: one row per offer, cheapest first. Rows keep their DOM order and move by transform
 * when the ranking changes, so a change of lead is a row swap anyone can follow. Each positive cost
 * line is a segment (tap it to read its source); the discount is a notch cut from the bar's end; a
 * missing line is a dashed open segment, never 0.
 */
export function Rangliste({
  pack,
  fmt,
  rows,
  order,
  mode,
  scale,
  guess,
  cheapest,
  pulse,
  cap,
  label,
  onSegment,
  onRow,
  rowAction,
  highlight,
  compact = false,
  perBox = false,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly rows: readonly RankRow[];
  /** Options in display order (cheapest first, or as listed while there is no ranking). */
  readonly order: readonly string[];
  readonly mode: RankMode;
  readonly scale: number;
  readonly guess: string | null;
  readonly cheapest: string | null;
  /** Lines that just landed: they pulse once. */
  readonly pulse?: ReadonlySet<string>;
  readonly cap?: CapHandle | null;
  readonly label: string;
  readonly onSegment?: (option: string, line: string) => void;
  /** Beat 1: a tap on a row is the guess. */
  readonly onRow?: (option: string) => void;
  readonly rowAction?: (row: RankRow) => string;
  /** An option to light (our check's jump). */
  readonly highlight?: string | null;
  /** Shorter rows, when a workbench needs the room. */
  readonly compact?: boolean;
  /** Show each offer's price of one box beside its name (move 2b). */
  readonly perBox?: boolean;
}) {
  const rank = (option: string) => Math.max(0, order.indexOf(option));
  return (
    <div className="av4-rank" role="list" aria-label={label} style={{ "--av4-rows": rows.length } as CSSProperties} data-av4-rank={mode} data-compact={compact ? "" : undefined}>
      {rows.map((row) => {
        const position = rank(row.option);
        const bar = row.bar;
        const total = bar && mode === "bars" ? (bar.open ? pack.rank.open : fmt.money(bar.total)) : null;
        const style = { "--av4-at": position } as CSSProperties;
        let cursor = 0;
        const segments: ReactNode[] = [];
        if (bar && mode === "bars") {
          for (const [index, segment] of bar.segments.entries()) {
            const share = segment.kind === "Open" ? OPEN_SHARE : segment.cents / scale;
            const left = cursor;
            cursor += share;
            const name = pack.lineNames[segment.line as keyof DemoPack["lineNames"]] ?? segment.line;
            const amount = segment.kind === "Open" ? pack.rank.open : fmt.money(segment.cents);
            segments.push(
              <button
                key={`${segment.line}-${segment.kind}-${index}`}
                type="button"
                className={`av4-seg ${SEGMENT_CLASS[segment.kind]}`}
                style={{ left: `${left * 100}%`, width: `${share * 100}%` }}
                data-pulse={pulse?.has(segment.line) ? "" : undefined}
                data-av4-seg={segment.line}
                data-kind={segment.kind}
                aria-label={fmt.t(pack.rank.segmentSr, { line: name, option: row.name, amount })}
                tabIndex={segment.kind === "Ghost" ? -1 : 0}
                aria-hidden={segment.kind === "Ghost" ? true : undefined}
                onClick={() => onSegment?.(row.option, segment.line)}
              >
                <span className="av4-seg-label" aria-hidden="true">
                  {segment.kind === "Open" ? pack.rank.open : name}
                </span>
              </button>,
            );
          }
        }
        const notch = bar && mode === "bars" && bar.discount > 0 ? (
          <span
            className="av4-notch"
            style={{ left: `${((bar.gross - bar.discount) / scale) * 100}%`, width: `${(bar.discount / scale) * 100}%` }}
            aria-hidden="true"
            data-av4-notch=""
          />
        ) : null;
        const capStop =
          cap && cap.option === row.option && bar && mode === "bars" ? (
            <CapStop
              handle={cap}
              scale={scale}
              left={(bar.segments.filter((segment) => segment.kind !== "Ghost").reduce((sum, segment) => sum + segment.cents, 0)) / scale}
            />
          ) : null;
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
              <span className="av4-bar-wrap">
                <span className="av4-bar" data-outline={mode === "outline" ? "" : undefined}>
                  {segments}
                  {notch}
                  {capStop}
                </span>
                <span className="av4-total" data-av4-total="">
                  {total ?? ""}
                </span>
              </span>
            )}
          </>
        );
        return (
          <div
            key={row.option}
            role="listitem"
            className="av4-row"
            style={style}
            data-av4-row={row.option}
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
  );
}

"use client";

import { useRef } from "react";
import { GLAS_PRIORITY, GlasPanel } from "@/components/demos/glas";
import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { GUESS_MAX, GUESS_STEP, STROM_SCALE, type DemoAction, type StromState } from "@/lib/demo-cases/esg-berichte-mit-ki/demo-state";
import { DRAFT_LINE, STROM, WASSER, YEAR } from "@/lib/demo-cases/esg-berichte-mit-ki/kit";
import type { KitText } from "@/lib/demo-cases/esg-berichte-mit-ki/kit-text";
import { morphEnd } from "@/lib/demo-cases/esg-berichte-mit-ki/months-layout";
import type { BillRow, Status } from "@/lib/demo-cases/esg-berichte-mit-ki/rules";
import { curve, Loupe, useAnchors, useConnectDrag } from "./connect";
import { DocCard, type LineMark } from "./doc-card";
import type { Fmt } from "./fmt";
import { StatusGlyph } from "./glyph";
import { MonthsChart, MorphGrabber, type ChartFill, type ChartGhost } from "./months-chart";
import { DocSlot } from "./scene-card";

type Part = "f2";

/** The bank form's field F2 as an object: its question, the draft's figure and, once known, its status. */
export function F2Field({
  pack,
  fmt,
  kit,
  status,
  value,
  handle,
}: {
  readonly pack: Pack;
  readonly fmt: Fmt;
  readonly kit: KitText;
  readonly status: Status | null;
  readonly value: string;
  readonly handle?: { readonly props: Record<string, unknown>; readonly ref: (node: HTMLElement | null) => void; readonly picking: boolean; readonly linked: boolean };
}) {
  return (
    <article className="w4-f2" data-w4-f2="" data-status={status ?? undefined}>
      <p className="w4-f2-kicker">
        <span>{pack.strom.form}</span>
        {status ? (
          <span className="w4-f2-status" data-w4-f2-status={status}>
            <StatusGlyph status={status} label={fmt.t(pack.invoice.status, { status: pack.statuses[status] })} size={18} />
            <span aria-hidden="true">{pack.statuses[status]}</span>
          </span>
        ) : null}
      </p>
      <p className="w4-f2-question">{kit.f2}</p>
      {handle ? (
        <button
          type="button"
          className="w4-handle w4-f2-value"
          ref={handle.ref}
          data-w4-handle="f2"
          data-state={handle.picking ? "picking" : handle.linked ? "linked" : undefined}
          aria-pressed={handle.picking}
          aria-label={fmt.t(pack.strom.fieldConnect, { value })}
          {...handle.props}
        >
          <span className="w4-handle-dot" aria-hidden="true" />
          <span className="w4-handle-text">
            {value} {pack.strom.unit}
          </span>
        </button>
      ) : (
        <p className="w4-f2-value" data-w4-f2-value="">
          {value} {pack.strom.unit}
        </p>
      )}
    </article>
  );
}

/** The rows of a bill file as the preview prints them: the kit's own line for the electricity file. */
export function rowTextFor(kit: KitText, water: boolean) {
  return (row: BillRow) => {
    if (!water) {
      const line = kit.strom.lines.find((entry) => entry.n === row.line);
      if (line) return `${row.line}  ${line.text}`;
    }
    return `${row.line}  ${row.month};${row.invoice};${row.amount}`;
  };
}

export function morphValueText(pack: Pack, t: number): string {
  return t <= 0.05 ? pack.strom.grabberValues.rows : t >= 0.95 ? pack.strom.grabberValues.months : pack.strom.grabberValues.half;
}

/**
 * Scene 3: first the bank's figure is connected to the line it comes from
 * (a draft note), then the electricity file is pulled apart into months by
 * the finger, and the empty September slot takes the visitor's guess.
 */
export function StromScene({
  pack,
  fmt,
  kit,
  strom,
  dispatch,
  reducedMotion,
  guessing,
}: {
  readonly pack: Pack;
  readonly fmt: Fmt;
  readonly kit: KitText;
  readonly strom: StromState;
  readonly dispatch: (action: DemoAction) => void;
  readonly reducedMotion: boolean;
  /** The guess handle is live (guided beat 4, before the guess is kept). */
  readonly guessing: boolean;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  const { anchors, register } = useAnchors(container, [strom.linked, strom.miss]);
  const { drag, handlers } = useConnectDrag<Part>({
    container,
    onLand: (_part, line) => dispatch({ type: "stromLand", line }),
    onTap: (_part, keyboard) => {
      // The draft's lines are targets all along: a tap on the figure only moves the keyboard focus there.
      if (keyboard) requestAnimationFrame(() => container.current?.querySelector<HTMLButtonElement>("button[data-w4-line]")?.focus());
    },
  });
  const linked = strom.linked;
  // Until the figure is connected, every draft line is a target for tap and keyboard.
  const picking = !linked;

  const value = fmt.figures.mwh11 ?? "";
  const draftMarks: Readonly<Record<number, LineMark>> = linked ? { [DRAFT_LINE.figure]: { status: "schwach", label: pack.statuses.schwach } } : {};
  const water = strom.water;
  const rows = water ? WASSER : STROM;
  const end = morphEnd(strom.t);

  const readout = !linked ? (
    strom.miss !== null ? (
      <p>{(pack.strom.draftHints as Readonly<Record<string, string>>)[String(strom.miss)] ?? pack.strom.instruction[1]}</p>
    ) : null
  ) : strom.t === 0 && !water ? (
    fmt.ts(pack.strom.draftReadout).map((sentence) => <p key={sentence}>{sentence}</p>)
  ) : (
    <p>{fmt.t(water ? (end === "rows" ? pack.strom.water.readoutRows : pack.strom.water.readoutMonths) : end === "rows" ? pack.strom.readoutRows : pack.strom.readoutMonths)}</p>
  );

  return (
    <div ref={container} className="w4-s3" data-w4-scene="strom" data-linked={linked ? "" : undefined} data-water={water ? "" : undefined}>
      <div className="w4-s3-top">
        <F2Field
          pack={pack}
          fmt={fmt}
          kit={kit}
          status={linked && strom.t >= 1 && !water ? "luecke" : null}
          value={value}
          handle={
            linked
              ? undefined
              : { props: handlers("f2"), ref: register("handle:f2"), picking: drag !== null, linked }
          }
        />
        <DocCard
          name={kit.draft.name}
          subtitle={kit.invented}
          lines={kit.draft.lines.filter((line) => line.n > 1)}
          marks={draftMarks}
          glow={linked ? DRAFT_LINE.status : null}
          hot={drag?.line ?? null}
          picking={picking}
          compact={linked}
          pickLabel={(line) => `${fmt.t(pack.connect.pickLine, { n: line.n })}: ${line.text}`}
          onPick={(n) => dispatch({ type: "stromLand", line: n })}
          lineRef={(n) => register(`line:${n}`)}
          className="w4-s3-draft"
        />
      </div>
      {!linked ? (
        <svg className="w4-threads" aria-hidden="true" focusable="false">
          {drag && anchors["handle:f2"] ? <path d={curve(anchors["handle:f2"], drag.at)} className="w4-thread" data-live="" /> : null}
        </svg>
      ) : null}
      {drag && drag.line !== null ? (
        <Loupe at={drag.at}>
          <span className="w4-loupe-n">{drag.line}</span> {kit.draft.lines.find((line) => line.n === drag.line)?.text}
        </Loupe>
      ) : null}
      {linked ? (
        <div className="w4-s3-file">
          <DocCard name={water ? kit.wasserName : kit.strom.name} subtitle={kit.invented} lines={[]} compact className="w4-s3-file-head" />
          <div className="w4-s3-chart">
            <MonthsChart
              rows={rows}
              year={YEAR}
              t={strom.t}
              scaleMax={water ? undefined : STROM_SCALE}
              monthLabels={pack.strom.months}
              label={water ? pack.strom.water.chartLabel : pack.strom.chartLabel}
              twice={pack.strom.twice}
              rowText={rowTextFor(kit, water)}
              guess={
                guessing && !water
                  ? {
                      value: strom.guess === null ? null : strom.guess * 1000,
                      max: GUESS_MAX * 1000,
                      step: GUESS_STEP * 1000,
                      label: pack.strom.guessLabel,
                      valueText: (kwh) => fmt.t(pack.strom.guessValue, { v: fmt.n(kwh / 1000, 1) }),
                      onChange: (kwh) => dispatch({ type: "guess", value: kwh / 1000 }),
                    }
                  : undefined
              }
              ghosts={!guessing && strom.guess !== null && !water ? [{ month: 9, amount: strom.guess * 1000, tag: fmt.n(strom.guess, 1), kind: "guess" }] : []}
            />
          </div>
          <MorphGrabber
            t={strom.t}
            onChange={(t) => dispatch({ type: "morph", t })}
            label={pack.strom.grabberLabel}
            valueText={(t) => morphValueText(pack, t)}
            text={strom.t >= 0.5 ? pack.strom.unsortButton : pack.strom.sortButton}
            reducedMotion={reducedMotion}
          />
          {strom.t >= 1 && !water ? <DocSlot kicker={pack.strom.slotKicker} name={pack.strom.slot} /> : null}
        </div>
      ) : null}
      {readout ? (
        <GlasPanel key={`${linked}-${strom.miss}-${end}-${water}-${strom.t === 0}`} material="regular" shape="card" live={GLAS_PRIORITY.readout} className="w4-readout" data-w4-readout="" data-pop="">
          <div className="w4-readout-body" aria-live="polite">
            {readout}
          </div>
        </GlasPanel>
      ) : null}
    </div>
  );
}

/** Scene 4's chart parts: the invoice fills September, the guess and the scale-up stay as ghosts. */
export function invoiceChartParts(pack: Pack, fmt: Fmt, strom: StromState, invoiceIn: boolean, kwh: number, scaleUp: number): { fill: ChartFill; ghosts: ChartGhost[] } {
  const ghosts: ChartGhost[] = [];
  if (invoiceIn && strom.guess !== null) ghosts.push({ month: 9, amount: strom.guess * 1000, tag: fmt.n(strom.guess, 1), kind: "guess" });
  if (invoiceIn) ghosts.push({ month: 9, amount: scaleUp * 1000, tag: fmt.n(scaleUp, 1), kind: "scale" });
  return { fill: { month: 9, amount: kwh, filled: invoiceIn, from: (strom.guess ?? 0) * 1000 }, ghosts };
}

"use client";

import { useState, type PointerEvent } from "react";
import { SvgLens } from "@/components/demos/glas";
import { BIAS_MAX, LAMP_KEYS, PRUEF, TREFFER_MIN, type Checker, type LampKey, type Lamps } from "@/lib/demo-cases/ki-prognosen-einschaetzen/check";
import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { biasWindow } from "@/lib/demo-cases/ki-prognosen-einschaetzen/derive";
import { fill } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";
import type { Model } from "@/lib/demo-cases/ki-prognosen-einschaetzen/model";
import { biasWords, jars, percent, weekSentence } from "./helpers";
import { linear, PAD, PersonGlyph, SceneFrame, usePlotSize, useScrub, weekScale } from "./plot";

/** Mean absolute error of the tool and of the rule over the 13 weeks before t (the Messlatte lamp, drawn). */
export function windowMeans(check: Checker, t: number): { readonly tool: number; readonly rule: number } | null {
  const { weeks } = check.errorsBefore(t, PRUEF);
  if (weeks.length === 0) return null;
  let tool = 0;
  let rule = 0;
  for (const k of weeks) {
    const ist = check.rows[k]!.ist as number;
    tool += Math.abs(ist - (check.forecast(k) as number));
    rule += Math.abs(ist - (check.rule(k) ?? ist));
  }
  return { tool: tool / weeks.length, rule: rule / weeks.length };
}

/** One lamp's short value under its name. */
export function lampValue(copy: DemoPack, check: Checker, t: number, key: LampKey, lamps: Lamps): string {
  if (key === "daten") return lamps.daten ? copy.s5.values.daten : copy.s5.values.datenMissing;
  if (key === "messlatte") {
    const means = windowMeans(check, t);
    return means ? fill(copy.s5.values.messlatte, { tool: jars(means.tool, copy.locale), rule: jars(means.rule, copy.locale) }) : "";
  }
  if (key === "bias") return biasWords(copy, lamps);
  return fill(copy.s5.values.spanne, { hits: lamps.treffer, of: PRUEF });
}

/** Below this plot width the bars show a window of ZOOM_WEEKS weeks, ZOOM_AFTER of them after the playhead. */
const ZOOM_BELOW = 560;
const ZOOM_WEEKS = 20;
const ZOOM_AFTER = 3;

/** The question one lamp asks, with its limit. */
export function lampSentence(copy: DemoPack, key: LampKey): string {
  if (key === "bias") return fill(copy.s5.lamps.bias, { max: percent(BIAS_MAX, copy.locale, 0) });
  if (key === "spanne") return fill(copy.s5.lamps.spanne, { min: TREFFER_MIN, of: PRUEF });
  return copy.s5.lamps[key];
}

/** A pressed lamp's line: its name, this week's value and its question (the value is hidden in the row on a phone). */
function lampLine(copy: DemoPack, check: Checker, t: number, key: LampKey): string {
  const lamps = check.lamps(t);
  const value = lamps ? lampValue(copy, check, t, key, lamps) : "";
  return `${copy.s5.lampNames[key]}: ${lampSentence(copy, key)}${value ? ` ${value}` : ""}`;
}

/** The four lamps of a week. Each is a button: a tap puts its question under the row. */
export function LampRow({
  copy,
  check,
  t,
  active,
  onLamp,
}: {
  readonly copy: DemoPack;
  readonly check: Checker;
  readonly t: number;
  readonly active: LampKey | null;
  readonly onLamp: (key: LampKey) => void;
}) {
  const lamps = check.lamps(t);
  return (
    <ul className="w01-lamps" aria-label={copy.s5.lampsLabel}>
      {LAMP_KEYS.map((key) => {
        const value = lamps ? lamps[key] : null;
        const state = value === null ? "none" : value ? "green" : "red";
        return (
          <li key={key} className="w01-lamp" data-state={state}>
            <button type="button" className="w01-lamp-button" aria-pressed={active === key} onClick={() => onLamp(key)} data-w01-lamp={key}>
              <span className="w01-lamp-disc" aria-hidden="true" />
              <span className="w01-lamp-name">
                {copy.s5.lampNames[key]}
                <span className="sr-only">: {copy.s5.state[state]}</span>
              </span>
              <span className="w01-lamp-value">{lamps ? lampValue(copy, check, t, key, lamps) : ""}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Scene 5, "Die Prüfregel": the scene 2 tool bars return, over the 52 weeks
 * of the rule. A bracket spans the 13 scored weeks before the playhead week,
 * and the four lamps are read off what sits inside it: the mean line of the
 * bars inside the shaded band of ±5 % of sales is the bias lamp, the hit
 * squares under the bracket the range lamp. Under the strip, one square per
 * week fills in: filled when all four are green, hollow with a person when
 * someone decides.
 */
export function SceneRule({
  copy,
  model,
  playhead,
  filled,
  owner,
  selected,
  onPlayhead,
  onCommit,
  onSelect,
}: {
  readonly copy: DemoPack;
  readonly model: Model;
  readonly playhead: number;
  readonly filled: boolean;
  readonly owner: string;
  readonly selected: number | null;
  readonly onPlayhead: (t: number) => void;
  readonly onCommit: (t: number, share: number) => void;
  readonly onSelect: (t: number) => void;
}) {
  const { check, strip } = model;
  const [lamp, setLamp] = useState<LampKey | null>(null);
  const [held, setHeld] = useState<number | null>(null);
  const [plotRef, { width, height }] = usePlotSize();
  // On a phone the bars zoom to a window around the bracket; the squares keep the whole year.
  const year = weekScale(strip, PAD.left, width - PAD.right);
  const first = strip[0] ?? 0;
  const last = strip[strip.length - 1] ?? first;
  const zoom = width > 0 && width < ZOOM_BELOW && last - first + 1 > ZOOM_WEEKS;
  const liveStart = Math.min(last - ZOOM_WEEKS + 1, Math.max(first, playhead - ZOOM_WEEKS + ZOOM_AFTER + 1));
  const start = held ?? liveStart;
  const shownWeeks = zoom ? strip.filter((t) => t >= start && t < start + ZOOM_WEEKS) : strip;
  const scale = zoom ? weekScale(shownWeeks, PAD.left, width - PAD.right) : year;
  const scrub = useScrub(scale, onPlayhead, (t) => {
    setHeld(null);
    onCommit(t, scale.x(t) / width);
  });
  const scrubHandlers = {
    ...scrub.handlers,
    onPointerDown: (event: PointerEvent<Element>) => {
      if (zoom) setHeld(start);
      scrub.handlers.onPointerDown(event);
    },
    onPointerCancel: () => {
      setHeld(null);
      scrub.handlers.onPointerCancel();
    },
  };
  const square = Math.max(4, Math.min(11, year.step * 0.78));
  const squaresY = height - square / 2 - 4;
  const stripTop = 8;
  const stripBottom = Math.max(stripTop + 40, squaresY - square - 14);

  let miss = 1;
  for (const t of strip) {
    const ist = check.rows[t]?.ist;
    const forecast = check.forecast(t);
    if (ist !== null && ist !== undefined && forecast !== null) miss = Math.max(miss, Math.abs(ist - forecast));
  }
  const y = linear(-miss, miss, stripBottom, stripTop);
  const bar = Math.max(1.5, scale.step * 0.6);
  const { weeks } = check.errorsBefore(playhead, PRUEF);
  const inside = new Set(weeks);
  const bias = biasWindow(check, playhead);
  const lamps = check.lamps(playhead);
  const bx0 = weeks.length > 0 ? Math.max(0, scale.x(Math.min(...weeks)) - scale.step / 2) : 0;
  const bx1 = weeks.length > 0 ? Math.min(width, scale.x(Math.max(...weeks)) + scale.step / 2) : 0;
  const biasOut = bias ? Math.abs(bias.mean) > bias.band : false;

  const onSquaresTap = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!box) return;
    const t = year.at(event.clientX - box.left);
    if (filled || t <= playhead) {
      onSelect(t);
      return;
    }
    onPlayhead(t);
    onCommit(t, year.x(t) / width);
  };
  const head = (
    <>
      <LampRow copy={copy} check={check} t={playhead} active={lamp} onLamp={(key) => setLamp((current) => (current === key ? null : key))} />
      <p className="w01-line" aria-live="polite" data-w01-lamp-line={lamp ?? undefined}>
        {lamp ? lampLine(copy, check, playhead, lamp) : weekSentence(copy, lamps, owner)}
      </p>
    </>
  );

  return (
    <SceneFrame head={head} plotRef={plotRef} className="is-rule">
      <svg width={width} height={height} className="w01-svg" role="img" aria-label={copy.s5.squaresLabel}>
        <g id="w01-chart">
          <path className="w01-zero" d={`M0 ${y(0).toFixed(1)}H${width}`} />
          {weeks.length > 0 ? (
            <g className="w01-bracket" aria-hidden="true">
              <rect x={bx0} y={stripTop - 4} width={Math.max(4, bx1 - bx0)} height={stripBottom - stripTop + 8} rx={8} />
              {bias ? (
                <>
                  <rect className="w01-biasband" x={bx0} y={y(bias.band)} width={Math.max(4, bx1 - bx0)} height={Math.max(1, y(-bias.band) - y(bias.band))} />
                  <path className={biasOut ? "w01-mean is-out" : "w01-mean"} d={`M${bx0.toFixed(1)} ${y(bias.mean).toFixed(1)}H${bx1.toFixed(1)}`} />
                </>
              ) : null}
            </g>
          ) : null}
          {shownWeeks.map((t) => {
            const ist = check.rows[t]?.ist;
            const forecast = check.forecast(t);
            if (ist === null || ist === undefined || forecast === null || !check.valid(t)) return null;
            const e = ist - forecast;
            return (
              <rect
                key={t}
                x={scale.x(t) - bar / 2}
                y={Math.min(y(0), y(e))}
                width={bar}
                height={Math.max(1, Math.abs(y(e) - y(0)))}
                className={inside.has(t) ? "w01-ebar is-tool" : "w01-ebar is-tool is-dim"}
              />
            );
          })}
          <path className="w01-playhead-line" d={`M${scale.x(playhead).toFixed(1)} ${stripTop - 6}V${zoom ? stripBottom + 4 : height}`} />
        </g>
        <rect x={0} y={0} width={width} height={stripBottom + 6} className="w01-hit" {...scrubHandlers} />
        {zoom ? (
          <path
            className="w01-window"
            aria-hidden="true"
            d={`M${(year.x(start) - year.step / 2).toFixed(1)} ${(squaresY - square / 2 - 5).toFixed(1)}H${(year.x(start + ZOOM_WEEKS - 1) + year.step / 2).toFixed(1)}`}
          />
        ) : null}
        {zoom ? <path className="w01-playhead-line" aria-hidden="true" d={`M${year.x(playhead).toFixed(1)} ${(squaresY - square / 2 - 8).toFixed(1)}V${height}`} /> : null}
        <g className="w01-squares" aria-hidden="true">
          {strip.map((t) => {
            const x = year.x(t);
            const shown = filled || t <= playhead;
            const week = check.lamps(t);
            const h = square / 2;
            if (!shown || !week) return <rect key={t} x={x - h} y={squaresY - h} width={square} height={square} className="w01-square is-empty" />;
            return week.frei ? (
              <rect key={t} x={x - h} y={squaresY - h} width={square} height={square} className="w01-square is-free" data-selected={selected === t ? "" : undefined} />
            ) : (
              <g key={t} data-selected={selected === t ? "" : undefined}>
                <rect x={x - h} y={squaresY - h} width={square} height={square} className="w01-square is-red" />
                <PersonGlyph x={x} y={squaresY + 0.5} size={square * 0.9} />
              </g>
            );
          })}
        </g>
        <rect x={0} y={stripBottom + 6} width={width} height={Math.max(0, height - stripBottom - 6)} className="w01-hit is-tap" onPointerUp={onSquaresTap} />
        <SvgLens contentId="w01-chart" cx={scale.x(playhead)} cy={bias ? y(bias.mean) : (stripTop + stripBottom) / 2} r={34} visible={scrub.active} />
      </svg>
    </SceneFrame>
  );
}

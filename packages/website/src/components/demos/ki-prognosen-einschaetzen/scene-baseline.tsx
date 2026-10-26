"use client";

import { DataHandle } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { fill } from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";
import { shiftedAccuracy, type Model } from "@/lib/demo-cases/ki-prognosen-einschaetzen/model";
import { percent } from "./helpers";
import { linear, linePath, Readline, SceneFrame, usePlotSize } from "./plot";
import { ForecastLine, SalesBars, seriesGeometry } from "./series";

const RULER_H = 58;
const RULER_MIN = 0.8;
const RULER_MAX = 1;
/** How far past 0 or 1 week the copy stretches before it resists (rubber band). */
const BAND = 0.35;

/** A label's width estimate in px (12px semibold); enough to keep labels apart. */
const labelWidth = (label: string) => label.length * 6.8;

/**
 * Label positions on the ruler: one label centred, two labels pointing away
 * from each other, both kept inside the plot and never overlapping.
 */
export function placeLabels(xs: readonly number[], labels: readonly string[], width: number): { x: number; anchor: "start" | "middle" | "end" }[] {
  const edge = 4;
  if (xs.length === 1) {
    const half = labelWidth(labels[0] ?? "") / 2;
    return [{ x: Math.min(width - edge - half, Math.max(edge + half, xs[0] ?? 0)), anchor: "middle" }];
  }
  const [x0 = 0, x1 = 0] = xs;
  const [w0, w1] = [labelWidth(labels[0] ?? ""), labelWidth(labels[1] ?? "")];
  const start = Math.max(edge, Math.min(x1, width - edge - w1));
  const end = Math.max(edge + w0, Math.min(x0, start - 8));
  return [
    { x: end, anchor: "end" },
    { x: Math.max(start, end + 8), anchor: "start" },
  ];
}

/** A ruler position as a guess in percent: half steps, inside the ruler. */
function guessValue(share: number): number {
  return Math.round(Math.min(RULER_MAX, Math.max(RULER_MIN, share)) * 200) / 2;
}

/** The copy's displayed shift: 1:1 inside [0, 1], resisting beyond (gel stretch). */
export function rubberBand(raw: number): number {
  if (raw > 1) return 1 + BAND * (1 - 1 / (1 + (raw - 1) / BAND));
  if (raw < 0) return -BAND * (1 - 1 / (1 - raw / BAND));
  return raw;
}

function Marker({
  x,
  y,
  label,
  kind,
  anchor,
  textX = x,
}: {
  readonly x: number;
  readonly y: number;
  readonly label: string;
  /** Where the label sits, when it has to move off the mark to stay inside or apart. */
  readonly textX?: number;
  readonly kind: "tool" | "guess" | "rule" | "copy";
  readonly anchor: "start" | "middle" | "end";
}) {
  return (
    <g className={`w01-mark is-${kind}`}>
      {kind === "tool" ? <circle cx={x} cy={y} r={5.5} /> : null}
      {kind === "guess" ? <path d={`M${x} ${y - 6}l6 6l-6 6l-6 -6z`} /> : null}
      {kind === "rule" || kind === "copy" ? <path d={`M${x} ${y - 9}V${y + 9}`} /> : null}
      {label ? (
        <text x={textX} y={y - 12} textAnchor={anchor} className="w01-label is-strong">
          {label}
        </text>
      ) : null}
    </g>
  );
}

/**
 * Scene 1, "Messlatte": an accuracy ruler (80 to 100 %) with the tool's own
 * claim and the visitor's guess, over the 2025 series. After the guess a
 * grip appears on the right end of the sales line: dragging it slides a
 * copy of the line one week to the right, and that copy is the rule „so
 * viel wie letzte Woche“. Its accuracy is computed for every position, so
 * the marker on the ruler moves under the finger and lands on 92,6 %.
 */
export function SceneBaseline({
  copy,
  model,
  guess,
  onGuess,
  showGrip,
  shift,
  dragging,
  onShift,
  onRelease,
  onActive,
}: {
  readonly copy: DemoPack;
  readonly model: Model;
  readonly guess: number | null;
  /** While the guess is open, its marker on the ruler is a handle; values in percent. */
  readonly onGuess?: (value: number) => void;
  readonly showGrip: boolean;
  /** Raw shift in weeks (may sit outside [0, 1] while held). */
  readonly shift: number;
  readonly dragging: boolean;
  readonly onShift: (weeks: number) => void;
  readonly onRelease: (share: number) => void;
  /** Stable (a state setter): the grip is held. */
  readonly onActive: (active: boolean) => void;
}) {
  const { check, span } = model;
  const locale = copy.locale;
  const [plotRef, { width, height }] = usePlotSize();
  const geometry = seriesGeometry(model, width, RULER_H + 8, height - 4);
  const { scale, y } = geometry;
  const shown = rubberBand(shift);
  const clamped = Math.min(1, Math.max(0, shift));
  const accuracy = shiftedAccuracy(model, clamped);
  const atRule = !dragging && Math.abs(shift - 1) < 1e-9;
  const atZero = !dragging && Math.abs(shift) < 1e-9;

  const ruler = linear(RULER_MIN, RULER_MAX, 20, width - 20);
  const rulerY = 30;
  const tool = model.toolAccuracy;
  const guessShare = guess === null ? null : guess / 100;
  const markers: { kind: "tool" | "guess"; share: number; label: string }[] = [];
  if (tool !== null) markers.push({ kind: "tool", share: tool, label: `${copy.s1.rulerTool} ${percent(tool, locale)}` });
  if (guessShare !== null) markers.push({ kind: "guess", share: guessShare, label: `${copy.s1.rulerGuess} ${percent(guessShare, locale)}` });
  markers.sort((a, b) => a.share - b.share);
  const markerXs = markers.map((marker) => ruler(Math.max(RULER_MIN, marker.share)));
  const placed = placeLabels(markerXs, markers.map((marker) => marker.label), width);

  // The copy: the sales line from the week before the span, shifted by `shown` weeks.
  const first = span[0] ?? 0;
  const lastWeek = span[span.length - 1] ?? first;
  const copyWeeks = [first - 1, ...span];
  const copyPoints = copyWeeks.map((t) => {
    const ist = check.rows[t]?.ist;
    return ist === null || ist === undefined ? null : ([scale.x(t), y(ist)] as const);
  });
  const lastIst = check.rows[lastWeek]?.ist ?? 0;
  const gripX = scale.x(lastWeek) + shown * scale.step;

  // While the guess is open the caption carries the words; the plot keeps its height.
  const readout = !showGrip
    ? null
    : atZero
      ? copy.s1.zero
      : fill(atRule ? copy.s1.atRule : copy.s1.between, { accuracy: percent(accuracy, locale) });

  return (
    <SceneFrame head={readout ? <Readline live>{readout}</Readline> : null} plotRef={plotRef}>
      <svg width={width} height={height} className="w01-svg" role="img" aria-label={copy.s1.rulerLabel}>
        <g className="w01-ruler" aria-hidden="true">
          <path className="w01-axis" d={`M${ruler(RULER_MIN)} ${rulerY}H${ruler(RULER_MAX)}`} />
          {[0.8, 0.85, 0.9, 0.95, 1].map((tick) => (
            <g key={tick}>
              <path className="w01-axis" d={`M${ruler(tick)} ${rulerY - 3}V${rulerY + 3}`} />
              <text x={ruler(tick)} y={rulerY + 16} textAnchor="middle" className="w01-label is-tick">
                {percent(tick, locale, 0)}
              </text>
            </g>
          ))}
          {markers.map((marker, index) => (
            <Marker
              key={marker.kind}
              kind={marker.kind}
              x={markerXs[index] ?? 0}
              y={rulerY}
              label={marker.label}
              anchor={placed[index]?.anchor ?? "middle"}
              textX={placed[index]?.x}
            />
          ))}
          {showGrip && !atZero ? (
            <Marker kind={atRule ? "rule" : "copy"} x={ruler(Math.max(RULER_MIN, accuracy))} y={rulerY} label="" anchor="middle" />
          ) : null}
        </g>
        <g id="w01-chart">
          <SalesBars check={check} weeks={span} geometry={geometry} dim />
          <path d={linePath(copyPoints.slice(1))} className="w01-sales-line" />
          {check.hasForecast ? <ForecastLine check={check} weeks={span} geometry={geometry} /> : null}
          {showGrip ? (
            <g className="w01-copy" data-rule={atRule ? "" : undefined} data-drag={dragging ? "" : undefined} style={{ transform: `translateX(${(shown * scale.step).toFixed(2)}px)` }}>
              <path d={linePath(copyPoints)} />
            </g>
          ) : null}
        </g>
        {onGuess && guessShare !== null ? (
          <DataHandle
            x={ruler(guessShare)}
            y={rulerY}
            label={copy.s1.sliderLabel}
            valueText={fill(copy.s1.sliderValue, { value: percent(guessShare, locale).replace(/\s?%$/, "") })}
            fill="#fceeaf"
            onMove={(point) => onGuess(guessValue(RULER_MIN + ((point.x - 20) / Math.max(1, width - 40)) * (RULER_MAX - RULER_MIN)))}
            onStep={(dx, _dy, big) => onGuess(guessValue(guessShare + (dx * (big ? 2 : 0.5)) / 100))}
          />
        ) : null}
        {showGrip ? (
          <DataHandle
            x={gripX}
            y={y(lastIst)}
            label={copy.s1.gripLabel}
            valueText={fill(copy.s1.gripValue, { weeks: Math.round(clamped), accuracy: percent(accuracy, locale) })}
            fill="#fceeaf"
            onMove={(point) => onShift((point.x - scale.x(lastWeek)) / scale.step)}
            onStep={(dx) => {
              const next = Math.min(1, Math.max(0, Math.round(clamped) + dx));
              onShift(next);
              onRelease(next === 1 ? 0.9 : 0.6);
            }}
            onActiveChange={onActive}
            onCommit={() => onRelease(Math.min(1, Math.max(0, gripX / width)))}
          >
            <rect x={gripX - 13} y={y(lastIst) - 9} width={26} height={18} rx={9} className="w01-grip" />
          </DataHandle>
        ) : null}
      </svg>
    </SceneFrame>
  );
}

"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { fill, type DemoText } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-shared";
import { formatEur, formatNumber, formatPct } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/format";
import {
  BASE_FRAME,
  BATHTUB,
  FIGURE_SIZE,
  LEGEND,
  WIDTHS,
  fadeIn,
  fadeOut,
  keyItems,
  layout,
  momentFor,
  placeLabel,
  resolveRows,
  seekPath,
  textWidth,
  type FigureContext,
  type FigureId,
  type Frame,
  type KeyItem,
  type Label,
  type LabelText,
  type Placed,
  type Shape,
} from "@/lib/demo-cases/datenbereitschaft-fuer-ki/layout";
import type { Reading } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/model";
import { FOLDLINE } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/data";

const INK = "#3b1f45";
const ACCENT = "#964305";
const PAPER = "#fffcf5";
const HAIR = "#b39d8f";
/** The database check: dashed, in the tone of what it checks. */
const TRUTH_DASH = "5 3";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function subscribeReduced(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => undefined;
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener?.("change", onChange);
  return () => query.removeEventListener?.("change", onChange);
}

function reducedSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True under prefers-reduced-motion: reduce. */
export function useReducedMotionPreference(): boolean {
  return useSyncExternalStore(subscribeReduced, reducedSnapshot, () => false);
}

export interface FigureMotion {
  readonly frame: Frame;
  readonly shapes: readonly Shape[];
  /** Progress of the running moment; 1 when the figure stands still. */
  readonly t: number;
  /** Label and shape ids the moment started with; new ones fade in (fadeIn). */
  readonly before: ReadonlySet<string> | null;
}

/**
 * The shapes of a figure for its reading. A change of reading that is one of
 * the four listed moments plays seek(from, to, t) for its duration; anything
 * else, and everything under reduced motion, is the final frame (t = 1)
 * without a requestAnimationFrame.
 */
export function useFigureShapes(figure: FigureId, reading: Reading, context: FigureContext = {}): FigureMotion {
  const reduced = useReducedMotionPreference();
  const { request, single } = context;
  const frame = useMemo(() => layout(figure, reading, { request, single }), [figure, reading, request, single]);
  const target = frame.shapes;
  const [motion, setMotion] = useState<{ from: readonly Shape[]; before: ReadonlySet<string>; reading: Reading; t: number } | null>(null);
  const shown = useRef<{ reading: Reading; frame: Frame }>({ reading, frame });

  useIsomorphicLayoutEffect(() => {
    const previous = shown.current;
    if (previous.reading === reading) {
      shown.current = { reading, frame };
      return undefined;
    }
    const moment = momentFor(previous.reading, reading);
    if (!moment || reduced) {
      shown.current = { reading, frame };
      setMotion(null);
      return undefined;
    }
    const from = previous.frame.shapes;
    const before = new Set([...previous.frame.shapes.map((shape) => shape.id), ...previous.frame.labels.map((label) => label.id)]);
    shown.current = { reading, frame };
    setMotion({ from, before, reading, t: 0 });
    let handle = 0;
    let start: number | undefined;
    const step = (now: number) => {
      start ??= now;
      const t = Math.min(1, (now - start) / moment.duration);
      setMotion(t >= 1 ? null : { from, before, reading, t });
      if (t < 1) handle = window.requestAnimationFrame(step);
    };
    handle = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(handle);
  }, [reading, reduced, frame]);

  if (motion && motion.reading === reading && !reduced) {
    return { frame, shapes: seekPath(motion.from, frame.via, target, motion.t), t: motion.t, before: motion.before };
  }
  return { frame, shapes: target, t: 1, before: null };
}

/** Opacity of a label or mark with this id: new ones fade in during a moment, leaving ones fade out. */
function opacityOf(motion: FigureMotion, id: string): number {
  if (!motion.before) return 1;
  if (!motion.before.has(id)) return fadeIn(motion.t);
  return motion.frame.shapes.some((shape) => shape.id === id) ? 1 : fadeOut(motion.t);
}

function labelText(text: LabelText, copy: DemoText): string {
  const { locale } = copy;
  switch (text.kind) {
    case "eur":
      return formatEur(text.amount, locale);
    case "pct":
      return formatPct(text.pct, locale, text.digits ?? 1);
    case "fraction": {
      const of = locale === "de" ? "von" : "of";
      const fraction = `${text.scope ? `${copy.figure.allSegments}: ` : ""}${text.num} ${of} ${text.den}`;
      return text.den === 0
        ? `${fraction}, ${locale === "de" ? "keine Quote" : "no rate"}`
        : `${fraction} = ${formatPct((100 * text.num) / text.den, locale, text.digits ?? 1)}`;
    }
    case "count":
      return formatNumber(text.n, locale);
    case "department":
      return copy.figure.departments[text.id];
    case "month":
      return copy.figure.months[text.month];
    case "quarter":
      return copy.rowLabels.Q2;
    case "lineLabel":
      return `${copy.figure.attrition} ${formatPct(text.pct, locale, text.digits ?? 1)}`;
    case "noCounts":
      return copy.figure.noCounts;
    case "times":
      return fill(copy.figure.times, { factor: formatNumber(text.factor, locale, 2) });
  }
}

const SPREAD_POSITIONS = new Set<Label["position"]>(["above", "below", "belowLow"]);

/**
 * Where each label goes: placeLabel() for all, then, for the widths figure,
 * crowded rows spread sideways and the check's legend moved right of yours.
 */
function placeAll(
  labels: readonly Label[],
  byId: ReadonlyMap<string, Shape>,
  width: number,
  copy: DemoText,
  spread: boolean,
): Map<string, Placed> {
  const placed = new Map<string, Placed>();
  for (const label of labels) {
    const shape = byId.get(label.attach);
    if (shape) placed.set(label.id, placeLabel(label, shape, width));
  }
  const legend = labels.find((label) => label.position === "legend" && placed.has(label.id));
  for (const label of labels) {
    const at = placed.get(label.id);
    if (label.position !== "legendTruth" || !at) continue;
    // A second legend column at mid-width, further right only if yours runs long.
    const x = legend ? Math.max(width / 2, LEGEND.textX + textWidth(labelText(legend.text, copy)) + LEGEND.between) : 1;
    placed.set(label.id, { ...at, x: x + LEGEND.textX - 1 });
  }
  if (!spread) return placed;
  const entries = labels.flatMap((label) => {
    const at = placed.get(label.id);
    const shape = byId.get(label.attach);
    if (!at || !shape || !SPREAD_POSITIONS.has(label.position)) return [];
    const w = textWidth(labelText(label.text, copy));
    const center = at.anchor === "middle" ? at.x : at.anchor === "start" ? at.x + w / 2 : at.x - w / 2;
    return [{ id: label.id, center, y: at.y, width: w, columnX: shape.x, columnW: shape.w }];
  });
  for (const [id, center] of resolveRows(entries, width)) {
    const at = placed.get(id);
    if (at) placed.set(id, { ...at, x: center, anchor: "middle" });
  }
  return placed;
}

function Labels({
  labels,
  motion,
  width,
  copy,
  spread = false,
}: {
  readonly labels: readonly Label[];
  readonly motion: FigureMotion;
  readonly width: number;
  readonly copy: DemoText;
  readonly spread?: boolean;
}) {
  const byId = new Map(motion.shapes.map((shape) => [shape.id, shape]));
  const placed = placeAll(labels, byId, width, copy, spread);
  return (
    <g>
      {labels.map((label) => {
        const shape = byId.get(label.attach);
        const at = placed.get(label.id);
        if (!shape || !at) return null;
        if (label.position === "inside" && shape.h < 20) return null;
        const opacity = opacityOf(motion, label.id);
        if (opacity <= 0) return null;
        const fill = label.onSolid ? PAPER : INK;
        const kind = label.text.kind;
        const weight = kind === "month" || kind === "quarter" || kind === "department" || kind === "count" ? 600 : 700;
        const text = (
          <text key={label.id} x={at.x} y={at.y} textAnchor={at.anchor} fill={fill} fontWeight={weight} opacity={opacity < 1 ? opacity : undefined}>
            {labelText(label.text, copy)}
          </text>
        );
        if (label.position !== "legend" && label.position !== "legendTruth") return text;
        // A rate line's label sits in the free top band with its swatch, so no column covers it.
        const x1 = at.x - LEGEND.textX + 1;
        const x2 = at.x - 6;
        const y = LEGEND.y - 4.5;
        return (
          <g key={label.id} opacity={opacity < 1 ? opacity : undefined}>
            {label.position === "legend" ? (
              <line x1={x1} x2={x2} y1={y} y2={y} stroke={ACCENT} strokeWidth={3} />
            ) : (
              <line x1={x1} x2={x2} y1={y} y2={y} stroke={INK} strokeWidth={2} strokeDasharray={TRUTH_DASH} />
            )}
            {text}
          </g>
        );
      })}
    </g>
  );
}

function Bar({ shape, opacity = 1 }: { readonly shape: Shape; readonly opacity?: number }) {
  if (shape.h <= 0.01 && shape.tone !== "line") return null;
  if (opacity <= 0) return null;
  const color = shape.tone === "change" ? ACCENT : INK;
  const fade = opacity < 1 ? opacity : undefined;
  if (shape.solid) {
    return <rect x={shape.x} y={shape.y} width={Math.max(0, shape.w)} height={Math.max(0, shape.h)} fill={color} opacity={fade} />;
  }
  const stroke = shape.truth ? 2 : 1.5;
  return (
    <rect
      x={shape.x + stroke / 2}
      y={shape.y + stroke / 2}
      width={Math.max(0, shape.w - stroke)}
      height={Math.max(0, shape.h - stroke)}
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeDasharray={shape.truth ? TRUTH_DASH : undefined}
      opacity={fade}
      data-truth={shape.truth ? "" : undefined}
    />
  );
}

/** Points of a zigzag across x .. x + w around height y, 2 units past each edge. */
function zigzag(x: number, w: number, y: number, teeth: number): readonly (readonly [number, number])[] {
  const step = w / teeth;
  const points: [number, number][] = [[x - 2, y]];
  for (let index = 0; index < teeth; index += 1) {
    points.push([x + step * (index + 0.5), y - 3], [x + step * (index + 1), y + 3]);
  }
  points.push([x + w + 2, y]);
  return points;
}

const path = (points: readonly (readonly [number, number])[]): string =>
  points.map(([px, py], index) => `${index === 0 ? "M" : "L"}${px} ${py}`).join(" ");

/**
 * The tower cannot fit: a break band (two zigzags with paper between) cut out
 * of it, and an arrow above the clip line that says it keeps going.
 */
function TowerBreak({ x, w, opacity }: { readonly x: number; readonly w: number; readonly opacity: number }) {
  const top = zigzag(x, w, BATHTUB.breakTop, 4);
  const bottom = zigzag(x, w, BATHTUB.breakBottom, 4);
  const center = x + w / 2;
  if (opacity <= 0) return null;
  return (
    <g data-tower-break="" opacity={opacity < 1 ? opacity : undefined}>
      <path d={`${path([...top, ...[...bottom].reverse()])} Z`} fill={PAPER} stroke="none" />
      <path d={path(top)} fill="none" stroke={INK} strokeWidth={2} />
      <path d={path(bottom)} fill="none" stroke={INK} strokeWidth={2} />
      <line x1={center} x2={center} y1={BATHTUB.clipTop} y2={10} stroke={INK} strokeWidth={2.5} />
      <path d={`M${center - 6} 12 L${center} 3 L${center + 6} 12 Z`} fill={INK} />
    </g>
  );
}

/** A bracket: a vertical stroke with a cap at each end. */
function Bracket({ shape }: { readonly shape: Shape }) {
  if (shape.h <= 0.01) return null;
  const center = shape.x + shape.w / 2;
  const bottom = shape.y + shape.h;
  return (
    <g stroke={ACCENT} strokeWidth={2.5} fill="none">
      <line x1={center} x2={center} y1={shape.y} y2={bottom} />
      <line x1={shape.x} x2={shape.x + shape.w} y1={shape.y} y2={shape.y} />
      <line x1={shape.x} x2={shape.x + shape.w} y1={bottom} y2={bottom} />
    </g>
  );
}

interface FigureProps {
  readonly reading: Reading;
  readonly text: DemoText;
  readonly context: FigureContext;
}

function Bathtub({ reading, text, context }: FigureProps) {
  const motion = useFigureShapes("bathtub", reading, context);
  const { shapes, frame } = motion;
  const { width, height } = FIGURE_SIZE.bathtub;
  const copy = text.figure;
  const levelShapes = shapes.filter((shape) => shape.tone === "level");
  const changeShapes = shapes.filter((shape) => shape.tone === "change");
  const guides = shapes.filter((shape) => shape.tone === "guide");
  const brackets = shapes.filter((shape) => shape.tone === "bracket");
  // The tower breaks where the final frame leaves the figure; the break fades in once it has risen.
  const cut = frame.shapes.find((shape) => shape.tone === "level" && shape.y + shape.h < BATHTUB.breakTop && shape.h > 0);
  const clipId = `dr3-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const months = Object.entries(BATHTUB.columns) as [keyof typeof BATHTUB.columns, number][];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="presentation">
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={BATHTUB.clipTop} width={width} height={BATHTUB.levelBaseline - BATHTUB.clipTop + 1} />
        </clipPath>
      </defs>
      <text x={1} y={14} fill={INK} fontWeight={700}>
        {copy.levels}
      </text>
      <line x1={0} x2={width} y1={BATHTUB.frameTop} y2={BATHTUB.frameTop} stroke={HAIR} strokeWidth={1} strokeDasharray="3 3" />
      <g clipPath={`url(#${clipId})`}>
        {levelShapes.map((shape) => (
          <Bar key={shape.id} shape={shape} opacity={opacityOf(motion, shape.id)} />
        ))}
      </g>
      {cut ? <TowerBreak x={cut.x} w={cut.w} opacity={motion.before ? fadeIn(motion.t) : 1} /> : null}
      {guides.map((shape) => {
        const opacity = opacityOf(motion, shape.id);
        return opacity <= 0 ? null : (
          <line
            key={shape.id}
            x1={shape.x}
            x2={shape.x + shape.w}
            y1={shape.y}
            y2={shape.y}
            stroke={ACCENT}
            strokeWidth={1.5}
            strokeDasharray="1.5 3"
            opacity={opacity < 1 ? opacity : undefined}
          />
        );
      })}
      {brackets.map((shape) => (
        <Bracket key={shape.id} shape={shape} />
      ))}
      <line x1={0} x2={width} y1={BATHTUB.levelBaseline} y2={BATHTUB.levelBaseline} stroke={INK} strokeWidth={1.5} />
      {months.map(([month, x]) => (
        <text key={month} x={x + BATHTUB.columnWidth / 2} y={BATHTUB.levelBaseline + 16} textAnchor="middle" fill={INK} fontWeight={600}>
          {copy.months[month]}
        </text>
      ))}
      <text x={1} y={BATHTUB.levelBaseline + 40} fill={ACCENT} fontWeight={700}>
        {`${copy.changes} · ${copy.scaleNote}`}
      </text>
      {changeShapes.map((shape) => (
        <Bar key={shape.id} shape={shape} opacity={opacityOf(motion, shape.id)} />
      ))}
      <line x1={0} x2={width} y1={BATHTUB.changeBaseline} y2={BATHTUB.changeBaseline} stroke={ACCENT} strokeWidth={1.5} />
      {months.map(([month, x]) => (
        <text key={`c-${month}`} x={x + BATHTUB.columnWidth / 2} y={BATHTUB.changeNames} textAnchor="middle" fill={INK} fontWeight={600}>
          {copy.months[month]}
        </text>
      ))}
      <Labels labels={frame.labels} motion={motion} width={width} copy={text} />
    </svg>
  );
}

function BaseFrame({ reading, text, context }: FigureProps) {
  const motion = useFigureShapes("baseFrame", reading, context);
  const { shapes, frame } = motion;
  const { width } = FIGURE_SIZE.baseFrame;
  const height = frame.height ?? FIGURE_SIZE.baseFrame.height;
  const copy = text.figure;
  const strip = { w: BASE_FRAME.stripWidth, h: 12 };
  const legend = [
    { tone: "stayed", text: copy.stayed },
    { tone: "churned", text: copy.churned },
    { tone: "joined", text: copy.joined },
  ] as const;
  let legendX = 1;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="presentation">
      <g>
        {legend.map((item) => {
          const x = legendX;
          legendX += 18 + item.text.length * 7.2 + 12;
          return (
            <g key={item.tone}>
              <Strip tone={item.tone} x={x} y={4} w={strip.w + 3} h={strip.h} />
              <text x={x + 14} y={15} fill={INK} fontWeight={600}>
                {item.text}
              </text>
            </g>
          );
        })}
      </g>
      {FOLDLINE.segments.map((segment, row) => (
        <text key={segment} x={1} y={BASE_FRAME.rows[row] - 10} fill={INK} fontWeight={700}>
          {segment}
        </text>
      ))}
      {shapes
        .filter((shape) => shape.tone !== "frame")
        .map((shape) => (
          <Strip key={shape.id} tone={shape.tone as "stayed" | "churned" | "joined"} x={shape.x} y={shape.y} w={shape.w} h={shape.h} />
        ))}
      {shapes
        .filter((shape) => shape.tone === "frame" && shape.w > 0.5)
        .map((shape) => (
          <rect key={shape.id} x={shape.x} y={shape.y} width={shape.w} height={shape.h} fill="none" stroke={ACCENT} strokeWidth={2.5} />
        ))}
      <Labels labels={frame.labels} motion={motion} width={width} copy={text} />
    </svg>
  );
}

function Strip({ tone, x, y, w, h }: { readonly tone: "stayed" | "churned" | "joined"; readonly x: number; readonly y: number; readonly w: number; readonly h: number }) {
  if (tone === "stayed") return <rect x={x} y={y} width={w} height={h} fill={INK} />;
  if (tone === "churned") {
    return (
      <g>
        <rect x={x + 0.6} y={y + 0.6} width={w - 1.2} height={h - 1.2} fill="none" stroke={INK} strokeWidth={1.2} />
        <line x1={x} y1={y + h} x2={x + w} y2={y} stroke={INK} strokeWidth={1.2} />
      </g>
    );
  }
  return (
    <rect x={x + 0.6} y={y + 0.6} width={w - 1.2} height={h - 1.2} fill="none" stroke={INK} strokeWidth={1.2} strokeDasharray="2.5 2" />
  );
}

function Widths({ reading, text, context }: FigureProps) {
  const motion = useFigureShapes("widths", reading, context);
  const { shapes, frame } = motion;
  const { width, height } = FIGURE_SIZE.widths;
  const lines = shapes.filter((shape) => shape.tone === "line");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="presentation">
      {shapes
        .filter((shape) => shape.tone === "column")
        .map((shape) => (
          <Bar key={shape.id} shape={shape} opacity={opacityOf(motion, shape.id)} />
        ))}
      <line x1={0} x2={width} y1={WIDTHS.baseline} y2={WIDTHS.baseline} stroke={INK} strokeWidth={1.5} />
      {lines.map((shape) => {
        const opacity = opacityOf(motion, shape.id);
        if (opacity <= 0) return null;
        const fade = opacity < 1 ? opacity : undefined;
        if (!shape.truth) {
          return <line key={shape.id} x1={shape.x} x2={shape.x + shape.w} y1={shape.y} y2={shape.y} stroke={ACCENT} strokeWidth={3} opacity={fade} />;
        }
        // The check: ink dashes on a paper casing, so it reads on solid columns too.
        return (
          <g key={shape.id} opacity={fade} data-truth="">
            <line x1={shape.x} x2={shape.x + shape.w} y1={shape.y} y2={shape.y} stroke={PAPER} strokeWidth={5} />
            <line x1={shape.x} x2={shape.x + shape.w} y1={shape.y} y2={shape.y} stroke={INK} strokeWidth={2} strokeDasharray={TRUTH_DASH} />
          </g>
        );
      })}
      <Labels labels={frame.labels} motion={motion} width={width} copy={text} spread />
    </svg>
  );
}

const KEY_TEXT: Readonly<Record<KeyItem, "keyYours" | "keyData" | "keyContext">> = {
  yours: "keyYours",
  truth: "keyData",
  context: "keyContext",
};

function KeySwatch({ item }: { readonly item: KeyItem }) {
  return (
    <svg viewBox="0 0 14 14" width={14} height={14} focusable="false">
      {item === "yours" ? (
        <rect x={0} y={0} width={14} height={14} fill={INK} />
      ) : item === "truth" ? (
        <rect x={1} y={1} width={12} height={12} fill="none" stroke={INK} strokeWidth={2} strokeDasharray="3 2" />
      ) : (
        <rect x={0.75} y={0.75} width={12.5} height={12.5} fill="none" stroke={INK} strokeWidth={1.5} />
      )}
    </svg>
  );
}

/**
 * The key above a figure: only the marks this figure draws. Solid is your
 * definition, dashed the database check, a thin outline a value for comparison;
 * in the base frame, the orange frame of your base when one is drawn.
 */
function Key({ figure, frame, text }: { readonly figure: FigureId; readonly frame: Frame; readonly text: DemoText }) {
  const copy = text.figure;
  if (figure === "baseFrame") {
    // Only when a base is drawn: an empty base (0 von 0) has no frame to explain.
    if (!frame.shapes.some((shape) => shape.tone === "frame" && shape.w > 0.5)) return null;
    return (
      <p className="dr3-key" data-key="">
        <span className="dr3-key-item">
          <svg viewBox="0 0 14 14" width={14} height={14} focusable="false">
            <rect x={1.25} y={1.25} width={11.5} height={11.5} fill="none" stroke={ACCENT} strokeWidth={2.5} />
          </svg>
          {copy.keyBase}
        </span>
      </p>
    );
  }
  const items = keyItems(frame);
  if (items.length === 0) return null;
  return (
    <p className="dr3-key" data-key={items.join(" ")}>
      {items.map((item) => (
        <span key={item} className="dr3-key-item">
          <KeySwatch item={item} />
          {copy[KEY_TEXT[item]]}
        </span>
      ))}
    </p>
  );
}

/**
 * The receipt figure. aria-hidden: every value and the why sentence are text
 * in the receipt.
 */
export function Figure({
  figure,
  reading,
  text,
  context = {},
}: {
  readonly figure: FigureId;
  readonly reading: Reading;
  readonly text: DemoText;
  readonly context?: FigureContext;
}) {
  const frame = layout(figure, reading, context);
  return (
    <div className="dr3-figure" aria-hidden="true" data-figure={figure} data-reading={reading}>
      <Key figure={figure} frame={frame} text={text} />
      {figure === "bathtub" ? (
        <Bathtub reading={reading} text={text} context={context} />
      ) : figure === "baseFrame" ? (
        <BaseFrame reading={reading} text={text} context={context} />
      ) : (
        <Widths reading={reading} text={text} context={context} />
      )}
    </div>
  );
}

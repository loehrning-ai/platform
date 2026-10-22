/**
 * Pure figure geometry of demo 03 (spec section 7). layout(figure, reading)
 * returns the final frame of a reading; seek(from, to, t) is the only motion,
 * a pure function of t. Three marks, one per key entry: solid is what the
 * learner's definition gives, dashed is the database check (drawn only when
 * the result differs from it), a thin outline is a value for comparison.
 * No React, no Date, no timers.
 */
import { ENDING_MRR, FOLDLINE, HEADCOUNT, NET_NEW_MRR, type DepartmentId, type Month } from "./data";
import type { DefinitionRequest, DefinitionRequestId, Reading } from "./model";

export type FigureId = DefinitionRequest["figure"];

export type Tone = "level" | "change" | "frame" | "line" | "stayed" | "churned" | "joined" | "column" | "guide" | "bracket";

export interface Shape {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly solid: boolean;
  readonly tone: Tone;
  /** Grows from h = 0 at its bottom ("up", default) or its top ("down"). */
  readonly grow?: "up" | "down";
  /** The database check: drawn dashed, never solid. */
  readonly truth?: boolean;
}

/** What a figure needs beyond its reading: whose database check, and the grain. */
export interface FigureContext {
  /** Without a request no database check is drawn. */
  readonly request?: DefinitionRequestId;
  /** Request 03: one value for all segments instead of one per segment. */
  readonly single?: boolean;
}

export type LabelText =
  | { readonly kind: "eur"; readonly amount: number }
  | { readonly kind: "pct"; readonly pct: number; readonly digits?: 1 | 2 }
  | {
      readonly kind: "fraction";
      readonly num: number;
      readonly den: number;
      readonly digits?: 1 | 2;
      /** Prefixed "alle Segmente:" when one value stands for all three. */
      readonly scope?: "allSegments";
    }
  | { readonly kind: "count"; readonly n: number }
  | { readonly kind: "department"; readonly id: DepartmentId }
  | { readonly kind: "month"; readonly month: Month }
  /** The fifth column's name: the quarter the learner's value stands for. */
  | { readonly kind: "quarter" }
  | { readonly kind: "lineLabel"; readonly pct: number; readonly digits?: 1 | 2 }
  | { readonly kind: "noCounts" }
  | { readonly kind: "times"; readonly factor: number };

export interface Label {
  readonly id: string;
  /** The shape the label follows. */
  readonly attach: string;
  readonly position:
    | "above"
    | "below"
    | "inside"
    | "right"
    | "leftAbove"
    | "rightAbove"
    | "insideTop"
    | "belowLow"
    | "legend"
    | "legendTruth"
    | "legendNote"
    | "rightBelow"
    | "towerLeft"
    | "towerLeftSub"
    /** The fifth column's name in the month row of the level panel. */
    | "levelName"
    /** The fifth column's name in the month row of the change panel. */
    | "changeName"
    /** A line of its own under the three segment rows of the base frame. */
    | "belowRows";
  readonly text: LabelText;
  /** Paper text on a solid shape. */
  readonly onSolid?: boolean;
  /** Extra vertical offset in figure units, set by layout() to clear a line or a neighbour. */
  readonly dy?: number;
}

export interface Frame {
  readonly shapes: readonly Shape[];
  readonly labels: readonly Label[];
  /** An optional middle keyframe: the moment plays from → via → shapes. */
  readonly via?: readonly Shape[];
  /** The viewBox height when it differs from FIGURE_SIZE (a line under the rows). */
  readonly height?: number;
}

export interface FigureSize {
  readonly width: number;
  readonly height: number;
}

export const FIGURE_SIZE: Readonly<Record<FigureId, FigureSize>> = {
  bathtub: { width: 326, height: 314 },
  baseFrame: { width: 326, height: 200 },
  widths: { width: 326, height: 238 },
};

export const ease = (t: number): number => 1 - (1 - t) ** 3;
const clamp01 = (t: number): number => (Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 1);

/** Share of a moment after which its new labels and marks fade in. */
export const FADE_FROM = 0.6;

/** Opacity of a label or mark that is new in a moment: 0 until FADE_FROM, then up to 1. */
export function fadeIn(t: number): number {
  const p = clamp01(t);
  return p >= 1 ? 1 : Math.max(0, (p - FADE_FROM) / (1 - FADE_FROM));
}

/** Opacity of a mark that leaves in a moment: gone by 1 − FADE_FROM, before the new ones arrive. */
export function fadeOut(t: number): number {
  const p = clamp01(t);
  return p >= 1 ? 0 : Math.max(0, 1 - p / (1 - FADE_FROM));
}

/**
 * Label metrics in figure units at phone width (13-unit type; above 640px the
 * type is smaller, so these bound every width). above: gap from a bar top to
 * the baseline of its label; line: baseline to baseline of stacked labels;
 * clear: the least room between a label box and a line; gap: between labels.
 */
export const LABEL = { size: 13, ascent: 10, descent: 3, above: 6, insideTop: 15, line: 15, clear: 3, gap: 8 } as const;
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * The frame at progress t from `from` to `to`. Shared ids move, new ids grow
 * from h = 0, removed ids shrink to h = 0 and are gone at t = 1.
 * seek(a, b, 0) equals a for shared ids; seek(a, b, 1) equals b.
 */
export function seek(from: readonly Shape[], to: readonly Shape[], t: number): Shape[] {
  const p = clamp01(t);
  if (p >= 1) return to.map((shape) => ({ ...shape }));
  const k = ease(p);
  const before = new Map(from.map((shape) => [shape.id, shape]));
  const after = new Set(to.map((shape) => shape.id));
  const moving = to.map((target) => {
    const start =
      before.get(target.id) ??
      (target.grow === "down" ? { ...target, h: 0 } : { ...target, y: target.y + target.h, h: 0 });
    return {
      ...target,
      x: lerp(start.x, target.x, k),
      y: lerp(start.y, target.y, k),
      w: lerp(start.w, target.w, k),
      h: lerp(start.h, target.h, k),
      solid: p === 0 ? start.solid : target.solid,
    };
  });
  const leaving = from
    .filter((shape) => !after.has(shape.id))
    .map((shape) => ({ ...shape, y: shape.grow === "down" ? shape.y : lerp(shape.y, shape.y + shape.h, k), h: lerp(shape.h, 0, k) }));
  return [...moving, ...leaving];
}

/** Share of a two-step moment spent on its first leg (from → via). */
export const VIA_SPLIT = 0.6;

/**
 * seek through an optional middle keyframe: from → via over the first
 * VIA_SPLIT of t, via → to over the rest. Still a pure function of t.
 */
export function seekPath(from: readonly Shape[], via: readonly Shape[] | undefined, to: readonly Shape[], t: number): Shape[] {
  if (!via) return seek(from, to, t);
  const p = clamp01(t);
  if (p >= 1) return to.map((shape) => ({ ...shape }));
  return p < VIA_SPLIT ? seek(from, via, p / VIA_SPLIT) : seek(via, to, (p - VIA_SPLIT) / (1 - VIA_SPLIT));
}

/* --------------------------------- Bathtub --------------------------------- */

export const BATHTUB = {
  levelBaseline: 160,
  levelScale: 104 / ENDING_MRR["2026-06"],
  /** The tower is clipped here; above it an arrow says "far higher". */
  clipTop: 24,
  /** The break band cut out of the tower (a double zigzag). */
  breakTop: 40,
  breakBottom: 50,
  frameTop: 34,
  changeBaseline: 262,
  changeScale: 40 / NET_NEW_MRR["2026-03"],
  /**
   * Baseline of the change panel's month row: under the deepest bar below
   * zero (April, −19.960) and the value label under it.
   */
  changeNames: 308,
  columns: { "2026-03": 6, "2026-04": 74, "2026-05": 142, "2026-06": 210 } as Readonly<Record<Month, number>>,
  columnWidth: 40,
  towerX: 268,
} as const;

const MONTHS: readonly Month[] = ["2026-03", "2026-04", "2026-05", "2026-06"];
const Q2: readonly Month[] = ["2026-04", "2026-05", "2026-06"];

function levelBar(month: Month, solid: boolean): Shape {
  const h = ENDING_MRR[month] * BATHTUB.levelScale;
  return {
    id: `L-${month}`,
    x: BATHTUB.columns[month],
    y: BATHTUB.levelBaseline - h,
    w: BATHTUB.columnWidth,
    h,
    solid,
    tone: "level",
  };
}

/** A change bar between two values on the change scale (from → to). */
function changeSpan(id: string, x: number, w: number, fromValue: number, toValue: number, solid: boolean): Shape {
  const top = Math.max(fromValue, toValue);
  const bottom = Math.min(fromValue, toValue);
  return {
    id,
    x,
    y: BATHTUB.changeBaseline - top * BATHTUB.changeScale,
    w,
    h: (top - bottom) * BATHTUB.changeScale,
    solid,
    tone: "change",
    grow: toValue < fromValue ? "down" : "up",
  };
}

function changeBar(month: Month, solid: boolean): Shape {
  return changeSpan(`C-${month}`, BATHTUB.columns[month], BATHTUB.columnWidth, 0, NET_NEW_MRR[month], solid);
}

const eurLabel = (attach: string, amount: number, position: Label["position"] = "above"): Label => ({
  id: `v-${attach}`,
  attach,
  position: amount < 0 && position === "above" ? "below" : position,
  text: { kind: "eur", amount },
});

/** Readings of request 02 whose result is 32.380 already: no dashed check needed. */
const NET_NEW_RIGHT = new Set<Reading>(["none", "changeSum", "endMinusStart"]);

function bathtub(reading: Reading, request: DefinitionRequestId | undefined): Frame {
  // Request 01's check is the three Q2 month-ends: the bars themselves, dashed
  // wherever the learner's definition does not give them.
  const levelTruth = request === "01" && reading !== "none";
  const solidLevels = new Set<Month>(
    reading === "levels" ? Q2 : reading === "lastLevel" ? ["2026-06"] : reading === "endMinusStart" ? ["2026-03", "2026-06"] : [],
  );
  const solidChanges = new Set<Month>(
    reading === "changes" ? Q2 : reading === "lastChange" ? ["2026-06"] : reading === "changeDiff" ? ["2026-03", "2026-06"] : [],
  );
  const labels: Label[] = [];
  let levels = MONTHS.map((month) => {
    const bar = levelBar(month, solidLevels.has(month));
    return levelTruth && !bar.solid && month !== "2026-03" ? { ...bar, truth: true } : bar;
  });
  let changes = MONTHS.map((month) => changeBar(month, solidChanges.has(month)));
  const extra: Shape[] = [];

  for (const month of solidLevels) labels.push(eurLabel(`L-${month}`, ENDING_MRR[month]));
  for (const month of solidChanges) labels.push(eurLabel(`C-${month}`, NET_NEW_MRR[month]));

  if (reading === "stackLevels") {
    // M1: the three Q2 levels lift onto each other into one tower.
    let bottom = BATHTUB.levelBaseline;
    const tower = new Map<string, Shape>();
    for (const month of Q2) {
      const h = ENDING_MRR[month] * BATHTUB.levelScale;
      tower.set(`L-${month}`, { ...levelBar(month, true), x: BATHTUB.towerX, y: bottom - h });
      bottom -= h;
    }
    levels = levels.map((shape) => tower.get(shape.id) ?? shape);
    // The months keep their outline where they were: in request 01 that is the database check.
    for (const month of Q2) extra.push({ ...levelBar(month, false), id: `GL-${month}`, ...(levelTruth ? { truth: true } : {}) });
    labels.push({ id: "v-tower", attach: "L-2026-06", position: "towerLeft", text: { kind: "eur", amount: FOLDLINE.levelsSummedQ2 } });
    labels.push({
      id: "v-ratio",
      attach: "L-2026-06",
      position: "towerLeftSub",
      text: { kind: "times", factor: FOLDLINE.levelsSummedQ2 / ENDING_MRR["2026-06"] },
    });
  }

  let via: Shape[] | undefined;
  if (reading === "changeSum") {
    // M2: the three changes travel into the fifth column, each starting where
    // the last ended (via), then net out into one solid 32.380 bar.
    let running = 0;
    const steps = new Map<string, Shape>();
    for (const month of Q2) {
      const next = running + NET_NEW_MRR[month];
      steps.set(`C-${month}`, changeSpan(`C-${month}`, BATHTUB.towerX, BATHTUB.columnWidth, running, next, true));
      running = next;
    }
    const sum = running;
    const merged = new Map<string, Shape>(
      Q2.map((month) => [`C-${month}`, changeSpan(`C-${month}`, BATHTUB.towerX, BATHTUB.columnWidth, 0, sum, true)]),
    );
    for (const month of Q2) extra.push({ ...changeBar(month, false), id: `GC-${month}` });
    via = [...levels, ...changes.map((shape) => steps.get(shape.id) ?? shape), ...extra];
    changes = changes.map((shape) => merged.get(shape.id) ?? shape);
    labels.push({ id: "v-sum", attach: "C-2026-06", position: "above", text: { kind: "eur", amount: sum } });
  }

  if (reading === "endMinusStart") {
    // M2: dashed guides carry the tops of March and June into the fifth
    // column; a bracket rises from the March line to the June line.
    const march = levelBar("2026-03", true);
    const june = levelBar("2026-06", true);
    const bracketX = BATHTUB.towerX + 8;
    const bracketW = 14;
    const guideEnd = bracketX + bracketW;
    extra.push({ id: "guide-2026-03", x: march.x + march.w, y: march.y, w: guideEnd - (march.x + march.w), h: 0, solid: false, tone: "guide" });
    extra.push({ id: "guide-2026-06", x: june.x + june.w, y: june.y, w: guideEnd - (june.x + june.w), h: 0, solid: false, tone: "guide" });
    extra.push({
      id: "bracket",
      x: bracketX,
      y: june.y,
      w: bracketW,
      h: march.y - june.y,
      solid: true,
      tone: "bracket",
    });
    labels.push({
      id: "v-bracket",
      attach: "bracket",
      // Under the bracket: the June label already holds the line above it.
      position: "rightBelow",
      text: { kind: "eur", amount: ENDING_MRR["2026-06"] - ENDING_MRR["2026-03"] },
    });
  }

  if (reading === "changeDiff") {
    const diff = NET_NEW_MRR["2026-06"] - NET_NEW_MRR["2026-03"];
    extra.push(changeSpan("diff", BATHTUB.towerX, BATHTUB.columnWidth, 0, diff, true));
    labels.push(eurLabel("diff", diff));
  }

  if (request === "02" && !NET_NEW_RIGHT.has(reading)) {
    // Request 02's check, 32.380, as a dashed bar in the fifth column.
    const truth: Shape = { ...changeSpan("truth", BATHTUB.towerX, BATHTUB.columnWidth, 0, FOLDLINE.netNewQ2, false), truth: true };
    extra.push(truth);
    let truthDy = 0;
    if (reading === "billingSum") {
      // The export's sum stands inside the dashed check, a little short of it.
      const billing = changeSpan("billing", BATHTUB.towerX + 8, BATHTUB.columnWidth - 16, 0, FOLDLINE.billingEventsQ2, true);
      extra.push(billing);
      // Two labels right-aligned, in the order of the bar tops: the check above, yours under it,
      // yours clear of the dashed top edge.
      const billingY = Math.min(billing.y - LABEL.above, truth.y - LABEL.clear - LABEL.descent - 0.5);
      labels.push({ id: "v-billing", attach: "billing", position: "rightAbove", text: { kind: "eur", amount: FOLDLINE.billingEventsQ2 }, dy: billingY - (billing.y - LABEL.above) });
      truthDy = billingY - LABEL.line - (truth.y - LABEL.above);
    }
    labels.push({ id: "v-truth", attach: "truth", position: "rightAbove", text: { kind: "eur", amount: FOLDLINE.netNewQ2 }, ...(truthDy ? { dy: truthDy } : {}) });
  }

  // The fifth column gets its name, Q2, in the month row of each panel it holds a mark in.
  if (reading === "stackLevels" || reading === "endMinusStart") {
    labels.push({ id: "q2-level", attach: reading === "stackLevels" ? "L-2026-06" : "bracket", position: "levelName", text: { kind: "quarter" } });
  }
  const changeQ2 =
    reading === "changeDiff" ? "diff" : reading === "changeSum" ? "C-2026-06" : request === "02" && !NET_NEW_RIGHT.has(reading) ? "truth" : undefined;
  if (changeQ2) labels.push({ id: "q2-change", attach: changeQ2, position: "changeName", text: { kind: "quarter" } });

  return { shapes: [...levels, ...changes, ...extra], labels, ...(via ? { via } : {}) };
}

/* -------------------------------- Base frame ------------------------------- */

export const BASE_FRAME = {
  rows: [52, 112, 172] as const,
  stripPitch: 6.7,
  stripWidth: 4.7,
  stripHeight: 20,
  x0: 2,
  /** Baseline of the line under the rows: clear of the last frame (rows[2] + 24). */
  belowRowsY: 214,
  /** Strip order per segment: churned, stayed, joined. */
  churned: FOLDLINE.churnedQ2,
  stayed: FOLDLINE.activeEndOfMarch - FOLDLINE.churnedQ2,
  joined: FOLDLINE.joinedQ2,
} as const;

function baseFrame(reading: Reading, single: boolean): Frame {
  const total = BASE_FRAME.churned + BASE_FRAME.stayed + BASE_FRAME.joined;
  const shapes: Shape[] = [];
  const labels: Label[] = [];
  const range =
    reading === "base:startOfQuarter"
      ? ([0, BASE_FRAME.churned + BASE_FRAME.stayed] as const)
      : reading === "base:startPlusJoiners"
        ? ([0, total] as const)
        : reading === "base:endOfQuarter"
          ? ([BASE_FRAME.churned, total] as const)
          : reading === "zeroBase"
            ? ([0, 0] as const)
            : undefined;

  FOLDLINE.segments.forEach((segment, row) => {
    const y = BASE_FRAME.rows[row];
    for (let index = 0; index < total; index += 1) {
      const tone: Tone =
        index < BASE_FRAME.churned ? "churned" : index < BASE_FRAME.churned + BASE_FRAME.stayed ? "stayed" : "joined";
      shapes.push({
        id: `${segment}-${index}`,
        x: BASE_FRAME.x0 + index * BASE_FRAME.stripPitch,
        y,
        w: BASE_FRAME.stripWidth,
        h: BASE_FRAME.stripHeight,
        solid: tone === "stayed",
        tone,
      });
    }
    if (range) {
      const [start, end] = range;
      const pad = 2.5;
      const x = BASE_FRAME.x0 + start * BASE_FRAME.stripPitch - pad;
      const w = end > start ? (end - start - 1) * BASE_FRAME.stripPitch + BASE_FRAME.stripWidth + 2 * pad : 0;
      shapes.push({ id: `frame-${segment}`, x, y: y - 4, w, h: BASE_FRAME.stripHeight + 8, solid: false, tone: "frame" });
      const den = end - start;
      if (!single) labels.push({
        id: `v-frame-${segment}`,
        attach: `frame-${segment}`,
        position: "rightAbove",
        text: {
          kind: "fraction",
          num: den === 0 ? 0 : FOLDLINE.churnedQ2,
          den,
          digits: reading === "base:startPlusJoiners" ? 2 : 1,
        },
      });
    }
  });
  if (range && single) {
    // One value for the whole company: the same frames, one pooled label on a
    // line of its own under the rows, so it never reads as Enterprise's value.
    const [start, end] = range;
    const segments = FOLDLINE.segments.length;
    const den = (end - start) * segments;
    labels.push({
      id: "v-frame-all",
      attach: `frame-${FOLDLINE.segments[0]}`,
      position: "belowRows",
      text: {
        kind: "fraction",
        num: den === 0 ? 0 : FOLDLINE.churnedQ2 * segments,
        den,
        digits: reading === "base:startPlusJoiners" ? 2 : 1,
        scope: "allSegments",
      },
    });
    return { shapes, labels, height: BASE_FRAME.belowRowsY + LABEL.descent + 4 };
  }
  return { shapes, labels };
}

/* --------------------------------- Widths ---------------------------------- */

export const WIDTHS = {
  baseline: 186,
  pctScale: 12.5,
  x0: 8,
  width: 310,
  gap: 3,
  /** Width of one digit at the figure's 13-unit type, with a little air. */
  digit: 8,
} as const;

function columns(
  ids: readonly string[],
  weights: readonly number[],
  heightsPct: readonly number[],
  solid: boolean,
): Shape[] {
  const available = WIDTHS.width - WIDTHS.gap * (ids.length - 1);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let x = WIDTHS.x0;
  return ids.map((id, index) => {
    const w = (available * weights[index]) / totalWeight;
    const h = heightsPct[index] * WIDTHS.pctScale;
    const shape: Shape = { id, x, y: WIDTHS.baseline - h, w, h, solid, tone: "column" };
    x += w + WIDTHS.gap;
    return shape;
  });
}

function rateLine(id: string, pct: number, truth: boolean): Shape {
  return {
    id,
    x: WIDTHS.x0,
    y: WIDTHS.baseline - pct * WIDTHS.pctScale,
    w: WIDTHS.width,
    h: 0,
    solid: !truth,
    tone: "line",
    grow: "down",
    ...(truth ? { truth: true } : {}),
  };
}

/** The database check of request 05: 19 of 200 = 9,5 %. */
const POOLED_PCT = (100 * HEADCOUNT.leaversQ2) / HEADCOUNT.startingHeadcount;

/** Vertical box of a label whose baseline is y. */
const boxOf = (y: number): readonly [number, number] => [y - LABEL.ascent, y + LABEL.descent];

/**
 * A value label above its column, unless a rate line runs through it: then
 * inside the column top (paper on solid) when it fits clear of every line,
 * else lifted above the line.
 */
function valueLabel(id: string, column: Shape, lines: readonly number[], text: LabelText): Label {
  const crossing = ([top, bottom]: readonly [number, number]) =>
    lines.filter((y) => y >= top - LABEL.clear && y <= bottom + LABEL.clear);
  const above = column.y - LABEL.above;
  const hit = crossing(boxOf(above));
  if (hit.length === 0) return { id, attach: column.id, position: "above", text };
  const inside = column.y + LABEL.insideTop;
  const fitsInside = inside + LABEL.descent + 2 <= column.y + column.h;
  if (fitsInside && crossing(boxOf(inside)).length === 0) {
    return { id, attach: column.id, position: "insideTop", text, onSolid: column.solid };
  }
  const lifted = Math.min(...hit) - LABEL.clear - LABEL.descent - 1;
  return { id, attach: column.id, position: "above", text, dy: lifted - above };
}

const EXPORT_MONTHS = ["2026-04", "2026-05", "2026-06"] as const;

function widths(reading: Reading, request: DefinitionRequestId | undefined): Frame {
  const labels: Label[] = [];
  const shapes: Shape[] = [];
  const lines: Shape[] = [];
  const yoursPct =
    reading === "monthlyAveraged"
      ? HEADCOUNT.monthlyRatesAveragedPct
      : reading === "pooled"
        ? POOLED_PCT
        : reading === "deptAveraged"
          ? HEADCOUNT.departmentRatesAveragedPct
          : reading === "averageBase"
            ? (100 * HEADCOUNT.leaversQ2) / HEADCOUNT.averageHeadcount
            : undefined;
  if (yoursPct !== undefined) {
    lines.push(rateLine("line", yoursPct, false));
    labels.push({
      id: "v-line",
      attach: "line",
      position: "legend",
      text: { kind: "lineLabel", pct: yoursPct, digits: reading === "averageBase" || reading === "monthlyAveraged" ? 2 : 1 },
    });
  }
  if (request === "05" && reading !== "none" && reading !== "pooled") {
    // The check, dashed, under your line: 9,5 %.
    lines.unshift(rateLine("truth", POOLED_PCT, true));
    labels.push({ id: "v-truth", attach: "truth", position: "legendTruth", text: { kind: "pct", pct: POOLED_PCT } });
  }
  const lineYs = lines.map((line) => line.y);

  if (reading === "monthlyAveraged" || reading === "exportNoCounts") {
    const ids = EXPORT_MONTHS.map((month) => `M-${month}`);
    const rates = EXPORT_MONTHS.map((month) => HEADCOUNT.monthlyExportRatesPct[month]);
    const monthColumns = columns(ids, [1, 1, 1], rates, reading === "monthlyAveraged");
    shapes.push(...monthColumns);
    EXPORT_MONTHS.forEach((month, index) => {
      labels.push(valueLabel(`v-M-${month}`, monthColumns[index], lineYs, { kind: "pct", pct: rates[index], digits: 2 }));
      labels.push({ id: `n-M-${month}`, attach: ids[index], position: "below", text: { kind: "month", month } });
    });
    if (reading === "exportNoCounts") {
      // No rate of yours: the note takes the band's second row, clear of every column.
      labels.push({ id: "v-none", attach: "M-2026-04", position: "legendNote", text: { kind: "noCounts" } });
    }
    return { shapes: [...shapes, ...lines], labels };
  }

  const departments = HEADCOUNT.departments;
  const ids = departments.map((department) => `D-${department.id}`);
  const equal = reading === "deptAveraged";
  const solid = reading === "pooled" || reading === "deptAveraged" || reading === "averageBase";
  const departmentColumns = columns(
    ids,
    departments.map((department) => (equal ? 1 : department.start)),
    departments.map((department) => department.ratePct),
    solid,
  );
  shapes.push(...departmentColumns);
  departments.forEach((department, index) => {
    // Every value and name keeps its row; the figure spreads a crowded row
    // sideways (resolveRows), so equal values stay at equal heights.
    labels.push(valueLabel(`v-${ids[index]}`, departmentColumns[index], lineYs, { kind: "pct", pct: department.ratePct }));
    labels.push({ id: `n-${ids[index]}`, attach: ids[index], position: "below", text: { kind: "department", id: department.id } });
    // The head count sits inside its column when it fits with 2 units either
    // side; otherwise it gets its own row under the names, in ink.
    const fits = String(department.start).length * WIDTHS.digit + 4 <= departmentColumns[index].w;
    labels.push(
      fits
        ? { id: `p-${ids[index]}`, attach: ids[index], position: "inside", text: { kind: "count", n: department.start }, onSolid: solid }
        : { id: `p-${ids[index]}`, attach: ids[index], position: "belowLow", text: { kind: "count", n: department.start } },
    );
  });
  return { shapes: [...shapes, ...lines], labels };
}

/* ------------------------------ Label placement ----------------------------- */

/** The top band of the widths figure: the rate lines' swatches and labels. */
export const LEGEND = { textX: 24, y: 14, swatch: 18, between: 16 } as const;
/** The tower's value and its "× June" line, left of the arrow, above the frame line. */
export const TOWER_LABEL = { y: 14 } as const;

export interface Placed {
  readonly x: number;
  readonly y: number;
  readonly anchor: "start" | "middle" | "end";
}

/**
 * Where a label's baseline sits. legendTruth returns the start of the band;
 * the figure moves it right of the legend before it (it knows the text).
 */
export function placeLabel(label: Label, shape: Shape, width: number): Placed {
  const center = shape.x + shape.w / 2;
  const edge = (x: number): Placed["anchor"] => (x < 34 ? "start" : x > width - 34 ? "end" : "middle");
  const horizontal = (): Pick<Placed, "x" | "anchor"> => {
    const anchor = edge(center);
    return { anchor, x: anchor === "start" ? Math.max(1, shape.x) : anchor === "end" ? Math.min(width - 1, shape.x + shape.w) : center };
  };
  const dy = label.dy ?? 0;
  switch (label.position) {
    case "above":
      return { ...horizontal(), y: shape.y - LABEL.above + dy };
    case "below":
      return { ...horizontal(), y: shape.y + shape.h + 15 + dy };
    case "belowLow":
      return { ...horizontal(), y: shape.y + shape.h + 15 + LABEL.line + dy };
    case "inside":
      // layout() only puts a label inside a column it fits, so centre it there.
      return { x: center, y: shape.y + shape.h - 7 + dy, anchor: "middle" };
    case "insideTop":
      return { x: center, y: shape.y + LABEL.insideTop + dy, anchor: "middle" };
    case "right":
      return { x: shape.x + shape.w + 6, y: shape.y + shape.h / 2 + 4.5 + dy, anchor: "start" };
    case "leftAbove":
      return { x: shape.x + 2, y: shape.y - 7 + dy, anchor: "start" };
    case "rightAbove":
      return { x: width - 1, y: Math.max(shape.y, BATHTUB.clipTop) - LABEL.above + dy, anchor: "end" };
    case "legend":
      return { x: LEGEND.textX, y: LEGEND.y, anchor: "start" };
    case "legendTruth":
      return { x: 1, y: LEGEND.y, anchor: "start" };
    case "legendNote":
      return { x: 1, y: LEGEND.y + LABEL.line + 2, anchor: "start" };
    case "rightBelow":
      return { x: width - 1, y: shape.y + shape.h + 15 + dy, anchor: "end" };
    case "towerLeft":
      return { x: shape.x - 8, y: TOWER_LABEL.y, anchor: "end" };
    case "towerLeftSub":
      return { x: shape.x - 8, y: TOWER_LABEL.y + LABEL.line, anchor: "end" };
    case "levelName":
      return { x: BATHTUB.towerX + BATHTUB.columnWidth / 2, y: BATHTUB.levelBaseline + 16, anchor: "middle" };
    case "changeName":
      return { x: BATHTUB.towerX + BATHTUB.columnWidth / 2, y: BATHTUB.changeNames, anchor: "middle" };
    case "belowRows":
      return { x: 1, y: BASE_FRAME.belowRowsY, anchor: "start" };
  }
}

/** Advance widths in em of the figure type (Figtree, tabular figures), rounded up. */
function charEm(char: string): number {
  if (/[0-9]/.test(char)) return 0.54;
  if (/[.,:;'’\s·]/.test(char)) return 0.28;
  if (char === "%") return 0.86;
  if (/[€−=×+]/.test(char)) return 0.58;
  if (/[mwMW]/.test(char)) return 0.86;
  if (/[A-ZÄÖÜ]/.test(char)) return 0.7;
  if (/[il]/.test(char)) return 0.28;
  return 0.56;
}

/** A conservative width of a label text at the given type size. */
export function textWidth(text: string, size: number = LABEL.size): number {
  return [...text].reduce((sum, char) => sum + charEm(char) * size, 0);
}

export interface RowEntry {
  readonly id: string;
  /** The label's centre and baseline as placed. */
  readonly center: number;
  readonly y: number;
  readonly width: number;
  /** The column it names: its centre must stay over it. */
  readonly columnX: number;
  readonly columnW: number;
}

/**
 * Spreads labels that share a row (boxes overlapping vertically) so each pair
 * keeps LABEL.gap between them. A label never leaves the figure and its
 * centre never leaves its column. Pure; returns the new centres.
 */
export function resolveRows(entries: readonly RowEntry[], figureWidth: number): Map<string, number> {
  const result = new Map<string, number>();
  const sorted = [...entries].sort((a, b) => a.y - b.y);
  const rows: RowEntry[][] = [];
  for (const entry of sorted) {
    const row = rows[rows.length - 1];
    if (row && entry.y - row[0].y < LABEL.ascent + LABEL.descent) row.push(entry);
    else rows.push([entry]);
  }
  for (const row of rows) {
    const items = [...row].sort((a, b) => a.center - b.center);
    const bounds = items.map((item) => {
      const lo = Math.max(item.columnX, 1 + item.width / 2);
      const hi = Math.min(item.columnX + item.columnW, figureWidth - 1 - item.width / 2);
      return lo <= hi ? ([lo, hi] as const) : ([(lo + hi) / 2, (lo + hi) / 2] as const);
    });
    const centers = items.map((item, index) => Math.min(bounds[index][1], Math.max(bounds[index][0], item.center)));
    for (let pass = 0; pass < 4; pass += 1) {
      for (let index = 1; index < items.length; index += 1) {
        const need = centers[index - 1] + items[index - 1].width / 2 + LABEL.gap + items[index].width / 2;
        if (centers[index] < need) centers[index] = Math.min(bounds[index][1], need);
      }
      for (let index = items.length - 2; index >= 0; index -= 1) {
        const need = centers[index + 1] - items[index + 1].width / 2 - LABEL.gap - items[index].width / 2;
        if (centers[index] > need) centers[index] = Math.max(bounds[index][0], need);
      }
    }
    items.forEach((item, index) => result.set(item.id, centers[index]));
  }
  return result;
}

/* ----------------------------------- Key ------------------------------------ */

export type KeyItem = "yours" | "truth" | "context";

const MARK_TONES = new Set<Tone>(["level", "change", "column", "line", "bracket"]);

/** The key entries a frame needs, in a fixed order: only marks it draws. */
export function keyItems(frame: Frame): KeyItem[] {
  const marks = frame.shapes.filter((shape) => MARK_TONES.has(shape.tone));
  const items: KeyItem[] = [];
  if (marks.some((shape) => shape.solid && !shape.truth)) items.push("yours");
  if (marks.some((shape) => shape.truth)) items.push("truth");
  if (marks.some((shape) => !shape.solid && !shape.truth && shape.tone !== "line" && shape.tone !== "bracket")) items.push("context");
  return items;
}

/* ---------------------------------- API ------------------------------------ */

export function layout(figure: FigureId, reading: Reading, context: FigureContext = {}): Frame {
  switch (figure) {
    case "bathtub":
      return bathtub(reading, context.request);
    case "baseFrame":
      return baseFrame(reading, context.single === true);
    case "widths":
      return widths(reading, context.request);
  }
}

export interface Moment {
  readonly id: "M1" | "M2" | "M3" | "M4";
  readonly duration: number;
}

const AVERAGING = new Set<Reading>(["pooled", "deptAveraged"]);

/** The four listed motion moments; any other change of reading cuts to the final frame. */
export function momentFor(from: Reading, to: Reading): Moment | undefined {
  if (from === to) return undefined;
  if (to === "stackLevels") return { id: "M1", duration: 420 };
  if (to === "changeSum") return { id: "M2", duration: 760 };
  if (to === "endMinusStart") return { id: "M2", duration: 420 };
  if (to.startsWith("base:") || to === "zeroBase") return { id: "M3", duration: 360 };
  if (AVERAGING.has(from) && AVERAGING.has(to)) return { id: "M4", duration: 360 };
  return undefined;
}

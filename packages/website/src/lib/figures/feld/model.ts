/**
 * Das Feld, compile step. A FieldData (classes and scenes of counts) becomes
 * a FeldModel: for every scene the target position, size, class and fill of
 * every square, computed for one viewport. Pure and deterministic; the model
 * is rebuilt on resize, never stored in the JSON ("layouts computed, not
 * stored").
 *
 * Squares are slots 0 to N - 1 of a scene, in layout order: bins left to
 * right, inside a bin the segments bottom up, inside a segment column by
 * column. Slot k of one scene and slot k of the next are the same square,
 * so a change inside one population moves squares instead of replacing them.
 * Two scenes of a joint table keep each square's class; otherwise the
 * squares reset to ink while they move.
 */

import { formatDecimal } from "../format.ts";
import { fitEllipsis, labelLines, textWidth } from "../svg.ts";
import { FIELD_MAX_SQUARES } from "../limits.ts";
import { clamp } from "../math.ts";
import { allocateSquares, unitLine } from "../units.ts";
import type { FieldBin, FieldClass, FieldData, FieldNumeral, FieldScene } from "../types.ts";

/** Most squares any scene may hold; the frame buffer is sized for it. */
export const FELD_CAPACITY = FIELD_MAX_SQUARES;
/** Floats per square in a frame buffer. */
export const STRIDE = 8;
/** Offsets inside one square's record. */
export const F = { x: 0, y: 1, size: 2, cls: 3, fill: 4, gx: 5, gy: 6, ga: 7 } as const;
/** Smallest side of a square in viewport units. */
export const MIN_SIDE = 8;
/** Class index of the neutral ink every square shows while it is being re-sorted. */
export const INK_CLASS = 0;

export interface FeldViewport {
  readonly width: number;
  readonly height: number;
  /** Locale of the strings the engine writes itself ("80 von 1.000"); default German. */
  readonly lang?: "de" | "en";
}

export interface SceneLabel {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly role: "label" | "value";
  readonly anchor: "start" | "middle" | "end";
  /** Class the label belongs to (index into the model's classes), or -1. */
  readonly cls: number;
}

export interface SceneModel {
  readonly id: string;
  readonly population: string;
  readonly squares: number;
  readonly base: number;
  readonly side: number;
  readonly x: Float32Array;
  readonly y: Float32Array;
  /** Class index per slot (0 is the neutral ink), -1 for slots beyond `squares`. */
  readonly cls: Int16Array;
  readonly fill: Float32Array;
  /** Squares per class (whole squares plus partial ones), by class index. */
  readonly perClass: ReadonlyArray<number>;
  /** Things of the base per class, by class index (what the legend prints). */
  readonly counts: ReadonlyArray<number>;
  readonly unit: string;
  readonly labels: ReadonlyArray<SceneLabel>;
  readonly numeral: FieldNumeral | undefined;
  readonly claim: string | undefined;
  readonly joint: boolean;
  readonly weight: number;
  /** Class indices that appear in this scene, in the order of the direct labels. */
  readonly legend: ReadonlyArray<number>;
  /** True when the squares are at least MIN_SIDE (8) units: the phone bar of DIRECTION section 2. */
  readonly fits: boolean;
}

export interface FeldModel {
  readonly viewport: FeldViewport;
  readonly classes: ReadonlyArray<FieldClass>;
  readonly classIndex: ReadonlyMap<string, number>;
  readonly scenes: ReadonlyArray<SceneModel>;
  /** Progress at which scene k starts; one more entry marks the end (1). */
  readonly starts: ReadonlyArray<number>;
  readonly capacity: number;
  readonly firstEnter: "pour" | "none";
}

interface Slot {
  readonly cls: number;
  readonly fill: number;
  readonly bin: number;
}

/** Slots of a scene in layout order, with class and partial fill. */
function slotsOf(scene: FieldScene, classIndex: ReadonlyMap<string, number>): { slots: Slot[]; binSizes: number[] } {
  const flat = scene.bins.flatMap((bin, b) => bin.segments.map((seg) => ({ b, seg })));
  const alloc = allocateSquares(
    flat.map((f) => ({ count: f.seg.count, partial: f.seg.partial })),
    scene.base,
    scene.squares,
  );
  const slots: Slot[] = [];
  const binSizes = scene.bins.map(() => 0);
  flat.forEach((f, i) => {
    const cls = classIndex.get(f.seg.cls);
    const index = cls === undefined ? INK_CLASS : cls;
    for (let k = 0; k < (alloc.whole[i] ?? 0); k += 1) {
      slots.push({ cls: index, fill: 1, bin: f.b });
      binSizes[f.b] = (binSizes[f.b] ?? 0) + 1;
    }
    if ((alloc.frac[i] ?? 0) > 0) {
      slots.push({ cls: index, fill: alloc.frac[i] ?? 0, bin: f.b });
      binSizes[f.b] = (binSizes[f.b] ?? 0) + 1;
    }
  });
  return { slots, binSizes };
}

interface Placed {
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly side: number;
  readonly labels: SceneLabel[];
  /** False when the box was too small for squares of MIN_SIDE and they were drawn smaller. */
  readonly fits: boolean;
  /** Left edge and bottom of a wall (a big grid), where its count label goes. */
  readonly wall?: { readonly x0: number; readonly bottom: number };
}

const gapFor = (cell: number): number => (cell >= 20 ? 3 : cell >= 14 ? 2 : 1.2);

/** Largest cell of a small population (at most 150 squares): big enough to give the stage mass, never 55 px blocks. */
const SMALL_CELL_MAX = 26;
const SMALL_N = 150;

/** Height kept under a wall for its count label ("80 von 1.000"). */
const WALL_LABEL_H = 22;

function layoutGrid(n: number, view: FeldViewport, cols?: number, reserve = 0): Placed {
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const small = n <= SMALL_N;
  // A margin on both sides: 16 units for a small group, 8 for the wall.
  const inset = small ? 16 : 8;
  const availW = Math.max(1, view.width - inset * 2);
  // A wall keeps 8 units of clear paper above it, so the claim never touches its first row.
  const availH = Math.max(1, view.height - (small ? inset : 8) * 2 + (small ? 0 : 8) - reserve);
  const maxCell = small ? SMALL_CELL_MAX : 40;
  let best: { cell: number; cols: number } | null = null;
  if (cols) {
    best = { cell: Math.min(availW / cols, availH / Math.ceil(n / cols), maxCell), cols };
    // A column count that would draw squares below the 8 unit floor (a 40 wide wall on a phone) is only a
    // hint: take the column count that gives the largest cell instead, so the wall stays squares, not a mesh.
    if (!small && best.cell - gapFor(best.cell) < MIN_SIDE) {
      let top = best;
      for (let c = 6; c <= 80; c += 1) {
        const cell = Math.min(availW / c, availH / Math.ceil(n / c), maxCell);
        if (cell > top.cell + 1e-6) top = { cell, cols: c };
      }
      best = top;
    }
  } else {
    for (let cell = maxCell; cell >= 4; cell -= 0.25) {
      const c = Math.floor(availW / cell);
      if (c >= 1 && Math.ceil(n / c) * cell <= availH) {
        best = { cell, cols: c };
        break;
      }
    }
  }
  const pick = best ?? { cell: 4, cols: Math.max(1, Math.floor(availW / 4)) };
  const { cell, cols: c } = pick;
  const g = gapFor(cell);
  const side = Math.max(3, cell - g);
  const rows = Math.ceil(n / c);
  // A small group sits at the left, centred in the free height; the wall is centred in its margins.
  const x0 = small ? inset : Math.max(inset, (view.width - c * cell) / 2);
  const y0 = small ? Math.max(inset, (view.height - rows * cell) / 2) : 8 + Math.max(0, (availH - rows * cell) / 2);
  for (let i = 0; i < n; i += 1) {
    x[i] = x0 + (i % c) * cell + g / 2;
    y[i] = y0 + Math.floor(i / c) * cell + g / 2;
  }
  return { x, y, side, labels: [], fits: side >= MIN_SIDE - 1, wall: { x0, bottom: y0 + rows * cell } };
}

function layoutBins(
  scene: FieldScene,
  binSizes: readonly number[],
  slots: readonly Slot[],
  classes: ReadonlyArray<FieldClass>,
  view: FeldViewport,
): Placed {
  const n = slots.length;
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const bins = scene.bins;
  const tiled = bins.some((b) => b.cell !== undefined);
  const perRow = tiled
    ? Math.max(...bins.map((b) => (b.cell?.[0] ?? 0) + 1))
    : Math.max(1, scene.perRow ?? bins.length);
  const rowOf = (b: FieldBin, i: number): number => (tiled ? (b.cell?.[1] ?? 0) : Math.floor(i / perRow));
  const colOf = (b: FieldBin, i: number): number => (tiled ? (b.cell?.[0] ?? 0) : i % perRow);
  const rowCount = Math.max(...bins.map((b, i) => rowOf(b, i))) + 1;
  const hasLabels = bins.some((b) => b.label);
  const gapX = scene.adjacent ? 0 : Math.max(6, view.width * 0.03);
  const binW = (view.width - gapX * (perRow - 1)) / perRow;
  // Largest cell that lets every bin of a row stack inside its column and the rows fit the height.
  // Two label lines first; when the squares would drop below 8 units, one line; then smaller squares.
  const names = bins.map((b) => (b.label ? labelLines(b.label, binW - 2, 13, 600).slice(0, 2) : []));
  const nameLines = Math.max(1, ...names.map((q) => q.length));
  const full = 16 * nameLines + 22;
  const attempts: ReadonlyArray<readonly [number, number]> = hasLabels
    ? [[full, MIN_SIDE], [22, MIN_SIDE], [22, 4]]
    : [[0, MIN_SIDE], [0, 4]];
  let labelH = attempts[0]?.[0] ?? 0;
  let cell = MIN_SIDE;
  let found = false;
  for (const [lh, floor] of attempts) {
    const availH = (view.height - lh * rowCount - (rowCount - 1) * 10) / rowCount;
    for (let c = 36; c >= floor; c -= 0.25) {
      const bc = Math.max(1, Math.floor(binW / c));
      const need = Math.max(...binSizes.map((q) => Math.ceil(q / bc)), 1);
      if (need * c <= availH + 0.01) {
        cell = c;
        labelH = lh;
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (!found) {
    cell = 4;
    labelH = attempts[attempts.length - 1]?.[0] ?? 0;
  }
  const bcols = Math.max(1, Math.floor(binW / cell));
  const g = gapFor(cell);
  const side = Math.max(MIN_SIDE - 1, cell - g);
  const rowsTall: number[] = Array.from({ length: rowCount }, () => 1);
  bins.forEach((b, i) => {
    const r = rowOf(b, i);
    rowsTall[r] = Math.max(rowsTall[r] ?? 1, Math.ceil((binSizes[i] ?? 0) / bcols));
  });
  const rowH = rowsTall.map((t) => t * cell);
  const totalH = rowH.reduce((s, h) => s + h, 0) + labelH * rowCount + (rowCount - 1) * 10;
  let y0 = Math.max(0, view.height - totalH);
  const rowBase: number[] = [];
  for (let r = 0; r < rowCount; r += 1) {
    rowBase.push(y0 + (rowH[r] ?? 0));
    y0 += (rowH[r] ?? 0) + labelH + 10;
  }
  const used = new Array<number>(bins.length).fill(0);
  const labels: SceneLabel[] = [];
  slots.forEach((slot, i) => {
    const b = slot.bin;
    const bin = bins[b] as FieldBin;
    const k = used[b] ?? 0;
    used[b] = k + 1;
    const level = Math.floor(k / bcols);
    const col = k % bcols;
    const binX = colOf(bin, b) * (binW + gapX) + (binW - bcols * cell) / 2;
    x[i] = binX + col * cell + g / 2;
    y[i] = (rowBase[rowOf(bin, b)] ?? 0) - (level + 1) * cell + g / 2;
  });
  bins.forEach((bin, b) => {
    if (!bin.label) return;
    const cx = colOf(bin, b) * (binW + gapX) + binW / 2;
    const base = rowBase[rowOf(bin, b)] ?? 0;
    const total = bin.segments.reduce((s, q) => s + q.count, 0);
    const top = bin.segments.reduce((best, q) => (q.count > best.count ? q : best), bin.segments[0] ?? { cls: "", count: 0 });
    const clsName = classes.findIndex((c) => c.id === top.cls);
    const lines = names[b] ?? [];
    const widest = Math.max(0, ...lines.map((l) => textWidth(l, 13, 600)));
    const half = Math.max(widest, textWidth(formatDecimal(total, 0), 14, 700)) / 2;
    const lx = Math.min(Math.max(cx, half + 1), view.width - half - 1);
    if (labelH >= full) {
      lines.forEach((text, q) => labels.push({ x: lx, y: base + 18 + 15 * q, text, role: "label", anchor: "middle", cls: clsName }));
      labels.push({ x: lx, y: base + 18 + 15 * (lines.length - 1) + 17, text: formatDecimal(total, 0), role: "value", anchor: "middle", cls: clsName });
    } else {
      labels.push({ x: lx, y: base + 16, text: fitEllipsis(bin.label ?? "", binW, 13, 600), role: "label", anchor: "middle", cls: clsName });
    }
  });
  return { x, y, side, labels, fits: side >= MIN_SIDE - 1 };
}

/** The model of a field for one viewport. */
export function compileFeld(data: FieldData, view: FeldViewport): FeldModel {
  const classes: FieldClass[] = [{ id: "__ink", label: "", tone: "ink" }, ...data.classes];
  const classIndex = new Map(classes.map((c, i) => [c.id, i]));
  const scenes: SceneModel[] = data.scenes.map((scene) => {
    const { slots, binSizes } = slotsOf(scene, classIndex);
    const n = slots.length;
    // A wall with an accent run keeps a strip under it for the run's count.
    const accentIdx = classes.findIndex((c, i) => i > 0 && c.tone === "accent" && slots.some((q) => q.cls === i));
    const wallLabel = scene.layout === "grid" && n > SMALL_N && accentIdx >= 0;
    const placed =
      scene.layout === "grid"
        ? layoutGrid(n, view, scene.cols, wallLabel ? WALL_LABEL_H : 0)
        : layoutBins(scene, binSizes, slots, classes, view);
    if (wallLabel && placed.wall) {
      const squares = slots.reduce((sum, q) => (q.cls === accentIdx ? sum + q.fill : sum), 0);
      const shown = squares >= 10 ? Math.round(squares) : Math.round(squares * 10) / 10;
      const lang = view.lang ?? "de";
      placed.labels.push({
        x: placed.wall.x0,
        y: placed.wall.bottom + 17,
        text: `${formatDecimal(shown, shown % 1 === 0 ? 0 : 1, false, lang)} ${lang === "en" ? "of" : "von"} ${formatDecimal(n, 0, false, lang)}`,
        role: "value",
        anchor: "start",
        cls: accentIdx,
      });
    }
    const cls = new Int16Array(FELD_CAPACITY).fill(-1);
    const fill = new Float32Array(FELD_CAPACITY);
    const x = new Float32Array(FELD_CAPACITY);
    const y = new Float32Array(FELD_CAPACITY);
    const perClass = classes.map(() => 0);
    const counts = classes.map(() => 0);
    for (const bin of scene.bins) for (const seg of bin.segments) {
      const ci = classIndex.get(seg.cls);
      if (ci !== undefined) counts[ci] = (counts[ci] ?? 0) + seg.count;
    }
    slots.forEach((s, i) => {
      cls[i] = s.cls;
      fill[i] = s.fill;
      x[i] = placed.x[i] ?? 0;
      y[i] = placed.y[i] ?? 0;
      perClass[s.cls] = (perClass[s.cls] ?? 0) + (s.fill >= 1 ? 1 : s.fill);
    });
    const legend = (scene.labelClasses ?? [])
      .map((id) => classIndex.get(id))
      .filter((i): i is number => i !== undefined);
    return {
      id: scene.id,
      population: scene.population,
      squares: n,
      base: scene.base,
      side: placed.side,
      x,
      y,
      cls,
      fill,
      perClass,
      counts,
      unit: unitLine(scene.base, n, scene.unit),
      labels: placed.labels,
      numeral: scene.numeral,
      claim: scene.claim,
      joint: scene.joint === true,
      weight: Math.max(0.1, scene.weight ?? 1),
      legend,
      fits: placed.fits,
    };
  });
  const total = scenes.reduce((s, q) => s + q.weight, 0);
  const starts: number[] = [];
  let acc = 0;
  for (const s of scenes) {
    starts.push(acc / total);
    acc += s.weight;
  }
  starts.push(1);
  return {
    viewport: view,
    classes,
    classIndex,
    scenes,
    starts,
    capacity: Math.min(FELD_CAPACITY, Math.max(...scenes.map((s) => s.squares), 1)),
    firstEnter: data.scenes[0]?.enter ?? "pour",
  };
}

/** Index of the scene that owns a progress, and how far into it (0 to 1). */
export function sceneAt(model: FeldModel, progress: number): { index: number; local: number } {
  const p = clamp(progress);
  const last = model.scenes.length - 1;
  if (p >= 1) return { index: last, local: 1 };
  let index = 0;
  for (let i = 0; i <= last; i += 1) {
    if (p >= (model.starts[i] ?? 0)) index = i;
  }
  const a = model.starts[index] ?? 0;
  const b = model.starts[index + 1] ?? 1;
  return { index, local: b > a ? (p - a) / (b - a) : 1 };
}

/** Progress at which scene k is fully formed (held): the end of its transition. */
export function sceneSettled(model: FeldModel, k: number, transition = TRANSITION): number {
  const a = model.starts[k] ?? 0;
  const b = model.starts[k + 1] ?? 1;
  return a + (b - a) * transition;
}

/** Share of a scene's span that is movement; the rest is a hold. */
export const TRANSITION = 0.55;

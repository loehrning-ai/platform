/**
 * The two month trays of scenes 1 to 3 and free play, as pure geometry in
 * the stage's SVG units (360 wide). With the Nenner on, a tray is as wide as
 * the month's units shipped, so the fill height reads as the rate; off, both
 * trays are equally wide and the fill reads as the absolute count. One pebble
 * per CRAFT record: equal squares for Meldungen, area by qty_affected for
 * Stück (the same scale for affected and scrapped, so scrap pebbles keep
 * their size and rework pebbles become ghosts stacked above the fill).
 */
import { CRAFT_NCR, type NcrRow } from "./data";
import { numerator, unitsShipped, type Counter, type Denom, type Month } from "./definitions";
import { atLeast, squarify, type Rect } from "./treemap";

export const TRAY_VIEW = { w: 360, h: 150 } as const;
const PAD = 8;
const GAP = 14;
const TOP = 34;
const HEIGHT = 112;
const INSET = 4;
/** The highest fill reaches this share of the tray. */
const FILL_MAX = 0.8;
/** The smallest visible side of a pebble, so every record can be tapped. */
export const MIN_SIDE = 6;

export interface Pebble {
  readonly row: NcrRow;
  readonly month: Month;
  readonly rect: Rect;
  /** Scrapped counter: a reworked record, drawn as a faint outline above the fill. */
  readonly ghost: boolean;
}

export interface TrayLayout {
  readonly trays: Readonly<Record<Month, Rect>>;
  readonly fill: Readonly<Record<Month, number>>;
  /** Vertical lines every 1.000 units shipped, Nenner on only. */
  readonly grid: Readonly<Record<Month, readonly number[]>>;
  /** In CRAFT_NCR order, so a morph pairs each record with itself. */
  readonly pebbles: readonly Pebble[];
}

const MONTHS: readonly Month[] = ["aug", "sep"];
const monthOf = (row: NcrRow): Month => (row.date < "2023-09-01" ? "aug" : "sep");

export function trayRects(denom: Denom): Readonly<Record<Month, Rect>> {
  // The inner widths (inside the rim) are in proportion, so the fill height is the rate.
  const inner = TRAY_VIEW.w - PAD * 2 - GAP - INSET * 4;
  const share = denom === "per1000" ? unitsShipped("aug") / (unitsShipped("aug") + unitsShipped("sep")) : 0.5;
  const total = TRAY_VIEW.w - PAD * 2 - GAP;
  const aug = inner * share + INSET * 2;
  return {
    aug: { x: PAD, y: TOP, w: aug, h: HEIGHT },
    sep: { x: PAD + aug + GAP, y: TOP, w: total - aug, h: HEIGHT },
  };
}

/** Area per unit of the numerator, the same in every layout of a counter family. */
function scaleFor(family: "records" | "units"): number {
  const inner = HEIGHT - INSET * 2;
  let worst = 0;
  for (const denom of ["per1000", "none"] as const) {
    const trays = trayRects(denom);
    for (const month of MONTHS) {
      const amount = numerator(family === "records" ? "records" : "affected", month);
      worst = Math.max(worst, amount / (trays[month].w - INSET * 2));
    }
  }
  return (FILL_MAX * inner) / worst;
}

const UNIT_SCALE = scaleFor("units");
const RECORD_SCALE = scaleFor("records");

function shrink(rect: Rect, by: number): Rect {
  return {
    x: rect.x + by,
    y: rect.y + by,
    w: Math.max(0.5, rect.w - by * 2),
    h: Math.max(0.5, rect.h - by * 2),
  };
}

function squares(rows: readonly NcrRow[], tray: Rect): { rects: readonly Rect[]; height: number } {
  const side = Math.sqrt(RECORD_SCALE);
  const width = tray.w - INSET * 2;
  const cols = Math.max(1, Math.floor(width / side));
  const used = cols * side;
  const left = tray.x + INSET + (width - used) / 2;
  const bottom = tray.y + tray.h - INSET;
  const rects = rows.map((_, index) => {
    const col = index % cols;
    const line = Math.floor(index / cols);
    return shrink({ x: left + col * side, y: bottom - (line + 1) * side, w: side, h: side }, 1);
  });
  return { rects, height: Math.ceil(rows.length / cols) * side };
}

function block(rows: readonly NcrRow[], tray: Rect, bottom: number): { rects: readonly Rect[]; height: number } {
  const width = tray.w - INSET * 2;
  const area = rows.reduce((sum, row) => sum + row.qty, 0) * UNIT_SCALE;
  const height = area / width;
  const rects = squarify(
    rows.map((row) => row.qty),
    { x: tray.x + INSET, y: bottom - height, w: width, h: height },
  ).map((rect) => atLeast(shrink(rect, 0.75), MIN_SIDE));
  return { rects, height };
}

/** The layout for a counter and a denominator. */
export function trayLayout(counter: Counter, denom: Denom): TrayLayout {
  const trays = trayRects(denom);
  const placed = new Map<NcrRow, { rect: Rect; ghost: boolean }>();
  const fill = { aug: 0, sep: 0 };
  for (const month of MONTHS) {
    const tray = trays[month];
    const rows = CRAFT_NCR.filter((row) => monthOf(row) === month);
    const bottom = tray.y + tray.h - INSET;
    if (counter === "records") {
      const { rects, height } = squares(rows, tray);
      rows.forEach((row, index) => placed.set(row, { rect: rects[index] as Rect, ghost: false }));
      fill[month] = height;
    } else if (counter === "affected") {
      const { rects, height } = block(rows, tray, bottom);
      rows.forEach((row, index) => placed.set(row, { rect: rects[index] as Rect, ghost: false }));
      fill[month] = height;
    } else {
      const scrap = rows.filter((row) => row.scrap);
      const rework = rows.filter((row) => !row.scrap);
      const lower = block(scrap, tray, bottom);
      const upper = block(rework, tray, bottom - lower.height);
      scrap.forEach((row, index) => placed.set(row, { rect: lower.rects[index] as Rect, ghost: false }));
      rework.forEach((row, index) => placed.set(row, { rect: upper.rects[index] as Rect, ghost: true }));
      fill[month] = lower.height;
    }
  }
  const grid = {
    aug: denom === "per1000" ? gridLines(trays.aug, unitsShipped("aug")) : [],
    sep: denom === "per1000" ? gridLines(trays.sep, unitsShipped("sep")) : [],
  };
  return {
    trays,
    fill,
    grid,
    pebbles: CRAFT_NCR.map((row) => {
      const spot = placed.get(row) as { rect: Rect; ghost: boolean };
      return { row, month: monthOf(row), rect: spot.rect, ghost: spot.ghost };
    }),
  };
}

function gridLines(tray: Rect, units: number): readonly number[] {
  const lines: number[] = [];
  for (let block1000 = 1000; block1000 < units; block1000 += 1000) lines.push(tray.x + (tray.w * block1000) / units);
  return lines;
}

/** The pebble nearest to a point within `reach` units, or null (taps resolve to it). */
export function nearestPebble(pebbles: readonly Pebble[], x: number, y: number, reach = 22): Pebble | null {
  let best: Pebble | null = null;
  let distance = reach;
  for (const pebble of pebbles) {
    const { rect } = pebble;
    const dx = Math.max(rect.x - x, 0, x - (rect.x + rect.w));
    const dy = Math.max(rect.y - y, 0, y - (rect.y + rect.h));
    const d = Math.hypot(dx, dy);
    if (d < distance || (d === 0 && best === null)) {
      best = pebble;
      distance = d;
    }
  }
  return best;
}

/** The Antwortskala: change from August to September, from −50 % to +70 %, in the scale's SVG units. */
export const SCALE_VIEW = {
  w: 360,
  h: 74,
  left: 18,
  right: 342,
  axis: 34,
} as const;
export const SCALE_DOMAIN = { min: -0.5, max: 0.7 } as const;

export function scaleX(change: number): number {
  const share = (Math.min(SCALE_DOMAIN.max, Math.max(SCALE_DOMAIN.min, change)) - SCALE_DOMAIN.min) / (SCALE_DOMAIN.max - SCALE_DOMAIN.min);
  return SCALE_VIEW.left + share * (SCALE_VIEW.right - SCALE_VIEW.left);
}

export function scaleChange(x: number): number {
  const share = (x - SCALE_VIEW.left) / (SCALE_VIEW.right - SCALE_VIEW.left);
  return SCALE_DOMAIN.min + Math.min(1, Math.max(0, share)) * (SCALE_DOMAIN.max - SCALE_DOMAIN.min);
}

/** Of several readings' changes, the index nearest to a point on the scale. */
export function nearestChange(changes: readonly number[], x: number): number {
  let best = 0;
  for (let index = 1; index < changes.length; index += 1) {
    if (Math.abs(scaleX(changes[index] as number) - x) < Math.abs(scaleX(changes[best] as number) - x)) best = index;
  }
  return best;
}

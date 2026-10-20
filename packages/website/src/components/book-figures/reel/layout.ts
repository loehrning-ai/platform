/**
 * Layout of the reel for the two film formats. The field is designed once in
 * a virtual region of VW x VH units and mapped into the stage by `field`;
 * text sizes are set per format. Everything is computed from these constants,
 * never measured, so a frame is the same on every machine.
 */

import { PALETTES, mixHex } from "../../../lib/figures/palette.ts";

export type ReelFormat = "tall" | "wide";

/** Virtual field region the scenes are drawn in. */
export const VW = 540;
export const VH = 292;
export const GRID_COLS = 44;
export const GRID_ROWS = 23;
/** Pitch and side of a square of the 1.000 grid. */
export const GRID_P = 12.27;
export const GRID_S = 10.1;

const P = PALETTES.print;

/** Film colours: the brand tokens plus ink tints for the ink world. */
export const COLORS = {
  paper: P.paper,
  ink: P.ink,
  accent: P.accent,
  leinen: P.track,
  muted: P.muted,
  /** Hairline on paper. */
  hair: mixHex(P.paper, P.ink, 0.38),
  /** Hairline and unused squares on ink. */
  hairInk: mixHex(P.ink, P.paper, 0.42),
} as const;

export interface TextBox {
  readonly x: number;
  readonly y: number;
  readonly fs: number;
  readonly lh: number;
  readonly maxW: number;
}

export interface ReelLayout {
  readonly format: ReelFormat;
  readonly W: number;
  readonly H: number;
  readonly pad: number;
  /** Giant numeral: top-left, size is the cap. */
  readonly numeral: TextBox;
  readonly claim: TextBox;
  readonly unit: TextBox;
  readonly source: TextBox;
  readonly label: { readonly fs: number };
  /** Field region in the stage: origin and scale of the virtual region. */
  readonly field: { readonly x: number; readonly y: number; readonly sc: number };
  /** Takeaway words on ink: one box per word. */
  readonly take: readonly TextBox[];
  readonly end: {
    readonly title: TextBox;
    readonly sub: TextBox;
    readonly brand: TextBox;
  };
}

function box(x: number, y: number, fs: number, lh: number, maxW: number): TextBox {
  return { x, y, fs, lh, maxW };
}

const TALL: ReelLayout = {
  format: "tall",
  W: 540,
  H: 960,
  pad: 36,
  numeral: box(36, 98, 150, 140, 468),
  claim: box(36, 244, 34, 38, 468),
  unit: box(36, 664, 18, 22, 468),
  source: box(36, 689, 18, 22, 468),
  label: { fs: 19 },
  field: { x: 0, y: 372, sc: 1 },
  take: [
    box(36, 190, 88, 92, 468),
    box(36, 282, 88, 92, 468),
    box(36, 374, 88, 92, 468),
    box(36, 466, 88, 92, 468),
  ],
  end: {
    title: box(36, 100, 74, 78, 468),
    sub: box(36, 266, 30, 34, 468),
    brand: box(36, 312, 28, 32, 468),
  },
};

const WIDE: ReelLayout = {
  format: "wide",
  W: 960,
  H: 540,
  pad: 48,
  numeral: box(48, 36, 136, 128, 408),
  claim: box(48, 172, 31, 35, 408),
  unit: box(506, 352, 18, 22, 420),
  source: box(48, 425, 18, 22, 408),
  label: { fs: 19 },
  field: { x: 506, y: 96, sc: 0.84 },
  take: [box(48, 120, 74, 80, 860), box(48, 200, 74, 80, 860)],
  end: {
    title: box(48, 52, 80, 84, 408),
    sub: box(48, 236, 30, 34, 408),
    brand: box(48, 282, 28, 32, 408),
  },
};

export function layoutFor(format: ReelFormat): ReelLayout {
  return format === "tall" ? TALL : WIDE;
}

/** Virtual field point to stage point. */
export function toStage(l: ReelLayout, vx: number, vy: number): [number, number] {
  return [l.field.x + vx * l.field.sc, l.field.y + vy * l.field.sc];
}

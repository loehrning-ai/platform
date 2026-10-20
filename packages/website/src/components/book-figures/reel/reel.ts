/**
 * The cover reel as one pure piece: `createReel(format)` returns `frame(t)`,
 * a deterministic function of the second t on a 30 s loop. The same function
 * drives the inline web player (canvas) and the MP4 renderer (SVG frames), so
 * film and chapter cannot disagree. Frame 0 and the last frame are the loop
 * seam: everything that straddles the seam is written in loop time.
 */

import { buildCopy, type TextItem } from "./copy.ts";
import { REEL_DATA, type LoggedToken, type ReelData } from "./data.ts";
import { STRIDE, createField, type Field } from "./field.ts";
import { type ReelFormat, type ReelLayout, layoutFor } from "./layout.ts";
import { DURATION } from "./motion.ts";
import { buildOverlay, inkGround } from "./overlay.ts";
import { type Scene, svgMarkup } from "./paint.ts";
import { buildStates } from "./states.ts";
import { loggedTokens, textMarkup, textSvg, visibleItems } from "./text.ts";

export { DURATION };

/** The settled cover (end card): the poster and the reduced-motion picture. */
export const POSTER_T = 29.0;

export interface Frame {
  readonly t: number;
  readonly svg: string;
  readonly html: string;
}

export interface Reel {
  readonly format: ReelFormat;
  readonly layout: ReelLayout;
  readonly data: ReelData;
  readonly items: readonly TextItem[];
  readonly field: Field;
  /** Scene (squares, ground, hairlines) at t, for the canvas painter. Buffers are reused. */
  readonly scene: (t: number) => Scene;
  /** Text markup at t. */
  readonly html: (t: number) => string;
  /** Full frame as strings (SVG picture plus text markup). */
  readonly frame: (t: number) => Frame;
  /** The whole picture, text included, as one scalable SVG (poster, print, reduced motion, no JS). */
  readonly staticSvg: (t: number, idSuffix?: string) => string;
  /** Numbers and dates drawn at t, with their JSON paths. */
  readonly log: (t: number) => LoggedToken[];
  readonly visible: (t: number) => TextItem[];
}

const wrap = (t: number): number => ((t % DURATION) + DURATION) % DURATION;

export function createReel(format: ReelFormat, data: ReelData = REEL_DATA): Reel {
  const layout = layoutFor(format);
  const states = buildStates(data, layout);
  const field = createField(states, layout);
  const items = buildCopy(data, layout);
  const squares = new Float32Array(1000 * STRIDE);

  const scene = (tRaw: number): Scene => {
    const t = wrap(tRaw);
    const count = field.evalField(t, squares);
    return {
      layout,
      ground: inkGround(t, layout),
      overlay: buildOverlay(data, layout, t, squares, count),
      squares,
      count,
    };
  };

  const html = (t: number): string => textMarkup(items, wrap(t));

  return {
    format,
    layout,
    data,
    items,
    field,
    scene,
    html,
    frame: (tRaw) => {
      const t = wrap(tRaw);
      return { t, svg: svgMarkup(scene(t)), html: html(t) };
    },
    staticSvg: (tRaw, idSuffix = "") => {
      const t = wrap(tRaw);
      return svgMarkup(scene(t), idSuffix, textSvg(items, t));
    },
    log: (t) => loggedTokens(items, wrap(t)),
    visible: (t) => visibleItems(items, wrap(t)),
  };
}

/**
 * The hub tile motion model. A tile is a 400 x 300 SVG that draws its END
 * frame (what a visitor with reduced motion, no script or a printer sees) and
 * a list of tracks that say how the scene gets there on one clock p (0..1).
 * The tracks compile to CSS (motion.ts, scripts/demo-tiles/build-css.mjs), so
 * motion stays a pure function of progress: sample(track, p).
 *
 * This file and motion.ts are import-free (type imports only) so Node can run
 * them directly under type stripping.
 */

/** linear, the site's soft ease, or the overshoot snap of the last beat. */
export type EaseId = "linear" | "ease" | "snap";

/**
 * tx/ty translate in viewBox units, sx/sy scale (1 = drawn size), o is
 * opacity, dash is stroke-dashoffset on a path with pathLength="1" and
 * stroke-dasharray="1" (1 = undrawn, 0 = drawn). Nothing else moves.
 */
export type TrackProp = "tx" | "ty" | "sx" | "sy" | "o" | "dash";

/** [p, value, ease]. The ease shapes the segment that ENDS at this key. */
export type Key = readonly [p: number, v: number, ease?: EaseId];

export interface Track {
  /** Matches `data-t="<id>"` on an element of the scene. */
  readonly id: string;
  readonly prop: TrackProp;
  /** Ascending p. The LAST key is the base style, the finished still frame. */
  readonly keys: readonly Key[];
  /** transform-origin for scale tracks, e.g. "50% 100%" (fill-box). */
  readonly origin?: string;
}

export interface TileMotion {
  /** Story length in ms. Hard cap MAX_STORY_MS. */
  readonly storyMs: number;
  readonly tracks: readonly Track[];
}

export const MAX_STORY_MS = 3600;
export const TILE_VIEWBOX = "0 0 400 300";

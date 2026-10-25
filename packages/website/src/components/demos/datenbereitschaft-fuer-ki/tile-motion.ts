import type { TileMotion, Track } from "@/lib/demo-tiles/types";

/*
 * W03 "Die Fragekarte", hub miniature, motion. Import-free apart from types,
 * so scripts/demo-tiles/build-css.mjs can run it; tile.test.ts pins the
 * geometry to the kit values. One clock p (0..1), 3.6 s. Beats: Claude's
 * April bar 75.890 grows on the floor (0 to 0.24); the opening level 258.785, from the left,
 * slides in under it and lifts it (0.3 to 0.56); the figure turns from
 * 75.890 to 334.675 (0.6); the five squares of the question card fill one by
 * one (0.66 to 0.94). The last key of each track is the end frame.
 */

/** viewBox units per 1.000 EUR, one scale for the bar and the block. */
export const PER_1000 = 0.54;
/** The opening level, December 2025 (data.ts OPENING_DEC_2025). */
export const OPENING = 258_785;
/** How far the bar rises when the block slides under it. */
export const LIFT = Math.round((OPENING / 1000) * PER_1000 * 10) / 10;

/** Width of a swap in story time: about 30 ms, so two figures never show half faded. */
const SWAP = 0.008;
const on = (from: number): Track["keys"] => [[0, 0], [from, 0], [from + SWAP, 1], [1, 1]];
const off = (to: number): Track["keys"] => [[0, 1], [to, 1], [to + SWAP, 0], [1, 0]];

const SQUARES: readonly Track[] = [0, 1, 2, 3, 4].map((box) => ({ id: `sq${box + 1}`, prop: "o" as const, keys: on(0.66 + box * 0.07) }));

export const MOTION: TileMotion = {
  storyMs: 3600,
  tracks: [
    { id: "root", prop: "o", keys: [[0, 0], [0.06, 1, "ease"]] },
    { id: "grow", prop: "sy", origin: "50% 100%", keys: [[0, 0], [0.24, 1, "ease"], [1, 1]] },
    { id: "bar", prop: "ty", keys: [[0, LIFT], [0.3, LIFT], [0.56, 0, "ease"], [1, 0]] },
    { id: "block", prop: "tx", keys: [[0, -160], [0.3, -160], [0.56, 0, "ease"], [1, 0]] },
    { id: "fig-a", prop: "o", keys: off(0.6) },
    { id: "fig-b", prop: "o", keys: on(0.6) },
    { id: "bar-label", prop: "o", keys: on(0.6) },
    ...SQUARES,
  ],
};

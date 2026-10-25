import type { TileMotion, Track } from "@/lib/demo-tiles/types";

/*
 * W03 "Stufe oder Treppe?", hub miniature, motion. Import-free apart from
 * types, so scripts/demo-tiles/build-css.mjs can run it. One clock p (0..1);
 * the last key of a track is the base style, the finished still frame.
 * Story: April hangs below zero, the lever is pulled, the zero line leaves
 * and the ground rises under the same three steps (their length never
 * changes): -19.960 becomes 334.675, the start rung lands, the stamp last.
 */
const SETTLE: readonly Track[] = [
  { id: "root", prop: "o", keys: [[0, 0], [0.08, 1, "ease"]] },
  { id: "root", prop: "ty", keys: [[0, 8], [0.08, 0, "ease"]] },
];

/** A step rides from the zero line to its rung while the ground rises to meet it. */
const lift = (id: string, from: number): Track => ({ id, prop: "ty", keys: [[0, from], [0.28, from], [0.72, 0, "ease"], [1, 0]] });
const ground = (id: string): Track => ({ id, prop: "sy", origin: "50% 100%", keys: [[0, 0], [0.28, 0], [0.72, 1, "ease"], [1, 1]] });

export const MOTION: TileMotion = {
  storyMs: 3400,
  tracks: [
    ...SETTLE,
    lift("s-apr", 54.2),
    lift("s-may", 10.3),
    lift("s-jun", 31.8),
    ground("p-apr"),
    ground("p-may"),
    ground("p-jun"),
    { id: "zero", prop: "dash", keys: [[0, 0], [0.26, 0], [0.42, 1, "ease"], [1, 1]] },
    { id: "floor", prop: "o", keys: [[0, 0], [0.3, 0], [0.4, 1], [1, 1]] },
    { id: "fig-a", prop: "o", keys: [[0, 1], [0.5, 1], [0.6, 0], [1, 0]] },
    { id: "fig-b", prop: "o", keys: [[0, 0], [0.6, 0], [0.7, 1], [1, 1]] },
    { id: "rung", prop: "o", keys: [[0, 0], [0.74, 0], [0.84, 1], [1, 1]] },
    { id: "ghost", prop: "o", keys: [[0, 0], [0.8, 0], [0.9, 1], [1, 1]] },
    { id: "stamp", prop: "o", keys: [[0, 0], [0.9, 0], [1, 1]] },
  ],
};

import type { TileMotion } from "@/lib/demo-tiles/types";

/*
 * W04 "Nachweisprobe", hub miniature, motion. Import-free apart from types.
 * One clock p (0..1), 3.4 s: the band on line 8 settles (0-0.12); the
 * validity ruler draws to 31.08.2026 (0.12-0.4); the Mennige overshoot draws
 * to the reference date with a snap (0.44-0.6); "46 Tage" arrives
 * (0.58-0.68); the hectare cells grow, 12 of 40 filled (0.66-0.86); the 12
 * settles last. The last key of each track is the end frame.
 */
export const MOTION: TileMotion = {
  storyMs: 3400,
  tracks: [
    { id: "root", prop: "o", keys: [[0, 0], [0.06, 1, "ease"]] },
    { id: "band", prop: "sx", origin: "0% 50%", keys: [[0, 0], [0.12, 1, "ease"], [1, 1]] },
    { id: "ruler", prop: "dash", keys: [[0, 1], [0.12, 1], [0.4, 0, "ease"], [1, 0]] },
    { id: "over", prop: "dash", keys: [[0, 1], [0.44, 1], [0.6, 0, "snap"], [1, 0]] },
    { id: "stichtag", prop: "o", keys: [[0, 0], [0.56, 0], [0.6, 1], [1, 1]] },
    { id: "days", prop: "o", keys: [[0, 0], [0.58, 0], [0.68, 1, "ease"], [1, 1]] },
    { id: "cells", prop: "sy", origin: "50% 0%", keys: [[0, 0], [0.66, 0], [0.86, 1, "ease"], [1, 1]] },
    { id: "ha", prop: "tx", keys: [[0, 24], [0.8, 24], [0.92, 0, "ease"], [1, 0]] },
    { id: "ha", prop: "o", keys: [[0, 0], [0.8, 0], [0.92, 1, "ease"], [1, 1]] },
  ],
};

import type { TileMotion } from "@/lib/demo-tiles/types";

/*
 * W02 "Eine Datei, drei Antworten", hub miniature, motion. Import-free apart
 * from types, so scripts/demo-tiles/build-css.mjs can run it. One clock p
 * (0..1, 3.2 s). The first frame already shows the three rails at their
 * August length; then each moves to September: records shrink, affected
 * units hold, scrapped units grow past the August tick, and the three
 * figures appear. The start scales are August divided by September per rail
 * (pinned to the kit data by tile-motion.test.ts).
 */
export const AUG_OVER_SEP = { records: 1.2768, affected: 1.0041, scrapped: 0.7346 } as const;

export const MOTION: TileMotion = {
  storyMs: 3200,
  tracks: [
    { id: "ra", prop: "sx", origin: "0% 50%", keys: [[0, AUG_OVER_SEP.records], [0.22, AUG_OVER_SEP.records], [0.62, 1, "ease"], [1, 1]] },
    { id: "rb", prop: "sx", origin: "0% 50%", keys: [[0, AUG_OVER_SEP.affected], [0.3, AUG_OVER_SEP.affected], [0.66, 1, "ease"], [1, 1]] },
    { id: "rc", prop: "sx", origin: "0% 50%", keys: [[0, AUG_OVER_SEP.scrapped], [0.38, AUG_OVER_SEP.scrapped], [0.78, 1, "snap"], [1, 1]] },
    { id: "fa", prop: "o", keys: [[0, 0], [0.6, 0], [0.7, 1], [1, 1]] },
    { id: "fb", prop: "o", keys: [[0, 0], [0.66, 0], [0.76, 1], [1, 1]] },
    { id: "fc", prop: "o", keys: [[0, 0], [0.76, 0], [0.86, 1], [1, 1]] },
  ],
};

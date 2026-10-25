import type { TileMotion } from "@/lib/demo-tiles/types";

/*
 * W02 Monatsgrenze, hub miniature, motion. Import-free apart from types, so
 * scripts/demo-tiles/build-css.mjs can run it. One clock p (0..1, 3.2 s). The
 * first frame is already a full picture: the nine real columns, the cut after
 * week 4 and +26 %. The line then steps to after week 5 (-20 %) and jumps to
 * after week 3 (+105 %). The last key of every track is the base style: the
 * still frame shows the cut after week 3, two ghost lines where it was, and
 * all three figures.
 */
export const MOTION: TileMotion = {
  storyMs: 3200,
  tracks: [
    // Week 4 and 5 change side with the line (an ink column under a mark one).
    { id: "m4", prop: "o", keys: [[0, 0], [0.66, 0], [0.67, 1], [1, 1]] },
    { id: "m5", prop: "o", keys: [[0, 1], [0.36, 1], [0.37, 0], [0.66, 0], [0.67, 1], [1, 1]] },
    { id: "cut", prop: "tx", keys: [[0, 34], [0.26, 34], [0.38, 68, "ease"], [0.56, 68], [0.68, 0, "ease"], [1, 0]] },
    { id: "g4", prop: "o", keys: [[0, 0], [0.3, 0], [0.34, 1], [1, 1]] },
    { id: "g5", prop: "o", keys: [[0, 0], [0.6, 0], [0.64, 1], [1, 1]] },
    { id: "f1", prop: "sx", keys: [[0, 1.12], [0.12, 1, "ease"], [1, 1]] },
    { id: "f1", prop: "sy", keys: [[0, 1.12], [0.12, 1, "ease"], [1, 1]] },
    { id: "f2", prop: "o", keys: [[0, 0], [0.36, 0], [0.42, 1], [1, 1]] },
    { id: "f2", prop: "sx", keys: [[0, 1.4], [0.36, 1.4], [0.52, 1, "ease"], [1, 1]] },
    { id: "f2", prop: "sy", keys: [[0, 1.4], [0.36, 1.4], [0.52, 1, "ease"], [1, 1]] },
    { id: "f3", prop: "o", keys: [[0, 0], [0.66, 0], [0.72, 1], [1, 1]] },
    { id: "f3", prop: "sx", keys: [[0, 1.4], [0.66, 1.4], [0.82, 1, "ease"], [1, 1]] },
    { id: "f3", prop: "sy", keys: [[0, 1.4], [0.66, 1.4], [0.82, 1, "ease"], [1, 1]] },
  ],
};

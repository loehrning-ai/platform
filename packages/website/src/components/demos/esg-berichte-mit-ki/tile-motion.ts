import type { TileMotion } from "@/lib/demo-tiles/types";

/*
 * W04 "Elf von zwölf", hub miniature, motion. Import-free apart from types.
 * One clock p (0..1), 3.4 s. Beats: eleven bars rise, the draft figure holds
 * (0-0.2); a hatched guess rises in the empty slot (0.2-0.42); the real bill
 * overshoots above every bar (0.42-0.58); the draft figure slides left and is
 * struck while the true figure arrives (0.52-0.7); the strip's ninth square
 * fills (0.6). The last key of each track is the end frame.
 */
export const MOTION: TileMotion = {
  storyMs: 3400,
  tracks: [
    { id: "root", prop: "o", keys: [[0, 0], [0.06, 1, "ease"]] },
    { id: "bars", prop: "sy", origin: "50% 100%", keys: [[0, 0], [0.18, 1, "ease"], [1, 1]] },
    { id: "ghost", prop: "sy", origin: "50% 100%", keys: [[0, 0], [0.2, 0], [0.42, 1, "ease"], [1, 1]] },
    { id: "ghost", prop: "o", keys: [[0, 1], [0.5, 1], [0.58, 0], [1, 0]] },
    { id: "slot", prop: "o", keys: [[0, 1], [0.2, 1], [0.24, 0], [1, 0]] },
    { id: "bill", prop: "sy", origin: "50% 100%", keys: [[0, 0], [0.42, 0], [0.58, 1, "snap"], [1, 1]] },
    { id: "fig-a", prop: "tx", keys: [[0, 76], [0.52, 76], [0.68, 0, "ease"], [1, 0]] },
    { id: "strike", prop: "dash", keys: [[0, 1], [0.6, 1], [0.7, 0, "ease"], [1, 0]] },
    { id: "fig-b", prop: "o", keys: [[0, 0], [0.62, 0], [0.7, 1], [1, 1]] },
    { id: "cell-open", prop: "o", keys: [[0, 1], [0.6, 1], [0.61, 0], [1, 0]] },
    { id: "cell-cover", prop: "o", keys: [[0, 1], [0.6, 1], [0.61, 0], [1, 0]] },
  ],
};

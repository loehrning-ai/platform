import type { TileMotion } from "@/lib/demo-tiles/types";

/*
 * W06 "Die Vergleichsbasis", hub miniature, motion. Import-free apart from types. One clock p (0..1),
 * 3.4 s: the goods bars draw in goods order (0.04-0.3); freight, one-off costs and storage stack on in
 * the mid colour (0.34-0.56); the label turns from "nach dem Stückpreis" to "geliefert und bezahlt" and
 * the rows move to the delivered order, B down two rows, C and A up one (0.6-0.8, snap); the totals
 * arrive (0.8-0.92). The row shifts (72 units per row) are the ones tile.tsx draws (TILE_ROWS). The last
 * key of each track is the end frame.
 */
export const MOTION: TileMotion = {
  storyMs: 3400,
  tracks: [
    { id: "root", prop: "o", keys: [[0, 0], [0.04, 1, "ease"]] },
    { id: "goods-b", prop: "sx", origin: "0% 50%", keys: [[0, 0], [0.04, 0], [0.22, 1, "ease"], [1, 1]] },
    { id: "goods-c", prop: "sx", origin: "0% 50%", keys: [[0, 0], [0.08, 0], [0.26, 1, "ease"], [1, 1]] },
    { id: "goods-a", prop: "sx", origin: "0% 50%", keys: [[0, 0], [0.12, 0], [0.3, 1, "ease"], [1, 1]] },
    { id: "added-b", prop: "sx", origin: "0% 50%", keys: [[0, 0], [0.34, 0], [0.5, 1, "ease"], [1, 1]] },
    { id: "added-c", prop: "sx", origin: "0% 50%", keys: [[0, 0], [0.4, 0], [0.56, 1, "ease"], [1, 1]] },
    { id: "before", prop: "o", keys: [[0, 1], [0.58, 1], [0.64, 0], [1, 0]] },
    { id: "after", prop: "o", keys: [[0, 0], [0.62, 0], [0.7, 1, "ease"], [1, 1]] },
    { id: "row-b", prop: "ty", keys: [[0, -144], [0.6, -144], [0.8, 0, "snap"], [1, 0]] },
    { id: "row-c", prop: "ty", keys: [[0, 72], [0.6, 72], [0.8, 0, "snap"], [1, 0]] },
    { id: "row-a", prop: "ty", keys: [[0, 72], [0.6, 72], [0.8, 0, "snap"], [1, 0]] },
    { id: "total-b", prop: "o", keys: [[0, 0], [0.8, 0], [0.92, 1, "ease"], [1, 1]] },
    { id: "total-c", prop: "o", keys: [[0, 0], [0.8, 0], [0.92, 1, "ease"], [1, 1]] },
    { id: "total-a", prop: "o", keys: [[0, 0], [0.8, 0], [0.92, 1, "ease"], [1, 1]] },
  ],
};

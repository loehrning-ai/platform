import type { TileMotion, Track } from "@/lib/demo-tiles/types";

/*
 * W05 "Was fliegt mit?", hub miniature motion. The story in one clock:
 * four details light up Mennige and the counter reads 4; one after another
 * each is swept by a black bar and ends as a labelled slab while the counter
 * steps down; then the traffic light under the card swaps red to amber and the
 * lock's shackle drops shut (the latch tick). Import-free apart from types, so
 * scripts/demo-tiles/build-css.mjs can run it. The last key of a track is the
 * base style, the finished still frame (slabs, counter 0, amber, lock shut).
 */
const COUNT = 4;
const start = (i: number) => 0.18 + 0.15 * i;
/** The moment slot i is finished: slab in, bar gone. */
const done = (i: number) => start(i) + 0.16;

const hits: Track[] = Array.from({ length: COUNT }, (_, i): readonly Track[] => [
  { id: `m${i}`, prop: "o", keys: [[0, 0], [0.03 + 0.045 * i, 0], [0.05 + 0.045 * i, 1], [start(i) + 0.08, 1], [start(i) + 0.09, 0], [1, 0]] },
  { id: `b${i}`, prop: "sx", origin: "0% 50%", keys: [[0, 0], [start(i), 0], [start(i) + 0.1, 1, "ease"], [done(i) - 0.01, 1], [done(i), 0], [1, 0]] },
  { id: `p${i}`, prop: "o", keys: [[0, 0], [start(i) + 0.1, 0], [done(i) - 0.01, 1], [1, 1]] },
]).flat();

/** Counter digit n is shown from the moment hit COUNT-n finished until the next one does. */
const digits: Track[] = Array.from({ length: COUNT + 1 }, (_, n): Track => {
  const on = n === COUNT ? 0 : done(COUNT - n - 1);
  const off = n === 0 ? 1.01 : done(COUNT - n);
  const keys: [number, number][] = [[0, n === COUNT ? 1 : 0]];
  if (on > 0) keys.push([on, 0], [on + 0.01, 1]);
  if (off <= 1) keys.push([off, 1], [off + 0.01, 0]);
  else keys.push([1, 1]);
  return { id: `n${n}`, prop: "o", keys: keys.filter(([t], k, all) => t <= 1 && (k === 0 || t >= (all[k - 1] as [number, number])[0])) };
});

const LIGHT = done(COUNT - 1) + 0.02;

export const MOTION: TileMotion = {
  storyMs: 3400,
  tracks: [
    { id: "root", prop: "o", keys: [[0, 0], [0.08, 1, "ease"]] },
    ...hits,
    ...digits,
    /* the light under the card: red until the last slab lands, then it gives way to the amber below it */
    { id: "lr", prop: "o", keys: [[0, 1], [LIGHT, 1], [LIGHT + 0.04, 0]] },
    /* the scan beam runs down the card with the bars (one pass, row by row) and is gone before the light changes */
    { id: "scan", prop: "ty", keys: [[0, 0], [start(0), 0], [done(COUNT - 1), 118, "linear"], [1, 118]] },
    { id: "scan", prop: "o", keys: [[0, 0], [start(0) - 0.01, 0], [start(0), 1], [done(COUNT - 1), 1], [done(COUNT - 1) + 0.01, 0], [1, 0]] },
    /* the latch: the shackle is lifted 8 units until the light is amber, then snaps shut; the body holds one frame, then recoils */
    { id: "lk", prop: "ty", keys: [[0, -8], [LIGHT + 0.05, -8], [LIGHT + 0.1, 0, "snap"], [1, 0]] },
    { id: "lb", prop: "sy", origin: "50% 100%", keys: [[0, 1], [LIGHT + 0.1, 1], [LIGHT + 0.106, 1], [LIGHT + 0.116, 1.22], [LIGHT + 0.14, 1, "ease"], [1, 1]] },
  ],
};

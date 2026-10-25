import type { TileMotion, Track } from "@/lib/demo-tiles/types";

/*
 * W01 "Hundert Startwochen", hub miniature. The staircase grows, the line
 * lands at the stock 1.050 (76 / 100), rises to the forecast 1.180 (50 / 100)
 * and comes home: the end frame is 76 / 100 with the line at 1.050, the same
 * picture as the demo's hero and the hub's hook line, so a screenshot, a
 * reduced-motion visitor and a printer all see the wow. Import-free apart from
 * types (the css generator runs it).
 *
 * The red/ink split follows the line with two clip windows: "wa" (red, above
 * the line) and "wb" (ink, below it) carry a clip path and translate with the
 * line by RISE; "ca" and "cb" translate their content back, so the columns
 * stay put while the cut moves.
 */
const RISE = -31.2;
const UP: readonly (readonly [number, number, "ease"?])[] = [
  [0, 0],
  [0.52, 0],
  [0.64, RISE, "ease"],
  [0.78, RISE],
  [0.9, 0, "ease"],
  [1, 0],
];
const DOWN = UP.map(([p, v, e]) =>
  e ? ([p, v === 0 ? 0 : -v, e] as const) : ([p, v === 0 ? 0 : -v] as const),
);

const GROW: readonly Track[] = ["grow-a", "grow-b"].map((id) => ({
  id,
  prop: "sy" as const,
  origin: "50% 100%",
  keys: [
    [0, 0],
    [0.28, 1, "ease"],
  ] as const,
}));

/** Width of a swap in story time: about 30 ms, so two numerals never show half faded on top of each other. */
const SWAP = 0.008;
/** A label that is simply on during the given windows, with a fast swap (no grey half-faded text). */
const windows = (...spans: readonly (readonly [number, number])[]): Track["keys"] => {
  const keys: [number, number][] = [[0, spans[0]?.[0] === 0 ? 1 : 0]];
  for (const [from, to] of spans) {
    if (from > 0) keys.push([from, 0], [from + SWAP, 1]);
    if (to < 1) keys.push([to, 1], [to + SWAP, 0]);
  }
  const last = spans[spans.length - 1];
  if (last && last[1] >= 1) keys.push([1, 1]);
  else keys.push([1, 0]);
  return keys;
};

export const MOTION: TileMotion = {
  storyMs: 3600,
  tracks: [
    {
      id: "root",
      prop: "o",
      keys: [
        [0, 0],
        [0.1, 1, "ease"],
      ],
    },
    ...GROW,
    { id: "wa", prop: "ty", keys: UP },
    { id: "ca", prop: "ty", keys: DOWN },
    { id: "wb", prop: "ty", keys: UP },
    { id: "cb", prop: "ty", keys: DOWN },
    { id: "line", prop: "ty", keys: UP },
    {
      id: "line",
      prop: "o",
      keys: [
        [0, 0],
        [0.26, 0],
        [0.34, 1],
        [1, 1],
      ],
    },
    // "1.050" labels the line at home, "1.180" the line at the forecast; never both.
    { id: "l1050", prop: "o", keys: windows([0.34, 0.5], [0.92, 1]) },
    { id: "l1180", prop: "o", keys: windows([0.62, 0.8]) },
    // The press ring: the hand holds the handle while the line is up.
    { id: "ring", prop: "ty", keys: UP },
    { id: "ring", prop: "o", keys: windows([0.5, 0.9]) },
    // The dotted mark stays where the stock was while the line is up.
    { id: "tick", prop: "o", keys: windows([0.58, 0.82]) },
    // The numeral: 76 from the first frame, 50 while the line is up, 76 again.
    { id: "c76", prop: "o", keys: windows([0, 0.6], [0.8, 1]) },
    { id: "c50", prop: "o", keys: windows([0.6, 0.8]) },
  ],
};

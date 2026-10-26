import type { TileMotion, Track } from "@/lib/demo-tiles/types";

/*
 * W05 "Die Lückenliste", hub miniature motion. Every request starts linked
 * to a file (solid lines, 8/8). A test bar sweeps down row by row: where a
 * test fails the solid line gives way to a dashed one (SCHWACH), where the
 * record says "not met" the line breaks and its halves pull apart (LÜCKE).
 * Then the counter drops to 2/8. Import-free apart from types. The last key
 * of a track is the base style, the finished still frame.
 */
const ROWS = 8;
/** Mirrors tile.tsx STATES: covered, weak, gap per row. */
const STATES = ["c", "w", "w", "w", "g", "c", "g", "w"] as const;
const SWEEP_FROM = 0.14;
const SWEEP_TO = 0.74;
const at = (i: number) => SWEEP_FROM + ((SWEEP_TO - SWEEP_FROM) * (i + 0.5)) / ROWS;

const rows: Track[] = STATES.flatMap((state, i): Track[] => {
  if (state === "c") return [];
  const t = at(i);
  const solid: Track = { id: `s${i}`, prop: "o", keys: [[0, 1], [t, 1], [t + 0.03, 0], [1, 0]] };
  if (state === "w") return [solid, { id: `d${i}`, prop: "o", keys: [[0, 0], [t, 0], [t + 0.03, 1], [1, 1]] }];
  return [
    solid,
    { id: `a${i}`, prop: "o", keys: [[0, 0], [t, 0], [t + 0.02, 1], [1, 1]] },
    { id: `b${i}`, prop: "o", keys: [[0, 0], [t, 0], [t + 0.02, 1], [1, 1]] },
    { id: `a${i}`, prop: "tx", keys: [[0, 10], [t, 10], [t + 0.08, 0, "ease"], [1, 0]] },
    { id: `b${i}`, prop: "tx", keys: [[0, -10], [t, -10], [t + 0.08, 0, "ease"], [1, 0]] },
  ];
});

const COUNT = SWEEP_TO + 0.06;

export const MOTION: TileMotion = {
  storyMs: 3400,
  tracks: [
    ...rows,
    { id: "scan", prop: "ty", keys: [[0, 0], [SWEEP_FROM, 0], [SWEEP_TO, 224, "linear"], [1, 224]] },
    { id: "scan", prop: "o", keys: [[0, 0], [SWEEP_FROM - 0.01, 0], [SWEEP_FROM, 1], [SWEEP_TO, 1], [SWEEP_TO + 0.02, 0], [1, 0]] },
    { id: "n8", prop: "o", keys: [[0, 1], [COUNT, 1], [COUNT + 0.03, 0], [1, 0]] },
    { id: "n2", prop: "o", keys: [[0, 0], [COUNT, 0], [COUNT + 0.03, 1, "ease"], [1, 1]] },
  ],
};

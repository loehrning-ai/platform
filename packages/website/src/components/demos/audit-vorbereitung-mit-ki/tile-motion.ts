import type { TileMotion, Track } from "@/lib/demo-tiles/types";

/*
 * W05 "Vier Tage", hub miniature motion. Every question starts linked to a
 * paper (solid lines, 13/13). A test bar sweeps down row by row: where a test
 * fails the solid line gives way to a dashed one (weak), where the record
 * shows the rule broken the line gives way to a broken one (gap). Then the
 * counter drops to 2/13. Import-free apart from types. The last key of a
 * track is the base style, the finished still frame.
 */
const ROWS = 13;
/** Mirrors tile.tsx STATES: covered, weak, gap per row. */
const STATES = ["c", "g", "g", "g", "g", "g", "g", "g", "g", "g", "w", "g", "c"] as const;
const SWEEP_FROM = 0.14;
const SWEEP_TO = 0.74;
const at = (i: number) => SWEEP_FROM + ((SWEEP_TO - SWEEP_FROM) * (i + 0.5)) / ROWS;

const rows: Track[] = STATES.flatMap((state, i): Track[] => {
  if (state === "c") return [];
  const t = at(i);
  const solid: Track = { id: `s${i}`, prop: "o", keys: [[0, 1], [t, 1], [t + 0.03, 0], [1, 0]] };
  const next: Track = { id: state === "w" ? `d${i}` : `a${i}`, prop: "o", keys: [[0, 0], [t, 0], [t + 0.03, 1], [1, 1]] };
  return [solid, next];
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

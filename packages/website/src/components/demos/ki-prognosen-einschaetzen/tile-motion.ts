import type { TileMotion, Track } from "@/lib/demo-tiles/types";

/*
 * W01 "Die Fehlerliste", hub miniature. The four rows of the release rule's
 * 52-week strip fill left to right, one after the other (ink = free, hatched
 * Mennige = a person decides), then the planning number lands. The end frame
 * is the whole strip and "748", so a screenshot, a reduced-motion visitor and
 * a printer see the same picture. Import-free apart from types (the css
 * generator runs it).
 */
const ROWS = 4;
const START = 0.08;
const ROW_SPAN = 0.17;

const FILL: readonly Track[] = Array.from({ length: ROWS }, (_, row) => {
  const from = START + row * ROW_SPAN;
  return {
    id: `row${row}`,
    prop: "sx" as const,
    origin: "0% 50%",
    keys: [
      [0, 0],
      [from, 0],
      [from + ROW_SPAN, 1, "ease"],
      [1, 1],
    ] as const,
  };
});

export const MOTION: TileMotion = {
  storyMs: 3200,
  tracks: [
    {
      id: "root",
      prop: "o",
      keys: [
        [0, 0],
        [0.06, 1, "ease"],
      ],
    },
    ...FILL,
    {
      id: "plan",
      prop: "o",
      keys: [
        [0, 0],
        [0.8, 0],
        [0.81, 1],
        [1, 1],
      ],
    },
    {
      id: "plan",
      prop: "ty",
      keys: [
        [0, 12],
        [0.8, 12],
        [0.92, 0, "snap"],
        [1, 0],
      ],
    },
  ],
};

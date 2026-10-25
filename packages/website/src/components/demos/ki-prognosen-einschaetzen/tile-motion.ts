import type { TileMotion } from "@/lib/demo-tiles/types";

/*
 * W01 "Die Fehlerliste", hub miniature. The bars rise, the tool's claim and
 * its forecast ticks land, then the dashed "same as last week" line and its
 * score, nearly the same number. The end frame shows all of it, so a
 * screenshot, a reduced-motion visitor and a printer see the same picture.
 * Import-free apart from types (the css generator runs it).
 */
export const MOTION: TileMotion = {
  storyMs: 3400,
  tracks: [
    {
      id: "root",
      prop: "o",
      keys: [
        [0, 0],
        [0.05, 1, "ease"],
      ],
    },
    {
      id: "bars",
      prop: "sy",
      origin: "50% 100%",
      keys: [
        [0, 0],
        [0.05, 0],
        [0.3, 1, "ease"],
        [1, 1],
      ],
    },
    {
      id: "tool",
      prop: "o",
      keys: [
        [0, 0],
        [0.3, 0],
        [0.4, 1, "ease"],
        [1, 1],
      ],
    },
    {
      id: "ticks",
      prop: "o",
      keys: [
        [0, 0],
        [0.36, 0],
        [0.48, 1, "ease"],
        [1, 1],
      ],
    },
    {
      id: "rule",
      prop: "o",
      keys: [
        [0, 0],
        [0.56, 0],
        [0.7, 1, "ease"],
        [1, 1],
      ],
    },
    {
      id: "plain",
      prop: "o",
      keys: [
        [0, 0],
        [0.72, 0],
        [0.82, 1, "ease"],
        [1, 1],
      ],
    },
    {
      id: "plain",
      prop: "ty",
      keys: [
        [0, 10],
        [0.72, 10],
        [0.86, 0, "snap"],
        [1, 0],
      ],
    },
  ],
};

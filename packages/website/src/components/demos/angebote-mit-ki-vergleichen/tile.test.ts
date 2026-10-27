import { describe, expect, it } from "vitest";
import { TILE_ROWS } from "./tile";
import { MOTION } from "./tile-motion";

describe("Workshop 06 hub tile", () => {
  it("moves each row from its goods-order place to its delivered place, as the engine ranks them", () => {
    expect(TILE_ROWS.map(({ option }) => option.name)).toEqual(["B Poznań", "C Brno", "A Nürnberg"]);
    for (const row of TILE_ROWS) {
      const track = MOTION.tracks.find((candidate) => candidate.id === `row-${row.option.name.slice(0, 1).toLowerCase()}` && candidate.prop === "ty");
      expect(track?.keys[0]?.[1], row.option.name).toBe(row.start);
      expect(track?.keys.at(-1)?.[1]).toBe(0);
    }
  });
});

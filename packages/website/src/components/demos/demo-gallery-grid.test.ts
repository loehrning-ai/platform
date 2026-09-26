import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * demo-gallery-grid.test.ts
 *
 * Blueprint 6.14: the gallery is a uniform 3/2/1 grid. Tiles never span
 * columns or rows, so any number of demos (and any filtered subset) packs
 * without holes, and every preview panel has the same 4:3 shape. This
 * replaces the bento tiling simulation, whose invariant no longer applies.
 */
const grid = readFileSync(join(__dirname, "demo-grid.tsx"), "utf8");
const tile = readFileSync(join(__dirname, "demo-tile.tsx"), "utf8");

describe("demo gallery grid", () => {
  it("lays tiles out in uniform 1/2/3 columns with whitespace between them", () => {
    expect(grid).toContain(
      "grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3",
    );
    expect(grid).not.toContain("grid-flow-row-dense");
    expect(grid).not.toContain("lg:grid-cols-4");
  });

  it("never spans a tile, whatever its registry size", () => {
    expect(tile).not.toMatch(/col-span-|row-span-/);
    expect(tile).not.toContain("tileSizeClass");
  });

  it("gives every preview the same 4:3 panel", () => {
    expect(tile).toContain("aspect-[4/3]");
    expect(tile).not.toMatch(/min-h-\d+ flex-1/);
  });
});

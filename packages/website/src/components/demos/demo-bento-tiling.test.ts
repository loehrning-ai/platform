import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { demos, type DemoSize } from "@/lib/demos";

/**
 * demo-bento-tiling.test.ts
 *
 * The gallery is a bento, not a uniform grid: tiles span two columns, two rows,
 * or both. CSS grid auto-placement is SPARSE by default, which never backfills
 * a cell it has already scanned past. So a size mix that does not pack leaves
 * visible holes in the page rather than reflowing around them.
 *
 * That failure is invisible to every other test: the DOM is identical, all
 * twelve links render, and axe is happy. Only the painted layout is wrong. This
 * file simulates the placement algorithm against the real catalog so a size
 * change or a thirteenth demo cannot silently reopen a hole.
 *
 * The span table below mirrors tileSizeClass() in demo-tile.tsx; the first test
 * pins them together so the simulation cannot drift from the component.
 */

type Span = { readonly cols: number; readonly rows: number };

// Spans as they resolve at the lg breakpoint (the four-column layout).
const SPAN_LG: Readonly<Record<DemoSize, Span>> = {
  "s-hero": { cols: 2, rows: 2 },
  "s-tall": { cols: 1, rows: 2 },
  "s-wide": { cols: 2, rows: 1 },
  "s-med": { cols: 1, rows: 1 },
};

// At sm only the col-span-2 utilities apply: `lg:row-span-2` is lg-only, so
// s-tall collapses to a single cell and s-hero is 2x1 rather than 2x2.
const SPAN_SM: Readonly<Record<DemoSize, Span>> = {
  "s-hero": { cols: 2, rows: 1 },
  "s-tall": { cols: 1, rows: 1 },
  "s-wide": { cols: 2, rows: 1 },
  "s-med": { cols: 1, rows: 1 },
};

interface Placement {
  readonly occupied: ReadonlySet<string>;
  readonly rows: number;
  /** Row-major index of the last cell any tile occupies. */
  readonly lastFilled: number;
  readonly placedAt: ReadonlyMap<number, { row: number; col: number }>;
}

/**
 * CSS grid sparse row-flow placement. The cursor only ever moves forward, which
 * is exactly why a badly sized tile strands the cells behind it.
 */
function place(
  sizes: readonly DemoSize[],
  table: Readonly<Record<DemoSize, Span>>,
  cols: number,
): Placement {
  const occupied = new Set<string>();
  const placedAt = new Map<number, { row: number; col: number }>();
  let cursor = 0;
  let lastFilled = -1;

  sizes.forEach((size, index) => {
    const span = table[size];
    const colSpan = Math.min(span.cols, cols);
    let pos = cursor;

    for (;;) {
      const row = Math.floor(pos / cols);
      const col = pos % cols;
      if (col + colSpan > cols) {
        pos = (row + 1) * cols;
        continue;
      }
      let free = true;
      for (let r = 0; r < span.rows && free; r += 1) {
        for (let c = 0; c < colSpan; c += 1) {
          if (occupied.has(`${row + r}:${col + c}`)) {
            free = false;
            break;
          }
        }
      }
      if (free) break;
      pos += 1;
    }

    const row = Math.floor(pos / cols);
    const col = pos % cols;
    for (let r = 0; r < span.rows; r += 1) {
      for (let c = 0; c < colSpan; c += 1) {
        occupied.add(`${row + r}:${col + c}`);
        lastFilled = Math.max(lastFilled, (row + r) * cols + (col + c));
      }
    }
    placedAt.set(index, { row, col });
    cursor = pos + colSpan;
  });

  const rows = Math.floor(lastFilled / cols) + 1;
  return { occupied, rows, lastFilled, placedAt };
}

/**
 * An empty cell that still has a filled cell after it in row-major order. A
 * trailing gap on the final row is a tail, not a hole, and is allowed.
 */
function interiorHoles(p: Placement, cols: number): string[] {
  const holes: string[] = [];
  for (let i = 0; i < p.lastFilled; i += 1) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    if (!p.occupied.has(`${row}:${col}`)) holes.push(`r${row + 1}c${col + 1}`);
  }
  return holes;
}

/** The tile whose placement stranded a given cell: the last one placed before it. */
function culprit(p: Placement, hole: string): string {
  const [r, c] = hole.slice(1).split("c").map(Number);
  const holeIndex = (r - 1) * 4 + (c - 1);
  let best = "none";
  for (const [index, at] of p.placedAt) {
    if (at.row * 4 + at.col < holeIndex) {
      best = `index ${index + 1} (${demos[index]?.slug ?? "?"}, ${demos[index]?.size ?? "?"})`;
    }
  }
  return best;
}

const sizes = demos.map((d) => d.size);

describe("demo bento tiling", () => {
  it("keeps the simulated spans in step with tileSizeClass()", () => {
    const tile = readFileSync(join(__dirname, "demo-tile.tsx"), "utf8");
    // If these change, SPAN_LG / SPAN_SM above are stale and every assertion
    // below is simulating a layout the page no longer renders.
    expect(tile).toContain('return "sm:col-span-2 lg:col-span-2 lg:row-span-2"');
    expect(tile).toContain('return "lg:row-span-2"');
    expect(tile).toContain('return "sm:col-span-2 lg:col-span-2"');
  });

  it("holds the size mix the four-column packing requires", () => {
    const counts = sizes.reduce<Record<string, number>>((acc, size) => {
      acc[size] = (acc[size] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({
      "s-hero": 1,
      "s-tall": 3,
      "s-wide": 2,
      "s-med": 6,
    });

    const area = sizes.reduce(
      (sum, size) => sum + SPAN_LG[size].cols * SPAN_LG[size].rows,
      0,
    );
    // 20 cells over 4 columns is exactly 5 whole rows. A remainder here means
    // the grid cannot close, whatever order the tiles are in.
    expect(area % 4, `span area ${area} leaves a partial row`).toBe(0);
    expect(area).toBe(20);
  });

  it("packs the four-column gallery with no holes and no ragged tail", () => {
    const p = place(sizes, SPAN_LG, 4);
    const holes = interiorHoles(p, 4);
    expect(
      holes,
      holes.length
        ? `hole at ${holes.join(", ")}; stranded by ${culprit(p, holes[0])}`
        : "",
    ).toEqual([]);
    expect(p.rows).toBe(5);
    // Perfect packing: the last row is full, so there is no tail either.
    expect(p.occupied.size).toBe(20);
  });

  it("packs the two-column gallery with no interior holes", () => {
    const p = place(sizes, SPAN_SM, 2);
    const holes = interiorHoles(p, 2);
    expect(
      holes,
      holes.length ? `hole at ${holes.join(", ")} in the sm layout` : "",
    ).toEqual([]);
  });

  it("puts a double-height tile beside the hero so its right-hand cells close", () => {
    // The hero occupies r1-2 c1-2. Cells (1,4) and (2,4) can only be filled by
    // a tile that spans both rows, and sparse flow will never come back for
    // them. This is the exact shape of the hole this suite exists to prevent.
    expect(sizes[0]).toBe("s-hero");
    expect(["s-tall"]).toContain(sizes[2]);
  });
});

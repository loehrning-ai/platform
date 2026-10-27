import { describe, expect, it } from "vitest";
import { CRAFT_NCR } from "./data";
import { reading } from "./definitions";
import { atLeast, squarify } from "./treemap";
import { MIN_SIDE, nearestChange, nearestPebble, scaleChange, scaleX, trayLayout, trayRects } from "./trays";

describe("the treemap", () => {
  it("gives every value exactly its share of the area", () => {
    const values = [6, 6, 4, 3, 2, 2, 1];
    const rects = squarify(values, { x: 0, y: 0, w: 6, h: 4 });
    rects.forEach((rect, index) => expect(rect.w * rect.h).toBeCloseTo(values[index] as number, 9));
    for (const rect of rects) {
      expect(rect.x).toBeGreaterThanOrEqual(-1e-9);
      expect(rect.x + rect.w).toBeLessThanOrEqual(6 + 1e-9);
    }
    expect(atLeast({ x: 10, y: 10, w: 2, h: 8 }, 6)).toEqual({
      x: 8,
      y: 10,
      w: 6,
      h: 8,
    });
  });
});

describe("the trays", () => {
  it("are as wide as the units shipped with the Nenner and equal without", () => {
    const on = trayRects("per1000");
    expect((on.sep.w - 8) / (on.aug.w - 8)).toBeCloseTo(9162 / 7488, 9);
    const off = trayRects("none");
    expect(off.aug.w).toBeCloseTo(off.sep.w, 9);
  });

  it("place all 47 records inside their tray, every one at least six units wide", () => {
    for (const counter of ["records", "affected", "scrapped"] as const)
      for (const denom of ["per1000", "none"] as const) {
        const layout = trayLayout(counter, denom);
        expect(layout.pebbles).toHaveLength(CRAFT_NCR.length);
        for (const pebble of layout.pebbles) {
          const tray = layout.trays[pebble.month];
          expect(pebble.rect.w).toBeGreaterThanOrEqual(MIN_SIDE - 1e-9);
          expect(pebble.rect.x).toBeGreaterThanOrEqual(tray.x - 3);
          expect(pebble.rect.x + pebble.rect.w).toBeLessThanOrEqual(tray.x + tray.w + 3);
          expect(pebble.rect.y).toBeGreaterThanOrEqual(tray.y - 3);
        }
      }
  });

  it("fill as high as the rate with the Nenner on", () => {
    for (const counter of ["affected", "scrapped"] as const) {
      // pebbles have a 6-unit floor, the block itself is exact
      const layout = trayLayout(counter, "per1000");
      const r = reading({ counter });
      expect(layout.fill.sep / layout.fill.aug).toBeCloseTo(r.sep / r.aug, 6);
    }
    const ghosts = trayLayout("scrapped", "per1000").pebbles.filter((pebble) => pebble.ghost);
    expect(ghosts.every((pebble) => !pebble.row.scrap)).toBe(true);
  });

  it("resolve a tap to the nearest record and the lens to the nearest reading", () => {
    const layout = trayLayout("records", "per1000");
    const first = layout.pebbles[0];
    expect(nearestPebble(layout.pebbles, (first?.rect.x ?? 0) + 1, (first?.rect.y ?? 0) + 1)?.row.id).toBe(first?.row.id);
    expect(nearestPebble(layout.pebbles, -100, -100)).toBeNull();
    expect(scaleChange(scaleX(0.25))).toBeCloseTo(0.25, 9);
    expect(nearestChange([-0.217, -0.004, 0.361], scaleX(0.3))).toBe(2);
  });
});

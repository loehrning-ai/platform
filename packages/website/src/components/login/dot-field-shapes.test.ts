import { describe, expect, it, vi } from "vitest";
import {
  DOT_FIELD_FRAME_MS,
  DOT_FIELD_GRID,
  DOT_FIELD_PARALLAX,
  DOT_FIELD_SHAPES,
  buildConstellations,
  drawDotField,
  shapeCells,
  shapePose,
  type DotShape,
} from "./dot-field-shapes";

function shape(kind: DotShape["kind"]): DotShape {
  const found = DOT_FIELD_SHAPES.find((candidate) => candidate.kind === kind);
  if (!found) throw new Error(`missing ${kind}`);
  return found;
}

function keys(cells: readonly (readonly [number, number])[]): Set<string> {
  return new Set(cells.map(([i, j]) => `${i}_${j}`));
}

describe("dot field shapes", () => {
  it("keeps the reference set: eight shapes in four muted colours", () => {
    expect(DOT_FIELD_SHAPES.map((entry) => entry.kind)).toEqual([
      "ring",
      "hexagon",
      "triangle",
      "squareLine",
      "asterisk",
      "plus",
      "disc",
      "squareFill",
    ]);
    const colours = new Set(DOT_FIELD_SHAPES.map((entry) => entry.color.join()));
    expect(colours.size).toBeLessThanOrEqual(8);
    for (const entry of DOT_FIELD_SHAPES) {
      // Dim and flat: no shape is brighter than the reference outlines.
      expect(entry.a).toBeGreaterThan(0.2);
      expect(entry.a).toBeLessThanOrEqual(0.42);
      expect(entry.depth).toBeGreaterThan(0);
      expect(entry.depth).toBeLessThanOrEqual(1);
    }
    expect(DOT_FIELD_GRID).toBe(14);
    expect(DOT_FIELD_PARALLAX).toBe(42);
    expect(DOT_FIELD_FRAME_MS).toBeCloseTo(1000 / 30);
  });

  it("rasterizes a disc as every cell inside the radius", () => {
    const cells = shapeCells(shape("disc"), 0);
    const R = shape("disc").Rd;
    for (const [i, j] of cells) expect(i * i + j * j).toBeLessThanOrEqual(R * R + 0.4);
    // Symmetric under both mirrors, so it reads round, not octagonal.
    const set = keys(cells);
    for (const [i, j] of cells) {
      expect(set.has(`${-i}_${j}`)).toBe(true);
      expect(set.has(`${i}_${-j}`)).toBe(true);
    }
  });

  it("leaves the ring hollow and the filled shapes solid", () => {
    expect(keys(shapeCells(shape("ring"), 0)).has("0_0")).toBe(false);
    expect(keys(shapeCells(shape("hexagon"), 0)).has("0_0")).toBe(false);
    expect(keys(shapeCells(shape("squareLine"), 0)).has("0_0")).toBe(false);
    for (const kind of ["disc", "squareFill", "triangle", "plus", "asterisk"] as const) {
      expect(keys(shapeCells(shape(kind), 0)).has("0_0"), kind).toBe(true);
    }
  });

  it("draws the asterisk from line spokes reaching its radius", () => {
    const asterisk = shape("asterisk");
    const cells = shapeCells({ ...asterisk, dilate: 0 }, 0);
    const set = keys(cells);
    expect(set.has(`${asterisk.Rd}_0`)).toBe(true);
    expect(set.has(`0_${asterisk.Rd}`)).toBe(true);
    expect(set.has(`${-asterisk.Rd}_0`)).toBe(true);
  });

  it("stores each cell once and never emits a negative zero", () => {
    for (const entry of DOT_FIELD_SHAPES) {
      const cells = shapeCells(entry, 0);
      expect(keys(cells).size).toBe(cells.length);
      for (const [i, j] of cells) {
        expect(Object.is(i, -0)).toBe(false);
        expect(Object.is(j, -0)).toBe(false);
        expect(Number.isInteger(i) && Number.isInteger(j)).toBe(true);
      }
    }
  });

  it("builds rigid constellations on the dot pitch with a dim halo", () => {
    const constellations = buildConstellations();
    expect(constellations).toHaveLength(DOT_FIELD_SHAPES.length);
    for (const constellation of constellations) {
      expect(constellation.offsets.length % 2).toBe(0);
      for (const value of constellation.offsets) {
        expect(Math.abs(value % DOT_FIELD_GRID)).toBe(0);
      }
      const alpha = constellation.shape.a;
      expect(constellation.core).toBe(
        `rgba(${constellation.shape.color.join(",")},${alpha})`,
      );
      expect(constellation.halo).toBe(
        `rgba(${constellation.shape.color.join(",")},${(alpha * 0.22).toFixed(3)})`,
      );
    }
  });

  it("drifts, rotates and follows the cursor by depth", () => {
    const ring = shape("ring");
    const rest = shapePose(ring, 0, 1000, 800, 0, 0);
    expect(rest.x).toBeCloseTo((ring.px + ring.ax * Math.sin(ring.ph)) * 1000);
    expect(rest.y).toBeCloseTo((ring.py + ring.ay * Math.cos(ring.ph * 1.3)) * 800);
    const shifted = shapePose(ring, 0, 1000, 800, 0.5, -0.5);
    expect(shifted.x - rest.x).toBeCloseTo(0.5 * DOT_FIELD_PARALLAX * ring.depth);
    expect(shifted.y - rest.y).toBeCloseTo(-0.5 * DOT_FIELD_PARALLAX * ring.depth);
    const hexagon = shape("hexagon");
    expect(shapePose(hexagon, 10, 1000, 800, 0, 0).angle).toBeCloseTo(hexagon.rot * 10);
  });

  it("paints a bloom and a crisp dot per cell after clearing the frame", () => {
    const ctx = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillStyle: "",
    };
    const constellations = buildConstellations([shape("disc")]);
    drawDotField(
      ctx as unknown as CanvasRenderingContext2D,
      constellations,
      0,
      800,
      600,
      0,
      0,
    );
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    const dots = (constellations[0]?.offsets.length ?? 0) / 2;
    expect(ctx.fill).toHaveBeenCalledTimes(dots * 2);
  });
});

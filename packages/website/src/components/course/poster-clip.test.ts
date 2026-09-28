import { describe, expect, it } from "vitest";
import {
  POSTER_CANVAS,
  posterComposition,
  type PosterNode,
  type ShapeRole,
} from "@/lib/plakat/motifs";
import { COURSE_PLAKAT, type CoursePlakatId } from "@/lib/plakat/palettes";
import {
  clipPosterComposition,
  posterPathBounds,
  posterPathHitTest,
  type PosterPoint,
} from "./poster-clip";

/** A shape of the original drawing as the browser paints it. */
interface PaintedShape {
  readonly role: ShapeRole;
  /** Root point to the shape's own units. */
  readonly toLocal: (point: PosterPoint) => PosterPoint;
  /** The viewport clip, in root units. */
  readonly clip: { readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number };
  readonly hit: (point: PosterPoint) => boolean;
}

/**
 * The uncut drawing, derived here on its own: each nested viewport places
 * its viewBox (uniform scale, aligned as preserveAspectRatio says) and
 * clips to its x, y, width and height, as SVG does.
 */
function paintedShapes(
  nodes: readonly PosterNode[],
  toLocal: (point: PosterPoint) => PosterPoint,
  clip: PaintedShape["clip"],
  toRoot: (point: PosterPoint) => PosterPoint,
): PaintedShape[] {
  const shapes: PaintedShape[] = [];
  for (const node of nodes) {
    if (node.kind === "shapes") {
      for (const shape of node.shapes) {
        shapes.push({ role: shape.role, toLocal, clip, hit: posterPathHitTest(shape.d) });
      }
    } else if (node.kind === "viewport") {
      const { x, y, width, height, viewBox, preserveAspectRatio } = node.viewport;
      expect(typeof x === "number" && typeof y === "number").toBe(true);
      const [vx, vy, vw, vh] = viewBox.split(" ").map(Number) as [number, number, number, number];
      const scale = Math.min(Number(width) / vw, Number(height) / vh);
      const align = preserveAspectRatio.split(" ")[0] as string;
      const factor = (part: string) => (part === "Min" ? 0 : part === "Mid" ? 0.5 : 1);
      const ox = Number(x) + (Number(width) - vw * scale) * factor(align.slice(1, 4)) - vx * scale;
      const oy = Number(y) + (Number(height) - vh * scale) * factor(align.slice(5, 8)) - vy * scale;
      const [x0, y0] = toRoot([Number(x), Number(y)]);
      const [x1, y1] = toRoot([Number(x) + Number(width), Number(y) + Number(height)]);
      shapes.push(
        ...paintedShapes(
          node.children,
          (point) => {
            const [lx, ly] = toLocal(point);
            return [(lx - ox) / scale, (ly - oy) / scale];
          },
          node.viewport.overflowVisible
            ? clip
            : {
                x0: Math.max(clip.x0, x0),
                y0: Math.max(clip.y0, y0),
                x1: Math.min(clip.x1, x1),
                y1: Math.min(clip.y1, y1),
              },
          (point) => toRoot([ox + point[0] * scale, oy + point[1] * scale]),
        ),
      );
    }
  }
  return shapes;
}

function paintedRole(shapes: readonly PaintedShape[], point: PosterPoint): ShapeRole | null {
  let role: ShapeRole | null = null;
  for (const shape of shapes) {
    const { clip } = shape;
    if (point[0] < clip.x0 || point[0] > clip.x1 || point[1] < clip.y0 || point[1] > clip.y1) continue;
    if (shape.hit(shape.toLocal(point))) role = shape.role;
  }
  return role;
}

const COURSE_IDS = Object.keys(COURSE_PLAKAT) as CoursePlakatId[];
const FORMATS = ["portrait", "landscape"] as const;

describe("poster path geometry", () => {
  it("measures arcs exactly", () => {
    // circle(300, 392, 168) and sector(0, 500, 330, 270, 360) as motifs.ts writes them.
    const circle = "M132 392a168 168 0 1 0 336 0a168 168 0 1 0 -336 0Z";
    const bounds = posterPathBounds(circle);
    expect(bounds?.x0).toBeCloseTo(132, 9);
    expect(bounds?.x1).toBeCloseTo(468, 9);
    expect(bounds?.y0).toBeCloseTo(224, 9);
    expect(bounds?.y1).toBeCloseTo(560, 9);
    const hit = posterPathHitTest(circle);
    expect(hit([300, 392])).toBe(true);
    expect(hit([467, 392])).toBe(true);
    expect(hit([469, 392])).toBe(false);
    expect(hit([300, 223])).toBe(false);

    const sector = "M0 500L0 170A330 330 0 0 1 330 500Z";
    const sectorBounds = posterPathBounds(sector);
    expect(sectorBounds?.x0).toBeCloseTo(0, 9);
    expect(sectorBounds?.x1).toBeCloseTo(330, 9);
    expect(sectorBounds?.y0).toBeCloseTo(170, 9);
    expect(sectorBounds?.y1).toBeCloseTo(500, 9);
    const inSector = posterPathHitTest(sector);
    expect(inSector([100, 400])).toBe(true);
    // Outside the quarter circle, inside its bounding box.
    expect(inSector([300, 200])).toBe(false);
  });
});

describe("clipPosterComposition", () => {
  for (const courseId of COURSE_IDS) {
    for (const format of FORMATS) {
      it(`cuts the ${courseId} ${format} poster to its viewBox and paints the same picture`, () => {
        const { plakat, motif, numeral } = COURSE_PLAKAT[courseId];
        const composition = posterComposition({ plakat, motif, numeral, format, cornerDots: false });
        const items = clipPosterComposition(composition);
        expect(items, "every course poster is clipped, none falls back").not.toBeNull();
        const { width, height } = POSTER_CANVAS[format];
        expect(composition.viewBox).toBe(`0 0 ${width} ${height}`);

        const shapes = (items ?? []).filter((item) => item.kind === "shape");
        for (const shape of shapes) {
          const bounds = posterPathBounds(shape.d);
          expect(bounds, shape.d).not.toBeNull();
          expect(bounds?.x0, shape.d).toBeGreaterThanOrEqual(-0.001);
          expect(bounds?.y0, shape.d).toBeGreaterThanOrEqual(-0.001);
          expect(bounds?.x1, shape.d).toBeLessThanOrEqual(width + 0.001);
          expect(bounds?.y1, shape.d).toBeLessThanOrEqual(height + 0.001);
        }
        // The ground now covers exactly the canvas.
        expect(posterPathBounds((shapes[0] as { d: string }).d)).toEqual({
          x0: 0,
          y0: 0,
          x1: width,
          y1: height,
        });

        // The numeral is PosterArt's, untouched.
        const numerals = (items ?? []).filter((item) => item.kind === "numeral");
        const originalNumerals = composition.children.filter((node) => node.kind === "numeral");
        expect(numerals.map(({ text, layout }) => ({ text, layout }))).toEqual(
          originalNumerals.map(({ text, layout }) => ({ text, layout })),
        );

        // Same role at every sample point of the canvas, in paint order.
        // Points within 0.05 units of an edge of the uncut drawing are
        // skipped: there the polyline hit test itself is approximate.
        const original = paintedShapes(
          composition.children,
          (point) => point,
          { x0: 0, y0: 0, x1: width, y1: height },
          (point) => point,
        );
        const clipped = shapes.map((shape) => ({ role: shape.role, hit: posterPathHitTest(shape.d) }));
        const clippedRole = (point: PosterPoint): ShapeRole | null => {
          let role: ShapeRole | null = null;
          for (const shape of clipped) if (shape.hit(point)) role = shape.role;
          return role;
        };
        let compared = 0;
        const mismatches: string[] = [];
        for (let x = 0.31; x < width; x += 4.7) {
          for (let y = 0.29; y < height; y += 4.3) {
            const role = paintedRole(original, [x, y]);
            const near = [
              [x + 0.05, y],
              [x - 0.05, y],
              [x, y + 0.05],
              [x, y - 0.05],
            ] as const;
            if (near.some((point) => paintedRole(original, point) !== role)) continue;
            compared += 1;
            if (clippedRole([x, y]) !== role) mismatches.push(`${x.toFixed(2)},${y.toFixed(2)}`);
          }
        }
        expect(compared).toBeGreaterThan(5000);
        expect(mismatches).toEqual([]);
      });
    }
  }

  it("leaves compositions it cannot place to the shared poster", () => {
    const strip = posterComposition({ plakat: "lemons", motif: "disc", numeral: "01", format: "strip" });
    expect(clipPosterComposition(strip)).toBeNull();
    // A workshop motif drawn with shape transforms (the oak leaves).
    const leaves = posterComposition({ plakat: "autumn", motif: "leaves", format: "portrait" });
    expect(clipPosterComposition(leaves)).toBeNull();
  });

  it("clips cubic and quadratic curves where they cross the canvas edge", () => {
    // W01's forecast fan: two cubic bands that run off the right edge.
    const fan = posterComposition({ plakat: "lemons", motif: "fan", format: "portrait", cornerDots: false });
    const items = clipPosterComposition(fan);
    expect(items).not.toBeNull();
    for (const item of items ?? []) {
      if (item.kind !== "shape") continue;
      const bounds = posterPathBounds(item.d);
      expect(bounds?.x1, item.d).toBeLessThanOrEqual(400.001);
      expect(bounds?.y1, item.d).toBeLessThanOrEqual(500.001);
    }
    const quad = clipPosterComposition({
      format: "portrait",
      viewBox: "0 0 400 500",
      preserveAspectRatio: "xMaxYMax meet",
      children: [{ kind: "shapes", shapes: [{ role: "ink", d: "M300 100Q600 250 300 400Z" }] }],
    });
    const quadShape = quad?.[0];
    expect(quadShape?.kind).toBe("shape");
    const quadBounds = posterPathBounds((quadShape as { d: string }).d);
    expect(quadBounds?.x1).toBeCloseTo(400, 6);
    expect(posterPathHitTest((quadShape as { d: string }).d)([390, 250])).toBe(true);
    // At y 150 the curve is at x 383.3; at y 250 it reached 450 before the cut.
    expect(posterPathHitTest((quadShape as { d: string }).d)([399.9, 150])).toBe(false);
    expect(posterPathHitTest((quadShape as { d: string }).d)([410, 250])).toBe(false);
  });
});

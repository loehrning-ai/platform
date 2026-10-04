/**
 * The /login dot field: a pure port of the reference renderer. Eight
 * dot-matrix shapes (ring, hexagon, triangle, square outline, asterisk, plus,
 * disc, filled square) are rasterized once onto the 14px dot grid of the
 * static background, then drift, rotate as rigid bodies and shift with the
 * cursor. Nothing here touches the DOM; `dot-field.tsx` owns the canvas, the
 * frame pacing and every pause condition.
 */

export type DotShapeKind =
  | "ring"
  | "hexagon"
  | "triangle"
  | "squareLine"
  | "asterisk"
  | "plus"
  | "disc"
  | "squareFill";

export interface DotShape {
  readonly kind: DotShapeKind;
  /** One flat, muted RGB colour per shape (no gradient). */
  readonly color: readonly [number, number, number];
  /** Per-shape opacity: sparse outlines get more, dense fills get less. */
  readonly a: number;
  /** Parallax factor: 0 stays still, 1 moves most with the cursor. */
  readonly depth: number;
  /** Radius or half-size in dots. */
  readonly Rd: number;
  /** Outline thickness in dots (ring, square outline, hexagon) or arm half-width (plus). */
  readonly thick?: number;
  /** Extra thickness: grows the cell set by its 8 neighbours this many times. */
  readonly dilate?: number;
  /** Number of spokes (asterisk). */
  readonly spokes?: number;
  /** Path centre as a fraction of the viewport. */
  readonly px: number;
  readonly py: number;
  /** Drift amplitude as a fraction of the viewport. */
  readonly ax: number;
  readonly ay: number;
  /** Drift frequency. */
  readonly fx: number;
  readonly fy: number;
  /** Phase offset. */
  readonly ph: number;
  /** Rotation in rad/s; 0 for the symmetric shapes. */
  readonly rot: number;
}

/** Dot pitch; matches the static background's 14px grid. */
export const DOT_FIELD_GRID = 14;
/** Colour dots are a little bigger than the background dots. */
export const DOT_FIELD_DOT_RADIUS = 2.3;
/** Fallback opacity for a shape without its own. */
export const DOT_FIELD_FLAT_ALPHA = 0.34;
/** Gentle translation speed. */
export const DOT_FIELD_SPEED = 1.15;
/** Maximum cursor-parallax shift in px at depth 1. */
export const DOT_FIELD_PARALLAX = 42;
/** About 30 frames per second. */
export const DOT_FIELD_FPS = 30;
export const DOT_FIELD_FRAME_MS = 1000 / DOT_FIELD_FPS;
/** Easing toward the cursor per frame (calm, never snappy). */
export const DOT_FIELD_CURSOR_EASE = 0.05;
/** Backing store cap, so a 3x phone does not paint 9x the pixels. */
export const DOT_FIELD_MAX_DPR = 2;

const TAU = Math.PI * 2;

/**
 * Curated four-colour palette (blue, violet, teal, amber), mixed fills and
 * outlines, most of them rotating slowly in mixed directions.
 */
export const DOT_FIELD_SHAPES: readonly DotShape[] = [
  { kind: "ring", color: [130, 175, 235], a: 0.42, depth: 0.95, Rd: 9, thick: 2, dilate: 1, px: 0.83, py: 0.24, ax: 0.05, ay: 0.06, fx: 0.05, fy: 0.08, ph: 0.0, rot: 0 },
  { kind: "hexagon", color: [175, 158, 232], a: 0.4, depth: 0.6, Rd: 7, thick: 1, dilate: 1, px: 0.87, py: 0.55, ax: 0.05, ay: 0.06, fx: 0.072, fy: 0.052, ph: 1.1, rot: 0.028 },
  { kind: "triangle", color: [124, 200, 184], a: 0.24, depth: 0.5, Rd: 7, px: 0.85, py: 0.85, ax: 0.05, ay: 0.04, fx: 0.061, fy: 0.07, ph: 0.6, rot: 0.045 },
  { kind: "squareLine", color: [175, 158, 232], a: 0.42, depth: 0.85, Rd: 10, thick: 1, dilate: 1, px: 0.17, py: 0.25, ax: 0.05, ay: 0.07, fx: 0.05, fy: 0.085, ph: 2.3, rot: -0.035 },
  { kind: "asterisk", color: [140, 180, 235], a: 0.4, depth: 1.0, Rd: 11, spokes: 8, dilate: 1, px: 0.17, py: 0.6, ax: 0.05, ay: 0.07, fx: 0.066, fy: 0.06, ph: 3.5, rot: 0.025 },
  { kind: "plus", color: [124, 200, 186], a: 0.27, depth: 0.55, Rd: 7, thick: 2, px: 0.14, py: 0.85, ax: 0.05, ay: 0.05, fx: 0.07, fy: 0.09, ph: 5.0, rot: -0.05 },
  { kind: "disc", color: [232, 196, 142], a: 0.27, depth: 0.4, Rd: 6, px: 0.5, py: 0.11, ax: 0.08, ay: 0.04, fx: 0.045, fy: 0.094, ph: 4.6, rot: 0 },
  { kind: "squareFill", color: [230, 190, 140], a: 0.22, depth: 0.45, Rd: 6, px: 0.5, py: 0.88, ax: 0.08, ay: 0.04, fx: 0.055, fy: 0.08, ph: 2.0, rot: 0.04 },
];

/** A set of integer dot cells, keyed so each cell is stored once. */
type CellMap = Map<string, readonly [number, number]>;

function addCell(map: CellMap, i: number, j: number): void {
  // Normalise -0 so "0_0" and "-0_0" never become two cells.
  const x = i === 0 ? 0 : i;
  const y = j === 0 ? 0 : j;
  map.set(`${x}_${y}`, [x, y]);
}

/** Samples a line into grid cells. */
function lineCells(
  map: CellMap,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
  for (let s = 0; s <= steps; s++) {
    const u = s / steps;
    addCell(map, Math.round(x0 + (x1 - x0) * u), Math.round(y0 + (y1 - y0) * u));
  }
}

/** Thickens a cell set by its 8 neighbours, n times. */
function dilate(map: CellMap, n: number): void {
  for (let iteration = 0; iteration < n; iteration++) {
    const add: CellMap = new Map();
    for (const [a, b] of map.values()) {
      addCell(add, a + 1, b);
      addCell(add, a - 1, b);
      addCell(add, a, b + 1);
      addCell(add, a, b - 1);
      addCell(add, a + 1, b + 1);
      addCell(add, a - 1, b - 1);
      addCell(add, a + 1, b - 1);
      addCell(add, a - 1, b + 1);
    }
    for (const [key, cell] of add) map.set(key, cell);
  }
}

/**
 * Rasterizes one shape at angle `ang` into integer dot offsets from its
 * centre: circles by angle sampling (round, never octagonal), the asterisk
 * from real line spokes, outlines from their edges.
 */
export function shapeCells(
  shape: DotShape,
  ang: number,
): readonly (readonly [number, number])[] {
  const map: CellMap = new Map();
  const R = shape.Rd;
  const c = Math.cos(ang);
  const sn = Math.sin(ang);
  // Rotates (i, j) by -ang into the shape's upright frame.
  const loc = (i: number, j: number): readonly [number, number] => [
    i * c + j * sn,
    -i * sn + j * c,
  ];

  switch (shape.kind) {
    case "disc": {
      for (let i = -R; i <= R; i++) {
        for (let j = -R; j <= R; j++) {
          if (i * i + j * j <= R * R + 0.4) addCell(map, i, j);
        }
      }
      break;
    }
    case "ring": {
      const th = shape.thick ?? 1;
      for (let rr = R - th + 1; rr <= R; rr++) {
        const n = Math.max(16, Math.round(rr * 8));
        for (let q = 0; q < n; q++) {
          const a = (q / n) * TAU;
          addCell(map, Math.round(rr * Math.cos(a)), Math.round(rr * Math.sin(a)));
        }
      }
      break;
    }
    case "squareLine": {
      const th = shape.thick ?? 1;
      for (let o = 0; o < th; o++) {
        const Q = R - o;
        const p1 = [Q * c - Q * sn, Q * sn + Q * c] as const;
        const p2 = [Q * c + Q * sn, Q * sn - Q * c] as const;
        lineCells(map, p1[0], p1[1], p2[0], p2[1]);
        lineCells(map, p2[0], p2[1], -p1[0], -p1[1]);
        lineCells(map, -p1[0], -p1[1], -p2[0], -p2[1]);
        lineCells(map, -p2[0], -p2[1], p1[0], p1[1]);
      }
      break;
    }
    case "hexagon": {
      const th = shape.thick ?? 1;
      for (let o = 0; o < th; o++) {
        const Q = R - o;
        const vertices: (readonly [number, number])[] = [];
        for (let v = 0; v < 6; v++) {
          const a = (v * TAU) / 6;
          vertices.push([Q * Math.cos(a), Q * Math.sin(a)]);
        }
        for (let w = 0; w < 6; w++) {
          const from = vertices[w];
          const to = vertices[(w + 1) % 6];
          if (from && to) lineCells(map, from[0], from[1], to[0], to[1]);
        }
      }
      break;
    }
    case "squareFill": {
      for (let i = -R; i <= R; i++) {
        for (let j = -R; j <= R; j++) {
          const [x, y] = loc(i, j);
          if (Math.max(Math.abs(x), Math.abs(y)) <= R + 0.4) addCell(map, i, j);
        }
      }
      break;
    }
    case "triangle": {
      for (let i = -R; i <= R; i++) {
        for (let j = -R; j <= R; j++) {
          const [x, y] = loc(i, j);
          if (y >= -R - 0.4 && y <= 0.6 * R + 0.4) {
            const halfWidth = ((y + R) / (1.6 * R)) * 0.92 * R;
            if (Math.abs(x) <= halfWidth + 0.4) addCell(map, i, j);
          }
        }
      }
      break;
    }
    case "plus": {
      const arm = shape.thick ?? 2;
      for (let i = -R; i <= R; i++) {
        for (let j = -R; j <= R; j++) {
          const [x, y] = loc(i, j);
          if (
            (Math.abs(x) <= arm || Math.abs(y) <= arm) &&
            Math.max(Math.abs(x), Math.abs(y)) <= R + 0.4
          ) {
            addCell(map, i, j);
          }
        }
      }
      break;
    }
    case "asterisk": {
      const spokes = shape.spokes ?? 8;
      for (let k = 0; k < spokes; k++) {
        const a = ang + (k / spokes) * TAU;
        lineCells(map, 0, 0, R * Math.cos(a), R * Math.sin(a));
      }
      addCell(map, 0, 0);
      break;
    }
  }

  if (shape.dilate) dilate(map, shape.dilate);
  return [...map.values()];
}

/** A shape with its rigid constellation: pixel offsets from its centre. */
export interface DotConstellation {
  readonly shape: DotShape;
  /** Flat [x0, y0, x1, y1, ...] pixel offsets, rasterized once at angle 0. */
  readonly offsets: Float32Array;
  readonly core: string;
  readonly halo: string;
}

/**
 * Builds each shape's constellation once. Afterwards it only translates and
 * rotates as a solid body, so it never morphs, flickers or turns into another
 * shape: the same dots always move together.
 */
export function buildConstellations(
  shapes: readonly DotShape[] = DOT_FIELD_SHAPES,
): readonly DotConstellation[] {
  return shapes.map((shape) => {
    const cells = shapeCells(shape, 0);
    const offsets = new Float32Array(cells.length * 2);
    cells.forEach(([i, j], index) => {
      offsets[index * 2] = i * DOT_FIELD_GRID;
      offsets[index * 2 + 1] = j * DOT_FIELD_GRID;
    });
    const alpha = shape.a || DOT_FIELD_FLAT_ALPHA;
    const [r, g, b] = shape.color;
    return {
      shape,
      offsets,
      core: `rgba(${r},${g},${b},${alpha})`,
      halo: `rgba(${r},${g},${b},${(alpha * 0.22).toFixed(3)})`,
    };
  });
}

/** Where a shape's centre sits and how far it has turned at time t (s). */
export function shapePose(
  shape: DotShape,
  t: number,
  width: number,
  height: number,
  cursorX: number,
  cursorY: number,
): { readonly x: number; readonly y: number; readonly angle: number } {
  const depth = shape.depth;
  // Smooth glide plus cursor parallax by depth layer; no snapping, so no jitter.
  const x =
    (shape.px + shape.ax * Math.sin(t * shape.fx * DOT_FIELD_SPEED + shape.ph)) *
      width +
    cursorX * DOT_FIELD_PARALLAX * depth;
  const y =
    (shape.py +
      shape.ay * Math.cos(t * shape.fy * DOT_FIELD_SPEED + shape.ph * 1.3)) *
      height +
    cursorY * DOT_FIELD_PARALLAX * depth;
  return { x, y, angle: shape.rot * t };
}

/** Draws one frame: a subtle bloom and a crisp dot per constellation cell. */
export function drawDotField(
  ctx: CanvasRenderingContext2D,
  constellations: readonly DotConstellation[],
  t: number,
  width: number,
  height: number,
  cursorX: number,
  cursorY: number,
): void {
  ctx.clearRect(0, 0, width, height);
  for (const constellation of constellations) {
    const { x, y, angle } = shapePose(
      constellation.shape,
      t,
      width,
      height,
      cursorX,
      cursorY,
    );
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const offsets = constellation.offsets;
    for (let d = 0; d < offsets.length; d += 2) {
      const ox = offsets[d] ?? 0;
      const oy = offsets[d + 1] ?? 0;
      const X = x + ox * ca - oy * sa;
      const Y = y + ox * sa + oy * ca;
      ctx.fillStyle = constellation.halo;
      ctx.beginPath();
      ctx.arc(X, Y, DOT_FIELD_DOT_RADIUS * 1.7, 0, TAU);
      ctx.fill();
      ctx.fillStyle = constellation.core;
      ctx.beginPath();
      ctx.arc(X, Y, DOT_FIELD_DOT_RADIUS, 0, TAU);
      ctx.fill();
    }
  }
}

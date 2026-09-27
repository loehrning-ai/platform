import type {
  NumeralLayout,
  PosterComposition,
  PosterNode,
  PosterViewport,
  ShapeRole,
} from "@/lib/plakat/motifs";

/**
 * A poster composition cut to its own canvas, as geometry.
 *
 * The shared poster (components/plakat/poster-art.tsx) lets shapes run past
 * the canvas and leaves the cut to the SVG viewport: the ground is a
 * 4800-unit square, motifs bleed off the right and bottom edges, and the
 * landscape motif sits in a nested viewport that ends 20 units past the
 * canvas. That paints right, but a browser keeps each shape's full box
 * (getBoundingClientRect ignores SVG viewports and clip paths), so a
 * full-bleed band poster reports boxes far past the page edge.
 *
 * clipPosterComposition() draws the same picture with every shape clipped
 * to the canvas it is painted on: each closed subpath is cut against the
 * viewBox (and a nested viewport) one edge at a time, arcs and Béziers are
 * split exactly where they cross an edge, and the cut follows that edge.
 * A nested viewport's placement is applied to the coordinates, so every box
 * sits inside the root viewBox. What was hidden is gone; what showed is
 * drawn with the same curves.
 *
 * The cut is the viewBox, not a letterbox around it: with `meet`, the band
 * shows the root `<svg>`'s own scene background there, the ground colour.
 *
 * Supported input: M L H V Z A C Q (absolute and relative) on shapes
 * without a `transform`, numeric nested viewports, and numerals at the root.
 * Anything else returns null, and the caller draws the shared poster.
 */

type Point = readonly [x: number, y: number];

interface LineSegment {
  readonly kind: "line";
  readonly from: Point;
  readonly to: Point;
}

/** An elliptical arc in centre form (SVG 1.1 F.6.5); angles in radians. */
interface ArcSegment {
  readonly kind: "arc";
  readonly from: Point;
  readonly to: Point;
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly phi: number;
  readonly theta: number;
  readonly delta: number;
}

interface CubicSegment {
  readonly kind: "cubic";
  readonly from: Point;
  readonly c1: Point;
  readonly c2: Point;
  readonly to: Point;
}

interface QuadSegment {
  readonly kind: "quad";
  readonly from: Point;
  readonly c: Point;
  readonly to: Point;
}

type Segment = LineSegment | ArcSegment | CubicSegment | QuadSegment;

/** A closed subpath: each segment starts where the one before it ends. */
type Subpath = readonly Segment[];

/** Uniform scale then translate: p' = scale * p + (tx, ty). */
interface Placement {
  readonly scale: number;
  readonly tx: number;
  readonly ty: number;
}

interface Box {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

interface Edge {
  readonly axis: 0 | 1;
  readonly value: number;
  /** Keep the side below (x <= value) or above (x >= value) the edge. */
  readonly keep: "below" | "above";
}

export type { Box as PosterBox, Point as PosterPoint };

export type ClippedPosterItem =
  | { readonly kind: "shape"; readonly role: ShapeRole; readonly d: string }
  | { readonly kind: "numeral"; readonly text: string; readonly layout: NumeralLayout };

class UnsupportedGeometry extends Error {}

const IDENTITY: Placement = { scale: 1, tx: 0, ty: 0 };
/** Canvas units; coordinates are at most a few thousand. */
const EPSILON = 1e-7;
const TAU = Math.PI * 2;

// ─── Parsing ────────────────────────────────────────────────────────────────

const TOKEN = /[MmLlHhVvZzAaCcQq]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;
const COMMAND = /^[A-Za-z]$/;

function samePoint(a: Point, b: Point): boolean {
  return Math.abs(a[0] - b[0]) <= EPSILON && Math.abs(a[1] - b[1]) <= EPSILON;
}

function line(from: Point, to: Point): LineSegment {
  return { kind: "line", from, to };
}

function vectorAngle(ux: number, uy: number, vx: number, vy: number): number {
  return Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
}

/** Endpoint arc parameters to centre form, as SVG 1.1 F.6.5 and F.6.6 define it. */
function arcSegment(
  from: Point,
  to: Point,
  rxIn: number,
  ryIn: number,
  degrees: number,
  largeArc: boolean,
  sweep: boolean,
): Segment | null {
  if (samePoint(from, to)) return null;
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx === 0 || ry === 0) return line(from, to);
  const phi = (degrees * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (from[0] - to[0]) / 2;
  const dy = (from[1] - to[1]) / 2;
  const x1 = cos * dx + sin * dy;
  const y1 = -sin * dx + cos * dy;
  const lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const numerator = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const denominator = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const coefficient =
    Math.sqrt(Math.max(0, numerator / denominator)) * (largeArc === sweep ? -1 : 1);
  const cxPrime = (coefficient * rx * y1) / ry;
  const cyPrime = (-coefficient * ry * x1) / rx;
  const cx = cos * cxPrime - sin * cyPrime + (from[0] + to[0]) / 2;
  const cy = sin * cxPrime + cos * cyPrime + (from[1] + to[1]) / 2;
  const ux = (x1 - cxPrime) / rx;
  const uy = (y1 - cyPrime) / ry;
  const vx = (-x1 - cxPrime) / rx;
  const vy = (-y1 - cyPrime) / ry;
  const theta = vectorAngle(1, 0, ux, uy);
  let delta = vectorAngle(ux, uy, vx, vy);
  if (!sweep && delta > 0) delta -= TAU;
  if (sweep && delta < 0) delta += TAU;
  return { kind: "arc", from, to, cx, cy, rx, ry, phi, theta, delta };
}

/** A path's closed subpaths. An open subpath is closed, as a fill closes it. */
function parsePath(d: string): Subpath[] {
  if (d.replace(TOKEN, "").replace(/[\s,]/g, "") !== "") {
    throw new UnsupportedGeometry(`Unsupported path data: ${d}`);
  }
  const tokens = d.match(TOKEN) ?? [];
  const subpaths: Subpath[] = [];
  let segments: Segment[] = [];
  let point: Point = [0, 0];
  let start: Point = [0, 0];
  let command = "";
  let index = 0;

  const number = (): number => {
    const token = tokens[index];
    if (token === undefined || COMMAND.test(token)) {
      throw new UnsupportedGeometry(`Missing number in path data: ${d}`);
    }
    index += 1;
    return Number(token);
  };
  const flag = (): boolean => {
    const value = number();
    if (value !== 0 && value !== 1) throw new UnsupportedGeometry(`Arc flag ${value} in ${d}`);
    return value === 1;
  };
  const close = () => {
    if (segments.length > 0) {
      if (!samePoint(point, start)) segments.push(line(point, start));
      subpaths.push(segments);
    }
    segments = [];
    point = start;
  };
  const push = (segment: Segment | null, to: Point) => {
    if (segment) segments.push(segment);
    point = to;
  };

  while (index < tokens.length) {
    const token = tokens[index] as string;
    if (COMMAND.test(token)) {
      command = token;
      index += 1;
    } else if (command === "" || command === "Z" || command === "z") {
      throw new UnsupportedGeometry(`Stray number in path data: ${d}`);
    }
    const relative = command === command.toLowerCase();
    const ox = relative ? point[0] : 0;
    const oy = relative ? point[1] : 0;
    switch (command.toUpperCase()) {
      case "M": {
        close();
        const to: Point = [ox + number(), oy + number()];
        point = to;
        start = to;
        // Further pairs after a moveto are linetos.
        command = relative ? "l" : "L";
        break;
      }
      case "L": {
        const to: Point = [ox + number(), oy + number()];
        push(samePoint(point, to) ? null : line(point, to), to);
        break;
      }
      case "H": {
        const to: Point = [ox + number(), point[1]];
        push(samePoint(point, to) ? null : line(point, to), to);
        break;
      }
      case "V": {
        const to: Point = [point[0], oy + number()];
        push(samePoint(point, to) ? null : line(point, to), to);
        break;
      }
      case "A": {
        const rx = number();
        const ry = number();
        const degrees = number();
        const largeArc = flag();
        const sweep = flag();
        const to: Point = [ox + number(), oy + number()];
        push(arcSegment(point, to, rx, ry, degrees, largeArc, sweep), to);
        break;
      }
      case "C": {
        const c1: Point = [ox + number(), oy + number()];
        const c2: Point = [ox + number(), oy + number()];
        const to: Point = [ox + number(), oy + number()];
        push({ kind: "cubic", from: point, c1, c2, to }, to);
        break;
      }
      case "Q": {
        const c: Point = [ox + number(), oy + number()];
        const to: Point = [ox + number(), oy + number()];
        push({ kind: "quad", from: point, c, to }, to);
        break;
      }
      case "Z":
        close();
        break;
      default:
        throw new UnsupportedGeometry(`Unsupported path command ${command} in ${d}`);
    }
  }
  close();
  return subpaths;
}

// ─── Evaluation ─────────────────────────────────────────────────────────────

function arcPoint(arc: ArcSegment, angle: number): Point {
  const cos = Math.cos(arc.phi);
  const sin = Math.sin(arc.phi);
  const x = arc.rx * Math.cos(angle);
  const y = arc.ry * Math.sin(angle);
  return [arc.cx + cos * x - sin * y, arc.cy + sin * x + cos * y];
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mixPoint(a: Point, b: Point, t: number): Point {
  return [mix(a[0], b[0], t), mix(a[1], b[1], t)];
}

function segmentPoint(segment: Segment, t: number): Point {
  switch (segment.kind) {
    case "line":
      return mixPoint(segment.from, segment.to, t);
    case "arc":
      return arcPoint(segment, segment.theta + segment.delta * t);
    case "quad":
      return mixPoint(mixPoint(segment.from, segment.c, t), mixPoint(segment.c, segment.to, t), t);
    case "cubic": {
      const a = mixPoint(segment.from, segment.c1, t);
      const b = mixPoint(segment.c1, segment.c2, t);
      const c = mixPoint(segment.c2, segment.to, t);
      return mixPoint(mixPoint(a, b, t), mixPoint(b, c, t), t);
    }
  }
}

/** Roots of a t^2 + b t + c in (0, 1). */
function unitQuadraticRoots(a: number, b: number, c: number): number[] {
  if (Math.abs(a) < 1e-12) {
    return Math.abs(b) < 1e-12 ? [] : [-c / b].filter((t) => t > 0 && t < 1);
  }
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return [];
  const root = Math.sqrt(discriminant);
  return [(-b - root) / (2 * a), (-b + root) / (2 * a)].filter((t) => t > 0 && t < 1);
}

/** Parameters in (0, 1) where an arc's coordinate on `axis` is stationary (ends excluded). */
function arcExtremeParameters(arc: ArcSegment, axis: 0 | 1): number[] {
  const cos = Math.cos(arc.phi);
  const sin = Math.sin(arc.phi);
  // coordinate(θ) = centre + A cos θ + B sin θ; stationary where tan θ = B / A.
  const a = axis === 0 ? arc.rx * cos : arc.rx * sin;
  const b = axis === 0 ? -arc.ry * sin : arc.ry * cos;
  const base = Math.atan2(b, a);
  return arcParameters(arc, [base, base + Math.PI]);
}

/** The arc parameters t in (0, 1) at which the arc passes these angles. */
function arcParameters(arc: ArcSegment, angles: readonly number[]): number[] {
  const parameters: number[] = [];
  for (const angle of angles) {
    for (let turn = -2; turn <= 2; turn += 1) {
      const t = (angle + turn * TAU - arc.theta) / arc.delta;
      if (t > EPSILON && t < 1 - EPSILON) parameters.push(t);
    }
  }
  return parameters;
}

/** Parameters in (0, 1) where a Bézier's coordinate on `axis` is stationary. */
function bezierExtremeParameters(segment: CubicSegment | QuadSegment, axis: 0 | 1): number[] {
  if (segment.kind === "quad") {
    const p0 = segment.from[axis];
    const p1 = segment.c[axis];
    const p2 = segment.to[axis];
    return unitQuadraticRoots(0, 2 * (p0 - 2 * p1 + p2), 2 * (p1 - p0));
  }
  const p0 = segment.from[axis];
  const p1 = segment.c1[axis];
  const p2 = segment.c2[axis];
  const p3 = segment.to[axis];
  return unitQuadraticRoots(-p0 + 3 * p1 - 3 * p2 + p3, 2 * (p0 - 2 * p1 + p2), p1 - p0);
}

function segmentBounds(segment: Segment): Box {
  const points: Point[] = [segment.from, segment.to];
  if (segment.kind !== "line") {
    for (const axis of [0, 1] as const) {
      const parameters =
        segment.kind === "arc"
          ? arcExtremeParameters(segment, axis)
          : bezierExtremeParameters(segment, axis);
      for (const t of parameters) points.push(segmentPoint(segment, t));
    }
  }
  return {
    x0: Math.min(...points.map((point) => point[0])),
    y0: Math.min(...points.map((point) => point[1])),
    x1: Math.max(...points.map((point) => point[0])),
    y1: Math.max(...points.map((point) => point[1])),
  };
}

function unionBounds(boxes: readonly Box[]): Box | null {
  if (boxes.length === 0) return null;
  return {
    x0: Math.min(...boxes.map((box) => box.x0)),
    y0: Math.min(...boxes.map((box) => box.y0)),
    x1: Math.max(...boxes.map((box) => box.x1)),
    y1: Math.max(...boxes.map((box) => box.y1)),
  };
}

function subpathBounds(subpath: Subpath): Box | null {
  return unionBounds(subpath.map(segmentBounds));
}

function insideBox(inner: Box, outer: Box): boolean {
  return (
    inner.x0 >= outer.x0 - EPSILON &&
    inner.y0 >= outer.y0 - EPSILON &&
    inner.x1 <= outer.x1 + EPSILON &&
    inner.y1 <= outer.y1 + EPSILON
  );
}

// ─── Placement ──────────────────────────────────────────────────────────────

function placePoint(point: Point, placement: Placement): Point {
  return [placement.scale * point[0] + placement.tx, placement.scale * point[1] + placement.ty];
}

function placeSegment(segment: Segment, placement: Placement): Segment {
  if (placement === IDENTITY) return segment;
  const from = placePoint(segment.from, placement);
  const to = placePoint(segment.to, placement);
  switch (segment.kind) {
    case "line":
      return { kind: "line", from, to };
    case "arc": {
      const [cx, cy] = placePoint([segment.cx, segment.cy], placement);
      return {
        ...segment,
        from,
        to,
        cx,
        cy,
        rx: segment.rx * placement.scale,
        ry: segment.ry * placement.scale,
      };
    }
    case "quad":
      return { kind: "quad", from, c: placePoint(segment.c, placement), to };
    case "cubic":
      return {
        kind: "cubic",
        from,
        c1: placePoint(segment.c1, placement),
        c2: placePoint(segment.c2, placement),
        to,
      };
  }
}

function compose(outer: Placement, inner: Placement): Placement {
  return {
    scale: outer.scale * inner.scale,
    tx: outer.scale * inner.tx + outer.tx,
    ty: outer.scale * inner.ty + outer.ty,
  };
}

function placeBox(box: Box, placement: Placement): Box {
  const [x0, y0] = placePoint([box.x0, box.y0], placement);
  const [x1, y1] = placePoint([box.x1, box.y1], placement);
  return { x0, y0, x1, y1 };
}

function intersectBoxes(a: Box, b: Box): Box {
  return {
    x0: Math.max(a.x0, b.x0),
    y0: Math.max(a.y0, b.y0),
    x1: Math.min(a.x1, b.x1),
    y1: Math.min(a.y1, b.y1),
  };
}

function parseViewBox(viewBox: string | null): Box | null {
  const values = viewBox?.trim().split(/[\s,]+/).map(Number);
  if (!values || values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    return null;
  }
  const [x, y, width, height] = values as [number, number, number, number];
  if (width <= 0 || height <= 0) return null;
  return { x0: x, y0: y, x1: x + width, y1: y + height };
}

function numeric(value: number | string): number {
  if (typeof value !== "number") {
    throw new UnsupportedGeometry(`Non-numeric viewport length ${value}`);
  }
  return value;
}

/** The viewport rectangle in its parent's units, and how it places its viewBox. */
function viewportPlacement(viewport: PosterViewport): { readonly box: Box; readonly placement: Placement } {
  const x = numeric(viewport.x);
  const y = numeric(viewport.y);
  const width = numeric(viewport.width);
  const height = numeric(viewport.height);
  const viewBox = parseViewBox(viewport.viewBox);
  if (!viewBox) throw new UnsupportedGeometry(`Unsupported viewBox ${viewport.viewBox}`);
  const boxWidth = viewBox.x1 - viewBox.x0;
  const boxHeight = viewBox.y1 - viewBox.y0;
  const scaleX = width / boxWidth;
  const scaleY = height / boxHeight;
  const [align = "xMidYMid", fit = "meet"] = viewport.preserveAspectRatio.trim().split(/\s+/);
  let scale: number;
  if (align === "none") {
    if (Math.abs(scaleX - scaleY) > EPSILON) {
      throw new UnsupportedGeometry("A non-uniform viewport scale bends arcs");
    }
    scale = scaleX;
  } else {
    scale = fit === "slice" ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
  }
  const alignment = (axis: "x" | "y"): number => {
    const part = axis === "x" ? align.slice(1, 4) : align.slice(5, 8);
    if (align === "none" || part === "Min") return 0;
    if (part === "Mid") return 0.5;
    if (part === "Max") return 1;
    throw new UnsupportedGeometry(`Unsupported preserveAspectRatio ${viewport.preserveAspectRatio}`);
  };
  return {
    box: { x0: x, y0: y, x1: x + width, y1: y + height },
    placement: {
      scale,
      tx: x - viewBox.x0 * scale + (width - boxWidth * scale) * alignment("x"),
      ty: y - viewBox.y0 * scale + (height - boxHeight * scale) * alignment("y"),
    },
  };
}

// ─── Clipping ───────────────────────────────────────────────────────────────

function edgeDistance(point: Point, edge: Edge): number {
  return edge.keep === "below" ? edge.value - point[edge.axis] : point[edge.axis] - edge.value;
}

/** Parameters in (0, 1) at which a segment crosses the edge's line. */
function crossingParameters(segment: Segment, edge: Edge): number[] {
  const axis = edge.axis;
  const value = edge.value;
  switch (segment.kind) {
    case "line": {
      const a = segment.from[axis] - value;
      const b = segment.to[axis] - value;
      return a * b < 0 ? [a / (a - b)] : [];
    }
    case "arc": {
      const cos = Math.cos(segment.phi);
      const sin = Math.sin(segment.phi);
      const a = axis === 0 ? segment.rx * cos : segment.rx * sin;
      const b = axis === 0 ? -segment.ry * sin : segment.ry * cos;
      const radius = Math.hypot(a, b);
      const offset = value - (axis === 0 ? segment.cx : segment.cy);
      if (radius === 0 || Math.abs(offset) > radius) return [];
      const base = Math.atan2(b, a);
      const spread = Math.acos(Math.min(1, Math.max(-1, offset / radius)));
      return arcParameters(segment, [base - spread, base + spread]);
    }
    case "quad": {
      const p0 = segment.from[axis] - value;
      const p1 = segment.c[axis] - value;
      const p2 = segment.to[axis] - value;
      return unitQuadraticRoots(p0 - 2 * p1 + p2, 2 * (p1 - p0), p0);
    }
    case "cubic": {
      // Sign changes on a fine grid, refined by bisection.
      const f = (t: number) => segmentPoint(segment, t)[axis] - value;
      const steps = 64;
      const roots: number[] = [];
      for (let step = 0; step < steps; step += 1) {
        let low = step / steps;
        let high = (step + 1) / steps;
        let fLow = f(low);
        const fHigh = f(high);
        if (fLow === 0 && step > 0) roots.push(low);
        if (fLow * fHigh >= 0) continue;
        for (let iteration = 0; iteration < 60; iteration += 1) {
          const middle = (low + high) / 2;
          const fMiddle = f(middle);
          if (fLow * fMiddle <= 0) {
            high = middle;
          } else {
            low = middle;
            fLow = fMiddle;
          }
        }
        roots.push((low + high) / 2);
      }
      return roots.filter((t) => t > EPSILON && t < 1 - EPSILON);
    }
  }
}

function subCubic(segment: CubicSegment, t: number): [CubicSegment, CubicSegment] {
  const a = mixPoint(segment.from, segment.c1, t);
  const b = mixPoint(segment.c1, segment.c2, t);
  const c = mixPoint(segment.c2, segment.to, t);
  const ab = mixPoint(a, b, t);
  const bc = mixPoint(b, c, t);
  const middle = mixPoint(ab, bc, t);
  return [
    { kind: "cubic", from: segment.from, c1: a, c2: ab, to: middle },
    { kind: "cubic", from: middle, c1: bc, c2: c, to: segment.to },
  ];
}

function subQuad(segment: QuadSegment, t: number): [QuadSegment, QuadSegment] {
  const a = mixPoint(segment.from, segment.c, t);
  const b = mixPoint(segment.c, segment.to, t);
  const middle = mixPoint(a, b, t);
  return [
    { kind: "quad", from: segment.from, c: a, to: middle },
    { kind: "quad", from: middle, c: b, to: segment.to },
  ];
}

/** The part of a segment between parameters t0 and t1, with the given ends. */
function segmentPart(segment: Segment, t0: number, t1: number, from: Point, to: Point): Segment {
  switch (segment.kind) {
    case "line":
      return { kind: "line", from, to };
    case "arc":
      return {
        ...segment,
        from,
        to,
        theta: segment.theta + segment.delta * t0,
        delta: segment.delta * (t1 - t0),
      };
    case "quad": {
      const [, tail] = subQuad(segment, t0);
      const [part] = subQuad(tail, t0 < 1 ? (t1 - t0) / (1 - t0) : 1);
      return { ...part, from, to };
    }
    case "cubic": {
      const [, tail] = subCubic(segment, t0);
      const [part] = subCubic(tail, t0 < 1 ? (t1 - t0) / (1 - t0) : 1);
      return { ...part, from, to };
    }
  }
}

/** A segment split where it crosses the edge's line; split points sit exactly on it. */
function splitAtEdge(segment: Segment, edge: Edge): Segment[] {
  const parameters = [...new Set(crossingParameters(segment, edge))].sort((a, b) => a - b);
  if (parameters.length === 0) return [segment];
  const onEdge = (point: Point): Point =>
    edge.axis === 0 ? [edge.value, point[1]] : [point[0], edge.value];
  const cuts = [0, ...parameters, 1];
  const points: Point[] = cuts.map((t, index) =>
    index === 0 ? segment.from : index === cuts.length - 1 ? segment.to : onEdge(segmentPoint(segment, t)),
  );
  const parts: Segment[] = [];
  for (let index = 0; index < cuts.length - 1; index += 1) {
    parts.push(
      segmentPart(
        segment,
        cuts[index] as number,
        cuts[index + 1] as number,
        points[index] as Point,
        points[index + 1] as Point,
      ),
    );
  }
  return parts;
}

/**
 * One closed subpath against one edge (Sutherland-Hodgman, with curves split
 * at the edge): the parts on the kept side stay in order, and each gap left
 * by a dropped part is closed along the edge, from where the outline left
 * the kept side to where it comes back. Returns the same subpath when
 * nothing is cut, and null when nothing is left.
 */
function clipAgainstEdge(subpath: Subpath, edge: Edge): Subpath | null {
  const parts = subpath.flatMap((segment) => splitAtEdge(segment, edge));
  const kept = parts.map((part) => edgeDistance(segmentPoint(part, 0.5), edge) >= -EPSILON);
  if (kept.every(Boolean)) return subpath;
  if (!kept.some(Boolean)) return null;
  // Start at a part that follows a dropped one, so each bridge closes a gap.
  const first = kept.findIndex((isKept, index) => isKept && !kept[(index + parts.length - 1) % parts.length]);
  const result: Segment[] = [];
  for (let offset = 0; offset < parts.length; offset += 1) {
    const index = (first + offset) % parts.length;
    const part = parts[index] as Segment;
    if (!kept[index]) continue;
    const previous = result.at(-1);
    if (previous && !samePoint(previous.to, part.from)) result.push(line(previous.to, part.from));
    result.push(part);
  }
  const last = result.at(-1) as Segment;
  const start = (result[0] as Segment).from;
  if (!samePoint(last.to, start)) result.push(line(last.to, start));
  return result;
}

function clipSubpath(subpath: Subpath, box: Box): Subpath | null {
  const bounds = subpathBounds(subpath);
  if (!bounds) return null;
  if (insideBox(bounds, box)) return subpath;
  const edges: readonly Edge[] = [
    { axis: 0, value: box.x0, keep: "above" },
    { axis: 0, value: box.x1, keep: "below" },
    { axis: 1, value: box.y0, keep: "above" },
    { axis: 1, value: box.y1, keep: "below" },
  ];
  let current: Subpath | null = subpath;
  for (const edge of edges) {
    current = clipAgainstEdge(current, edge);
    if (!current) return null;
  }
  return current;
}

// ─── Output ─────────────────────────────────────────────────────────────────

/** Two decimals, one finer than the motifs themselves. */
function format(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function formatPoint(point: Point): string {
  return `${format(point[0])} ${format(point[1])}`;
}

function serializeSegment(segment: Segment): string {
  switch (segment.kind) {
    case "line":
      return `L${formatPoint(segment.to)}`;
    case "arc": {
      const largeArc = Math.abs(segment.delta) > Math.PI - EPSILON ? 1 : 0;
      const sweep = segment.delta > 0 ? 1 : 0;
      const degrees = (segment.phi * 180) / Math.PI;
      return `A${format(segment.rx)} ${format(segment.ry)} ${format(degrees)} ${largeArc} ${sweep} ${formatPoint(segment.to)}`;
    }
    case "quad":
      return `Q${formatPoint(segment.c)} ${formatPoint(segment.to)}`;
    case "cubic":
      return `C${formatPoint(segment.c1)} ${formatPoint(segment.c2)} ${formatPoint(segment.to)}`;
  }
}

function serializeSubpath(subpath: Subpath): string {
  const first = subpath[0] as Segment;
  const last = subpath.at(-1) as Segment;
  // Z draws the closing line itself.
  const body = last.kind === "line" && subpath.length > 1 ? subpath.slice(0, -1) : subpath;
  return `M${formatPoint(first.from)}${body.map(serializeSegment).join("")}Z`;
}

function clipShape(d: string, placement: Placement, box: Box): string | null {
  const subpaths = parsePath(d).map((subpath) =>
    subpath.map((segment) => placeSegment(segment, placement)),
  );
  let changed = placement !== IDENTITY;
  const kept: Subpath[] = [];
  for (const subpath of subpaths) {
    const clipped = clipSubpath(subpath, box);
    if (clipped !== subpath) changed = true;
    if (clipped) kept.push(clipped);
  }
  if (!changed) return d;
  return kept.length > 0 ? kept.map(serializeSubpath).join("") : null;
}

function clipNodes(
  nodes: readonly PosterNode[],
  placement: Placement,
  box: Box,
  items: ClippedPosterItem[],
): void {
  for (const node of nodes) {
    switch (node.kind) {
      case "shapes":
        for (const shape of node.shapes) {
          if (shape.transform) throw new UnsupportedGeometry("Shape transforms are not clipped");
          const d = clipShape(shape.d, placement, box);
          if (d) items.push({ kind: "shape", role: shape.role, d });
        }
        break;
      case "viewport": {
        const viewport = viewportPlacement(node.viewport);
        const inner = compose(placement, viewport.placement);
        const clip = node.viewport.overflowVisible
          ? box
          : intersectBoxes(box, placeBox(viewport.box, placement));
        clipNodes(node.children, inner, clip, items);
        break;
      }
      case "numeral":
        // Numerals are set inside the canvas; only a root one keeps its layout.
        if (placement !== IDENTITY) throw new UnsupportedGeometry("Nested numerals are not placed");
        items.push({ kind: "numeral", text: node.text, layout: node.layout });
        break;
    }
  }
}

/**
 * The composition's shapes and numeral in paint order, each shape clipped to
 * the root viewBox (and to its nested viewport). Null when the composition
 * uses geometry this clipper does not handle (the strip's percentage
 * viewports, shape transforms): draw the shared poster then.
 */
export function clipPosterComposition(
  composition: PosterComposition,
): readonly ClippedPosterItem[] | null {
  const root = parseViewBox(composition.viewBox);
  if (!root) return null;
  const items: ClippedPosterItem[] = [];
  try {
    clipNodes(composition.children, IDENTITY, root, items);
  } catch (error) {
    if (error instanceof UnsupportedGeometry) return null;
    throw error;
  }
  return items;
}

/** The exact extent of path data, arcs and curves included (tests and checks). */
export function posterPathBounds(d: string): Box | null {
  return unionBounds(
    parsePath(d)
      .map(subpathBounds)
      .filter((box): box is Box => box !== null),
  );
}

/**
 * A hit test for the filled path (nonzero rule) on a fine polyline of every
 * segment, for tests that compare two drawings point by point.
 */
export function posterPathHitTest(d: string): (point: Point) => boolean {
  const edges: [Point, Point][] = [];
  for (const subpath of parsePath(d)) {
    for (const segment of subpath) {
      const steps = segment.kind === "line" ? 1 : 256;
      let previous = segment.from;
      for (let step = 1; step <= steps; step += 1) {
        const next = step === steps ? segment.to : segmentPoint(segment, step / steps);
        edges.push([previous, next]);
        previous = next;
      }
    }
  }
  // Bucket the edges by the horizontal bands their y-range touches, so a
  // point only visits edges that can cross its scanline. The result is the
  // same nonzero winding number as a scan over every edge.
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [previous, next] of edges) {
    minY = Math.min(minY, previous[1], next[1]);
    maxY = Math.max(maxY, previous[1], next[1]);
  }
  const bandCount = edges.length > 64 ? 128 : 1;
  const bandHeight = maxY > minY ? (maxY - minY) / bandCount : 1;
  const bandOf = (y: number) => Math.min(bandCount - 1, Math.max(0, Math.floor((y - minY) / bandHeight)));
  const bands: [Point, Point][][] = Array.from({ length: bandCount }, () => []);
  for (const edge of edges) {
    const low = bandOf(Math.min(edge[0][1], edge[1][1]));
    const high = bandOf(Math.max(edge[0][1], edge[1][1]));
    for (let band = low; band <= high; band += 1) bands[band]?.push(edge);
  }
  return (point) => {
    if (!(point[1] >= minY && point[1] <= maxY)) return false;
    let winding = 0;
    for (const [previous, next] of bands[bandOf(point[1])] ?? []) {
      if (previous[1] <= point[1] === next[1] <= point[1]) continue;
      const cross =
        (next[0] - previous[0]) * (point[1] - previous[1]) -
        (point[0] - previous[0]) * (next[1] - previous[1]);
      if (next[1] > previous[1] && cross > 0) winding += 1;
      else if (next[1] <= previous[1] && cross < 0) winding -= 1;
    }
    return winding !== 0;
  };
}

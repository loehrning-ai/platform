/**
 * Horizon globe: shared projection for the phone home hero.
 *
 * The phone hero shows the Workshop 03 line globe from orbit: a sphere far
 * larger than the screen, so only its upper limb crosses the band, with
 * Europe below the horizon and Germany traced in Mennige. The server renders
 * the first frame as SVG (horizon-globe-frame.tsx); the live renderer
 * (horizon-globe-renderer.ts) redraws the same geometry into a canvas. Both
 * use the numbers and functions in this file, so the two frames agree to the
 * sub-pixel and the handover is invisible.
 *
 * Composition: every length is a ratio of the slot width `w`. The sphere has
 * radius `r * w`, its centre sits at `cx * w` across and `(top + r) * w`
 * down, so the apex of the limb is `top * w` below the slot's top edge. In
 * the server frame the slot's height only crops the drawing. The live
 * renderer then pushes in: it scales the sphere by `k` (horizonPush) about
 * the apex, so a tall band fills with ground instead of empty graticule.
 *
 * Pure functions, no DOM.
 */

export const HORIZON = {
  /** Sphere radius over slot width. */
  r: 1.3,
  /** Sphere centre x over slot width. */
  cx: 0.58,
  /** Apex of the limb, below the slot top, over slot width. */
  top: 0.1,
  /** Latitude that faces the viewer. Slightly south, so the pole sits just behind the horizon. */
  viewLat: -6,
  /** Germany's centre (longitude) and the view's opening offset from it. */
  focusLon: 10.4,
  focusLat: 51.2,
  startOffset: -10,
  /** Deepest the server frame draws, over slot width (the slot crops the rest). */
  depth: 1.6,
  /** Push-in per unit of slot aspect above square, and its ceiling. */
  pushGain: 1.6,
  pushMax: 1.55,
} as const;

/** Stroke colours as rgb triples, so alphas can be composed. */
export const HORIZON_INK = {
  /** Paper on graphit (#f2f1ee). */
  line: "242,241,238",
  /** Mennige on graphit (#e07050, the band's accent). */
  accent: "224,112,80",
} as const;

/** Stroke alphas before the depth fade. */
export const HORIZON_ALPHA = {
  grid: 0.26,
  coast: 0.66,
  germanyStroke: 0.95,
  germanyFill: 0.12,
} as const;

/**
 * Depth fade towards the limb, as [fraction of the radius, alpha multiplier].
 * Lines thin out near the horizon, which reads as atmosphere and calms the
 * foreshortened pile-up of lines along the limb. The SVG frame applies it as
 * a CSS mask, the canvas as a radial gradient on the stroke.
 */
export const HORIZON_DEPTH_FADE: readonly (readonly [number, number])[] = [
  [0, 1],
  [0.62, 1],
  [0.88, 0.78],
  [0.97, 0.46],
  [1, 0.3],
];

/** Degrees between graticule lines (the deck uses 10). */
export const HORIZON_GRID_STEP = 10;

const DEG = Math.PI / 180;

/** Sphere geometry for a slot of `width` x `height` (any unit). */
export type HorizonFrame = {
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly centerX: number;
  readonly centerY: number;
  /** View-space y (in radii) of the bottom edge: points below are cropped. */
  readonly yCut: number;
  /** View-space x (in radii) of the side edges. */
  readonly xLeft: number;
  readonly xRight: number;
  /** Lowest latitude that can reach the slot, so whole rings can be skipped. */
  readonly latMin: number;
};

/**
 * Push-in for a slot of `width` x `height`: the factor the live renderer
 * scales the sphere by about the apex, so a tall band shows more ground and
 * less empty graticule. 1 on short and square slots (the server frame),
 * at most HORIZON.pushMax on tall phones.
 */
export function horizonPush(width: number, height: number): number {
  if (!width || !height) return 1;
  const k = 1 + (height / width - 1) * HORIZON.pushGain;
  return Math.min(HORIZON.pushMax, Math.max(1, k));
}

export function horizonFrame(
  width: number,
  height: number,
  push = 1,
): HorizonFrame {
  const radius = HORIZON.r * push * width;
  const centerX = HORIZON.cx * width;
  const centerY = HORIZON.top * width + radius;
  const margin = width * 0.006;
  const yCut = (centerY - (height + margin)) / radius;
  return {
    width,
    height,
    radius,
    centerX,
    centerY,
    yCut,
    xLeft: (-margin - centerX) / radius,
    xRight: (width + margin - centerX) / radius,
    // With the view centre south of the equator a parallel sits lowest on the
    // near meridian, where view-y = sin(lat - viewLat).
    latMin:
      HORIZON.viewLat + Math.asin(Math.max(-1, Math.min(1, yCut))) / DEG - 2,
  };
}

/**
 * View basis for a globe turned to (lat, lon): east x/y, north x/y/z and
 * out-of-screen x/y/z, flattened. East has no z component.
 */
export type ViewBasis = readonly [
  number, number, number, number, number, number, number, number,
];

export function viewBasis(lat: number, lon: number): ViewBasis {
  const sl = Math.sin(lat * DEG);
  const cl = Math.cos(lat * DEG);
  const so = Math.sin(lon * DEG);
  const co = Math.cos(lon * DEG);
  return [-so, co, -sl * co, -sl * so, cl, cl * co, cl * so, sl];
}

/** The longitude facing the viewer after the globe has turned `theta` degrees. */
export function horizonCenterLon(theta: number): number {
  return HORIZON.focusLon - HORIZON.startOffset - theta;
}

/** Polylines on the unit sphere, flattened into one Float32Array. */
export type SpherePolylines = {
  readonly v: Float32Array;
  readonly start: readonly number[];
  readonly length: readonly number[];
  readonly maxLat: readonly number[];
};

/** Builds unit vectors for a list of [lat, lon] polylines. */
export function toSpherePolylines(
  lines: readonly (readonly (readonly [number, number])[])[],
): SpherePolylines {
  let total = 0;
  for (const line of lines) total += line.length;
  const v = new Float32Array(total * 3);
  const start: number[] = [];
  const length: number[] = [];
  const maxLat: number[] = [];
  let n = 0;
  for (const line of lines) {
    start.push(n);
    length.push(line.length);
    let top = -90;
    for (const [lat, lon] of line) {
      const phi = lat * DEG;
      const lambda = lon * DEG;
      const c = Math.cos(phi);
      v[n * 3] = c * Math.cos(lambda);
      v[n * 3 + 1] = c * Math.sin(lambda);
      v[n * 3 + 2] = Math.sin(phi);
      if (lat > top) top = lat;
      n++;
    }
    maxLat.push(top);
  }
  return { v, start, length, maxLat };
}

const END_DIGITS = "0123456789abcdefghijklmnopqrstuv";
const CONTINUATION_DIGITS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!#$%&(";

/**
 * Decodes the packed rings written by scripts/extract-horizon-land.mjs into
 * [lat, lon] polylines.
 */
export function decodeRings(
  packed: string,
  scale: number,
): (readonly [number, number])[][] {
  const lut = new Int8Array(128);
  for (let i = 0; i < 32; i++) {
    lut[END_DIGITS.charCodeAt(i)] = i + 1;
    lut[CONTINUATION_DIGITS.charCodeAt(i)] = i + 33;
  }
  const rings: (readonly [number, number])[][] = [[]];
  let acc = 0;
  let mul = 1;
  let lon = 0;
  let lat = 0;
  let odd = false;
  for (let i = 0; i < packed.length; i++) {
    const k = lut[packed.charCodeAt(i)] ?? 0;
    if (!k) {
      rings.push([]);
      lon = 0;
      lat = 0;
      odd = false;
      acc = 0;
      mul = 1;
      continue;
    }
    if (k > 32) {
      acc += (k - 33) * mul;
      mul *= 32;
      continue;
    }
    acc += (k - 1) * mul;
    const delta = acc % 2 ? -(acc + 1) / 2 : acc / 2;
    acc = 0;
    mul = 1;
    if (odd) {
      lat += delta;
      rings[rings.length - 1].push([lat / scale, lon / scale]);
    } else {
      lon += delta;
    }
    odd = !odd;
  }
  return rings.filter((ring) => ring.length > 1);
}

/** Graticule polylines: meridians every `step` degrees, sampled every 3 degrees. */
export function meridianLines(step = HORIZON_GRID_STEP): [number, number][][] {
  const lines: [number, number][][] = [];
  for (let lon = -180; lon < 180; lon += step) {
    const line: [number, number][] = [];
    for (let lat = -30; lat <= 90; lat += 3) line.push([lat, lon]);
    lines.push(line);
  }
  return lines;
}

/** Graticule polylines: parallels every `step` degrees, sampled every 3 degrees. */
export function parallelLines(step = HORIZON_GRID_STEP): [number, number][][] {
  const lines: [number, number][][] = [];
  for (let lat = -90 + step; lat < 90; lat += step) {
    if (lat < -30) continue;
    const line: [number, number][] = [];
    for (let lon = -180; lon <= 180; lon += 3) line.push([lat, lon]);
    lines.push(line);
  }
  return lines;
}

/** Anything that can take a path: a CanvasRenderingContext2D or an SVG path writer. */
export type PathSink = {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
};

/**
 * Adds the visible parts of polylines [from, to) to `sink`. Segments that
 * cross the limb end exactly on it; points outside the slot are skipped.
 * Returns true when every point was visible (a closed outline can be filled).
 */
export function tracePolylines(
  sink: PathSink,
  lines: SpherePolylines,
  basis: ViewBasis,
  frame: HorizonFrame,
  latMin: number,
  from = 0,
  to = lines.start.length,
): boolean {
  const { v } = lines;
  const R = frame.radius;
  const CX = frame.centerX;
  const CY = frame.centerY;
  const cut = frame.yCut;
  const xl = frame.xLeft;
  const xr = frame.xRight;
  const [e0, e1, n0, n1, n2, o0, o1, o2] = basis;
  let whole = true;
  let any = false;
  for (let k = from; k < to; k++) {
    if (lines.maxLat[k] < latMin) {
      whole = false;
      continue;
    }
    let i = lines.start[k] * 3;
    const end = i + lines.length[k] * 3;
    const first = i;
    let pen = false;
    let px = 0;
    let py = 0;
    let pz = -1;
    for (; i < end; i += 3) {
      const X = v[i];
      const Y = v[i + 1];
      const Z = v[i + 2];
      const x = X * e0 + Y * e1;
      const y = X * n0 + Y * n1 + Z * n2;
      const z = X * o0 + Y * o1 + Z * o2;
      if (z <= 0) {
        whole = false;
        if (pen) {
          const t = pz / (pz - z);
          const lx = px + (x - px) * t;
          const ly = py + (y - py) * t;
          const h = Math.sqrt(lx * lx + ly * ly) || 1;
          sink.lineTo(CX + (lx / h) * R, CY - (ly / h) * R);
          pen = false;
        }
      } else if (y < cut || x < xl || x > xr) {
        whole = false;
        if (pen) {
          sink.lineTo(CX + x * R, CY - y * R);
          pen = false;
        }
      } else {
        if (!pen) {
          if (i === first) {
            sink.moveTo(CX + x * R, CY - y * R);
          } else if (pz <= 0) {
            const t = pz / (pz - z);
            const mx = px + (x - px) * t;
            const my = py + (y - py) * t;
            const h = Math.sqrt(mx * mx + my * my) || 1;
            sink.moveTo(CX + (mx / h) * R, CY - (my / h) * R);
          } else {
            sink.moveTo(CX + px * R, CY - py * R);
          }
          pen = true;
        }
        sink.lineTo(CX + x * R, CY - y * R);
        any = true;
      }
      px = x;
      py = y;
      pz = z;
    }
  }
  return whole && any;
}

/**
 * Screen position and depth of one lat/lon for a frame and basis. `depth` is
 * the view-space z: positive on the near hemisphere.
 */
export function projectHorizonPoint(
  lat: number,
  lon: number,
  basis: ViewBasis,
  frame: HorizonFrame,
): { x: number; y: number; depth: number } {
  const phi = lat * DEG;
  const lambda = lon * DEG;
  const c = Math.cos(phi);
  const X = c * Math.cos(lambda);
  const Y = c * Math.sin(lambda);
  const Z = Math.sin(phi);
  const [e0, e1, n0, n1, n2, o0, o1, o2] = basis;
  return {
    x: frame.centerX + (X * e0 + Y * e1) * frame.radius,
    y: frame.centerY - (X * n0 + Y * n1 + Z * n2) * frame.radius,
    depth: X * o0 + Y * o1 + Z * o2,
  };
}

/** Germany fades out as it turns towards the limb: 1 when facing, 0 behind. */
export function focusFade(depth: number): number {
  return Math.max(0, Math.min(1, depth / 0.22));
}

/** Berlin, drawn as a square Route station. */
export const BERLIN: readonly [number, number] = [52.52, 13.4];

/** Berlin station size and its paper inset, in 1/1000 of the slot width. */
export const BERLIN_UNITS = 14;
export const BERLIN_INSET_UNITS = 5;

/**
 * The Lernroute: one Mennige great circle from Berlin south-west across the
 * Alps, the Mediterranean and the Sahara, so it runs down the band towards
 * the primary action and sinks into the ground shade behind it. Stations mark
 * the four foundation courses; the first is Berlin itself.
 */
export const HORIZON_ROUTE = {
  to: [6.5, 3.4] as readonly [number, number],
  /** Degrees between samples along the arc. */
  step: 1,
  alpha: 0.9,
  /** Stations after Berlin, as fractions of the arc. */
  stations: [0.3, 0.55, 0.8] as readonly number[],
  /** Station size and its graphit inset, in 1/1000 of the slot width. */
  stationUnits: 10,
  stationInsetUnits: 4,
} as const;

/** Samples the great circle from `from` to `to` every `step` degrees. */
export function greatCircle(
  from: readonly [number, number],
  to: readonly [number, number],
  step = 1,
): [number, number][] {
  const unit = ([lat, lon]: readonly [number, number]) => {
    const c = Math.cos(lat * DEG);
    return [c * Math.cos(lon * DEG), c * Math.sin(lon * DEG), Math.sin(lat * DEG)];
  };
  const a = unit(from);
  const b = unit(to);
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  const n = Math.max(1, Math.ceil(omega / DEG / step - 1e-9));
  const points: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const s = Math.sin(omega) || 1;
    const wa = Math.sin((1 - t) * omega) / s;
    const wb = Math.sin(t * omega) / s;
    const x = a[0] * wa + b[0] * wb;
    const y = a[1] * wa + b[1] * wb;
    const z = a[2] * wa + b[2] * wb;
    points.push([
      Math.asin(Math.max(-1, Math.min(1, z))) / DEG,
      Math.atan2(y, x) / DEG,
    ]);
  }
  return points;
}

/** The Lernroute as a polyline from Berlin. */
export function routeLine(): [number, number][] {
  return greatCircle(BERLIN, HORIZON_ROUTE.to, HORIZON_ROUTE.step);
}

/** The route's stations after Berlin, as [lat, lon]. */
export function routeStations(): [number, number][] {
  const line = routeLine();
  return HORIZON_ROUTE.stations.map(
    (fraction) => line[Math.round(fraction * (line.length - 1))],
  );
}

/**
 * The fixed sky around the limb: the limb itself, a pole glint at the apex
 * and a degree scale. It never rotates, so it depends on the frame only.
 */

/** Point on the limb at `angle` degrees from the apex (clockwise positive). */
export function limbPoint(
  frame: HorizonFrame,
  angle: number,
): readonly [number, number] {
  const a = angle * DEG;
  return [
    frame.centerX + frame.radius * Math.sin(a),
    frame.centerY - frame.radius * Math.cos(a),
  ];
}

/** Angle from the apex at which the limb leaves the slot on each side. */
export function limbExit(frame: HorizonFrame, side: -1 | 1): number {
  const margin = frame.width * 0.012;
  const edge = side < 0 ? -margin : frame.width + margin;
  const s = (edge - frame.centerX) / frame.radius;
  return Math.asin(Math.max(-1, Math.min(1, s))) / DEG;
}

/** Pole glint arcs as [half-angle, alpha, stroke width], back to front. */
export const HORIZON_GLINT: readonly (readonly [number, number, number])[] = [
  [14, 0.22, 1.25],
  [6, 0.22, 1.25],
  [2, 0.5, 2],
];

/** Degree-scale ticks along the limb near the apex: 2 deg minor, 10 deg major. */
export function scaleTicks(frame: HorizonFrame): {
  minor: [number, number, number, number][];
  major: [number, number, number, number][];
} {
  const unit = frame.width / 1000;
  const minor: [number, number, number, number][] = [];
  const major: [number, number, number, number][] = [];
  for (let angle = -24; angle <= 24; angle += 2) {
    const long = angle % 10 === 0;
    const length = (long ? 22 : 10) * unit;
    const [x0, y0] = limbPoint(frame, angle);
    const a = angle * DEG;
    const lift = 3 * unit;
    const tick: [number, number, number, number] = [
      x0,
      y0 - lift,
      x0 + Math.sin(a) * length,
      y0 - Math.cos(a) * length - lift,
    ];
    (long ? major : minor).push(tick);
  }
  return { minor, major };
}

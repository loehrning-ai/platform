/**
 * The home globe's projection: the thin ink graticule and the Kupfer country
 * outlines of the paper hero, shared by the live projection (hero-network.tsx,
 * client) and the phone hero's server-rendered first frame
 * (hero-globe-frame.tsx). Pure math and path strings: no React, no DOM, no
 * "use client", so the server can draw the first frame and the browser the
 * rest from the same geometry.
 */

import {
  COUNTRY_POLYLINES_3D,
  type CountryKey3D,
} from "@/lib/country-polylines-3d";

/** Maps STEPS index → country key. Aligned 1:1 with the STEPS array below. */
export const STEP_COUNTRY: readonly CountryKey3D[] = [
  "BERLIN", // STEPS[0] Germany
  "SAO_PAULO", // STEPS[1] Brazil
  "BEIJING", // STEPS[2] China
  "SAN_FRANCISCO", // STEPS[3] USA
  "MUMBAI", // STEPS[4] India (EU AI Act extraterritorial reach)
  "TOKYO", // STEPS[5] Japan
];

// ─── Constants ──────────────────────────────────────────────────────────────

export const R = 500;
export const CX = 320;
export const CY = 380;
export const DEG = Math.PI / 180;
export const KUPFER = "#C4431A";
export const GRID_STEP = 7;
export const LC = "rgb(20,20,19)";
export const WARM = "rgb(40,30,22)";

// ─── Math ───────────────────────────────────────────────────────────────────

export type Vec3 = readonly [number, number, number];
export type ProjectedPoint = Readonly<{ sx: number; sy: number; z: number }>;
export type Projector = (point: Vec3) => ProjectedPoint;

export function ll3d(lat: number, lon: number): Vec3 {
  const la = lat * DEG,
    lo = lon * DEG;
  return [
    Math.cos(la) * Math.cos(lo),
    Math.sin(la),
    Math.cos(la) * Math.sin(lo),
  ];
}
/** Project (lat, lon) to screen, with the globe rotated so that
 *  (rLat, rLon) lands dead center on the front face (z ≈ 1). The -0.15 rad
 *  X tilt biases the city slightly above the equator-of-view so it sits
 *  comfortably alongside the typing word in the upper-right area. */
export function createProjector(rLon: number, rLat: number): Projector {
  // Rotation angles are identical for every point in a frame. Cache their
  // trigonometry once instead of repeating four trig calls for each of the
  // roughly 7,500 grid and country projections.
  const yaw = (rLon - 90) * DEG;
  const pitch = rLat * DEG - 0.15;
  const yawCos = Math.cos(yaw);
  const yawSin = Math.sin(yaw);
  const pitchCos = Math.cos(pitch);
  const pitchSin = Math.sin(pitch);

  return ([x, y, z]) => {
    const rotatedX = x * yawCos + z * yawSin;
    const yawZ = -x * yawSin + z * yawCos;
    const rotatedY = y * pitchCos - yawZ * pitchSin;
    const rotatedZ = y * pitchSin + yawZ * pitchCos;
    return {
      sx: CX + rotatedX * R,
      sy: CY - rotatedY * R,
      z: rotatedZ,
    };
  };
}

export const COUNTRY_RINGS_3D = Object.fromEntries(
  STEP_COUNTRY.map((key) => [
    key,
    COUNTRY_POLYLINES_3D[key].map((ring) =>
      ring.map(([lat, lon]) => ll3d(lat, lon)),
    ),
  ]),
) as unknown as Readonly<Record<CountryKey3D, readonly (readonly Vec3[])[]>>;

export const GRID_LINES_3D: readonly (readonly Vec3[])[] = (() => {
  const lines: Vec3[][] = [];
  for (let lat = -80; lat <= 80; lat += GRID_STEP) {
    const points: Vec3[] = [];
    for (let lon = -180; lon <= 180; lon += 4) points.push(ll3d(lat, lon));
    lines.push(points);
  }
  for (let lon = -180; lon < 180; lon += GRID_STEP) {
    const points: Vec3[] = [];
    for (let lat = -90; lat <= 90; lat += 4) points.push(ll3d(lat, lon));
    lines.push(points);
  }
  return lines;
})();

export function dp(sx: number, sy: number, z: number): number {
  const ed = Math.sqrt((sx - CX) ** 2 + (sy - CY) ** 2) / R;
  return (1 - Math.pow(Math.min(ed, 1), 1.6)) * Math.max(0, z);
}
export function sfEase(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
export function lerpLon(a: number, b: number, t: number): number {
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return a + d * t;
}

// ─── Grid builder ───────────────────────────────────────────────────────────

export interface Seg {
  d: string;
  dp: number;
  len?: number;
}

/** Project a set of [lat, lon] polylines onto the sphere at (rLon, rLat),
 *  emitting only front-facing (z > 0) sub-paths. Each Seg carries the
 *  cumulative screen-space length of its sub-path so callers can drive a
 *  stroke-dashoffset draw-in animation. Same trace pattern as buildGrid. */
export function projectRings(
  rings: readonly (readonly Vec3[])[],
  project: Projector,
): Seg[] {
  const out: Seg[] = [];
  for (const ring of rings) {
    let d = "",
      live = false,
      sumDp = 0,
      n = 0,
      len = 0,
      lastSx = 0,
      lastSy = 0;
    for (const point of ring) {
      const pt = project(point);
      if (pt.z > 0) {
        const c = `${pt.sx.toFixed(1)},${pt.sy.toFixed(1)}`;
        if (live) {
          d += ` L${c}`;
          len += Math.hypot(pt.sx - lastSx, pt.sy - lastSy);
        } else {
          d += `M${c}`;
        }
        lastSx = pt.sx;
        lastSy = pt.sy;
        live = true;
        sumDp += dp(pt.sx, pt.sy, pt.z);
        n++;
      } else if (live) {
        out.push({ d, dp: n > 0 ? sumDp / n : 0, len });
        d = "";
        live = false;
        sumDp = 0;
        n = 0;
        len = 0;
      }
    }
    if (live) out.push({ d, dp: n > 0 ? sumDp / n : 0, len });
  }
  return out;
}

/** Project rings and produce ONE closed path per ring, with limb-arc
 *  closures wherever the boundary crosses the silhouette. Use this for
 *  FILLS (glow + hatch) — a flat `Z` chord across the disc would paint
 *  hatch into the back-of-globe area; an arc closure keeps the fill on
 *  the visible front of the country. Outlines should keep using
 *  `projectRings()` (strokes don't auto-close, so no chord problem). */
export function projectRingsClosed(
  rings: readonly (readonly Vec3[])[],
  project: Projector,
): Seg[] {
  const out: Seg[] = [];
  for (const ring of rings) {
    const pts = ring.map(project);
    const n = pts.length;
    if (n === 0) continue;

    // Fast path 1: ring fully behind the limb — skip.
    let anyFront = false,
      anyBack = false;
    for (const p of pts) {
      if (p.z > 0) anyFront = true;
      else anyBack = true;
      if (anyFront && anyBack) break;
    }
    if (!anyFront) continue;

    // Fast path 2: ring fully in front — single straight closed path.
    if (!anyBack) {
      let d = "",
        sumDp = 0;
      pts.forEach((p, i) => {
        const c = `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`;
        d += i === 0 ? `M${c}` : ` L${c}`;
        sumDp += dp(p.sx, p.sy, p.z);
      });
      out.push({ d: d + " Z", dp: sumDp / n });
      continue;
    }

    // Mixed — collect entry/exit limb crossings, then stitch arcs together
    // walking the limb (shorter angular direction) between consecutive arcs.
    interface Arc {
      readonly entryAng: number;
      readonly entrySx: number;
      readonly entrySy: number;
      readonly visIdx: readonly number[]; // indices into pts of visible vertices
      readonly exitAng: number;
      readonly exitSx: number;
      readonly exitSy: number;
    }
    const arcs: Arc[] = [];
    let inArc = false;
    let curEntry: { ang: number; sx: number; sy: number } | null = null;
    let curVis: number[] = [];

    for (let i = 0; i < n; i++) {
      const cur = pts[i];
      const prev = pts[(i - 1 + n) % n];

      // back → front: open a new arc
      if (cur.z > 0 && prev.z <= 0) {
        const t = -prev.z / (cur.z - prev.z); // (0, 1]
        const sxRaw = prev.sx + (cur.sx - prev.sx) * t;
        const syRaw = prev.sy + (cur.sy - prev.sy) * t;
        const ang = Math.atan2(syRaw - CY, sxRaw - CX);
        curEntry = {
          ang,
          sx: CX + R * Math.cos(ang),
          sy: CY + R * Math.sin(ang),
        };
        curVis = [];
        inArc = true;
      }

      if (cur.z > 0 && inArc) curVis.push(i);

      // front → back: close the current arc with an exit limb crossing
      if (cur.z <= 0 && prev.z > 0 && inArc && curEntry) {
        const t = prev.z / (prev.z - cur.z); // (0, 1]
        const sxRaw = prev.sx + (cur.sx - prev.sx) * t;
        const syRaw = prev.sy + (cur.sy - prev.sy) * t;
        const ang = Math.atan2(syRaw - CY, sxRaw - CX);
        arcs.push({
          entryAng: curEntry.ang,
          entrySx: curEntry.sx,
          entrySy: curEntry.sy,
          visIdx: curVis,
          exitAng: ang,
          exitSx: CX + R * Math.cos(ang),
          exitSy: CY + R * Math.sin(ang),
        });
        inArc = false;
        curEntry = null;
        curVis = [];
      }
    }
    // If we ended mid-arc (started visible, never crossed back), drop it —
    // shouldn't happen because we walk cyclically (i-1+n)%n catches the wrap.

    if (arcs.length === 0) continue;

    // Build one combined closed path:
    //   arc[0] entry → visible verts → exit
    //   limb arc → arc[1] entry → … → arc[last] exit
    //   limb arc back to arc[0] entry (the implicit Z)
    let d = "";
    let sumDp = 0,
      vcount = 0;
    arcs.forEach((arc, ai) => {
      // Move to arc entry (or line, if not the first arc)
      const entryC = `${arc.entrySx.toFixed(1)},${arc.entrySy.toFixed(1)}`;
      d += ai === 0 ? `M${entryC}` : ` L${entryC}`;
      // Visible vertices
      for (const i of arc.visIdx) {
        const p = pts[i];
        d += ` L${p.sx.toFixed(1)},${p.sy.toFixed(1)}`;
        sumDp += dp(p.sx, p.sy, p.z);
        vcount++;
      }
      // Arc exit
      d += ` L${arc.exitSx.toFixed(1)},${arc.exitSy.toFixed(1)}`;

      // Walk the limb to the NEXT arc's entry (or back to arc[0] for the last)
      const nextArc = arcs[(ai + 1) % arcs.length];
      let delta = nextArc.entryAng - arc.exitAng;
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      // ~5 px steps along the arc, minimum 2 steps
      const arcLenPx = Math.abs(delta) * R;
      const steps = Math.max(2, Math.ceil(arcLenPx / 5));
      for (let s = 1; s < steps; s++) {
        const a = arc.exitAng + delta * (s / steps);
        d += ` L${(CX + R * Math.cos(a)).toFixed(1)},${(CY + R * Math.sin(a)).toFixed(1)}`;
      }
    });

    out.push({ d: d + " Z", dp: vcount > 0 ? sumDp / vcount : 0 });
  }
  return out;
}

export const BERLIN_LAT = 52.5;
export const BERLIN_LON = 13.4;

export function buildGrid(project: Projector): { front: Seg[]; back: Seg[] } {
  const front: Seg[] = [],
    back: Seg[] = [];
  const trace = (points: readonly Vec3[]) => {
    let pF = "",
      pB = "",
      lF = false,
      lB = false,
      sF = 0,
      cF = 0,
      sB = 0,
      cB = 0;
    for (const point of points) {
      const p = project(point);
      const c = `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`;
      if (p.z > 0) {
        if (!lF && pB) {
          back.push({ d: pB, dp: cB > 0 ? sB / cB : 0 });
          pB = "";
          sB = 0;
          cB = 0;
        }
        pF += lF ? ` L${c}` : `M${c}`;
        lF = true;
        lB = false;
        sF += dp(p.sx, p.sy, p.z);
        cF++;
      } else {
        if (!lB && pF) {
          front.push({ d: pF, dp: cF > 0 ? sF / cF : 0 });
          pF = "";
          sF = 0;
          cF = 0;
        }
        pB += lB ? ` L${c}` : `M${c}`;
        lB = true;
        lF = false;
        sB += Math.abs(p.z);
        cB++;
      }
    }
    if (pF)
      front.push({
        d: pF,
        dp: cF > 0 ? Math.round((sF / cF) * 10000) / 10000 : 0,
      });
    if (pB)
      back.push({
        d: pB,
        dp: cB > 0 ? Math.round((sB / cB) * 10000) / 10000 : 0,
      });
  };
  for (const line of GRID_LINES_3D) trace(line);
  return { front, back };
}

// ─── Berlin compositions ────────────────────────────────────────────────────

/** The globe at rest: Berlin at the front, the first beat of the tour. */
export const berlinProjector = createProjector(BERLIN_LON, BERLIN_LAT);

type Grid = { readonly front: readonly Seg[]; readonly back: readonly Seg[] };

export type GlobeComposition = {
  readonly grid: Grid;
  /** Open per-arc outlines (strokes). */
  readonly country: readonly Seg[];
  /** One closed path per ring with limb-arc closures (glow and hatch). */
  readonly countryFill: readonly Seg[];
};

let berlinCache: GlobeComposition | null = null;

/**
 * The full static composition centred on Berlin, with all six countries on
 * the globe so a still viewer sees the whole set: the reduced-motion globe
 * and the phone hero's server frame. Computed once per process.
 */
export function berlinComposition(): GlobeComposition {
  if (berlinCache) return berlinCache;
  berlinCache = {
    grid: buildGrid(berlinProjector),
    country: STEP_COUNTRY.flatMap((key) =>
      projectRings(COUNTRY_RINGS_3D[key], berlinProjector),
    ),
    countryFill: STEP_COUNTRY.flatMap((key) =>
      projectRingsClosed(COUNTRY_RINGS_3D[key], berlinProjector),
    ),
  };
  return berlinCache;
}

let shellCache: { readonly grid: Grid; readonly country: readonly Seg[] } | null =
  null;

/**
 * The complete animated projection is intentionally not serialized into the
 * document. This sparse frame uses the exact same Berlin projection and ink
 * values, so the live globe shows a real globe from its first client paint
 * without a visually unrelated poster or a large SVG payload.
 */
export function initialShell(): {
  readonly grid: Grid;
  readonly country: readonly Seg[];
} {
  if (shellCache) return shellCache;
  const grid = buildGrid(berlinProjector);
  shellCache = {
    grid: {
      back: grid.back.filter((_, index) => index % 8 === 0),
      front: grid.front.filter((_, index) => index % 8 === 0),
    },
    country: STEP_COUNTRY.flatMap((key) =>
      projectRings(
        COUNTRY_RINGS_3D[key].map((ring) =>
          ring.filter(
            (_, index) => index % 3 === 0 || index === ring.length - 1,
          ),
        ),
        berlinProjector,
      ),
    ),
  };
  return shellCache;
}

/** Rounds a paint value to three decimals, so server and client agree. */
export function paint(value: number): number {
  return Math.round(value * 1000) / 1000;
}

// ─── The phone frame ────────────────────────────────────────────────────────

/**
 * The phone hero's window onto the globe, in the projection's units: the
 * upper limb crosses its top as a dome and the front country (every beat
 * brings its country to about (CX, CY - 0.15 R)) sits in its lower third,
 * under the typing word. The live phone globe and the server frame share
 * it, anchored at its foot (xMidYMax slice), so a taller window crops the
 * sides and never the country.
 */
export const PHONE_VIEW = { x: -40, y: -140, width: 720, height: 560 } as const;

export type Rect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

function inside(rect: Rect, sx: number, sy: number, margin: number): boolean {
  return (
    sx >= rect.x - margin &&
    sx <= rect.x + rect.width + margin &&
    sy >= rect.y - margin &&
    sy <= rect.y + rect.height + margin
  );
}

type Point = readonly [number, number];

/**
 * Whole-unit points as one relative path ("M x,y l dx,dy dx,dy ..."), about
 * half the bytes of the absolute form. `close` ends it with "z".
 */
export function relativePath(
  runs: readonly (readonly Point[])[],
  close = false,
): string {
  let d = "";
  for (const run of runs) {
    let x = 0;
    let y = 0;
    run.forEach(([px, py], index) => {
      if (index === 0) {
        d += `M${px},${py}`;
      } else {
        const dx = px - x;
        const dy = py - y;
        d += `${index === 1 ? "l" : dx < 0 ? "" : " "}${dx}${dy < 0 ? "" : ","}${dy}`;
      }
      x = px;
      y = py;
    });
    if (close) d += "z";
  }
  return d;
}

/**
 * Front-facing polylines cropped to `rect` (plus a margin, so no line ends
 * visibly inside the window), as whole-unit runs. For the server frame,
 * where every byte is paid for in the HTML.
 */
export function cropFront(
  lines: readonly (readonly Vec3[])[],
  project: Projector,
  rect: Rect,
): Seg[] {
  const out: Seg[] = [];
  const margin = 24;
  const at = (p: ProjectedPoint): Point => [Math.round(p.sx), Math.round(p.sy)];
  for (const line of lines) {
    let run: Point[] = [];
    let sum = 0;
    let prev: ProjectedPoint | null = null;
    const flush = () => {
      if (run.length > 1) {
        out.push({
          d: relativePath([run]),
          dp: Math.round((sum / run.length) * 10000) / 10000,
        });
      }
      run = [];
      sum = 0;
    };
    for (const point of line) {
      const p = project(point);
      const visible = p.z > 0 && inside(rect, p.sx, p.sy, margin);
      if (visible) {
        // Start one point early, so the line enters the window from outside.
        if (run.length === 0 && prev && prev.z > 0) run.push(at(prev));
        run.push(at(p));
        sum += dp(p.sx, p.sy, p.z);
      } else if (run.length > 0) {
        if (p.z > 0) run.push(at(p));
        flush();
      }
      prev = p;
    }
    flush();
  }
  return out;
}

/** Parses an absolute "M x,y L x,y ... Z" path into whole-unit runs. */
function runsOf(d: string): Point[][] {
  const runs: Point[][] = [];
  for (const part of d.split("M").filter(Boolean)) {
    const numbers = part.match(/-?\d+(?:\.\d+)?/g) ?? [];
    const run: Point[] = [];
    for (let i = 0; i + 1 < numbers.length; i += 2) {
      const point: Point = [
        Math.round(Number(numbers[i])),
        Math.round(Number(numbers[i + 1])),
      ];
      const last = run[run.length - 1];
      if (!last || last[0] !== point[0] || last[1] !== point[1]) run.push(point);
    }
    runs.push(run);
  }
  return runs;
}

let phoneCache: GlobeComposition | null = null;

/**
 * The phone hero's first frame: the Berlin composition inside PHONE_VIEW
 * only (the front graticule and the countries' outlines and hatch) as
 * whole-unit relative paths. The far side, the ink shadow and the glow are
 * left to the live globe, so the phone pays for none of them in the HTML.
 */
export function phoneComposition(): GlobeComposition {
  if (phoneCache) return phoneCache;
  const fills = STEP_COUNTRY.flatMap((key) =>
    projectRingsClosed(COUNTRY_RINGS_3D[key], berlinProjector),
  );
  phoneCache = {
    grid: {
      front: cropFront(GRID_LINES_3D, berlinProjector, PHONE_VIEW),
      back: [],
    },
    country: STEP_COUNTRY.flatMap((key) =>
      cropFront(COUNTRY_RINGS_3D[key], berlinProjector, PHONE_VIEW),
    ),
    countryFill: fills
      .map((seg) => ({ ...seg, runs: runsOf(seg.d) }))
      .filter((seg) =>
        seg.runs.some((run) =>
          run.some(([x, y]) => inside(PHONE_VIEW, x, y, 0)),
        ),
      )
      .map(({ runs, dp: depth }) => ({ d: relativePath(runs, true), dp: depth })),
  };
  return phoneCache;
}

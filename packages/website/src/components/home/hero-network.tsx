"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import type { MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  COUNTRY_POLYLINES_3D,
  type CountryKey3D,
} from "@/lib/country-polylines-3d";
import { heroNetworkSteps, STEPS } from "@/components/home/hero-network-steps";
import type { Locale } from "@/lib/i18n/locale";
import { PLAKAT } from "@/lib/plakat/palettes";

// Re-exported for backward compatibility while the homepage parent loads this
// heavy projection module only for desktop viewports.
export { STEPS };

/** Maps STEPS index → country key. Aligned 1:1 with the STEPS array below. */
const STEP_COUNTRY: readonly CountryKey3D[] = [
  "BERLIN", // STEPS[0] Germany
  "SAO_PAULO", // STEPS[1] Brazil
  "BEIJING", // STEPS[2] China
  "SAN_FRANCISCO", // STEPS[3] USA
  "MUMBAI", // STEPS[4] India (EU AI Act extraterritorial reach)
  "TOKYO", // STEPS[5] Japan
];

// ─── Constants ──────────────────────────────────────────────────────────────

const R = 500;
const CX = 320;
const CY = 380;
const DEG = Math.PI / 180;
// The globe sits on the hero's graphit band: paper lines and the lightened
// Mennige the band uses for accent text (#e07050, 5.79:1 on graphit), the
// same pair as the phone horizon globe (werk/horizon-globe-frame.tsx).
const KUPFER = "#e07050";
const GRID_STEP = 7;
const LC = "rgb(242,241,238)";
const WARM = "rgb(242,241,238)";

/**
 * Paint per home scene (SPEC §3.6). Lemons: a flat Mennige disc on the
 * Ultramarin band, an Ultramarin knockout graticule of 1.5 CSS px every 30
 * degrees, the countries as flat Butter shapes and the typing word in
 * Butter (4.96:1 on Mennige, display size). No gradient, glow, hatch or
 * limb: the disc edge is the limb. Graphit: the line globe of the fallback.
 */
export type HeroGlobeScene = "lemons" | "graphit";

type GlobePaint = {
  /** Flat sphere fill, or null for the line globe. */
  readonly disc: string | null;
  readonly line: string;
  readonly accent: string;
  readonly gridStep: number;
};

const PAINT: Readonly<Record<HeroGlobeScene, GlobePaint>> = {
  lemons: {
    disc: PLAKAT.lemons.mid,
    line: PLAKAT.lemons.ground,
    accent: PLAKAT.lemons.ink,
    gridStep: 30,
  },
  graphit: { disc: null, line: LC, accent: KUPFER, gridStep: GRID_STEP },
};

/** Knockout graticule width on the flat disc, CSS px. */
const FLAT_GRID_WIDTH = 1.5;

// ─── Locations (dramatic cross-globe panning) ───────────────────────────────
// Step/journey data (Step type + STEPS constant) now lives in
// ./hero-network-steps — imported above and re-exported for compatibility.

// Restore the motion profile from the 10 August production build while keeping
// the newer visibility and reduced-motion guards. Capping at 60 avoids doing
// duplicate projection work on high-refresh displays.
export const HERO_GLOBE_FPS = 60;
export const HERO_GLOBE_STEP_SECONDS = 7;
export const HERO_GLOBE_DWELL_RATIO = 0.78;
export const HERO_GLOBE_START_DELAY_SECONDS = 2;
const FRAME_INTERVAL_MS = 1000 / HERO_GLOBE_FPS;

// ─── Math ───────────────────────────────────────────────────────────────────

type Vec3 = readonly [number, number, number];
type ProjectedPoint = Readonly<{ sx: number; sy: number; z: number }>;
type Projector = (point: Vec3) => ProjectedPoint;

function ll3d(lat: number, lon: number): Vec3 {
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
function createProjector(rLon: number, rLat: number): Projector {
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

const COUNTRY_RINGS_3D = Object.fromEntries(
  STEP_COUNTRY.map((key) => [
    key,
    COUNTRY_POLYLINES_3D[key].map((ring) =>
      ring.map(([lat, lon]) => ll3d(lat, lon)),
    ),
  ]),
) as unknown as Readonly<Record<CountryKey3D, readonly (readonly Vec3[])[]>>;

type GridLines = readonly (readonly Vec3[])[];

const gridLineCache = new Map<number, GridLines>();

/** Parallels and meridians every `step` degrees, as unit vectors (memoized). */
function gridLines(step: number): GridLines {
  const hit = gridLineCache.get(step);
  if (hit) return hit;
  const lines: Vec3[][] = [];
  // Parallels are centred on the equator, so a 30 degree step draws 0, 30
  // and 60 degrees on both sides; a 7 degree step keeps its old -80 start.
  const first = step === GRID_STEP ? -80 : -Math.floor(80 / step) * step;
  for (let lat = first; lat <= 80; lat += step) {
    const points: Vec3[] = [];
    for (let lon = -180; lon <= 180; lon += 4) points.push(ll3d(lat, lon));
    lines.push(points);
  }
  for (let lon = -180; lon < 180; lon += step) {
    const points: Vec3[] = [];
    for (let lat = -90; lat <= 90; lat += 4) points.push(ll3d(lat, lon));
    lines.push(points);
  }
  gridLineCache.set(step, lines);
  return lines;
}

function dp(sx: number, sy: number, z: number): number {
  const ed = Math.sqrt((sx - CX) ** 2 + (sy - CY) ** 2) / R;
  return (1 - Math.pow(Math.min(ed, 1), 1.6)) * Math.max(0, z);
}
function sfEase(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function lerpLon(a: number, b: number, t: number): number {
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return a + d * t;
}

// ─── Grid builder ───────────────────────────────────────────────────────────

interface Seg {
  d: string;
  dp: number;
  len?: number;
}

/** Project a set of [lat, lon] polylines onto the sphere at (rLon, rLat),
 *  emitting only front-facing (z > 0) sub-paths. Each Seg carries the
 *  cumulative screen-space length of its sub-path so callers can drive a
 *  stroke-dashoffset draw-in animation. Same trace pattern as buildGrid. */
function projectRings(
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
function projectRingsClosed(
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

const BERLIN_LAT = 52.5;
const BERLIN_LON = 13.4;

function buildGrid(
  project: Projector,
  lines: GridLines = gridLines(GRID_STEP),
): { front: Seg[]; back: Seg[] } {
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
  for (const line of lines) trace(line);
  return { front, back };
}

// The complete animated projection is intentionally not serialized into the
// document. This sparse frame uses the exact same Berlin projection and ink
// values, so the real globe is visible in the first HTML paint without a
// visually unrelated poster or a large SVG payload.
const berlinProjector = createProjector(BERLIN_LON, BERLIN_LAT);

/** The flat static frame shows Germany only: the first rings of the fill list. */
const staticGermanyRings = projectRingsClosed(
  COUNTRY_RINGS_3D.BERLIN,
  berlinProjector,
).length;

type Shell = {
  readonly grid: { readonly back: Seg[]; readonly front: Seg[] };
  readonly country: Seg[];
};

const shellCache = new Map<HeroGlobeScene, Shell>();

/**
 * The first-paint shell per scene. The line globe thins its dense grid and
 * outlines; the flat disc has few lines, so it draws the full graticule and
 * the country fills, and the live frame replaces it without a change.
 */
function initialShell(scene: HeroGlobeScene): Shell {
  const hit = shellCache.get(scene);
  if (hit) return hit;
  const paint = PAINT[scene];
  let shell: Shell;
  if (paint.disc) {
    shell = {
      grid: { back: [], front: buildGrid(berlinProjector, gridLines(paint.gridStep)).front },
      country: projectRingsClosed(COUNTRY_RINGS_3D.BERLIN, berlinProjector),
    };
  } else {
    const initialGrid = buildGrid(berlinProjector);
    shell = {
      grid: {
        back: initialGrid.back.filter((_, index) => index % 8 === 0),
        front: initialGrid.front.filter((_, index) => index % 8 === 0),
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
  }
  shellCache.set(scene, shell);
  return shell;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface HeroNetworkProps {
  locale?: Locale;
  scrollProgress: MotionValue<number>;
  className?: string;
  mobile?: boolean;
  frozen?: MotionValue<number>;
  paused?: boolean;
  reducedMotion?: boolean;
  /** Optional outputs — receive the current pan target each frame. */
  latOut?: MotionValue<number>;
  lonOut?: MotionValue<number>;
  /** Index of the city currently being displayed. Flips at 50% through transition. */
  stepIdxOut?: MotionValue<number>;
  /** The home scene to paint in (SPEC D7). Defaults to the graphit line globe. */
  scene?: HeroGlobeScene;
}

export function HeroNetwork({
  locale = "de",
  className,
  mobile,
  frozen,
  paused = false,
  reducedMotion = false,
  latOut,
  lonOut,
  stepIdxOut,
  scene = "graphit",
}: HeroNetworkProps) {
  const paint = PAINT[scene];
  const flat = paint.disc !== null;
  const localizedSteps = useMemo(() => heroNetworkSteps(locale), [locale]);
  // The parent reads matchMedia after hydration and passes a stable boolean.
  // Keep rendering tied to that explicit input; the animation effect performs
  // its own direct media-query guard before scheduling any work.
  const prefersReduced = reducedMotion;
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const lastFrameRef = useRef(0);
  // Visibility gating: only spin the globe while the hero is on-screen and the
  // tab is visible. runningRef guards the self-scheduling rAF; pausedAtRef keeps
  // the animation clock continuous across pauses (no rotation "snap" on resume).
  const runningRef = useRef(false);
  const pausedAtRef = useRef(0);

  // Refs for direct DOM mutation
  const gridBackRef = useRef<SVGGElement>(null);
  const gridFrontShadowRef = useRef<SVGGElement>(null);
  const gridFrontRef = useRef<SVGGElement>(null);
  // Per-layer refs for the city beat — one <g> per kind so we can diff
  // children counts independently without index collisions.
  const countryGlowRef = useRef<SVGGElement>(null);
  const countryFillRef = useRef<SVGGElement>(null);
  const countryRef = useRef<SVGGElement>(null);
  const initialShellRef = useRef<SVGGElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const cursorRef = useRef<SVGTextElement>(null);
  const stepDotsRef = useRef<SVGGElement>(null);

  const animate = useCallback(() => {
    // RAF gating happens in the useEffect — animate is only invoked when
    // !prefersReduced && !mobile. The static fallback is rendered via JSX
    // (staticGrid / staticCountry / staticCountryFill) without RAF.
    const now = performance.now();
    // The August production globe followed every 60 Hz animation frame. Keep
    // that smooth cadence, but cap high-refresh displays so they do not repeat
    // the expensive projection more than sixty times per second. A one
    // millisecond tolerance prevents a nominal 16.6 ms display interval from
    // falling through to every second frame because of timer precision.
    if (
      lastFrameRef.current !== 0 &&
      now - lastFrameRef.current < FRAME_INTERVAL_MS - 1
    ) {
      if (runningRef.current) rafRef.current = requestAnimationFrame(animate);
      return;
    }
    lastFrameRef.current = now;
    if (startRef.current === 0) startRef.current = now;
    const t = (now - startRef.current) / 1000;

    // The declarative first frame already establishes the sphere. The live
    // projection starts settled instead of blanking it and fading it back in.
    const entrance = 1;
    const isFrozen = (frozen?.get() ?? 0) > 0.5;

    // Step panning
    const activeT = Math.max(0, t - HERO_GLOBE_START_DELAY_SECONDS);
    const totalCycle = localizedSteps.length * HERO_GLOBE_STEP_SECONDS;
    const cycleT = activeT % totalCycle;
    const stepIdx =
      Math.floor(cycleT / HERO_GLOBE_STEP_SECONDS) % localizedSteps.length;
    const stepT =
      (cycleT - stepIdx * HERO_GLOBE_STEP_SECONDS) /
      HERO_GLOBE_STEP_SECONDS;
    const cur = localizedSteps[stepIdx];
    const next = localizedSteps[(stepIdx + 1) % localizedSteps.length];
    // Globe rotation centers — fall back to the city's coords if no override.
    // The override lets us frame the country off-center within the disc (e.g.
    // SF rotates further east so USA fills the right side, away from the
    // headline on the left).
    const curRLat = cur.rLat ?? cur.lat;
    const curRLon = cur.rLon ?? cur.lon;
    const nextRLat = next.rLat ?? next.lat;
    const nextRLon = next.rLon ?? next.lon;

    let targetLat: number,
      targetLon: number,
      isTransitioning = false;

    if (isFrozen || stepT < HERO_GLOBE_DWELL_RATIO) {
      targetLat = curRLat;
      targetLon = curRLon;
      if (!isFrozen) {
        targetLon += Math.sin(t * 0.4) * 0.3;
        targetLat += Math.sin(t * 0.25 + 1.2) * 0.15;
      }
    } else {
      isTransitioning = true;
      const transT = sfEase(
        (stepT - HERO_GLOBE_DWELL_RATIO) /
          (1 - HERO_GLOBE_DWELL_RATIO),
      );
      targetLat = curRLat + (nextRLat - curRLat) * transT;
      targetLon = lerpLon(curRLon, nextRLon, transT);
    }

    // Expose current pan target to listeners (sidebar coordinates).
    latOut?.set(targetLat);
    lonOut?.set(targetLon);

    // City label flips to the destination at 50% of the transition so the
    // sidebar feels like it's leading the eye toward where the globe is going.
    const displayIdx =
      isTransitioning &&
      (stepT - HERO_GLOBE_DWELL_RATIO) /
        (1 - HERO_GLOBE_DWELL_RATIO) >
        0.5
        ? (stepIdx + 1) % localizedSteps.length
        : stepIdx;
    stepIdxOut?.set(displayIdx);

    // ── Grid ────────────────────────────────────────────────────────────
    const project = createProjector(targetLon, targetLat);
    const grid = buildGrid(project, gridLines(paint.gridStep));
    // The flat disc hides the far side and draws one knockout line weight.
    if (flat) grid.back.length = 0;

    // Back grid
    const gbEl = gridBackRef.current;
    if (gbEl) {
      while (gbEl.children.length > grid.back.length) gbEl.lastChild?.remove();
      grid.back.forEach((s, i) => {
        let p = gbEl.children[i] as SVGPathElement | undefined;
        if (!p) {
          p = document.createElementNS("http://www.w3.org/2000/svg", "path");
          gbEl.appendChild(p);
        }
        p.setAttribute("d", s.d);
        p.setAttribute("stroke", paint.line);
        p.setAttribute(
          "stroke-opacity",
          String((0.025 + s.dp * 0.035) * entrance),
        );
        p.setAttribute("stroke-width", "0.4");
        p.setAttribute("fill", "none");
      });
    }

    // Front grid shadow (drawn ink effect)
    const gfsEl = gridFrontShadowRef.current;
    if (gfsEl) {
      const shadow = flat ? [] : grid.front;
      while (gfsEl.children.length > shadow.length)
        gfsEl.lastChild?.remove();
      shadow.forEach((s, i) => {
        let p = gfsEl.children[i] as SVGPathElement | undefined;
        if (!p) {
          p = document.createElementNS("http://www.w3.org/2000/svg", "path");
          gfsEl.appendChild(p);
        }
        const w = 0.45 + s.dp * 0.4;
        p.setAttribute("d", s.d);
        p.setAttribute("stroke", LC);
        p.setAttribute(
          "stroke-opacity",
          String((0.02 + s.dp * 0.05) * entrance),
        );
        p.setAttribute("stroke-width", String(w * 2.5));
        p.setAttribute("fill", "none");
      });
    }

    // Front grid (sharp)
    const gfEl = gridFrontRef.current;
    if (gfEl) {
      while (gfEl.children.length > grid.front.length) gfEl.lastChild?.remove();
      grid.front.forEach((s, i) => {
        let p = gfEl.children[i] as SVGPathElement | undefined;
        if (!p) {
          p = document.createElementNS("http://www.w3.org/2000/svg", "path");
          gfEl.appendChild(p);
        }
        p.setAttribute("d", s.d);
        p.setAttribute("fill", "none");
        p.setAttribute("stroke", paint.line);
        if (flat) {
          p.setAttribute("stroke-width", String(FLAT_GRID_WIDTH));
          p.setAttribute("vector-effect", "non-scaling-stroke");
          return;
        }
        const shimmer = 1 + Math.sin(t * 1.5 + i * 0.7) * 0.04;
        const w = 0.45 + s.dp * 0.4;
        p.setAttribute(
          "stroke-opacity",
          String((0.06 + s.dp * 0.16) * entrance * shimmer),
        );
        p.setAttribute("stroke-width", String(w));
      });
    }

    // ──────────────────────────────────────────────────────────────────
    // Country layer: PERSISTENT — all 6 countries render every frame and
    // simply rotate with the globe. Back-face culling via projectRings
    // hides anything behind the limb. The typing word is the only
    // per-beat indicator.
    //
    //   - thicker but very transparent outline (barely-visible hairline)
    //   - hatch fill at low alpha (architectural blueprint wash)
    //   - depth-modulated opacity so countries near the limb dim toward 0
    //   - global `entrance` ramp drives the page-load fade-in
    //
    // Meridian still uses a one-shot draw-in per beat (carrier wave through
    // the active city only).
    // ──────────────────────────────────────────────────────────────────

    // ── Country: 3 layered passes per segment — glow + hatch + outline.
    // 1. Radial gradient glow underneath: country emits soft Kupfer light
    //    from its centroid, fading to transparent at the edges (heat
    //    signature feel, not a flat fill).
    // 2. Hatch overlay on top of the glow at low opacity — adds blueprint
    //    texture without competing with the glow. Pattern rotation drifts
    //    slowly per-frame for a subtle moiré.
    // 3. Outline drawn with a vertical Kupfer gradient (brighter top → dim
    //    bottom) — sells "lit from above" depth.
    //
    // A subtle 4-second breathing pulse (±8%) on the global opacity keeps
    // the countries feeling alive without ever calling attention to itself.
    const glowEl = countryGlowRef.current;
    const fillEl = countryFillRef.current;
    const cE = countryRef.current;
    // Render countries from t=0 (no activeT gate) so they fade in TOGETHER
    // with the graticule — the user shouldn't see the globe alone first.
    if (glowEl && fillEl && cE) {
      // Two passes per country:
      //   `outlineSegs` — open polylines per visible arc, used by the OUTLINE
      //                   stroke (no auto-closure issues for strokes).
      //   `fillSegs`    — one closed path per ring, with limb-arc closures so
      //                   the hatch + glow never paint into the disc interior
      //                   when a country crosses the limb (no straight chord).
      const outlineSegs: Seg[] = [];
      const fillSegs: Seg[] = [];
      // The flat disc shows one Butter country at a time: the one the
      // typing word names. The line globe keeps all six.
      const keys = flat ? [STEP_COUNTRY[displayIdx]] : STEP_COUNTRY;
      for (const key of keys) {
        const rings = COUNTRY_RINGS_3D[key];
        if (!flat) {
          for (const seg of projectRings(rings, project)) outlineSegs.push(seg);
        }
        for (const seg of projectRingsClosed(rings, project))
          fillSegs.push(seg);
      }
      // The flat disc: every country is one flat Butter shape, no glow.
      const glowSegs = flat ? [] : fillSegs;
      // 1. Radial glow — barely there, just a soft tint at the centroid.
      //    Uses limb-arc closed paths so the glow stays on visible front only.
      while (glowEl.children.length > glowSegs.length)
        glowEl.lastChild?.remove();
      glowSegs.forEach((s, i) => {
        let p = glowEl.children[i] as SVGPathElement | undefined;
        if (!p) {
          p = document.createElementNS("http://www.w3.org/2000/svg", "path");
          glowEl.appendChild(p);
        }
        p.setAttribute("d", s.d);
        p.setAttribute("fill", "url(#countryGlow)");
        p.setAttribute("fill-opacity", String((0.03 + s.dp * 0.03) * entrance));
        p.setAttribute("stroke", "none");
      });
      // 2. Hatch overlay — uniform Kupfer alpha across the country.
      //    Same limb-arc closed paths so the hatch never crosses the chord.
      while (fillEl.children.length > fillSegs.length)
        fillEl.lastChild?.remove();
      fillSegs.forEach((s, i) => {
        let fp = fillEl.children[i] as SVGPathElement | undefined;
        if (!fp) {
          fp = document.createElementNS("http://www.w3.org/2000/svg", "path");
          fillEl.appendChild(fp);
        }
        fp.setAttribute("d", s.d);
        fp.setAttribute("fill", flat ? paint.accent : "url(#countryHatch)");
        fp.setAttribute("fill-opacity", String(flat ? 1 : 0.1 * entrance));
        fp.setAttribute("stroke", "none");
      });
      // 3. Outline — solid Kupfer, uniform alpha (no top→bottom gradient).
      //    Strokes don't auto-close, so the open per-arc paths render clean.
      while (cE.children.length > outlineSegs.length) cE.lastChild?.remove();
      outlineSegs.forEach((s, i) => {
        let p = cE.children[i] as SVGPathElement | undefined;
        if (!p) {
          p = document.createElementNS("http://www.w3.org/2000/svg", "path");
          cE.appendChild(p);
        }
        p.setAttribute("d", s.d);
        p.setAttribute("stroke", KUPFER);
        p.setAttribute(
          "stroke-opacity",
          String((0.13 + s.dp * 0.05) * entrance),
        );
        p.setAttribute("stroke-width", "2.0");
        p.setAttribute("stroke-linecap", "round");
        p.setAttribute("fill", "none");
      });
    }

    // Every live layer is populated at this point. The sparse initial frame
    // shares the same geometry, so removing it is a seamless detail upgrade.
    initialShellRef.current?.setAttribute("opacity", "0");

    // ── Text with typing cursor ─────────────────────────────────────────
    const textEl = textRef.current;
    const cursorEl = cursorRef.current;
    if (textEl && cursorEl) {
      if (!isTransitioning && !isFrozen && activeT > 0) {
        const dwellT = stepT / HERO_GLOBE_DWELL_RATIO;
        const word = cur.word;
        textEl.setAttribute("opacity", String(entrance));

        const fadeInStart = 0.08;
        const fadeInEnd = 0.45;
        const holdEnd = 0.82;

        // Character-by-character typing
        const charsToShow =
          dwellT < fadeInStart
            ? 0
            : dwellT < fadeInEnd
              ? Math.floor(
                  ((dwellT - fadeInStart) / (fadeInEnd - fadeInStart)) *
                    word.length,
                )
              : word.length;

        // Build displayed text
        const displayedWord = word.slice(0, Math.min(charsToShow, word.length));

        // Overall text opacity for fade-out
        let textOp = 0.85;
        if (dwellT >= holdEnd) {
          textOp = 0.85 * (1 - (dwellT - holdEnd) / (1 - holdEnd));
        } else if (dwellT < fadeInStart) {
          textOp = 0;
        }

        textEl.textContent = displayedWord;
        textEl.setAttribute("opacity", String(Math.max(0, textOp) * entrance));

        // Blinking cursor _
        const showCursor = dwellT < holdEnd;
        const cursorBlink =
          showCursor &&
          (charsToShow < word.length || Math.floor(t * 1.8) % 2 === 0);
        cursorEl.textContent = cursorBlink ? "_" : "";
        cursorEl.setAttribute("opacity", String(textOp * entrance));

        // Position cursor right after the text (text is at TX which is right of center)
        // Cursor follows the text — text is centered on CX (textAnchor="middle"),
        // so the cursor sits at CX + textWidth/2.
        const estimatedTextWidth = displayedWord.length * 16; // ~16 px per char at 30 px Geist Sans
        const textWidth =
          word === "Demos" && displayedWord.length > 0
            ? textEl.getComputedTextLength()
            : estimatedTextWidth;
        const cursorGap = word === "Demos" ? 1 : 2;
        cursorEl.setAttribute("x", String(CX + textWidth / 2 + cursorGap));
      } else {
        textEl.setAttribute("opacity", "0");
        cursorEl.setAttribute("opacity", "0");
      }
    }

    // Step dots (the line globe only; the flat disc sets on the foot)
    const stepsEl = flat ? null : stepDotsRef.current;
    if (stepsEl) {
      for (let i = 0; i < stepsEl.children.length; i++) {
        const c = stepsEl.children[i] as SVGCircleElement;
        c.setAttribute("r", i === stepIdx ? "2.2" : "1.2");
        c.setAttribute("fill", i === stepIdx ? KUPFER : LC);
        c.setAttribute(
          "opacity",
          String((i === stepIdx ? 0.8 : 0.2) * entrance),
        );
      }
    }

    // Self-schedule only while the loop is meant to be running (paused when the
    // hero scrolls off-screen / the tab is hidden — see the gating effect below).
    if (runningRef.current) rafRef.current = requestAnimationFrame(animate);
  }, [flat, frozen, latOut, localizedSteps, lonOut, paint, stepIdxOut]);

  useEffect(() => {
    // The parent switches to the declarative static composition after
    // hydration. Read the system preference here as well so a reduced-motion
    // browser cannot execute even one live projection while that state syncs.
    if (
      prefersReduced ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      mobile ||
      paused
    )
      return;
    const el = containerRef.current;
    if (!el) return;

    const play = () => {
      if (runningRef.current) return;
      // Shift the start clock forward by the paused span so rotation resumes
      // seamlessly instead of jumping to where a never-paused clock would be.
      if (pausedAtRef.current !== 0 && startRef.current !== 0) {
        startRef.current += performance.now() - pausedAtRef.current;
      }
      pausedAtRef.current = 0;
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(animate);
    };
    const pause = () => {
      if (!runningRef.current) return;
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      pausedAtRef.current = performance.now();
    };

    let onScreen = false;
    let sceneFrozen = (frozen?.get() ?? 0) > 0.5;
    const sync = () => {
      if (
        onScreen &&
        !sceneFrozen &&
        document.visibilityState === "visible"
      )
        play();
      else pause();
    };
    const stopFrozenSubscription = frozen?.on("change", (value) => {
      const nextFrozen = value > 0.5;
      if (nextFrozen === sceneFrozen) return;
      sceneFrozen = nextFrozen;
      sync();
    });

    // rootMargin gives a small head-start so the globe is already spinning by
    // the time the hero scrolls back into view.
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? false;
        sync();
      },
      { rootMargin: "150px" },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", sync);

    return () => {
      io.disconnect();
      stopFrozenSubscription?.();
      document.removeEventListener("visibilitychange", sync);
      if (runningRef.current) pausedAtRef.current = performance.now();
      cancelAnimationFrame(rafRef.current);
      runningRef.current = false;
    };
  }, [animate, frozen, mobile, paused, prefersReduced]);

  useEffect(() => {
    if (!prefersReduced && !mobile) return;

    // Animated paths are inserted imperatively. React does not own those
    // children, so clear them when a breakpoint or motion preference switches
    // to the declarative static composition. The live groups are also hidden
    // in that render, preventing a one-frame doubled globe before this effect.
    for (const layer of [
      gridBackRef,
      gridFrontShadowRef,
      gridFrontRef,
      countryGlowRef,
      countryFillRef,
      countryRef,
    ]) {
      layer.current?.replaceChildren();
    }
  }, [mobile, prefersReduced]);

  // Static fallback (prefers-reduced-motion / mobile): a single canonical
  // composition centered on Berlin, with ALL 6 countries on the globe so the
  // viewer sees the full set rather than just the home country. Memoized: the
  // projection math is expensive and the inputs only change with the
  // reduced-motion / mobile flags.
  const staticGrid = useMemo(() => {
    if (!prefersReduced && !mobile) return null;
    const grid = buildGrid(berlinProjector, gridLines(paint.gridStep));
    return flat ? { front: grid.front, back: [] } : grid;
  }, [prefersReduced, mobile, paint, flat]);
  // Outlines: open per-arc paths (the line globe only).
  const staticCountry = useMemo(
    () =>
      (prefersReduced || mobile) && !flat
        ? STEP_COUNTRY.flatMap((key) =>
            projectRings(COUNTRY_RINGS_3D[key], berlinProjector),
          )
        : null,
    [prefersReduced, mobile, flat],
  );
  const shell = !staticGrid ? initialShell(scene) : null;

  // Fills: closed paths with limb-arc closures (no chord across the disc).
  const staticCountryFill = useMemo(
    () =>
      prefersReduced || mobile
        ? STEP_COUNTRY.flatMap((key) =>
            projectRingsClosed(COUNTRY_RINGS_3D[key], berlinProjector),
          )
        : null,
    [prefersReduced, mobile],
  );
  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-none select-none [contain:content]",
        className,
      )}
      aria-hidden="true"
      data-hero-network-motion={
        prefersReduced || mobile ? "static" : paused ? "paused" : "running"
      }
    >
      <svg
        // The flat disc fills its square box edge to edge; the line globe
        // keeps its framing.
        viewBox={flat ? `${CX - R} ${CY - R} ${2 * R} ${2 * R}` : "-120 -20 660 620"}
        preserveAspectRatio={flat ? "xMinYMin meet" : undefined}
        fill="none"
        className="h-full w-full"
        style={{ overflow: "visible" }}
        shapeRendering="geometricPrecision"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {!flat ? (
            <radialGradient id="sphereVolume" cx="38%" cy="30%" r="72%">
              <stop offset="0%" stopColor={WARM} stopOpacity="0.012" />
              <stop offset="58%" stopColor={WARM} stopOpacity="0.02" />
              <stop offset="84%" stopColor={WARM} stopOpacity="0.055" />
              <stop offset="100%" stopColor={WARM} stopOpacity="0.11" />
            </radialGradient>
          ) : null}
          <clipPath id="gc">
            <circle cx={CX} cy={CY} r={R} />
          </clipPath>
          {/* Diagonal hatching for the country interior — static blueprint
               texture. Thicker hairlines (0.85 px) so the lines actually
               read as scaffolding, not as a wash. */}
          {!flat ? (
          <pattern
            id="countryHatch"
            patternUnits="userSpaceOnUse"
            width="6"
            height="6"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              stroke={KUPFER}
              strokeOpacity="1"
              strokeWidth="0.85"
            />
          </pattern>
          ) : null}
          {/* Radial inner-glow — soft Kupfer wash at the centroid (uniform
               radially: same opacity at top edge and bottom edge of the
               country). Whispers the country's presence behind the hatch. */}
          {!flat ? (
          <radialGradient id="countryGlow" cx="50%" cy="50%" r="58%">
            <stop offset="0%" stopColor={KUPFER} stopOpacity="0.55" />
            <stop offset="55%" stopColor={KUPFER} stopOpacity="0.22" />
            <stop offset="100%" stopColor={KUPFER} stopOpacity="0" />
          </radialGradient>
          ) : null}
        </defs>

        {paint.disc ? (
          // The flat Mennige disc: one shape, its edge is the limb.
          <circle
            data-hero-globe-disc=""
            cx={CX}
            cy={CY}
            r={R}
            fill={paint.disc}
          />
        ) : (
          <>
            <circle cx={CX} cy={CY} r={R} fill="url(#sphereVolume)" />
            {/* A warm-neutral silhouette gives the sphere volume without a
                large coloured background wash or a paint-heavy blur filter. */}
            <circle
              cx={CX}
              cy={CY}
              r={R + 1}
              stroke={WARM}
              strokeOpacity={0.12}
              strokeWidth={2.4}
              fill="none"
            />
          </>
        )}

        <g clipPath="url(#gc)" strokeLinecap="round" strokeLinejoin="round">
          {shell ? (
            <g
              ref={initialShellRef}
              data-hero-network-shell
              className="transition-opacity duration-100 motion-reduce:transition-none"
            >
              {shell.grid.back.map((s, i) => (
                <path
                  key={`ib${i}`}
                  d={s.d}
                  stroke={LC}
                  strokeOpacity={
                    Math.round((0.025 + s.dp * 0.035) * 1000) / 1000
                  }
                  strokeWidth={0.4}
                  fill="none"
                />
              ))}
              {shell.grid.front.map((s, i) =>
                flat ? (
                  <path
                    key={`if${i}`}
                    d={s.d}
                    stroke={paint.line}
                    strokeWidth={FLAT_GRID_WIDTH}
                    vectorEffect="non-scaling-stroke"
                    fill="none"
                  />
                ) : (
                  <path
                    key={`if${i}`}
                    d={s.d}
                    stroke={LC}
                    strokeOpacity={
                      Math.round((0.06 + s.dp * 0.16) * 1000) / 1000
                    }
                    strokeWidth={Math.round((0.45 + s.dp * 0.4) * 1000) / 1000}
                    fill="none"
                  />
                ),
              )}
              {shell.country.map((s, i) =>
                flat ? (
                  <path key={`ic${i}`} d={s.d} fill={paint.accent} stroke="none" />
                ) : (
                  <path
                    key={`ic${i}`}
                    d={s.d}
                    stroke={KUPFER}
                    strokeOpacity={
                      Math.round((0.13 + s.dp * 0.05) * 1000) / 1000
                    }
                    strokeWidth={2}
                    fill="none"
                  />
                ),
              )}
            </g>
          ) : null}
          <g
            ref={gridBackRef}
            data-hero-network-live="grid-back"
            display={staticGrid ? "none" : undefined}
          />
          <g
            ref={gridFrontShadowRef}
            display={staticGrid ? "none" : undefined}
          />
          <g ref={gridFrontRef} display={staticGrid ? "none" : undefined} />
          {/* Country: 3 layered passes (paint order = z-stack)
               1. radial glow (light-emitting wash)
               2. hatch texture overlay (subtle)
               3. outline (uniform Kupfer stroke). */}
          <g ref={countryGlowRef} display={staticGrid ? "none" : undefined} />
          <g ref={countryFillRef} display={staticGrid ? "none" : undefined} />
          <g ref={countryRef} display={staticGrid ? "none" : undefined} />

          {/* Static fallback for prefers-reduced-motion */}
          {staticGrid &&
            staticGrid.back.map((s, i) => (
              <path
                key={`sb${i}`}
                d={s.d}
                stroke={LC}
                strokeOpacity={Math.round((0.025 + s.dp * 0.035) * 1000) / 1000}
                strokeWidth={0.4}
                fill="none"
              />
            ))}
          {staticGrid &&
            staticGrid.front.map((s, i) =>
              flat ? (
                <path
                  key={`sf${i}`}
                  d={s.d}
                  stroke={paint.line}
                  strokeWidth={FLAT_GRID_WIDTH}
                  vectorEffect="non-scaling-stroke"
                  fill="none"
                />
              ) : (
                <path
                  key={`sf${i}`}
                  d={s.d}
                  stroke={LC}
                  strokeOpacity={
                    Math.round((0.06 + s.dp * 0.16) * 1000) / 1000
                  }
                  strokeWidth={Math.round((0.45 + s.dp * 0.4) * 1000) / 1000}
                  fill="none"
                />
              ),
            )}
          {flat &&
            staticCountryFill &&
            staticCountryFill.slice(0, staticGermanyRings).map((s, i) => (
              <path
                key={`sff${i}`}
                d={s.d}
                fill={paint.accent}
                stroke="none"
              />
            ))}
          {!flat &&
            staticCountryFill &&
            staticCountryFill.map((s, i) => (
              <path
                key={`scg${i}`}
                d={s.d}
                fill="url(#countryGlow)"
                fillOpacity={Math.round((0.03 + s.dp * 0.03) * 1000) / 1000}
                stroke="none"
              />
            ))}
          {!flat &&
            staticCountryFill &&
            staticCountryFill.map((s, i) => (
              <path
                key={`scf${i}`}
                d={s.d}
                fill="url(#countryHatch)"
                fillOpacity={0.1}
                stroke="none"
              />
            ))}
          {staticCountry &&
            staticCountry.map((s, i) => (
              <path
                key={`sc${i}`}
                d={s.d}
                stroke={KUPFER}
                strokeOpacity={Math.round((0.13 + s.dp * 0.05) * 1000) / 1000}
                strokeWidth={2.0}
                fill="none"
                strokeLinecap="round"
              />
            ))}
        </g>

        {!flat ? (
          <circle
            cx={CX}
            cy={CY}
            r={R}
            stroke={LC}
            strokeOpacity={0.04}
            strokeWidth={0.3}
            fill="none"
          />
        ) : null}

        {/* Typing word — placed just above the country shape so it reads as
            a label for the visible country, not a floating header. */}
        {!mobile && (
          <>
            <text
              ref={textRef}
              data-hero-network-word
              x={CX}
              y={CY - R * 0.45}
              fontFamily="var(--font-loehrning-sans), sans-serif"
              fontSize="30"
              fontWeight="600"
              letterSpacing="-0.02em"
              fill={paint.accent}
              textAnchor="middle"
              opacity="0"
            />
            <text
              ref={cursorRef}
              x={CX + 110}
              y={CY - R * 0.45}
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fontSize="30"
              fontWeight="300"
              fill={paint.accent}
              opacity="0"
            >
              _
            </text>
          </>
        )}

        {/* Step dots (the line globe only) */}
        {!mobile && !flat && (
          <g ref={stepDotsRef} opacity="0.5">
            {localizedSteps.map((_, i) => (
              <circle
                key={i}
                cx={CX - ((localizedSteps.length - 1) * 7) / 2 + i * 7}
                cy={CY + R + 16}
                r={1.2}
                fill={LC}
                opacity={0.2}
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}

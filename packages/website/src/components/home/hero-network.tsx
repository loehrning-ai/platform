"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import { useReducedMotion, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { COUNTRY_POLYLINES_3D, type CountryKey3D } from "@/lib/country-polylines-3d";
import { heroNetworkSteps, STEPS } from "@/components/home/hero-network-steps";
import type { Locale } from "@/lib/i18n/locale";

// Re-exported for backward compatibility (hero-network.test.tsx imports
// STEPS from this module). hero.tsx imports STEPS directly from
// hero-network-steps.ts to avoid statically pulling in this file's heavy
// projection math + COUNTRY_POLYLINES_3D data — see hero.tsx for why.
export { STEPS };

/** Maps STEPS index → country key. Aligned 1:1 with the STEPS array below. */
const STEP_COUNTRY: readonly CountryKey3D[] = [
  "BERLIN",         // STEPS[0] Germany
  "SAO_PAULO",      // STEPS[1] Brazil
  "BEIJING",        // STEPS[2] China
  "SAN_FRANCISCO",  // STEPS[3] USA
  "MUMBAI",         // STEPS[4] India (EU AI Act extraterritorial reach)
  "TOKYO",          // STEPS[5] Japan
];

// ─── Constants ──────────────────────────────────────────────────────────────

const R = 500;
const CX = 320;
const CY = 380;
const DEG = Math.PI / 180;
const KUPFER = "#C4431A";
const GRID_STEP = 7;
const LC = "rgb(20,20,19)";
const WARM = "rgb(40,30,22)";

// ─── Locations (dramatic cross-globe panning) ───────────────────────────────
// Step/journey data (Step type + STEPS constant) now lives in
// ./hero-network-steps — imported above and re-exported for compatibility.

const STEP_DUR = 7;
const DWELL = 0.78;

// ─── Math ───────────────────────────────────────────────────────────────────

function ll3d(lat: number, lon: number): [number, number, number] {
  const la = lat * DEG, lo = lon * DEG;
  return [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)];
}
function rY(x: number, y: number, z: number, a: number): [number, number, number] {
  const c = Math.cos(a), s = Math.sin(a); return [x*c+z*s, y, -x*s+z*c];
}
function rX(x: number, y: number, z: number, a: number): [number, number, number] {
  const c = Math.cos(a), s = Math.sin(a); return [x, y*c-z*s, y*s+z*c];
}
/** Project (lat, lon) to screen, with the globe rotated so that
 *  (rLat, rLon) lands dead center on the front face (z ≈ 1). The -0.15 rad
 *  X tilt biases the city slightly above the equator-of-view so it sits
 *  comfortably alongside the typing word in the upper-right area. */
function project(lat: number, lon: number, rLon: number, rLat: number): { sx: number; sy: number; z: number } {
  let [x, y, z] = ll3d(lat, lon);
  [x, y, z] = rY(x, y, z, (rLon - 90) * DEG);
  [x, y, z] = rX(x, y, z, rLat * DEG - 0.15);
  return { sx: CX + x * R, sy: CY - y * R, z };
}
function dp(sx: number, sy: number, z: number): number {
  const ed = Math.sqrt((sx - CX) ** 2 + (sy - CY) ** 2) / R;
  return (1 - Math.pow(Math.min(ed, 1), 1.6)) * Math.max(0, z);
}
function sfEase(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function lerpLon(a: number, b: number, t: number): number {
  let d = b - a; if (d > 180) d -= 360; if (d < -180) d += 360; return a + d * t;
}

// ─── Grid builder ───────────────────────────────────────────────────────────

interface Seg { d: string; dp: number; len?: number }

/** Project a set of [lat, lon] polylines onto the sphere at (rLon, rLat),
 *  emitting only front-facing (z > 0) sub-paths. Each Seg carries the
 *  cumulative screen-space length of its sub-path so callers can drive a
 *  stroke-dashoffset draw-in animation. Same trace pattern as buildGrid. */
function projectRings(
  rings: readonly (readonly (readonly [number, number])[])[],
  rLon: number,
  rLat: number,
): Seg[] {
  const out: Seg[] = [];
  for (const ring of rings) {
    let d = "", live = false, sumDp = 0, n = 0, len = 0, lastSx = 0, lastSy = 0;
    for (const [lat, lon] of ring) {
      const pt = project(lat, lon, rLon, rLat);
      if (pt.z > 0) {
        const c = `${pt.sx.toFixed(1)},${pt.sy.toFixed(1)}`;
        if (live) {
          d += ` L${c}`;
          len += Math.hypot(pt.sx - lastSx, pt.sy - lastSy);
        } else {
          d += `M${c}`;
        }
        lastSx = pt.sx; lastSy = pt.sy;
        live = true;
        sumDp += dp(pt.sx, pt.sy, pt.z);
        n++;
      } else if (live) {
        out.push({ d, dp: n > 0 ? sumDp / n : 0, len });
        d = ""; live = false; sumDp = 0; n = 0; len = 0;
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
  rings: readonly (readonly (readonly [number, number])[])[],
  rLon: number,
  rLat: number,
): Seg[] {
  const out: Seg[] = [];
  for (const ring of rings) {
    const pts = ring.map(([lat, lon]) => project(lat, lon, rLon, rLat));
    const n = pts.length;
    if (n === 0) continue;

    // Fast path 1: ring fully behind the limb — skip.
    let anyFront = false, anyBack = false;
    for (const p of pts) {
      if (p.z > 0) anyFront = true;
      else anyBack = true;
      if (anyFront && anyBack) break;
    }
    if (!anyFront) continue;

    // Fast path 2: ring fully in front — single straight closed path.
    if (!anyBack) {
      let d = "", sumDp = 0;
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
        curEntry = { ang, sx: CX + R * Math.cos(ang), sy: CY + R * Math.sin(ang) };
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
    let sumDp = 0, vcount = 0;
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

function buildGrid(rLon: number, rLat: number): { front: Seg[]; back: Seg[] } {
  const front: Seg[] = [], back: Seg[] = [];
  const trace = (points: { sx: number; sy: number; z: number }[]) => {
    let pF = "", pB = "", lF = false, lB = false, sF = 0, cF = 0, sB = 0, cB = 0;
    for (const p of points) {
      const c = `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`;
      if (p.z > 0) {
        if (!lF && pB) { back.push({ d: pB, dp: cB > 0 ? sB/cB : 0 }); pB = ""; sB = 0; cB = 0; }
        pF += lF ? ` L${c}` : `M${c}`; lF = true; lB = false; sF += dp(p.sx, p.sy, p.z); cF++;
      } else {
        if (!lB && pF) { front.push({ d: pF, dp: cF > 0 ? sF/cF : 0 }); pF = ""; sF = 0; cF = 0; }
        pB += lB ? ` L${c}` : `M${c}`; lB = true; lF = false; sB += Math.abs(p.z); cB++;
      }
    }
    if (pF) front.push({ d: pF, dp: cF > 0 ? Math.round(sF/cF * 10000) / 10000 : 0 });
    if (pB) back.push({ d: pB, dp: cB > 0 ? Math.round(sB/cB * 10000) / 10000 : 0 });
  };
  for (let lat = -80; lat <= 80; lat += GRID_STEP) {
    const pts = []; for (let lon = -180; lon <= 180; lon += 4) pts.push(project(lat, lon, rLon, rLat));
    trace(pts);
  }
  for (let lon = -180; lon < 180; lon += GRID_STEP) {
    const pts = []; for (let lat = -90; lat <= 90; lat += 4) pts.push(project(lat, lon, rLon, rLat));
    trace(pts);
  }
  return { front, back };
}

// ─── Component ──────────────────────────────────────────────────────────────

interface HeroNetworkProps {
  locale?: Locale;
  scrollProgress: MotionValue<number>;
  className?: string;
  mobile?: boolean;
  frozen?: MotionValue<number>;
  /** Optional outputs — receive the current pan target each frame. */
  latOut?: MotionValue<number>;
  lonOut?: MotionValue<number>;
  /** Index of the city currently being displayed. Flips at 50% through transition. */
  stepIdxOut?: MotionValue<number>;
}

export function HeroNetwork({ locale = "de", className, mobile, frozen, latOut, lonOut, stepIdxOut }: HeroNetworkProps) {
  const localizedSteps = useMemo(() => heroNetworkSteps(locale), [locale]);
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const startRef = useRef(0);
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
  const textRef = useRef<SVGTextElement>(null);
  const cursorRef = useRef<SVGTextElement>(null);
  const stepDotsRef = useRef<SVGGElement>(null);

  const animate = useCallback(() => {
    // RAF gating happens in the useEffect — animate is only invoked when
    // !prefersReduced && !mobile. The static fallback is rendered via JSX
    // (staticGrid / staticCountry / staticCountryFill) without RAF.
    const now = performance.now();
    if (startRef.current === 0) startRef.current = now;
    const t = (now - startRef.current) / 1000;

    const rawE = Math.min(1, t / 2.5);
    const entrance = 1 - Math.pow(1 - rawE, 3);
    const isFrozen = (frozen?.get() ?? 0) > 0.5;

    // Step panning
    const activeT = Math.max(0, t - 2);
    const totalCycle = localizedSteps.length * STEP_DUR;
    const cycleT = activeT % totalCycle;
    const stepIdx = Math.floor(cycleT / STEP_DUR) % localizedSteps.length;
    const stepT = (cycleT - stepIdx * STEP_DUR) / STEP_DUR;
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

    let targetLat: number, targetLon: number, isTransitioning = false;

    if (isFrozen || stepT < DWELL) {
      targetLat = curRLat;
      targetLon = curRLon;
      if (!isFrozen) {
        targetLon += Math.sin(t * 0.4) * 0.3;
        targetLat += Math.sin(t * 0.25 + 1.2) * 0.15;
      }
    } else {
      isTransitioning = true;
      const transT = sfEase((stepT - DWELL) / (1 - DWELL));
      targetLat = curRLat + (nextRLat - curRLat) * transT;
      targetLon = lerpLon(curRLon, nextRLon, transT);
    }

    // Expose current pan target to listeners (sidebar coordinates).
    latOut?.set(targetLat);
    lonOut?.set(targetLon);

    // City label flips to the destination at 50% of the transition so the
    // sidebar feels like it's leading the eye toward where the globe is going.
    const displayIdx =
      isTransitioning && (stepT - DWELL) / (1 - DWELL) > 0.5
        ? (stepIdx + 1) % localizedSteps.length
        : stepIdx;
    stepIdxOut?.set(displayIdx);

    // ── Grid ────────────────────────────────────────────────────────────
    const grid = buildGrid(targetLon, targetLat);

    // Back grid
    const gbEl = gridBackRef.current;
    if (gbEl) {
      while (gbEl.children.length > grid.back.length) gbEl.lastChild?.remove();
      grid.back.forEach((s, i) => {
        let p = gbEl.children[i] as SVGPathElement | undefined;
        if (!p) { p = document.createElementNS("http://www.w3.org/2000/svg", "path"); gbEl.appendChild(p); }
        p.setAttribute("d", s.d);
        p.setAttribute("stroke", LC);
        p.setAttribute("stroke-opacity", String((0.025 + s.dp * 0.035) * entrance));
        p.setAttribute("stroke-width", "0.4");
        p.setAttribute("fill", "none");
      });
    }

    // Front grid shadow (drawn ink effect)
    const gfsEl = gridFrontShadowRef.current;
    if (gfsEl) {
      while (gfsEl.children.length > grid.front.length) gfsEl.lastChild?.remove();
      grid.front.forEach((s, i) => {
        let p = gfsEl.children[i] as SVGPathElement | undefined;
        if (!p) { p = document.createElementNS("http://www.w3.org/2000/svg", "path"); gfsEl.appendChild(p); }
        const w = 0.45 + s.dp * 0.4;
        p.setAttribute("d", s.d);
        p.setAttribute("stroke", LC);
        p.setAttribute("stroke-opacity", String((0.02 + s.dp * 0.05) * entrance));
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
        if (!p) { p = document.createElementNS("http://www.w3.org/2000/svg", "path"); gfEl.appendChild(p); }
        const shimmer = 1 + Math.sin(t * 1.5 + i * 0.7) * 0.04;
        const w = 0.45 + s.dp * 0.4;
        p.setAttribute("d", s.d);
        p.setAttribute("stroke", LC);
        p.setAttribute("stroke-opacity", String((0.06 + s.dp * 0.16) * entrance * shimmer));
        p.setAttribute("stroke-width", String(w));
        p.setAttribute("fill", "none");
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
      for (const key of STEP_COUNTRY) {
        const rings = COUNTRY_POLYLINES_3D[key];
        for (const seg of projectRings(rings, targetLon, targetLat)) outlineSegs.push(seg);
        for (const seg of projectRingsClosed(rings, targetLon, targetLat)) fillSegs.push(seg);
      }
      // 1. Radial glow — barely there, just a soft tint at the centroid.
      //    Uses limb-arc closed paths so the glow stays on visible front only.
      while (glowEl.children.length > fillSegs.length) glowEl.lastChild?.remove();
      fillSegs.forEach((s, i) => {
        let p = glowEl.children[i] as SVGPathElement | undefined;
        if (!p) { p = document.createElementNS("http://www.w3.org/2000/svg", "path"); glowEl.appendChild(p); }
        p.setAttribute("d", s.d);
        p.setAttribute("fill", "url(#countryGlow)");
        p.setAttribute("fill-opacity", String((0.03 + s.dp * 0.03) * entrance));
        p.setAttribute("stroke", "none");
      });
      // 2. Hatch overlay — uniform Kupfer alpha across the country.
      //    Same limb-arc closed paths so the hatch never crosses the chord.
      while (fillEl.children.length > fillSegs.length) fillEl.lastChild?.remove();
      fillSegs.forEach((s, i) => {
        let fp = fillEl.children[i] as SVGPathElement | undefined;
        if (!fp) { fp = document.createElementNS("http://www.w3.org/2000/svg", "path"); fillEl.appendChild(fp); }
        fp.setAttribute("d", s.d);
        fp.setAttribute("fill", "url(#countryHatch)");
        fp.setAttribute("fill-opacity", String(0.10 * entrance));
        fp.setAttribute("stroke", "none");
      });
      // 3. Outline — solid Kupfer, uniform alpha (no top→bottom gradient).
      //    Strokes don't auto-close, so the open per-arc paths render clean.
      while (cE.children.length > outlineSegs.length) cE.lastChild?.remove();
      outlineSegs.forEach((s, i) => {
        let p = cE.children[i] as SVGPathElement | undefined;
        if (!p) { p = document.createElementNS("http://www.w3.org/2000/svg", "path"); cE.appendChild(p); }
        p.setAttribute("d", s.d);
        p.setAttribute("stroke", KUPFER);
        p.setAttribute("stroke-opacity", String((0.13 + s.dp * 0.05) * entrance));
        p.setAttribute("stroke-width", "2.0");
        p.setAttribute("stroke-linecap", "round");
        p.setAttribute("fill", "none");
      });
    }

    // ── Text with typing cursor ─────────────────────────────────────────
    const textEl = textRef.current;
    const cursorEl = cursorRef.current;
    if (textEl && cursorEl) {
      if (!isTransitioning && !isFrozen && activeT > 0) {
        const dwellT = stepT / DWELL;
        const word = cur.word;
        textEl.setAttribute("opacity", String(entrance));

        const fadeInStart = 0.08;
        const fadeInEnd = 0.45;
        const holdEnd = 0.82;

        // Character-by-character typing
        const charsToShow = dwellT < fadeInStart ? 0
          : dwellT < fadeInEnd ? Math.floor(((dwellT - fadeInStart) / (fadeInEnd - fadeInStart)) * word.length)
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
        const cursorBlink = showCursor && (charsToShow < word.length || Math.floor(t * 1.8) % 2 === 0);
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

    // Step dots
    const stepsEl = stepDotsRef.current;
    if (stepsEl) {
      for (let i = 0; i < stepsEl.children.length; i++) {
        const c = stepsEl.children[i] as SVGCircleElement;
        c.setAttribute("r", i === stepIdx ? "2.2" : "1.2");
        c.setAttribute("fill", i === stepIdx ? KUPFER : LC);
        c.setAttribute("opacity", String((i === stepIdx ? 0.8 : 0.2) * entrance));
      }
    }

    // Self-schedule only while the loop is meant to be running (paused when the
    // hero scrolls off-screen / the tab is hidden — see the gating effect below).
    if (runningRef.current) rafRef.current = requestAnimationFrame(animate);
  }, [frozen, latOut, localizedSteps, lonOut, stepIdxOut]);

  useEffect(() => {
    if (prefersReduced || mobile) return;
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
    const sync = () => {
      if (onScreen && document.visibilityState === "visible") play();
      else pause();
    };

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
      document.removeEventListener("visibilitychange", sync);
      cancelAnimationFrame(rafRef.current);
      runningRef.current = false;
    };
  }, [animate, prefersReduced, mobile]);

  // Static fallback (prefers-reduced-motion / mobile): a single canonical
  // composition centered on Berlin, with ALL 6 countries on the globe so the
  // viewer sees the full set rather than just the home country. Memoized: the
  // projection math is expensive and the inputs only change with the
  // reduced-motion / mobile flags.
  const staticGrid = useMemo(
    () => ((prefersReduced || mobile) ? buildGrid(BERLIN_LON, BERLIN_LAT) : null),
    [prefersReduced, mobile],
  );
  // Outlines: open per-arc paths.
  const staticCountry = useMemo(
    () =>
      prefersReduced && !mobile
        ? STEP_COUNTRY.flatMap((key) =>
            projectRings(COUNTRY_POLYLINES_3D[key], BERLIN_LON, BERLIN_LAT),
          )
        : null,
    [prefersReduced, mobile],
  );
  // Fills: closed paths with limb-arc closures (no chord across the disc).
  const staticCountryFill = useMemo(
    () =>
      prefersReduced && !mobile
        ? STEP_COUNTRY.flatMap((key) =>
            projectRingsClosed(COUNTRY_POLYLINES_3D[key], BERLIN_LON, BERLIN_LAT),
          )
        : null,
    [prefersReduced, mobile],
  );
  return (
    <div ref={containerRef} className={cn("pointer-events-none select-none [contain:content]", className)} aria-hidden="true">
      <svg
        viewBox="-120 -20 660 620"
        fill="none"
        className="h-full w-full"
        style={{ overflow: "visible" }}
        shapeRendering="geometricPrecision"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="atmo" cx="50%" cy="50%" r="50%">
            <stop offset="75%" stopColor={WARM} stopOpacity="0" />
            <stop offset="92%" stopColor={WARM} stopOpacity="0.025" />
            <stop offset="100%" stopColor={WARM} stopOpacity="0.06" />
          </radialGradient>
          <radialGradient id="limb" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={LC} stopOpacity="0" />
            <stop offset="60%" stopColor={LC} stopOpacity="0" />
            <stop offset="85%" stopColor={LC} stopOpacity="0.03" />
            <stop offset="95%" stopColor={LC} stopOpacity="0.08" />
            <stop offset="100%" stopColor={LC} stopOpacity="0.14" />
          </radialGradient>
          <clipPath id="gc"><circle cx={CX} cy={CY} r={R} /></clipPath>
          {/* Soft halo around the limb so the sphere reads as 3D, not a flat disc */}
          <filter id="limbHalo" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
          {/* Diagonal hatching for the country interior — static blueprint
               texture. Thicker hairlines (0.85 px) so the lines actually
               read as scaffolding, not as a wash. */}
          <pattern
            id="countryHatch"
            patternUnits="userSpaceOnUse"
            width="6" height="6"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="6" stroke={KUPFER} strokeOpacity="1" strokeWidth="0.85" />
          </pattern>
          {/* Radial inner-glow — soft Kupfer wash at the centroid (uniform
               radially: same opacity at top edge and bottom edge of the
               country). Whispers the country's presence behind the hatch. */}
          <radialGradient id="countryGlow" cx="50%" cy="50%" r="58%">
            <stop offset="0%"  stopColor={KUPFER} stopOpacity="0.55" />
            <stop offset="55%" stopColor={KUPFER} stopOpacity="0.22" />
            <stop offset="100%" stopColor={KUPFER} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={CX} cy={CY} r={R + 20} fill="url(#atmo)" />
        <circle cx={CX} cy={CY} r={R} fill="url(#limb)" />
        {/* Limb halo — blurred outer ring sells the spherical depth */}
        <circle
          cx={CX} cy={CY} r={R + 1}
          stroke={LC} strokeOpacity={0.12} strokeWidth={2.4} fill="none"
          filter="url(#limbHalo)"
        />

        <g clipPath="url(#gc)" strokeLinecap="round" strokeLinejoin="round">
          <g ref={gridBackRef} />
          <g ref={gridFrontShadowRef} />
          <g ref={gridFrontRef} />
          {/* Country: 3 layered passes (paint order = z-stack)
               1. radial glow (light-emitting wash)
               2. hatch texture overlay (subtle)
               3. outline (uniform Kupfer stroke). */}
          <g ref={countryGlowRef} />
          <g ref={countryFillRef} />
          <g ref={countryRef} />

          {/* Static fallback for prefers-reduced-motion */}
          {staticGrid && staticGrid.back.map((s, i) => (
            <path key={`sb${i}`} d={s.d} stroke={LC} strokeOpacity={Math.round((0.025 + s.dp * 0.035) * 1000) / 1000} strokeWidth={0.4} fill="none" />
          ))}
          {staticGrid && staticGrid.front.map((s, i) => (
            <path key={`sf${i}`} d={s.d} stroke={LC} strokeOpacity={Math.round((0.06 + s.dp * 0.16) * 1000) / 1000} strokeWidth={Math.round((0.45 + s.dp * 0.4) * 1000) / 1000} fill="none" />
          ))}
          {staticCountryFill && staticCountryFill.map((s, i) => (
            <path key={`scg${i}`} d={s.d} fill="url(#countryGlow)" fillOpacity={Math.round((0.03 + s.dp * 0.03) * 1000) / 1000} stroke="none" />
          ))}
          {staticCountryFill && staticCountryFill.map((s, i) => (
            <path key={`scf${i}`} d={s.d} fill="url(#countryHatch)" fillOpacity={0.10} stroke="none" />
          ))}
          {staticCountry && staticCountry.map((s, i) => (
            <path key={`sc${i}`} d={s.d} stroke={KUPFER} strokeOpacity={Math.round((0.13 + s.dp * 0.05) * 1000) / 1000} strokeWidth={2.0} fill="none" strokeLinecap="round" />
          ))}
        </g>

        <circle cx={CX} cy={CY} r={R} stroke={LC} strokeOpacity={0.04} strokeWidth={0.3} fill="none" />

        {/* Typing word — placed just above the country shape so it reads as
            a label for the visible country, not a floating header. */}
        {!mobile && (
          <>
            <text
              ref={textRef}
              x={CX} y={CY - R * 0.45}
              fontFamily="var(--font-loehrning-sans), sans-serif"
              fontSize="30" fontWeight="600" letterSpacing="-0.02em"
              fill={KUPFER} textAnchor="middle" opacity="0"
            />
            <text
              ref={cursorRef}
              x={CX + 110} y={CY - R * 0.45}
              fontFamily="var(--font-geist-mono), monospace"
              fontSize="30" fontWeight="300"
              fill={KUPFER} opacity="0"
            >_</text>
          </>
        )}

        {/* Step dots */}
        {!mobile && (
          <g ref={stepDotsRef} opacity="0.5">
            {localizedSteps.map((_, i) => (
              <circle key={i} cx={CX - ((localizedSteps.length - 1) * 7) / 2 + i * 7} cy={CY + R + 16} r={1.2} fill={LC} opacity={0.2} />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}

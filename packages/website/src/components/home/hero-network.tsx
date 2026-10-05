"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import type { MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { heroNetworkSteps, STEPS } from "@/components/home/hero-network-steps";
import {
  berlinComposition,
  buildGrid,
  COUNTRY_RINGS_3D,
  createProjector,
  cropFront,
  GRID_LINES_3D,
  CX,
  CY,
  initialShell,
  KUPFER,
  LC,
  lerpLon,
  paint,
  PHONE_VIEW,
  projectRings,
  projectRingsClosed,
  R,
  sfEase,
  STEP_COUNTRY,
  WARM,
  type Seg,
} from "@/components/home/hero-network-geometry";
import type { Locale } from "@/lib/i18n/locale";

// Re-exported for backward compatibility while the homepage parent loads this
// heavy projection module only after hydration.
export { STEPS };

// Restore the motion profile from the 10 August production build while keeping
// the newer visibility and reduced-motion guards. Capping at 60 avoids doing
// duplicate projection work on high-refresh displays.
export const HERO_GLOBE_FPS = 60;
export const HERO_GLOBE_STEP_SECONDS = 7;
export const HERO_GLOBE_DWELL_RATIO = 0.78;
export const HERO_GLOBE_START_DELAY_SECONDS = 2;
/**
 * The phone globe's cap. It draws a cropped window at whole units, without
 * the far side, the ink shadow or the glow, and half as often: a phone
 * spends a fraction of the desktop's work on the same tour.
 */
export const HERO_GLOBE_COMPACT_FPS = 30;

/**
 * Whether the typing word may show yet. The phone opens with the signal from
 * Berlin alone: no word until the globe has made its first rotation away from
 * Berlin, so the first word appears on the country it has turned to. The
 * desktop cover has no opening to protect and types from the first beat.
 */
export function wordMayShow(compact: boolean, activeSeconds: number): boolean {
  return !compact || activeSeconds >= HERO_GLOBE_STEP_SECONDS;
}

/** Desktop framing: the upper-left of the sphere, the limb on the left. */
const DESKTOP_VIEW_BOX = "-120 -20 660 620";
const PHONE_VIEW_BOX = `${PHONE_VIEW.x} ${PHONE_VIEW.y} ${PHONE_VIEW.width} ${PHONE_VIEW.height}`;

/**
 * The phone globe is drawn at about a third of the desktop scale, so its
 * lines, outlines and typing word are thickened to read at the same CSS
 * weight as on the desktop cover.
 */
export const COMPACT_STROKE = 2.4;
const COMPACT_WORD_SIZE = 44;
const WORD_SIZE = 30;

// ─── Component ──────────────────────────────────────────────────────────────

interface HeroNetworkProps {
  locale?: Locale;
  scrollProgress?: MotionValue<number>;
  className?: string;
  /** The static Berlin composition without the typing word (legacy phone mode). */
  mobile?: boolean;
  /**
   * The phone hero's live globe: the PHONE_VIEW window, thickened strokes,
   * the larger typing word, no step dots, capped at HERO_GLOBE_COMPACT_FPS.
   */
  compact?: boolean;
  frozen?: MotionValue<number>;
  paused?: boolean;
  reducedMotion?: boolean;
  /** Called once the first live frame is on screen (the phone takeover). */
  onLive?: () => void;
  /** Prefix for the SVG ids, unique per globe in the document. */
  idPrefix?: string;
  /** Optional outputs — receive the current pan target each frame. */
  latOut?: MotionValue<number>;
  lonOut?: MotionValue<number>;
  /** Index of the city currently being displayed. Flips at 50% through transition. */
  stepIdxOut?: MotionValue<number>;
}

export function HeroNetwork({
  locale = "de",
  className,
  mobile,
  compact = false,
  frozen,
  paused = false,
  reducedMotion = false,
  onLive,
  idPrefix = "hn",
  latOut,
  lonOut,
  stepIdxOut,
}: HeroNetworkProps) {
  const localizedSteps = useMemo(() => heroNetworkSteps(locale), [locale]);
  // The parent reads matchMedia after hydration and passes a stable boolean.
  // Keep rendering tied to that explicit input; the animation effect performs
  // its own direct media-query guard before scheduling any work.
  const prefersReduced = reducedMotion;
  const staticMode = prefersReduced || Boolean(mobile);
  const stroke = compact ? COMPACT_STROKE : 1;
  const wordSize = compact ? COMPACT_WORD_SIZE : WORD_SIZE;
  const frameIntervalMs =
    1000 / (compact ? HERO_GLOBE_COMPACT_FPS : HERO_GLOBE_FPS);
  const ids = {
    volume: `${idPrefix}-volume`,
    clip: `${idPrefix}-clip`,
    hatch: `${idPrefix}-hatch`,
    glow: `${idPrefix}-glow`,
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const lastFrameRef = useRef(0);
  // Visibility gating: only spin the globe while the hero is on-screen and the
  // tab is visible. runningRef guards the self-scheduling rAF; pausedAtRef keeps
  // the animation clock continuous across pauses (no rotation "snap" on resume).
  const runningRef = useRef(false);
  const pausedAtRef = useRef(0);
  const liveRef = useRef(false);
  const onLiveRef = useRef(onLive);
  onLiveRef.current = onLive;

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
    // the expensive projection more than sixty times per second (thirty on
    // the phone). A one millisecond tolerance prevents a nominal 16.6 ms
    // display interval from falling through to every second frame because of
    // timer precision.
    if (
      lastFrameRef.current !== 0 &&
      now - lastFrameRef.current < frameIntervalMs - 1
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
      (cycleT - stepIdx * HERO_GLOBE_STEP_SECONDS) / HERO_GLOBE_STEP_SECONDS;
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
        (stepT - HERO_GLOBE_DWELL_RATIO) / (1 - HERO_GLOBE_DWELL_RATIO),
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
      (stepT - HERO_GLOBE_DWELL_RATIO) / (1 - HERO_GLOBE_DWELL_RATIO) > 0.5
        ? (stepIdx + 1) % localizedSteps.length
        : stepIdx;
    stepIdxOut?.set(displayIdx);

    // ── Grid ────────────────────────────────────────────────────────────
    const project = createProjector(targetLon, targetLat);
    // The phone draws its window only, and no far side.
    const grid = compact
      ? { front: cropFront(GRID_LINES_3D, project, PHONE_VIEW), back: [] }
      : buildGrid(project);

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
        p.setAttribute("stroke", LC);
        p.setAttribute(
          "stroke-opacity",
          String((0.025 + s.dp * 0.035) * entrance),
        );
        p.setAttribute("stroke-width", "0.4");
        p.setAttribute("fill", "none");
      });
    }

    // Front grid shadow (drawn ink effect; the desktop cover only)
    const gfsEl = gridFrontShadowRef.current;
    if (gfsEl) {
      const shadow = compact ? [] : grid.front;
      while (gfsEl.children.length > shadow.length) gfsEl.lastChild?.remove();
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
        const shimmer = 1 + Math.sin(t * 1.5 + i * 0.7) * 0.04;
        const w = (0.45 + s.dp * 0.4) * stroke;
        p.setAttribute("d", s.d);
        p.setAttribute("stroke", LC);
        p.setAttribute(
          "stroke-opacity",
          String((0.06 + s.dp * 0.16) * entrance * shimmer),
        );
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
    // ──────────────────────────────────────────────────────────────────
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
        const rings = COUNTRY_RINGS_3D[key];
        if (compact) {
          for (const seg of cropFront(rings, project, PHONE_VIEW))
            outlineSegs.push(seg);
        } else {
          for (const seg of projectRings(rings, project)) outlineSegs.push(seg);
        }
        for (const seg of projectRingsClosed(rings, project))
          fillSegs.push(seg);
      }
      // 1. Radial glow — barely there, just a soft tint at the centroid
      //    (the desktop cover only). Uses limb-arc closed paths so the glow
      //    stays on visible front only.
      const glowSegs = compact ? [] : fillSegs;
      while (glowEl.children.length > glowSegs.length)
        glowEl.lastChild?.remove();
      glowSegs.forEach((s, i) => {
        let p = glowEl.children[i] as SVGPathElement | undefined;
        if (!p) {
          p = document.createElementNS("http://www.w3.org/2000/svg", "path");
          glowEl.appendChild(p);
        }
        p.setAttribute("d", s.d);
        p.setAttribute("fill", `url(#${ids.glow})`);
        p.setAttribute(
          "fill-opacity",
          String((0.03 + s.dp * 0.03) * entrance),
        );
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
        fp.setAttribute("fill", `url(#${ids.hatch})`);
        fp.setAttribute("fill-opacity", String(0.1 * entrance));
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
        p.setAttribute("stroke-width", String(2 * stroke));
        p.setAttribute("stroke-linecap", "round");
        p.setAttribute("fill", "none");
      });
    }

    // Every live layer is populated at this point. The sparse initial frame
    // shares the same geometry, so removing it is a seamless detail upgrade.
    initialShellRef.current?.setAttribute("opacity", "0");
    if (!liveRef.current) {
      liveRef.current = true;
      onLiveRef.current?.();
    }

    // ── Text with typing cursor ─────────────────────────────────────────
    const textEl = textRef.current;
    const cursorEl = cursorRef.current;
    if (textEl && cursorEl) {
      if (
        !isTransitioning &&
        !isFrozen &&
        activeT > 0 &&
        wordMayShow(compact, activeT)
      ) {
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

        // Cursor follows the text — text is centered on CX (textAnchor="middle"),
        // so the cursor sits at CX + textWidth/2. About 16 units per character
        // at the 30-unit word size.
        const estimatedTextWidth =
          displayedWord.length * 16 * (wordSize / WORD_SIZE);
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
        c.setAttribute(
          "opacity",
          String((i === stepIdx ? 0.8 : 0.2) * entrance),
        );
      }
    }

    // Self-schedule only while the loop is meant to be running (paused when the
    // hero scrolls off-screen / the tab is hidden — see the gating effect below).
    if (runningRef.current) rafRef.current = requestAnimationFrame(animate);
  }, [
    compact,
    frameIntervalMs,
    frozen,
    ids.glow,
    ids.hatch,
    latOut,
    localizedSteps,
    lonOut,
    stepIdxOut,
    stroke,
    wordSize,
  ]);

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
      if (onScreen && !sceneFrozen && document.visibilityState === "visible")
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
    if (!staticMode) return;

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
  }, [staticMode]);

  // Static fallback (prefers-reduced-motion / mobile): a single canonical
  // composition centered on Berlin, with ALL 6 countries on the globe so the
  // viewer sees the full set rather than just the home country. Computed
  // once per module (hero-network-geometry.ts).
  const composition = staticMode ? berlinComposition() : null;
  // The phone globe mounts over its server frame (hero-globe-frame.tsx),
  // which is its first paint and stays until the first live frame: it needs
  // no sparse shell of its own.
  const shell = composition || compact ? null : initialShell();
  const hidden = composition ? "none" : undefined;

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-none select-none [contain:content]",
        className,
      )}
      aria-hidden="true"
      data-hero-network-motion={
        staticMode ? "static" : paused ? "paused" : "running"
      }
    >
      <svg
        viewBox={compact ? PHONE_VIEW_BOX : DESKTOP_VIEW_BOX}
        preserveAspectRatio={compact ? "xMidYMax slice" : undefined}
        fill="none"
        className="h-full w-full"
        style={{ overflow: compact ? "hidden" : "visible" }}
        shapeRendering="geometricPrecision"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={ids.volume} cx="38%" cy="30%" r="72%">
            <stop offset="0%" stopColor={WARM} stopOpacity="0.012" />
            <stop offset="58%" stopColor={WARM} stopOpacity="0.02" />
            <stop offset="84%" stopColor={WARM} stopOpacity="0.055" />
            <stop offset="100%" stopColor={WARM} stopOpacity="0.11" />
          </radialGradient>
          <clipPath id={ids.clip}>
            <circle cx={CX} cy={CY} r={R} />
          </clipPath>
          {/* Diagonal hatching for the country interior — static blueprint
               texture. Thicker hairlines (0.85 px) so the lines actually
               read as scaffolding, not as a wash. */}
          <pattern
            id={ids.hatch}
            patternUnits="userSpaceOnUse"
            width="6"
            height="6"
            patternTransform={compact ? "rotate(45) scale(2)" : "rotate(45)"}
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
          {/* Radial inner-glow — soft Kupfer wash at the centroid (uniform
               radially: same opacity at top edge and bottom edge of the
               country). Whispers the country's presence behind the hatch. */}
          <radialGradient id={ids.glow} cx="50%" cy="50%" r="58%">
            <stop offset="0%" stopColor={KUPFER} stopOpacity="0.55" />
            <stop offset="55%" stopColor={KUPFER} stopOpacity="0.22" />
            <stop offset="100%" stopColor={KUPFER} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={CX} cy={CY} r={R} fill={`url(#${ids.volume})`} />
        {/* A warm-neutral silhouette gives the sphere volume without a large
            coloured background wash or a paint-heavy blur filter. */}
        <circle
          cx={CX}
          cy={CY}
          r={R + 1}
          stroke={WARM}
          strokeOpacity={0.12}
          strokeWidth={2.4 * (compact ? 1.5 : 1)}
          fill="none"
        />

        <g
          clipPath={`url(#${ids.clip})`}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
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
                  strokeOpacity={paint(0.025 + s.dp * 0.035)}
                  strokeWidth={0.4}
                  fill="none"
                />
              ))}
              {shell.grid.front.map((s, i) => (
                <path
                  key={`if${i}`}
                  d={s.d}
                  stroke={LC}
                  strokeOpacity={paint(0.06 + s.dp * 0.16)}
                  strokeWidth={paint((0.45 + s.dp * 0.4) * stroke)}
                  fill="none"
                />
              ))}
              {shell.country.map((s, i) => (
                <path
                  key={`ic${i}`}
                  d={s.d}
                  stroke={KUPFER}
                  strokeOpacity={paint(0.13 + s.dp * 0.05)}
                  strokeWidth={2 * stroke}
                  fill="none"
                />
              ))}
            </g>
          ) : null}
          {/* The rAF-owned layers, each named by `data-hero-network-live`
               so motion probes can read them. The phone globe draws no far
               side, shadow or glow, so its probes read `grid-front`. */}
          <g
            ref={gridBackRef}
            data-hero-network-live="grid-back"
            display={hidden}
          />
          <g
            ref={gridFrontShadowRef}
            data-hero-network-live="grid-front-shadow"
            display={hidden}
          />
          <g
            ref={gridFrontRef}
            data-hero-network-live="grid-front"
            display={hidden}
          />
          {/* Country: 3 layered passes (paint order = z-stack)
               1. radial glow (light-emitting wash)
               2. hatch texture overlay (subtle)
               3. outline (uniform Kupfer stroke). */}
          <g
            ref={countryGlowRef}
            data-hero-network-live="country-glow"
            display={hidden}
          />
          <g
            ref={countryFillRef}
            data-hero-network-live="country-fill"
            display={hidden}
          />
          <g
            ref={countryRef}
            data-hero-network-live="country-outline"
            display={hidden}
          />

          {/* Static fallback for prefers-reduced-motion */}
          {composition
            ? composition.grid.back.map((s, i) => (
                <path
                  key={`sb${i}`}
                  d={s.d}
                  stroke={LC}
                  strokeOpacity={paint(0.025 + s.dp * 0.035)}
                  strokeWidth={0.4}
                  fill="none"
                />
              ))
            : null}
          {composition
            ? composition.grid.front.map((s, i) => (
                <path
                  key={`sf${i}`}
                  d={s.d}
                  stroke={LC}
                  strokeOpacity={paint(0.06 + s.dp * 0.16)}
                  strokeWidth={paint((0.45 + s.dp * 0.4) * stroke)}
                  fill="none"
                />
              ))
            : null}
          {composition
            ? composition.countryFill.map((s, i) => (
                <path
                  key={`scg${i}`}
                  d={s.d}
                  fill={`url(#${ids.glow})`}
                  fillOpacity={paint(0.03 + s.dp * 0.03)}
                  stroke="none"
                />
              ))
            : null}
          {composition
            ? composition.countryFill.map((s, i) => (
                <path
                  key={`scf${i}`}
                  d={s.d}
                  fill={`url(#${ids.hatch})`}
                  fillOpacity={0.1}
                  stroke="none"
                />
              ))
            : null}
          {composition
            ? composition.country.map((s, i) => (
                <path
                  key={`sc${i}`}
                  d={s.d}
                  stroke={KUPFER}
                  strokeOpacity={paint(0.13 + s.dp * 0.05)}
                  strokeWidth={2 * stroke}
                  fill="none"
                  strokeLinecap="round"
                />
              ))
            : null}
        </g>

        <circle
          cx={CX}
          cy={CY}
          r={R}
          stroke={LC}
          strokeOpacity={0.04}
          strokeWidth={0.3}
          fill="none"
        />

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
              fontSize={wordSize}
              fontWeight="600"
              letterSpacing="-0.02em"
              fill={KUPFER}
              textAnchor="middle"
              opacity="0"
            />
            <text
              ref={cursorRef}
              x={CX + 110}
              y={CY - R * 0.45}
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fontSize={wordSize}
              fontWeight="300"
              fill={KUPFER}
              opacity="0"
            >
              _
            </text>
          </>
        )}

        {/* Step dots (the desktop cover only) */}
        {!mobile && !compact && (
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

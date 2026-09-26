/**
 * Live renderer for the phone hero's horizon globe (Canvas 2D).
 *
 * Loaded only by a dynamic import after load and idle, below lg, with motion
 * allowed and no Save-Data; see src/components/home/phone-globe.tsx. It takes
 * over from the server frame (horizon-globe-frame.tsx) by drawing the same
 * frame into a canvas and only then hiding the SVG, so nothing jumps.
 *
 * Motion: at the takeover the view pushes in (the sphere scales about the
 * apex to fill a tall band, 1.4 s on the deck ease) while the globe eases
 * into a slow eastward drift (about 3 deg/s, one turn in two minutes). A
 * horizontal drag spins it with inertia. The globe only turns about its polar
 * axis, every point is a precomputed unit vector, and projecting it costs
 * eight multiplications.
 *
 * Two canvases: the moving layer (meridians, coastlines, Germany, the
 * Lernroute) redraws per frame; the fixed layer (parallels, which are
 * invariant under the polar spin, and the limb, glint and degree scale)
 * redraws only when the frame changes, i.e. during the push-in and on resize.
 *
 * Budget and lifecycle:
 *  - backing store capped at DPR 2, no per-frame DOM writes;
 *  - the drift runs at 30 fps (it moves 0.1 deg per frame, indistinguishable
 *    from 60); 60 fps only while the push-in runs or a drag or fling is
 *    under the finger. A governor measures what a frame really costs (an
 *    EMA of the time from the frame callback until the next task runs,
 *    which includes the canvas raster and paint that draw() only records)
 *    and steps down (DPR 1.5, then 24 fps, then
 *    DPR 1 and 20 fps) and finally freezes on the current frame when a device
 *    cannot keep up;
 *  - no drawing while the page scrolls (one moving region), while the band
 *    is off screen, while the document is hidden, after pagehide, or while
 *    paused. Paused time is not added to the spin afterwards.
 *
 * Touch: `touch-action: pan-y` on the slot (CSS) keeps vertical page scroll
 * native; only a clearly horizontal drag spins the globe.
 */

import { GERMANY_OUTLINE } from "./globe-geometry";
import {
  BERLIN,
  BERLIN_INSET_UNITS,
  BERLIN_UNITS,
  HORIZON,
  HORIZON_ALPHA,
  HORIZON_DEPTH_FADE,
  HORIZON_GLINT,
  HORIZON_INK,
  HORIZON_ROUTE,
  decodeRings,
  focusFade,
  horizonCenterLon,
  horizonFrame,
  horizonPush,
  limbExit,
  meridianLines,
  parallelLines,
  projectHorizonPoint,
  routeLine,
  routeStations,
  scaleTicks,
  toSpherePolylines,
  tracePolylines,
  viewBasis,
  type HorizonFrame,
} from "./horizon-projection";
import { HORIZON_LAND, HORIZON_LAND_SCALE } from "@/lib/horizon-land";

export type HorizonMotionState = "static" | "running" | "paused" | "idle";

export type HorizonRendererOptions = {
  /** The positioned slot that holds the server frame and the canvas. */
  readonly slot: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  /**
   * Optional second canvas for the fixed layer (parallels and sky), stacked
   * above `canvas`. Without it the fixed layer is drawn into `canvas` on
   * every frame.
   */
  readonly staticCanvas?: HTMLCanvasElement | null;
  /** Start paused (a remembered choice). */
  readonly paused?: boolean;
  /**
   * Earliest takeover, in ms on the performance clock, so the server frame's
   * CSS opening finishes before the canvas replaces it.
   */
  readonly notBefore?: number;
  /** Called whenever the motion state changes. */
  readonly onState?: (state: HorizonMotionState) => void;
};

export type HorizonRenderer = {
  setPaused(paused: boolean): void;
  destroy(): void;
};

/** Drift speed, degrees per second. */
export const HORIZON_DRIFT = 3;
/** Ease-in of the drift after the takeover, seconds. */
const DRIFT_EASE_S = 1.6;
/** Inertia time constant after a fling, seconds (95% gone after 1.2 s). */
const INERTIA_TAU_S = 0.4;
/** Hold drawing this long after the last scroll event, ms. */
const SCROLL_HOLD_MS = 140;
/** Push-in duration after the takeover, ms. */
const PUSH_MS = 1400;
/**
 * Frame-cost budget, ms (EMA of callback + render), before the governor
 * steps down. At 30 fps this keeps the drift under a third of the main thread.
 */
const FRAME_BUDGET_MS = 10;

/**
 * Quality tiers: backing-store DPR cap, the drift's frame rate and the rate
 * while something is under the finger or the push-in runs.
 */
const TIERS = [
  { cap: 2, drift: 30, active: 60 },
  { cap: 1.5, drift: 30, active: 60 },
  { cap: 1.5, drift: 24, active: 30 },
  { cap: 1, drift: 20, active: 30 },
] as const;

/** The deck ease, cubic-bezier(0.16, 1, 0.3, 1), solved for x. */
export function easeDeck(u: number): number {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const x1 = 0.16;
  const y1 = 1;
  const x2 = 0.3;
  const y2 = 1;
  const bx = (t: number) =>
    3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
  const by = (t: number) =>
    3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  let lo = 0;
  let hi = 1;
  let t = u;
  for (let i = 0; i < 24; i++) {
    t = (lo + hi) / 2;
    if (bx(t) < u) lo = t;
    else hi = t;
  }
  return by(t);
}

const DEG = Math.PI / 180;

function rgba(rgb: string, alpha: number): string {
  return `rgba(${rgb},${Math.round(alpha * 1000) / 1000})`;
}

type Geometry = {
  readonly meridians: ReturnType<typeof toSpherePolylines>;
  readonly parallels: ReturnType<typeof toSpherePolylines>;
  readonly land: ReturnType<typeof toSpherePolylines>;
  readonly germany: ReturnType<typeof toSpherePolylines>;
  readonly route: ReturnType<typeof toSpherePolylines>;
  readonly stations: readonly (readonly [number, number])[];
};

let geometry: Geometry | null = null;

function loadGeometry(): Geometry {
  geometry ??= {
    meridians: toSpherePolylines(meridianLines()),
    parallels: toSpherePolylines(parallelLines()),
    land: toSpherePolylines(decodeRings(HORIZON_LAND, HORIZON_LAND_SCALE)),
    germany: toSpherePolylines([GERMANY_OUTLINE]),
    route: toSpherePolylines([routeLine()]),
    stations: routeStations(),
  };
  return geometry;
}

function remToPx(value: string): number {
  const size = parseFloat(value);
  if (Number.isNaN(size)) return 0;
  if (value.trim().endsWith("px")) return size;
  const root = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return size * (Number.isNaN(root) ? 16 : root);
}

export type GovernorVerdict = "hold" | "step" | "freeze";

/**
 * Frame-cost governor: an EMA of per-frame cost (each sample clamped, so one
 * unrelated long task cannot read as a slow globe). Twenty frames over the
 * budget step one level down; at the last level, twenty frames over twice
 * the budget freeze the view.
 */
export function createFrameGovernor(
  levels: number,
  budget = FRAME_BUDGET_MS,
): { readonly level: number; sample(ms: number): GovernorVerdict } {
  let ema = 0;
  let slow = 0;
  let level = 0;
  let frozen = false;
  return {
    get level() {
      return level;
    },
    sample(ms: number): GovernorVerdict {
      if (frozen) return "hold";
      const cost = Math.min(ms, budget * 4);
      ema = ema ? ema * 0.9 + cost * 0.1 : cost;
      const limit = level < levels - 1 ? budget : budget * 2;
      if (ema <= limit) {
        slow = Math.max(0, slow - 1);
        return "hold";
      }
      if (++slow <= 20) return "hold";
      slow = 0;
      if (level < levels - 1) {
        level++;
        ema *= 0.6;
        return "step";
      }
      frozen = true;
      return "freeze";
    },
  };
}

export function createHorizonRenderer(
  options: HorizonRendererOptions,
): HorizonRenderer {
  const { slot, canvas } = options;
  const staticCanvas = options.staticCanvas ?? null;
  const geo = loadGeometry();
  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  let ctx: CanvasRenderingContext2D | null = null;
  let staticCtx: CanvasRenderingContext2D | null = null;
  let frame: HorizonFrame | null = null;
  let gridStroke: CanvasGradient | string = "";
  let coastStroke: CanvasGradient | string = "";
  let hair = 0.5;
  let tier = 0;
  let frozen = false;
  let destroyed = false;
  let live = false;

  let theta = 0;
  let omega = 0;
  let paused = options.paused ?? false;
  let inView = true;
  let dragging = false;
  let coasting = false;
  let motionStart = 0;
  let raf = 0;
  let lastTick = 0;
  let lastDraw = 0;
  let scrollHold = 0;
  let state: HorizonMotionState | null = null;

  // Push-in: the server frame is k = 1; the live view eases to the slot's
  // own k once, after the takeover.
  let size = { width: 0, height: 0 };
  let push = 1;
  let pushFrom = 1;
  let pushTo = 1;
  let pushStart = 0;

  const fixedBasis = viewBasis(HORIZON.viewLat, horizonCenterLon(0));

  function depthGradient(alpha: number): CanvasGradient | string {
    if (!ctx || !frame) return rgba(HORIZON_INK.line, alpha);
    const gradient = ctx.createRadialGradient(
      frame.centerX,
      frame.centerY,
      0,
      frame.centerX,
      frame.centerY,
      frame.radius,
    );
    for (const [stop, factor] of HORIZON_DEPTH_FADE) {
      gradient.addColorStop(stop, rgba(HORIZON_INK.line, alpha * factor));
    }
    return gradient;
  }

  let lift = 1;

  /** Backing stores, transforms and hairline weights for the slot size. */
  function layout(): boolean {
    const width = slot.clientWidth;
    const height = slot.clientHeight;
    if (!width || !height) return false;
    ctx ??= canvas.getContext("2d");
    if (!ctx) return false;
    if (staticCanvas && !staticCtx) staticCtx = staticCanvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, TIERS[tier].cap);
    const bw = Math.round(width * dpr);
    const bh = Math.round(height * dpr);
    for (const [target, context] of [
      [canvas, ctx],
      [staticCanvas, staticCtx],
    ] as const) {
      if (!target || !context) continue;
      if (target.width !== bw) target.width = bw;
      if (target.height !== bh) target.height = bh;
      context.setTransform(bw / width, 0, 0, bh / height, 0, 0);
    }
    size = { width, height };
    pushTo = horizonPush(width, height);
    // Before the takeover the canvas must match the server frame (k = 1);
    // after it, a resize lands on the new push directly unless the push-in
    // is still running, which then retargets.
    if (live && !pushStart && !paused) push = pushTo;
    // Just under one backing pixel: Skia then draws a cheap coverage-scaled
    // hairline. Never wider than the server frame's 0.5 CSS px strokes.
    const scale = Math.max(bw / width, bh / height);
    hair = Math.min(0.5, 0.98 / scale);
    // A capped backing store is upscaled by the compositor, which spreads a
    // hairline and lowers its peak. Lift the alpha by the same ratio so the
    // canvas reads as bright as the server frame it replaces.
    lift = Math.min(1.25, Math.sqrt((window.devicePixelRatio || 1) / scale));
    applyFrame();
    return true;
  }

  /** Frame geometry, gradients and the fixed layer for the current push. */
  function applyFrame(): void {
    frame = horizonFrame(size.width, size.height, push);
    gridStroke = depthGradient(Math.min(1, HORIZON_ALPHA.grid * lift));
    coastStroke = depthGradient(Math.min(1, HORIZON_ALPHA.coast * lift));
    if (staticCtx) drawFixed(staticCtx, true);
  }

  /** Parallels (invariant under the polar spin) and the sky around the limb. */
  function drawFixed(c: CanvasRenderingContext2D, clear: boolean): void {
    const f = frame;
    if (!f) return;
    if (clear) c.clearRect(0, 0, f.width, f.height);
    c.lineJoin = "round";
    c.lineWidth = hair;
    c.beginPath();
    tracePolylines(c, geo.parallels, fixedBasis, f, f.latMin);
    c.strokeStyle = gridStroke;
    c.stroke();

    // Limb, glint and degree scale: the server frame's sky layer, redrawn
    // so it stays on the pushed-in sphere.
    const start = (limbExit(f, -1) - 90) * DEG;
    const end = (limbExit(f, 1) - 90) * DEG;
    c.lineWidth = 1;
    c.beginPath();
    c.arc(f.centerX, f.centerY, f.radius, start, end);
    c.strokeStyle = rgba(HORIZON_INK.line, 0.5);
    c.stroke();
    for (const [half, alpha, width] of HORIZON_GLINT) {
      c.beginPath();
      c.arc(
        f.centerX,
        f.centerY,
        f.radius,
        (-half - 90) * DEG,
        (half - 90) * DEG,
      );
      c.lineWidth = width;
      c.strokeStyle = rgba(HORIZON_INK.line, alpha);
      c.stroke();
    }
    const ticks = scaleTicks(f);
    c.lineWidth = 1;
    for (const [set, alpha] of [
      [ticks.minor, 0.22],
      [ticks.major, 0.4],
    ] as const) {
      c.beginPath();
      for (const [x0, y0, x1, y1] of set) {
        c.moveTo(x0, y0);
        c.lineTo(x1, y1);
      }
      c.strokeStyle = rgba(HORIZON_INK.line, alpha);
      c.stroke();
    }
  }

  function station(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    outer: number,
    inner: number,
    innerRgb: string,
  ): void {
    c.fillStyle = rgba(HORIZON_INK.accent, 1);
    c.fillRect(x - outer / 2, y - outer / 2, outer, outer);
    c.fillStyle = innerRgb;
    c.fillRect(x - inner / 2, y - inner / 2, inner, inner);
  }

  function draw(): void {
    const c = ctx;
    const f = frame;
    if (!c || !f) return;
    c.clearRect(0, 0, f.width, f.height);
    if (!staticCtx) drawFixed(c, false);
    const basis = viewBasis(HORIZON.viewLat, horizonCenterLon(theta));
    c.lineWidth = hair;
    c.lineJoin = "round";

    c.beginPath();
    tracePolylines(c, geo.meridians, basis, f, f.latMin);
    c.strokeStyle = gridStroke;
    c.stroke();

    c.beginPath();
    tracePolylines(c, geo.land, basis, f, f.latMin);
    c.strokeStyle = coastStroke;
    c.stroke();

    const focus = projectHorizonPoint(
      HORIZON.focusLat,
      HORIZON.focusLon,
      basis,
      f,
    );
    const fade = focusFade(focus.depth);
    if (fade <= 0) return;
    const unit = f.width / 1000;

    // The Lernroute and its stations, under Germany.
    c.beginPath();
    tracePolylines(c, geo.route, basis, f, -90);
    c.lineWidth = 1;
    c.strokeStyle = rgba(HORIZON_INK.accent, HORIZON_ROUTE.alpha * fade);
    c.stroke();
    c.globalAlpha = fade;
    for (const [lat, lon] of geo.stations) {
      const point = projectHorizonPoint(lat, lon, basis, f);
      if (point.depth <= 0 || point.y > f.height) continue;
      station(
        c,
        point.x,
        point.y,
        HORIZON_ROUTE.stationUnits * unit,
        HORIZON_ROUTE.stationInsetUnits * unit,
        "#141414",
      );
    }
    c.globalAlpha = 1;

    c.beginPath();
    if (tracePolylines(c, geo.germany, basis, f, -90)) {
      c.closePath();
      c.fillStyle = rgba(HORIZON_INK.accent, HORIZON_ALPHA.germanyFill * fade);
      c.fill();
    }
    c.lineJoin = "miter";
    c.lineWidth = 1.5;
    c.strokeStyle = rgba(HORIZON_INK.accent, HORIZON_ALPHA.germanyStroke * fade);
    c.stroke();

    const berlin = projectHorizonPoint(BERLIN[0], BERLIN[1], basis, f);
    if (berlin.depth > 0) {
      c.globalAlpha = fade;
      station(
        c,
        berlin.x,
        berlin.y,
        BERLIN_UNITS * unit,
        BERLIN_INSET_UNITS * unit,
        rgba(HORIZON_INK.line, 1),
      );
      c.globalAlpha = 1;
    }
  }

  // ---- motion -------------------------------------------------------------

  function motionAllowed(): boolean {
    return !reduceQuery.matches && !frozen;
  }

  function cruise(now: number): number {
    if (paused || !motionAllowed() || !motionStart) return 0;
    const t = (now - motionStart) / 1000;
    if (t <= 0) return 0;
    const u = Math.min(1, t / DRIFT_EASE_S);
    return HORIZON_DRIFT * u * u * (3 - 2 * u);
  }

  function shouldRun(): boolean {
    if (destroyed || !live || !inView || document.hidden || !frame) return false;
    if (reduceQuery.matches) return false;
    if (dragging || Math.abs(omega) > 0.02) return true;
    return !paused && !frozen;
  }

  function pushing(): boolean {
    return pushStart !== 0 && !paused && motionAllowed();
  }

  function startPush(now: number): void {
    if (Math.abs(pushTo - push) < 0.001 || !motionAllowed() || paused) return;
    pushFrom = push;
    pushStart = now;
  }

  /** Advances the push-in; true when the frame changed. */
  function stepPush(now: number): boolean {
    if (!pushing()) return false;
    const u = Math.min(1, Math.max(0, (now - pushStart) / PUSH_MS));
    push = pushFrom + (pushTo - pushFrom) * easeDeck(u);
    if (u >= 1) {
      push = pushTo;
      pushStart = 0;
    }
    applyFrame();
    return true;
  }

  function publish(): void {
    const next: HorizonMotionState = !live
      ? "static"
      : frozen || reduceQuery.matches
        ? "static"
        : paused && !dragging && !coasting
          ? "paused"
          : raf
            ? "running"
            : "idle";
    if (next === state) return;
    state = next;
    slot.setAttribute("data-home-globe-motion", next);
    options.onState?.(next);
  }

  function kick(): void {
    if (!raf && shouldRun()) {
      lastTick = lastDraw = performance.now();
      raf = requestAnimationFrame(tick);
    } else if (raf && !shouldRun()) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    publish();
  }

  /*
   * Frame governor on measured frame cost, not the rAF interval: a throttled
   * phone still delivers most frames on time while each one eats most of
   * the main thread. The cost is measured from the start of the frame
   * callback to the first task after it (a MessageChannel ping), so it
   * includes the canvas raster and paint that follow draw().
   */
  const governor = createFrameGovernor(TIERS.length);
  const ping = typeof MessageChannel === "function" ? new MessageChannel() : null;
  let pingStart = 0;
  if (ping) {
    ping.port1.onmessage = () => {
      if (destroyed || !pingStart) return;
      const cost = performance.now() - pingStart;
      pingStart = 0;
      govern(cost);
    };
  }

  function measure(start: number): void {
    if (!ping) {
      govern(performance.now() - start);
      return;
    }
    pingStart = start;
    ping.port2.postMessage(0);
  }

  function govern(sample: number): void {
    const verdict = governor.sample(sample);
    if (verdict === "step") {
      tier = governor.level;
      if (layout()) draw();
    } else if (verdict === "freeze") {
      frozen = true;
      omega = 0;
      pushStart = 0;
      kick();
    }
  }

  function tick(now: number): void {
    raf = 0;
    if (!shouldRun()) {
      publish();
      return;
    }
    raf = requestAnimationFrame(tick);
    const active = dragging || coasting || pushing();
    const fps = active ? TIERS[tier].active : TIERS[tier].drift;
    if (now - lastDraw < 1000 / fps - 2) return;
    // One moving region: while the page scrolls the globe holds still, and
    // the held time is not added to the spin afterwards.
    if (now < scrollHold && !dragging) {
      if (pushStart) pushStart += now - lastDraw;
      lastTick = lastDraw = now;
      return;
    }
    const target = cruise(now);
    if (coasting && Math.abs(omega - target) < 0.6) coasting = false;
    const dt = Math.min((now - lastTick) / 1000, 0.1);
    lastTick = now;
    if (!dragging) {
      omega = target + (omega - target) * Math.exp(-dt / INERTIA_TAU_S);
      if (Math.abs(omega) < 0.02 && target === 0) omega = 0;
      theta += omega * dt;
    }
    lastDraw = now;
    const t0 = performance.now();
    stepPush(now);
    draw();
    measure(t0);
    publish();
  }

  // ---- drag to spin ---------------------------------------------------------

  type Pointer = {
    id: number;
    x0: number;
    y0: number;
    lastX: number;
    on: boolean;
    samples: [number, number][];
  };
  let pointer: Pointer | null = null;

  function onPointerDown(event: PointerEvent): void {
    if (!live || reduceQuery.matches || frozen) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointer = {
      id: event.pointerId,
      x0: event.clientX,
      y0: event.clientY,
      lastX: event.clientX,
      on: false,
      samples: [],
    };
  }

  function onPointerMove(event: PointerEvent): void {
    if (!pointer || event.pointerId !== pointer.id || !frame) return;
    if (!pointer.on) {
      const dx = event.clientX - pointer.x0;
      const dy = event.clientY - pointer.y0;
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        pointer.on = true;
        pointer.lastX = event.clientX;
        dragging = true;
        omega = 0;
        try {
          slot.setPointerCapture(event.pointerId);
        } catch {
          // Not capturable (synthetic pointer): the drag still works.
        }
        kick();
      } else if (Math.abs(dy) > 10) {
        pointer = null;
      }
      return;
    }
    // The surface under the finger follows it (at about 52 deg N).
    const delta = (event.clientX - pointer.lastX) / (frame.radius * 0.62) / DEG;
    theta += delta;
    pointer.lastX = event.clientX;
    pointer.samples.push([event.timeStamp, delta]);
    while (
      pointer.samples.length > 2 &&
      event.timeStamp - pointer.samples[0][0] > 100
    ) {
      pointer.samples.shift();
    }
  }

  function onPointerEnd(event: PointerEvent): void {
    if (!pointer || event.pointerId !== pointer.id) return;
    if (pointer.on) {
      const samples = pointer.samples;
      let velocity = 0;
      if (
        samples.length > 1 &&
        event.timeStamp - samples[samples.length - 1][0] < 60
      ) {
        let sum = 0;
        for (let i = 1; i < samples.length; i++) sum += samples[i][1];
        const span = (samples[samples.length - 1][0] - samples[0][0]) / 1000;
        velocity = span > 0.008 ? sum / span : 0;
      }
      omega = Math.max(-240, Math.min(240, velocity));
      dragging = false;
      coasting = true;
      lastTick = performance.now();
    }
    pointer = null;
    kick();
  }

  // ---- lifecycle ------------------------------------------------------------

  const onScroll = () => {
    scrollHold = performance.now() + SCROLL_HOLD_MS;
  };
  const onVisibility = () => kick();
  const onPageHide = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    publish();
  };
  const onReduce = () => {
    omega = 0;
    kick();
  };

  let resizeFrame = 0;
  let lastWidth = 0;
  let lastHeight = 0;
  const resizeObserver =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(() => {
          if (resizeFrame) return;
          resizeFrame = requestAnimationFrame(() => {
            resizeFrame = 0;
            if (
              slot.clientWidth === lastWidth &&
              slot.clientHeight === lastHeight
            ) {
              return;
            }
            lastWidth = slot.clientWidth;
            lastHeight = slot.clientHeight;
            if (layout()) draw();
          });
        })
      : null;

  const tabBar = remToPx(
    getComputedStyle(document.documentElement).getPropertyValue("--tabbar-h"),
  );
  const intersectionObserver =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          (entries) => {
            const entry = entries[entries.length - 1];
            inView = entry ? entry.intersectionRatio >= 0.1 : true;
            kick();
          },
          {
            threshold: [0, 0.1, 0.25],
            // The strip under the fixed tab bar does not count as visible.
            rootMargin: `0px 0px ${-Math.round(tabBar)}px 0px`,
          },
        )
      : null;

  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onVisibility);
  reduceQuery.addEventListener("change", onReduce);
  slot.addEventListener("pointerdown", onPointerDown, { passive: true });
  slot.addEventListener("pointermove", onPointerMove, { passive: true });
  slot.addEventListener("pointerup", onPointerEnd);
  slot.addEventListener("pointercancel", onPointerEnd);
  resizeObserver?.observe(slot);
  intersectionObserver?.observe(slot);

  // Takeover: context and layout in one frame, the first draw and the swap
  // in the next, each far below the 50 ms long-task line on a slow phone.
  let takeoverTimer = 0;
  let takeoverFrame = 0;
  function takeover(): void {
    takeoverFrame = requestAnimationFrame(() => {
      if (destroyed || !layout()) return;
      takeoverFrame = requestAnimationFrame(() => {
        takeoverFrame = 0;
        if (destroyed) return;
        lastWidth = slot.clientWidth;
        lastHeight = slot.clientHeight;
        draw();
        live = true;
        slot.setAttribute("data-home-globe-live", "");
        motionStart = performance.now();
        startPush(motionStart);
        kick();
      });
    });
  }
  const wait = Math.max(0, (options.notBefore ?? 0) - performance.now());
  if (wait > 0) takeoverTimer = window.setTimeout(takeover, wait);
  else takeover();

  return {
    setPaused(next: boolean) {
      if (next === paused) return;
      paused = next;
      if (paused) {
        // A push-in cut short stays where it is until the visitor resumes.
        pushStart = 0;
      } else {
        // Resume eases back in from a standstill.
        motionStart = performance.now();
        startPush(motionStart);
      }
      kick();
    },
    destroy() {
      destroyed = true;
      if (ping) {
        ping.port1.onmessage = null;
        ping.port1.close();
        ping.port2.close();
      }
      window.clearTimeout(takeoverTimer);
      if (takeoverFrame) cancelAnimationFrame(takeoverFrame);
      if (raf) cancelAnimationFrame(raf);
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      raf = 0;
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onVisibility);
      reduceQuery.removeEventListener("change", onReduce);
      slot.removeEventListener("pointerdown", onPointerDown);
      slot.removeEventListener("pointermove", onPointerMove);
      slot.removeEventListener("pointerup", onPointerEnd);
      slot.removeEventListener("pointercancel", onPointerEnd);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      slot.removeAttribute("data-home-globe-live");
      slot.setAttribute("data-home-globe-motion", "static");
      for (const [target, context] of [
        [canvas, ctx],
        [staticCanvas, staticCtx],
      ] as const) {
        if (!target || !context) continue;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, target.width, target.height);
      }
      live = false;
    },
  };
}

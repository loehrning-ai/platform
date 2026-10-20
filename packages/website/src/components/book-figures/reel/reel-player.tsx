"use client";

/**
 * Inline cover reel. The same pure `frame(t)` as the MP4 renders, drawn live:
 * squares, ground and hairlines on a canvas (three batched fills), text as DOM.
 * It starts after idle, silent, only while on screen and in view of a tab that
 * is visible; a 44 px switch pauses it; reduced motion keeps the settled cover.
 * Without script, and before it starts, the page shows the cover as one
 * scalable SVG (server markup). No idle requestAnimationFrame: a paused or
 * hidden reel schedules nothing, and a frame is drawn only when its time moved.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import "./reel.css";
import type { ReelFormat } from "./layout.ts";
import { paintCanvas, type Surface } from "./paint.ts";
import { DURATION, POSTER_T, createReel, type Reel } from "./reel.ts";

export interface ReelPlayerProps {
  /** "tall" is 540 x 960 (phone), "wide" is 960 x 540. Mount one per breakpoint. */
  readonly format?: ReelFormat;
  readonly className?: string;
  /** Visible text of the switch. */
  readonly pauseLabel?: string;
  readonly playLabel?: string;
  /** Accessible name of the film (the picture itself is hidden from readers). */
  readonly label?: string;
}

const cache = new Map<ReelFormat, Reel>();

function reelFor(format: ReelFormat): Reel {
  const hit = cache.get(format);
  if (hit) return hit;
  const made = createReel(format);
  cache.set(format, made);
  return made;
}

const PAUSE_PATH = "M1 1h4v12H1zM9 1h4v12H9z";
const PLAY_PATH = "M2 1l11 6-11 6z";

export function ReelPlayer({
  format = "tall",
  className,
  pauseLabel = "Pause",
  playLabel = "Weiter",
  label = "Cover-Film ohne Ton: zwölf Befunde aus der Auswertung in 30 Sekunden",
}: ReelPlayerProps): React.ReactElement {
  const reel = reelFor(format);
  const { W, H } = reel.layout;
  const poster = reel.staticSvg(POSTER_T, `-${format}`);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  const [paused, setPaused] = useState(false);
  const state = useRef({ t: 0, started: 0, playing: false, visible: false, raf: 0, lastHtml: "" });

  const draw = useCallback(
    (t: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const dpr = Number(canvas.dataset.dpr ?? "1");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintCanvas(ctx as unknown as Surface, reel.scene(t));
      const html = reel.html(t);
      if (html !== state.current.lastHtml && textRef.current) {
        textRef.current.innerHTML = html;
        state.current.lastHtml = html;
      }
    },
    [reel],
  );

  const stop = useCallback(() => {
    const s = state.current;
    s.playing = false;
    if (s.raf) cancelAnimationFrame(s.raf);
    s.raf = 0;
  }, []);

  const play = useCallback(() => {
    const s = state.current;
    if (s.playing || !s.visible) return;
    s.playing = true;
    s.started = performance.now() - s.t * 1000;
    const tick = (now: number): void => {
      if (!s.playing) return;
      s.t = ((now - s.started) / 1000) % DURATION;
      draw(s.t);
      s.raf = requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);
  }, [draw]);

  /* Go live after idle, unless the reader asked for less motion. */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const handle = idle ? idle(() => setLive(true)) : window.setTimeout(() => setLive(true), 600);
    return () => {
      if (!idle) window.clearTimeout(handle);
    };
  }, []);

  /* Size the stage to its box and the canvas to the display (DPR capped). */
  useEffect(() => {
    if (!live) return undefined;
    const root = rootRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!root || !stage || !canvas) return undefined;
    const dpr = Math.min(2, navigator.hardwareConcurrency <= 4 ? 1.5 : 2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    canvas.dataset.dpr = String(dpr);
    const fit = (): void => {
      stage.style.transform = `scale(${root.clientWidth / W})`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(root);
    draw(state.current.t);
    return () => ro.disconnect();
  }, [live, W, H, draw]);

  /* Run only while the reel is on screen, the tab is visible and the reader has not paused. */
  useEffect(() => {
    if (!live) return undefined;
    const root = rootRef.current;
    if (!root) return undefined;
    const sync = (): void => {
      if (state.current.visible && !document.hidden && !paused) play();
      else stop();
    };
    const io = new IntersectionObserver((entries) => {
      state.current.visible = entries.some((e) => e.isIntersecting);
      sync();
    });
    io.observe(root);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      stop();
    };
  }, [live, paused, play, stop]);

  return (
    <div
      ref={rootRef}
      className={["reel-player", className].filter(Boolean).join(" ")}
      style={{ aspectRatio: `${W} / ${H}` }}
      role="group"
      aria-label={label}
      data-format={format}
      data-live={live ? "true" : "false"}
    >
      <div className="reel-poster" dangerouslySetInnerHTML={{ __html: poster }} />
      {live ? (
        <div className="reel-live" aria-hidden="true">
          <div ref={stageRef} className="reel-stage" style={{ width: W, height: H }}>
            <canvas ref={canvasRef} />
            <div ref={textRef} />
          </div>
        </div>
      ) : null}
      {live ? (
        <button
          type="button"
          role="switch"
          aria-checked={paused}
          className="reel-switch"
          onClick={() => setPaused((p) => !p)}
        >
          <svg viewBox="0 0 14 14" aria-hidden="true">
            <path d={paused ? PLAY_PATH : PAUSE_PATH} />
          </svg>
          <span>{paused ? playLabel : pauseLabel}</span>
        </button>
      ) : null}
    </div>
  );
}

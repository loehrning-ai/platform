"use client";

import { useEffect, useRef } from "react";
import {
  DOT_FIELD_CURSOR_EASE,
  DOT_FIELD_FRAME_MS,
  DOT_FIELD_MAX_DPR,
  buildConstellations,
  drawDotField,
} from "./dot-field-shapes";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * The moving layer of the /login scene: one decorative canvas that draws the
 * drifting dot-matrix shapes at about 30fps. It is loaded lazily (never on
 * the server), stays `aria-hidden`, and draws nothing at all while
 * `prefers-reduced-motion: reduce` holds, so a reduced-motion visitor sees the
 * static dot grid only. The loop stops while the document is hidden and while
 * the visitor has paused it; the scene clock only advances on drawn frames,
 * so motion resumes where it stopped, without a jump.
 */
export function DotField({ paused }: { readonly paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const controlRef = useRef<{ readonly sync: () => void } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reducedMotion = window.matchMedia?.(REDUCED_MOTION_QUERY);
    const ctx = canvas.getContext?.("2d") ?? null;
    if (!ctx) return;

    const constellations = buildConstellations();
    let width = 0;
    let height = 0;
    let t = 0;
    let last = 0;
    let frame = 0;
    let cursorX = 0;
    let cursorY = 0;
    let targetX = 0;
    let targetY = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, DOT_FIELD_MAX_DPR);
      width = canvas.clientWidth || window.innerWidth;
      height = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const render = () =>
      drawDotField(ctx, constellations, t, width, height, cursorX, cursorY);

    const motionAllowed = () =>
      !pausedRef.current &&
      document.visibilityState !== "hidden" &&
      !(reducedMotion?.matches ?? false);

    const loop = (now: number) => {
      frame = 0;
      if (!motionAllowed()) return;
      if (now - last >= DOT_FIELD_FRAME_MS) {
        last = now;
        // Advance in seconds per drawn frame, independent of the display rate.
        t += DOT_FIELD_FRAME_MS / 1000;
        cursorX += (targetX - cursorX) * DOT_FIELD_CURSOR_EASE;
        cursorY += (targetY - cursorY) * DOT_FIELD_CURSOR_EASE;
        render();
      }
      frame = window.requestAnimationFrame(loop);
    };

    const stop = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    };

    const sync = () => {
      if (reducedMotion?.matches) {
        // Static grid only: no shape stays on screen under reduced motion.
        stop();
        ctx.clearRect(0, 0, width, height);
        return;
      }
      if (!motionAllowed()) {
        // Paused or hidden: keep the last frame, schedule nothing.
        stop();
        return;
      }
      if (!frame) {
        last = 0;
        frame = window.requestAnimationFrame(loop);
      }
    };

    const onResize = () => {
      resize();
      // A resize clears the backing store; repaint the current frame so a
      // paused scene does not go blank.
      if (!(reducedMotion?.matches ?? false)) render();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !width || !height) return;
      // Normalised -0.5..0.5 from the viewport centre.
      targetX = event.clientX / width - 0.5;
      targetY = event.clientY / height - 0.5;
    };

    resize();
    if (!(reducedMotion?.matches ?? false)) render();
    controlRef.current = { sync };
    sync();

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", sync);
    reducedMotion?.addEventListener?.("change", sync);

    return () => {
      stop();
      controlRef.current = null;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", sync);
      reducedMotion?.removeEventListener?.("change", sync);
    };
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
    controlRef.current?.sync();
  }, [paused]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-login-dot-field=""
      className="login-dot-field"
    />
  );
}

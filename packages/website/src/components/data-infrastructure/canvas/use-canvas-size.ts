"use client";

// ─── useCanvasAutoSize (plan 010 stage 2) ───────────────────────────
//
// The source hardcodes a 2x backing-store multiplier for every canvas
// (`cvs.width = r.width * 2`) and then hand-computes scaleX/scaleY per draw
// call against that assumption. This replaces both with the real
// `devicePixelRatio` and a single `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`
// applied once per resize, so every widget's draw code can work directly in
// CSS-pixel coordinates instead of re-deriving a scale factor per element —
// sharper on high-DPI displays, correct on standard ones, and simpler to
// keep faithful to the source's layout math.
//
// Must be called from `useLayoutEffect`-gated widgets (KafkaTopic, StackFlow)
// so the canvas is sized before any `getBoundingClientRect()`-derived
// coordinate is read; safe to call from a plain `useEffect` everywhere else.

import { useEffect, useRef } from "react";

export interface CanvasAutoSizeOptions {
  readonly minWidth?: number;
  readonly minHeight?: number;
  /** Called after every resize (including the initial one), so a widget can
   * redraw immediately instead of waiting for its next natural RAF tick. */
  readonly onResize?: () => void;
}

export function useCanvasAutoSize(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  wrapRef: React.RefObject<HTMLElement | null>,
  options: CanvasAutoSizeOptions = {},
): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = typeof window !== "undefined" && window.devicePixelRatio ? window.devicePixelRatio : 1;
      const cssWidth = Math.max(optionsRef.current.minWidth ?? 0, rect.width);
      const cssHeight = Math.max(optionsRef.current.minHeight ?? 0, rect.height);
      if (cssWidth <= 0 || cssHeight <= 0) return;
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      optionsRef.current.onResize?.();
    };

    resize();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [canvasRef, wrapRef]);
}

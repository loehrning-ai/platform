"use client";

// ─── useCanvasAutoSize ───────────────────────────
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

    // Real bug found during live QA: ResizeObserver
    // fires an "initial" callback asynchronously right after .observe() is
    // called, even when the size hasn't changed since the synchronous
    // resize() call below. Reassigning canvas.width/height ALWAYS clears the
    // canvas bitmap per the HTML spec — even when set to the exact same
    // value — so that redundant initial callback was silently wiping out
    // the very first real draw before a settled widget (one whose draw()
    // returns false, i.e. every canvas widget with no animation in flight)
    // ever scheduled another frame to redraw it. Every canvas widget on
    // every lesson rendered blank until the next user interaction. Tracking
    // the last-applied device-pixel size and skipping the reassignment (and
    // the implicit clear) when it hasn't actually changed fixes this for
    // every consumer at once, regardless of ResizeObserver timing.
    let lastWidthPx = -1;
    let lastHeightPx = -1;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr =
        typeof window !== "undefined" && window.devicePixelRatio
          ? window.devicePixelRatio
          : 1;
      const cssWidth = Math.max(optionsRef.current.minWidth ?? 0, rect.width);
      const cssHeight = Math.max(
        optionsRef.current.minHeight ?? 0,
        rect.height,
      );
      if (cssWidth <= 0 || cssHeight <= 0) return;
      const widthPx = Math.round(cssWidth * dpr);
      const heightPx = Math.round(cssHeight * dpr);
      if (widthPx === lastWidthPx && heightPx === lastHeightPx) return;
      lastWidthPx = widthPx;
      lastHeightPx = heightPx;
      canvas.width = widthPx;
      canvas.height = heightPx;
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

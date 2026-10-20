"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/components/book-figures/story/use-motion";
import { cappedDpr, type ReelEngine, type ReelHandle, type ReelLoader } from "./reel-contract";
import { loadReelEngine } from "./reel-loader";
import "./cover-reel.css";

/**
 * The inline slot of the 30 second insight reel on the book cover, the first
 * thing under the title band.
 *
 * Server markup first: the poster (the giant numeral, one claim line of at most
 * 12 words and the settled field as SVG, the LCP) in a box with a fixed aspect
 * (3:4 on phones, 16:9 wide), so nothing jumps. After the browser is idle, and
 * only without reduced motion, the reel engine is loaded lazily and draws the
 * film into a canvas plus a text host (seek(t)). The reel is silent, loops,
 * pauses off-screen and in a hidden tab, and has a 48px pause switch under it.
 * With no engine, under reduced motion or without script the poster stays and
 * no switch is shown (nothing moves).
 */

const COPY = {
  de: { pause: "Bewegung anhalten", play: "Bewegung starten", label: "Das Buch in 30 Sekunden" },
  en: { pause: "Pause motion", play: "Start motion", label: "The book in 30 seconds" },
} as const;

/**
 * Second of the loop the live reel starts at: 1,3 s, where the 89 squares of the hook stand as a field and the
 * 46 % slams in as 41 of them fall, so the first painted frame is squares and the finding, not an empty box
 * (frame 0 is the seam to the end card) and not the bar. The loop plays on to 30 s and wraps to 0.
 */
export const REEL_START_T = 1.3;

export function CoverReel({
  poster,
  copy,
  unit,
  locale = "de",
  load = loadReelEngine,
}: {
  /** Server-rendered poster field: the settled cover squares. */
  readonly poster: ReactNode;
  /** Server-rendered numeral and claim; a visually hidden copy remains while the film shows them itself. */
  readonly copy: ReactNode;
  /** The one-line unit under the field ("1 Quadrat = ..."); shown with the poster only. */
  readonly unit?: ReactNode;
  readonly locale?: "de" | "en";
  /** Tests inject an engine; the page uses the default loader. */
  readonly load?: ReelLoader;
}) {
  const text = COPY[locale];
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"poster" | "playing" | "paused">("poster");
  const pausedRef = useRef(false);

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    const box = boxRef.current;
    const canvas = canvasRef.current;
    const host = textRef.current;
    if (!root || !box || !canvas || !host) return;
    let cancelled = false;
    let handle: ReelHandle | null = null;
    let engine: ReelEngine | null = null;
    let frame = 0;
    let visible = false;
    let clock = REEL_START_T;
    let last = 0;
    let mountedWidth = 0;
    let mountedFormat = "";

    const running = (): boolean => handle !== null && visible && !pausedRef.current && !document.hidden;
    const tick = (now: number): void => {
      frame = 0;
      if (!handle || !running()) return;
      clock += last === 0 ? 0 : (now - last) / 1000;
      last = now;
      handle.seek(clock % handle.duration);
      frame = requestAnimationFrame(tick);
    };
    const ensure = (): void => {
      if (running() && frame === 0) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    };

    const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      ensure();
    }) : null;
    const onVisibility = (): void => ensure();
    const onPause = (): void => ensure();
    root.addEventListener("reel:resume", onPause);

    const mountHandle = async (): Promise<void> => {
      if (!engine) return;
      // The box's own border is outside the canvas and the text host: they fill the padding box.
      const rect = { width: box.clientWidth, height: box.clientHeight };
      const dpr = cappedDpr(window.devicePixelRatio || 1, navigator.hardwareConcurrency);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const next = await engine.mount(canvas, { width: rect.width, height: rect.height, dpr, text: host });
      if (cancelled) {
        next.destroy();
        return;
      }
      handle = next;
      mountedWidth = rect.width;
      mountedFormat = rect.width >= rect.height * 1.2 ? "wide" : "tall";
      handle.seek(clock % handle.duration);
    };

    const start = async (): Promise<void> => {
      engine = await load();
      if (!engine || cancelled) return;
      await mountHandle();
      if (cancelled || !handle) return;
      setState(pausedRef.current ? "paused" : "playing");
      if (observer) observer.observe(root);
      else visible = true;
      document.addEventListener("visibilitychange", onVisibility);
      ensure();
    };

    /** A rotated phone or a window dragged across the breakpoint needs a canvas of the new size. */
    let resizeTimer = 0;
    const onResize = (): void => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!handle || cancelled) return;
        const rect = { width: box.clientWidth, height: box.clientHeight };
        const format = rect.width >= rect.height * 1.2 ? "wide" : "tall";
        if (format === mountedFormat && Math.abs(rect.width - mountedWidth) < 8) return;
        handle.destroy();
        handle = null;
        void mountHandle().then(ensure);
      }, 150);
    };
    window.addEventListener("resize", onResize);

    const idle = typeof window.requestIdleCallback === "function";
    const handleId = idle ? window.requestIdleCallback(() => void start(), { timeout: 2000 }) : window.setTimeout(() => void start(), 400);

    return () => {
      cancelled = true;
      if (idle) window.cancelIdleCallback(handleId);
      else window.clearTimeout(handleId);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
      if (frame !== 0) cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      root.removeEventListener("reel:resume", onPause);
      handle?.destroy();
      setState("poster");
    };
  }, [reduced, load]);

  const toggle = (): void => {
    pausedRef.current = !pausedRef.current;
    setState(pausedRef.current ? "paused" : "playing");
    rootRef.current?.dispatchEvent(new Event("reel:resume"));
  };

  return (
    <div ref={rootRef} className="cr" data-cover-reel="" data-state={state} aria-label={text.label} role="group">
      <div ref={boxRef} className="cr-box">
        <div className="cr-poster">
          <div className="cr-copy">{copy}</div>
          <div className="cr-field-wrap">{poster}</div>
          {unit ? <div className="cr-unit">{unit}</div> : null}
        </div>
        <canvas ref={canvasRef} className="cr-canvas" aria-hidden="true" />
        <div ref={textRef} className="cr-text reel-stage" aria-hidden="true" />
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={state === "paused"}
        className="cr-pause"
        hidden={state === "poster"}
        onClick={toggle}
      >
        <span className="cr-pause-glyph" aria-hidden="true" data-glyph={state === "paused" ? "play" : "pause"} />
        <span>{state === "paused" ? text.play : text.pause}</span>
      </button>
    </div>
  );
}

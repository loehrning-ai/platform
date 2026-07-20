"use client";

// ─── Scroll-driven reading-progress bar (shared course architecture) ──
//
// A 2px brand-orange bar pinned to the top of the viewport that tracks how
// far the learner has scrolled the lesson. Course-scoped sibling of the blog
// `ReadingProgress` (which is Kupfer); this one is reused across all three
// courses via the lesson layouts.
//
// Reduced-motion: the width transition is dropped (instant) so a user with
// prefers-reduced-motion sees the bar jump rather than glide. Scroll listener
// is passive; no work runs on the server (guarded by the effect).

import { useEffect, useRef, type JSX } from "react";
import { useReducedMotion } from "framer-motion";

interface Props {
  /** Height in px. Spec default is 2px. */
  readonly height?: number;
  readonly className?: string;
}

export function ReadingProgressBar({ height = 2, className }: Props): JSX.Element {
  const barRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const update = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct =
        scrollable <= 0
          ? 0
          : Math.max(0, Math.min(1, window.scrollY / scrollable)) * 100;
      if (barRef.current) barRef.current.style.width = `${pct}%`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 50,
        height,
        pointerEvents: "none",
      }}
    >
      <div
        ref={barRef}
        style={{
          height: "100%",
          width: 0,
          backgroundColor: "var(--color-brand-orange)",
          transition: prefersReduced ? "none" : "width 80ms linear",
        }}
      />
    </div>
  );
}

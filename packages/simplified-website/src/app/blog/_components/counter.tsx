"use client";

import { useEffect, useRef } from "react";

const formatValue = (n: number, format?: "de") =>
  format === "de" ? n.toLocaleString("de-DE") : String(n);

export function Counter({
  target,
  format,
  duration = 1400,
  className,
}: {
  target: number;
  format?: "de";
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt = (n: number) => formatValue(n, format);

    // Respect reduced-motion: the formatted target is already the SSR text,
    // so there is nothing to animate.
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      el.textContent = fmt(target);
      return;
    }

    let rafId = 0;
    let startTs = 0;

    const run = () => {
      startTs = performance.now();
      const frame = (now: number) => {
        const p = Math.min(1, (now - startTs) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(target * eased));
        if (p < 1) rafId = requestAnimationFrame(frame);
      };
      rafId = requestAnimationFrame(frame);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run();
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);

    return () => {
      obs.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [target, format, duration]);

  // SSR / no-JS / crawlers see the real formatted number, not "0".
  return (
    <span ref={ref} className={className}>
      {formatValue(target, format)}
    </span>
  );
}

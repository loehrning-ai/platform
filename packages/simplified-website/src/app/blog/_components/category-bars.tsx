"use client";

import { useEffect, useRef } from "react";

/**
 * Animates the width of `.cat__bar` spans inside a wrapping table when that
 * table scrolls into view. Widths are normalised against the largest pct value.
 */
export function CategoryBars({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const bars = Array.from(
      wrap.querySelectorAll<HTMLSpanElement>(".cat__bar"),
    );
    if (!bars.length) return;

    const max = Math.max(
      ...bars.map((b) => Number.parseFloat(b.dataset.pct ?? "0")),
    );
    const table = wrap.querySelector("table");
    if (!table) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          bars.forEach((b, i) => {
            const pct = Number.parseFloat(b.dataset.pct ?? "0");
            const w = max > 0 ? (pct / max) * 100 : 0;
            setTimeout(() => {
              b.style.width = `${w}%`;
            }, i * 120);
          });
          obs.disconnect();
          break;
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(table);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className="catbreak reveal"
      role="region"
      aria-label="Kategorien-Verteilung"
      tabIndex={0}
    >
      {children}
    </div>
  );
}

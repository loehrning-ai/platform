"use client";

import { useEffect, useRef } from "react";

export function GapBars({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const bars = Array.from(
      wrap.querySelectorAll<HTMLDivElement>(".gap__bar"),
    );
    if (!bars.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          bars.forEach((b, i) => {
            const pct = Number.parseFloat(b.dataset.pct ?? "0");
            setTimeout(() => {
              b.style.width = `${pct}%`;
            }, i * 200);
          });
          obs.disconnect();
          break;
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(wrap);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={wrapRef} id="gap" className="gap reveal" aria-label="Service-Gap">
      {children}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

const HEX = "0123456789abcdef";

export function HashScramble({
  hash,
  label,
  meta,
  delayIndex = 0,
}: {
  hash: string;
  label: string;
  meta: string;
  delayIndex?: number;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    const valueEl = valueRef.current;
    if (!row || !valueEl) return;

    // Reduced-motion: render the final hash immediately, skip the scramble.
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      valueEl.replaceChildren();
      for (let i = 0; i < hash.length; i++) {
        const s = document.createElement("span");
        s.className = "char";
        s.textContent = hash[i]!;
        valueEl.appendChild(s);
      }
      row.classList.add("revealed");
      return;
    }

    const start = () => {
      valueEl.replaceChildren();
      const spans: HTMLSpanElement[] = [];
      for (let i = 0; i < hash.length; i++) {
        const s = document.createElement("span");
        s.className = "char";
        s.textContent = HEX[Math.floor(Math.random() * 16)]!;
        valueEl.appendChild(s);
        spans.push(s);
      }
      row.classList.add("revealed");

      let rev = 0;
      const dur = 1600;
      const per = dur / hash.length;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const tick = () => {
        if (rev >= hash.length) return;
        spans.forEach((s, i) => {
          if (i >= rev) s.textContent = HEX[Math.floor(Math.random() * 16)]!;
          else s.textContent = hash[i]!;
        });
        timer = setTimeout(() => {
          spans[rev]!.textContent = hash[rev]!;
          rev++;
          if (rev < hash.length) requestAnimationFrame(tick);
          else spans.forEach((s, i) => (s.textContent = hash[i]!));
        }, per);
      };
      tick();
      return () => {
        if (timer) clearTimeout(timer);
      };
    };

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setTimeout(start, delayIndex * 200);
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(row);
    return () => obs.disconnect();
  }, [hash, delayIndex]);

  return (
    <div ref={rowRef} className="hash-row" data-hash={hash}>
      <div className="hash-row__head">
        <span className="hash-row__label">{label}</span>
        <span>{meta}</span>
      </div>
      <div ref={valueRef} className="hash-value" />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Demo } from "@/lib/demos";

/**
 * Renders the meta table. Any value containing a number animates from 0 up
 * on first viewport entry (useAnimatedCounter-style). Non-numeric values are
 * rendered as-is.
 */
export function AnimatedMetaTable({ meta }: { meta: Demo["meta"] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setActive(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 gap-0 overflow-hidden border border-border md:grid-cols-2"
    >
      {meta.map(({ label, value }, i) => (
        <div
          key={label}
          className={`flex items-center justify-between border-b border-border px-4 py-3 font-mono text-sm md:border-b-0 ${
            i % 2 === 0 && !(i === meta.length - 1 && meta.length % 2 === 1) ? "md:border-r" : ""
          } ${i >= meta.length - (meta.length % 2 === 0 ? 2 : 1) ? "" : "md:border-b"}`}
        >
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </span>
          <AnimatedValue value={value} active={active} />
        </div>
      ))}
    </div>
  );
}

function AnimatedValue({ value, active }: { value: string; active: boolean }) {
  const numMatch = useMemo(() => value.match(/[\d.,]+/), [value]);
  const targetNum = numMatch ? parseFloat(numMatch[0].replace(/\./g, "").replace(",", ".")) : null;
  const hasNumber = Number.isFinite(targetNum);
  const [display, setDisplay] = useState<string>(hasNumber && active ? value : value);

  useEffect(() => {
    if (!active || !hasNumber || targetNum === null) {
      setDisplay(value);
      return;
    }
    const duration = 800;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = targetNum * eased;
      const rendered = value.replace(numMatch![0], formatLike(numMatch![0], current));
      setDisplay(rendered);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, hasNumber, targetNum, value, numMatch]);

  return <span className="font-bold text-foreground">{display}</span>;
}

function formatLike(template: string, n: number): string {
  const hasComma = template.includes(",");
  const decimals = (template.split(",")[1] ?? "").length;
  const decimalsToUse = hasComma ? Math.max(1, decimals) : 0;
  const formatted = n.toLocaleString("de-DE", {
    minimumFractionDigits: decimalsToUse,
    maximumFractionDigits: decimalsToUse,
  });
  return formatted;
}

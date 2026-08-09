"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Demo as CatalogEntry } from "@/lib/demos";
import type { Locale } from "@/lib/i18n/locale";
import { useMotionAllowed } from "@/lib/animation-policy";

/**
 * Renders the meta table. Any value containing a number animates from 0 up
 * on first viewport entry (useAnimatedCounter-style). Non-numeric values are
 * rendered as-is.
 */
export function AnimatedMetaTable({
  meta,
  locale = "de",
}: {
  meta: CatalogEntry["meta"];
  locale?: Locale;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const motionAllowed = useMotionAllowed();

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
          className={`grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-3 border-b border-border px-3 py-3 font-mono text-sm sm:px-4 md:border-b-0 ${
            i % 2 === 0 && !(i === meta.length - 1 && meta.length % 2 === 1) ? "md:border-r" : ""
          } ${i >= meta.length - (meta.length % 2 === 0 ? 2 : 1) ? "" : "md:border-b"}`}
        >
          <span className="min-w-0 break-words text-[10px] uppercase tracking-[0.1em] text-muted-foreground sm:tracking-[0.12em]">
            {label}
          </span>
          <AnimatedValue
            value={value}
            active={active}
            motionAllowed={motionAllowed}
            locale={locale}
          />
        </div>
      ))}
    </div>
  );
}

function AnimatedValue({
  value,
  active,
  motionAllowed,
  locale,
}: {
  value: string;
  active: boolean;
  motionAllowed: boolean;
  locale: Locale;
}) {
  const numMatch = useMemo(() => value.match(/[\d.,]+/), [value]);
  const targetNum = numMatch
    ? parseFloat(
        locale === "de"
          ? numMatch[0].replace(/\./g, "").replace(",", ".")
          : numMatch[0].replace(/,/g, ""),
      )
    : null;
  const hasNumber = Number.isFinite(targetNum);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!active || !hasNumber || targetNum === null || !motionAllowed) {
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
      const rendered = value.replace(numMatch![0], formatLike(numMatch![0], current, locale));
      setDisplay(rendered);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, hasNumber, locale, motionAllowed, targetNum, value, numMatch]);

  return <span className="min-w-0 break-words text-right font-bold text-foreground">{display}</span>;
}

function formatLike(template: string, n: number, locale: Locale): string {
  const decimalSeparator = locale === "de" ? "," : ".";
  const hasDecimals = template.includes(decimalSeparator);
  const decimals = (template.split(decimalSeparator)[1] ?? "").length;
  const decimalsToUse = hasDecimals ? Math.max(1, decimals) : 0;
  const formatted = n.toLocaleString(locale === "de" ? "de-DE" : "en-GB", {
    minimumFractionDigits: decimalsToUse,
    maximumFractionDigits: decimalsToUse,
  });
  return formatted;
}

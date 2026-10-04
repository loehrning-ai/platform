"use client";

import { useEffect, useRef } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
/** A finite structural reveal (the 250-450ms window), eased out, played once. */
export const COUNT_UP_DURATION_MS = 450;

/**
 * A real count from the page that ticks up once when it first scrolls into
 * view. The server renders the final value, so the markup is complete without
 * JavaScript, and the count only restarts from zero when it is still below the
 * fold at hydration (never a visible flash back to zero). Reduced motion, a
 * missing IntersectionObserver or a count already on screen keep the final
 * value. Assistive tech reads the full phrase once from a visually hidden copy;
 * the ticking digits are hidden from it.
 */
export function CountUp({
  value,
  text,
  digitsClassName = "",
}: {
  readonly value: number;
  /** The full phrase that contains the value once, e.g. "57 Lektionen". */
  readonly text: string;
  /** Extra classes for the digits, so the number can lead the phrase. */
  readonly digitsClassName?: string;
}) {
  const digitsRef = useRef<HTMLSpanElement>(null);
  const token = String(value);
  const at = text.indexOf(token);

  useEffect(() => {
    const host = digitsRef.current;
    const digits = host?.firstChild;
    if (!host || !(digits instanceof Text)) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.(REDUCED_MOTION_QUERY).matches) return;
    // On screen, scrolled past, or not laid out at this width: keep the
    // final count as rendered.
    const rect = host.getBoundingClientRect();
    if (rect.height === 0 || rect.top < window.innerHeight) return;

    let frame = 0;
    const finish = () => {
      cancelAnimationFrame(frame);
      digits.nodeValue = token;
    };
    digits.nodeValue = "0";

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / COUNT_UP_DURATION_MS, 1);
          const eased = 1 - (1 - progress) ** 3;
          digits.nodeValue = String(Math.round(value * eased));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 1 },
    );
    observer.observe(host);
    // A printout never shows a count that has not run yet.
    window.addEventListener("beforeprint", finish);

    return () => {
      observer.disconnect();
      window.removeEventListener("beforeprint", finish);
      finish();
    };
  }, [token, value]);

  if (at < 0) return <>{text}</>;

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, at)}
        <span
          ref={digitsRef}
          data-count-up={token}
          className={`inline-block text-right tabular-nums ${digitsClassName}`}
          style={{ minWidth: `${token.length}ch` }}
        >
          {token}
        </span>
        {text.slice(at + token.length)}
      </span>
    </>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { trackDemoEngagedSeconds } from "@/lib/analytics";

const THRESHOLDS = [10, 20, 30, 60] as const;

/**
 * Silent child — tracks how many seconds the visitor actually spent looking at
 * a demo. Fires `demo_engaged_seconds` at 10, 20, 30, 60s of continuous
 * viewport + tab-visible time.
 *
 * Place inside the demo container — renders nothing.
 */
export function EngagementTracker({ slug }: { slug: string }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const secondsRef = useRef(0);
  const firedRef = useRef<Set<number>>(new Set());
  const visibleRef = useRef(false);
  const tabVisibleRef = useRef(true);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      visibleRef.current = true;
    } else {
      const obs = new IntersectionObserver(
        (entries) => {
          for (const e of entries) visibleRef.current = e.isIntersecting;
        },
        { threshold: 0.4 },
      );
      obs.observe(el);

      const visHandler = () => {
        tabVisibleRef.current = document.visibilityState !== "hidden";
      };
      tabVisibleRef.current = document.visibilityState !== "hidden";
      document.addEventListener("visibilitychange", visHandler);

      const tick = () => {
        if (visibleRef.current && tabVisibleRef.current) {
          secondsRef.current += 1;
          for (const t of THRESHOLDS) {
            if (secondsRef.current === t && !firedRef.current.has(t)) {
              firedRef.current.add(t);
              trackDemoEngagedSeconds(slug, t);
            }
          }
        }
      };
      const id = window.setInterval(tick, 1000);

      return () => {
        obs.disconnect();
        document.removeEventListener("visibilitychange", visHandler);
        window.clearInterval(id);
      };
    }
  }, [slug]);

  return <div ref={wrapperRef} aria-hidden="true" style={{ width: 0, height: 0 }} />;
}

import { useEffect, useRef, useState, type RefObject } from "react";
import { useMotionAllowed } from "@/lib/animation-policy";

// ─── Data Science shared hooks ─────────────────────
//
// Typed port of `src/v8/shared.js`'s `useInView`/`useInterval`/`useTicker`.

export function useInView<T extends Element>(
  options: IntersectionObserverInit = {},
): readonly [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, ...options },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mirrors source: observer set up once per mount
  }, []);

  return [ref, inView] as const;
}

/**
 * Continuous viewport visibility for animations that must stop after scrolling
 * away. Unlike `useInView`, this does not disconnect after the first entry.
 */
export function useElementVisibility<T extends Element>(
  options: IntersectionObserverInit = {},
): readonly [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry?.isIntersecting ?? false),
      options,
    );
    observer.observe(element);
    return () => observer.disconnect();
    // Callers provide stable literal options; rebuilding the observer on every
    // render would defeat the animation gate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, visible] as const;
}

export function useInterval(
  callback: () => void,
  ms: number | null,
  deps: readonly unknown[] = [],
): void {
  useEffect(() => {
    if (ms == null) return;
    const id = setInterval(callback, ms);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mirrors source's own useInterval(cb, ms, deps) contract: the effect's own deps array
  }, deps);
}

export function useTicker(running = true, deps: readonly unknown[] = []): number {
  const [t, setT] = useState(0);
  const elapsed = useRef(0);
  const motionAllowed = useMotionAllowed();

  useEffect(() => {
    if (!running || !motionAllowed) return;
    let raf: number;
    const start = performance.now() - elapsed.current * 1000;
    let lastPaint = start;
    const loop = (now: number) => {
      // Thirty frames per second is sufficient for the decorative SVG flow
      // and halves React render pressure compared with an unrestricted RAF.
      if (now - lastPaint >= 1000 / 30) {
        lastPaint = now;
        const next = (now - start) / 1000;
        elapsed.current = next;
        setT(next);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mirrors source's own useTicker(running, deps) contract
  }, [running, motionAllowed, ...deps]);

  return t;
}

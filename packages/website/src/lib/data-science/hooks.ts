import { useEffect, useRef, useState, type RefObject } from "react";

// ─── Data Science shared hooks (plan 012 stage 4) ─────────────────────
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

  useEffect(() => {
    if (!running) return;
    let raf: number;
    const start = performance.now();
    const loop = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mirrors source's own useTicker(running, deps) contract
  }, [running, ...deps]);

  return t;
}

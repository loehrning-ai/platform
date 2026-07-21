import { useEffect, useRef, useState, type RefObject } from "react";

// ─── Data Engineering Fundamentals shared hooks (plan 011 stage 2) ──
//
// Typed port of `src/chapters/shared.js`'s `useInView`/`useInterval`.

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

export function useInterval(callback: () => void, ms: number | null): void {
  useEffect(() => {
    if (ms == null) return;
    const id = setInterval(callback, ms);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mirrors source's own useInterval(cb, ms, deps) contract; callback identity is not a dependency
  }, [ms]);
}

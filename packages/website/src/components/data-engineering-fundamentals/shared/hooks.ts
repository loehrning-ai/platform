import { useEffect, useRef, useState, type RefObject } from "react";

// ─── Shared hooks (plan 011 stage 2) ─────────────────────────────────
// Ported from `src/chapters/shared.js`. Neither hook has a call site in any
// of the 12 source chapters (confirmed by grep across all 14 chapter files)
// — ported for fidelity to the shared-primitive module, available for any
// chapter/simulator that needs them.

export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = {},
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, ...options },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView];
}

export function useInterval(callback: () => void, ms: number | null): void {
  useEffect(() => {
    if (ms == null) return;
    const id = setInterval(callback, ms);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms]);
}

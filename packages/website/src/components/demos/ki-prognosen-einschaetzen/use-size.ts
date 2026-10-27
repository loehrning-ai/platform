"use client";

import { useCallback, useState } from "react";

export interface Size {
  readonly width: number;
  readonly height: number;
}

/**
 * The pixel size of a box, so the charts draw in real pixels (crisp 1px
 * hairlines, text that never stretches). Starts from a phone-sized guess for
 * the server render and the first paint.
 */
export function useSize(fallback: Size): readonly [(element: HTMLElement | null) => void, Size] {
  const [size, setSize] = useState<Size>(fallback);
  const ref = useCallback((element: HTMLElement | null) => {
    if (!element || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const box = element.getBoundingClientRect();
      if (box.width > 0 && box.height > 0) {
        setSize((previous) =>
          Math.abs(previous.width - box.width) < 0.5 && Math.abs(previous.height - box.height) < 0.5
            ? previous
            : { width: box.width, height: box.height },
        );
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

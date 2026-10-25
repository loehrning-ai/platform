"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** How long after the first sight a second tile of the same row starts. */
const STAGGER_MS = 120;
const ARMED = "is-armed";
const PLAYING = "is-playing";

/**
 * The hub's one client island. Server-rendered tiles show their end frame;
 * this wraps the list and, only when motion is allowed and the browser can
 * observe, arms each tile (start frame, paused) and plays its story once
 * when it is first 60 % in view. A fine pointer's hover and keyboard focus
 * replay the story of that tile alone. Nothing loops. With reduced motion,
 * no IntersectionObserver or no script the tiles simply stay on the end
 * frame; printing shows it too (tile-scenes.css is screen only).
 */
export function DemoTileStage({
  children,
  className,
  label,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly label: string;
}) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof IntersectionObserver === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const tiles = Array.from(list.querySelectorAll<HTMLElement>("[data-dt-tile]"));
    const timers = new Set<number>();
    const start = (tile: HTMLElement, delayMs: number) => {
      tile.style.setProperty("--dt-delay", `${delayMs}ms`);
      tile.classList.add(ARMED, PLAYING);
    };
    const replay = (tile: HTMLElement) => {
      tile.classList.remove(ARMED, PLAYING);
      void tile.offsetWidth;
      start(tile, 0);
    };

    for (const tile of tiles) tile.classList.add(ARMED);
    let seenInBatch = 0;
    let batchTimer = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          start(entry.target as HTMLElement, seenInBatch * STAGGER_MS);
          seenInBatch += 1;
        }
        window.clearTimeout(batchTimer);
        batchTimer = window.setTimeout(() => {
          seenInBatch = 0;
        }, 250);
        timers.add(batchTimer);
      },
      { threshold: 0.6 },
    );
    for (const tile of tiles) observer.observe(tile);

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const onEnter = (event: PointerEvent) => {
      if (!fine.matches) return;
      const tile = (event.target as Element).closest<HTMLElement>("[data-dt-tile]");
      const from = event.relatedTarget as Node | null;
      if (!tile || (from && tile.contains(from))) return;
      if (tile.classList.contains(PLAYING)) replay(tile);
    };
    const onFocus = (event: FocusEvent) => {
      const target = event.target as Element;
      if (!target.matches?.(":focus-visible")) return;
      const tile = target.closest<HTMLElement>("[data-dt-tile]");
      if (tile?.classList.contains(PLAYING)) replay(tile);
    };
    const disarm = () => {
      for (const tile of tiles) tile.classList.remove(ARMED, PLAYING);
    };
    list.addEventListener("pointerover", onEnter);
    list.addEventListener("focusin", onFocus);
    reduce.addEventListener("change", disarm);
    window.addEventListener("beforeprint", disarm);

    return () => {
      observer.disconnect();
      for (const timer of timers) window.clearTimeout(timer);
      list.removeEventListener("pointerover", onEnter);
      list.removeEventListener("focusin", onFocus);
      reduce.removeEventListener("change", disarm);
      window.removeEventListener("beforeprint", disarm);
      for (const tile of tiles) tile.classList.remove(ARMED, PLAYING);
    };
  }, []);

  return (
    <ol ref={listRef} className={className} aria-label={label} data-demo-list="">
      {children}
    </ol>
  );
}

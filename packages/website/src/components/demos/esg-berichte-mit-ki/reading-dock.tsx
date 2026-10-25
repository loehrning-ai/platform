"use client";

import { useEffect, useState, type RefObject } from "react";
import { revealIfOffscreen, useBeatClock } from "@/components/demos/shell";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";

/**
 * The control dock on a phone (the one glass surface of this demo): once the
 * visitor scrolls past the lever to read what a beat found, a floating dock
 * above the tab bar keeps the way back to the stage and "Weiter" in reach.
 * It shows only while the lever is above the screen, the demo is still in
 * view and the own-sentence form is not; it never moves the page by itself.
 */
export function ReadingDock({
  root,
  backLabel,
}: {
  readonly root: RefObject<HTMLElement | null>;
  readonly backLabel: string;
}) {
  const clock = useBeatClock();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const element = root.current;
      const lever = element?.querySelector("[data-demo-lever]");
      if (!element || !lever) return;
      const height = window.innerHeight || document.documentElement.clientHeight;
      const leverGone = lever.getBoundingClientRect().bottom < 0;
      const demoInView = element.getBoundingClientRect().bottom > height * 0.6;
      // The own-sentence form has its own buttons and fields: the dock never covers it.
      const own = element.querySelector("[data-own-sentences]");
      const ownClear = !own || own.getBoundingClientRect().top > height * 0.75;
      setShown(leverGone && demoInView && ownClear);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [root]);

  if (!shown) return null;
  const stage = () => root.current?.querySelector("[data-demo-stage]") ?? null;
  const nextIsTakeHome = clock.beats[clock.index + 1]?.kind === "takehome";
  return (
    <div className="nw-dock glass" data-reading-dock="">
      <button type="button" className="nw-button" onClick={() => revealIfOffscreen(stage(), clock.reducedMotion)}>
        <span aria-hidden="true">↑</span>&nbsp;{backLabel}
      </button>
      {clock.canAdvance ? (
        <button
          type="button"
          className="nw-button nw-button-primary"
          onClick={() => {
            clock.next();
            if (!nextIsTakeHome) revealIfOffscreen(stage(), clock.reducedMotion);
          }}
        >
          {DEMOS_PAGE_COPY[clock.locale].shell.next}&nbsp;<span aria-hidden="true">→</span>
        </button>
      ) : null}
    </div>
  );
}

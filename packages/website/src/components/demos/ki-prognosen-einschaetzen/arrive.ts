/**
 * Bringing the demo into the first screen. On load the shell's band and the
 * promise sit above the demo, so the count and the staircase are often below
 * the fold (a phone) or half cut (a laptop) while the count-in plays. Before
 * the intro starts the page scrolls down just far enough that the whole
 * chart clears the bottom edge (and the phone's tab bar), never so far that
 * the count or the chart slips under the site header, and never upward.
 */

/** A CSS length expression (custom properties, env()) resolved to pixels. */
export function cssPx(expression: string): number {
  const probe = document.createElement("div");
  probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;height:${expression};width:0`;
  document.body.appendChild(probe);
  const value = probe.offsetHeight;
  probe.remove();
  return value;
}

/** Pixels to scroll down so the chart is fully on screen; 0 when it already is. */
export function scrollNeeded(chart: Element, counter: Element): number {
  const wide = window.matchMedia("(min-width: 64rem)").matches;
  const header = cssPx(wide ? "var(--nav-h, 4rem)" : "var(--nav-h-compact, 3rem)");
  const floor = wide
    ? 16
    : cssPx("calc(var(--tabbar-h, 3.5rem) + env(safe-area-inset-bottom, 0px))") + 16;
  const box = chart.getBoundingClientRect();
  const count = counter.getBoundingClientRect();
  const overshoot = box.bottom - (window.innerHeight - floor);
  const room = Math.min(box.top, count.top) - header - 8;
  return Math.max(0, Math.min(overshoot, room));
}

/** Calls `done` once the page has stopped scrolling (or after a cap). Returns a cancel. */
export function whenScrollSettled(done: () => void, capMs = 1800): () => void {
  let frame = 0;
  const start = performance.now();
  let lastY = window.scrollY;
  let lastMove = start;
  const tick = (now: number) => {
    if (window.scrollY !== lastY) {
      lastY = window.scrollY;
      lastMove = now;
    }
    if ((now - lastMove > 140 && now - start > 80) || now - start > capMs) {
      done();
      return;
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

/**
 * The small runtime behind every basic figure: which SVG variant is on
 * screen, whether the island is live, and the progress of the one-shot reveal.
 *
 * Contract:
 * - The server snapshot and the first client render are the finished figure
 *   (progress 1, both variants in the markup). Nothing here can change what
 *   no-JS, print or the first paint show.
 * - A reveal is armed only when the figure starts below the fold, the browser
 *   allows motion (prefers-reduced-motion: no-preference) and
 *   IntersectionObserver exists. It plays once, 420 ms, when the figure enters.
 *   A figure already on screen at hydration stays finished and never restarts.
 * - Printing, or the reader switching to reduced motion, settles at 1 at once.
 */

export type Variant = "compact" | "wide";

export interface StageSnapshot {
  readonly ready: boolean;
  readonly variant: Variant | null;
  /** 0 to 1; what the figure engine draws. */
  readonly progress: number;
}

/** Container width, in rem, from which the wide SVG variant shows. Mirrors book-figures.css. */
export const WIDE_MIN_REM = 35;
/** Viewbox widths of the two variants; compact is the 390px phone layout. */
export const VARIANT_WIDTH: Readonly<Record<Variant, number>> = {
  compact: 340,
  wide: 560,
};
export const REVEAL_MS = 420;

const NO_PREFERENCE = "(prefers-reduced-motion: no-preference)";
/** A figure whose top is below this share of the viewport height is "below the fold". */
const FOLD = 0.92;

export const SERVER_SNAPSHOT: StageSnapshot = Object.freeze({
  ready: false,
  variant: null,
  progress: 1,
});

type Listener = () => void;

export class StageController {
  private snapshot: StageSnapshot = SERVER_SNAPSHOT;
  private readonly listeners = new Set<Listener>();
  private frame = 0;

  readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot = (): StageSnapshot => this.snapshot;

  readonly getServerSnapshot = (): StageSnapshot => SERVER_SNAPSHOT;

  private set(patch: Partial<StageSnapshot>): void {
    const next = { ...this.snapshot, ...patch };
    if (
      next.ready === this.snapshot.ready &&
      next.variant === this.snapshot.variant &&
      next.progress === this.snapshot.progress
    ) {
      return;
    }
    this.snapshot = next;
    this.listeners.forEach((listener) => listener());
  }

  /** Wires the stage element; returns the cleanup. Safe to call again after cleanup. */
  attach(el: HTMLElement): () => void {
    const win = el.ownerDocument.defaultView;
    if (!win) return () => undefined;

    const variantOf = (): Variant => {
      const rootPx = Number.parseFloat(win.getComputedStyle(win.document.documentElement).fontSize) || 16;
      return el.clientWidth >= WIDE_MIN_REM * rootPx ? "wide" : "compact";
    };

    const motion = typeof win.matchMedia === "function" ? win.matchMedia(NO_PREFERENCE) : null;
    const canObserve = typeof win.IntersectionObserver === "function";
    const armed =
      Boolean(motion?.matches) &&
      canObserve &&
      el.getBoundingClientRect().top > win.innerHeight * FOLD;

    this.set({ ready: true, variant: variantOf(), progress: armed ? 0 : 1 });

    const cleanups: Array<() => void> = [];

    if (typeof win.ResizeObserver === "function") {
      const resize = new win.ResizeObserver(() => this.set({ variant: variantOf() }));
      resize.observe(el);
      cleanups.push(() => resize.disconnect());
    }

    const settle = (): void => {
      win.cancelAnimationFrame(this.frame);
      this.set({ progress: 1 });
    };

    if (armed) {
      const play = (): void => {
        const start = win.performance.now();
        const step = (now: number): void => {
          const t = Math.min(1, Math.max(0, (now - start) / REVEAL_MS));
          this.set({ progress: t });
          if (t < 1) this.frame = win.requestAnimationFrame(step);
        };
        this.frame = win.requestAnimationFrame(step);
      };
      const observer = new win.IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer.disconnect();
            play();
          }
        },
        { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
      );
      observer.observe(el);
      cleanups.push(() => observer.disconnect());
      win.addEventListener("beforeprint", settle);
      cleanups.push(() => win.removeEventListener("beforeprint", settle));
      const onMotionChange = (event: MediaQueryListEvent): void => {
        if (!event.matches) settle();
      };
      motion?.addEventListener("change", onMotionChange);
      cleanups.push(() => motion?.removeEventListener("change", onMotionChange));
    }

    return () => {
      win.cancelAnimationFrame(this.frame);
      cleanups.forEach((cleanup) => cleanup());
    };
  }
}

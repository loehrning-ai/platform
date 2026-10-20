/**
 * The seam between the cover page and the insight reel (DIRECTION section 4).
 *
 * The reel is the same `frame(t)` the film is rendered from, drawn live into a
 * canvas: a pure function of time t in seconds, 0 to `duration` (30). The page
 * owns the clock, the pause switch, the visibility rules and the poster; the
 * engine owns only what appears on the canvas. Nothing here knows how a frame
 * is painted, so the film renderer, the page and the tests cannot disagree.
 *
 *   mount(canvas, options) -> handle
 *   handle.seek(t)         paint the frame at time t; idempotent, no allocation
 *   handle.destroy()       release the canvas
 *
 * The page calls seek only while the reel is visible, not paused and the tab is
 * shown, and never under reduced motion (the poster stays: the settled cover).
 */

export interface ReelMountOptions {
  /** CSS size of the canvas box in px. */
  readonly width: number;
  readonly height: number;
  /** Device pixel ratio already capped by the page (2, or 1.5 on four cores or fewer). */
  readonly dpr: number;
  /** The element that carries the film's text (DOM, scaled to the box). Without it the engine draws no text. */
  readonly text?: HTMLElement;
}

export interface ReelHandle {
  /** Seconds. 30 for the book reel. */
  readonly duration: number;
  seek(t: number): void;
  destroy(): void;
}

export interface ReelEngine {
  mount(canvas: HTMLCanvasElement, options: ReelMountOptions): Promise<ReelHandle> | ReelHandle;
}

export type ReelLoader = () => Promise<ReelEngine | null>;

/** Device pixel ratio cap: 2, and 1.5 on devices with four cores or fewer. */
export function cappedDpr(dpr: number, cores: number | undefined): number {
  const cap = cores !== undefined && cores <= 4 ? 1.5 : 2;
  return Math.max(1, Math.min(cap, dpr));
}

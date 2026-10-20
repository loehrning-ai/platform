/**
 * The cover reel as an engine for the lazy cover slot (book-reader/reel/cover-reel.tsx):
 * `mount(canvas, options)` returns a handle whose `seek(t)` paints the same pure
 * `frame(t)` the MP4 renders come from. The squares go on the canvas (three
 * batched fills), the text into a DOM host scaled to the box. A frame is drawn
 * only when its time moved, so a paused reel does no work. This is the one
 * chunk behind the cover; it stays under 40 KB gzip.
 */

import "./reel.css";
import type { ReelEngine, ReelHandle, ReelMountOptions } from "../../book-reader/reel/reel-contract.ts";
import type { ReelFormat } from "./layout.ts";
import { paintCanvas, type Surface } from "./paint.ts";
import { DURATION, createReel, type Reel } from "./reel.ts";

const cache = new Map<ReelFormat, Reel>();

function reelFor(format: ReelFormat): Reel {
  const hit = cache.get(format);
  if (hit) return hit;
  const made = createReel(format);
  cache.set(format, made);
  return made;
}

/** A box wider than 6:5 gets the 16:9 film, anything else the 9:16 film. */
export function formatForBox(width: number, height: number): ReelFormat {
  return width >= height * 1.2 ? "wide" : "tall";
}

export const reelEngine: ReelEngine = {
  mount(canvas: HTMLCanvasElement, options: ReelMountOptions): ReelHandle {
    const reel = reelFor(formatForBox(options.width, options.height));
    const { W, H } = reel.layout;
    const ctx = canvas.getContext("2d");
    const scale = options.width / W;
    const host = options.text;
    if (host) {
      host.style.width = `${W}px`;
      host.style.height = `${H}px`;
      host.style.transformOrigin = "left top";
      host.style.transform = `scale(${scale})`;
    }
    let last = Number.NaN;
    let lastHtml = "";
    return {
      duration: DURATION,
      seek(t: number): void {
        if (t === last) return;
        last = t;
        if (ctx) {
          ctx.setTransform(options.dpr * scale, 0, 0, options.dpr * scale, 0, 0);
          paintCanvas(ctx as unknown as Surface, reel.scene(t));
        }
        if (host) {
          const html = reel.html(t);
          if (html !== lastHtml) {
            host.innerHTML = html;
            lastHtml = html;
          }
        }
      },
      destroy(): void {
        if (host) host.innerHTML = "";
        last = Number.NaN;
      },
    };
  },
};

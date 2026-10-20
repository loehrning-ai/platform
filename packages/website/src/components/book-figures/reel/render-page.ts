/**
 * Entry of the page that scripts/render-reel.mjs bundles and drives: it paints
 * one frame per call of `window.seek(t)` into `#stage` and returns
 * synchronously. `__ready` flips after the fonts are loaded, `__duration` is
 * 30 and `__log()` lists the numbers drawn in the last frame (truth diff).
 */

import { DURATION, createReel } from "./reel.ts";
import type { ReelFormat } from "./layout.ts";

declare global {
  interface Window {
    seek: (t: number) => void;
    __ready: boolean;
    __duration: number;
    __log: () => unknown;
    __reel: ReturnType<typeof createReel>;
  }
}

const params = new URLSearchParams(window.location.search);
const format: ReelFormat = params.get("format") === "wide" ? "wide" : "tall";
const reel = createReel(format);
const stage = document.getElementById("stage") as HTMLElement;
stage.style.width = `${reel.layout.W}px`;
stage.style.height = `${reel.layout.H}px`;

let last = 0;
window.seek = (t: number): void => {
  last = t;
  const f = reel.frame(t);
  stage.innerHTML = f.svg + f.html;
};
window.__duration = DURATION;
window.__log = () => reel.log(last);
window.__reel = reel;
window.__ready = false;
window.seek(0);
const WEIGHTS = [400, 500, 600, 700, 800];
void Promise.all(WEIGHTS.map((w) => document.fonts.load(`${w} 40px "Figtree"`)))
  .then(() => document.fonts.ready)
  .then(() => {
    const ok = WEIGHTS.every((w) => document.fonts.check(`${w} 40px "Figtree"`));
    if (!ok) throw new Error("reel: Figtree did not load, the render would use a fallback face");
    window.seek(0);
    window.__ready = true;
  });

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  REVEAL_MS,
  SERVER_SNAPSHOT,
  StageController,
  VARIANT_WIDTH,
} from "../stage-controller";

interface Env {
  motion: boolean;
  top: number;
  fire: () => void;
  settleMq: (matches: boolean) => void;
  flush: (ms: number) => void;
}

function setup(opts: { motion: boolean; top: number; io?: boolean }): Env & { el: HTMLElement } {
  const el = document.createElement("div");
  document.body.appendChild(el);
  el.getBoundingClientRect = () => ({ top: opts.top, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: opts.top, toJSON: () => ({}) });
  Object.defineProperty(el, "clientWidth", { value: 700, configurable: true });
  const mqListeners: Array<(e: { matches: boolean }) => void> = [];
  let motion = opts.motion;
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: q.includes("no-preference") ? motion : false,
    addEventListener: (_: string, l: (e: { matches: boolean }) => void) => mqListeners.push(l),
    removeEventListener: () => undefined,
  }));
  window.matchMedia = globalThis.matchMedia;
  let ioCb: ((e: Array<{ isIntersecting: boolean }>) => void) | null = null;
  if (opts.io !== false) {
    class IO {
      constructor(cb: (e: Array<{ isIntersecting: boolean }>) => void) { ioCb = cb; }
      observe() {}
      disconnect() {}
    }
    window.IntersectionObserver = IO as never;
  } else {
    // @ts-expect-error remove for the test
    delete window.IntersectionObserver;
  }
  Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
  let now = 0;
  const frames: Array<(t: number) => void> = [];
  window.requestAnimationFrame = ((cb: (t: number) => void) => { frames.push(cb); return frames.length; }) as never;
  window.cancelAnimationFrame = (() => { frames.length = 0; }) as never;
  window.performance.now = () => now;
  return {
    el,
    get motion() { return motion; },
    set motion(v: boolean) { motion = v; },
    top: opts.top,
    fire: () => ioCb?.([{ isIntersecting: true }]),
    settleMq: (m: boolean) => { motion = m; mqListeners.forEach((l) => l({ matches: m })); },
    flush: (ms: number) => { now += ms; const cbs = frames.splice(0); cbs.forEach((cb) => cb(now)); },
  } as never;
}

describe("StageController", () => {
  beforeEach(() => vi.useRealTimers());
  afterEach(() => { vi.unstubAllGlobals(); document.body.innerHTML = ""; });

  it("serves the finished figure to the server and to hydration", () => {
    const c = new StageController();
    expect(c.getServerSnapshot()).toBe(SERVER_SNAPSHOT);
    expect(c.getSnapshot()).toEqual({ ready: false, variant: null, progress: 1 });
  });

  it("arms a reveal below the fold, plays once over 420 ms and ends exactly at 1", () => {
    const env = setup({ motion: true, top: 2000 });
    const c = new StageController();
    const seen: number[] = [];
    c.subscribe(() => seen.push(c.getSnapshot().progress));
    c.attach(env.el);
    expect(c.getSnapshot()).toMatchObject({ ready: true, variant: "wide", progress: 0 });
    env.fire();
    env.flush(0);
    env.flush(REVEAL_MS / 2);
    const mid = c.getSnapshot().progress;
    expect(mid).toBeGreaterThan(0.3);
    expect(mid).toBeLessThan(0.7);
    env.flush(REVEAL_MS);
    expect(c.getSnapshot().progress).toBe(1);
    env.flush(100);
    expect(seen.every((p) => p >= 0 && p <= 1)).toBe(true);
    expect(seen[seen.length - 1]).toBe(1);
  });

  it("stays finished under reduced motion, without IntersectionObserver, and when already on screen", () => {
    for (const opts of [
      { motion: false, top: 2000 },
      { motion: true, top: 2000, io: false },
      { motion: true, top: 100 },
    ]) {
      const env = setup(opts);
      const c = new StageController();
      c.attach(env.el);
      expect(c.getSnapshot().progress, JSON.stringify(opts)).toBe(1);
      document.body.innerHTML = "";
    }
  });

  it("settles at 1 when the reader prints or switches to reduced motion mid-reveal", () => {
    const env = setup({ motion: true, top: 2000 });
    const c = new StageController();
    c.attach(env.el);
    expect(c.getSnapshot().progress).toBe(0);
    window.dispatchEvent(new Event("beforeprint"));
    expect(c.getSnapshot().progress).toBe(1);

    const env2 = setup({ motion: true, top: 2000 });
    const c2 = new StageController();
    c2.attach(env2.el);
    expect(c2.getSnapshot().progress).toBe(0);
    env2.settleMq(false);
    expect(c2.getSnapshot().progress).toBe(1);
  });

  it("picks the phone variant below 35rem and the wide one from there", () => {
    const env = setup({ motion: false, top: 0 });
    Object.defineProperty(env.el, "clientWidth", { value: 358, configurable: true });
    const c = new StageController();
    c.attach(env.el);
    expect(c.getSnapshot().variant).toBe("compact");
    expect(VARIANT_WIDTH.compact).toBeLessThan(480);
    expect(VARIANT_WIDTH.wide).toBeGreaterThanOrEqual(480);
  });

  it("stops listening after cleanup", () => {
    const env = setup({ motion: true, top: 2000 });
    const c = new StageController();
    const off = c.attach(env.el);
    off();
    window.dispatchEvent(new Event("beforeprint"));
    expect(c.getSnapshot().progress).toBe(0);
  });
});

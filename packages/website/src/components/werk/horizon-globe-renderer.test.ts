import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createFrameGovernor,
  createHorizonRenderer,
  easeDeck,
} from "./horizon-globe-renderer";
import { HORIZON, horizonPush } from "./horizon-projection";

/**
 * Lifecycle contract of the phone hero's live globe: it takes over from the
 * server frame, shows the static frame under reduced motion, stops drawing
 * while the document is hidden or the visitor paused it, and leaves nothing
 * behind when destroyed. The canvas context is a stub; geometry is covered by
 * the frame tests.
 */

type Frame = (time: number) => void;

let frames: Map<number, Frame>;
let nextFrame: number;
let now: number;
let reduced: boolean;
let hidden: boolean;
const reduceListeners = new Set<() => void>();
const originalMatchMedia = window.matchMedia;

function flushFrame(advance = 17): void {
  now += advance;
  const pending = [...frames.entries()];
  frames.clear();
  for (const [, callback] of pending) callback(now);
}

function stubContext() {
  const calls = { stroke: 0, clearRect: 0, arcs: [] as number[] };
  const ctx = new Proxy(
    {},
    {
      get(_target, key: string) {
        if (key === "createRadialGradient") return () => ({ addColorStop() {} });
        if (key === "stroke") return () => void calls.stroke++;
        if (key === "clearRect") return () => void calls.clearRect++;
        if (key === "arc")
          return (_x: number, _y: number, radius: number) =>
            void calls.arcs.push(radius);
        return () => {};
      },
      set() {
        return true;
      },
    },
  );
  return { ctx, calls };
}

function setup() {
  const slot = document.createElement("div");
  Object.defineProperty(slot, "clientWidth", { value: 390, configurable: true });
  Object.defineProperty(slot, "clientHeight", { value: 560, configurable: true });
  const canvas = document.createElement("canvas");
  const { ctx, calls } = stubContext();
  canvas.getContext = vi.fn(() => ctx) as unknown as typeof canvas.getContext;
  slot.append(canvas);
  document.body.append(slot);
  const states: string[] = [];
  return { slot, canvas, calls, states };
}

function stubCanvas() {
  const canvas = document.createElement("canvas");
  const { ctx, calls } = stubContext();
  canvas.getContext = vi.fn(() => ctx) as unknown as typeof canvas.getContext;
  return { canvas, calls };
}

beforeEach(() => {
  frames = new Map();
  nextFrame = 1;
  now = 1000;
  reduced = false;
  hidden = false;
  reduceListeners.clear();
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    const id = nextFrame++;
    frames.set(id, callback as Frame);
    return id;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    frames.delete(id);
  });
  vi.spyOn(performance, "now").mockImplementation(() => now);
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  });
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return query === "(prefers-reduced-motion: reduce)" ? reduced : false;
    },
    media: query,
    addEventListener: (_type: string, listener: () => void) =>
      reduceListeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) =>
      reduceListeners.delete(listener),
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  window.matchMedia = originalMatchMedia;
  document.body.innerHTML = "";
});

describe("horizon globe renderer", () => {
  it("takes over from the server frame in two frames and starts the drift", () => {
    const { slot, canvas, calls, states } = setup();
    createHorizonRenderer({ slot, canvas, onState: (s) => states.push(s) });

    expect(slot.hasAttribute("data-home-globe-live")).toBe(false);
    flushFrame(); // context + layout
    expect(slot.hasAttribute("data-home-globe-live")).toBe(false);
    flushFrame(); // first draw + swap
    expect(slot.hasAttribute("data-home-globe-live")).toBe(true);
    expect(calls.stroke).toBeGreaterThan(0);
    expect(slot.getAttribute("data-home-globe-motion")).toBe("running");
    // Backing store capped at DPR 2.
    expect(canvas.width).toBeLessThanOrEqual(390 * 2);
    expect(states).toContain("running");
  });

  it("keeps the static frame under reduced motion", () => {
    reduced = true;
    const { slot, canvas } = setup();
    createHorizonRenderer({ slot, canvas });
    flushFrame();
    flushFrame();
    expect(slot.getAttribute("data-home-globe-motion")).toBe("static");
    expect(frames.size).toBe(0);
  });

  it("stops drawing while the document is hidden and resumes when visible", () => {
    const { slot, canvas, calls } = setup();
    createHorizonRenderer({ slot, canvas });
    flushFrame();
    flushFrame();
    expect(frames.size).toBeGreaterThan(0);

    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(frames.size).toBe(0);
    expect(slot.getAttribute("data-home-globe-motion")).toBe("idle");
    const drawn = calls.stroke;
    flushFrame();
    expect(calls.stroke).toBe(drawn);

    hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(slot.getAttribute("data-home-globe-motion")).toBe("running");
    flushFrame(40);
    expect(calls.stroke).toBeGreaterThan(drawn);
  });

  it("pauses and resumes on request", () => {
    const { slot, canvas } = setup();
    const renderer = createHorizonRenderer({ slot, canvas });
    flushFrame();
    flushFrame();

    renderer.setPaused(true);
    expect(slot.getAttribute("data-home-globe-motion")).toBe("paused");
    expect(frames.size).toBe(0);

    renderer.setPaused(false);
    expect(slot.getAttribute("data-home-globe-motion")).toBe("running");
    expect(frames.size).toBeGreaterThan(0);
  });

  it("starts paused when asked to and never schedules a frame", () => {
    const { slot, canvas } = setup();
    createHorizonRenderer({ slot, canvas, paused: true });
    flushFrame();
    flushFrame();
    expect(slot.getAttribute("data-home-globe-motion")).toBe("paused");
    expect(frames.size).toBe(0);
  });

  it("holds still while the page scrolls", () => {
    const { slot, canvas, calls } = setup();
    createHorizonRenderer({ slot, canvas });
    flushFrame();
    flushFrame();
    flushFrame(40);
    const drawn = calls.stroke;
    window.dispatchEvent(new Event("scroll"));
    flushFrame(40);
    expect(calls.stroke).toBe(drawn);
    flushFrame(200);
    expect(calls.stroke).toBeGreaterThan(drawn);
  });

  it("removes every listener and frame on destroy", () => {
    const { slot, canvas } = setup();
    const removeWindow = vi.spyOn(window, "removeEventListener");
    const removeDocument = vi.spyOn(document, "removeEventListener");
    const renderer = createHorizonRenderer({ slot, canvas });
    flushFrame();
    flushFrame();

    renderer.destroy();
    expect(frames.size).toBe(0);
    expect(slot.hasAttribute("data-home-globe-live")).toBe(false);
    expect(slot.getAttribute("data-home-globe-motion")).toBe("static");
    expect(reduceListeners.size).toBe(0);
    const windowEvents = removeWindow.mock.calls.map(([type]) => type);
    expect(windowEvents).toEqual(
      expect.arrayContaining(["scroll", "pagehide", "pageshow"]),
    );
    expect(removeDocument.mock.calls.map(([type]) => type)).toContain(
      "visibilitychange",
    );
  });

  it("takes over at the server frame's scale, then pushes in to fill a tall band", () => {
    const { slot, canvas, calls } = setup();
    createHorizonRenderer({ slot, canvas });
    flushFrame();
    flushFrame();
    const serverRadius = HORIZON.r * 390;
    // The first canvas frame matches the server frame (k = 1) exactly.
    expect(calls.arcs[0]).toBeCloseTo(serverRadius, 6);
    for (let i = 0; i < 100; i++) flushFrame();
    const pushed = calls.arcs[calls.arcs.length - 1];
    expect(pushed).toBeCloseTo(serverRadius * horizonPush(390, 560), 6);
    expect(pushed).toBeGreaterThan(serverRadius);
  });

  it("keeps the server frame's scale while paused", () => {
    const { slot, canvas, calls } = setup();
    const renderer = createHorizonRenderer({ slot, canvas, paused: true });
    flushFrame();
    flushFrame();
    expect(calls.arcs[calls.arcs.length - 1]).toBeCloseTo(HORIZON.r * 390, 6);
    renderer.setPaused(false);
    for (let i = 0; i < 100; i++) flushFrame();
    expect(calls.arcs[calls.arcs.length - 1]).toBeCloseTo(
      HORIZON.r * 390 * horizonPush(390, 560),
      6,
    );
  });

  it("draws the fixed layer once per frame change, not per drift frame", () => {
    const { slot, canvas, calls } = setup();
    const fixed = stubCanvas();
    createHorizonRenderer({ slot, canvas, staticCanvas: fixed.canvas });
    flushFrame();
    flushFrame();
    expect(fixed.calls.stroke).toBeGreaterThan(0);
    // The limb lives on the fixed layer only.
    expect(calls.arcs).toHaveLength(0);
    for (let i = 0; i < 100; i++) flushFrame(); // push-in ends
    const fixedStrokes = fixed.calls.stroke;
    const movingStrokes = calls.stroke;
    for (let i = 0; i < 10; i++) flushFrame(40);
    expect(fixed.calls.stroke).toBe(fixedStrokes);
    expect(calls.stroke).toBeGreaterThan(movingStrokes);
    expect(fixed.canvas.width).toBe(canvas.width);
  });

  it("drifts at 30 fps once the push-in is over", () => {
    const { slot, canvas, calls } = setup();
    createHorizonRenderer({ slot, canvas });
    flushFrame();
    flushFrame();
    for (let i = 0; i < 100; i++) flushFrame();
    const drawn = calls.clearRect;
    for (let i = 0; i < 60; i++) flushFrame(1000 / 60);
    // One second of 60 Hz frames draws about 30 times.
    expect(calls.clearRect - drawn).toBeGreaterThanOrEqual(28);
    expect(calls.clearRect - drawn).toBeLessThanOrEqual(31);
  });
});

describe("frame governor", () => {
  it("holds while frames stay inside the budget", () => {
    const governor = createFrameGovernor(4, 10);
    for (let i = 0; i < 200; i++) expect(governor.sample(8)).toBe("hold");
    expect(governor.level).toBe(0);
  });

  it("steps down after sustained cost, never on one long task", () => {
    const governor = createFrameGovernor(4, 10);
    for (let i = 0; i < 30; i++) governor.sample(4);
    // A single 400 ms task is clamped and averaged away.
    expect(governor.sample(400)).toBe("hold");
    for (let i = 0; i < 30; i++) expect(governor.sample(4)).toBe("hold");
    expect(governor.level).toBe(0);

    const verdicts: string[] = [];
    for (let i = 0; i < 80; i++) verdicts.push(governor.sample(16));
    expect(verdicts).toContain("step");
    expect(governor.level).toBeGreaterThan(0);
  });

  it("freezes only when the lightest level still costs twice the budget", () => {
    const moderate = createFrameGovernor(2, 10);
    for (let i = 0; i < 400; i++) moderate.sample(15);
    expect(moderate.level).toBe(1);
    expect(moderate.sample(15)).toBe("hold");

    const heavy = createFrameGovernor(2, 10);
    const verdicts: string[] = [];
    for (let i = 0; i < 400; i++) verdicts.push(heavy.sample(35));
    expect(verdicts).toContain("freeze");
  });
});

describe("deck ease", () => {
  it("runs from 0 to 1, front-loaded like cubic-bezier(0.16, 1, 0.3, 1)", () => {
    expect(easeDeck(0)).toBe(0);
    expect(easeDeck(1)).toBe(1);
    expect(easeDeck(0.25)).toBeGreaterThan(0.6);
    let last = 0;
    for (let u = 0.05; u < 1; u += 0.05) {
      const value = easeDeck(u);
      expect(value).toBeGreaterThanOrEqual(last);
      last = value;
    }
  });
});

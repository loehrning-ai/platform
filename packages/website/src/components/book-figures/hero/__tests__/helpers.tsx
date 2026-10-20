import { act } from "@testing-library/react";
import { vi } from "vitest";
import { publishStageState } from "@/components/book-reader/stage/stage-protocol";

/** matchMedia that answers the motion queries; every other query is false. */
export function stubMedia(opts: { motion: boolean }): void {
  const mm = (q: string) => ({
    matches: q.includes("no-preference") ? opts.motion : q.includes("reduce") ? !opts.motion : false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });
  vi.stubGlobal("matchMedia", mm);
  window.matchMedia = mm as never;
}

/** Runs idle callbacks at once, so "after idle" is testable. */
export function stubIdle(): void {
  window.requestIdleCallback = ((cb: IdleRequestCallback) => {
    cb({ didTimeout: false, timeRemaining: () => 50 });
    return 1;
  }) as never;
  window.cancelIdleCallback = (() => undefined) as never;
}

export interface Recorder {
  fills: number;
  strokes: number;
  rects: number;
  styles: string[];
  calls: number;
  ctx: Record<string, unknown>;
}

/** A fake 2d context that counts the batched calls. */
export function stubCanvas(): Recorder {
  const rec: Recorder = { fills: 0, strokes: 0, rects: 0, styles: [], calls: 0, ctx: {} };
  const ctx = {
    set fillStyle(v: string) {
      rec.styles.push(String(v));
    },
    set strokeStyle(_v: string) {},
    set lineWidth(_v: number) {},
    setTransform: () => undefined,
    clearRect: () => {
      rec.calls += 1;
    },
    beginPath: () => undefined,
    rect: () => {
      rec.rects += 1;
    },
    fill: () => {
      rec.fills += 1;
    },
    stroke: () => {
      rec.strokes += 1;
    },
  };
  rec.ctx = ctx;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as never);
  return rec;
}

export function setStage(root: Element, progress: number, step = 0, steps = 3): void {
  act(() => {
    publishStageState(root, { mode: "scrub", step, steps, stepProgress: 1, progress });
  });
}

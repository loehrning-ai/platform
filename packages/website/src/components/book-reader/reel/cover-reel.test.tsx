import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CoverPoster } from "./cover-poster";
import { CoverReel, REEL_START_T } from "./cover-reel";
import { cappedDpr, type ReelEngine, type ReelHandle } from "./reel-contract";
import { loadReelEngine } from "./reel-loader";

function stubMotion(reduced: boolean): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: reduced && query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
}

function engine(): { engine: ReelEngine; seek: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn>; mount: ReturnType<typeof vi.fn> } {
  const seek = vi.fn();
  const destroy = vi.fn();
  const handle: ReelHandle = { duration: 30, seek, destroy };
  const mount = vi.fn(() => handle);
  return { engine: { mount }, seek, destroy, mount };
}

const poster = <CoverPoster share={0.038} label="1.000 Quadrate" />;
const copy = <p>3,8 %</p>;

/** An observer that reports the target as visible at once. */
class VisibleObserver {
  constructor(private readonly cb: IntersectionObserverCallback) {}
  observe(target: Element): void {
    this.cb([{ isIntersecting: true, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
  unobserve(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  vi.useFakeTimers();
  stubMotion(false);
  vi.stubGlobal("IntersectionObserver", VisibleObserver);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("CoverReel", () => {
  it("is the poster first: the settled field and the copy, no pause switch, no canvas shown", () => {
    const { container } = render(<CoverReel poster={poster} copy={copy} load={async () => null} />);
    const root = container.querySelector<HTMLElement>("[data-cover-reel]")!;
    expect(root).toHaveAttribute("data-state", "poster");
    expect(root.querySelector("svg.cr-field")).not.toBeNull();
    expect(screen.getByText("3,8 %")).toBeVisible();
    expect(screen.getByRole("switch", { hidden: true })).not.toBeVisible();
    expect(root.querySelector("canvas")).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the poster and shows no switch when no engine is available (nothing moves, nothing to pause)", async () => {
    const { container } = render(<CoverReel poster={poster} copy={copy} load={async () => null} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(container.querySelector("[data-cover-reel]")).toHaveAttribute("data-state", "poster");
  });

  it("the default loader returns the real engine, which paints frames that differ over the 30 seconds", async () => {
    const engine = await loadReelEngine();
    expect(engine).not.toBeNull();
    const canvas = document.createElement("canvas");
    const calls: string[] = [];
    const ctx = new Proxy({} as Record<string, unknown>, {
      get: (target, key: string) => (key in target ? target[key] : (...args: unknown[]) => void calls.push(`${key}:${args.join(",")}`)),
      set: (target, key: string, value) => {
        target[key] = value;
        calls.push(`set ${key}=${String(value)}`);
        return true;
      },
    });
    canvas.getContext = (() => ctx) as unknown as HTMLCanvasElement["getContext"];
    const host = document.createElement("div");
    const handle = await engine!.mount(canvas, { width: 390, height: 556, dpr: 1, text: host });
    expect(handle.duration).toBe(30);
    const seen = new Set<string>();
    for (const t of [0, 5, 10, 15, 20, 25]) {
      calls.length = 0;
      handle.seek(t);
      seen.add(`${host.innerHTML}|${calls.join(";")}`);
    }
    expect(seen.size).toBe(6);
    // The same t twice paints nothing (a paused reel does no work).
    calls.length = 0;
    handle.seek(25);
    expect(calls).toHaveLength(0);
    handle.destroy();
    expect(host.innerHTML).toBe("");
  });

  it("starts the engine after idle, paints the hook frame (not the empty seam frame 0), then advances with the clock and loops over 30 s", async () => {
    const e = engine();
    const { container } = render(<CoverReel poster={poster} copy={copy} load={async () => e.engine} />);
    expect(e.mount).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(e.mount).toHaveBeenCalledTimes(1);
    expect(e.seek).toHaveBeenCalledWith(REEL_START_T);
    expect(e.seek).not.toHaveBeenCalledWith(0);
    expect(container.querySelector("[data-cover-reel]")).toHaveAttribute("data-state", "playing");
    const options = e.mount.mock.calls[0]![1] as { dpr: number };
    expect(options.dpr).toBeGreaterThanOrEqual(1);
    expect(options.dpr).toBeLessThanOrEqual(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    const times = e.seek.mock.calls.map((c) => c[0] as number);
    expect(Math.max(...times)).toBeLessThan(30);
    expect(times.length).toBeGreaterThan(1);
  });

  it("has a pause switch that stops the clock and resumes it", async () => {
    const e = engine();
    render(<CoverReel poster={poster} copy={copy} load={async () => e.engine} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    const toggle = screen.getByRole("switch", { name: "Bewegung anhalten" });
    expect(toggle).toBeVisible();
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    const paused = e.seek.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(e.seek.mock.calls.length).toBe(paused);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(e.seek.mock.calls.length).toBeGreaterThan(paused);
  });

  it("pauses in a hidden tab", async () => {
    const e = engine();
    render(<CoverReel poster={poster} copy={copy} load={async () => e.engine} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    const count = e.seek.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(e.seek.mock.calls.length).toBe(count);
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });

  it("never loads the engine under reduced motion: the settled cover stays", async () => {
    stubMotion(true);
    const e = engine();
    const load = vi.fn(async () => e.engine);
    const { container } = render(<CoverReel poster={poster} copy={copy} load={load} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(load).not.toHaveBeenCalled();
    expect(container.querySelector("[data-cover-reel]")).toHaveAttribute("data-state", "poster");
  });

  it("destroys the engine on unmount", async () => {
    const e = engine();
    const { unmount } = render(<CoverReel poster={poster} copy={copy} load={async () => e.engine} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    unmount();
    expect(e.destroy).toHaveBeenCalledTimes(1);
  });
});

describe("cappedDpr", () => {
  it("caps at 2, and at 1.5 on four cores or fewer", () => {
    expect(cappedDpr(3, 8)).toBe(2);
    expect(cappedDpr(3, 4)).toBe(1.5);
    expect(cappedDpr(2, undefined)).toBe(2);
    expect(cappedDpr(0.5, 8)).toBe(1);
  });
});

describe("CoverPoster", () => {
  it("fills whole squares and one partial square for the share, never rounding up", () => {
    const { container } = render(<CoverPoster share={0.038} label="x" />);
    const svg = container.querySelector("svg")!;
    const count = (cls: string) => ((svg.querySelector(`.${cls}`)?.getAttribute("d") ?? "").match(/M/g) ?? []).length;
    expect(svg.getAttribute("data-cover-squares")).toBe("38");
    const solid = [...svg.querySelectorAll(".cr-sq--solid")].map((p) => (p.getAttribute("d") ?? "").match(/M/g)?.length ?? 0);
    expect(solid[0]).toBe(38);
    expect(solid[1] ?? 0).toBe(0);
    expect(count("cr-sq--rest")).toBe(962);
  });

  it("marks a partial square when the share does not land on one", () => {
    const { container } = render(<CoverPoster share={0.0037} label="x" />);
    const solid = [...container.querySelectorAll(".cr-sq--solid")].map((p) => (p.getAttribute("d") ?? "").match(/M/g)?.length ?? 0);
    expect(solid).toEqual([3, 1]);
  });
});

describe("cover-reel.css contract", () => {
  const css = readFileSync(join(__dirname, "cover-reel.css"), "utf8");
  it("has no radius, gradient or shadow; hover only on fine pointers; a 3px Mennige focus ring; a 48px switch", () => {
    expect(css).not.toMatch(/border-radius:\s*[1-9]|gradient\(|box-shadow/);
    expect(css).toMatch(/\.cr-pause:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--cr-accent\)/);
    expect(css).toMatch(/\.cr-pause\s*\{[^}]*min-height:\s*3rem/);
    const outside = css.replace(/@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\n\}\n/g, "");
    expect(outside).not.toMatch(/:hover/);
  });

  it("keeps the box at the film's exact aspect and cuts it by width, never by a height cap (the clipped source line)", () => {
    // The film is scaled by the box's width; a max-height on the box cut the unit and source lines on tablets.
    expect(css).not.toMatch(/\.cr-box\s*\{[^}]*max-height/);
    expect(css).toMatch(/\.cr-box\s*\{[^}]*aspect-ratio:\s*540 \/ 768/);
    expect(css).toMatch(/@media \(min-width: 640px\)\s*\{\s*\.cr\s*\{\s*width:\s*min\(100%, max\(22rem, 46\.4svh\)\)/);
    expect(css).toMatch(/@media \(min-width: 1024px\)\s*\{[^}]*\.cr\s*\{\s*width:\s*min\(100%, max\(40rem, 128svh\)\)/);
  });
});

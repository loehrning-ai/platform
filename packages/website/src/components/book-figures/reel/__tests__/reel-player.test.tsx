import { act, cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReelPlayer } from "../reel-player.tsx";
import { createReel, POSTER_T } from "../reel.ts";
import { paintCanvas, type Surface } from "../paint.ts";
import { STRIDE } from "../field.ts";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("canvas painter", () => {
  function recorder(): { surface: Surface; counts: Record<string, number> } {
    const counts: Record<string, number> = {};
    const bump = (k: string) => () => {
      counts[k] = (counts[k] ?? 0) + 1;
    };
    const surface = {
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      globalAlpha: 1,
      fillRect: bump("fillRect"),
      strokeRect: bump("strokeRect"),
      beginPath: bump("beginPath"),
      rect: bump("rect"),
      moveTo: bump("moveTo"),
      lineTo: bump("lineTo"),
      closePath: bump("closePath"),
      fill: bump("fill"),
      stroke: bump("stroke"),
      save: bump("save"),
      restore: bump("restore"),
      clip: bump("clip"),
    } satisfies Surface;
    return { surface, counts };
  }

  it("fills the squares with three batched fills, however many squares there are", () => {
    const reel = createReel("tall");
    for (const t of [0.4, 7.7, 15.5, 18.9]) {
      const { surface, counts } = recorder();
      const scene = reel.scene(t);
      paintCanvas(surface, scene);
      expect(counts.fill).toBe(3);
      expect(counts.rect).toBeGreaterThanOrEqual(scene.count);
    }
  });

  it("reuses one buffer: no allocation per frame", () => {
    const reel = createReel("wide");
    const a = reel.scene(1).squares;
    const b = reel.scene(20).squares;
    expect(a).toBe(b);
    expect(a.length).toBe(1000 * STRIDE);
  });
});

describe("ReelPlayer", () => {
  it("server markup is the cover as one scalable SVG with live text and a reserved box", () => {
    const html = renderToString(<ReelPlayer format="tall" />);
    expect(html).toContain("<svg");
    expect(html).toContain("viewBox=\"0 0 540 960\"");
    expect(html).toContain("außen");
    expect(html).toContain("aspect-ratio:540 / 960");
    expect(html).not.toContain("<canvas");
    expect(html).not.toContain("role=\"switch\"");
  });

  it("the wide poster has its own ids and viewBox", () => {
    const html = renderToString(<ReelPlayer format="wide" />);
    expect(html).toContain("viewBox=\"0 0 960 540\"");
    expect(html).toContain("reel-clip-wide");
  });

  it("the static picture equals the settled cover at the poster time", () => {
    const reel = createReel("tall");
    expect(reel.staticSvg(POSTER_T)).toBe(reel.staticSvg(POSTER_T + 30));
  });

  it("reduced motion keeps the settled cover: no canvas, no switch", async () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    const { container } = render(<ReelPlayer />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 700));
    });
    expect(container.querySelector("canvas")).toBeNull();
    expect(screen.queryByRole("switch")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("goes live after idle with a 44 px pause switch that pauses and resumes", async () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} unobserve() {} takeRecords() { return []; } });
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} unobserve() {} });
    const raf = vi.fn(() => 1);
    vi.stubGlobal("requestAnimationFrame", raf);
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as never;
    render(<ReelPlayer />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 700));
    });
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(sw).toHaveTextContent("Pause");
    // Never visible in this test, so nothing was scheduled: no idle rAF.
    expect(raf).not.toHaveBeenCalled();
    await act(async () => {
      sw.click();
    });
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("switch")).toHaveTextContent("Weiter");
  });
});

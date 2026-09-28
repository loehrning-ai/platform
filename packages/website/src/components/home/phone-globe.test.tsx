import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const renderer = vi.hoisted(() => ({
  create: vi.fn(),
  setPaused: vi.fn(),
  destroy: vi.fn(),
}));

vi.mock("@/components/werk/horizon-globe-renderer", () => ({
  createHorizonRenderer: (options: {
    onState?: (state: string) => void;
    paused?: boolean;
  }) => {
    renderer.create(options);
    options.onState?.(options.paused ? "paused" : "running");
    return { setPaused: renderer.setPaused, destroy: renderer.destroy };
  },
}));

vi.mock("@/components/home/hero-network", () => ({
  HeroNetwork: () => <div data-testid="hero-network" />,
}));

import { HeroSection } from "./hero";
import { HorizonGlobeFrame } from "@/components/werk/horizon-globe-frame";
import { HORIZON_SCENE } from "@/components/werk/horizon-projection";
import { HOME_SCENE } from "@/lib/plakat/palettes";

/** Layers of the server frame: the lemons disc has no sky (its edge is the limb). */
const LAYERS = HOME_SCENE === "lemons" ? ["lines", "focus"] : ["lines", "focus", "sky"];

type Env = {
  desktop?: boolean;
  reducedMotion?: boolean;
  reducedData?: boolean;
};

const listeners = new Map<string, Set<() => void>>();
let env: Env = {};
const originalMatchMedia = window.matchMedia;

function queryMatches(query: string): boolean {
  if (query === "(min-width: 64rem)" || query === "(min-width: 1024px)") {
    return Boolean(env.desktop);
  }
  if (query === "(prefers-reduced-motion: reduce)") return Boolean(env.reducedMotion);
  if (query === "(prefers-reduced-data: reduce)") return Boolean(env.reducedData);
  return false;
}

function installMatchMedia(next: Env): void {
  env = next;
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return queryMatches(query);
    },
    media: query,
    onchange: null,
    addEventListener: (type: string, listener: () => void) => {
      if (type !== "change") return;
      if (!listeners.has(query)) listeners.set(query, new Set());
      listeners.get(query)?.add(listener);
    },
    removeEventListener: (type: string, listener: () => void) => {
      listeners.get(query)?.delete(listener);
    },
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function changeEnv(next: Env): void {
  env = next;
  for (const set of listeners.values()) for (const listener of set) listener();
}

function renderHero(locale: "de" | "en" = "de") {
  return render(
    <HeroSection locale={locale} phoneGlobe={<HorizonGlobeFrame />} />,
  );
}

beforeEach(() => {
  renderer.create.mockClear();
  renderer.setPaused.mockClear();
  renderer.destroy.mockClear();
  listeners.clear();
  window.localStorage.clear();
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("phone hero globe: server frame", () => {
  it("renders the first frame as decorative inline SVG without ids", () => {
    installMatchMedia({});
    const html = renderToString(
      <HeroSection locale="en" phoneGlobe={<HorizonGlobeFrame />} />,
    );

    expect(html).toContain("data-home-globe=");
    expect(html).toContain('data-home-globe-motion="static"');
    expect(html).toContain("data-home-globe-ssr");
    for (const layer of LAYERS) {
      expect(html).toContain(`data-home-globe-layer="${layer}"`);
    }
    // The desktop projection namespace never appears in the phone band.
    expect(html).not.toContain("data-hero-globe-poster");
    expect(html).not.toContain("data-hero-network-shell");
    expect(html).not.toContain("data-hero-globe-motion");
    // No pause control before the renderer is live.
    expect(html).not.toContain("data-home-globe-toggle");

    const { container } = render(<HorizonGlobeFrame />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(LAYERS.length);
    for (const svg of svgs) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
    }
    expect(container.querySelector("[id]")).toBeNull();
  });

  it("keeps the lemons frame lean: a flat Mennige disc, a 30 degree knockout graticule and Germany in Butter", () => {
    const html = renderToString(<HorizonGlobeFrame scene="lemons" />);
    expect(html.length).toBeLessThan(16_000);
    const { container } = render(<HorizonGlobeFrame scene="lemons" />);
    const scene = HORIZON_SCENE.lemons;
    const disc = container.querySelector("circle.hz-disc");
    expect(disc).toHaveAttribute("fill", "#b73a15");
    const grid = container.querySelector(".hz-grid");
    expect(grid).toHaveAttribute("stroke", "#152a79");
    expect(grid).toHaveAttribute("stroke-width", "1.5");
    expect(grid).toHaveAttribute("stroke-opacity", "1");
    expect(scene.grid.step).toBe(30);
    // No coastlines, no limb, glint, scale or depth-fade mask: the disc edge is the limb.
    // Every path in the lines layer is graticule; lines that would run along
    // the limb fade out by peak depth, so none hugs the disc edge.
    const linePaths = container.querySelectorAll('[data-home-globe-layer="lines"] path');
    expect(linePaths.length).toBeGreaterThan(0);
    for (const path of linePaths) expect(path.closest(".hz-grid")).not.toBeNull();
    for (const path of container.querySelectorAll(".hz-grid path[stroke-opacity]")) {
      expect(Number(path.getAttribute("stroke-opacity"))).toBeLessThan(1);
    }
    expect(container.querySelector(".hz-limb, .hz-glint, .hz-scale, .hz-sweep")).toBeNull();
    expect(html).not.toContain("mask-image");
    // Germany: a flat Butter fill, no stroke.
    const germany = container.querySelector(".hz-de-fill");
    expect(germany?.getAttribute("d")).toMatch(/Z$/);
    expect(germany).toHaveAttribute("fill", "#fceeaf");
    expect(container.querySelector(".hz-de")).toBeNull();
    // Berlin: Ultramarin with a Butter inset; stations: Butter with a Mennige inset.
    const [berlinOuter, berlinInner] = container.querySelectorAll(".hz-berlin rect");
    expect(berlinOuter).toHaveAttribute("fill", "#152a79");
    expect(berlinInner).toHaveAttribute("fill", "#fceeaf");
    const [stationOuter, stationInner] = container.querySelectorAll(".hz-stations > g rect");
    expect(stationOuter).toHaveAttribute("fill", "#fceeaf");
    expect(stationInner).toHaveAttribute("fill", "#b73a15");
    expect(container.querySelector(".hz-route")).toHaveAttribute("stroke", "#fceeaf");
    expect(container.querySelector(".hz-route")).toHaveAttribute("stroke-width", "2");
  });

  it("keeps the graphit fallback frame lean and draws Europe with Germany in Mennige", () => {
    const html = renderToString(<HorizonGlobeFrame scene="graphit" />);
    // Graticule, coastlines, Germany and the limb stay a few kilobytes.
    expect(html.length).toBeLessThan(16_000);
    const { container } = render(<HorizonGlobeFrame scene="graphit" />);
    const germany = container.querySelector(".hz-de");
    expect(germany).not.toBeNull();
    expect(germany?.getAttribute("d")).toMatch(/Z$/);
    expect(germany).toHaveAttribute("stroke", "#e07050");
    // The depth fade is a CSS mask in container units of the slot.
    expect(html).toMatch(/mask-image:radial-gradient\(circle 130cqw at 58cqw 140cqw/);
  });

  it("draws the graphit Lernroute from Berlin in Mennige, with its stations", () => {
    const { container } = render(<HorizonGlobeFrame scene="graphit" />);
    const route = container.querySelector(".hz-route");
    expect(route).not.toBeNull();
    expect(route).toHaveAttribute("stroke", "#e07050");
    expect(route).toHaveAttribute("pathLength", "1");
    // The route starts at Berlin: its first move lands on the station.
    const berlin = container.querySelector(".hz-berlin rect");
    const [, mx, my] = /^M(-?\d+) (-?\d+)/.exec(route?.getAttribute("d") ?? "") ?? [];
    const bx = Number(berlin?.getAttribute("x")) + Number(berlin?.getAttribute("width")) / 2;
    const by = Number(berlin?.getAttribute("y")) + Number(berlin?.getAttribute("height")) / 2;
    expect(Math.abs(Number(mx) - bx)).toBeLessThanOrEqual(1);
    expect(Math.abs(Number(my) - by)).toBeLessThanOrEqual(1);
    expect(container.querySelectorAll(".hz-stations > g").length).toBeGreaterThan(0);
    // Every layer of the server frame steps out once the canvas has drawn,
    // the sky included: the canvas redraws it on the pushed-in sphere.
    const sky = container.querySelector('[data-home-globe-layer="sky"]');
    expect(sky).toHaveAttribute("data-home-globe-ssr");
  });

  it("stacks a fixed-layer canvas above the moving one", () => {
    installMatchMedia({ reducedMotion: true });
    const { container } = renderHero();
    const canvases = container.querySelectorAll("[data-home-globe] > canvas");
    expect(canvases).toHaveLength(2);
    expect(canvases[1]).toHaveAttribute("data-home-globe-static");
  });

  it("places the globe after the actions, hidden from assistive tech", () => {
    installMatchMedia({ reducedMotion: true });
    const { container } = renderHero();
    const slot = container.querySelector("[data-home-globe]");
    expect(slot).toHaveAttribute("aria-hidden", "true");
    expect(slot).toHaveClass("lg:hidden");
    const cta = screen.getByRole("link", { name: /Lernroute wählen/ });
    expect(
      cta.compareDocumentPosition(slot as Element) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(slot?.querySelector("canvas")).not.toBeNull();
  });
});

describe("phone hero globe: live renderer", () => {
  it("never loads the renderer under reduced motion and shows no control", async () => {
    vi.useFakeTimers();
    installMatchMedia({ reducedMotion: true });
    renderHero();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    vi.useRealTimers();
    expect(renderer.create).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Globus anhalten" })).toBeNull();
  });

  it("never loads the renderer under reduced data or on desktop", async () => {
    vi.useFakeTimers();
    installMatchMedia({ reducedData: true });
    const first = renderHero();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    first.unmount();

    installMatchMedia({ desktop: true });
    renderHero();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    vi.useRealTimers();
    expect(renderer.create).not.toHaveBeenCalled();
  });

  it("loads after load and idle below lg, then offers a localized pause", async () => {
    installMatchMedia({});
    renderHero("en");
    expect(renderer.create).not.toHaveBeenCalled();

    const toggle = await screen.findByRole("button", { name: "Pause the globe" });
    expect(renderer.create).toHaveBeenCalledTimes(1);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAttribute("data-home-globe-toggle");

    fireEvent.click(toggle);
    expect(renderer.setPaused).toHaveBeenLastCalledWith(true);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(window.localStorage.getItem("loehrning:home-globe-paused")).toBe("1");

    fireEvent.click(toggle);
    expect(renderer.setPaused).toHaveBeenLastCalledWith(false);
    expect(window.localStorage.getItem("loehrning:home-globe-paused")).toBeNull();
  });

  it("starts paused when the visitor paused it before", async () => {
    window.localStorage.setItem("loehrning:home-globe-paused", "1");
    installMatchMedia({});
    renderHero();
    const toggle = await screen.findByRole("button", { name: "Globus anhalten" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(renderer.create.mock.calls[0][0]).toMatchObject({ paused: true });
  });

  it("tears the renderer down when the viewport crosses into desktop or motion is reduced", async () => {
    installMatchMedia({});
    const { unmount } = renderHero();
    await screen.findByRole("button", { name: "Globus anhalten" });

    await act(async () => {
      changeEnv({ desktop: true });
    });
    expect(renderer.destroy).toHaveBeenCalledTimes(1);
    // (The desktop globe's own surface control shares the German name, so
    // the phone control is found by its attribute.)
    expect(document.querySelector("[data-home-globe-toggle]")).toBeNull();

    await act(async () => {
      changeEnv({});
    });
    await waitFor(() => expect(renderer.create).toHaveBeenCalledTimes(2));

    await act(async () => {
      changeEnv({ reducedMotion: true });
    });
    expect(renderer.destroy).toHaveBeenCalledTimes(2);

    unmount();
  });

  it("hands the fixed-layer canvas to the renderer", async () => {
    installMatchMedia({});
    renderHero();
    await screen.findByRole("button", { name: "Globus anhalten" });
    const options = renderer.create.mock.calls[0][0] as {
      staticCanvas?: HTMLCanvasElement;
    };
    expect(options.staticCanvas).toBeInstanceOf(HTMLCanvasElement);
    expect(options.staticCanvas).toHaveAttribute("data-home-globe-static");
  });

  it("snaps the opening to its resting frame when the visitor scrolls", () => {
    installMatchMedia({ reducedMotion: true });
    const finish = vi.fn();
    const { container } = renderHero();
    const slot = container.querySelector("[data-home-globe]") as HTMLElement;
    slot.getAnimations = vi.fn(() => [{ finish } as unknown as Animation]);
    fireEvent.scroll(window);
    expect(finish).toHaveBeenCalledTimes(1);
    // Once only.
    fireEvent.scroll(window);
    expect(finish).toHaveBeenCalledTimes(1);
  });

  it("destroys the renderer on unmount", async () => {
    installMatchMedia({});
    const { unmount } = renderHero();
    await screen.findByRole("button", { name: "Globus anhalten" });
    unmount();
    expect(renderer.destroy).toHaveBeenCalledTimes(1);
  });
});

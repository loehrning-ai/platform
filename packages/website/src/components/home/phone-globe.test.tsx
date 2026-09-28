import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { useEffect, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Every mount of the live globe, with the props it got. */
const network = vi.hoisted(() => ({
  mounts: [] as Array<Record<string, unknown>>,
  unmounts: 0,
}));

vi.mock("@/components/home/hero-network", () => ({
  HeroNetwork: function HeroNetworkMock(props: {
    compact?: boolean;
    paused?: boolean;
    onLive?: () => void;
  }) {
    const { onLive, paused } = props;
    // Record each mount once, with the props it mounted with.
    useState(() => network.mounts.push(props));
    useEffect(
      () => () => {
        network.unmounts += 1;
      },
      [],
    );
    useEffect(() => {
      // The real globe calls onLive after its first drawn frame; a paused
      // globe draws none.
      if (!paused) onLive?.();
    }, [onLive, paused]);
    return (
      <div
        data-testid="hero-network"
        data-compact={props.compact ? "true" : "false"}
        data-paused={paused ? "true" : "false"}
      />
    );
  },
}));

import { HeroSection } from "./hero";
import { HeroGlobeFrame } from "./hero-globe-frame";

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
  if (query === "(prefers-reduced-motion: reduce)")
    return Boolean(env.reducedMotion);
  if (query === "(prefers-reduced-data: reduce)")
    return Boolean(env.reducedData);
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
    <HeroSection locale={locale} phoneGlobe={<HeroGlobeFrame />} />,
  );
}

function phoneMounts() {
  return network.mounts.filter((props) => props.compact === true);
}

beforeEach(() => {
  network.mounts.length = 0;
  network.unmounts = 0;
  listeners.clear();
  window.localStorage.clear();
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("phone hero globe: server frame", () => {
  it("renders the first frame as decorative inline SVG in its own namespace", () => {
    installMatchMedia({});
    const html = renderToString(
      <HeroSection locale="en" phoneGlobe={<HeroGlobeFrame />} />,
    );

    expect(html).toContain("data-home-globe=");
    expect(html).toContain('data-home-globe-motion="static"');
    expect(html).toContain("data-home-globe-ssr");
    // The desktop projection namespace never appears in the phone band.
    expect(html).not.toContain("data-hero-globe-poster");
    expect(html).not.toContain("data-hero-network-shell");
    expect(html).not.toContain("data-hero-globe-motion");
    // No pause control before the live globe runs.
    expect(html).not.toContain("data-home-globe-toggle");
  });

  it("places the globe after the actions, hidden from assistive tech", () => {
    installMatchMedia({ reducedMotion: true });
    const { container } = renderHero();
    const slot = container.querySelector("[data-home-globe]");
    expect(slot).toHaveAttribute("aria-hidden", "true");
    expect(slot).toHaveAttribute("id", "home-phone-globe");
    expect(slot).toHaveClass("lg:hidden");
    const cta = screen.getByRole("link", { name: /Lernroute wählen/ });
    expect(
      cta.compareDocumentPosition(slot as Element) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(slot?.querySelector("[data-home-globe-ssr]")).not.toBeNull();
    expect(slot?.querySelector("[tabindex], a, button")).toBeNull();
  });
});

describe("phone hero globe: live globe", () => {
  it("never loads the live globe under reduced motion and shows no control", async () => {
    vi.useFakeTimers();
    installMatchMedia({ reducedMotion: true });
    const { container } = renderHero();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    vi.useRealTimers();
    expect(phoneMounts()).toHaveLength(0);
    expect(
      container.querySelector("[data-home-globe]"),
    ).toHaveAttribute("data-home-globe-motion", "static");
    expect(
      screen.queryByRole("button", { name: "Globus anhalten" }),
    ).toBeNull();
  });

  it("never loads the live phone globe under reduced data or on desktop", async () => {
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
    expect(phoneMounts()).toHaveLength(0);
  });

  it("goes live after load and idle below lg, hides the frame, then offers a localized pause", async () => {
    installMatchMedia({});
    const { container } = renderHero("en");
    const slot = container.querySelector("[data-home-globe]");

    const toggle = await screen.findByRole("button", {
      name: "Pause the globe",
    });
    expect(phoneMounts()).toHaveLength(1);
    expect(slot).toHaveAttribute("data-home-globe-live", "");
    expect(slot).toHaveAttribute("data-home-globe-motion", "running");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAttribute("data-home-globe-toggle");
    expect(toggle).toHaveAttribute("aria-controls", "home-phone-globe");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(slot).toHaveAttribute("data-home-globe-motion", "paused");
    expect(screen.getByTestId("hero-network")).toHaveAttribute(
      "data-paused",
      "true",
    );
    expect(window.localStorage.getItem("loehrning:home-globe-paused")).toBe(
      "1",
    );

    fireEvent.click(toggle);
    expect(screen.getByTestId("hero-network")).toHaveAttribute(
      "data-paused",
      "false",
    );
    expect(
      window.localStorage.getItem("loehrning:home-globe-paused"),
    ).toBeNull();
  });

  it("starts paused when the visitor paused it before, and keeps the frame until a live frame", async () => {
    window.localStorage.setItem("loehrning:home-globe-paused", "1");
    installMatchMedia({});
    const { container } = renderHero();
    const toggle = await screen.findByRole("button", {
      name: "Globus anhalten",
    });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(phoneMounts()[0]).toMatchObject({ paused: true, compact: true });
    // A paused globe has drawn nothing: the server frame stays the globe.
    expect(
      container.querySelector("[data-home-globe]"),
    ).not.toHaveAttribute("data-home-globe-live");
  });

  it("tears the live globe down when the viewport crosses into desktop or motion is reduced", async () => {
    installMatchMedia({});
    const { container, unmount } = renderHero();
    await screen.findByRole("button", { name: "Globus anhalten" });
    const slot = container.querySelector("[data-home-globe]");

    await act(async () => {
      changeEnv({ desktop: true });
    });
    expect(slot?.querySelector('[data-compact="true"]')).toBeNull();
    expect(slot).not.toHaveAttribute("data-home-globe-live");
    expect(document.querySelector("[data-home-globe-toggle]")).toBeNull();

    await act(async () => {
      changeEnv({});
    });
    await waitFor(() => expect(phoneMounts()).toHaveLength(2));

    await act(async () => {
      changeEnv({ reducedMotion: true });
    });
    expect(slot?.querySelector('[data-compact="true"]')).toBeNull();

    unmount();
  });
});

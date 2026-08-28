import { act, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/home/hero-network", () => ({
  HERO_GLOBE_INTRO_MS: 4_400,
  HeroNetwork: function HeroNetworkMock(props: {
    mobile?: boolean;
    paused?: boolean;
  }) {
    return (
      <div
        data-testid="hero-network"
        data-hero-network-shell
        data-mode={props.mobile ? "mobile" : "desktop"}
        data-paused={props.paused ? "true" : "false"}
      />
    );
  },
}));

import { HeroSection } from "./hero";

const originalMatchMedia = window.matchMedia;

function setDesktopMatch(matches: boolean): void {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === "(min-width: 1024px)" ? matches : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function setControlledDesktopMatch(initial: boolean): (matches: boolean) => void {
  let desktopMatches = initial;
  const desktopListeners = new Set<(event: MediaQueryListEvent) => void>();

  window.matchMedia = vi.fn().mockImplementation((query: string) => {
    const desktopQuery = query === "(min-width: 1024px)";
    return {
      get matches() {
        return desktopQuery ? desktopMatches : false;
      },
      media: query,
      onchange: null,
      addEventListener: vi.fn(
        (type: string, listener: (event: MediaQueryListEvent) => void) => {
          if (desktopQuery && type === "change") desktopListeners.add(listener);
        },
      ),
      removeEventListener: vi.fn(
        (type: string, listener: (event: MediaQueryListEvent) => void) => {
          if (desktopQuery && type === "change") desktopListeners.delete(listener);
        },
      ),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });

  return (matches: boolean) => {
    desktopMatches = matches;
    const event = {
      matches,
      media: "(min-width: 1024px)",
    } as MediaQueryListEvent;
    desktopListeners.forEach((listener) => listener(event));
  };
}

afterEach(() => {
  vi.useRealTimers();
  window.matchMedia = originalMatchMedia;
});

describe("HeroSection responsive globe", () => {
  it("server-renders the real globe shell without an alternate poster", () => {
    setDesktopMatch(true);
    const html = renderToString(<HeroSection locale="en" />);

    expect(html).not.toContain("data-hero-globe-poster");
    expect(html).toContain('data-testid="hero-network"');
    expect(html).toContain("data-hero-network-shell");
  });

  it.each([
    [true, "desktop"],
    [false, "mobile"],
  ] as const)("mounts only the %s projection tree", async (matches, mode) => {
    setDesktopMatch(matches);
    const { getAllByTestId } = render(<HeroSection />);

    await waitFor(
      () => {
        const networks = getAllByTestId("hero-network");
        expect(networks).toHaveLength(1);
        expect(networks[0]).toHaveAttribute("data-mode", mode);
      },
      { timeout: 500 },
    );
  });

  it("runs one finite desktop globe intro without an overlay control", async () => {
    vi.useFakeTimers();
    setDesktopMatch(true);
    render(<HeroSection locale="en" />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId("hero-network")).toHaveAttribute(
      "data-paused",
      "false",
    );
    expect(
      screen.queryByRole("button", { name: /globe motion/i }),
    ).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4_400);
    });
    expect(screen.getByTestId("hero-network")).toHaveAttribute(
      "data-paused",
      "true",
    );
    expect(
      document.querySelector('[data-hero-globe-motion="settled"]'),
    ).not.toBeNull();
  });

  it("keeps the mobile globe static without presenting a redundant control", async () => {
    setDesktopMatch(false);
    render(<HeroSection locale="en" />);

    await waitFor(
      () =>
        expect(screen.getByTestId("hero-network")).toHaveAttribute(
          "data-mode",
          "mobile",
        ),
      { timeout: 500 },
    );
    expect(
      screen.queryByRole("button", { name: /globe motion/i }),
    ).not.toBeInTheDocument();
  });

  it("does not restart the globe intro after a responsive interruption", async () => {
    vi.useFakeTimers();
    const setDesktop = setControlledDesktopMatch(true);
    render(<HeroSection locale="en" />);

    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(3_000);
      setDesktop(false);
    });
    expect(screen.getByTestId("hero-network")).toHaveAttribute(
      "data-paused",
      "true",
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
      setDesktop(true);
      await Promise.resolve();
    });
    expect(screen.getByTestId("hero-network")).toHaveAttribute(
      "data-paused",
      "true",
    );
    expect(
      document.querySelector('[data-hero-globe-motion="settled"]'),
    ).not.toBeNull();
  });
});

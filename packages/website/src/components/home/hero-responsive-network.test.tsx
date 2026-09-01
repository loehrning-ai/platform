import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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

function setControlledDesktopMatch(
  initial: boolean,
): (matches: boolean) => void {
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
          if (desktopQuery && type === "change")
            desktopListeners.delete(listener);
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
  it("keeps the projection module out of the server-rendered mobile-first shell", () => {
    setDesktopMatch(true);
    const html = renderToString(<HeroSection locale="en" />);

    expect(html).not.toContain("data-hero-globe-poster");
    expect(html).not.toContain('data-testid="hero-network"');
    expect(html).not.toContain("data-hero-network-shell");
  });

  it("loads one projection tree after the desktop query resolves", async () => {
    setDesktopMatch(true);
    const { getAllByTestId } = render(<HeroSection />);

    await waitFor(
      () => {
        const networks = getAllByTestId("hero-network");
        expect(networks).toHaveLength(1);
        expect(networks[0]).toHaveAttribute("data-mode", "desktop");
      },
      { timeout: 500 },
    );
  });

  it("omits the projection tree and control below the desktop breakpoint", async () => {
    setDesktopMatch(false);
    render(<HeroSection locale="en" />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByTestId("hero-network")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /globe motion/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps the desktop globe running until its 44px control pauses it", async () => {
    setDesktopMatch(true);
    render(<HeroSection locale="en" />);

    const network = await screen.findByTestId("hero-network");
    expect(screen.getByTestId("hero-network")).toHaveAttribute(
      "data-paused",
      "false",
    );
    const pause = screen.getByRole("button", { name: /pause globe motion/i });
    expect(pause).toHaveClass("size-11");
    expect(pause).toHaveAttribute("aria-pressed", "false");
    expect(
      document.querySelector('[data-hero-globe-motion="running"]'),
    ).not.toBeNull();

    fireEvent.click(pause);
    expect(network).toHaveAttribute("data-paused", "true");
    expect(
      document.querySelector('[data-hero-globe-motion="paused"]'),
    ).not.toBeNull();
    const resume = screen.getByRole("button", { name: /resume globe motion/i });
    fireEvent.click(resume);
    expect(network).toHaveAttribute("data-paused", "false");
  });

  it("unmounts the desktop projection during a responsive interruption", async () => {
    const setDesktop = setControlledDesktopMatch(true);
    render(<HeroSection locale="en" />);

    await screen.findByTestId("hero-network");
    await act(async () => {
      setDesktop(false);
    });
    expect(screen.queryByTestId("hero-network")).not.toBeInTheDocument();

    await act(async () => {
      setDesktop(true);
      await Promise.resolve();
    });
    expect(await screen.findByTestId("hero-network")).toHaveAttribute(
      "data-paused",
      "false",
    );
  });
});

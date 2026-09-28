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
    matches: query === "(min-width: 64rem)" ? matches : false,
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
    const desktopQuery = query === "(min-width: 64rem)";
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
      media: "(min-width: 64rem)",
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

  it("omits the projection tree below the desktop breakpoint", async () => {
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

  it("gives phones the server-frame globe slot, never the desktop projection", async () => {
    setDesktopMatch(false);
    const { container } = render(
      <HeroSection
        locale="en"
        phoneGlobe={<svg data-testid="horizon-frame" aria-hidden="true" />}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });
    // The phone globe has its own namespace and is hidden from lg up by CSS;
    // the desktop projection and its control stay desktop-only. The phone's
    // own live globe arrives only after load and idle (phone-globe.test.tsx).
    const slot = container.querySelector("[data-home-globe]");
    expect(slot).not.toBeNull();
    expect(slot).toHaveClass("lg:hidden");
    expect(slot).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("horizon-frame")).toBeInTheDocument();
    expect(container.querySelector("[data-hero-globe-motion]")).toBeNull();
    expect(screen.queryByTestId("hero-network")).not.toBeInTheDocument();
  });

  it("mounts the desktop projection on the same rem query as Tailwind lg", async () => {
    // A px query would disagree with lg under a larger default font size and
    // run both globes at once between 1024px and 16 x the font size.
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 1024px)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    render(<HeroSection locale="en" />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByTestId("hero-network")).not.toBeInTheDocument();
  });

  it("gives the desktop globe one visible pause control beside the action", async () => {
    setDesktopMatch(true);
    const { container } = render(<HeroSection locale="en" />);

    await screen.findByTestId("hero-network");
    expect(screen.getByTestId("hero-network")).toHaveAttribute(
      "data-paused",
      "false",
    );
    expect(
      document.querySelector('[data-hero-globe-motion="running"]'),
    ).not.toBeNull();
    // Exactly one control: no invisible surface button over the globe.
    const controls = screen.getAllByRole("button", { name: "Pause the globe" });
    expect(controls).toHaveLength(1);
    const toggle = controls[0];
    expect(container.querySelector("[data-hero-globe-surface-control]")).toBeNull();
    expect(toggle).toHaveAttribute("data-hero-globe-toggle");
    expect(toggle).toHaveAttribute("aria-controls", "home-hero-network");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle.closest("[data-hero-actions]")).not.toBeNull();

    fireEvent.click(toggle);
    expect(screen.getByTestId("hero-network")).toHaveAttribute(
      "data-paused",
      "true",
    );
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveAccessibleName("Pause the globe");
    expect(
      document.querySelector('[data-hero-globe-motion="paused"]'),
    ).not.toBeNull();
  });

  it("drops the pause control when reduced motion leaves the globe static", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches:
        query === "(min-width: 64rem)" ||
        query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    render(<HeroSection locale="en" />);
    await screen.findByTestId("hero-network");
    expect(
      document.querySelector('[data-hero-globe-motion="static"]'),
    ).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: /globe/i }),
    ).not.toBeInTheDocument();
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

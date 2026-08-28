import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({
  default: () =>
    function HeroNetworkMock(props: { mobile?: boolean; paused?: boolean }) {
      return (
        <div
          data-testid="hero-network"
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

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("HeroSection responsive globe", () => {
  it("does not server-render an alternate globe before viewport hydration", () => {
    setDesktopMatch(true);
    const html = renderToString(<HeroSection locale="en" />);

    expect(html).not.toContain("data-hero-globe-poster");
    expect(html).not.toContain("data-testid=\"hero-network\"");
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
      { timeout: 2000 },
    );
  });

  it("gives desktop users a 44px native pause control and resumes the same globe", async () => {
    setDesktopMatch(true);
    render(<HeroSection locale="en" />);

    const pause = await screen.findByRole(
      "button",
      { name: "Pause globe motion" },
      { timeout: 2000 },
    );
    expect(pause).toHaveClass("min-h-11", "motion-reduce:hidden");
    expect(pause).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("hero-network")).toHaveAttribute(
      "data-paused",
      "false",
    );

    fireEvent.click(pause);

    expect(
      screen.getByRole("button", { name: "Resume globe motion" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("hero-network")).toHaveAttribute(
      "data-paused",
      "true",
    );
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
      { timeout: 2000 },
    );
    expect(
      screen.queryByRole("button", { name: /globe motion/i }),
    ).not.toBeInTheDocument();
  });
});

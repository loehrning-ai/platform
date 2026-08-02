import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({
  default: () =>
    function HeroNetworkMock(props: { mobile?: boolean }) {
      return (
        <div
          data-testid="hero-network"
          data-mode={props.mobile ? "mobile" : "desktop"}
        />
      );
    },
}));

import { HeroSection } from "./hero";

const originalMatchMedia = window.matchMedia;

function setDesktopMatch(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: "(min-width: 1024px)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("HeroSection responsive globe", () => {
  it.each([
    [true, "desktop"],
    [false, "mobile"],
  ] as const)("mounts only the %s projection tree", async (matches, mode) => {
    setDesktopMatch(matches);
    const { getAllByTestId } = render(<HeroSection />);

    await waitFor(() => {
      const networks = getAllByTestId("hero-network");
      expect(networks).toHaveLength(1);
      expect(networks[0]).toHaveAttribute("data-mode", mode);
    });
  });
});

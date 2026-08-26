import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RailNav } from "./rail-nav";

beforeEach(() => {
  Object.defineProperty(window, "scrollTo", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
  window.history.replaceState({}, "", "/blog/example");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("RailNav", () => {
  it("uses an instant offset scroll and preserves the section hash under reduced motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    render(
      <>
        <RailNav
          kicker="Article sections"
          locale="en"
          items={[{ id: "finding", num: "01", label: "Finding" }]}
        />
        <section id="finding">Finding content</section>
      </>,
    );
    const section = document.getElementById("finding")!;
    vi.spyOn(section, "getBoundingClientRect").mockReturnValue({
      top: 420,
      right: 0,
      bottom: 0,
      left: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 420,
      toJSON: () => ({}),
    });

    fireEvent.click(screen.getByRole("link", { name: /Finding/ }));

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 300,
      behavior: "auto",
    });
    expect(window.location.hash).toBe("#finding");
  });
});

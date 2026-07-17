// ─── ReadingProgressBar tests (shared course architecture) ──

import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { ReadingProgressBar } from "./reading-progress-bar";

afterEach(() => cleanup());

describe("ReadingProgressBar", () => {
  it("renders a fixed, aria-hidden 2px brand-orange bar", () => {
    const { container } = render(<ReadingProgressBar />);
    const outer = container.firstChild as HTMLElement;
    expect(outer).toBeTruthy();
    expect(outer.getAttribute("aria-hidden")).toBe("true");
    expect(outer.style.position).toBe("fixed");
    expect(outer.style.height).toBe("2px");
    const fill = outer.firstChild as HTMLElement;
    expect(fill.style.backgroundColor).toContain("brand-orange");
  });

  it("widens the fill as the page is scrolled", () => {
    const { container } = render(<ReadingProgressBar />);
    const fill = (container.firstChild as HTMLElement).firstChild as HTMLElement;

    // Simulate a scrollable document: 2000px content, 1000px viewport.
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 2000,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(window, "scrollY", { value: 500, configurable: true });

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    // 500 / (2000 - 1000) = 50%.
    expect(fill.style.width).toBe("50%");
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ chapterId: "fund" }),
  useRouter: () => ({ push }),
}));

import { DEF_CHAPTERS } from "@/lib/data-engineering-fundamentals/types";
import { DefChapterLayoutClient } from "./def-chapter-layout-client";

describe("DefChapterLayoutClient", () => {
  beforeEach(() => {
    push.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not run page shortcuts from an aria-modal dialog", () => {
    render(
      <DefChapterLayoutClient locale="en" chapters={DEF_CHAPTERS}>
        <section role="dialog" aria-modal="true" aria-label="Project modal">
          Modal content
        </section>
      </DefChapterLayoutClient>,
    );
    const modal = screen.getByRole("dialog", { name: "Project modal" });
    const scrollBy = vi.spyOn(window, "scrollBy");

    fireEvent.keyDown(modal, { key: "ArrowRight" });
    fireEvent.keyDown(modal, { key: "j" });

    expect(push).not.toHaveBeenCalled();
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("uses instant chapter scrolling when reduced motion is requested", () => {
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
    const scrollBy = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
    render(
      <DefChapterLayoutClient locale="en" chapters={DEF_CHAPTERS}>
        <p>Chapter content</p>
      </DefChapterLayoutClient>,
    );

    fireEvent.keyDown(window, { key: "j" });
    fireEvent.keyDown(window, { key: "k" });

    expect(scrollBy).toHaveBeenNthCalledWith(1, {
      top: 120,
      behavior: "auto",
    });
    expect(scrollBy).toHaveBeenNthCalledWith(2, {
      top: -120,
      behavior: "auto",
    });
  });
});

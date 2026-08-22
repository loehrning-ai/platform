import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
});

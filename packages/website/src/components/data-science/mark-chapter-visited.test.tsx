import { describe, it, expect, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  isChapterVisited,
  resetProgress,
  __resetCacheForTests,
} from "@/lib/data-science/progress";
import { MarkChapterVisited } from "./mark-chapter-visited";

describe("MarkChapterVisited", () => {
  afterEach(() => {
    cleanup();
    resetProgress();
    __resetCacheForTests();
  });

  it("does not mark the chapter until the learner confirms completion", () => {
    __resetCacheForTests();
    expect(isChapterVisited("fund")).toBe(false);
    render(<MarkChapterVisited chapterId="fund" />);
    expect(isChapterVisited("fund")).toBe(false);
    fireEvent.click(
      screen.getByRole("button", { name: "Mark chapter complete" }),
    );
    expect(isChapterVisited("fund")).toBe(true);
    expect(
      screen.getByRole("button", { name: "Chapter completed" }),
    ).toBeDisabled();
  });

  it("does not complete a newly rendered chapter implicitly", () => {
    __resetCacheForTests();
    const { rerender } = render(<MarkChapterVisited chapterId="fund" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Mark chapter complete" }),
    );
    rerender(<MarkChapterVisited chapterId="explore" />);
    expect(isChapterVisited("fund")).toBe(true);
    expect(isChapterVisited("explore")).toBe(false);
  });

  it("renders an explicit completion control", () => {
    __resetCacheForTests();
    render(<MarkChapterVisited chapterId="fund" />);
    expect(
      screen.getByRole("button", { name: "Mark chapter complete" }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});

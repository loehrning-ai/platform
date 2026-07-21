import { describe, it, expect, afterEach } from "vitest";
import { render } from "@testing-library/react";
import {
  isChapterVisited,
  resetProgress,
  __resetCacheForTests,
} from "@/lib/data-science/progress";
import { MarkChapterVisited } from "./mark-chapter-visited";

describe("MarkChapterVisited (plan 012 stage 12)", () => {
  afterEach(() => {
    resetProgress();
    __resetCacheForTests();
  });

  it("marks the given chapter visited on mount", () => {
    __resetCacheForTests();
    expect(isChapterVisited("fund")).toBe(false);
    render(<MarkChapterVisited chapterId="fund" />);
    expect(isChapterVisited("fund")).toBe(true);
  });

  it("re-marks the new chapter when chapterId changes across a rerender", () => {
    __resetCacheForTests();
    const { rerender } = render(<MarkChapterVisited chapterId="fund" />);
    expect(isChapterVisited("fund")).toBe(true);
    rerender(<MarkChapterVisited chapterId="explore" />);
    expect(isChapterVisited("explore")).toBe(true);
  });

  it("renders nothing", () => {
    __resetCacheForTests();
    const { container } = render(<MarkChapterVisited chapterId="fund" />);
    expect(container).toBeEmptyDOMElement();
  });
});

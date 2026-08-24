import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  isChapterVisited,
  resetProgress,
  __resetCacheForTests,
} from "@/lib/data-science/progress";
import {
  activateUnknownProgress,
  continueWithAnonymousProgress,
} from "@/lib/progress/store";
import { MarkChapterVisited } from "./mark-chapter-visited";

describe("MarkChapterVisited", () => {
  beforeEach(() => {
    window.localStorage.clear();
    __resetCacheForTests();
  });

  afterEach(() => {
    cleanup();
    resetProgress();
    __resetCacheForTests();
  });

  it("does not mark the chapter until the learner confirms completion", () => {
    __resetCacheForTests();
    expect(isChapterVisited("fund")).toBe(false);
    render(<MarkChapterVisited chapterId="fund" locale="en" />);
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
    const { rerender } = render(
      <MarkChapterVisited chapterId="fund" locale="en" />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Mark chapter complete" }),
    );
    rerender(<MarkChapterVisited chapterId="explore" locale="en" />);
    expect(isChapterVisited("fund")).toBe(true);
    expect(isChapterVisited("explore")).toBe(false);
  });

  it("renders an explicit completion control", () => {
    __resetCacheForTests();
    render(<MarkChapterVisited chapterId="fund" locale="en" />);
    expect(
      screen.getByRole("button", { name: "Mark chapter complete" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("blocks and describes the durable action while ownership is unresolved", () => {
    activateUnknownProgress();
    render(<MarkChapterVisited chapterId="fund" locale="en" />);

    const button = screen.getByRole("button", {
      name: "Mark chapter complete",
    });
    const status = screen.getByRole("status");

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-describedby", status.id);
    expect(status).toHaveTextContent(
      "Choose account or local progress above first.",
    );
    fireEvent.click(button);
    expect(isChapterVisited("fund")).toBe(false);
    expect(window.localStorage.getItem("loehrning-progress-v2")).toBeNull();
  });

  it("persists after the learner explicitly continues locally", () => {
    activateUnknownProgress();
    render(<MarkChapterVisited chapterId="fund" locale="en" />);

    const button = screen.getByRole("button", {
      name: "Mark chapter complete",
    });
    expect(button).toBeDisabled();

    act(() => {
      continueWithAnonymousProgress();
    });

    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fireEvent.click(button);

    expect(isChapterVisited("fund")).toBe(true);
    expect(
      JSON.parse(
        window.localStorage.getItem("loehrning-progress-v2") ?? "{}",
      ).courses?.["data-science"]?.lessons?.fund?.completed,
    ).toBe(true);
  });
});

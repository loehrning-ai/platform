import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DS_CHAPTERS } from "@/lib/data-science/types";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/components/course/lesson-shell", () => ({
  LessonShell: ({
    sidebar,
    children,
  }: {
    readonly sidebar: ReactNode;
    readonly children: ReactNode;
  }) => (
    <div>
      {sidebar}
      <main>{children}</main>
    </div>
  ),
}));

vi.mock("@/components/data-science/ds-chapter-sidebar", () => ({
  DsChapterSidebar: () => <nav aria-label="chapters" />,
}));

import { DataScienceLandingReaderShell } from "./landing-reader-shell";

describe("DataScienceLandingReaderShell", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("starts with the authored overview instead of a redundant project preview", () => {
    const { container } = render(
      <DataScienceLandingReaderShell locale="en" chapters={DS_CHAPTERS}>
        <p>Overview content</p>
      </DataScienceLandingReaderShell>,
    );

    expect(container.querySelector("[data-course-project]")).toBeNull();
    expect(screen.getByText("Overview content")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Open project preview" }),
    ).not.toBeInTheDocument();
  });

  it("retains the landing reader's next-chapter shortcut", () => {
    render(
      <DataScienceLandingReaderShell locale="de" chapters={DS_CHAPTERS}>
        <p>Überblick</p>
      </DataScienceLandingReaderShell>,
    );

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(push).toHaveBeenCalledWith("/kurse/open-source/data-science/fund");
  });

  it("does not hijack arrow keys from authored interactive controls", () => {
    render(
      <DataScienceLandingReaderShell locale="en" chapters={DS_CHAPTERS}>
        <button type="button">Overview control</button>
      </DataScienceLandingReaderShell>,
    );
    const button = screen.getByRole("button", { name: "Overview control" });

    fireEvent.keyDown(button, { key: "ArrowRight" });

    expect(push).not.toHaveBeenCalled();
  });
});

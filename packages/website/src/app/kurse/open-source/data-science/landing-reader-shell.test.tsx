import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DS_CHAPTERS } from "@/lib/data-science/types";

const push = vi.fn();
const projectStudio = vi.fn(
  (props: {
    readonly courseSlug: string;
    readonly lessonId: string;
    readonly locale: string;
    readonly lessonContext: { readonly title: string };
  }) => (
    <div data-testid="project-studio">
      {props.courseSlug}:{props.lessonId}:{props.locale}:
      {props.lessonContext.title}
    </div>
  ),
);

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

vi.mock("@/components/course-projects/course-project-studio", () => ({
  CourseProjectStudio: projectStudio,
}));

import { DataScienceLandingReaderShell } from "./landing-reader-shell";

describe("DataScienceLandingReaderShell", () => {
  beforeEach(() => {
    push.mockClear();
    projectStudio.mockClear();
  });

  it("keeps the stateful studio out of the initial render and loads it on intent", async () => {
    const { container } = render(
      <DataScienceLandingReaderShell locale="en" chapters={DS_CHAPTERS}>
        <p>Overview content</p>
      </DataScienceLandingReaderShell>,
    );

    expect(projectStudio).not.toHaveBeenCalled();
    expect(container.querySelector("[data-course-project]")).toBeNull();
    expect(screen.getByText("Overview content")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Open project preview" }),
    );

    expect(await screen.findByTestId("project-studio")).toHaveTextContent(
      "data-science:home:en:Overview",
    );
    expect(projectStudio).toHaveBeenCalledTimes(1);
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

  it("does not hijack arrow keys from the project activation control", () => {
    render(
      <DataScienceLandingReaderShell locale="en" chapters={DS_CHAPTERS}>
        <p>Overview</p>
      </DataScienceLandingReaderShell>,
    );
    const button = screen.getByRole("button", { name: "Open project preview" });

    fireEvent.keyDown(button, { key: "ArrowRight" });

    expect(push).not.toHaveBeenCalled();
  });

  it("labels the noncanonical landing as a preview without claiming mission credit", () => {
    render(
      <DataScienceLandingReaderShell locale="en" chapters={DS_CHAPTERS}>
        <p>Overview</p>
      </DataScienceLandingReaderShell>,
    );

    expect(screen.getByText("Optional project preview")).toBeInTheDocument();
    expect(
      screen.getByText(/does not record lesson completion/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/mission/i)).not.toBeInTheDocument();
  });
});

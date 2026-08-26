import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/progress", () => ({
  subscribe: (listener: () => void) => {
    listener();
    return () => undefined;
  },
  getEvidenceBackedCompletedLessonIds: () => new Set(["lesson-1"]),
  getCompletedLessonIds: () => new Set(["lesson-1"]),
  getCompletedLessonsCount: () => 1,
  getOverallProgress: () => 50,
}));

import {
  TechnicalCourseProgressBar,
  TechnicalCourseTrackProgress,
} from "./technical-course-progress";

describe("TechnicalCourseProgress", () => {
  it("renders hydration-safe course progress with an accessible value", () => {
    render(
      <TechnicalCourseProgressBar
        courseSlug="ai-native-operator"
        totalLessons={2}
        label="Lesson progress"
        unitLabel="lessons"
      />,
    );

    expect(screen.getByText("1 / 2 lessons")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Lesson progress" }),
    ).toHaveAttribute("aria-valuenow", "50");
  });

  it("reports per-track and overall progress without card chrome", () => {
    const { container } = render(
      <TechnicalCourseTrackProgress
        courseSlug="data-infrastructure"
        tracks={[
          { id: "track-1", label: "Track 01", title: "Boundaries" },
          { id: "track-2", label: "Track 02", title: "Operations" },
        ]}
        lessons={[
          { id: "lesson-1", trackId: "track-1" },
          { id: "lesson-2", trackId: "track-1" },
          { id: "lesson-3", trackId: "track-2" },
        ]}
        label="Course progress"
        overallLabel="Overall progress"
        unitLabel="lessons"
      />,
    );

    expect(
      screen.getByRole("progressbar", {
        name: "Boundaries: 1 / 2 lessons",
      }),
    ).toHaveAttribute("aria-valuenow", "50");
    expect(
      screen.getByRole("progressbar", {
        name: "Operations: 0 / 1 lessons",
      }),
    ).toHaveAttribute("aria-valuenow", "0");
    expect(
      screen.getByRole("progressbar", {
        name: "Overall progress: 1 / 3 lessons",
      }),
    ).toHaveAttribute("aria-valuenow", "33");
    expect(container.querySelectorAll(".bg-track")).toHaveLength(3);
    expect(container.innerHTML).not.toMatch(/shadow|rounded/);
  });
});

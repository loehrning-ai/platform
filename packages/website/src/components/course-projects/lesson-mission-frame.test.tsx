import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { bindLessonMission } from "@/lib/course-projects/lesson-mission-binding";
import { LessonMissionFrame } from "./lesson-mission-frame";

describe("LessonMissionFrame", () => {
  it("renders the authored lesson focus and stable mission identity", () => {
    const { frame } = bindLessonMission("codex", "L01", "en", {
      title: "A mental model for delegated work",
      objective: "Separate intent, execution, and verification.",
      keyConcepts: ["Bounded autonomy", "Verification"],
    });
    const { container } = render(
      <LessonMissionFrame frame={frame} locale="en" />,
    );

    expect(
      screen.getByRole("heading", {
        name: "A mental model for delegated work",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Separate intent, execution, and verification."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Key concepts" }),
    ).toHaveTextContent("Bounded autonomy");
    expect(container.firstElementChild).toHaveAttribute(
      "data-lesson-mission-id",
      "codex:L01:v1",
    );
    expect(container.firstElementChild).toHaveAttribute(
      "data-lesson-skill-id",
      "codex:ground",
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("omits an empty concept list without inventing lesson content", () => {
    const { frame } = bindLessonMission("data-science", "fund", "de", {
      title: "Grundlagen",
      objective: "Stichprobe und Grundgesamtheit unterscheiden.",
    });
    render(<LessonMissionFrame frame={frame} locale="de" />);

    expect(
      screen.queryByRole("list", { name: "Schlüsselkonzepte" }),
    ).toBeNull();
    expect(screen.getByText(/synthetischen Fall/)).toBeInTheDocument();
  });
});

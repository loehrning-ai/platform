import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

/**
 * lesson-sidebar.test.tsx (regression coverage)
 *
 * Drives the real <LessonSidebar>. It renders one navigation button per lesson
 * and computes three things per row from its props: the active row (aria-current
 * = "location"), the completed suffix on the accessible label ("(abgeschlossen)"
 * when the id is in completedLessonIds), and the onSelectLesson(id) callback on
 * click. We also lock the WCAG 2.5.3 invariant the source comments call out: the
 * aria-label must contain the visible lesson title as a substring. No mocks are
 * needed - the component uses only lucide SVGs + CSS transitions.
 */

import { LessonSidebar } from "./lesson-sidebar";
import type { Lesson } from "@/lib/course/types";

function lesson(
  over: Partial<Lesson> & Pick<Lesson, "id" | "number" | "title">,
): Lesson {
  return {
    subtitle: "",
    durationMinutes: 10,
    sections: [],
    quiz: [],
    keyConcepts: [],
    blockId: "block_1",
    ...over,
  };
}

const lessons: readonly Lesson[] = [
  lesson({ id: "l1", number: 1, title: "Einführung", durationMinutes: 8 }),
  lesson({ id: "l2", number: 2, title: "Datenschutz", durationMinutes: 12 }),
  lesson({ id: "l3", number: 3, title: "Abschluss", durationMinutes: 5 }),
];

afterEach(cleanup);

describe("<LessonSidebar>", () => {
  it("renders a labelled nav with one button per lesson and each title", () => {
    render(
      <LessonSidebar
        lessons={lessons}
        activeLessonId="l1"
        completedLessonIds={new Set()}
        onSelectLesson={() => {}}
      />,
    );

    expect(
      screen.getByRole("navigation", { name: "Lektionsnavigation" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Lektionen")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.getByText("Einführung")).toBeInTheDocument();
    expect(screen.getByText("Datenschutz")).toBeInTheDocument();
    expect(screen.getByText("Abschluss")).toBeInTheDocument();
  });

  it("marks only the active lesson with aria-current=location", () => {
    render(
      <LessonSidebar
        lessons={lessons}
        activeLessonId="l2"
        completedLessonIds={new Set()}
        onSelectLesson={() => {}}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Lektion 2: Datenschutz" }),
    ).toHaveAttribute("aria-current", "location");
    expect(
      screen.getByRole("button", { name: "Lektion 1: Einführung" }),
    ).not.toHaveAttribute("aria-current");
    expect(
      screen.getByRole("button", { name: "Lektion 3: Abschluss" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("appends '(abgeschlossen)' to the label of completed lessons only", () => {
    render(
      <LessonSidebar
        lessons={lessons}
        activeLessonId="l1"
        completedLessonIds={new Set(["l1", "l3"])}
        onSelectLesson={() => {}}
      />,
    );

    // Completed rows carry the suffix in their accessible name.
    expect(
      screen.getByRole("button", { name: "Lektion 1: Einführung (abgeschlossen)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Lektion 3: Abschluss (abgeschlossen)" }),
    ).toBeInTheDocument();
    // The uncompleted row keeps the plain label (no suffix).
    expect(
      screen.getByRole("button", { name: "Lektion 2: Datenschutz" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Lektion 2: Datenschutz (abgeschlossen)",
      }),
    ).toBeNull();
  });

  it("calls onSelectLesson with the clicked lesson id", () => {
    const onSelect = vi.fn();
    render(
      <LessonSidebar
        lessons={lessons}
        activeLessonId="l1"
        completedLessonIds={new Set()}
        onSelectLesson={onSelect}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Lektion 3: Abschluss" }),
    );
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("l3");
  });

  it("keeps the visible title inside the aria-label (WCAG 2.5.3 voice-input)", () => {
    render(
      <LessonSidebar
        lessons={lessons}
        activeLessonId="l1"
        completedLessonIds={new Set(["l2"])}
        onSelectLesson={() => {}}
      />,
    );

    for (const l of lessons) {
      const label = screen
        .getByText(l.title)
        .closest("button")
        ?.getAttribute("aria-label");
      expect(label).toContain(l.title);
      expect(label).toContain(`Lektion ${l.number}`);
    }
  });

  it("renders each lesson duration in minutes", () => {
    render(
      <LessonSidebar
        lessons={lessons}
        activeLessonId="l1"
        completedLessonIds={new Set()}
        onSelectLesson={() => {}}
      />,
    );

    expect(screen.getByText("8 Min")).toBeInTheDocument();
    expect(screen.getByText("12 Min")).toBeInTheDocument();
    expect(screen.getByText("5 Min")).toBeInTheDocument();
  });
});

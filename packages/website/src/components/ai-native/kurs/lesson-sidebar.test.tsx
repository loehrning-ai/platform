import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import {
  __resetCacheForTests,
  completeCheckpoint,
  markLessonCompleted,
  markSectionRead,
  saveLessonQuizScore,
} from "@/lib/progress";
import { lessonCompletionEvidenceCheckpointId } from "@/lib/courses/completion";
import { AiNativeLessonSidebar } from "./lesson-sidebar";

const ITEMS = [
  {
    moduleId: "modul_1" as const,
    moduleNumber: 1,
    moduleTitle: "Denkweise",
    lessonId: "modul_1_lesson_1",
    lessonNumber: 1,
    title: "Vom Werkzeug zum System",
  },
  {
    moduleId: "modul_2" as const,
    moduleNumber: 2,
    moduleTitle: "Arbeitsfluss",
    lessonId: "modul_2_lesson_1",
    lessonNumber: 1,
    title: "Kontext bauen",
  },
] as const;

beforeEach(() => {
  window.localStorage.clear();
  __resetCacheForTests();
});

afterEach(cleanup);

describe("AiNativeLessonSidebar", () => {
  it("renders complete module navigation with localized links", () => {
    render(<AiNativeLessonSidebar lessons={ITEMS} locale="en" />);

    expect(screen.getByText(/Module 1/)).toBeInTheDocument();
    expect(screen.getByText(/Module 2/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Vom Werkzeug zum System/ }),
    ).toHaveAttribute("href", "/en/ai-native/kurs/modul_1/modul_1_lesson_1");
  });

  it("keeps a legacy completion bit open until current evidence exists", async () => {
    markLessonCompleted("ai-native", "modul_1_lesson_1");
    render(<AiNativeLessonSidebar lessons={ITEMS} locale="de" />);

    const link = await screen.findByRole("link", {
      name: /Vom Werkzeug zum System/,
    });
    expect(link.querySelector("svg")).toBeNull();

    act(() => {
      for (const sectionId of [
        "modul_1_lesson_1_section_1",
        "modul_1_lesson_1_section_2",
        "modul_1_lesson_1_section_3",
        "modul_1_lesson_1_section_4",
      ]) {
        markSectionRead("ai-native", "modul_1_lesson_1", sectionId);
      }
      saveLessonQuizScore("ai-native", "modul_1_lesson_1", 1, 1);
      completeCheckpoint(
        "modul_1_lesson_1",
        lessonCompletionEvidenceCheckpointId("ai-native"),
      );
    });

    await waitFor(() => expect(link.querySelector("svg")).not.toBeNull());
  });

  it("supports unique heading namespaces for simultaneous desktop and mobile copies", () => {
    const { container } = render(
      <>
        <AiNativeLessonSidebar
          lessons={ITEMS}
          locale="en"
          idPrefix="desktop-nav"
        />
        <AiNativeLessonSidebar
          lessons={ITEMS}
          locale="en"
          idPrefix="mobile-nav"
        />
      </>,
    );

    const ids = Array.from(container.querySelectorAll<HTMLElement>("[id]")).map(
      (element) => element.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(container.querySelector("#desktop-nav-modul_1")).not.toBeNull();
    expect(container.querySelector("#mobile-nav-modul_1")).not.toBeNull();
  });
});

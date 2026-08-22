import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { __resetCacheForTests, markLessonCompleted } from "@/lib/progress";
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
    ).toHaveAttribute(
      "href",
      "/en/ai-native/kurs/modul_1/modul_1_lesson_1",
    );
  });

  it("reflects unified completion state", async () => {
    markLessonCompleted("ai-native", "modul_1_lesson_1");
    render(<AiNativeLessonSidebar lessons={ITEMS} locale="de" />);

    expect(
      await screen.findByRole("link", { name: /Vom Werkzeug zum System/ }),
    ).toBeInTheDocument();
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

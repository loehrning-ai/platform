import { afterEach, describe, expect, it, vi } from "vitest";
import { getCourseAccess } from "@/lib/courses/access";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import type { UnifiedCourseSlice } from "@/lib/progress/types";

vi.mock("@/lib/progress/store", () => ({
  getCompletedLessonsCount: () => 0,
  isCertificateEligible: () => false,
  getCourseSlice: () =>
    ({
      lessons: {},
      workshopQuiz: { completedAt: null },
      capstoneSubmitted: false,
      startedAt: "2026-09-06T09:00:00.000Z",
      lastActivity: "2026-09-06T09:00:00.000Z",
    }) as unknown as UnifiedCourseSlice,
  subscribe: (listener: () => void) => {
    listener();
    return () => {};
  },
}));

const { ContinueSlot } = await import("./continue-slot");
const { homeContinueCourses } = await import("./continue-courses");
const COURSES = homeContinueCourses("de", getCourseAccess(true));
const ENGLISH_COURSES = homeContinueCourses("en", getCourseAccess(true));

afterEach(cleanup);

describe("ContinueSlot", () => {
  it("renders an empty, height-reserved seat in server markup", () => {
    const html = renderToString(<ContinueSlot courses={COURSES} />);

    expect(html).toContain('data-home-continue-slot="true"');
    // The seat is reserved before the browser can know which course to name,
    // so the geometry below it is final at first paint.
    expect(html).toContain('class="h-[4.75rem]"');
    // Nothing about the learner is guessed on the server.
    expect(html).not.toContain("data-home-continue-card");
    expect(html).not.toContain("Weiter bei");
    expect(html).not.toContain("Erster Schritt");
  });

  it("keeps the seat out of the wide layout entirely", () => {
    const html = renderToString(<ContinueSlot courses={COURSES} />);
    expect(html).toMatch(/data-home-continue-slot[^>]*class="[^"]*lg:hidden/);
  });

  it("fills the seat in the browser without changing its height", async () => {
    const { container } = render(<ContinueSlot courses={COURSES} />);
    const slot = container.querySelector("[data-home-continue-slot]");
    const seat = slot?.firstElementChild;

    expect(seat).toHaveClass("h-[4.75rem]");
    await waitFor(() =>
      expect(screen.getByRole("link")).toHaveAttribute(
        "data-home-continue-card",
      ),
    );
    // Still exactly one fixed-height child: the card lives inside the seat.
    expect(slot?.children).toHaveLength(1);
    expect(slot?.firstElementChild).toBe(seat);
    expect(seat).toHaveClass("h-[4.75rem]");
  });

  it("passes the locale through to the card", async () => {
    render(<ContinueSlot locale="en" courses={ENGLISH_COURSES} />);
    await waitFor(() =>
      expect(screen.getByRole("link")).toHaveTextContent("First step"),
    );
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { CourseSlug } from "@/lib/course/types";
import type { UnifiedCourseSlice } from "@/lib/progress/types";
import { homeContinueCourses } from "./continue-courses";

const FRESH = "2026-09-06T09:00:00.000Z";

const storeMock = vi.hoisted(() => ({
  completed: new Map<string, number>(),
  certified: new Set<string>(),
  slices: new Map<string, { lessons: string[]; lastActivity: string }>(),
}));

function slice(slug: string): UnifiedCourseSlice {
  const seeded = storeMock.slices.get(slug);
  return {
    lessons: Object.fromEntries(
      (seeded?.lessons ?? []).map((id) => [id, { completed: true }]),
    ),
    workshopQuiz: { completedAt: null },
    capstoneSubmitted: false,
    startedAt: FRESH,
    lastActivity: seeded?.lastActivity ?? FRESH,
  } as unknown as UnifiedCourseSlice;
}

vi.mock("@/lib/progress/store", () => ({
  getCompletedLessonsCount: (slug: string) => storeMock.completed.get(slug) ?? 0,
  isCertificateEligible: (slug: string) => storeMock.certified.has(slug),
  getCourseSlice: (slug: string) => slice(slug),
  subscribe: (listener: () => void) => {
    listener();
    return () => {};
  },
}));

const { ContinueCard, pickContinueTarget } = await import("./continue-card");

function progress(
  slug: string,
  completed: number,
  started: boolean,
  certified: boolean,
  lastActivity = FRESH,
) {
  return { slug, completed, started, certified, lastActivity };
}

/** Mark a course started with N completed lessons at a given timestamp. */
function seed(slug: string, completed: number, lastActivity: string): void {
  storeMock.completed.set(slug, completed);
  storeMock.slices.set(slug, {
    lessons: Array.from({ length: completed }, (_, i) => `lesson_${i}`),
    lastActivity,
  });
}

afterEach(() => {
  cleanup();
  storeMock.completed.clear();
  storeMock.certified.clear();
  storeMock.slices.clear();
});

describe("pickContinueTarget", () => {
  it("returns nothing when there is no catalog to choose from", () => {
    expect(pickContinueTarget([])).toBeNull();
  });

  it("resumes the open course touched most recently, not the longest one", () => {
    expect(
      pickContinueTarget([
        progress("a", 9, true, false, "2026-08-01T00:00:00.000Z"),
        progress("b", 2, true, false, "2026-09-01T00:00:00.000Z"),
        progress("c", 0, false, false),
      ]),
    ).toEqual({ slug: "b", completed: 2, mode: "resume" });
  });

  it("breaks a tie by catalog order, so the target never flickers", () => {
    expect(
      pickContinueTarget([
        progress("a", 3, true, false, FRESH),
        progress("b", 4, true, false, FRESH),
      ]),
    ).toEqual({ slug: "a", completed: 3, mode: "resume" });
  });

  it("treats an unparseable stamp as oldest instead of throwing", () => {
    expect(
      pickContinueTarget([
        progress("a", 3, true, false, "not-a-date"),
        progress("b", 1, true, false, "2026-01-01T00:00:00.000Z"),
      ]),
    ).toEqual({ slug: "b", completed: 1, mode: "resume" });
  });

  it("skips a finished course and resumes the next open one", () => {
    expect(
      pickContinueTarget([
        progress("a", 18, true, true, "2026-09-05T00:00:00.000Z"),
        progress("b", 1, true, false, "2026-08-01T00:00:00.000Z"),
      ]),
    ).toEqual({ slug: "b", completed: 1, mode: "resume" });
  });

  it("offers the first unstarted course when nothing is in progress", () => {
    expect(
      pickContinueTarget([
        progress("a", 18, true, true),
        progress("b", 0, false, false),
        progress("c", 0, false, false),
      ]),
    ).toEqual({ slug: "b", completed: 0, mode: "start" });
  });

  it("offers the first course of all to a browser with no progress", () => {
    expect(
      pickContinueTarget([
        progress("a", 0, false, false),
        progress("b", 0, false, false),
      ]),
    ).toEqual({ slug: "a", completed: 0, mode: "start" });
  });

  it("falls back to the last course touched once every course is finished", () => {
    expect(
      pickContinueTarget([
        progress("a", 9, true, true, "2026-07-01T00:00:00.000Z"),
        progress("b", 24, true, true, "2026-09-04T00:00:00.000Z"),
      ]),
    ).toEqual({ slug: "b", completed: 24, mode: "resume" });
  });
});

describe("ContinueCard", () => {
  const courses = homeContinueCourses("de");
  const englishCourses = homeContinueCourses("en");

  it("offers the first step, with its duration, to a browser with no progress", () => {
    render(<ContinueCard courses={courses} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("data-home-continue-card", "start");
    expect(link).toHaveAttribute("href", "/ki-fuehrerschein/kurs");
    expect(link).toHaveTextContent("Erster Schritt");
    expect(link).toHaveTextContent("KI-Führerschein");
    expect(link).toHaveTextContent("ca. 1 Std. 40 Min.");
  });

  it("resumes the last course touched and states its lesson count", () => {
    seed("ki-fuehrerschein", 2, "2026-08-01T00:00:00.000Z");
    seed("eu-ai-act-kurs", 5, "2026-09-01T00:00:00.000Z");

    render(<ContinueCard courses={courses} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("data-home-continue-card", "resume");
    expect(link).toHaveAttribute("href", "/eu-ai-act-kurs/kurs");
    expect(link).toHaveTextContent("Weiter bei");
    expect(link).toHaveTextContent("EU AI Act Kurs");
    // The course carries 24 canonical lessons; the card states counted
    // progress, never a percentage it cannot evidence.
    expect(link).toHaveTextContent("5 von 24 Lektionen");
  });

  it("keeps the resume link inside the requested locale", () => {
    seed("ki-und-gesellschaft", 3, "2026-09-02T00:00:00.000Z");

    render(<ContinueCard locale="en" courses={englishCourses} />);

    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("Continue with");
    expect(link).toHaveTextContent("AI and Society");
    expect(link).toHaveTextContent("3 of 9 lessons");
    expect(link).toHaveAttribute("href", "/en/ki-und-gesellschaft/kurs");
  });

  it("prints no German copy on the English surface", () => {
    const { container } = render(
      <ContinueCard locale="en" courses={englishCourses} />,
    );
    expect(container.textContent).not.toMatch(
      /\b(?:Weiter|Schritt|Lektionen|Std|Führerschein)\b/,
    );
  });

  it("renders nothing when the catalog it is handed is empty", () => {
    const { container } = render(<ContinueCard courses={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("fills its reserved seat exactly, so resolving progress shifts nothing", () => {
    render(<ContinueCard courses={courses} />);
    // The seat is a fixed 4.75rem box in the server HTML (continue-slot.tsx).
    // The card must fill it and never set a height of its own.
    const link = screen.getByRole("link");
    expect(link.className).toContain("h-full");
    expect(link.className).not.toMatch(/\bmin-h-\[/);
    expect(link.className).toContain("overflow-hidden");
  });
});

describe("homeContinueCourses", () => {
  it("carries every catalog course with locale-prefixed reader entries", () => {
    const list = homeContinueCourses("en");

    expect(list.length).toBeGreaterThanOrEqual(4);
    for (const course of list) {
      expect(course.title.length).toBeGreaterThan(0);
      expect(course.totalLessons).toBeGreaterThan(0);
      expect(course.continueHref.startsWith("/en/")).toBe(true);
      expect(course.startHref.startsWith("/en/")).toBe(true);
    }
  });

  it("localizes titles and durations", () => {
    const de = homeContinueCourses("de");
    const en = homeContinueCourses("en");
    const slug = "ki-fuehrerschein" as CourseSlug;

    expect(de.find((c) => c.slug === slug)?.title).toBe("KI-Führerschein");
    expect(en.find((c) => c.slug === slug)?.title).toBe("AI Fundamentals");
    expect(en.find((c) => c.slug === slug)?.duration).toBe("about 1 hr 40 min");
  });
});

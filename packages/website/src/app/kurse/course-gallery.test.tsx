import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { courseFacts } from "@/lib/courses/tracks";

const SPINE_COURSES = COURSE_CATALOG.filter(
  (course) => courseFacts(course.slug).group === "spine",
);
const DEEPER_COURSES = COURSE_CATALOG.filter(
  (course) => courseFacts(course.slug).group === "deeper",
);

// Mock the unified store + course-progress facade so the gallery's
// client-side progress dots are deterministic.
const storeMock = vi.hoisted(() => ({
  getCompletedLessonsCount: vi.fn<(slug: string) => number>(() => 0),
  isCertificateEligible: vi.fn<(slug: string) => boolean>(() => false),
  getXp: vi.fn(() => 0),
  getStreak: vi.fn(() => ({ days: 0, last: null as string | null })),
}));

vi.mock("@/lib/progress/store", () => storeMock);
vi.mock("@/lib/course/progress", () => ({
  serializeProgress: vi.fn(() => "ENCODED"),
}));

import { CourseGallery } from "./course-gallery";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  storeMock.getCompletedLessonsCount.mockReturnValue(0);
  storeMock.isCertificateEligible.mockReturnValue(false);
  storeMock.getXp.mockReturnValue(0);
  storeMock.getStreak.mockReturnValue({ days: 0, last: null });
});

describe("CourseGallery (learner-first: path + deeper shelf)", () => {
  it("renders four spine courses in Der Lernpfad and six native deeper courses in Tiefer gehen", () => {
    render(<CourseGallery />);
    const spineSection = screen.getByText("Der Lernpfad").closest("section");
    const deeperSection = screen.getByText("Tiefer gehen").closest("section");
    expect(spineSection).not.toBeNull();
    expect(deeperSection).not.toBeNull();

    expect(SPINE_COURSES).toHaveLength(4);
    expect(DEEPER_COURSES).toHaveLength(6);

    for (const course of SPINE_COURSES) {
      expect(within(spineSection as HTMLElement).getByText(course.title)).toBeInTheDocument();
      expect(
        within(spineSection as HTMLElement).getByTestId(`progress-dots-${course.slug}`),
      ).toBeInTheDocument();
    }
    for (const course of DEEPER_COURSES) {
      expect(within(deeperSection as HTMLElement).getByText(course.title)).toBeInTheDocument();
      expect(
        within(deeperSection as HTMLElement).getByTestId(`progress-dots-${course.slug}`),
      ).toBeInTheDocument();
    }
  });

  it("renders one card per native course with progress dots", () => {
    render(<CourseGallery />);
    for (const course of COURSE_CATALOG) {
      expect(screen.getByText(course.title)).toBeInTheDocument();
      expect(screen.getByTestId(`progress-dots-${course.slug}`)).toBeInTheDocument();
    }
  });

  it("labels the path and the deeper shelf so their difference is legible", () => {
    render(<CourseGallery />);
    expect(screen.getByText("Der Lernpfad")).toBeInTheDocument();
    expect(screen.getByText("Tiefer gehen")).toBeInTheDocument();
    expect(screen.getByText("Native technische Kurse")).toBeInTheDocument();
  });

  it("renders the English deeper courses as native courses with progress and internal actions", () => {
    render(<CourseGallery />);
    const deeperSection = screen.getByText("Tiefer gehen").closest("section");
    expect(deeperSection).not.toBeNull();

    for (const course of DEEPER_COURSES) {
      const card = within(deeperSection as HTMLElement).getByText(course.title).closest("li");
      expect(card).not.toBeNull();
      const scoped = within(card as HTMLElement);
      expect(scoped.getByText("Englisch")).toBeInTheDocument();
      expect(scoped.getByText("mit Certificate")).toBeInTheDocument();
      expect(scoped.getByTestId(`progress-dots-${course.slug}`)).toBeInTheDocument();
      expect(scoped.getByRole("link", { name: /Kurs starten/ })).toHaveAttribute(
        "href",
        course.startHref,
      );
      expect(scoped.getByRole("link", { name: /Details/ })).toHaveAttribute(
        "href",
        course.href,
      );
    }
    expect(storeMock.getCompletedLessonsCount.mock.calls.map(([slug]) => slug)).toEqual(
      COURSE_CATALOG.map((course) => course.slug),
    );
    expect(storeMock.isCertificateEligible.mock.calls.map(([slug]) => slug)).toEqual(
      COURSE_CATALOG.map((course) => course.slug),
    );
  }, 10_000);

  it("shows 0% and no gamification banner before any progress exists", () => {
    render(<CourseGallery />);
    expect(
      screen.getByTestId("progress-pct-ki-fuehrerschein").textContent,
    ).toBe("0%");
    expect(screen.queryByTestId("kurse-gamification")).toBeNull();
  });

  it("fills progress dots proportionally and surfaces XP + streak once started", () => {
    storeMock.getCompletedLessonsCount.mockImplementation((slug: string) =>
      slug === "ki-fuehrerschein" ? 18 : 0,
    );
    storeMock.getXp.mockReturnValue(120);
    storeMock.getStreak.mockReturnValue({ days: 3, last: "2026-06-03" });

    render(<CourseGallery />);

    // Completed course -> 100% and all 12 dots filled.
    expect(
      screen.getByTestId("progress-pct-ki-fuehrerschein").textContent,
    ).toBe("100%");
    const dots = within(
      screen.getByTestId("progress-dots-ki-fuehrerschein"),
    ).getAllByText("", { selector: "span" });
    expect(dots.filter((d) => d.className.includes("bg-brand-orange"))).toHaveLength(
      12,
    );

    const banner = screen.getByTestId("kurse-gamification");
    expect(banner.textContent).toMatch(/120 XP/);
    expect(banner.textContent).toMatch(/3 Tage Serie/);
  });

  it("marks a certified course and offers a share button only mid-course", () => {
    storeMock.getCompletedLessonsCount.mockImplementation((slug: string) =>
      slug === "ki-fuehrerschein" ? 19 : slug === "eu-ai-act-kurs" ? 5 : 0,
    );
    storeMock.isCertificateEligible.mockImplementation(
      (slug: string) => slug === "ki-fuehrerschein",
    );

    render(<CourseGallery />);

    // Certified badge on the finished course.
    expect(screen.getByTestId("certified-ki-fuehrerschein")).toBeInTheDocument();
    // In-progress (started, not certified) course offers the share action.
    expect(screen.getByText("Fortschritt teilen")).toBeInTheDocument();
  });
});

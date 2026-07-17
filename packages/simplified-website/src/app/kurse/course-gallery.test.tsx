import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import {
  COURSE_CATALOG,
  IMPORTED_COURSE_CATALOG,
} from "@/lib/courses/catalog";
import { BRAINSTER_COURSE_CATALOG } from "@/lib/courses/tracks";

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

describe("CourseGallery (three-track course architecture)", () => {
  it("renders one card per native course with a free price + progress dots", () => {
    render(<CourseGallery />);
    expect(screen.getByText("KI-Führerschein")).toBeInTheDocument();
    expect(screen.getByText("KI und Gesellschaft")).toBeInTheDocument();
    expect(screen.getByText("EU AI Act Kurs")).toBeInTheDocument();
    expect(screen.getByText("AI-Native Arbeitskurs")).toBeInTheDocument();

    expect(screen.getByTestId("progress-dots-ki-fuehrerschein")).toBeInTheDocument();
    expect(screen.getByTestId("progress-dots-ki-und-gesellschaft")).toBeInTheDocument();
    expect(screen.getByTestId("progress-dots-eu-ai-act-kurs")).toBeInTheDocument();
    expect(screen.getByTestId("progress-dots-ai-native")).toBeInTheDocument();
  });

  it("labels all three tracks so their difference is legible", () => {
    render(<CourseGallery />);
    expect(screen.getByText("Zertifikatskurse")).toBeInTheDocument();
    expect(screen.getByText("GitHub-Labs")).toBeInTheDocument();
    expect(screen.getByText("Angewandte Kurse")).toBeInTheDocument();
  });

  it("renders GitHub-Labs with source identity and no fake progress widgets", () => {
    render(<CourseGallery />);
    for (const course of IMPORTED_COURSE_CATALOG) {
      const card = screen.getByText(course.title).closest("li");
      expect(card).not.toBeNull();
      const scoped = within(card as HTMLElement);
      expect(scoped.getByText(course.title)).toBeInTheDocument();
      expect(card).toHaveTextContent(course.lessonCountLabel);
      for (const fact of course.sourceFacts.slice(0, 4)) {
        expect(scoped.getByText(fact)).toBeInTheDocument();
      }

      // GitHub identity: stroke-only icon link, badge row, commit pin.
      expect(scoped.getByRole("link", { name: "Quellcode auf GitHub" })).toHaveAttribute(
        "href",
        course.sourceHref,
      );
      expect(scoped.getByText("GitHub · MIT · Englisch · extern")).toBeInTheDocument();
      expect(
        scoped.getByRole("link", { name: new RegExp(`Quell-Commit ${course.sourceCommit.slice(0, 7)}`) }),
      ).toHaveAttribute("href", course.sourceCommitHref);

      // Primary CTA opens the external live course; Details keeps the native detail route.
      expect(scoped.getByRole("link", { name: /Kurs öffnen/ })).toHaveAttribute(
        "href",
        course.launchHref,
      );
      expect(scoped.getByRole("link", { name: /Details/ })).toHaveAttribute(
        "href",
        course.href,
      );

      expect(scoped.getByAltText(course.imageAlt)).toBeInTheDocument();
      expect(screen.queryByTestId(`progress-dots-${course.slug}`)).toBeNull();
    }
    expect(screen.getByText("GitHub-Labs")).toBeInTheDocument();
    expect(storeMock.getCompletedLessonsCount.mock.calls.map(([slug]) => slug)).toEqual(
      COURSE_CATALOG.map((course) => course.slug),
    );
    expect(storeMock.isCertificateEligible.mock.calls.map(([slug]) => slug)).toEqual(
      COURSE_CATALOG.map((course) => course.slug),
    );
  }, 10_000);

  it("renders applied (Brainster) courses: live links through, prep is not clickable", () => {
    render(<CourseGallery />);
    const live = BRAINSTER_COURSE_CATALOG.find((c) => c.status === "live")!;
    const prep = BRAINSTER_COURSE_CATALOG.find((c) => c.status === "prep")!;

    const liveCard = screen.getByText(live.title).closest("li");
    expect(within(liveCard as HTMLElement).getByRole("link", { name: /Kurs öffnen/ })).toHaveAttribute(
      "href",
      live.href,
    );

    const prepCard = screen.getByText(prep.title).closest("li");
    const scopedPrep = within(prepCard as HTMLElement);
    expect(scopedPrep.getByTestId(`prep-${prep.slug}`)).toBeInTheDocument();
    expect(scopedPrep.queryByRole("link")).toBeNull();
  });

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

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { CatalogCourse } from "@/lib/courses/catalog";

/**
 * plan 007 stage 10: proves the gallery's card treatment is driven purely by
 * nativeStatus, not by which array/shape a course object came from. A course
 * plan flip never happens mid-test in real code, so this drives it with a
 * mocked fixture: an object carrying BOTH the CatalogCourse fields the spine
 * section needs to render AND some ImportedCourse-only provenance fields
 * (launchHref, sourceHref) it would plausibly retain from before the flip —
 * proving the renderer only cares about nativeStatus, ignoring the rest.
 */

const FLIPPED_SLUG = "flip-fixture-course";

const { FLIPPED_COURSE } = vi.hoisted(() => ({
  FLIPPED_COURSE: {
    // Cast: this slug is a test-only fixture, deliberately not a real
    // CourseSlug, to prove the renderer never assumes a specific slug.
    slug: "flip-fixture-course" as unknown as CatalogCourse["slug"],
    step: 5,
    title: "Flipped Fixture Course",
    eyebrow: "Schritt 05 · Fixture",
    tagline: "A course that just flipped from imported to native.",
    description: "Exercises the nativeStatus-driven spine card treatment.",
    href: "/flip-fixture-course",
    startHref: "/flip-fixture-course/kurs",
    continueHref: "/flip-fixture-course/kurs",
    duration: "ca. 1 Std.",
    totalLessons: 10,
    unitLabel: "Kapitel",
    unitCount: 10,
    audience: "Testers",
    coverImage: "/course-covers/ki-fuehrerschein.png",
    coverImageAlt: "Fixture cover",
    nativeStatus: "live" as const,
    // Retained ImportedCourse-only provenance, harmless to the spine renderer.
    launchHref: "https://www.timloehr.me/interactive-courses/flip-fixture/",
    sourceHref:
      "https://github.com/Mavengence/interactive-courses/tree/abc/flip-fixture",
  } satisfies CatalogCourse & { readonly launchHref: string; readonly sourceHref: string },
}));

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

vi.mock("@/lib/courses/catalog", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/courses/catalog")>();
  return {
    ...actual,
    ALL_COURSE_CATALOG: [...actual.ALL_COURSE_CATALOG, FLIPPED_COURSE],
  };
});

import { CourseGallery } from "./course-gallery";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  storeMock.getCompletedLessonsCount.mockReturnValue(0);
  storeMock.isCertificateEligible.mockReturnValue(false);
});

describe("CourseGallery — nativeStatus-driven flip", () => {
  it("renders progress dots + certified badge for a nativeStatus: 'live' fixture, even though it also carries imported-only provenance fields", () => {
    storeMock.getCompletedLessonsCount.mockImplementation((slug) =>
      slug === FLIPPED_SLUG ? 10 : 0,
    );
    storeMock.isCertificateEligible.mockImplementation(
      (slug) => slug === FLIPPED_SLUG,
    );

    render(<CourseGallery />);

    expect(screen.getByText("Flipped Fixture Course")).toBeInTheDocument();
    expect(
      screen.getByTestId(`progress-dots-${FLIPPED_SLUG}`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`certified-${FLIPPED_SLUG}`),
    ).toBeInTheDocument();
  });
});

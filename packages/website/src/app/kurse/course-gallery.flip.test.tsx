import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { CatalogCourse } from "@/lib/courses/catalog";

/**
 * Proves that becoming native does not put a technical course into the German
 * spine. Catalog membership controls whether the native card renders;
 * COURSE_FACTS.group controls which learner-facing section owns it.
 */

const { FLIPPED_SLUG, FLIPPED_COURSE } = vi.hoisted(() => ({
  FLIPPED_SLUG: "flip-fixture-course",
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
  } satisfies CatalogCourse,
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
    COURSE_CATALOG: [...actual.COURSE_CATALOG, FLIPPED_COURSE],
  };
});

vi.mock("@/lib/courses/tracks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/courses/tracks")>();
  return {
    ...actual,
    courseFacts: (slug: string) =>
      slug === FLIPPED_SLUG
        ? {
            group: "deeper" as const,
            iconName: "TerminalSquare",
            language: "Englisch" as const,
            record: "certificate" as const,
            external: false,
            accent: "sand" as const,
            badge: "Certificate · Englisch",
          }
        : actual.courseFacts(slug),
    courseBadges: (slug: string) =>
      slug === FLIPPED_SLUG
        ? [
            { label: "Englisch", tone: "language" as const },
            { label: "mit Certificate", tone: "record" as const },
          ]
        : actual.courseBadges(slug),
  };
});

import { CourseGallery } from "./course-gallery";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  storeMock.getCompletedLessonsCount.mockReturnValue(0);
  storeMock.isCertificateEligible.mockReturnValue(false);
});

describe("CourseGallery — group-driven native-course placement", () => {
  it("keeps a newly native technical course in the deeper section with native progress behavior", () => {
    storeMock.getCompletedLessonsCount.mockImplementation((slug) =>
      slug === FLIPPED_SLUG ? 10 : 0,
    );
    storeMock.isCertificateEligible.mockImplementation(
      (slug) => slug === FLIPPED_SLUG,
    );

    render(<CourseGallery />);

    const spineSection = screen.getByText("Der Lernpfad").closest("section");
    const deeperSection = screen.getByText("Tiefer gehen").closest("section");
    expect(spineSection).not.toBeNull();
    expect(deeperSection).not.toBeNull();
    expect(
      within(deeperSection as HTMLElement).getByText("Flipped Fixture Course"),
    ).toBeInTheDocument();
    expect(
      within(spineSection as HTMLElement).queryByText("Flipped Fixture Course"),
    ).toBeNull();
    expect(
      screen.getByTestId(`progress-dots-${FLIPPED_SLUG}`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`certified-${FLIPPED_SLUG}`),
    ).toBeInTheDocument();
  });
});

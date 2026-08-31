import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { CatalogCourse } from "@/lib/courses/catalog";

const FLIPPED_SLUG = "flip-fixture-course";

const { FLIPPED_COURSE } = vi.hoisted(() => ({
  FLIPPED_COURSE: {
    slug: "flip-fixture-course" as unknown as CatalogCourse["slug"],
    step: 11,
    title: "Flipped Fixture Course",
    eyebrow: "Fixture",
    tagline: "A newly native course.",
    description: "Proves classification follows native status.",
    href: "/flip-fixture-course",
    startHref: "/flip-fixture-course/kurs",
    continueHref: "/flip-fixture-course/kurs",
    duration: "1 hr",
    durationMinutes: 60,
    level: "einstieg" as const,
    totalLessons: 10,
    unitLabel: "lessons",
    unitCount: 10,
    audience: "Testers",
    nativeStatus: "live" as const,
    sourceHref:
      "https://github.com/Mavengence/interactive-courses/tree/abc/flip-fixture",
  } satisfies CatalogCourse,
}));

const storeMock = vi.hoisted(() => ({
  getCompletedLessonsCount: vi.fn<(slug: string) => number>((slug) =>
    slug === "flip-fixture-course" ? 10 : 0,
  ),
  isCertificateEligible: vi.fn<(slug: string) => boolean>(
    (slug) => slug === "flip-fixture-course",
  ),
  subscribe: vi.fn((listener: (progress: undefined) => void) => {
    listener(undefined);
    return () => {};
  }),
}));

vi.mock("@/lib/progress/store", () => storeMock);
vi.mock("@/lib/courses/catalog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/courses/catalog")>();
  return {
    ...actual,
    ALL_COURSE_CATALOG: [...actual.ALL_COURSE_CATALOG, FLIPPED_COURSE],
  };
});
vi.mock("@/lib/courses/resume", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/courses/resume")>();
  return {
    ...actual,
    hasCourseStarted: vi.fn(() => true),
    resolveCourseResumeHref: vi.fn((_progress, slug) =>
      String(slug) === FLIPPED_SLUG
        ? "/flip-fixture-course/kurs"
        : actual.resolveCourseResumeHref(_progress, slug),
    ),
  };
});

import { LearningAtlas } from "./learning-atlas";

afterEach(cleanup);

describe("LearningAtlas native-status contract", () => {
  it("keeps a newly native course in the internal ledger with real progress", () => {
    const { container } = render(<LearningAtlas />);
    const row = container.querySelector<HTMLElement>(
      `[data-course-slug="${FLIPPED_SLUG}"]`,
    );

    expect(screen.getByText("Flipped Fixture Course")).toBeInTheDocument();
    expect(row).toHaveAttribute("data-course-status", "complete");
    expect(row).toHaveAttribute("data-in-path", "false");
    // Real progress still reaches the ledger: it resolves the status attribute
    // above. It is no longer rendered as a meter here, so the row states the
    // course's duration and the numeric readout lives on the account catalog.
    expect(screen.queryByTestId(`progress-dots-${FLIPPED_SLUG}`)).toBeNull();
    expect(row?.querySelector('[role="progressbar"]')).toBeNull();
    expect(row).toHaveTextContent("1 hr");
  });
});

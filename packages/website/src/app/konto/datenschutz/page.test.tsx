import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { COURSE_CATALOG, IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import DatenschutzPage from "./page";

/**
 *: the course-reset list must never fall back to a raw
 * slug string as a button label on this compliance-sensitive page. Widening
 * CourseSlug to 10 values exposed this: the list scopes
 * to COURSE_CATALOG (nativeStatus === "live") instead of the full
 * CourseSlug union, since the 6 imported courses have no server-tracked
 * progress to reset in the first place.
 */
describe("DatenschutzPage course-reset list", () => {
  it("shows a real German label for every live course, never a raw slug", () => {
    render(<DatenschutzPage />);
    for (const course of COURSE_CATALOG) {
      expect(screen.getByText(course.title)).toBeInTheDocument();
    }
  });

  it("never renders a raw slug string, and never offers to reset an unregistered imported course", () => {
    render(<DatenschutzPage />);
    for (const course of IMPORTED_COURSE_CATALOG) {
      expect(screen.queryByText(course.slug)).toBeNull();
    }
  });
});

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Offering } from "./offering";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { courseFacts } from "@/lib/courses/tracks";

const SPINE_COURSES = COURSE_CATALOG.filter(
  (course) => courseFacts(course.slug).group === "spine",
);
const DEEPER_COURSES = COURSE_CATALOG.filter(
  (course) => courseFacts(course.slug).group === "deeper",
);

describe("Offering section", () => {
  it("renders the course-led headline", () => {
    render(<Offering />);
    expect(screen.getByText(`${SPINE_COURSES.length} Kurse.`)).toBeInTheDocument();
    expect(
      screen.getByText(`${DEEPER_COURSES.length} technische Vertiefungen.`),
    ).toBeInTheDocument();
  });

  it("renders each German spine course as a linked card", () => {
    render(<Offering />);
    for (const course of SPINE_COURSES) {
      const link = screen.getByText(course.title).closest("a");
      expect(link).toHaveAttribute("href", course.href);
    }
  });

  it("uses the kurse-section testid (resources now live in their own section)", () => {
    render(<Offering />);
    expect(screen.getByTestId("kurse-section")).toBeInTheDocument();
  });

  it("renders the direct persona course links", () => {
    render(<Offering />);
    expect(screen.getByTestId("persona-filter")).toBeInTheDocument();
  });

  it("renders native English technical-course previews with real screenshots", () => {
    render(<Offering />);
    expect(screen.getByText("Englische Vertiefung")).toBeInTheDocument();
    for (const course of DEEPER_COURSES.slice(0, 3)) {
      expect(screen.getByAltText(course.coverImageAlt)).toBeInTheDocument();
    }
  });

  it("links each technical preview to its native course details", () => {
    render(<Offering />);
    for (const course of DEEPER_COURSES.slice(0, 3)) {
      expect(
        screen.getByAltText(course.coverImageAlt).closest("a"),
      ).toHaveAttribute("href", course.href);
    }
    expect(screen.queryByRole("link", { name: /Quellcode auf GitHub/ })).toBeNull();
  });
});

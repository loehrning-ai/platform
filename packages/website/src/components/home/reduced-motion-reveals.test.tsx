import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { courseGroupFor } from "@/lib/courses/tracks";
import { Offering } from "./offering";
import { Workflow } from "./workflow";

const SPINE_LESSONS = COURSE_CATALOG.filter(
  (course) => courseGroupFor(course.slug) !== "deeper",
).reduce((sum, course) => sum + course.totalLessons, 0);

describe("homepage static content visibility", () => {
  it("renders every section visibly in server markup", () => {
    const html = renderToString(
      <>
        <Offering />
        <Workflow />
      </>,
    );

    expect(html).not.toContain("opacity:0");
    expect(html).not.toContain("scaleX(0)");
    expect(html).toContain("Vier Kurse in fester Reihenfolge");
    expect(html).toContain("Material zum Nachlesen und Ausprobieren");
    // The Ground rules strip is gone from the page.
    expect(html).not.toContain("Grundregeln");
    expect(html).not.toContain("platform-principles");
  });

  it("serves the counted lesson total at its final value, never a zero", () => {
    const html = renderToString(<Offering />);
    expect(html).toMatch(
      new RegExp(`data-count-up="${SPINE_LESSONS}"[^>]*>${SPINE_LESSONS}<`),
    );
  });

  it("renders the complete foundation route in visible static markup", () => {
    render(<Offering />);

    const route = screen.getByTestId("foundation-route");
    expect(route).toBeVisible();
    expect(route).not.toHaveStyle({ opacity: "0" });
    expect(route).not.toHaveStyle({ transform: "scaleX(0)" });
  });
});

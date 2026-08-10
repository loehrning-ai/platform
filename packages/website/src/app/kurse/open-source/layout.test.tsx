import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import OpenSourceCoursesLayout from "./layout";

describe("technical-course layout", () => {
  it("inherits the root document language without an extra host wrapper", () => {
    const { container } = render(
      OpenSourceCoursesLayout({
        children: <p>Course content</p>,
      }),
    );

    expect(container.firstElementChild).toBe(
      screen.getByText("Course content"),
    );
  });
});

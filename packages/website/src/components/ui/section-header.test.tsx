import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionHeader } from "./section-header";

describe("<SectionHeader>", () => {
  it("marks all motion-hidden copy for the no-script fallback", () => {
    render(
      <SectionHeader
        eyebrow="Curriculum"
        heading="Vier Module"
        description="Ein öffentlicher Lernweg."
      />,
    );

    expect(screen.getByText("Curriculum")).toHaveClass("js-reveal");
    expect(screen.getByRole("heading", { name: "Vier Module" })).toHaveClass(
      "js-reveal",
    );
    expect(screen.getByText("Ein öffentlicher Lernweg.")).toHaveClass(
      "js-reveal",
    );
  });
});

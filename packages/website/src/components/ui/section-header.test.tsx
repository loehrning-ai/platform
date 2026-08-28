import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionHeader } from "./section-header";

describe("<SectionHeader>", () => {
  it("renders static editorial copy without a reveal-on-scroll wrapper", () => {
    const { container } = render(
      <SectionHeader
        eyebrow="Curriculum"
        heading="Vier Module"
        description="Ein öffentlicher Lernweg."
      />,
    );

    expect(screen.getByText("Curriculum")).toHaveClass("text-sm");
    expect(screen.getByRole("heading", { name: "Vier Module" })).toBeVisible();
    expect(screen.getByText("Ein öffentlicher Lernweg.")).toHaveClass(
      "text-base",
      "max-w-[68ch]",
    );
    expect(container.querySelector(".js-reveal")).toBeNull();
  });

  it("compacts the header rhythm and only centers copy when requested", () => {
    const { rerender } = render(
      <SectionHeader heading="Links" description="Direkt." centered={false} />,
    );
    const description = screen.getByText("Direkt.");
    expect(description.parentElement).toHaveClass("mb-8", "sm:mb-12");
    expect(description.parentElement).not.toHaveClass("text-center");
    expect(description).not.toHaveClass("mx-auto");

    rerender(<SectionHeader heading="Mitte" description="Zentriert." />);
    expect(screen.getByText("Zentriert.").parentElement).toHaveClass(
      "text-center",
    );
    expect(screen.getByText("Zentriert.")).toHaveClass("mx-auto");
  });
});

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CredibilityLogos, RED_BULL_MARK } from "./credibility-logos";

describe("<CredibilityLogos>", () => {
  it("renders the local two-bulls mark without the legacy wordmark asset", () => {
    render(<CredibilityLogos locale="de" />);

    const redBullCard = screen.getByText("Red Bull").closest("li");
    expect(redBullCard).not.toBeNull();
    const mark = redBullCard?.querySelector("svg");
    expect(mark).toHaveAttribute("viewBox", RED_BULL_MARK.viewBox);
    expect(mark).toHaveAttribute("fill", "currentColor");
    expect(mark).toHaveAttribute("width", "97");
    expect(mark).toHaveAttribute("height", "32");
    expect(mark?.querySelector("path")).toHaveAttribute(
      "d",
      RED_BULL_MARK.path,
    );
    expect(
      redBullCard?.querySelector('img[src="/ueber-mich/logos/red-bull.svg"]'),
    ).toBeNull();
  });

  it("exposes employer names while keeping every mark decorative", () => {
    render(<CredibilityLogos locale="de" />);

    const section = screen.getByRole("region", {
      name: "Frühere berufliche Stationen",
    });
    for (const employer of ["Apple", "Red Bull", "Meta"]) {
      expect(within(section).getByText(employer)).toHaveAttribute(
        "translate",
        "no",
      );
    }
    for (const mark of section.querySelectorAll("img, svg")) {
      expect(mark).toHaveAttribute("aria-hidden", "true");
    }
    expect(
      within(section).getByText(/ausschließlich der biografischen Einordnung/),
    ).toBeVisible();
    expect(within(section).getByText(/nicht/)).toBeVisible();
    expect(section).toHaveAttribute("data-employer-proof");
  });

  it("uses English labels and explicit no-endorsement wording on English pages", () => {
    render(<CredibilityLogos locale="en" />);

    const section = screen.getByRole("region", {
      name: "Previous professional roles",
    });
    expect(
      within(section).getByRole("heading", { name: "Previous employers" }),
    ).toBeVisible();
    expect(
      within(section).getByText(/do not endorse or support/),
    ).toBeVisible();
    expect(
      within(section).queryByText("Frühere Arbeitgeber"),
    ).not.toBeInTheDocument();
  });
});

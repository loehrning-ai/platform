import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Credentials } from "./credentials";

describe("<Credentials>", () => {
  it("renders the three factual German credential cards", () => {
    const { container } = render(<Credentials locale="de" />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Akademischer Hintergrund",
      }),
    ).toBeVisible();
    for (const title of [
      "M.Sc. Informatik",
      "Internationale Ausbildung",
      "KI-Forschung",
    ]) {
      expect(
        screen.getByRole("heading", { level: 3, name: title }),
      ).toBeVisible();
    }
    expect(screen.getByText(/Abschluss mit Auszeichnung/)).toBeVisible();
    expect(screen.getByText(/Oxford und Innovation Management/)).toBeVisible();
    expect(container.querySelectorAll("article")).toHaveLength(3);
  });

  it("renders research evidence only on the research card", () => {
    render(<Credentials locale="de" />);

    const researchCard = screen
      .getByRole("heading", { level: 3, name: "KI-Forschung" })
      .closest("article");
    const degreeCard = screen
      .getByRole("heading", { level: 3, name: "M.Sc. Informatik" })
      .closest("article");
    expect(researchCard).not.toBeNull();
    expect(degreeCard).not.toBeNull();
    expect(
      within(researchCard as HTMLElement).getAllByRole("listitem"),
    ).toHaveLength(2);
    const evidenceLinks = within(researchCard as HTMLElement).getAllByRole(
      "link",
    );
    expect(evidenceLinks).toHaveLength(2);
    expect(evidenceLinks[0]).toHaveAttribute(
      "href",
      "https://doi.org/10.1007/s12065-023-00878-4",
    );
    expect(evidenceLinks[1]).toHaveAttribute(
      "href",
      "https://dl.gi.de/handle/20.500.12116/37772",
    );
    expect(
      within(researchCard as HTMLElement).queryByText(/Best Paper Award/i),
    ).toBeNull();
    expect(
      within(degreeCard as HTMLElement).queryByRole("list"),
    ).not.toBeInTheDocument();
  });

  it("renders English credential copy with no German section labels", () => {
    render(<Credentials locale="en" />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Academic background" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 3, name: "M.Sc. Computer Science" }),
    ).toBeVisible();
    expect(screen.getByText(/Graduated with distinction/)).toBeVisible();
    expect(
      screen.queryByText("Akademischer Hintergrund"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Internationale Ausbildung"),
    ).not.toBeInTheDocument();
  });

  it("keeps icons decorative and long text in shrinkable containers", () => {
    const { container } = render(<Credentials locale="en" />);

    for (const icon of container.querySelectorAll("article svg")) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
    for (const card of container.querySelectorAll("article")) {
      expect(card).toHaveClass("min-w-0");
    }
  });
});

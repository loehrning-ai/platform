import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getWorkshops } from "@/lib/workshops";
import { WorkshopsContent } from "./workshops-content";

describe("<WorkshopsContent>", () => {
  it("renders German first-viewport copy without motion-hidden styles", () => {
    render(<WorkshopsContent workshops={[]} locale="de" />);

    const heading = screen.getByRole("heading", {
      level: 1,
      name: /Selbstlern-Workshops[\s\S]*für konkrete Entscheidungen/,
    });
    const introduction = screen.getByText(/0 geführte Workshops/);
    expect(heading).not.toHaveStyle({ opacity: "0" });
    expect(introduction).not.toHaveStyle({ opacity: "0" });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Derzeit ist kein Workshop veröffentlicht.",
    );
  });

  it("renders reviewed English copy and locale-preserving links", () => {
    render(<WorkshopsContent workshops={getWorkshops("en")} locale="en" />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Self-study workshops[\s\S]*for concrete decisions/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/2 guided workshops/)).toBeInTheDocument();
    expect(screen.queryByText("Verfügbare Workshops")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Can AI predict the future?" }),
    ).toHaveAttribute("href", "/en/workshops/ki-prognosen-einschaetzen");
    expect(screen.getByRole("link", { name: /View courses/ })).toHaveAttribute(
      "href",
      "/en/kurse",
    );
  });
});

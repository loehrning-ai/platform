import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WorkshopsContent } from "./workshops-content";

describe("<WorkshopsContent>", () => {
  it("renders first-viewport copy without motion-hidden styles", () => {
    render(<WorkshopsContent workshops={[]} />);

    const heading = screen.getByRole("heading", {
      level: 1,
      name: /Kein Vortrag[\s\S]*Ein gebauter KI-Analyst/,
    });
    const introduction = screen.getByText(/0 Workshops zum Selbermachen/);
    expect(heading).not.toHaveStyle({ opacity: "0" });
    expect(introduction).not.toHaveStyle({ opacity: "0" });
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UeberMichContent } from "./ueber-mich-content";

describe("<UeberMichContent>", () => {
  it("renders the portrait and first-viewport biography without motion-hidden styles", () => {
    render(<UeberMichContent />);

    const portrait = screen.getByRole("img", {
      name: "Porträt von Tim Löhr vor der Golden Gate Bridge",
    });
    const biography = screen.getByText(/Hauptberuflich war ich Data Scientist/);
    expect(portrait.parentElement).not.toHaveStyle({ opacity: "0" });
    expect(biography).not.toHaveStyle({ opacity: "0" });
  });

  it("marks every below-fold animated section for the no-script fallback", () => {
    render(<UeberMichContent />);

    for (const heading of [
      "Karriere",
      "Akademischer Hintergrund",
      "Redaktionelle Richtlinien",
      "Du erreichst mich direkt.",
      "Weiter zu den Kursen.",
    ]) {
      expect(
        screen.getByRole("heading", { name: heading }),
      ).toHaveClass("js-reveal");
    }
    expect(
      screen.getByText("Kuratiert von jemandem, der hier gearbeitet hat"),
    ).toHaveClass("js-reveal");
  });
});

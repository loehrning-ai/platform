import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ImpressumPage from "./page";

describe("Impressum", () => {
  it("renders email-first contact without placeholder text while no address is published", () => {
    const { container } = render(<ImpressumPage />);
    expect(container.textContent).not.toMatch(/Launch-Blocker/);
    expect(container.textContent).not.toMatch(
      /ladungsfähige Anschrift ist noch nicht eingetragen/i,
    );
    expect(
      screen.getAllByText(/tim@loehrning\.ai/).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("does not repeat obsolete DDG liability boilerplate", () => {
    const { container } = render(<ImpressumPage />);
    expect(container.textContent).not.toMatch(/§§?\s*7|§§?\s*8\s*bis\s*10/);
    expect(container.textContent).toMatch(
      /Gesetzliche Haftungsregeln werden durch diesen Hinweis nicht eingeschränkt/,
    );
  });

  it("describes the repository as multi-licensed", () => {
    render(<ImpressumPage />);
    expect(
      screen.getByText(/unterschiedlichen Lizenzen und Nutzungsrechten/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/gewährt nicht automatisch Rechte an Kursprosa/i),
    ).toBeInTheDocument();
  });
});

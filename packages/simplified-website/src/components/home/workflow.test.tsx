import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Workflow } from "./workflow";

describe("Ressourcen section (Workflow)", () => {
  it("exposes the ressourcen-section anchor and heading", () => {
    render(<Workflow />);
    expect(screen.getByTestId("ressourcen-section")).toBeInTheDocument();
    expect(screen.getByText("Ressourcen")).toBeInTheDocument();
    expect(screen.getByText(/Material zum Anwenden/)).toBeInTheDocument();
  });

  it("surfaces every supporting resource area as a single linked set", () => {
    render(<Workflow />);
    const expected: ReadonlyArray<readonly [string, string]> = [
      ["Blog", "/blog"],
      ["Lernbücher", "/buecher"],
      ["Praxisbeispiele", "/demos"],
      ["Arbeitsvorlagen", "/vorlagen"],
      ["Workshops", "/workshops"],
      ["Open Source", "/open-source"],
    ];
    for (const [label, href] of expected) {
      const link = screen.getByText(label).closest("a");
      expect(link).toHaveAttribute("href", href);
    }
  });

  it("showcases the account feature once, linking to /konto", () => {
    render(<Workflow />);
    expect(
      screen.getByText(/dein Fortschritt, deine Zertifikate und deine Kompetenzen/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Zum Konto/ })).toHaveAttribute(
      "href",
      "/konto",
    );
  });
});

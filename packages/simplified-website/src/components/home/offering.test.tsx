import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Offering } from "./offering";
import { COURSE_CATALOG, IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";

describe("Offering section", () => {
  it("renders the course-led headline", () => {
    render(<Offering />);
    expect(screen.getByText(/Vier Kurse\./)).toBeInTheDocument();
    expect(
      screen.getByText(/Vom ersten Prompt bis zum EU-Gesetz/),
    ).toBeInTheDocument();
  });

  it("renders each core course as a linked card", () => {
    render(<Offering />);
    for (const course of COURSE_CATALOG) {
      const link = screen.getByText(course.title).closest("a");
      expect(link).toHaveAttribute("href", course.href);
    }
  });

  it("renders the supporting resources including Workshops and Blog", () => {
    render(<Offering />);
    const expected: ReadonlyArray<readonly [string, string]> = [
      ["Lernbücher", "/buecher"],
      ["Praxisbeispiele", "/demos"],
      ["Arbeitsvorlagen", "/vorlagen"],
      ["Workshops", "/workshops"],
      ["Open Source", "/open-source"],
      ["Blog", "/blog"],
    ];
    for (const [label, href] of expected) {
      const link = screen.getByText(label).closest("a");
      expect(link).toHaveAttribute("href", href);
    }
  });

  it("uses the ressourcen-section testid", () => {
    render(<Offering />);
    expect(screen.getByTestId("ressourcen-section")).toBeInTheDocument();
  });

  it("renders the direct persona course links", () => {
    render(<Offering />);
    expect(screen.getByTestId("persona-filter")).toBeInTheDocument();
  });

  it("renders the GitHub-Labs imagery band with real screenshots", () => {
    render(<Offering />);
    expect(screen.getByText("GitHub-Labs")).toBeInTheDocument();
    for (const course of IMPORTED_COURSE_CATALOG.slice(0, 3)) {
      expect(screen.getByAltText(course.imageAlt)).toBeInTheDocument();
    }
  });

  it("gives each GitHub-Labs preview an external source-code link", () => {
    render(<Offering />);
    for (const course of IMPORTED_COURSE_CATALOG.slice(0, 3)) {
      const sourceLink = screen.getByRole("link", {
        name: `Quellcode auf GitHub: ${course.title}`,
      });
      expect(sourceLink).toHaveAttribute("href", course.sourceHref);
      expect(sourceLink).toHaveAttribute("target", "_blank");
      expect(sourceLink).toHaveAttribute("rel", expect.stringContaining("noopener"));
    }
  });
});

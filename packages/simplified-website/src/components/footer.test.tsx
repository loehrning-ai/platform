import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./footer";

describe("Footer data pill", () => {
  it("renders the data pill with Stand date and last updated", () => {
    render(<Footer />);
    const pill = screen.getByTestId("footer-data-pill");
    expect(pill).toBeInTheDocument();
    expect(pill.textContent).toMatch(/Datenstand:/i);
    expect(pill.textContent).toMatch(/Q3 2026/);
    expect(pill.textContent).toMatch(/Letzte Aktualisierung:/i);
    expect(pill.textContent).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

describe("Footer learning links", () => {
  function hrefs() {
    render(<Footer />);
    return Array.from(document.querySelectorAll("a")).map((a) =>
      a.getAttribute("href"),
    );
  }

  it("links the /kurse hub, native courses, and imported course lane", () => {
    const links = hrefs();
    expect(links).toContain("/kurse");
    expect(links).toContain("/open-source");
    expect(links).toContain("/ki-fuehrerschein");
    expect(links).toContain("/eu-ai-act-kurs");
    expect(links).toContain("/ai-native");
  });

  it("keeps profile and contact out of the primary learning columns", () => {
    render(<Footer />);
    // Footer column headings are <h2> to preserve heading order after the page h1.
    const headings = Array.from(document.querySelectorAll("h2")).map((h) =>
      h.textContent,
    );
    expect(headings).toEqual(["Lernen", "Anwenden", "Plattform"]);
    expect(screen.queryByText("Projekt")).not.toBeInTheDocument();
  });

  it("links the verified GitHub organization without repository-status copy", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "GitHub-Organisation" })).toHaveAttribute(
      "href",
      "https://github.com/loehrning-ai",
    );
    expect(screen.queryByText(/erstes Repository|noch nicht veröffentlicht/)).not.toBeInTheDocument();
  });

  it("keeps the public license policy in permanent legal navigation", () => {
    render(<Footer />);
    expect(
      screen.getByRole("link", { name: "Lizenzrichtlinie" }),
    ).toHaveAttribute("href", "/open-source/lizenzrichtlinie");
  });
});

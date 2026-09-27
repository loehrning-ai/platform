import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Offering } from "./offering";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { courseGroupFor } from "@/lib/courses/tracks";
import { LocaleProvider } from "@/components/i18n/locale-context";

const SPINE = COURSE_CATALOG.filter(
  (course) => courseGroupFor(course.slug) !== "deeper",
);
describe("Offering section", () => {
  it("renders the course-led headline and a factual caption", () => {
    render(<Offering />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Vier Kurse in fester Reihenfolge",
      }),
    ).toBeInTheDocument();
    // The caption states facts; it never restates the heading.
    const lessons = SPINE.reduce((sum, course) => sum + course.totalLessons, 0);
    expect(
      screen.getByText(`${lessons} Lektionen · kostenlos · DE + EN`),
    ).toBeInTheDocument();
    expect(screen.queryByText("Grundlagenpfad")).not.toBeInTheDocument();
  });

  it("renders exactly the four spine courses as a visual ordered route", () => {
    render(<Offering />);
    expect(SPINE).toHaveLength(4);
    expect(screen.getByTestId("foundation-route").children).toHaveLength(4);
    for (const course of SPINE) {
      const link = screen.getByText(course.title).closest("a");
      expect(link).toHaveAttribute("href", course.href);
    }
  });

  it("uses the kurse-section testid (resources now live in their own section)", () => {
    render(<Offering />);
    expect(screen.getByTestId("kurse-section")).toBeInTheDocument();
  });

  it("removes duplicated persona shortcuts and gives every route step owned artwork", () => {
    render(<Offering />);
    expect(screen.queryByTestId("persona-filter")).not.toBeInTheDocument();
    // Every step owns its poster (SPEC §3.5): the Grundlagenpfad in Lemons,
    // numbered 01 to 04, drawn as decorative inline SVG with no image request.
    expect(document.querySelectorAll("img")).toHaveLength(0);
    const posters = Array.from(
      document.querySelectorAll("[data-course-artwork] svg[data-poster]"),
    );
    expect(posters).toHaveLength(4);
    expect(posters.map((poster) => poster.getAttribute("data-poster-motif"))).toEqual([
      "disc",
      "pair",
      "ring",
      "steps",
    ]);
    for (const [index, poster] of posters.entries()) {
      expect(poster).toHaveClass("plakat-lemons");
      expect(poster).toHaveAttribute("aria-hidden", "true");
      expect(poster).toHaveAttribute("focusable", "false");
      expect(poster).toHaveAttribute("data-poster-format", "landscape");
      expect(poster.querySelector("[data-poster-numeral-text]")?.textContent).toBe(
        `0${index + 1}`,
      );
    }
    expect(
      screen.getByRole("list", { name: "Empfohlener Grundlagenpfad" }),
    ).toBeInTheDocument();
  });

  it("routes technical depth through the single full-atlas action", () => {
    render(<Offering />);
    expect(screen.getByText(/6 technische Kurse/)).toBeInTheDocument();
    const atlasLinks = screen.getAllByRole("link", {
      name: /Alle Kurse ansehen/,
    });
    expect(atlasLinks).toHaveLength(1);
    expect(atlasLinks[0]).toHaveAttribute("href", "/kurse");
  });

  it("renders reviewed English copy and locale-preserving links", () => {
    const { container } = render(
      <LocaleProvider locale="en">
        <Offering locale="en" />
      </LocaleProvider>,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Four courses in a set order" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/lessons · free · DE \+ EN$/)).toBeInTheDocument();
    expect(screen.getByText("AI and Society").closest("a")).toHaveAttribute(
      "href",
      "/en/ki-und-gesellschaft",
    );
    expect(
      screen.getByRole("link", { name: /View all courses/ }),
    ).toHaveAttribute("href", "/en/kurse");
    expect(container.textContent).not.toMatch(
      /\b(?:Kurse|Kurs|Bücher|Deutsch|Englisch|Lektionen|Blöcke|Module|Dauer|Grundlagenpfad|Konto|Quellen|ansehen)\b/,
    );
  });

  it("keeps phone rows to one colour and one meta line", () => {
    const { container } = render(<Offering />);
    // One colour, one weight: no two-tone headline at any width.
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.querySelector("span")).toBeNull();
    expect(heading.className).not.toMatch(/text-(?:muted|brand)/);
    // From lg the sheet names its lesson count (the poster numeral is the
    // sheet's only number, SPEC D9); below lg that
    // steps out and the duration is the row's one meta line, never wrapped,
    // so no row orphans "Min.". No unit count: the catalog's units differ
    // per course (Blöcke, Module).
    const counts = Array.from(
      container.querySelectorAll("[data-home-course-card] span"),
    ).filter((span) => /^\d+ Lektionen$/.test(span.textContent ?? ""));
    expect(counts).toHaveLength(4);
    for (const count of counts) expect(count).toHaveClass("max-lg:hidden");
    const durations = container.querySelectorAll(
      "[data-home-course-card] .whitespace-nowrap",
    );
    expect(durations).toHaveLength(4);
    for (const duration of durations) expect(duration).toHaveClass("lg:hidden");
    expect(container.textContent).not.toMatch(/\b(?:Blöcke|Module)\b/);
    // The AI-Native duration agrees with /kurse (5 hours of lessons).
    expect(container.textContent).toContain("ca. 5 Std. + Übungen");
    expect(container.textContent).not.toContain("ca. 12 Std.");
  });

  it("draws the route as flat sheets: no tints, shadows or lifts", () => {
    const { container } = render(<Offering />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/bg-brand-(?:acid|sky|pink|peach|cobalt)/);
    expect(html).not.toMatch(/shadow-card|rounded-\[|hover:-translate/);
    // The poster is a flat printed object: no frame, no filter, and the
    // card itself carries no box.
    const artworks = container.querySelectorAll("[data-course-artwork]");
    expect(artworks).toHaveLength(4);
    for (const artwork of artworks) {
      expect(artwork.className).not.toMatch(/\bborder\b|grayscale|mix-blend|shadow/);
    }
    // No Mennige text on a tint: meta and durations are Schiefer on paper.
    for (const card of container.querySelectorAll("[data-home-course-card]")) {
      expect(card.innerHTML).not.toMatch(/text-(?:brand-orange|kupfer)/);
    }
  });
});

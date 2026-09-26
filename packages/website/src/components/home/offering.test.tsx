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
    const images = Array.from(document.querySelectorAll("img"));
    expect(images).toHaveLength(4);
    const decodedSources = images.map((image) =>
      decodeURIComponent(image.getAttribute("src") ?? ""),
    );
    for (const source of [
      "/course-covers/ki-fuehrerschein-cover-v3.webp",
      "/course-covers/ki-und-gesellschaft-cover-v3.webp",
      "/course-covers/eu-ai-act-kurs-cover-v3.webp",
      "/course-covers/ai-native-cover-v3.webp",
    ]) {
      expect(
        decodedSources.some((candidate) => candidate.includes(source)),
      ).toBe(true);
    }
    for (const image of images) {
      expect(image).toHaveAttribute("alt", "");
      expect(image).toHaveAttribute("loading", "lazy");
      expect(image).toHaveAttribute("decoding", "async");
      expect(image).toHaveAttribute("fetchpriority", "low");
      expect(image).toHaveAttribute("width", "1440");
      expect(image).toHaveAttribute("height", "630");
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
    // From lg the sheet names its number and lesson count; below lg that
    // steps out and the duration is the row's one meta line, never wrapped,
    // so no row orphans "Min.". No unit count: the catalog's units differ
    // per course (Blöcke, Module).
    const counts = Array.from(
      container.querySelectorAll("[data-home-course-card] span"),
    ).filter((span) => /^0\d · \d+ Lektionen$/.test(span.textContent ?? ""));
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
    // The cover is the framed object; the card itself carries no box.
    for (const artwork of container.querySelectorAll("[data-course-artwork]")) {
      expect(artwork).toHaveClass("border", "border-foreground");
    }
    // The covers print in ink: greyscale, multiplied onto the sheet.
    for (const image of container.querySelectorAll("[data-course-artwork] img")) {
      expect(image).toHaveClass("grayscale", "mix-blend-multiply");
    }
    // No Mennige text on a tint: meta and durations are Schiefer on paper.
    for (const card of container.querySelectorAll("[data-home-course-card]")) {
      expect(card.innerHTML).not.toMatch(/text-(?:brand-orange|kupfer)/);
    }
  });
});

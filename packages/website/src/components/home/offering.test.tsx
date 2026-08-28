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
  it("renders the course-led headline", () => {
    render(<Offering />);
    expect(screen.getByText(/Vier Kurse\./)).toBeInTheDocument();
    expect(screen.getByText(/Eine klare Reihenfolge/)).toBeInTheDocument();
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

    expect(screen.getByText("Four courses.")).toBeInTheDocument();
    expect(screen.getByText("One defined order.")).toBeInTheDocument();
    expect(screen.getByText("AI and Society").closest("a")).toHaveAttribute(
      "href",
      "/en/ki-und-gesellschaft",
    );
    expect(
      screen.getByRole("link", { name: /View all courses/ }),
    ).toHaveAttribute("href", "/en/kurse");
    expect(container.textContent).not.toMatch(
      /\b(?:Kurse|Kurs|Bücher|Deutsch|Englisch|Lektionen|Dauer|Grundlagenpfad|Konto|Quellen|ansehen)\b/,
    );
  });
});

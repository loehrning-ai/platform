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
      screen.getByText(`${lessons} Lektionen`),
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
    // Every step leads with its people picture (public/course-covers, the
    // recoloured v4 set) in a registration frame; no poster art.
    const images = Array.from(document.querySelectorAll("img"));
    expect(images).toHaveLength(4);
    const decodedSources = images.map((image) =>
      decodeURIComponent(image.getAttribute("src") ?? ""),
    );
    for (const source of [
      "/course-covers/ki-fuehrerschein-cover-v4.webp",
      "/course-covers/ki-und-gesellschaft-cover-v4.webp",
      "/course-covers/eu-ai-act-kurs-cover-v4.webp",
      "/course-covers/ai-native-cover-v4.webp",
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
      expect(image.closest("[data-course-artwork]")).not.toBeNull();
    }
    expect(document.querySelector("[data-course-artwork] svg[data-poster]")).toBeNull();
    expect(
      screen.getByRole("list", { name: "Empfohlener Grundlagenpfad" }),
    ).toBeInTheDocument();
  });

  it("frames each picture with registration layers that move only with motion allowed", () => {
    const { container } = render(<Offering />);
    const artworks = Array.from(container.querySelectorAll("[data-course-artwork]"));
    expect(artworks).toHaveLength(4);
    for (const artwork of artworks) {
      // A thin cobalt registration frame and an inner paper hairline, both
      // decorative, both offset on hover and focus, both still under
      // reduced motion.
      const layers = Array.from(artwork.querySelectorAll<HTMLElement>(":scope > span[aria-hidden='true']"));
      expect(layers.length).toBeGreaterThanOrEqual(2);
      const [frame, inner] = layers;
      expect(frame).toHaveClass("border-[3px]", "group-hover:-translate-x-1", "motion-reduce:transform-none");
      expect(inner).toHaveClass("border", "group-hover:-translate-x-[3px]", "motion-reduce:transform-none");
      expect(artwork.querySelector("img")).toHaveClass("object-cover", "motion-reduce:transform-none");
    }
  });

  it("routes visual learning through the single full-atlas action", () => {
    render(<Offering />);
    expect(
      screen.getByText(/4 Kurse zum visuellen Lernen zu Daten und KI-Betrieb/),
    ).toBeInTheDocument();
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
    const lessons = SPINE.reduce((sum, course) => sum + course.totalLessons, 0);
    expect(screen.getByText(`${lessons} lessons`)).toBeInTheDocument();
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

  it("keeps the phone cards to the lesson count, the duration and the title", () => {
    const { container } = render(<Offering />);
    // One colour, one weight: no two-tone headline at any width.
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.querySelector("span")).toBeNull();
    expect(heading.className).not.toMatch(/text-(?:muted|brand)/);
    // Every card names its lesson count; the duration prints once in the
    // meta lines below sm and once on the picture from sm, never wrapped.
    // No unit count: the catalog's units differ per course (Blöcke, Module).
    const counts = Array.from(
      container.querySelectorAll("[data-home-course-card] span"),
    ).filter((span) => /^\d+ Lektionen$/.test(span.textContent ?? ""));
    expect(counts).toHaveLength(4);
    const durations = container.querySelectorAll(
      "[data-home-course-card] .whitespace-nowrap",
    );
    expect(durations).toHaveLength(4);
    for (const duration of durations) expect(duration).toHaveClass("sm:hidden");
    expect(container.textContent).not.toMatch(/\b(?:Blöcke|Module)\b/);
    // The AI-Native duration agrees with /kurse (5 hours of lessons).
    expect(container.textContent).toContain("ca. 5 Std. + Übungen");
    expect(container.textContent).not.toContain("ca. 12 Std.");
  });

  it("draws the route as pastel cards on light grounds only", () => {
    const { container } = render(<Offering />);
    const html = container.innerHTML;
    expect(html).toMatch(/bg-brand-(?:acid|sky|pink|peach)\//);
    // Never a dark ground (the owner's rule), and small Mennige text only in
    // its deeper tone, which keeps 4.5:1 on every tint.
    expect(html).not.toMatch(
      /\bbg-(?:graphit|black|foreground|ultramarin|neutral-9\d\d|zinc-9\d\d|stone-9\d\d)\b|\bdark-section\b/,
    );
    for (const card of container.querySelectorAll("[data-home-course-card]")) {
      expect(card.innerHTML).not.toMatch(/text-(?:brand-orange|kupfer)(?!-dark)\b/);
    }
  });
});

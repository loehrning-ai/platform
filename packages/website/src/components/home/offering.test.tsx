import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Offering } from "./offering";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { courseGroupFor } from "@/lib/courses/tracks";
import { LocaleProvider } from "@/components/i18n/locale-context";

const SPINE = COURSE_CATALOG.filter(
  (course) => courseGroupFor(course.slug) !== "deeper",
);
const DEEPER = COURSE_CATALOG.filter(
  (course) => courseGroupFor(course.slug) === "deeper",
);

describe("Offering section", () => {
  it("renders the course-led headline", () => {
    render(<Offering />);
    expect(screen.getByText(/Vier Kurse\./)).toBeInTheDocument();
    expect(screen.getByText(/Eine klare Reihenfolge/)).toBeInTheDocument();
  });

  it("renders exactly the four spine courses as linked cards", () => {
    render(<Offering />);
    expect(SPINE).toHaveLength(4);
    for (const course of SPINE) {
      const link = screen.getByText(course.title).closest("a");
      expect(link).toHaveAttribute("href", course.href);
    }
  });

  it("uses the kurse-section testid (resources now live in their own section)", () => {
    render(<Offering />);
    expect(screen.getByTestId("kurse-section")).toBeInTheDocument();
  });

  it("renders the direct persona course links", () => {
    render(<Offering />);
    expect(screen.getByTestId("persona-filter")).toBeInTheDocument();
  });

  it("renders the Technikkurse imagery band with real screenshots", () => {
    render(<Offering />);
    expect(screen.getByText("Technikkurse")).toHaveClass("text-brand-orange");
    expect(
      screen.getByText(/Aus offenen GitHub-Repositories übernommen/),
    ).toBeInTheDocument();
    const previews = DEEPER.slice(0, 3);
    expect(previews).toHaveLength(3);
    for (const course of previews) {
      expect(screen.getByAltText(course.imageAlt ?? "")).toBeInTheDocument();
    }
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
      /\b(?:Kurse|Bücher|Deutsch|Englisch|Lektionen|Dauer|Grundlagenpfad|Konto|Quellen|ansehen)\b/,
    );
  });

  it("gives each Technikkurse preview an external source-code link", () => {
    render(<Offering />);
    for (const course of DEEPER.slice(0, 3)) {
      const sourceLink = screen.getByRole("link", {
        name: `Quellcode auf GitHub: ${course.title}`,
      });
      expect(sourceLink).toHaveAttribute("href", course.sourceHref);
      expect(sourceLink).toHaveAttribute("target", "_blank");
      expect(sourceLink).toHaveAttribute(
        "rel",
        expect.stringContaining("noopener"),
      );
    }
  });
});

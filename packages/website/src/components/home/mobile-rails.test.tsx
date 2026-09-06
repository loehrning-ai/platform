import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MobileRails } from "./mobile-rails";
import { books } from "@/lib/books";
import { getDemosForLocale } from "@/lib/demos-localization";

/** Every rail item is a link, so the whole tile is the touch target. */
function railLinks(container: HTMLElement): readonly HTMLAnchorElement[] {
  return Array.from(container.querySelectorAll("a"));
}

describe("MobileRails", () => {
  it("stays out of the wide layout, where each subject keeps its own section", () => {
    const { container } = render(<MobileRails />);
    expect(container.firstElementChild).toHaveClass("lg:hidden");
  });

  it("names both subjects as headings", () => {
    render(<MobileRails />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Praxisbeispiele" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Lernbücher" }),
    ).toBeInTheDocument();
  });

  it("gives each rail a distinct accessible name", () => {
    render(<MobileRails />);
    expect(
      screen.getByRole("list", { name: "Praxisbeispiele zum Ausprobieren" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Lernbücher der Plattform" }),
    ).toBeInTheDocument();
  });

  it("shows six applied examples plus one route to all of them", () => {
    const { container } = render(<MobileRails />);
    const demoTiles = container.querySelectorAll(
      '[data-home-rail-tile="demo"]',
    );
    expect(demoTiles).toHaveLength(6);

    const expected = getDemosForLocale("de").slice(0, 6);
    for (const [index, demo] of expected.entries()) {
      expect(demoTiles[index]).toHaveAttribute("href", `/demos/${demo.slug}`);
      expect(demoTiles[index]).toHaveTextContent(demo.title);
    }
    expect(
      screen.getByRole("link", { name: /Alle Praxisbeispiele/ }),
    ).toHaveAttribute("href", "/demos");
  });

  it("lists only publicly routed books, never a title on editorial hold", () => {
    const { container } = render(<MobileRails />);
    const bookTiles = Array.from(
      container.querySelectorAll('[data-home-rail-tile="book"]'),
    );

    expect(bookTiles).toHaveLength(books.length);
    for (const [index, book] of books.entries()) {
      expect(bookTiles[index]).toHaveAttribute("href", book.readerHref);
      expect(bookTiles[index]).toHaveTextContent(book.title);
      expect(bookTiles[index]).toHaveTextContent(`${book.chapters} Kapitel`);
    }
    expect(container.innerHTML).not.toContain("ki-arbeitsalltag");
    expect(
      screen.getByRole("link", { name: /Alle Lernbücher/ }),
    ).toHaveAttribute("href", "/buecher");
  });

  it("scroll-snaps horizontally and skips the work while off-screen", () => {
    const { container } = render(<MobileRails />);
    const rails = Array.from(container.querySelectorAll("ul"));
    expect(rails).toHaveLength(2);

    for (const rail of rails) {
      expect(rail.className).toContain("overflow-x-auto");
      expect(rail.className).toContain("snap-x");
      expect(rail.className).toContain("snap-mandatory");
      // A horizontal swipe must not become a browser back gesture.
      expect(rail.className).toContain("overscroll-x-contain");
      // content-visibility needs a matching intrinsic height, or the document
      // would change length as rails enter and leave the viewport.
      expect(rail.className).toContain("[content-visibility:auto]");
      expect(rail.className).toContain("[contain-intrinsic-height:auto_6.25rem]");
      for (const item of Array.from(rail.children)) {
        expect(item.className).toContain("snap-start");
        expect(item.className).toContain("shrink-0");
      }
    }
  });

  it("carries no image request and no ambient motion", () => {
    const { container } = render(<MobileRails />);
    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(container.innerHTML).not.toContain("transition-all");
    expect(container.innerHTML).not.toContain("animate-");
  });

  it("keeps every rail href inside the requested locale", () => {
    const { container } = render(<MobileRails locale="en" />);
    const hrefs = railLinks(container).map((link) => link.getAttribute("href"));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href?.startsWith("/en/")).toBe(true);
    }
  });

  it("renders reviewed English copy without German labels", () => {
    const { container } = render(<MobileRails locale="en" />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Applied examples" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Learning books" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/10 chapters/)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(
      /\b(?:Praxisbeispiele|Lernbücher|Kapitel|Ausprobieren|Nachlesen|Ressourcen|Lektionen)\b/,
    );
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Locale } from "@/lib/i18n/locale";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => createElement("img", props),
}));

vi.mock("@/lib/books", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/books")>();
  return {
    ...original,
    books: [original.allBooks[0], original.allBooks[1]],
  };
});

import { BuecherContent } from "./buecher-content";
import { BOOK_PAGE_COPY, getBookDisplay } from "./book-copy";
import { books } from "@/lib/books";

describe("BuecherContent visibility, loading, and locale behavior", () => {
  it("keeps the LCP catalog server-owned and the teaser behind a conditional import", () => {
    const contentSource = readFileSync(
      resolve(process.cwd(), "src/app/buecher/buecher-content.tsx"),
      "utf8",
    );
    const controllerSource = readFileSync(
      resolve(process.cwd(), "src/app/buecher/book-preview-controller.tsx"),
      "utf8",
    );

    expect(contentSource).not.toMatch(/^\s*["']use client["']/);
    expect(contentSource).not.toContain("framer-motion");
    expect(controllerSource).toContain('import("./book-teaser")');
    expect(controllerSource).not.toContain("import { BookTeaser }");
  });

  it("renders the German heading and every card in the initial document state", () => {
    const { container } = render(
      <BuecherContent accountEnabled={false} locale="de" />,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Sachbücher mit sichtbaren Quellen und Grenzen.",
      }),
    ).toBeVisible();
    expect(screen.getAllByTestId("book-card")).toHaveLength(2);
    expect(screen.getAllByText(/von Tim Löhr/)).toHaveLength(2);
    expect(screen.getAllByText("Nach der Lektüre")).toHaveLength(2);
    expect(screen.getAllByText(/Redaktion: editorial:books/)).toHaveLength(2);
    expect(screen.getAllByText("Ausgabe, Quellen und Zugang")).toHaveLength(2);
    expect(
      container.querySelector("[data-book-editorial-spread]"),
    ).not.toBeNull();
    expect(container.querySelectorAll("[data-preview-shelf]")).toHaveLength(2);
    expect(container.querySelectorAll("[data-image-showcase]")).toHaveLength(2);
    expect(
      container.querySelectorAll('[data-motion-initial*="opacity"]').length,
    ).toBe(0);
    expect(container.querySelectorAll('[style*="opacity: 0"]').length).toBe(0);
  });

  it("keeps every below-fold cover out of the heading LCP path", () => {
    render(<BuecherContent accountEnabled={false} locale="de" />);

    const covers = screen.getAllByRole("img", {
      name: /^Deutsche Titelseite:/,
    });
    expect(covers).toHaveLength(2);
    covers.forEach((cover) => {
      expect(cover).toHaveAttribute("loading", "lazy");
      expect(cover).not.toHaveAttribute("fetchpriority");
    });
  });

  it("renders reviewed English interface copy and locale-preserving page links", () => {
    const { container } = render(
      <BuecherContent accountEnabled={false} locale="en" />,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Reference books with visible sources and limits.",
      }),
    ).toBeVisible();
    expect(
      screen.getAllByText("Material language", { exact: true }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("English").length).toBeGreaterThan(0);
    const overview = screen.getByRole("link", {
      name: "Open book and chapters: AI in German SMEs",
    });
    expect(overview).toHaveAttribute("href", "/en/buecher/ki-landschaft");
    expect(overview).toHaveClass("min-h-11");
    expect(screen.getAllByText("After reading")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "View courses" })).toBeNull();

    const pageLinks = Array.from(
      container.querySelectorAll<HTMLAnchorElement>('a[href^="/"]'),
    );
    expect(
      pageLinks.every((link) => link.getAttribute("href")?.startsWith("/en")),
    ).toBe(true);
  });

  it("loads and localizes the cover-preview dialog only after activation", async () => {
    render(<BuecherContent accountEnabled={false} locale="en" />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Open the cover preview for “AI in German SMEs”",
      }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Cover preview: AI in German SMEs",
    });
    expect(dialog).toBeVisible();
    expect(
      within(dialog).getByText("Source cover in German · English HTML reader"),
    ).toBeVisible();
    expect(
      within(dialog).getByRole("link", { name: "Open book and chapters" }),
    ).toHaveAttribute("href", "/en/buecher/ki-landschaft");
    expect(within(dialog).getByTestId("book-preview-showcase")).toBeVisible();
  });

  it("states the PDF boundary and exposes the login route only when accounts are enabled", () => {
    const disabled = render(
      <BuecherContent accountEnabled={false} locale="en" />,
    );

    expect(screen.getAllByText("PDF download unavailable")).toHaveLength(2);
    expect(
      screen.queryByRole("link", { name: "German PDF after sign-in" }),
    ).toBeNull();
    disabled.unmount();

    render(<BuecherContent accountEnabled locale="en" />);
    expect(
      screen.getByRole("link", {
        name: "German PDF after sign-in: AI in German SMEs",
      }),
    ).toHaveAttribute(
      "href",
      "/en/login?next=%2Fapi%2Fbuecher%2Fki-landschaft%2Fdownload.pdf",
    );
  });

  it.each(["de", "en"] as const)(
    "gives every repeated ledger control a unique accessible name in %s",
    (locale: Locale) => {
      const { container } = render(
        <BuecherContent accountEnabled locale={locale} />,
      );
      const copy = BOOK_PAGE_COPY[locale].catalog;
      const displays = books.map((book) => getBookDisplay(book, locale));

      const overviewLinks = books
        .map((book, index) => ({ book, display: displays[index] }))
        .filter(({ book }) => book.publicationStatus === "published")
        .map(({ display }) =>
          screen.getByRole("link", {
            name: `${copy.openOverview}: ${display.title}`,
          }),
        );
      const pdfLinks = books
        .map((book, index) => ({ book, display: displays[index] }))
        .filter(({ book }) => Boolean(book.pdfPath))
        .map(({ display }) =>
          screen.getByRole("link", {
            name: `${copy.pdfAfterLogin}: ${display.title}`,
          }),
        );
      const disclosures = Array.from(container.querySelectorAll("summary"));

      expect(disclosures).toHaveLength(displays.length);
      disclosures.forEach((disclosure, index) => {
        expect(disclosure).toHaveAccessibleName(
          `${copy.detailsLabel}: ${displays[index].title}`,
        );
      });

      const names = [...overviewLinks, ...pdfLinks, ...disclosures].map(
        (control) => control.getAttribute("aria-label"),
      );
      expect(names.every(Boolean)).toBe(true);
      expect(new Set(names).size).toBe(names.length);
    },
  );

  it("uses editorial shelves without undersized labels or generic card chrome", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/buecher/buecher-content.tsx"),
      "utf8",
    );

    expect(source).not.toContain("transition-all");
    expect(source).not.toMatch(/text-\[(?:9|10|11)(?:\.\d+)?px\]/);
    expect(source).not.toMatch(/rounded-(?:lg|xl|2xl|3xl|full)/);
    expect(source).not.toContain("copy.bridgeHeading");
    expect(source).not.toContain("dark-section");
    expect(source).not.toContain("data-book-bento");
    expect(source).toContain("bg-paper");
    expect(source).toContain("bg-brand-acid");
  });
});

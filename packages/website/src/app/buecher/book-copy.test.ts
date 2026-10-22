import { describe, expect, it } from "vitest";
import { allBooks } from "@/lib/books";
import {
  BOOK_PAGE_COPY,
  getBookDisplay,
  getBookSourceInputs,
} from "./book-copy";

describe("book locale copy", () => {
  it("provides complete English display data for every catalog record", () => {
    for (const book of allBooks) {
      const display = getBookDisplay(book, "en");
      expect(display.title).not.toBe(book.title);
      expect(display.subtitle).not.toBe("");
      expect(display.description.length).toBeGreaterThan(80);
      expect(display.highlights).toHaveLength(3);
      expect(display.resourceType).toMatch(/^HTML /);
    }
  });

  it("states the English HTML edition and German PDF boundary precisely", () => {
    const copy = BOOK_PAGE_COPY.en;
    const display = getBookDisplay(allBooks[0], "en");

    expect(copy.catalog.pdfAfterLogin(32)).toBe(
      "German PDF, 32 pages, after sign-in",
    );
    expect(copy.detail.contentsIntro).toContain("English reader");
    expect(copy.metadata.detailDescription(display)).toContain(
      "English HTML reading edition",
    );
    expect(copy.detail.pdfAfterLogin).toContain("German PDF");
  });

  it("keeps the shelf copy free of dashes used as punctuation", () => {
    for (const locale of ["de", "en"] as const) {
      const catalog = BOOK_PAGE_COPY[locale].catalog;
      const strings = [
        catalog.caps(1, 24),
        catalog.caps(2, 97),
        catalog.heading,
        catalog.lede,
        catalog.rowMeta("x", 9, 24),
        catalog.readChapter(1),
        catalog.openBook,
        catalog.pdfAfterLogin(32),
        catalog.reviewed("1 May 2026"),
        catalog.aggregates(5),
        catalog.companion,
      ];
      for (const text of strings) expect(text).not.toMatch(/[\u2013\u2014]/);
    }
    expect(BOOK_PAGE_COPY.de.catalog.caps(1, 24)).toBe(
      "Lernbücher · 1 Buch · 24 Min. Lesezeit",
    );
    expect(BOOK_PAGE_COPY.de.catalog.caps(2, 97)).toContain("2 Bücher");
    expect(BOOK_PAGE_COPY.en.catalog.caps(1, 24)).toBe(
      "Books · 1 book · 24 min read",
    );
  });

  it("keeps catalogue claims concrete and free of generic promotion", () => {
    const serialized = JSON.stringify(BOOK_PAGE_COPY);
    expect(serialized).not.toMatch(
      /revolutionary|game[- ]changing|unlock|transformative|cutting[- ]edge|world[- ]class|einzigartig|bahnbrechend/i,
    );
  });

  it("keeps the visible source record in the selected interface language", () => {
    const book = allBooks[0];

    expect(getBookSourceInputs(book, "de")).toContain(
      "Eigene Auswertung von Firmenwebsites (Aggregate, mindestens 5 Treffer je Zelle)",
    );
    expect(getBookSourceInputs(book, "en")).toContain(
      "Own analysis of company websites (aggregates, at least 5 hits per cell)",
    );
  });
});

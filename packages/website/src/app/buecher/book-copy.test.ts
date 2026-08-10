import { describe, expect, it } from "vitest";
import { allBooks } from "@/lib/books";
import { BOOK_PAGE_COPY, getBookDisplay } from "./book-copy";

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

    expect(copy.catalog.ledgerFacts).toContainEqual({
      label: "Material language",
      value: "English",
    });
    expect(copy.detail.contentsIntro).toContain("English reader");
    expect(copy.metadata.detailDescription(display)).toContain(
      "English HTML reading edition",
    );
    expect(copy.detail.pdfAfterLogin).toContain("German PDF");
  });

  it("keeps catalogue claims concrete and free of generic promotion", () => {
    const serialized = JSON.stringify(BOOK_PAGE_COPY);
    expect(serialized).not.toMatch(
      /revolutionary|game[- ]changing|unlock|transformative|cutting[- ]edge|world[- ]class|einzigartig|bahnbrechend/i,
    );
  });
});

/**
 * reader-content.test.ts (regression coverage)
 *
 * Exercises the pure content layer in `@/lib/book-reader-content` that powers
 * the book-reader components: the reading-time badge and prev/next neighbour
 * navigation (chapter-reader.tsx), plus the TOC heading slugs. These functions
 * read the real de-commercialised manifests + chapter markdown from
 * `content/books/`, so this runs in the Node.js environment (fs).
 *
 * Everything here is derived from the live content rather than hard-coded, so a
 * book-content refresh keeps it green:
 *  - neighbour nav is asserted by position (first has no prev, last has no next,
 *    a middle chapter's neighbours are its list siblings, unknown slug => none);
 *  - reading time is recomputed from the returned markdown with the exact source
 *    formula and compared;
 *  - every TOC heading id is recomputed from its own text with the exact source
 *    slug algorithm (which keeps umlauts, regression coverage fix) and compared.
 */

// @vitest-environment node

import { describe, expect, it } from "vitest";
import { books } from "@/lib/books";
import {
  getBookChapterList,
  getChapterNeighbours,
  loadBookChapter,
} from "@/lib/book-reader-content";

/** Mirror of the source slug algorithm in book-reader-content.ts. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Mirror of the source reading-time formula (200 wpm, floored, min 1). */
function expectedReadingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.floor(words / 200));
}

describe("book-reader content: neighbour navigation", () => {
  it("has no previous chapter on the first chapter and no next on the last", async () => {
    for (const book of books) {
      const chapters = await getBookChapterList(book.id, "de");
      expect(chapters.length).toBeGreaterThanOrEqual(2);

      const first = await getChapterNeighbours(book.id, chapters[0].slug, "de");
      expect(first.prev).toBeNull();
      expect(first.next?.slug).toBe(chapters[1].slug);

      const last = await getChapterNeighbours(
        book.id,
        chapters[chapters.length - 1].slug,
        "de",
      );
      expect(last.next).toBeNull();
      expect(last.prev?.slug).toBe(chapters[chapters.length - 2].slug);
    }
  });

  it("returns both list siblings for a middle chapter", async () => {
    for (const book of books) {
      const chapters = await getBookChapterList(book.id, "de");
      if (chapters.length < 3) continue;
      const midIndex = Math.floor(chapters.length / 2);
      const mid = await getChapterNeighbours(
        book.id,
        chapters[midIndex].slug,
        "de",
      );
      expect(mid.prev?.slug).toBe(chapters[midIndex - 1].slug);
      expect(mid.next?.slug).toBe(chapters[midIndex + 1].slug);
    }
  });

  it("returns null neighbours for an unknown chapter slug", async () => {
    const neighbours = await getChapterNeighbours(
      books[0].id,
      "diese-slug-existiert-nicht",
      "de",
    );
    expect(neighbours.prev).toBeNull();
    expect(neighbours.next).toBeNull();
  });
});

describe("book-reader content: reading time", () => {
  it("computes reading time with the 200-wpm floor for every chapter", async () => {
    for (const book of books) {
      const chapters = await getBookChapterList(book.id, "de");
      for (const ch of chapters) {
        const loaded = await loadBookChapter(book.id, ch.slug, "de");
        expect(loaded.readingTimeMinutes).toBe(
          expectedReadingTime(loaded.rawMarkdown),
        );
        expect(loaded.readingTimeMinutes).toBeGreaterThanOrEqual(1);
        // The badge value the reader header renders comes from meta.
        expect(loaded.meta.readingTimeMinutes).toBe(loaded.readingTimeMinutes);
      }
    }
  });
});

describe("book-reader content: TOC headings", () => {
  it("only collects level 2-3 headings (chapter-title h1 excluded from the TOC)", async () => {
    for (const book of books) {
      const chapters = await getBookChapterList(book.id, "de");
      for (const ch of chapters) {
        const loaded = await loadBookChapter(book.id, ch.slug, "de");
        for (const h of loaded.headings) {
          expect([2, 3]).toContain(h.level);
        }
      }
    }
  });

  it("slugs headings with the umlaut-preserving github-slugger algorithm", async () => {
    for (const book of books) {
      const chapters = await getBookChapterList(book.id, "de");
      for (const ch of chapters) {
        const loaded = await loadBookChapter(book.id, ch.slug, "de");
        for (const h of loaded.headings) {
          // id is derived from the heading text by the exact source algorithm:
          // lowercase, drop punctuation, keep umlauts, spaces -> dashes.
          expect(h.id).toBe(slugify(h.text));
          expect(h.id).toBe(h.id.toLowerCase());
          expect(h.id).not.toMatch(/\s/);
        }
      }
    }
  });

  it("strips the leading chapter-title h1 so the reader chrome owns the only h1", async () => {
    // The reader renders its own <h1> from the manifest title; loadBookChapter
    // removes the markdown's leading `# Titel` to avoid a duplicate-h1 (release hardening
    // stage 3 fix). The chapter title sits at the top, so the loaded markdown
    // must carry no ATX h1 in its opening lines.
    for (const book of books) {
      const chapters = await getBookChapterList(book.id, "de");
      for (const ch of chapters) {
        const loaded = await loadBookChapter(book.id, ch.slug, "de");
        const leadingH1 = loaded.rawMarkdown
          .split("\n")
          .slice(0, 10)
          .filter((line) => /^#\s+/.test(line));
        expect(leadingH1).toHaveLength(0);
      }
    }
  });
});

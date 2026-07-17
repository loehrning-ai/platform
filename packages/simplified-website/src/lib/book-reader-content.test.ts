/**
 * Anti-sales contract tests for the real imported book chapter bodies.
 *
 * These run in the Node.js environment so they can use `fs` via
 * book-reader-content.ts without a jsdom shim.
 *
 * of book-library import: verify that de-commercialised content passes the
 * body-level hygiene checks that books.test.ts enforces for book metadata.
 */

// @vitest-environment node

import { describe, expect, it } from "vitest";
import { books } from "./books";
import {
  loadBookManifest,
  getBookChapterList,
  loadBookChapter,
} from "./book-reader-content";

/**
 * Patterns that must never appear in chapter bodies (commercial DNA).
 *
 * We match only actual CTA / sales artefacts, NOT legitimate educational
 * references. Rules:
 * - Email addresses to Tim / support are always wrong in reader content.
 * - ki-transformation-check links must not appear (direct conversion funnel).
 * - "Loehrning Verlag" is a made-up publisher entity that was in the source.
 * - "Buchungsprozess" in the context of booking a call is commercial.
 * - "Termin buchen" as a CTA phrase must not appear.
 * - "Jetzt kaufen" / "Jetzt sichern" are purchase CTAs.
 * We deliberately do NOT flag "Beratungsgespräch" (used in narrative),
 * "Preisliste/n" (used as an example data type), or
 * "kostenloses Erstgespräch" (appears in a code block prompt example).
 */
const BODY_FORBIDDEN =
  /tim@loehrning\.ai|support@loehrning\.ai|ki-transformation-check|Loehrning Verlag|buchungsprozess|termin buchen|jetzt kaufen|jetzt sichern/i;

/**
 * Heuristic for remaining formal address (Sie/Ihr with capital S/I).
 * We allow at most 5 occurrences per chapter because German 3rd-person "Sie"
 * (she/they referring to a noun like "die Verordnung" or "die Checkliste")
 * is indistinguishable by regex from formal-you "Sie" and gets legitimately
 * restored when it refers to a regulation, checklist, or feature.
 * A chapter failing > 5 very likely has an unconverted block of formal address.
 */
const FORMAL_ADDRESS_RE = /\b(Sie|Ihr[e]?[nm]?|Ihnen)\b/g;
const MAX_FORMAL_PER_CHAPTER = 5;

describe("book-reader-content: imported chapter bodies", () => {
  it("all manifests can be loaded and have chapters", async () => {
    for (const book of books) {
      const manifest = await loadBookManifest(book.id);
      expect(manifest.bookSlug).toBe(book.id);
      expect(manifest.chapters.length).toBeGreaterThan(0);
    }
  });

  it("chapter counts in manifests match books.ts", async () => {
    for (const book of books) {
      const chapters = await getBookChapterList(book.id);
      expect(chapters.length).toBe(book.chapters);
    }
  });

  it("all chapter bodies are loadable and non-empty", async () => {
    for (const book of books) {
      const chapters = await getBookChapterList(book.id);
      for (const ch of chapters) {
        const loaded = await loadBookChapter(book.id, ch.slug);
        expect(loaded.rawMarkdown.length).toBeGreaterThan(100);
        expect(loaded.readingTimeMinutes).toBeGreaterThan(0);
      }
    }
  });

  it("no chapter body contains commercial / sales DNA (anti-sales contract)", async () => {
    const violations: string[] = [];

    for (const book of books) {
      const chapters = await getBookChapterList(book.id);
      for (const ch of chapters) {
        const loaded = await loadBookChapter(book.id, ch.slug);
        const match = loaded.rawMarkdown.match(BODY_FORBIDDEN);
        if (match) {
          violations.push(
            `[${book.id}/${ch.slug}] Found forbidden pattern: "${match[0]}"`
          );
        }
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Anti-sales contract violated in ${violations.length} chapter(s):\n${violations.join("\n")}`
      );
    }
  });

  it("formal address (Sie/Ihr) is mostly converted to du in ki-landschaft", async () => {
    const chapters = await getBookChapterList("ki-landschaft");
    const overLimit: string[] = [];

    for (const ch of chapters) {
      const loaded = await loadBookChapter("ki-landschaft", ch.slug);
      const matches = loaded.rawMarkdown.match(FORMAL_ADDRESS_RE) ?? [];
      if (matches.length > MAX_FORMAL_PER_CHAPTER) {
        overLimit.push(
          `[${ch.slug}] ${matches.length} formal-address occurrences (limit: ${MAX_FORMAL_PER_CHAPTER})`
        );
      }
    }

    if (overLimit.length > 0) {
      throw new Error(
        `Sie→du conversion incomplete in ${overLimit.length} chapter(s):\n${overLimit.join("\n")}`
      );
    }
  });

  it("dropped chapters are not accessible via the reader", async () => {
    // ki-landschaft dropped 06+07; ki-tools dropped 14_nachwort
    const droppedChecks: Array<{ book: string; slug: string }> = [
      { book: "ki-landschaft", slug: "06_tools" },
      { book: "ki-landschaft", slug: "07_datenschutz" },
      { book: "ki-tools-selbststaendige", slug: "14_nachwort" },
    ];

    for (const { book, slug } of droppedChecks) {
      const chapters = await getBookChapterList(book);
      const found = chapters.find((c) => c.slug === slug);
      expect(found).toBeUndefined();
    }
  });
});

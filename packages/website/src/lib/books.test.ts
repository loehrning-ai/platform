import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { allBooks, books } from "./books";

interface BookManifest {
  readonly bookSlug: string;
  readonly owner: string;
  readonly lastReviewed: string;
  readonly nextReview: string;
  readonly reviewCadence: string;
  readonly riskClass: string;
  readonly publicationStatus: "published" | "hold";
  readonly publicationReason: string;
  readonly chapters: ReadonlyArray<{
    readonly slug: string;
    readonly sourceFile: string;
  }>;
}

describe("book publication manifests", () => {
  it.each(allBooks)("keeps $id catalog, lifecycle, freshness, and chapter files aligned", (book) => {
    const directory = resolve(process.cwd(), "content", "books", book.id);
    const manifestPath = resolve(directory, "manifest.json");
    expect(existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(
      readFileSync(manifestPath, "utf8"),
    ) as BookManifest;
    expect(manifest.bookSlug).toBe(book.id);
    expect(manifest.owner).toBe(book.sourceOwner);
    expect(manifest.lastReviewed).toBe(book.lastReviewed);
    expect(manifest.nextReview).toBe(book.nextReview);
    expect(manifest.reviewCadence.trim()).not.toBe("");
    expect(manifest.riskClass.trim()).not.toBe("");
    expect(manifest.publicationStatus).toBe(book.publicationStatus);
    expect(manifest.publicationReason).toBe(book.publicationReason);
    expect(manifest.publicationReason.trim()).not.toBe("");
    expect(manifest.chapters).toHaveLength(book.chapters);

    const sourceFiles = manifest.chapters.map((chapter) => chapter.sourceFile);
    expect(new Set(sourceFiles).size).toBe(sourceFiles.length);
    expect(
      readdirSync(directory)
        .filter((file) => file.endsWith(".md"))
      .sort(),
    ).toEqual([...sourceFiles].sort());
  });

  it("routes only explicitly approved books and keeps every held title out", () => {
    expect(books).not.toHaveLength(0);
    expect(books.every((book) => book.publicationStatus === "published")).toBe(
      true,
    );
    expect(
      allBooks
        .filter((book) => book.publicationStatus === "hold")
        .every((book) => !books.some((published) => published.id === book.id)),
    ).toBe(true);
  });
});

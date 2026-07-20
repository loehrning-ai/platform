import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { books } from "./books";

interface BookManifest {
  readonly bookSlug: string;
  readonly owner: string;
  readonly lastReviewed: string;
  readonly nextReview: string;
  readonly reviewCadence: string;
  readonly riskClass: string;
  readonly chapters: ReadonlyArray<{
    readonly slug: string;
    readonly sourceFile: string;
  }>;
}

describe("book publication manifests", () => {
  it.each(books)("keeps $id catalog, freshness, and chapter files aligned", (book) => {
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
    expect(manifest.chapters).toHaveLength(book.chapters);

    const sourceFiles = manifest.chapters.map((chapter) => chapter.sourceFile);
    expect(new Set(sourceFiles).size).toBe(sourceFiles.length);
    expect(
      readdirSync(directory)
        .filter((file) => file.endsWith(".md"))
        .sort(),
    ).toEqual([...sourceFiles].sort());
  });
});

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
    readonly title: string;
    readonly sourceFile: string;
  }>;
}

describe("book publication manifests", () => {
  it.each(allBooks)(
    "keeps $id catalog, lifecycle, freshness, and chapter files aligned",
    (book) => {
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

      const sourceFiles = manifest.chapters.map(
        (chapter) => chapter.sourceFile,
      );
      expect(new Set(sourceFiles).size).toBe(sourceFiles.length);
      expect(
        readdirSync(directory)
          .filter((file) => file.endsWith(".md"))
          .sort(),
      ).toEqual([...sourceFiles].sort());
    },
  );

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

  it("keeps public status labels aligned with the publication gate", () => {
    for (const book of allBooks) {
      if (book.publicationStatus === "published") {
        expect(book.accessLabel).not.toMatch(/nicht veröffentlicht/i);
        expect(book.statusLabel).not.toMatch(/prüfung offen/i);
      } else {
        expect(book.accessLabel).toMatch(/nicht veröffentlicht/i);
        expect(book.statusLabel).toMatch(/prüfung offen/i);
      }
    }
  });

  it("keeps the published quick-start title aligned with its seven numbered steps", () => {
    const directory = resolve(
      process.cwd(),
      "content",
      "books",
      "ki-landschaft",
    );
    const germanManifest = JSON.parse(
      readFileSync(resolve(directory, "manifest.json"), "utf8"),
    ) as BookManifest;
    const englishManifest = JSON.parse(
      readFileSync(resolve(directory, "en", "manifest.json"), "utf8"),
    ) as BookManifest;
    const germanChapter = readFileSync(
      resolve(directory, "07_schnellstart.md"),
      "utf8",
    );
    const englishChapter = readFileSync(
      resolve(directory, "en", "07_schnellstart.md"),
      "utf8",
    );

    expect(
      germanManifest.chapters.find(
        (chapter) => chapter.slug === "07_schnellstart",
      )?.title,
    ).toBe("Schnellstart in sieben Schritten");
    expect(
      englishManifest.chapters.find(
        (chapter) => chapter.slug === "07_schnellstart",
      )?.title,
    ).toBe("A seven-step quick start");
    expect(germanChapter.match(/^## \d+\./gmu)).toHaveLength(7);
    expect(englishChapter.match(/^## \d+\./gmu)).toHaveLength(7);
  });
});

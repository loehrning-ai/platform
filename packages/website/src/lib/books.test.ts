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

  describe("data book ki-landschaft (Von außen gesehen)", () => {
    const directory = resolve(
      process.cwd(),
      "content",
      "books",
      "ki-landschaft",
    );
    const book = allBooks.find((entry) => entry.id === "ki-landschaft");
    const chapterSlugs = [
      "01_eisberg",
      "02_sagen_zeigen",
      "03_zweimal_gemessen",
      "04_branche_land",
      "05_reden_einstellen",
      "06_eu_ki_verordnung",
      "07_pilot",
      "08_methodik",
    ];
    const figuresPerChapter: Record<string, string[]> = {
      "01_eisberg": ["C1", "C2"],
      "02_sagen_zeigen": ["C3"],
      "03_zweimal_gemessen": ["C4", "C5"],
      "04_branche_land": ["C6", "C7", "C8", "C9"],
      "05_reden_einstellen": ["C10", "C11"],
      "06_eu_ki_verordnung": ["C12"],
      "07_pilot": ["C13", "C14"],
      "08_methodik": [],
    };

    function readChapter(language: "de" | "en", slug: string): string {
      const path =
        language === "de"
          ? resolve(directory, `${slug}.md`)
          : resolve(directory, "en", `${slug}.md`);
      return readFileSync(path, "utf8");
    }

    function wordCount(markdown: string): number {
      const prose = markdown
        .replace(/\]\([^)]*\)/gu, "]")
        .replace(/^::.*$/gmu, "")
        .replace(/\{\{[^}]*\}\}/gu, "0")
        .replace(/[|#>*]/gu, " ");
      return (prose.match(/\w[\w.,/%’'-]*/gu) ?? []).length;
    }

    it("pins title, subtitle, chapter list and the seven chapters plus method appendix", () => {
      expect(book?.title).toBe("Von außen gesehen");
      expect(book?.subtitle).toMatch(
        /^Was [\d.]+ Firmenwebsites über KI in Deutschland verraten$/u,
      );
      expect(book?.chapters).toBe(chapterSlugs.length);

      for (const manifestPath of [
        resolve(directory, "manifest.json"),
        resolve(directory, "en", "manifest.json"),
      ]) {
        const manifest = JSON.parse(
          readFileSync(manifestPath, "utf8"),
        ) as BookManifest;
        expect(manifest.chapters.map((chapter) => chapter.slug)).toEqual(
          chapterSlugs,
        );
        expect(manifest.riskClass).toBe("statistical");
      }
    });

    it("keeps each chapter heading equal to its manifest title in both languages", () => {
      for (const language of ["de", "en"] as const) {
        const manifest = JSON.parse(
          readFileSync(
            language === "de"
              ? resolve(directory, "manifest.json")
              : resolve(directory, "en", "manifest.json"),
            "utf8",
          ),
        ) as BookManifest;
        for (const chapter of manifest.chapters) {
          const heading = readChapter(language, chapter.slug)
            .split("\n")
            .find((line) => line.startsWith("# "));
          expect(heading).toBe(`# ${chapter.title}`);
        }
      }
    });

    it("keeps page count and reading time in line with the actual text", () => {
      const words = chapterSlugs
        .map((slug) => wordCount(readChapter("de", slug)))
        .reduce((sum, count) => sum + count, 0);

      expect(words).toBeGreaterThanOrEqual(4500);
      expect(words).toBeLessThanOrEqual(5500);
      expect(
        Math.abs((book?.readingTimeMinutes ?? 0) - words / 200),
      ).toBeLessThanOrEqual(3);
      expect(book?.pageCount).toBeGreaterThanOrEqual(30);
      expect(book?.pageCount).toBeLessThanOrEqual(34);
    });

    it("writes the title with the sharp s everywhere a reader sees it (außen, never aussen)", () => {
      const book = allBooks.find((b) => b.id === "ki-landschaft");
      expect(book?.title).toBe("Von außen gesehen");
      const strings = [book?.title, book?.subtitle, book?.description, book?.publicationReason];
      for (const text of strings) expect(text ?? "").not.toMatch(/aussen/i);
      for (const language of ["de", "en"] as const) {
        for (const slug of chapterSlugs) expect(readChapter(language, slug)).not.toMatch(/aussen/i);
      }
    });

    it("places the planned figures; the action box stays where the advice is concrete (chapters 1, 6, 7), other chapters vary or fold it", () => {
      for (const slug of chapterSlugs) {
        for (const language of ["de", "en"] as const) {
          const text = readChapter(language, slug);
          const figures = [...text.matchAll(/^::figure\{id="(C\d+)"\}$/gmu)].map(
            (match) => match[1],
          );
          expect(figures).toEqual(figuresPerChapter[slug]);

          const box =
            language === "de"
              ? /^> \*\*Was du tun kannst:\*\*/mu
              : /^> \*\*What you can do:\*\*/mu;
          // Not every chapter ends in the same box (it read as a template): 1, 6 and 7 keep it,
          // 2 ("Jetzt bist du dran") and 4 ("Tipp") rename it, 3 and 5 fold the advice into the last paragraph.
          if (["01_eisberg", "06_eu_ki_verordnung", "07_pilot"].includes(slug)) {
            expect(text).toMatch(box);
          } else {
            expect(text).not.toMatch(box);
          }
        }
      }
    });
  });
});

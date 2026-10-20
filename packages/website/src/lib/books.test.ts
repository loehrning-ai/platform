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
      "01_zweimal_gemessen",
      "02_textmenge",
      "03_schaufenster",
      "04_stellen_namen",
      "05_land",
      "06_stimmen",
      "07_schluessel",
      "08_dein_zug",
      "09_quellen",
    ];
    // Figures each chapter places, in reading order: ::stage and ::figure lines, lower case.
    const figuresPerChapter: Record<string, string[]> = {
      "01_zweimal_gemessen": ["h05-dots", "h05-waterfall", "h05-ladder"],
      "02_textmenge": ["h01-field", "h01-net", "h01-dose", "h01-friends"],
      "03_schaufenster": ["c3", "c3-evidence", "h04-dumbbell", "h04-field", "h07-curve"],
      "04_stellen_namen": ["h02-blocks", "h02-gap", "h02-ladder", "h03-strip", "h03-drift"],
      "05_land": ["h06-slope", "h06-region", "h10-tiles", "h10-or"],
      "06_stimmen": ["h12-null", "h11-field"],
      "07_schluessel": ["h09-field", "h08-field"],
      "08_dein_zug": [],
      "09_quellen": [],
    };
    // One pinned hero stage per insight chapter (the explorer stands in for it in chapter 8).
    const stagePerChapter: Record<string, string | null> = {
      "01_zweimal_gemessen": "h05-dots",
      "02_textmenge": "h01-net",
      "03_schaufenster": "h04-field",
      "04_stellen_namen": "h02-blocks",
      "05_land": "h06-slope",
      "06_stimmen": "h12-null",
      "07_schluessel": "h08-field",
      "08_dein_zug": null,
      "09_quellen": null,
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

    it("pins title, subtitle, chapter list and the eight insight chapters plus the sources page", () => {
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

      expect(words).toBeGreaterThanOrEqual(4000);
      expect(words).toBeLessThanOrEqual(5000);
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

    it("places the planned figures and one hero stage per insight chapter; every chapter but the sources page ends in the visible action box", () => {
      for (const slug of chapterSlugs) {
        for (const language of ["de", "en"] as const) {
          const text = readChapter(language, slug);
          const figures = [...text.matchAll(/^::(?:figure|stage)\{id="([a-z0-9-]+)"\}$/gmu)].map(
            (match) => match[1],
          );
          expect(figures, `${language} ${slug}`).toEqual(figuresPerChapter[slug]);

          const stages = [...text.matchAll(/^::stage\{id="([a-z0-9-]+)"\}$/gmu)].map((match) => match[1]);
          expect(stages, `${language} ${slug} stages`).toEqual(
            stagePerChapter[slug] === null ? [] : [stagePerChapter[slug]],
          );

          const box =
            language === "de"
              ? /^> \*\*Was du tun kannst:\*\*/mu
              : /^> \*\*What you can do:\*\*/mu;
          if (slug === "09_quellen") {
            expect(text).not.toMatch(box);
          } else {
            expect(text).toMatch(box);
          }
          // The explorer sits in chapter 8 only.
          expect(/^::explorer\{\}$/mu.test(text), `${language} ${slug} explorer`).toBe(slug === "08_dein_zug");
        }
      }
    });

    it("keeps the action box between 40 and 60 words", () => {
      for (const slug of chapterSlugs.filter((s) => s !== "09_quellen")) {
        const text = readChapter("de", slug);
        const box = text.split("\n").find((line) => line.startsWith("> **Was du tun kannst:**")) ?? "";
        const words = wordCount(box.replace("> **Was du tun kannst:**", ""));
        expect(words, slug).toBeGreaterThanOrEqual(40);
        expect(words, slug).toBeLessThanOrEqual(60);
      }
    });

    it("carries a band (numeral and claim) on every insight chapter and a cover block", () => {
      for (const language of ["de", "en"] as const) {
        const manifest = JSON.parse(
          readFileSync(
            language === "de" ? resolve(directory, "manifest.json") : resolve(directory, "en", "manifest.json"),
            "utf8",
          ),
        ) as BookManifest & {
          landing?: { facts?: unknown[]; explainer?: unknown };
          chapters: Array<{ slug: string; band?: { numeral: string; claim: string } }>;
        };
        for (const chapter of manifest.chapters) {
          if (chapter.slug === "09_quellen") continue;
          expect(chapter.band?.numeral.trim(), `${language} ${chapter.slug} numeral`).toBeTruthy();
          expect(chapter.band?.claim.trim(), `${language} ${chapter.slug} claim`).toBeTruthy();
        }
        expect(manifest.landing?.facts).toHaveLength(3);
        expect(manifest.landing?.explainer).toBeTruthy();
      }
    });
  });
});

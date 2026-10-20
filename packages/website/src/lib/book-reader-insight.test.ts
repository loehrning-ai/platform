// @vitest-environment node

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  getBookChapterListResolved,
  loadBookChapter,
  plainChapterMarkdown,
  resolveLanding,
  loadBookManifest,
} from "./book-reader-content";
import { TokenError } from "./figures";

const SLUG = "insightbook";
let root = "";

const figure = {
  id: "h05",
  kind: "bars",
  title: "Zweimal gemessen",
  alt: "Zwei Messungen derselben Seiten.",
  caption: "Anteil der Seiten mit KI-Wort.",
  n: 840,
  source: "Eigene Auswertung",
  asOf: "2026-10-18",
  limitation: "Selektion unbekannt.",
  data: { fmt: { style: "percent", digits: 0 }, items: [{ id: "lost", label: "Verschwunden", value: 46 }] },
  meta: { values: { lost: { value: 46, n: 89, fmt: { style: "percent", digits: 0 } }, ratio: { value: 62, n: 21404, fmt: { style: "number", digits: 0, unit: "x" } } } },
};

function write(file: string, content: string): void {
  mkdirSync(join(root, file, ".."), { recursive: true });
  writeFileSync(join(root, file), content);
}

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "insight-"));
  const book = `content/books/${SLUG}`;
  write(`${book}/figures/h05.json`, JSON.stringify(figure));
  write(
    `${book}/manifest.json`,
    JSON.stringify({
      bookSlug: SLUG,
      title: "Testbuch",
      landing: {
        headlineRef: "h05.lost",
        headlineTail: "der KI-Treffer fehlen beim zweiten Scan.",
        facts: [{ value: "{{h05.n}}", label: "Websites" }],
        explainer: { heading: "Was du findest", text: "{{h05.lost}} verschwinden." },
      },
      chapters: [
        { slug: "01_a", title: "Zweimal gemessen", sourceFile: "01_a.md", band: { numeral: "{{h05.lost}}", claim: "Fast jeder zweite Treffer fällt weg." } },
        { slug: "02_b", title: "Ohne Band", sourceFile: "02_b.md" },
      ],
    }),
  );
  write(`${book}/01_a.md`, '# Zweimal gemessen\n\nText.\n\n::stage{id="H05"}\n\n::explorer{}\n');
  write(`${book}/02_b.md`, "# Ohne Band\n\nText.\n");
  vi.spyOn(process, "cwd").mockReturnValue(root);
});

afterEach(() => {
  vi.spyOn(process, "cwd").mockReturnValue(root);
});

afterAll(() => {
  vi.restoreAllMocks();
  rmSync(root, { recursive: true, force: true });
});

describe("chapter band", () => {
  it("resolves number tokens in the band from the frozen figure JSON", async () => {
    const chapter = await loadBookChapter(SLUG, "01_a", "de");
    expect(chapter.meta.band).toEqual({ numeral: "46\u00a0%", claim: "Fast jeder zweite Treffer fällt weg." });
  });

  it("leaves a chapter without a band without one", async () => {
    expect((await loadBookChapter(SLUG, "02_b", "de")).meta.band).toBeUndefined();
  });

  it("resolves every band of the chapter list for the cover", async () => {
    const chapters = await getBookChapterListResolved(SLUG, "de");
    expect(chapters.map((c) => c.band?.numeral)).toEqual(["46\u00a0%", undefined]);
  });

  it("fails the build for a token that does not exist instead of printing a placeholder", async () => {
    write(
      `content/books/${SLUG}/manifest.json`,
      JSON.stringify({ bookSlug: SLUG, title: "T", chapters: [{ slug: "01_a", title: "A", sourceFile: "01_a.md", band: { numeral: "{{h05.nope}}", claim: "x" } }] }),
    );
    await expect(loadBookChapter(SLUG, "01_a", "de")).rejects.toThrow(TokenError);
  });
});

describe("landing", () => {
  it("resolves facts and the explainer from tokens and keeps the defaults for the rest", async () => {
    write(
      `content/books/${SLUG}/manifest.json`,
      JSON.stringify({
        bookSlug: SLUG,
        title: "Testbuch",
        landing: {
          headlineRef: "h05.lost",
          headlineTail: "der KI-Treffer fehlen.",
          facts: [{ value: "{{h05.n}}", label: "Websites" }],
          explainer: { heading: "Was du findest", text: "{{h05.lost}} verschwinden." },
        },
        chapters: [{ slug: "01_a", title: "A", sourceFile: "01_a.md" }],
      }),
    );
    const manifest = await loadBookManifest(SLUG, "de");
    const landing = await resolveLanding(SLUG, manifest, "de");
    expect(landing.headlineRef).toBe("h05.lost");
    expect(landing.facts).toEqual([{ value: "840", label: "Websites" }]);
    expect(landing.explainer?.text).toBe("46\u00a0% verschwinden.");
    expect(landing.explorerChapter).toBe("08_dein_zug");
  });

  it("falls back to the defaults for a manifest without a landing block", async () => {
    write(`content/books/${SLUG}/manifest.json`, JSON.stringify({ bookSlug: SLUG, title: "T", chapters: [] }));
    const landing = await resolveLanding(SLUG, await loadBookManifest(SLUG, "de"), "de");
    expect(landing).toMatchObject({ headlineRef: "c4.weighted_share", headlineTail: null, facts: [], explainer: null });
  });
});

describe("stage and explorer in plain readers", () => {
  it("describes a stage like a figure and the explorer in one line for agents and the text PDF", async () => {
    const plain = await plainChapterMarkdown(SLUG, '::stage{id="H05"}\n\n::explorer{}\n', "de");
    expect(plain).toContain("*Abbildung: Zweimal gemessen. Anteil der Seiten mit KI-Wort.*");
    expect(plain).toContain("*Werkzeug: Wo stehe ich?");
    expect(plain).not.toContain("::");
  });

  it("checks that a stage line points at a figure that exists", async () => {
    write(`content/books/${SLUG}/manifest.json`, JSON.stringify({ bookSlug: SLUG, title: "T", chapters: [{ slug: "03_c", title: "C", sourceFile: "03_c.md" }] }));
    write(`content/books/${SLUG}/03_c.md`, '# C\n\n::stage{id="H99"}\n');
    await expect(loadBookChapter(SLUG, "03_c", "de")).rejects.toThrow(/has no figure/);
  });
});

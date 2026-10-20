import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getBookChapterList, loadBookChapter } from "@/lib/book-reader-content";
import { figureIdsOf, listDirectives } from "@/lib/book-directives";
import { loadBookFigures } from "@/lib/book-figures";
import type { Locale } from "@/lib/i18n/locale";
import { renderChapterSegments } from "../chapter-markdown";
import { buildChapterFigureBlocks } from "./build-blocks";
import { blockContext, PLACEABLE_FIGURES, placementFrom, renderDirective } from "./blocks";
import { FIGURE_ANNOTATIONS } from "./annotations";

const BOOK = "ki-landschaft";

async function context(locale: Locale = "de") {
  return blockContext(await loadBookFigures(BOOK), locale);
}

const figure = (id: string) => ({ name: "figure", attrs: { id }, source: `::figure{id="${id}"}` }) as const;

describe("every figure the reader can place", () => {
  it.each(PLACEABLE_FIGURES)("%s renders as a figure with its data and limits, without script", async (id) => {
    const ctx = await context();
    const { container } = render(<>{renderDirective(ctx, figure(id))}</>);
    const root = container.querySelector("figure");
    expect(root, id).not.toBeNull();
    expect(container.innerHTML).not.toContain("Daten &amp; Grenzen");
    expect(container.querySelector("details, summary")).toBeNull();
    expect(container.querySelector("[data-source-line]"), `${id}: visible source line`).not.toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.innerHTML).not.toMatch(/\son[a-z]+=/i);
    // The finished figure is in the server markup: an svg with a title and a description.
    expect(container.querySelector("svg title")).not.toBeNull();
  });

  it("links the CSV file of the plotted numbers for every figure that has a JSON", async () => {
    const ctx = await context();
    for (const id of ["c3", "c3-evidence", "c4", "c5", "c6", "c7", "c8", "c9", "c10", "c10-bars", "c11", "c14"]) {
      const { container, unmount } = render(<>{renderDirective(ctx, figure(id))}</>);
      const hrefs = [...container.querySelectorAll("a[download]")].map((a) => a.getAttribute("href"));
      expect(hrefs.some((href) => href === `/books/${BOOK}/data/${id}.csv`), id).toBe(true);
      unmount();
    }
  });

  it("shows no provisional banner on any figure and reads no figure from the fixtures", async () => {
    const ctx = await context();
    for (const id of ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10", "c11", "c12", "c14"]) {
      const { container, unmount } = render(<>{renderDirective(ctx, figure(id))}</>);
      expect(container.textContent, id).not.toContain("Vorläufige");
      unmount();
    }
  });

  it("is case-insensitive about the id and names the known ids when one is wrong", async () => {
    const ctx = await context();
    expect(() => renderDirective(ctx, figure("C5"))).not.toThrow();
    expect(() => renderDirective(ctx, figure("c99"))).toThrow(/Known: c1/);
  });
});

describe("annotations (one per figure, on its most telling mark)", () => {
  it("are drawn into the finished figures that have one, with the number from the figure data", async () => {
    const ctx = await context();
    for (const [id, note] of Object.entries(FIGURE_ANNOTATIONS)) {
      const { container, unmount } = render(<>{renderDirective(ctx, figure(id))}</>);
      expect(container.querySelector(`[data-annotation="${note.id}"]`), id).not.toBeNull();
      unmount();
    }
    const c5 = render(<>{renderDirective(ctx, figure("c5"))}</>);
    expect(c5.container.textContent).toContain("Faktor 62 (35 bis 166)");
    expect(c5.container.textContent).toMatch(/8\s*Treffern/);
    // The leader meets the tall last bar near its top, not in its middle.
    const bar = c5.container.querySelector('g[data-id="q5"] rect');
    const leader = c5.container.querySelector('[data-annotation="q5"] line');
    expect(bar).not.toBeNull();
    expect(leader).not.toBeNull();
    const top = Number(bar?.getAttribute("y"));
    const mid = top + Number(bar?.getAttribute("height")) / 2;
    expect(Number(leader?.getAttribute("y1"))).toBeLessThan(mid);
    c5.unmount();
  });

  it("point at elements that exist in their figure", async () => {
    const figures = await loadBookFigures(BOOK);
    for (const [id, note] of Object.entries(FIGURE_ANNOTATIONS)) {
      const spec = figures.specs.get(id);
      expect(JSON.stringify(spec?.data), id).toContain(`"id":"${note.id}"`);
    }
  });
});

describe("the C4 story and the C14 placement take their words and data from the book", () => {
  it("builds one step card per step of the figure, with the numbers of the data", async () => {
    const ctx = await context();
    const { container } = render(<>{renderDirective(ctx, figure("c4"))}</>);
    expect(container.querySelectorAll("[data-step-index]")).toHaveLength(4);
    const text = container.textContent ?? "";
    expect(text).toContain("8,2");
    expect(text).toContain("3,8");
    expect(text).not.toMatch(/\{\{/);
  });

  it("turns the c14 dotplot into a lookup of industries and regions", async () => {
    const figures = await loadBookFigures(BOOK);
    const c14 = figures.specs.get("c14");
    if (!c14 || c14.kind !== "dotplot") throw new Error("c14 missing");
    const data = placementFrom(c14, { nord: "SH, HH, HB, NI", ost: "", west: "", sued: "" });
    expect(data.regions.map((r) => r.id)).toEqual(["nord", "ost", "west", "sued"]);
    expect(data.regions[0]?.label).toBe("Nord");
    expect(data.industries.map((i) => i.id)).toContain("bau");
    expect(data.industries.every((i) => !/alle Regionen/.test(i.label))).toBe(true);
    // A cell below the floor carries no number and no hits.
    expect(data.cells["beratung|ost"]).toMatchObject({ value: null, hits: null });
    expect(data.cells["bau|all"]?.value).toBeCloseTo(1.45, 2);
    expect(data.overall.n).toBe(17034);
  });
});

describe("the ticker opener", () => {
  it("builds the big number from a token reference", async () => {
    const ctx = await context();
    const directive = {
      name: "ticker",
      attrs: { ref: "c4.weighted_share", tail: "der Firmen mit auffindbarer Website schreiben KI." },
      source: "::ticker{...}",
    } as const;
    const { container } = render(<>{renderDirective(ctx, directive)}</>);
    expect(container.textContent).toContain("3,8");
    expect(container.textContent).toContain("95-%-Intervall 3,6 bis 4,1");
    expect(container.textContent).toContain("n = 24.944");
  });

  it("fails for a reference to nothing", async () => {
    const ctx = await context();
    expect(() => renderDirective(ctx, { name: "ticker", attrs: { ref: "c99.x", tail: "t" }, source: "" })).toThrow(/ref/);
  });
});

describe.each(["de", "en"] as const)("every chapter of the data book (%s)", (locale) => {
  it("resolves all tokens, finds every figure and builds all islands", async () => {
    const chapters = await getBookChapterList(BOOK, locale);
    expect(chapters.length).toBeGreaterThan(0);
    for (const meta of chapters) {
      const chapter = await loadBookChapter(BOOK, meta.slug, locale);
      expect(chapter.rawMarkdown, meta.slug).not.toMatch(/\{\{[^}]*\}\}/);
      const segments = renderChapterSegments({ rawMarkdown: chapter.rawMarkdown, locale });
      // A figure is placeable through its own builder (the v0 islands) or, for the insight spine, through the generic hero island.
      const figures = await loadBookFigures(BOOK);
      for (const id of figureIdsOf(chapter.rawMarkdown)) {
        expect([...PLACEABLE_FIGURES, ...figures.specs.keys()], `${meta.slug}: ${id}`).toContain(id);
      }
      const blocks = await buildChapterFigureBlocks(BOOK, locale, segments);
      expect(blocks).toHaveLength(segments.length);
      segments.forEach((segment, i) => {
        expect(blocks[i] !== null, `${meta.slug}[${i}]`).toBe(segment.kind === "directive");
      });
      // Directive lines never reach the HTML of a text run.
      for (const segment of segments) {
        if (segment.kind === "html") expect(segment.html, meta.slug).not.toContain("::figure");
      }
      expect(listDirectives(chapter.rawMarkdown).length).toBe(segments.filter((s) => s.kind === "directive").length);
    }
  });
});

describe("the reader never prints a fixture", () => {
  it("does not import the provisional fixtures of the story islands", () => {
    const source = readFileSync(join(__dirname, "blocks.tsx"), "utf8");
    expect(source).not.toContain("fixtures.provisional");
    expect(source).not.toMatch(/\bC(?:1_LADDER|2_ICEBERG|12_TIMELINE|14_PLACEMENT)\b/);
  });
});

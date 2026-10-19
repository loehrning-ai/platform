import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { Book } from "@/lib/books";
import type { LoadedChapter } from "@/lib/book-reader-content";
import { renderChapterSegments, renderChapterMarkdownHtml } from "./chapter-markdown";
import { BookCoverHero } from "./cover-hero";
import { loadBookFigures } from "@/lib/book-figures";

vi.mock("./chapter-reader-client", () => ({
  ChapterReaderClient: () => <span data-testid="reader-ready-marker" />,
  ChapterTocLinks: () => <ul data-testid="toc-links" />,
}));

import { ChapterReader } from "./chapter-reader";

const BOOK = { id: "ki-landschaft", relatedResourceHref: "/eu-ai-act-kurs", pdfPath: null } as unknown as Book;

const MARKDOWN = [
  "## Erster Abschnitt",
  "",
  "Text vor der Abbildung.",
  "",
  '::figure{id="C5"}',
  "",
  "## Erster Abschnitt",
  "",
  "Text nach der Abbildung.",
  "",
  "```",
  '::figure{id="C99"}',
  "```",
  "",
  "> **Was du tun kannst:** Zähle nach.",
].join("\n");

const chapter = (rawMarkdown: string): LoadedChapter => ({
  meta: { slug: "03_test", title: "Testkapitel", sourceFile: "03_test.md" },
  rawMarkdown,
  headings: [],
  readingTimeMinutes: 1,
});

const reader = (rawMarkdown: string, extra: Record<string, unknown> = {}) => (
  <ChapterReader
    book={BOOK}
    chapter={chapter(rawMarkdown)}
    neighbours={{ prev: null, next: null }}
    allChapters={[chapter(rawMarkdown).meta]}
    locale="de"
    bookTitle="Von außen gesehen"
    relatedResourceLabel="Kurs"
    {...extra}
  />
);

describe("renderChapterSegments", () => {
  it("cuts the chapter at its figure lines and keeps heading ids unique across the cuts", () => {
    const segments = renderChapterSegments({ rawMarkdown: MARKDOWN, locale: "de" });
    expect(segments.map((s) => s.kind)).toEqual(["html", "directive", "html"]);
    const [first, , last] = segments;
    expect(first?.kind === "html" && first.html).toContain('id="erster-abschnitt"');
    expect(last?.kind === "html" && last.html).toContain('id="erster-abschnitt-1"');
  });

  it("does not cut at a directive inside a code fence and never prints the directive line", () => {
    const segments = renderChapterSegments({ rawMarkdown: MARKDOWN, locale: "de" });
    const html = segments.filter((s) => s.kind === "html").map((s) => (s.kind === "html" ? s.html : ""));
    expect(html.join("")).toContain("C99");
    expect(html.join("")).not.toContain("::figure{id=&#x22;C5&#x22;}");
  });

  it("styles the closing box and marks it for tests and print", () => {
    const html = renderChapterMarkdownHtml({ rawMarkdown: MARKDOWN, locale: "de" });
    expect(html).toContain('data-endbox="true"');
    expect(html).toContain("border-[var(--color-brand-orange)]");
  });

  it("returns one html segment for a chapter without directives", () => {
    const segments = renderChapterSegments({ rawMarkdown: "Nur Text.", locale: "de" });
    expect(segments).toHaveLength(1);
  });
});

describe("ChapterReader with figures", () => {
  it("lays out 68ch text runs and 1120px figure breakouts inside one article, with no script", () => {
    const segments = renderChapterSegments({ rawMarkdown: MARKDOWN, locale: "de" });
    const { container } = render(
      reader(MARKDOWN, { segments, figureBlocks: [null, <figure key="f" data-testid="the-figure">Abbildung</figure>, null] }),
    );
    const article = screen.getByRole("article", { name: "Testkapitel" });
    expect(article).toHaveAttribute("data-book-figures", "true");
    expect(article.querySelectorAll(":scope > div.max-w-\\[68ch\\]")).toHaveLength(2);
    const breakout = article.querySelector("[data-book-figure='figure']");
    expect(breakout).toHaveClass("max-w-[1120px]");
    expect(breakout).toContainElement(screen.getByTestId("the-figure"));
    // The wrapper widens only for chapters with figures; the header lines up with the text column.
    expect(container.querySelector("[data-reader='focus']")).toHaveClass("max-w-[1424px]");
    expect(container.querySelector("script")).toBeNull();
  });

  it("keeps the old layout for a chapter without figures", () => {
    const { container } = render(reader("Nur Text."));
    expect(screen.getByRole("article", { name: "Testkapitel" })).toHaveClass("max-w-[70ch]");
    expect(container.querySelector("[data-reader='focus']")).toHaveClass("max-w-6xl");
    expect(container.querySelector("[data-book-figures]")).toBeNull();
  });
});

describe("BookCoverHero", () => {
  it("shows the headline number of the data, marks that many dots and carries a text alternative", async () => {
    const spec = (await loadBookFigures("ki-landschaft")).lookup("c4");
    if (!spec) throw new Error("c4 missing");
    const { container } = render(<BookCoverHero spec={spec} />);
    expect(screen.getByText("3,8 %")).toBeInTheDocument();
    expect(container.querySelectorAll("circle.bk-dot:not(.bk-dot--marked)")).toHaveLength(100);
    // 3,8 is three whole dots and one dot filled to 80 percent, never four full dots.
    const marked = [...container.querySelectorAll("circle.bk-dot--marked")];
    expect(marked).toHaveLength(4);
    const full = marked.filter((dot) => !dot.classList.contains("bk-dot--part"));
    expect(full).toHaveLength(3);
    const part = marked.find((dot) => dot.classList.contains("bk-dot--part"));
    expect(Number(part?.getAttribute("r"))).toBeCloseTo(Number(full[0]?.getAttribute("r")) * Math.sqrt(0.8), 1);
    expect(container.textContent).toContain("knapp 4");
    expect(screen.getByRole("img")).toHaveAccessibleName(/100 Punkte.*3 sind ganz hervorgehoben und einer zu 80 Prozent/);
    expect(container.textContent).not.toContain("Vorläufig");
    expect(container.querySelector("script")).toBeNull();
  });

  it("follows the data: another value moves the number and the dots", async () => {
    const spec = (await loadBookFigures("ki-landschaft")).lookup("c4");
    if (!spec || spec.kind !== "waterfall") throw new Error("c4 missing");
    const changed = JSON.parse(JSON.stringify(spec)) as typeof spec;
    (changed.data.items.find((i) => i.id === "weighted_total") as { value: number }).value = 6.2;
    const { container } = render(<BookCoverHero spec={changed} />);
    expect(screen.getByText("6,2 %")).toBeInTheDocument();
    expect(container.querySelectorAll("circle.bk-dot--marked")).toHaveLength(7);
    expect(container.querySelectorAll("circle.bk-dot--part")).toHaveLength(1);
    expect(container.textContent).toContain("gut 6");
  });
});

describe("cover hero motion contract", () => {
  const css = readFileSync(join(__dirname, "cover-hero.css"), "utf8");

  it("animates only inside the no-preference query, once, with transform and opacity", () => {
    const outside = css.replace(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}\n/, "");
    expect(outside).not.toMatch(/animation\s*:/);
    expect(css).not.toMatch(/infinite/);
    expect(css).not.toMatch(/transition\s*:\s*all/);
    for (const frames of css.match(/@keyframes[^{]+\{[\s\S]*?\n\}\n/g) ?? []) {
      expect(frames.replace(/@keyframes[^{]+\{/, "")).not.toMatch(/\b(?:width|height|top|left|margin|fill|stroke)\s*:/);
    }
  });
});

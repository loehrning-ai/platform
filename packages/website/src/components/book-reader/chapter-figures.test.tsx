import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Book } from "@/lib/books";
import type { LoadedChapter } from "@/lib/book-reader-content";
import { renderChapterSegments, renderChapterMarkdownHtml } from "./chapter-markdown";

vi.mock("./chapter-reader-client", () => ({
  ChapterReaderClient: () => <span data-testid="reader-ready-marker" />,
  ChapterTocLinks: () => <ul data-testid="toc-links" />,
}));

import { ChapterReader } from "./chapter-reader";

// The plain layout (figures break out of a 68ch column). The insight layout is covered in chapter-insight.test.tsx.
const BOOK = { id: "ki-arbeitsalltag", relatedResourceHref: "/eu-ai-act-kurs", pdfPath: null } as unknown as Book;

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

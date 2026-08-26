import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Book } from "@/lib/books";
import type { LoadedChapter } from "@/lib/book-reader-content";

const readerClientMocks = vi.hoisted(() => ({
  runtime: vi.fn(),
}));

vi.mock("./chapter-reader-client", () => ({
  ChapterReaderClient: (props: Record<string, unknown>) => {
    readerClientMocks.runtime(props);
    return (
      <span
        data-testid="reader-ready-marker"
        data-book-reader-runtime={`${String(props.bookId)}:${String(props.chapterSlug)}`}
      />
    );
  },
  ChapterTocLinks: ({
    headings,
  }: {
    readonly headings: readonly { id: string; text: string }[];
  }) => (
    <ul data-testid="toc-links">
      {headings.map((heading) => (
        <li key={heading.id}>
          <a href={`#${heading.id}`}>{heading.text}</a>
        </li>
      ))}
    </ul>
  ),
}));

import { ChapterReader } from "./chapter-reader";

const BOOK = {
  id: "ki-landschaft",
  relatedResourceHref: "/eu-ai-act-kurs",
  pdfPath: "/api/buecher/ki-landschaft/download.pdf",
} as Book;

const CHAPTER: LoadedChapter = {
  meta: {
    slug: "01_eisberg",
    title: "The iceberg problem",
    sourceFile: "01_eisberg.md",
  },
  rawMarkdown: [
    "> **Note:** Read the evidence.",
    "",
    "[Course](/eu-ai-act-kurs)",
    "",
    "[Source](https://example.com/source)",
    "",
    "| Measure | Result |",
    "|---|---|",
    "| Exposure | Limited |",
  ].join("\n"),
  headings: [],
  readingTimeMinutes: 1,
};

describe("ChapterReader locale-aware server shell", () => {
  beforeEach(() => {
    readerClientMocks.runtime.mockReset();
  });

  it("localizes English internal content links and table accessibility", () => {
    render(
      <ChapterReader
        book={BOOK}
        chapter={CHAPTER}
        neighbours={{ prev: null, next: null }}
        allChapters={[CHAPTER.meta]}
        locale="en"
        bookTitle="AI in German SMEs"
        relatedResourceLabel="Open the EU AI Act course"
      />,
    );

    expect(readerClientMocks.runtime).toHaveBeenCalledOnce();
    expect(readerClientMocks.runtime.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        bookId: "ki-landschaft",
        chapterSlug: "01_eisberg",
        locale: "en",
      }),
    );
    expect(readerClientMocks.runtime.mock.calls[0]?.[0]).not.toHaveProperty(
      "children",
    );
    const article = screen.getByRole("article", {
      name: "The iceberg problem",
    });
    const runtime = screen.getByTestId("reader-ready-marker");
    expect(article).toBeVisible();
    expect(article).toHaveClass("max-w-[70ch]");
    expect(runtime).toHaveAttribute(
      "data-book-reader-runtime",
      "ki-landschaft:01_eisberg",
    );
    expect(
      article.compareDocumentPosition(runtime) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByTestId("toc-links")).toBeVisible();
    expect(screen.getByRole("link", { name: "Course" })).toHaveAttribute(
      "href",
      "/en/eu-ai-act-kurs",
    );
    expect(screen.getByRole("link", { name: "Source" })).toHaveAttribute(
      "href",
      "https://example.com/source",
    );
    expect(
      screen.getByRole("group", { name: "Table, horizontally scrollable" }),
    ).toHaveAttribute("data-horizontal-scroll");
    expect(screen.getByRole("note", { name: "Note" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Books" })).toHaveAttribute(
      "href",
      "/en/buecher",
    );
    expect(screen.getByRole("link", { name: "Books" })).toHaveClass("min-h-11");
    expect(screen.getByText("Chapter 1 of 1")).toBeVisible();
    expect(screen.getByText("Reading time: approx. 1 minute")).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: "Back to the course: Open the EU AI Act course",
      }),
    ).toHaveAttribute("href", "/en/eu-ai-act-kurs");
    expect(
      screen.getByRole("link", {
        name: "Back to the course: Open the EU AI Act course",
      }),
    ).toHaveClass("min-h-11");
  });

  it("retains canonical German content links and table label", () => {
    render(
      <ChapterReader
        book={BOOK}
        chapter={CHAPTER}
        neighbours={{ prev: null, next: null }}
        allChapters={[CHAPTER.meta]}
        locale="de"
        bookTitle="KI im deutschen Mittelstand"
        relatedResourceLabel="EU AI Act Kurs öffnen"
      />,
    );

    expect(screen.getByRole("link", { name: "Course" })).toHaveAttribute(
      "href",
      "/eu-ai-act-kurs",
    );
    expect(
      screen.getByRole("group", { name: "Tabelle, horizontal scrollbar" }),
    ).toBeVisible();
  });

  it("keeps the reader compact, printable, and free of decorative chrome", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/book-reader/chapter-reader.tsx"),
      "utf8",
    );

    expect(source).toContain("max-w-[70ch]");
    expect(source).toContain("dangerouslySetInnerHTML");
    expect(source).toContain("no-print");
    expect(source).not.toMatch(/text-\[(?:9|10|11)(?:\.\d+)?px\]/);
    expect(source).not.toMatch(/shadow-|motion-safe|animate-|transition-all/);
  });
});

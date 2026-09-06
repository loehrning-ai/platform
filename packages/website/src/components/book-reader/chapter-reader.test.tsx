import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Book } from "@/lib/books";
import type {
  BookChapterMeta,
  LoadedChapter,
} from "@/lib/book-reader-content";

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
    // The contents list renders twice: the desktop sidebar at lg and the
    // sheet in the compact reader bar below it.
    const tocLists = screen.getAllByTestId("toc-links");
    expect(tocLists).toHaveLength(2);
    expect(tocLists[0]).toBeVisible();
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
    // The chapter header states the position; the reader bar repeats the same
    // sentence for assistive technology, so scope the copy lock to the header.
    const header = screen.getByRole("heading", { level: 1 }).closest("header");
    expect(header).not.toBeNull();
    expect(within(header!).getByText("Chapter 1 of 1")).toBeVisible();
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
    // Reader focus mode is static markup on the wrapper this route owns.
    expect(source).toContain('data-reader="focus"');
  });
});

const NEXT_CHAPTER: BookChapterMeta = {
  slug: "02_methodik",
  title: "Method",
  sourceFile: "02_methodik.md",
};

describe("ChapterReader focus mode and compact reader bar", () => {
  it("marks the route wrapper as reader focus mode in the server markup", () => {
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

    const wrapper = document.querySelector('[data-reader="focus"]');
    expect(wrapper).not.toBeNull();
    expect(document.querySelectorAll('[data-reader="focus"]')).toHaveLength(1);
    expect(wrapper).toContainElement(
      screen.getByRole("article", { name: "The iceberg problem" }),
    );
    // The desktop TOC region keeps its landmark and stays hidden below lg.
    expect(
      screen.getByRole("complementary", { name: "Kapitelinhalt" })
        .parentElement,
    ).toHaveClass("hidden", "lg:block");
  });

  it("states the position, offers the contents sheet and falls back to the overview on the last chapter", () => {
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

    const bar = document.querySelector<HTMLElement>("[data-reader-focus-bar]");
    expect(bar).not.toBeNull();
    expect(bar).toHaveClass("fixed", "bottom-0", "lg:hidden", "no-print");
    expect(within(bar!).getByText("1 / 1")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(within(bar!).getByText("Chapter 1 of 1")).toHaveClass("sr-only");

    const sheet = bar!.querySelector<HTMLDetailsElement>(
      "[data-chapter-toc-sheet]",
    );
    expect(sheet).not.toBeNull();
    expect(sheet!.open).toBe(false);
    expect(sheet!.querySelector("summary")).toHaveTextContent("Contents");
    expect(within(sheet!).getByText("In this chapter")).toBeInTheDocument();
    expect(
      within(sheet!).getByRole("navigation", { name: "Chapter contents" }),
    ).toContainElement(within(sheet!).getByTestId("toc-links"));
    expect(
      within(sheet!).getByRole("link", { name: "All chapters" }),
    ).toHaveAttribute("href", "/en/buecher/ki-landschaft");
    expect(
      within(sheet!).getByText(
        "The reader is the maintained reading edition. Signed-in users can find the German PDF on the book overview.",
      ),
    ).toBeInTheDocument();

    const overview = within(bar!).getByRole("link", {
      name: "Chapter overview",
    });
    expect(overview).toHaveTextContent("Overview");
    expect(overview).toHaveAttribute("href", "/en/buecher/ki-landschaft");
    expect(overview).toHaveClass("min-h-11");
  });

  it("links the bar's next action to the following chapter under a name that starts with the label", () => {
    render(
      <ChapterReader
        book={BOOK}
        chapter={CHAPTER}
        neighbours={{ prev: null, next: NEXT_CHAPTER }}
        allChapters={[CHAPTER.meta, NEXT_CHAPTER]}
        locale="de"
        bookTitle="KI im deutschen Mittelstand"
        relatedResourceLabel="EU AI Act Kurs öffnen"
      />,
    );

    const bar = document.querySelector<HTMLElement>("[data-reader-focus-bar]");
    expect(within(bar!).getByText("1 / 2")).toBeInTheDocument();
    expect(within(bar!).getByText("Kapitel 1 von 2")).toHaveClass("sr-only");
    expect(bar!.querySelector("summary")).toHaveTextContent("Inhalt");

    const next = within(bar!).getByRole("link", { name: "Weiter: Method" });
    expect(next).toHaveTextContent("Weiter");
    expect(next).toHaveAttribute("href", "/buecher/ki-landschaft/02_methodik");
    expect(
      within(bar!).queryByRole("link", { name: "Kapitelübersicht" }),
    ).toBeNull();

    // The chapter navigation keeps its own, richer next link untouched.
    expect(
      screen.getByRole("link", { name: "Nächstes Kapitel: Method" }),
    ).toHaveAttribute("href", "/buecher/ki-landschaft/02_methodik");
  });
});

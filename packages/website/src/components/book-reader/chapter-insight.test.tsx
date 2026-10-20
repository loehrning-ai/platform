import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Book } from "@/lib/books";
import type { BookChapterMeta, LoadedChapter } from "@/lib/book-reader-content";

vi.mock("./chapter-reader-client", () => ({
  ChapterReaderClient: () => <span data-testid="reader-ready-marker" />,
  ChapterTocLinks: () => <ul data-testid="toc-links" />,
}));
vi.mock("./stage/stage-enhancer", () => ({ StageEnhancer: () => null }));

import { ChapterReader } from "./chapter-reader";
import { renderChapterSegments } from "./chapter-markdown";
import { ChapterStage } from "./stage/chapter-stage";

const BOOK = { id: "ki-landschaft", relatedResourceHref: "/eu-ai-act-kurs", pdfPath: null } as unknown as Book;

const CHAPTERS: BookChapterMeta[] = [
  { slug: "01_zweimal_gemessen", title: "Zweimal gemessen", sourceFile: "a.md" },
  { slug: "02_textmenge", title: "Wer viel schreibt, schreibt KI", sourceFile: "b.md", band: { numeral: "62x", claim: "Bei gleicher Textmenge halbiert sich das Netz." } },
  { slug: "03_schaufenster", title: "Im Schaufenster", sourceFile: "c.md" },
];

const MARKDOWN = [
  "Ein kurzer Text vor der Bühne.",
  "",
  '::stage{id="H01"}',
  "",
  "Ein kurzer Text nach der Bühne.",
  "",
  "> **Was du tun kannst:** Prüfe deine eigene Startseite.",
].join("\n");

const chapter = (rawMarkdown: string, index = 1): LoadedChapter => ({
  meta: CHAPTERS[index] as BookChapterMeta,
  rawMarkdown,
  headings: [],
  readingTimeMinutes: 1,
});

function insight(rawMarkdown: string, index = 1, locale: "de" | "en" = "de") {
  const segments = renderChapterSegments({ rawMarkdown, locale });
  const stage = (
    <ChapterStage
      id="h01"
      label="Textmenge"
      steps={[
        { id: "a", label: "A", text: "Erster Satz.", numeral: "62x", claim: "Wer viel schreibt, schreibt KI" },
        { id: "b", label: "B", text: "Zweiter Satz.", numeral: "224" },
      ]}
      source={{ id: "h01", n: 21402, asOf: "2026-10-18", limitation: "Grenze.", sourceLine: "n = 21.402 · Grenze: Zusammenhang" }}
    >
      <svg />
    </ChapterStage>
  );
  const blocks = segments.map((s) => (s.kind === "directive" ? stage : null));
  return render(
    <ChapterReader
      book={BOOK}
      chapter={chapter(rawMarkdown, index)}
      neighbours={{ prev: CHAPTERS[index - 1] ?? null, next: CHAPTERS[index + 1] ?? null }}
      allChapters={CHAPTERS}
      locale={locale}
      bookTitle="Von außen gesehen"
      relatedResourceLabel="Kurs"
      segments={segments}
      figureBlocks={blocks}
    />,
  );
}

describe("ChapterReader, insight layout", () => {
  it("opens with the poster band: caps line with the chapter only (no bare figure), the title as the one h1, the claim", () => {
    const { container } = insight(MARKDOWN);
    const band = container.querySelector("[data-cover-band]")!;
    expect(band).toHaveAttribute("data-plakat", "lemons");
    expect(band).toHaveTextContent("Kapitel 2 von 3");
    for (const caps of band.querySelectorAll(".plakat-caps")) expect(caps.textContent).toBe("Kapitel 2 von 3");
    expect(screen.getByRole("heading", { level: 1, name: "Wer viel schreibt, schreibt KI" })).toBeVisible();
    expect(band).toHaveTextContent("Bei gleicher Textmenge halbiert sich das Netz.");
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    // A short numeral is also the poster art (decorative, wide screens only); the stage states the number.
    expect(band.querySelector("[data-poster-numeral]")).toHaveAttribute("aria-hidden", "true");
  });

  it("falls back to a title-only band for a chapter without a band", () => {
    const { container } = insight(MARKDOWN, 0);
    const band = container.querySelector("[data-cover-band]")!;
    expect(band).toHaveTextContent("Kapitel 1 von 3");
    expect(band.querySelector("[data-poster-numeral]")).toBeNull();
  });

  it("follows the anatomy: band (with the pause switch and the way back), the stage first, its text after it, Was du tun kannst, chapter list", () => {
    const { container } = insight(MARKDOWN);
    const wrapper = container.querySelector("[data-insight-chapter]")!;
    expect(wrapper).toHaveClass("cs-chapter");
    expect(wrapper).toHaveAttribute("data-reader", "focus");
    const order = ["[data-cover-band]", "article", "[data-chapter-stage]", "[data-endbox]", "[data-chapter-list]"].map((selector) => {
      const node = wrapper.querySelector(selector);
      expect(node, selector).not.toBeNull();
      return node as Element;
    });
    for (let i = 0; i < order.length - 1; i += 1) {
      if (order[i]!.contains(order[i + 1]!)) continue;
      expect(order[i]!.compareDocumentPosition(order[i + 1]!) & Node.DOCUMENT_POSITION_FOLLOWING, `${i}`).toBeTruthy();
    }
    expect(screen.getByRole("note", { name: "Was du tun kannst" })).toBeVisible();
    // On a phone the band is the one chrome row: the pause switch and the way back sit inside it.
    const band = wrapper.querySelector("[data-cover-band]")!;
    expect(band.querySelector("[data-chapter-pause]")).not.toBeNull();
    expect(band.querySelector("[data-chapter-back]")).toHaveAttribute("href", "/buecher/ki-landschaft");
  });

  it("opens with the stage: the text that introduces it reads right below it, and the way back is one short line", () => {
    const { container } = insight(MARKDOWN);
    const stage = container.querySelector("[data-chapter-stage]")!;
    const intro = screen.getByText("Ein kurzer Text vor der Bühne.");
    expect(stage.compareDocumentPosition(intro) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const back = screen.getByRole("navigation", { name: "Brotkrümelnavigation" });
    expect(within(back).getAllByRole("link")).toHaveLength(1);
    expect(back.className).not.toMatch(/mono/);
    // No course-funnel strip and no mono chrome on a book page.
    expect(container.textContent ?? "").not.toMatch(/Stufe/i);
  });

  it("offers the chapter pause switch as a native switch only when the chapter has a stage", () => {
    insight(MARKDOWN);
    const toggle = screen.getByRole("switch", { name: "Bewegung anhalten" });
    expect(toggle).toHaveProperty("type", "checkbox");
    expect(toggle).not.toBeChecked();
  });

  it("has no pause switch in a chapter without a stage", () => {
    const { container } = insight("Nur Text.\n\n> **Was du tun kannst:** Zähle.", 2);
    expect(container.querySelector("[data-chapter-pause]")).toBeNull();
    expect(container.querySelector("[data-chapter-stage]")).toBeNull();
  });

  it("replaces the contents sheet with a visible list of every chapter, the current one marked", () => {
    const { container } = insight(MARKDOWN);
    const list = screen.getByRole("navigation", { name: "Alle Kapitel des Buchs" });
    const links = within(list).getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[1]).toHaveAttribute("aria-current", "page");
    expect(links[0]).toHaveAttribute("href", "/buecher/ki-landschaft/01_zweimal_gemessen");
    expect(list).toBeVisible();
    expect(container.querySelector("details, summary, [data-chapter-toc-sheet]")).toBeNull();
    const bar = document.querySelector("[data-reader-focus-bar]")!;
    // The counter says what it counts: a chapter, never a bare fraction that reads like a step.
    expect(within(bar as HTMLElement).getByText("Kapitel 2 von 3")).toBeInTheDocument();
    expect(within(bar as HTMLElement).getByRole("link", { name: /Nächstes Kapitel: Im Schaufenster/ })).toHaveAttribute("href", "/buecher/ki-landschaft/03_schaufenster");
  });

  it("keeps the previous and next chapter links and the reader runtime after all server markup", () => {
    const { container } = insight(MARKDOWN);
    expect(screen.getByRole("link", { name: "Vorheriges Kapitel: Zweimal gemessen" })).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Nächstes Kapitel: Im Schaufenster" })[0]).toBeVisible();
    const marker = screen.getByTestId("reader-ready-marker");
    const article = container.querySelector("article")!;
    expect(article.compareDocumentPosition(marker) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("has no sidebar of headings and no reading-time line on the insight layout, and speaks English on /en", () => {
    insight(MARKDOWN, 1, "en");
    expect(screen.queryByTestId("toc-links")).toBeNull();
    expect(screen.queryByText(/Lesezeit|Reading time/)).toBeNull();
    expect(document.querySelector("[data-cover-band]")).toHaveTextContent("Chapter 2 of 3");
    expect(screen.getByRole("switch", { name: "Pause motion" })).toBeInTheDocument();
  });
});

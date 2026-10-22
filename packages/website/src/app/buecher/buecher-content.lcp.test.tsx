import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { allBooks } from "@/lib/books";
import type { BookChapterMeta } from "@/lib/book-reader-content";
import type { Locale } from "@/lib/i18n/locale";
import { BuecherContent, type ShelfEntry } from "./buecher-content";
import { BOOK_PAGE_COPY, getBookDisplay } from "./book-copy";

const [landschaft, arbeitsalltag] = allBooks as [
  (typeof allBooks)[number],
  (typeof allBooks)[number],
];

function chaptersFor(bookId: string, count: number): BookChapterMeta[] {
  return Array.from({ length: count }, (_, index) => ({
    slug: `${String(index + 1).padStart(2, "0")}_${bookId}`,
    title: `${bookId} chapter ${index + 1}`,
    sourceFile: `${index + 1}.md`,
    band:
      index === 0
        ? { kicker: "", numeral: "46 %", claim: "", ref: "" }
        : undefined,
  })) as BookChapterMeta[];
}

/** Two rows: an insight book with a headline, and one without (field only, subtitle hook). */
function entries(locale: Locale): ShelfEntry[] {
  return [
    {
      book: landschaft,
      display: getBookDisplay(landschaft, locale),
      chapters: chaptersFor(landschaft.id, 9),
      headline: {
        value: locale === "de" ? "3,8 %" : "3.8%",
        share: 0.038,
        tail: "of the homepages of firms with their own domain write the word AI.",
      },
    },
    {
      book: arbeitsalltag,
      display: getBookDisplay(arbeitsalltag, locale),
      chapters: chaptersFor(arbeitsalltag.id, 3),
      headline: null,
    },
  ];
}

function renderShelf(locale: Locale, accountEnabled = false) {
  return render(
    <BuecherContent
      accountEnabled={accountEnabled}
      locale={locale}
      entries={entries(locale)}
    />,
  );
}

const SOURCE = readFileSync(
  resolve(process.cwd(), "src/app/buecher/buecher-content.tsx"),
  "utf8",
);

describe("BuecherContent, the shelf", () => {
  it("is server markup with no collapse, dialog or motion library", () => {
    expect(SOURCE).not.toMatch(/^\s*["']use client["']/);
    expect(SOURCE).not.toContain("framer-motion");
    expect(SOURCE).not.toMatch(/<details|<summary|<dialog|aria-expanded/);
    expect(SOURCE).not.toContain("book-teaser");
    expect(SOURCE).not.toContain("next/image");
  });

  it("puts the H1 in the Lemons band with the caps line stating the band numeral", () => {
    const { container } = renderShelf("de");
    const band = container.querySelector("[data-cover-band]");

    expect(band).toHaveAttribute("data-plakat", "lemons");
    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Bücher zum Nachrechnen",
    });
    expect(band).toContainElement(heading);
    const minutes = landschaft.readingTimeMinutes + arbeitsalltag.readingTimeMinutes;
    expect(band).toHaveTextContent(`Lernbücher · 2 Bücher · ${minutes} Min. Lesezeit`);
    expect(
      band?.querySelector("[data-plakat-art] [data-poster-numeral]"),
    ).toHaveTextContent(String(minutes));
    expect(container.querySelectorAll("details, summary, dialog")).toHaveLength(0);
    expect(container.querySelectorAll('[style*="opacity: 0"]')).toHaveLength(0);
  });

  it("lays out one row per book with a level-2 title linking to the landing", () => {
    renderShelf("de");
    const cards = screen.getAllByTestId("book-card");
    expect(cards).toHaveLength(2);

    const first = within(cards[0] as HTMLElement);
    const title = first.getByRole("heading", { level: 2, name: "Von außen gesehen" });
    expect(within(title).getByRole("link")).toHaveAttribute("href", "/buecher/ki-landschaft");
    expect(cards[0]).toHaveTextContent("Ausgabe Oktober 2026 · 9 Kapitel · 24 Min.");
    expect(cards[0]?.querySelector("[data-book-hook]")).toHaveTextContent(
      /^3,8\s%\sof the homepages/,
    );
    expect(cards[0]?.querySelector("[data-book-tile-numeral]")).toHaveTextContent(/^3,8\s%$/);
    expect(cards[0]?.querySelector("[data-cover-squares]")).toHaveAttribute("data-cover-squares", "38");
  });

  it("falls back to the subtitle and a plain field for a book without a headline", () => {
    renderShelf("de");
    const second = screen.getAllByTestId("book-card")[1] as HTMLElement;

    expect(second.querySelector("[data-book-hook]")).toHaveTextContent(arbeitsalltag.subtitle);
    expect(second.querySelector("[data-book-tile-numeral]")).toBeNull();
    expect(second.querySelector("[data-cover-squares]")).toHaveAttribute("data-cover-squares", "0");
  });

  it("opens chapter 1 and the landing in one tap, named after the visible label", () => {
    renderShelf("de");
    const read = screen.getByRole("link", { name: "Kapitel 1 lesen: Von außen gesehen" });
    const open = screen.getByRole("link", { name: "Zum Buch: Von außen gesehen" });

    expect(read).toHaveAttribute("href", "/buecher/ki-landschaft/01_ki-landschaft");
    expect(read).toHaveClass("bl-card", "bl-card--filled");
    expect(open).toHaveAttribute("href", "/buecher/ki-landschaft");
    expect(open).toHaveClass("bl-card", "bl-card--outline");
  });

  it("lists every chapter of each book with its numeral", () => {
    const { container } = renderShelf("de");
    const lists = container.querySelectorAll("[data-chapter-list]");

    expect(lists).toHaveLength(2);
    expect(lists[0]?.querySelectorAll("li")).toHaveLength(9);
    expect(lists[1]?.querySelectorAll("li")).toHaveLength(3);
    expect(lists[0]?.querySelector("[data-chapter-numeral]")).toHaveTextContent("46 %");
  });

  it("shows the PDF line only with accounts, and never a not-available note", () => {
    const off = renderShelf("en", false);
    expect(screen.queryByRole("link", { name: /PDF/ })).toBeNull();
    expect(off.container).not.toHaveTextContent(/unavailable|nicht verfügbar/i);
    off.unmount();

    renderShelf("en", true);
    const pdf = screen.getByRole("link", {
      name: `German PDF, ${landschaft.pageCount} pages, after sign-in: Seen from the outside`,
    });
    expect(pdf).toHaveAttribute(
      "href",
      "/en/login?next=%2Fapi%2Fbuecher%2Fki-landschaft%2Fdownload.pdf",
    );
    // The held book has no PDF.
    expect(screen.getAllByRole("link", { name: /PDF/ })).toHaveLength(1);
  });

  it("keeps every English link in the English locale", () => {
    const { container } = renderShelf("en");

    expect(
      screen.getByRole("heading", { level: 1, name: "Books you can check" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Read chapter 1: Seen from the outside" })).toHaveAttribute(
      "href",
      "/en/buecher/ki-landschaft/01_ki-landschaft",
    );
    const links = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[href^="/"]'));
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((link) => link.getAttribute("href")?.startsWith("/en"))).toBe(true);
  });

  it("states provenance in one line, with the companion course as a link", () => {
    renderShelf("de");
    const first = screen.getAllByTestId("book-card")[0] as HTMLElement;
    const line = first.querySelector("[data-book-provenance]");

    expect(line).toHaveTextContent(
      "Tim Löhr · geprüft am 19. Oktober 2026 · nur Aggregate, jede Zahl aus mindestens 5 Treffern · Begleitkurs: EU AI Act",
    );
    expect(within(line as HTMLElement).getByRole("link", { name: "EU AI Act" })).toHaveAttribute(
      "href",
      "/eu-ai-act-kurs",
    );
  });

  it("gives every repeated control a unique accessible name", () => {
    renderShelf("de", true);
    const names = screen
      .getAllByRole("link")
      .filter((link) => link.classList.contains("bl-card") || link.hasAttribute("data-book-pdf"))
      .map((link) => link.getAttribute("aria-label"));

    expect(names.every(Boolean)).toBe(true);
    expect(new Set(names).size).toBe(names.length);
  });

  it("uses the poster system: no rounded cards, shadows, washes or tiny labels", () => {
    expect(SOURCE).not.toContain("transition-all");
    expect(SOURCE).not.toMatch(/text-\[(?:9|10|11)(?:\.\d+)?px\]/);
    expect(SOURCE).not.toMatch(/rounded-(?:lg|xl|2xl|3xl|full)/);
    expect(SOURCE).not.toContain("HighlightedText");
    expect(SOURCE).not.toMatch(/\bbg-brand-(?:acid|peach|pink|sky|teal)\b/);
    expect(SOURCE).not.toMatch(/\b-?rotate-\d/);
    expect(SOURCE).not.toMatch(/shadow-|gradient/);
    expect(BOOK_PAGE_COPY.de.catalog.heading).not.toMatch(/[–—]/);
  });
});

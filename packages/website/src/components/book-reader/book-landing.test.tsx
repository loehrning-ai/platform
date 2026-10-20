import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Book } from "@/lib/books";
import type { FigureSpec } from "@/lib/figures";
import type { BookChapterMeta, ResolvedLanding } from "@/lib/book-reader-content";

vi.mock("./reel/cover-reel", async () => {
  // The reel is a client island with its own tests; here only its server-rendered slots matter.
  return {
    CoverReel: ({ poster, copy, unit }: { poster: React.ReactNode; copy: React.ReactNode; unit?: React.ReactNode }) => (
      <div data-cover-reel="" data-state="poster">
        <div className="cr-copy">{copy}</div>
        <div className="cr-poster">{poster}</div>
        {unit ? <div className="cr-unit">{unit}</div> : null}
      </div>
    ),
  };
});

import { BookLanding } from "./book-landing";

const BOOK = { id: "ki-landschaft", author: "Tim Löhr", pageCount: 34 } as unknown as Book;
const DISPLAY = {
  title: "Von außen gesehen",
  subtitle: "Was Firmenwebsites über KI verraten",
  edition: "Ausgabe Oktober 2026",
} as never;

const HEADLINE = {
  id: "h05",
  kind: "bars",
  title: "Messung",
  alt: "x",
  caption: "x",
  n: 24944,
  source: "x",
  asOf: "2026-10-18",
  limitation: "x",
  data: { items: [{ id: "a", label: "A", value: 3.8 }], fmt: { style: "percent", digits: 1 } },
  meta: { values: { share: { value: 3.8, n: 24944, fmt: { style: "percent", digits: 1 } } } },
} as unknown as FigureSpec;

const CHAPTERS: BookChapterMeta[] = [
  { slug: "01_zweimal_gemessen", title: "Zweimal gemessen", sourceFile: "a.md", band: { numeral: "46 %", claim: "x" } },
  { slug: "02_textmenge", title: "Wer viel schreibt, schreibt KI", sourceFile: "b.md", band: { numeral: "62x", claim: "y" } },
  { slug: "08_dein_zug", title: "Dein Zug", sourceFile: "c.md" },
];

const LANDING: ResolvedLanding = {
  headlineRef: "h05.share",
  headlineTail: "der Startseiten von Firmen mit eigener Domain schreiben KI.",
  sourceLine: "Nur 55 % der Firma-zu-Website-Zuordnungen stimmten. Wird mit geprüften Websites neu gerechnet.",
  facts: [
    { value: "25.581", label: "Firmen mit eigener Domain" },
    { value: "12", label: "Befunde" },
    { value: "2026-03 bis 06", label: "Scan" },
  ],
  explainer: { heading: "Was du hier findest", text: "Zwölf Befunde aus einer eigenen Auswertung. Jede Zahl mit Basis und Grenze." },
  explorerChapter: "08_dein_zug",
};

function landing(over: Partial<Parameters<typeof BookLanding>[0]> = {}) {
  return render(
    <BookLanding book={BOOK} display={DISPLAY} chapters={CHAPTERS} landing={LANDING} headline={HEADLINE} locale="de" pdfHref="/login?next=%2Fapi%2Fx.pdf" {...over}>
      <p data-testid="child">Redaktioneller Hinweis</p>
    </BookLanding>,
  );
}

describe("BookLanding", () => {
  it("is a poster band with the title as the one h1, then a stage on paper", () => {
    const { container } = landing();
    expect(screen.getByRole("heading", { level: 1, name: "Von außen gesehen" })).toBeVisible();
    const band = container.querySelector("[data-cover-band]");
    expect(band).toHaveAttribute("data-plakat", "lemons");
    expect(band).toHaveTextContent("Ausgabe Oktober 2026 · Tim Löhr");
    const stage = container.querySelector("[data-book-stage]")!;
    expect(stage).not.toContainElement(band as HTMLElement);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
  });

  it("shows the headline number from the figure JSON and 38 of 1.000 squares, with the exact unit line", () => {
    const { container } = landing();
    expect(container.querySelector("[data-book-numeral]")).toHaveTextContent("3,8 %");
    expect(container.querySelector("svg.cr-field")).toHaveAttribute("data-cover-squares", "38");
    expect(screen.getByText("1 Quadrat = 0,1 % der 24.944 Firmen")).toBeVisible();
    expect(container.querySelector("svg.cr-field")?.getAttribute("aria-label")).toMatch(/^1\.000 Quadrate stehen für alle Firmen der Auswertung\. 38 sind hervorgehoben/);
  });

  it("prints the caveat as a visible source line on the cover, not in a drawer", () => {
    const { container } = landing();
    expect(screen.getByText(/Nur 55 % der Firma-zu-Website-Zuordnungen stimmten/)).toBeVisible();
    expect(container.querySelector("[data-book-source]")).not.toBeNull();
    expect(container.querySelector("details")).toBeNull();
  });

  it("offers card A (read chapter 1), card B (PDF) and the small explorer link", () => {
    const { container } = landing();
    const a = container.querySelector<HTMLAnchorElement>("[data-book-start]")!;
    expect(a).toHaveAttribute("href", "/buecher/ki-landschaft/01_zweimal_gemessen");
    expect(a).toHaveTextContent("Kapitel 1 lesen");
    const b = container.querySelector<HTMLAnchorElement>("[data-book-pdf]")!;
    expect(b).toHaveTextContent("PDF laden, 34 Seiten");
    expect(b).toHaveAttribute("href", "/login?next=%2Fapi%2Fx.pdf");
    expect(container.querySelector("[data-book-explorer]")).toHaveAttribute("href", "/buecher/ki-landschaft/08_dein_zug#wo-stehe-ich");
    expect(container.querySelector("[data-book-explorer]")).toHaveTextContent("Wo stehe ich?");
  });

  it("says so when the PDF is not available and drops the explorer link when no chapter holds it", () => {
    const { container } = landing({ pdfHref: null, landing: { ...LANDING, explorerChapter: "gibt-es-nicht" } });
    expect(container.querySelector("[data-book-pdf]")).toBeNull();
    expect(screen.getByText("PDF in dieser Version nicht verfügbar")).toBeVisible();
    expect(container.querySelector("[data-book-explorer]")).toBeNull();
  });

  it("prints the explainer, the three facts and the chapter list with each chapter's hero number, all visible", () => {
    const { container } = landing();
    expect(screen.getByRole("heading", { level: 2, name: "Was du hier findest" })).toBeVisible();
    const facts = screen.getByLabelText("Eckdaten des Buchs");
    expect(within(facts).getAllByText(/25\.581|^12$|2026-03 bis 06/)).toHaveLength(3);
    const list = screen.getByRole("navigation", { name: "Alle Kapitel des Buchs" });
    const links = within(list).getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveTextContent("46 %");
    expect(links[1]).toHaveTextContent("62x");
    expect(links[2]).not.toHaveTextContent("%");
    expect(screen.getByTestId("child")).toBeVisible();
    // Nothing collapses on the cover.
    expect(container.querySelector("details, summary, [aria-expanded]")).toBeNull();
  });

  it("has no stage when the headline figure is missing, and does not invent a number", () => {
    const { container } = landing({ headline: undefined });
    expect(container.querySelector("[data-cover-reel]")).toBeNull();
    expect(container.querySelector("[data-book-numeral]")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
  });

  it("hosts a finished player in the slot instead of the built-in poster, keeping the cards and the explorer link", () => {
    const { container } = landing({ reel: <div data-testid="player">Player</div> });
    expect(container.querySelector("[data-book-stage]")).toHaveAttribute("data-reel", "external");
    expect(screen.getByTestId("player").closest(".bl-reel")).not.toBeNull();
    expect(container.querySelector("[data-cover-reel]")).toBeNull();
    expect(container.querySelector("[data-book-numeral]")).toBeNull();
    expect(container.querySelector("[data-book-start]")).not.toBeNull();
    expect(container.querySelector("[data-book-explorer]")).not.toBeNull();
  });

  it("speaks English on the English route", () => {
    landing({ locale: "en" });
    expect(screen.getByRole("link", { name: /Read chapter 1/ })).toHaveAttribute("href", "/en/buecher/ki-landschaft/01_zweimal_gemessen");
    expect(screen.getByRole("navigation", { name: "All chapters of the book" })).toBeVisible();
  });
});

describe("book-landing.css contract", () => {
  const css = readFileSync(join(__dirname, "book-landing.css"), "utf8");
  it("uses hard edges and the anti colours; hover only on fine pointers; 3px Mennige focus; 56px cards", () => {
    expect(css).not.toMatch(/border-radius:\s*[1-9]|gradient\(|box-shadow/);
    expect(css).toMatch(/\.bl-card\s*\{[^}]*min-height:\s*3\.5rem/);
    expect(css).toMatch(/\.bl-card:focus-visible,\s*\.bl-link:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--bl-accent\)/);
    const outside = css.replace(/@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\n\}\n/g, "");
    expect(outside).not.toMatch(/:hover/);
    expect(css).not.toMatch(/font-family:[^;]*mono/i);
  });
});

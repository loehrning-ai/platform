/**
 * Book catalog — single in-repo source of truth.
 *
 * This module is the canonical source for the `/buecher` page and the
 * `/api/books.json` route. Keep it in sync when a book is revised; never
 * duplicate this array in a component.
 *
 * Note on `id`: each `id` doubles as the React key/anchor for a book card and
 * must match the slug used in `content/books/<slug>/manifest.json`.
 *
 * Chapter counts / reading times (book-library import — updated after real import):
 * - ki-landschaft:           10 chapters (06+07 dropped), ~12.600 words → 63 min
 * - ki-arbeitsalltag:        14 chapters (incl. 00_intro), ~14.550 words → 73 min
 * - ki-tools-selbststaendige: 13 chapters (14_nachwort dropped), ~35.000 words → 175 min
 */

export interface Book {
  /** Stable slug. Doubles as React key/anchor and matches manifest slug. */
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly author: string;
  readonly edition: string;
  readonly language: "de";
  readonly audience: string;
  readonly chapters: number;
  readonly pageCount: number;
  readonly readingTimeMinutes: number;
  readonly resourceType: string;
  readonly accessLabel: string;
  readonly statusLabel: string;
  readonly accessPolicy: "open-reader";
  readonly readerHref: string;
  readonly relatedResourceHref: string;
  readonly relatedResourceLabel: string;
  readonly description: string;
  readonly highlights: readonly string[];
  /** Auth-gated download route (e.g. /api/buecher/<id>/download.pdf), or null if no PDF exists. */
  readonly pdfPath: string | null;
  /** Preview page images rendered from the real PDF; [0] is the cover. */
  readonly pages: readonly string[];
  readonly sourceOwner: string;
  readonly lastReviewed: string;
  readonly nextReview: string;
  readonly sourceInputs: readonly string[];
  readonly licensePolicy: string;
}

/** All books, including ones pending re-review (see `books` below). */
const ALL_BOOKS: readonly Book[] = [
  {
    id: "ki-landschaft",
    title: "KI im deutschen Mittelstand",
    subtitle: "Daten, Strukturen, Chancen",
    author: "Tim Löhr",
    edition: "Arbeitsfassung 2026",
    language: "de",
    audience: "Alle mit beruflichem KI-Bezug",
    chapters: 10,
    pageCount: 95,
    readingTimeMinutes: 63,
    resourceType: "HTML-Lesefassung",
    accessLabel: "kostenlos · jetzt lesen",
    statusLabel: "Reader online",
    accessPolicy: "open-reader",
    readerHref: "/buecher/ki-landschaft",
    relatedResourceHref: "/eu-ai-act-kurs",
    relatedResourceLabel: "EU AI Act Kurs öffnen",
    description:
      "Eine lesbare Einführung in KI-Reife: warum Datenfundament wichtiger ist als Tool-Auswahl, wie Teams ihren Ausgangspunkt qualitativ erfassen und wie man Benchmarks vorsichtig liest.",
    highlights: [
      "Qualitative Standortbestimmung ohne proprietären Score",
      "Fünf Arbeitsfelder für digitale und KI-bezogene Reife",
      "Einordnung von Benchmarks, Branchen und Grenzen",
    ],
    pdfPath: "/api/buecher/ki-landschaft/download.pdf",
    pages: [
      "/book-covers/ki-landschaft-2026-1.png",
      "/book-covers/ki-landschaft-2026-2.png",
      "/book-covers/ki-landschaft-2026-3.png",
    ],
    sourceOwner: "editorial:books",
    lastReviewed: "2026-07-14",
    nextReview: "2026-10-14",
    sourceInputs: [
      "Public primary sources cited in the book",
      "Qualitative AI-readiness frameworks",
      "Simplified learning-platform editorial review",
    ],
    licensePolicy:
      "Kostenlos online lesbar; PDF-Download nach Login verfügbar.",
  },
  {
    id: "ki-arbeitsalltag",
    title: "KI im Arbeitsalltag",
    subtitle: "Begleitbuch zum KI-Führerschein",
    author: "Tim Löhr",
    edition: "Arbeitsfassung 2026",
    language: "de",
    audience: "Mitarbeiter und Teams",
    chapters: 14,
    pageCount: 110,
    readingTimeMinutes: 73,
    resourceType: "HTML-Begleitbuch",
    accessLabel: "kostenlos · jetzt lesen",
    statusLabel: "Reader online",
    accessPolicy: "open-reader",
    readerHref: "/buecher/ki-arbeitsalltag",
    relatedResourceHref: "/ki-fuehrerschein",
    relatedResourceLabel: "Zum KI-Führerschein",
    description:
      "Ein ruhiger Einstieg in Begriffe, typische Anwendungsfälle, Prompting, Datenschutz und Artikel 4. Gedacht für Menschen, die KI im Arbeitsalltag nutzen, aber keine technische Vorbildung mitbringen.",
    highlights: [
      "Grundbegriffe ohne Anbieterjargon",
      "Prompt-Beispiele mit Ziel, Kontext und Prüfschritt",
      "Arbeitsnahe Hinweise zu Datenschutz und KI-Kompetenz",
    ],
    pdfPath: null,
    pages: [
      "/book-covers/ki-arbeitsalltag-2026-1.png",
      "/book-covers/ki-arbeitsalltag-2026-2.png",
      "/book-covers/ki-arbeitsalltag-2026-3.png",
    ],
    sourceOwner: "editorial:books",
    lastReviewed: "2026-07-14",
    nextReview: "2026-10-14",
    sourceInputs: [
      "KI-Führerschein lesson content",
      "European Commission AI literacy guidance",
      "Simplified learning-platform editorial review",
    ],
    licensePolicy:
      "Kostenlos online lesbar; keine öffentliche PDF-Distribution in dieser Version.",
  },
  {
    id: "ki-tools-selbststaendige",
    title: "KI-Tools für Selbstständige",
    subtitle: "Nachschlagewerk für Freelancer",
    author: "Tim Löhr",
    edition: "Arbeitsfassung 2026",
    language: "de",
    audience: "Freelancer und Soloselbstständige",
    chapters: 13,
    pageCount: 280,
    readingTimeMinutes: 175,
    resourceType: "HTML-Nachschlagewerk",
    accessLabel: "kostenlos · jetzt lesen",
    statusLabel: "Reader online",
    accessPolicy: "open-reader",
    readerHref: "/buecher/ki-tools-selbststaendige",
    relatedResourceHref: "/ai-native",
    relatedResourceLabel: "Zum AI-Native Arbeitskurs",
    description:
      "Eine praktische Werkzeugkarte für kleine Arbeitskontexte: Welche Aufgaben eignen sich für KI, welche bleiben menschlich, wie prüft man Ergebnisse und wie dokumentiert man wiederholbare Abläufe.",
    highlights: [
      "Werkzeugklassen statt Rankinglisten",
      "Auswahlkriterien, Risiken und Kontrollfragen",
      "Beispiel-Workflows für Schreiben, Recherche und Ablage",
    ],
    pdfPath: null,
    pages: [
      "/book-covers/ki-tools-selbststaendige-2026-1.png",
      "/book-covers/ki-tools-selbststaendige-2026-2.png",
      "/book-covers/ki-tools-selbststaendige-2026-3.png",
    ],
    sourceOwner: "editorial:books",
    lastReviewed: "2026-07-14",
    nextReview: "2026-10-14",
    sourceInputs: [
      "AI-Native course content",
      "Tool-selection editorial notes",
      "Simplified learning-platform editorial review",
    ],
    licensePolicy:
      "Kostenlos online lesbar; keine öffentliche PDF-Distribution in dieser Version.",
  },
];

/**
 * Publicly listed books. "ki-arbeitsalltag" and "ki-tools-selbststaendige"
 * haven't been reviewed recently and stay out of the public catalog until
 * that review happens — their data lives on in `ALL_BOOKS`, unpublished.
 */
export const books: readonly Book[] = ALL_BOOKS.filter(
  (book) => book.id === "ki-landschaft",
);

export function getBookById(id: string): Book | undefined {
  return books.find((book) => book.id === id);
}

export function getBookCover(book: Book): string {
  return book.pages[0] ?? "/og-image.png";
}

export function getBookPreviewPages(book: Book): readonly string[] {
  return book.pages.slice(0, 1);
}

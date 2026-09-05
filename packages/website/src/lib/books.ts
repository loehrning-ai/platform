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
  readonly publicationStatus: "published" | "hold";
  readonly publicationReason: string;
}

/** All books, including titles held from public routing. */
export const allBooks: readonly Book[] = [
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
      "Das Datenfundament entscheidet, nicht die Tool-Auswahl. Das Buch zeigt, wie ein Team seinen Ausgangspunkt ohne Score qualitativ erfasst, was fünf Arbeitsfelder digitaler und KI-bezogener Reife verlangen und wie du einen Benchmark liest, ohne mehr hineinzulesen, als drinsteht.",
    highlights: [
      "Qualitative Selbstprüfung ohne proprietären Score",
      "Fünf Arbeitsfelder für digitale und KI-bezogene Reife",
      "Benchmarks, Branchen und ihre Grenzen, eingeordnet",
    ],
    pdfPath: "/api/buecher/ki-landschaft/download.pdf",
    pages: [
      "/book-covers/ki-landschaft-2026-1.png",
      "/book-covers/ki-landschaft-2026-2.png",
      "/book-covers/ki-landschaft-2026-3.png",
    ],
    sourceOwner: "editorial:books",
    lastReviewed: "2026-09-05",
    nextReview: "2026-12-05",
    sourceInputs: [
      "Public primary sources cited in the book",
      "Qualitative AI-readiness frameworks",
      "Simplified learning-platform editorial review",
    ],
    licensePolicy:
      "Kostenlos online lesbar; PDF-Download nach Login verfügbar.",
    publicationStatus: "published",
    publicationReason:
      "Editorial review and public-release approval are recorded for the HTML reader and authenticated PDF.",
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
    accessLabel: "nicht veröffentlicht",
    statusLabel: "Redaktionelle Prüfung offen",
    accessPolicy: "open-reader",
    readerHref: "/buecher/ki-arbeitsalltag",
    relatedResourceHref: "/ki-fuehrerschein",
    relatedResourceLabel: "Zum KI-Führerschein",
    description:
      "Begriffe, typische Anwendungsfälle, Prompting, Datenschutz und Artikel 4. Geschrieben für Menschen, die KI im Arbeitsalltag nutzen und keine technische Vorbildung mitbringen.",
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
    lastReviewed: "2026-09-05",
    nextReview: "2026-12-05",
    sourceInputs: [
      "KI-Führerschein lesson content",
      "European Commission AI literacy guidance",
      "Simplified learning-platform editorial review",
    ],
    licensePolicy:
      "Kostenlos online lesbar; keine öffentliche PDF-Distribution in dieser Version.",
    publicationStatus: "hold",
    publicationReason:
      "Bilingual review, legal sign-off, and public-release approval are incomplete; public routing remains disabled.",
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
    accessLabel: "nicht veröffentlicht",
    statusLabel: "Redaktionelle Prüfung offen",
    accessPolicy: "open-reader",
    readerHref: "/buecher/ki-tools-selbststaendige",
    relatedResourceHref: "/ai-native",
    relatedResourceLabel: "Zum AI-Native Arbeitskurs",
    description:
      "Welche Aufgabe gibst du an KI ab, welche behältst du? Eine Werkzeugkarte für kleine Arbeitskontexte: Aufgaben sortieren, Ergebnisse prüfen, wiederholbare Abläufe dokumentieren.",
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
    lastReviewed: "2026-09-05",
    nextReview: "2026-12-05",
    sourceInputs: [
      "AI-Native course content",
      "Tool-selection editorial notes",
      "Simplified learning-platform editorial review",
    ],
    licensePolicy:
      "Kostenlos online lesbar; keine öffentliche PDF-Distribution in dieser Version.",
    publicationStatus: "hold",
    publicationReason:
      "Bilingual review, vendor-claim sign-off, and public-release approval are incomplete; public routing remains disabled.",
  },
];

/**
 * Publicly listed books. Review freshness and publication approval are
 * separate gates: a recently reviewed title remains unroutable while its
 * explicit lifecycle status is `hold`.
 */
export const books: readonly Book[] = allBooks.filter(
  (book) => book.publicationStatus === "published",
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

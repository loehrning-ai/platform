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
 * - ki-landschaft:           9 chapters (8 insight chapters + sources page), ~4.800 words → 24 min
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
    title: "Von außen gesehen",
    subtitle: "Was 25.581 Firmenwebsites über KI in Deutschland verraten",
    author: "Tim Löhr",
    edition: "Ausgabe Oktober 2026",
    language: "de",
    audience: "Alle mit beruflichem KI-Bezug",
    chapters: 9,
    pageCount: 32,
    readingTimeMinutes: 24,
    resourceType: "HTML-Lesefassung mit interaktiven Abbildungen",
    accessLabel: "kostenlos · jetzt lesen",
    statusLabel: "Lesefassung online",
    accessPolicy: "open-reader",
    readerHref: "/buecher/ki-landschaft",
    relatedResourceHref: "/eu-ai-act-kurs",
    relatedResourceLabel: "EU AI Act Kurs öffnen",
    description:
      "Befunde aus Firmenwebsites, Stellenanzeigen und Pressemeldungen: warum bei fast jedem zweiten KI-Treffer das Wort im zweiten Scan fehlt, was die Textmenge erklärt, wie viele Anzeigen mit KI-Wort im Titel technische Stellenanzeigen sind, warum jede Regionsrangliste zur Hälfte Zufall ist und wem der Schlüsselbund einer Website gehört. Die Aussagen gelten für Firmen mit auffindbarer Website, nicht für Deutschland.",
    highlights: [
      "Zwei Messungen, zwei Bilder: warum bei fast jedem zweiten KI-Treffer das Wort im zweiten Scan fehlt",
      "Von der Textmenge bis zum Schlüsselbund: Befunde aus Websites, Stellen und Pressemeldungen",
      "Ein Werkzeug, das in deinem Browser rechnet, wo du stehst, mit Intervall und Grenze",
    ],
    pdfPath: "/api/buecher/ki-landschaft/download.pdf",
    pages: [
      "/book-covers/ki-landschaft-2026-1.png",
      "/book-covers/ki-landschaft-2026-2.png",
      "/book-covers/ki-landschaft-2026-3.png",
    ],
    sourceOwner: "editorial:books",
    lastReviewed: "2026-10-19",
    nextReview: "2027-01-19",
    sourceInputs: [
      "Own analysis of company websites (aggregates, at least 5 hits per cell)",
      "Own analysis of job ads and press releases (aggregates, at least 5 hits per cell)",
      "Business register 2024 of the Federal Statistical Office (weights by state) and published surveys by KfW and Bitkom",
      "Regulation (EU) 2024/1689, amending Regulation (EU) 2026/1744 (CELEX 32026R1744) and the pages of the European Commission",
    ],
    licensePolicy:
      "Kostenlos online lesbar; PDF-Download nach Login verfügbar.",
    publicationStatus: "published",
    publicationReason:
      "Neuausgabe vom Oktober 2026 mit Aggregaten aus einer eigenen Auswertung von Firmenwebsites. Redaktionelle Freigabe durch den Herausgeber vor dem Merge.",
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
    nextReview: "2026-12-06",
    sourceInputs: [
      "KI-Führerschein lesson content",
      "European Commission AI literacy guidance",
      "Editorial review of the learning-platform edition",
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
    relatedResourceLabel: "Zum Kurs Mit KI arbeiten",
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
    nextReview: "2026-12-06",
    sourceInputs: [
      "AI-Native course content",
      "Tool-selection editorial notes",
      "Editorial review of the learning-platform edition",
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

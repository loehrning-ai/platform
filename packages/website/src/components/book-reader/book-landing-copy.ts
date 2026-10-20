import type { Locale } from "@/lib/i18n/locale";

/** Strings of the insight cover page. Numbers never appear here: they come from the manifest tokens and the figure JSON. */
export const LANDING_COPY: Record<
  Locale,
  {
    readonly stageAria: string;
    readonly readChapter: (n: number) => string;
    readonly pdf: (pages: number) => string;
    readonly pdfLogin: (pages: number) => string;
    readonly pdfUnavailable: string;
    readonly explorer: string;
    readonly unitLine: (n: string) => string;
    readonly posterLabel: (squares: number, share: string) => string;
    readonly factsAria: string;
    readonly caps: (edition: string, author: string) => string;
    /** Used only while the manifest carries no landing.headlineTail. */
    readonly defaultTail: string;
  }
> = {
  de: {
    stageAria: "Das Buch auf einen Blick",
    readChapter: (n) => `Kapitel ${n} lesen`,
    pdf: (pages) => `PDF laden, ${pages} Seiten`,
    pdfLogin: (pages) => `PDF laden, ${pages} Seiten, nach Anmeldung`,
    pdfUnavailable: "PDF in dieser Version nicht verfügbar",
    explorer: "Wo stehe ich?",
    unitLine: (n) => `1 Quadrat = 0,1 % der ${n} Firmen`,
    posterLabel: (squares, share) => `1.000 Quadrate stehen für alle Firmen der Auswertung. ${squares} sind hervorgehoben: ${share}.`,
    factsAria: "Eckdaten des Buchs",
    caps: (edition, author) => `${edition} · ${author}`,
    defaultTail: "der Firmen mit auffindbarer Website schreiben das Wort KI auf ihre Startseite.",
  },
  en: {
    stageAria: "The book at a glance",
    readChapter: (n) => `Read chapter ${n}`,
    pdf: (pages) => `Download the PDF, ${pages} pages`,
    pdfLogin: (pages) => `Download the PDF, ${pages} pages, after signing in`,
    pdfUnavailable: "PDF not available in this version",
    explorer: "Where do I stand?",
    unitLine: (n) => `1 square = 0.1% of the ${n} firms`,
    posterLabel: (squares, share) => `1,000 squares stand for every firm in the analysis. ${squares} are highlighted: ${share}.`,
    factsAria: "Key facts of the book",
    caps: (edition, author) => `${edition} · ${author}`,
    defaultTail: "of the firms with a findable website write the word AI on their homepage.",
  },
};

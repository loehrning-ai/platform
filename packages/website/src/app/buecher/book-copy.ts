import type { Book } from "@/lib/books";
import type { Locale } from "@/lib/i18n/locale";

export interface LocalizedBookDisplay {
  readonly title: string;
  readonly subtitle: string;
  readonly edition: string;
  readonly audience: string;
  readonly resourceType: string;
  readonly accessLabel: string;
  readonly statusLabel: string;
  readonly relatedResourceLabel: string;
  readonly description: string;
  readonly highlights: readonly string[];
  readonly adaptationNote: string;
}

interface BookPageCopy {
  readonly metadata: {
    readonly title: string;
    readonly description: (count: number) => string;
    readonly openGraphTitle: (count: number) => string;
    readonly openGraphDescription: string;
    readonly detailTitleSuffix: string;
    readonly detailDescription: (book: LocalizedBookDisplay) => string;
  };
  readonly schema: {
    readonly home: string;
    readonly books: string;
    readonly collectionName: string;
    readonly collectionDescription: string;
    readonly freeReadingEdition: string;
  };
  readonly catalog: {
    /** The band's caps line; it states the band numeral (the total minutes). */
    readonly caps: (books: number, minutes: number) => string;
    readonly heading: string;
    readonly lede: string;
    readonly rowMeta: (edition: string, chapters: number, minutes: number) => string;
    readonly readChapter: (chapter: number) => string;
    readonly openBook: string;
    readonly pdfAfterLogin: (pages: number) => string;
    /** Used by the detail page of a non-insight book. */
    readonly byAuthor: (author: string) => string;
    readonly reviewed: (date: string) => string;
    readonly aggregates: (minHits: number) => string;
    readonly companion: string;
  };
  readonly detail: {
    readonly context: string;
    readonly contextBody: string;
    readonly kicker: string;
    readonly chapterCount: (count: number) => string;
    readonly readingTime: (minutes: number) => string;
    readonly reviewedLabel: string;
    readonly materialLanguage: string;
    readonly materialLanguageValue: string;
    readonly format: string;
    readonly extent: string;
    readonly access: string;
    readonly freeAccess: string;
    readonly coverAlt: (title: string) => string;
    readonly pdfAfterLogin: string;
    readonly pdfUnavailable: string;
    readonly adaptationLabel: string;
    readonly contentsAria: string;
    readonly contentsHeading: string;
    readonly contentsIntro: string;
    readonly chapterAria: (title: string) => string;
    readonly minutesShort: (minutes: number) => string;
    readonly companionPrefix: string;
    readonly backToCatalog: string;
  };
  readonly error: {
    readonly eyebrow: string;
    readonly title: string;
    readonly body: string;
    readonly retry: string;
    readonly home: string;
  };
}

const BOOK_DISPLAY_EN: Readonly<Record<string, LocalizedBookDisplay>> = {
  "ki-landschaft": {
    title: "Seen from the outside",
    subtitle: "What 25,581 company websites reveal about AI in Germany",
    edition: "October 2026 edition",
    audience: "Professionals working with AI",
    resourceType: "HTML reading edition with interactive figures",
    accessLabel: "Free online reader",
    statusLabel: "Reader available",
    relatedResourceLabel: "Open the EU AI Act course",
    description:
      "Findings from company websites, job ads and press releases: why almost every second AI hit is missing the word on the second scan, what text length explains, how many ads with an AI word in the title are technical job ads, why every regional ranking is half chance and who owns the key ring of a website. The statements apply to firms with a findable website, not to Germany.",
    highlights: [
      "Measured twice: why almost every second AI hit is missing the word on the second scan",
      "From text length to the key ring: findings from websites, jobs and press releases",
      "A tool that works out in your browser where you stand, with interval and limit",
    ],
    adaptationNote:
      "The edition shows only aggregates from own analyses of company websites, job ads and press releases: every number rests on at least 5 hits, with no company names, addresses, prices, scores or rankings of individual firms. It applies to firms with a findable website, and the raw data stays private.",
  },
  "ki-arbeitsalltag": {
    title: "AI at Work",
    subtitle: "Companion book for Everyday AI Literacy",
    edition: "Working edition 2026",
    audience: "Employees and teams",
    resourceType: "HTML companion book",
    accessLabel: "Free online reader",
    statusLabel: "Reader available",
    relatedResourceLabel: "Open the Everyday AI Literacy course",
    description:
      "Core terms, common applications, prompting, data protection, and Article 4. Written for people who use AI at work and bring no technical background.",
    highlights: [
      "Core terms without vendor jargon",
      "Prompt examples with an objective, context, and verification step",
      "Workplace guidance on data protection and AI literacy",
    ],
    adaptationNote: "",
  },
  "ki-tools-selbststaendige": {
    title: "AI Tools for Freelancers",
    subtitle: "A reference guide for independent work",
    edition: "Working edition 2026",
    audience: "Freelancers and sole traders",
    resourceType: "HTML reference guide",
    accessLabel: "Free online reader",
    statusLabel: "Reader available",
    relatedResourceLabel: "Open the AI-native work course",
    description:
      "Which task do you hand to AI, and which do you keep? A tool map for small working contexts: sort the tasks, check the output, document the repeatable workflows.",
    highlights: [
      "Tool categories instead of rankings",
      "Selection criteria, risks, and control questions",
      "Example workflows for writing, research, and filing",
    ],
    adaptationNote: "",
  },
};

const BOOK_SOURCE_INPUTS_DE: Readonly<Record<string, string>> = {
  "Public primary sources cited in the book":
    "Im Buch zitierte öffentliche Primärquellen",
  "Qualitative AI-readiness frameworks": "Qualitative Rahmenwerke zur KI-Reife",
  "Editorial review of the learning-platform edition":
    "Redaktionelle Prüfung der Lernplattform-Fassung",
  "KI-Führerschein lesson content": "Lektionsinhalte des KI-Führerscheins",
  "European Commission AI literacy guidance":
    "Leitlinien der Europäischen Kommission zur KI-Kompetenz",
  "AI-Native course content": "Kursinhalte von Mit KI arbeiten",
  "Tool-selection editorial notes": "Redaktionelle Notizen zur Werkzeugauswahl",
  "Own analysis of company websites (aggregates, at least 5 hits per cell)":
    "Eigene Auswertung von Firmenwebsites (Aggregate, mindestens 5 Treffer je Zelle)",
  "Own analysis of job ads and press releases (aggregates, at least 5 hits per cell)":
    "Eigene Auswertung von Stellenanzeigen und Pressemeldungen (Aggregate, mindestens 5 Treffer je Zelle)",
  "Business register 2024 of the Federal Statistical Office (weights by state) and published surveys by KfW and Bitkom":
    "Unternehmensregister 2024 des Statistischen Bundesamts (Gewichte nach Land) und veröffentlichte Umfragen von KfW und Bitkom",
  "Regulation (EU) 2024/1689 and the pages of the European Commission":
    "Verordnung (EU) 2024/1689 und die Seiten der Europäischen Kommission",
};

export const BOOK_PAGE_COPY: Readonly<Record<Locale, BookPageCopy>> = {
  de: {
    metadata: {
      title: "Bücher über KI und Datenreife",
      description: (count) =>
        `${count} ${count === 1 ? "Lernbuch" : "Lernbücher"} zu KI-Reife und Datenfundament, kostenlos online lesbar.`,
      openGraphTitle: (count) =>
        `${count} freie${count === 1 ? " Lesefassung" : " Lesefassungen"} über KI`,
      openGraphDescription:
        "Lernbücher im offenen HTML-Reader, mit Quellen und Grenzen.",
      detailTitleSuffix: "Lernbuch",
      detailDescription: (book) =>
        `${book.subtitle}. Deutsche HTML-Lesefassung, kostenlos und ohne Konto.`,
    },
    schema: {
      home: "Start",
      books: "Bücher",
      collectionName: "Bücher über KI und Datenreife",
      collectionDescription:
        "Deutsche Lernbücher im offenen HTML-Reader, mit Quellen und Grenzen.",
      freeReadingEdition: "Kostenlose HTML-Lesefassung",
    },
    catalog: {
      caps: (books, minutes) =>
        `Lernbücher · ${books} ${books === 1 ? "Buch" : "Bücher"} · ${minutes} Min. Lesezeit`,
      heading: "Bücher zum Nachrechnen",
      lede: "Jede Zahl mit Stichprobe, Zeitraum und Grenze. Kostenlos im Browser, ohne Konto.",
      rowMeta: (edition, chapters, minutes) =>
        `${edition} · ${chapters} Kapitel · ${minutes} Min.`,
      readChapter: (chapter) => `Kapitel ${chapter} lesen`,
      openBook: "Zum Buch",
      pdfAfterLogin: (pages) => `PDF, ${pages} Seiten, nach Anmeldung`,
      byAuthor: (author) => `von ${author}`,
      reviewed: (date) => `geprüft am ${date}`,
      aggregates: (minHits) =>
        `nur Aggregate, jede Zahl aus mindestens ${minHits} Treffern`,
      companion: "Begleitkurs",
    },
    detail: {
      context: "Lernpfad · Stufe 6: Vertiefen",
      contextBody:
        "Das Lernbuch vertieft den begleitenden Kurs mit Quellen und Einordnung.",
      kicker: "Lernbuch · Offene HTML-Lesefassung",
      chapterCount: (count) => `${count} Kapitel`,
      readingTime: (minutes) => `ca. ${minutes} Min.`,
      reviewedLabel: "Geprüft",
      materialLanguage: "Materialsprache",
      materialLanguageValue: "Deutsch",
      format: "Format",
      extent: "Umfang",
      access: "Online-Zugang",
      freeAccess: "Kostenlos, ohne Konto",
      coverAlt: (title) => `Deutsche Titelseite: ${title}`,
      pdfAfterLogin: "Anmelden, um das deutsche PDF herunterzuladen",
      pdfUnavailable: "PDF-Download in dieser Version nicht verfügbar",
      adaptationLabel: "Redaktioneller Hinweis",
      contentsAria: "Inhaltsverzeichnis",
      contentsHeading: "Inhaltsverzeichnis",
      contentsIntro:
        "Die Kapitel öffnen im deutschen Reader, der maßgeblichen Fassung.",
      chapterAria: (title) => `Kapitel „${title}“ öffnen`,
      minutesShort: (minutes) => `${minutes} Min.`,
      companionPrefix: "Begleitender Kurs",
      backToCatalog: "Zur Buchübersicht",
    },
    error: {
      eyebrow: "Bücher",
      title: "Die Buchseite konnte nicht geladen werden.",
      body: "Lade die Seite erneut.",
      retry: "Erneut laden",
      home: "Zur Startseite",
    },
  },
  en: {
    metadata: {
      title: "Books on AI and data readiness",
      description: (count) =>
        `${count} English learning book${count === 1 ? "" : "s"} on AI readiness and data foundations, free to read online.`,
      openGraphTitle: (count) =>
        `${count} free English reading edition${count === 1 ? "" : "s"} on AI`,
      openGraphDescription:
        "Learning books in an open HTML reader, with sources and limits.",
      detailTitleSuffix: "Learning book",
      detailDescription: (book) =>
        `${book.subtitle}. English HTML reading edition, free and without an account.`,
    },
    schema: {
      home: "Home",
      books: "Books",
      collectionName: "Books on AI and data readiness",
      collectionDescription:
        "English learning books in an open HTML reader, with sources and limits.",
      freeReadingEdition: "Free English HTML reading edition",
    },
    catalog: {
      caps: (books, minutes) =>
        `Books · ${books} ${books === 1 ? "book" : "books"} · ${minutes} min read`,
      heading: "Books you can check",
      lede: "Every number with its sample, window and limit. Free in your browser, no account.",
      rowMeta: (edition, chapters, minutes) =>
        `${edition} · ${chapters} chapters · ${minutes} min`,
      readChapter: (chapter) => `Read chapter ${chapter}`,
      openBook: "Open the book",
      pdfAfterLogin: (pages) => `German PDF, ${pages} pages, after sign-in`,
      byAuthor: (author) => `by ${author}`,
      reviewed: (date) => `reviewed ${date}`,
      aggregates: (minHits) =>
        `aggregates only, every number from at least ${minHits} hits`,
      companion: "companion course",
    },
    detail: {
      context: "Learning path · Stage 6: Deepen",
      contextBody:
        "The book adds sources and context to its companion course.",
      kicker: "Learning book · Open HTML reading edition",
      chapterCount: (count) => `${count} chapters`,
      readingTime: (minutes) => `approx. ${minutes} min`,
      reviewedLabel: "Reviewed",
      materialLanguage: "Material language",
      materialLanguageValue: "English",
      format: "Format",
      extent: "Extent",
      access: "Online access",
      freeAccess: "Free, no account",
      coverAlt: (title) => `Source-edition cover for ${title}`,
      pdfAfterLogin: "Sign in to download the German PDF",
      pdfUnavailable: "PDF download is unavailable in this version",
      adaptationLabel: "Editorial note",
      contentsAria: "Table of contents",
      contentsHeading: "Table of contents",
      contentsIntro:
        "The chapters open in the English reader, the maintained edition.",
      chapterAria: (title) => `Open the chapter “${title}”`,
      minutesShort: (minutes) => `${minutes} min`,
      companionPrefix: "Companion course",
      backToCatalog: "Back to books",
    },
    error: {
      eyebrow: "Books",
      title: "The book page could not be loaded.",
      body: "Reload the page.",
      retry: "Reload",
      home: "Back to home",
    },
  },
};

export function getBookDisplay(
  book: Book,
  locale: Locale,
): LocalizedBookDisplay {
  if (locale === "en") {
    const translated = BOOK_DISPLAY_EN[book.id];
    if (translated) return translated;
  }

  return {
    title: book.title,
    subtitle: book.subtitle,
    edition: book.edition,
    audience: book.audience,
    resourceType: book.resourceType,
    accessLabel: book.accessLabel,
    statusLabel: book.statusLabel,
    relatedResourceLabel: book.relatedResourceLabel,
    description: book.description,
    highlights: book.highlights,
    adaptationNote:
      book.id === "ki-landschaft"
        ? "Die Ausgabe zeigt nur Aggregate aus eigenen Auswertungen von Firmenwebsites, Stellenanzeigen und Pressemeldungen: jede Zahl mit mindestens 5 Treffern, ohne Firmennamen, Adressen, Preise, Scores und Ranglisten einzelner Firmen. Sie gilt für Firmen mit auffindbarer Website, die Rohdaten bleiben privat."
        : "",
  };
}

export function getBookSourceInputs(
  book: Book,
  locale: Locale,
): readonly string[] {
  if (locale === "en") return book.sourceInputs;
  return book.sourceInputs.map(
    (source) => BOOK_SOURCE_INPUTS_DE[source] ?? source,
  );
}

/** The short name of a book's companion course, for the provenance line of the shelf. */
const COMPANION_COURSE: Readonly<Record<string, Readonly<Record<Locale, string>>>> = {
  "ki-landschaft": { de: "EU AI Act", en: "EU AI Act" },
  "ki-arbeitsalltag": { de: "KI-Führerschein", en: "Everyday AI Literacy" },
  "ki-tools-selbststaendige": { de: "Mit KI arbeiten", en: "AI-native work" },
};

export function getCompanionCourse(book: Book, locale: Locale): string {
  return (
    COMPANION_COURSE[book.id]?.[locale] ??
    getBookDisplay(book, locale).relatedResourceLabel
  );
}

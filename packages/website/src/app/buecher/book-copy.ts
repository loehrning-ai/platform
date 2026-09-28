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
    readonly kicker: string;
    readonly heading: string;
    readonly headingAccent: string;
    readonly introduction: (count: number) => string;
    readonly collectionHeading: string;
    readonly collectionCountLabel: string;
    readonly collectionDescription: string;
    readonly publicationNumber: (position: number) => string;
    readonly byAuthor: (author: string) => string;
    readonly coverPreviewAria: (title: string) => string;
    readonly coverAlt: (title: string) => string;
    readonly previewLabel: string;
    readonly facts: {
      readonly audience: string;
      readonly extent: string;
      readonly format: string;
      readonly materialLanguage: string;
    };
    readonly chapterCount: (chapters: number, pages: number) => string;
    readonly materialLanguageValue: string;
    readonly contents: string;
    readonly openOverview: string;
    readonly pdfAfterLogin: string;
    readonly pdfUnavailable: string;
    readonly detailsLabel: string;
    readonly sourceInputs: string;
    readonly nextReview: (date: string) => string;
    readonly reviewed: (date: string) => string;
  };
  readonly teaser: {
    readonly dialogLabel: (title: string) => string;
    readonly close: string;
    readonly kicker: (chapters: number) => string;
    readonly pageAlt: (title: string, page: number) => string;
    readonly materialNote: string;
    readonly openOverview: string;
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
    title: "AI in German SMEs",
    subtitle: "Data, structures, opportunities",
    edition: "Working edition 2026",
    audience: "Professionals working with AI",
    resourceType: "HTML reading edition",
    accessLabel: "Free online reader",
    statusLabel: "Reader available",
    relatedResourceLabel: "Open the EU AI Act course",
    description:
      "Why the data foundation matters more than the choice of tool, how a team records its starting point without a score, and how to read a benchmark without overstating it.",
    highlights: [
      "Qualitative assessment without a proprietary score",
      "Five areas of work for digital and AI readiness",
      "Interpretation of benchmarks, sectors, and limitations",
    ],
    adaptationNote:
      "This edition leaves out consulting prices, private company data, proprietary scores and rankings built on them. It uses traceable self-assessments and linked primary sources.",
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
  "AI-Native course content": "Kursinhalte des AI-Native-Arbeitskurses",
  "Tool-selection editorial notes": "Redaktionelle Notizen zur Werkzeugauswahl",
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
      kicker: "Lernbibliothek · Offene Lesefassungen",
      heading: "Sachbücher mit",
      headingAccent: "sichtbaren Quellen und Grenzen.",
      introduction: () =>
        "Alle Lesefassungen sind redaktionell freigegeben und kostenlos im Browser lesbar.",
      collectionHeading: "Der aktuelle Bestand",
      collectionCountLabel: "Lesefassungen online",
      collectionDescription: "Kein Konto erforderlich.",
      publicationNumber: (position) =>
        `Ausgabe ${String(position).padStart(2, "0")}`,
      byAuthor: (author) => `von ${author}`,
      coverPreviewAria: (title) => `Vorschau von „${title}“ öffnen`,
      coverAlt: (title) => `Deutsche Titelseite: ${title}`,
      previewLabel: "Titelseite ansehen",
      facts: {
        audience: "Zielgruppe",
        extent: "Umfang",
        format: "Format",
        materialLanguage: "Materialsprache",
      },
      chapterCount: (chapters, pages) =>
        `${chapters} Kapitel · ca. ${pages} Seiten`,
      materialLanguageValue: "Deutsch",
      contents: "Nach der Lektüre",
      openOverview: "Buch und Kapitel öffnen",
      pdfAfterLogin: "Deutsches PDF nach Login",
      pdfUnavailable: "PDF-Download nicht verfügbar",
      detailsLabel: "Ausgabe, Quellen und Zugang",
      sourceInputs: "Dokumentierte Quellengrundlage",
      nextReview: (date) => `Nächste Prüfung: ${date}`,
      reviewed: (date) => `Geprüft: ${date}`,
    },
    teaser: {
      dialogLabel: (title) => `Titelseiten-Vorschau: ${title}`,
      close: "Vorschau schließen",
      kicker: (chapters) => `Deutsche Lesefassung · ${chapters} Kapitel`,
      pageAlt: (title, page) =>
        `Deutsche Titelseite von ${title}, Seite ${page}`,
      materialNote: "Vorschau · Deutsch · kostenloser HTML-Reader",
      openOverview: "Buch und Kapitel öffnen",
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
      kicker: "Learning library · Open reading editions",
      heading: "Reference books with",
      headingAccent: "visible sources and limits.",
      introduction: () =>
        "Every English reading edition is editorially approved and free to read in your browser.",
      collectionHeading: "The current collection",
      collectionCountLabel: "Reading editions online",
      collectionDescription: "No account required.",
      publicationNumber: (position) =>
        `Edition ${String(position).padStart(2, "0")}`,
      byAuthor: (author) => `by ${author}`,
      coverPreviewAria: (title) => `Open the cover preview for “${title}”`,
      coverAlt: (title) => `Source-edition cover for ${title}`,
      previewLabel: "View the cover",
      facts: {
        audience: "Audience",
        extent: "Extent",
        format: "Format",
        materialLanguage: "Material language",
      },
      chapterCount: (chapters) => `${chapters} chapters`,
      materialLanguageValue: "English",
      contents: "After reading",
      openOverview: "Open book and chapters",
      pdfAfterLogin: "German PDF after sign-in",
      pdfUnavailable: "PDF download unavailable",
      detailsLabel: "Edition, sources, and access",
      sourceInputs: "Documented source basis",
      nextReview: (date) => `Next review: ${date}`,
      reviewed: (date) => `Reviewed: ${date}`,
    },
    teaser: {
      dialogLabel: (title) => `Cover preview: ${title}`,
      close: "Close preview",
      kicker: (chapters) => `English reading edition · ${chapters} chapters`,
      pageAlt: (title, page) =>
        `Source-edition cover for ${title}, page ${page}`,
      materialNote: "Source cover in German · English HTML reader",
      openOverview: "Open book and chapters",
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
        ? "Diese Fassung lässt Beratungspreise, private Unternehmensdaten, proprietäre Scores und die Rankings daraus weg. Sie arbeitet mit nachvollziehbaren Selbstprüfungen und verlinkten Primärquellen."
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

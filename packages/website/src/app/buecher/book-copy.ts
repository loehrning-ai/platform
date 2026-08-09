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
    readonly ledgerLabel: string;
    readonly ledgerFacts: readonly {
      readonly label: string;
      readonly value: string;
    }[];
    readonly collectionLabel: string;
    readonly collectionHeading: string;
    readonly collectionDescription: string;
    readonly publicationNumber: (position: number) => string;
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
    readonly openPreview: string;
    readonly pdfAfterLogin: string;
    readonly pdfUnavailable: string;
    readonly sourceNote: string;
    readonly pdfAvailability: (accountEnabled: boolean) => string;
    readonly reviewed: (date: string) => string;
    readonly bridgeKicker: string;
    readonly bridgeHeading: string;
    readonly bridgeBody: string;
    readonly viewCourses: string;
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
    readonly lastReviewed: (date: string) => string;
    readonly materialLanguage: string;
    readonly materialLanguageValue: string;
    readonly format: string;
    readonly extent: string;
    readonly access: string;
    readonly freeAccess: string;
    readonly coverAlt: (title: string) => string;
    readonly pdfAfterLogin: string;
    readonly pdfUnavailable: string;
    readonly onlineAccessNote: string;
    readonly adaptationLabel: string;
    readonly contentsAria: string;
    readonly contentsHeading: string;
    readonly contentsIntro: string;
    readonly chapterLanguage: string;
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
      "An introduction to AI readiness: why a sound data foundation matters more than tool selection, how teams can assess their starting point qualitatively, and how to read benchmarks without overstating them.",
    highlights: [
      "Qualitative assessment without a proprietary score",
      "Five areas of work for digital and AI readiness",
      "Interpretation of benchmarks, sectors, and limitations",
    ],
    adaptationNote:
      "The open edition removes consulting-market pricing, private company data, proprietary scores, and rankings derived from them. It uses traceable self-assessments and linked primary sources instead.",
  },
  "ki-arbeitsalltag": {
    title: "AI at Work",
    subtitle: "Companion book for the AI Essentials course",
    edition: "Working edition 2026",
    audience: "Employees and teams",
    resourceType: "HTML companion book",
    accessLabel: "Free online reader",
    statusLabel: "Reader available",
    relatedResourceLabel: "Open the AI Essentials course",
    description:
      "A measured introduction to core terms, common applications, prompting, data protection, and Article 4. Written for people who use AI at work without a technical background.",
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
      "A practical map of tool categories for small working contexts: which tasks are suitable for AI, which remain human, how to verify output, and how to document repeatable workflows.",
    highlights: [
      "Tool categories instead of rankings",
      "Selection criteria, risks, and control questions",
      "Example workflows for writing, research, and filing",
    ],
    adaptationNote: "",
  },
};

export const BOOK_PAGE_COPY: Readonly<Record<Locale, BookPageCopy>> = {
  de: {
    metadata: {
      title: "Bücher über KI und Datenreife",
      description: (count) =>
        `${count} veröffentlichte${count === 1 ? " Lesefassung" : " Lesefassungen"} über KI-Reife, Datenfundament und prüfbare Entscheidungen. Kostenlos online, ohne Konto.`,
      openGraphTitle: (count) =>
        `${count} freie${count === 1 ? " Lesefassung" : " Lesefassungen"} über KI`,
      openGraphDescription:
        "Redaktionell geprüfte Lernbücher mit offenem HTML-Reader, Quellenhinweisen und klar gekennzeichneten Grenzen.",
      detailTitleSuffix: "Lernbuch",
      detailDescription: (book) =>
        `${book.subtitle}. Deutsche HTML-Lesefassung, kostenlos und ohne Konto.`,
    },
    schema: {
      home: "Start",
      books: "Bücher",
      collectionName: "Bücher über KI und Datenreife",
      collectionDescription:
        "Veröffentlichte deutsche Lernbücher mit offenem HTML-Reader, Quellenhinweisen und klar gekennzeichneten Grenzen.",
      freeReadingEdition: "Kostenlose HTML-Lesefassung",
    },
    catalog: {
      kicker: "Lernbibliothek · Offene Lesefassungen",
      heading: "Sachbücher mit",
      headingAccent: "sichtbaren Quellen und Grenzen.",
      introduction: (count) =>
        `${count} redaktionell freigegebene${count === 1 ? " Lesefassung" : " Lesefassungen"}. Der HTML-Reader ist ohne Konto zugänglich. Sprache, Bearbeitungsstand und Download-Zugang stehen direkt am Titel.`,
      ledgerLabel: "Bestand",
      ledgerFacts: [
        { label: "Veröffentlicht", value: "1 Titel" },
        { label: "Materialsprache", value: "Deutsch" },
        { label: "Online-Zugang", value: "Ohne Konto" },
      ],
      collectionLabel: "Veröffentlichte Titel",
      collectionHeading: "Der aktuelle Bestand",
      collectionDescription:
        "Nur Titel mit dokumentierter redaktioneller Freigabe erscheinen hier.",
      publicationNumber: (position) =>
        `Ausgabe ${String(position).padStart(2, "0")}`,
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
      contents: "Behandelte Fragen",
      openOverview: "Buch und Kapitel öffnen",
      openPreview: "Titelseite ansehen",
      pdfAfterLogin: "Deutsches PDF nach Login",
      pdfUnavailable: "PDF-Download nicht verfügbar",
      sourceNote:
        "Die veröffentlichte Lesefassung basiert auf redaktioneller Arbeit aus 2025–2026. Primärquellen und Einschränkungen stehen in den jeweiligen Kapiteln.",
      pdfAvailability: (accountEnabled) =>
        accountEnabled
          ? "Der PDF-Download erfordert ein Konto."
          : "Der PDF-Download ist in dieser Version deaktiviert.",
      reviewed: (date) => `Geprüft: ${date}`,
      bridgeKicker: "Lernpfad",
      bridgeHeading: "Lesen schafft Kontext. Übungen prüfen das Verständnis.",
      bridgeBody:
        "Die Bücher ordnen Begriffe, Quellen und Grenzen ein. Die Kurse zerlegen dieselben Themen in Lektionen, Aufgaben und Wissenstests.",
      viewCourses: "Kurse ansehen",
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
        "Dieses Lernbuch ergänzt den Grundlagenkurs mit Quellen, Einordnung und längeren Argumenten.",
      kicker: "Lernbuch · Offene HTML-Lesefassung",
      chapterCount: (count) => `${count} Kapitel`,
      readingTime: (minutes) => `ca. ${minutes} Min.`,
      lastReviewed: (date) => `Geprüft ${date}`,
      materialLanguage: "Materialsprache",
      materialLanguageValue: "Deutsch",
      format: "Format",
      extent: "Umfang",
      access: "Online-Zugang",
      freeAccess: "Ohne Konto",
      coverAlt: (title) => `Deutsche Titelseite: ${title}`,
      pdfAfterLogin: "Anmelden, um das deutsche PDF herunterzuladen",
      pdfUnavailable: "PDF-Download in dieser Version nicht verfügbar",
      onlineAccessNote:
        "Die deutsche HTML-Fassung ist kostenlos und ohne Konto lesbar.",
      adaptationLabel: "Redaktioneller Hinweis",
      contentsAria: "Inhaltsverzeichnis",
      contentsHeading: "Inhaltsverzeichnis",
      contentsIntro:
        "Die Kapitel öffnen im deutschen Reader. Kapitelstand und Quellen gehören zur jeweiligen Fassung.",
      chapterLanguage: "Deutsch",
      chapterAria: (title) => `Kapitel „${title}“ öffnen`,
      minutesShort: (minutes) => `${minutes} Min.`,
      companionPrefix: "Begleitender Kurs",
      backToCatalog: "Zur Buchübersicht",
    },
    error: {
      eyebrow: "Bücher",
      title: "Die Buchseite konnte nicht geladen werden.",
      body: "Der Buchbestand wurde nicht ersetzt. Lade die geprüfte Fassung erneut.",
      retry: "Erneut laden",
      home: "Zur Startseite",
    },
  },
  en: {
    metadata: {
      title: "Books on AI and data readiness",
      description: (count) =>
        `${count} published English reading edition${count === 1 ? "" : "s"} on AI readiness, data foundations, and verifiable decisions. Free online, no account required.`,
      openGraphTitle: (count) =>
        `${count} free English reading edition${count === 1 ? "" : "s"} on AI`,
      openGraphDescription:
        "Editorially reviewed learning books with an open HTML reader, source notes, and explicit limitations.",
      detailTitleSuffix: "Learning book",
      detailDescription: (book) =>
        `${book.subtitle}. English HTML reading edition, available without payment or an account.`,
    },
    schema: {
      home: "Home",
      books: "Books",
      collectionName: "Books on AI and data readiness",
      collectionDescription:
        "Published English learning books with an open HTML reader, source notes, and explicit limitations.",
      freeReadingEdition: "Free English HTML reading edition",
    },
    catalog: {
      kicker: "Learning library · Open reading editions",
      heading: "Reference books with",
      headingAccent: "visible sources and limits.",
      introduction: (count) =>
        `${count} editorially approved English reading edition${count === 1 ? "" : "s"}. The HTML reader is available without an account. Language, review date, and download access are stated on the title.`,
      ledgerLabel: "Current collection",
      ledgerFacts: [
        { label: "Published", value: "1 title" },
        { label: "Material language", value: "English" },
        { label: "Online access", value: "No account" },
      ],
      collectionLabel: "Published titles",
      collectionHeading: "The current collection",
      collectionDescription:
        "Only titles with a recorded editorial approval appear here.",
      publicationNumber: (position) =>
        `Edition ${String(position).padStart(2, "0")}`,
      coverPreviewAria: (title) => `Open the cover preview for “${title}”`,
      coverAlt: (title) => `Source-edition cover for ${title}`,
      previewLabel: "View the cover",
      facts: {
        audience: "Audience",
        extent: "Extent",
        format: "Format",
        materialLanguage: "Material language",
      },
      chapterCount: (chapters) => `${chapters} chapters · HTML edition`,
      materialLanguageValue: "English",
      contents: "Questions covered",
      openOverview: "Open book and chapters",
      openPreview: "View the cover",
      pdfAfterLogin: "German PDF after sign-in",
      pdfUnavailable: "PDF download unavailable",
      sourceNote:
        "The published English reading edition is based on editorial work from 2025–2026. Primary sources and limitations are stated in the relevant chapters.",
      pdfAvailability: (accountEnabled) =>
        accountEnabled
          ? "The PDF download requires an account."
          : "The PDF download is disabled in this version.",
      reviewed: (date) => `Reviewed: ${date}`,
      bridgeKicker: "Learning path",
      bridgeHeading: "Reading builds context. Exercises test understanding.",
      bridgeBody:
        "The books explain terms, sources, and limitations. The courses break the same subjects into lessons, tasks, and knowledge checks.",
      viewCourses: "View courses",
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
        "This learning book adds sources, context, and longer arguments to the foundation course.",
      kicker: "Learning book · Open HTML reading edition",
      chapterCount: (count) => `${count} chapters`,
      readingTime: (minutes) => `approx. ${minutes} min`,
      lastReviewed: (date) => `Reviewed ${date}`,
      materialLanguage: "Material language",
      materialLanguageValue: "English",
      format: "Format",
      extent: "Extent",
      access: "Online access",
      freeAccess: "No account",
      coverAlt: (title) => `Source-edition cover for ${title}`,
      pdfAfterLogin: "Sign in to download the German PDF",
      pdfUnavailable: "PDF download is unavailable in this version",
      onlineAccessNote:
        "The English HTML edition is available without payment or an account.",
      adaptationLabel: "Editorial note",
      contentsAria: "Table of contents",
      contentsHeading: "Table of contents",
      contentsIntro:
        "The chapters open in the English reader. Chapter versions and sources belong to that edition.",
      chapterLanguage: "English",
      chapterAria: (title) => `Open the chapter “${title}”`,
      minutesShort: (minutes) => `${minutes} min`,
      companionPrefix: "Companion course",
      backToCatalog: "Back to books",
    },
    error: {
      eyebrow: "Books",
      title: "The book page could not be loaded.",
      body: "The catalogue has not been replaced. Reload the reviewed edition.",
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
        ? "Die offene Ausgabe entfernt Beratungsmarkt-Preisgestaltung, private Unternehmensdaten, proprietäre Scores und daraus abgeleitete Rankings. Sie nutzt stattdessen nachvollziehbare Selbstprüfungen und verlinkte Primärquellen."
        : "",
  };
}

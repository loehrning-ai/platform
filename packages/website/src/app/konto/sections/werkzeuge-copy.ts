import type { Locale } from "@/lib/i18n/locale";

/**
 * Copy for the Werkzeuge region.
 *
 * It lives beside the region rather than in account-copy.ts because the region
 * carries two mutually exclusive descriptions of the same tool, and only the
 * deployment's readiness decides which one is true. Keeping both next to the
 * component that chooses between them is what stops the source-only sentence
 * from being rendered by a deployment that does host the tool.
 */

/** Anchor target. Offered to the section nav only once the region renders. */
export const WERKZEUGE_SECTION_ID = "konto-werkzeuge";

/** The learner's own documents, or the honest absence of that number. */
export type CvEngineDocuments =
  | { readonly kind: "unavailable" }
  | {
      readonly kind: "ready";
      readonly count: number;
      readonly latest: {
        readonly title: string | null;
        readonly updatedAt: string;
      } | null;
    };

export interface WerkzeugeCopy {
  readonly heading: string;
  readonly intro: string;
  readonly cvEngineTitle: string;
  readonly cvEngineSourceBody: string;
  readonly cvEngineHostedBody: string;
  readonly documentCount: (count: number) => string;
  readonly noDocuments: string;
  readonly lastEdit: (date: string) => string;
  readonly lastEditNamed: (title: string, date: string) => string;
  readonly documentsUnavailable: string;
  readonly unreachable: string;
  readonly open: string;
  readonly source: string;
  readonly selfHost: string;
}

export const WERKZEUGE_COPY = {
  de: {
    heading: "Werkzeuge",
    intro:
      "Quelloffene Werkzeuge, die du mit deinem Konto nutzt oder selbst betreibst.",
    cvEngineTitle: "CV Engine",
    cvEngineSourceBody:
      "Macht aus einer YAML-Datei einen einseitigen Lebenslauf als PDF. Hier läuft das Werkzeug nicht gehostet: Du betreibst es auf deinem Rechner, und deine Daten bleiben dort.",
    cvEngineHostedBody:
      "Macht aus einer YAML-Datei einen einseitigen Lebenslauf als PDF. Deine Dokumente liegen im selben Konto wie dein Lernstand.",
    documentCount: (count) =>
      count === 1 ? "1 Dokument" : `${count} Dokumente`,
    noDocuments: "Noch kein Dokument angelegt.",
    lastEdit: (date) => `zuletzt bearbeitet am ${date}`,
    lastEditNamed: (title, date) => `zuletzt bearbeitet: ${title}, am ${date}`,
    documentsUnavailable:
      "Deine Dokumente lassen sich gerade nicht lesen; das Werkzeug läuft trotzdem.",
    unreachable:
      "Das gehostete Werkzeug ist vorübergehend nicht erreichbar. Deine Dokumente bleiben gespeichert.",
    open: "Öffnen",
    source: "Quellcode",
    selfHost: "Selbst betreiben",
  },
  en: {
    heading: "Tools",
    intro:
      "Open-source tools you use with your account or run yourself.",
    cvEngineTitle: "CV Engine",
    cvEngineSourceBody:
      "Turns a YAML file into a one-page CV as a PDF. It is not hosted here: you run it on your own machine, and your data stays there.",
    cvEngineHostedBody:
      "Turns a YAML file into a one-page CV as a PDF. Your documents live in the same account as your learning record.",
    documentCount: (count) =>
      count === 1 ? "1 document" : `${count} documents`,
    noDocuments: "No document created yet.",
    lastEdit: (date) => `last edited on ${date}`,
    lastEditNamed: (title, date) => `last edited: ${title}, on ${date}`,
    documentsUnavailable:
      "Your documents cannot be read right now; the tool still works.",
    unreachable:
      "The hosted tool is temporarily unreachable. Your documents stay stored.",
    open: "Open",
    source: "Source code",
    selfHost: "Run it yourself",
  },
} as const satisfies Readonly<Record<Locale, WerkzeugeCopy>>;

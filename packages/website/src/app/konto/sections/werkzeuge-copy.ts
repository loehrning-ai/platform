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
      "Werkzeuge aus der Plattform, die du mit deinem Konto benutzt. Jedes davon ist quelloffen, und du kannst jedes davon selbst betreiben.",
    cvEngineTitle: "CV Engine",
    cvEngineSourceBody:
      "Aus einer YAML-Datei wird ein einseitiger Lebenslauf als PDF. In dieser Umgebung läuft das Werkzeug nicht gehostet: du betreibst es auf deinem eigenen Rechner, und deine Daten bleiben dort.",
    cvEngineHostedBody:
      "Aus einer YAML-Datei wird ein einseitiger Lebenslauf als PDF. Deine Dokumente liegen in derselben Kontogrenze wie dein Lernstand, und du erreichst sie mit einem Klick.",
    documentCount: (count) =>
      count === 1 ? "1 Dokument" : `${count} Dokumente`,
    noDocuments: "Noch kein Dokument angelegt.",
    lastEdit: (date) => `zuletzt bearbeitet am ${date}`,
    lastEditNamed: (title, date) => `zuletzt bearbeitet: ${title}, am ${date}`,
    documentsUnavailable:
      "Deine Dokumente lassen sich gerade nicht lesen. Das Werkzeug selbst ist davon nicht betroffen.",
    unreachable:
      "Das gehostete Werkzeug ist vorübergehend nicht erreichbar. Deine Dokumente bleiben gespeichert, und du kannst die Engine jederzeit selbst betreiben.",
    open: "Öffnen",
    source: "Quellcode",
    selfHost: "Selbst betreiben",
  },
  en: {
    heading: "Tools",
    intro:
      "Tools from the platform that you use with your account. Each one is open source, and you can run each one yourself.",
    cvEngineTitle: "CV Engine",
    cvEngineSourceBody:
      "A YAML file becomes a one-page CV as a PDF. This environment does not host the tool: you run it on your own machine, and your data stays there.",
    cvEngineHostedBody:
      "A YAML file becomes a one-page CV as a PDF. Your documents live inside the same account boundary as your learning record, and you reach them in one click.",
    documentCount: (count) =>
      count === 1 ? "1 document" : `${count} documents`,
    noDocuments: "No document created yet.",
    lastEdit: (date) => `last edited on ${date}`,
    lastEditNamed: (title, date) => `last edited: ${title}, on ${date}`,
    documentsUnavailable:
      "Your documents cannot be read right now. The tool itself is unaffected.",
    unreachable:
      "The hosted tool is temporarily unreachable. Your documents remain stored, and you can run the engine yourself at any time.",
    open: "Open",
    source: "Source code",
    selfHost: "Run it yourself",
  },
} as const satisfies Readonly<Record<Locale, WerkzeugeCopy>>;

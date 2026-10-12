import type { Locale } from "@/lib/i18n/locale";

/**
 * The words around a workshop kit page that do not change from workshop to
 * workshop. What is specific to a kit (steps, rules, contents) lives in the
 * workshop's own `kit` block (src/lib/workshop-kit.ts).
 */
export interface KitPageCopy {
  readonly metaTitleSuffix: string;
  readonly kitKicker: string;
  readonly backToWorkshop: string;
  readonly backAria: (workshopTitle: string) => string;
  readonly toDownload: string;
  readonly home: string;
  readonly workshops: string;
  readonly statsLabel: string;
  readonly stepperLabel: string;
  readonly inLabel: string;
  readonly claudeLabel: string;
  readonly outLabel: string;
  readonly resultLabel: string;
  readonly fileLabel: string;
  readonly nextPrompt: (title: string) => string;
  readonly restart: string;
  readonly setupHeading: string;
  readonly homeHeading: string;
  readonly downloadHeading: string;
  readonly downloadAction: string;
  readonly downloadMeta: (sizeLabel: string) => string;
  readonly freeNote: string;
  readonly insideHeading: string;
  readonly stepOf: (current: number, total: number) => string;
}

export const KIT_PAGE_COPY: Readonly<Record<Locale, KitPageCopy>> = {
  de: {
    metaTitleSuffix: "Kit",
    kitKicker: "Kit",
    backToWorkshop: "Zum Workshop",
    backAria: (title) => `Zurück zum Workshop ${title}`,
    toDownload: "Zum Download",
    home: "Start",
    workshops: "Workshops",
    statsLabel: "Das Kit in Zahlen",
    stepperLabel: "Die Prompts des Kits",
    inLabel: "Das geht rein",
    claudeLabel: "Das macht Claude",
    outLabel: "Das kommt raus",
    resultLabel: "Ergebnis",
    fileLabel: "Datei",
    nextPrompt: (title) => `Weiter: ${title}`,
    restart: "Noch einmal von vorn",
    setupHeading: "Zuerst das Projekt",
    homeHeading: "Zu Hause nachmachen",
    downloadHeading: "Kit herunterladen",
    downloadAction: "Kit herunterladen",
    downloadMeta: (size) => `ZIP · ${size}`,
    freeNote: "Kostenlos, ohne Anmeldung.",
    insideHeading: "Das ist drin",
    stepOf: (current, total) => `${current} von ${total}`,
  },
  en: {
    metaTitleSuffix: "Kit",
    kitKicker: "Kit",
    backToWorkshop: "To the workshop",
    backAria: (title) => `Back to the workshop ${title}`,
    toDownload: "Jump to the download",
    home: "Home",
    workshops: "Workshops",
    statsLabel: "The kit in numbers",
    stepperLabel: "The prompts of the kit",
    inLabel: "What goes in",
    claudeLabel: "What Claude does",
    outLabel: "What comes out",
    resultLabel: "Result",
    fileLabel: "File",
    nextPrompt: (title) => `Next: ${title}`,
    restart: "Start again",
    setupHeading: "The Project first",
    homeHeading: "Replay it at home",
    downloadHeading: "Download the kit",
    downloadAction: "Download the kit",
    downloadMeta: (size) => `ZIP · ${size}`,
    freeNote: "Free, no sign-up.",
    insideHeading: "What is inside",
    stepOf: (current, total) => `${current} of ${total}`,
  },
};

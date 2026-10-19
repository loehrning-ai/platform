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
}

export const KIT_PAGE_COPY: Readonly<Record<Locale, KitPageCopy>> = {
  de: {
    metaTitleSuffix: "Kit",
    kitKicker: "Kit",
    backToWorkshop: "Zum Workshop",
    backAria: (title) => `Zurück zum Workshop ${title}`,
    toDownload: "Kit laden",
    home: "Start",
    workshops: "Workshops",
    statsLabel: "Das Kit in Zahlen",
    stepperLabel: "Die Prompts des Kits",
    inLabel: "Rein",
    claudeLabel: "Claude",
    outLabel: "Raus",
    resultLabel: "Dein Tipp",
    fileLabel: "Datei",
    nextPrompt: (title) => `Weiter: ${title}`,
    restart: "Noch einmal von vorn",
    setupHeading: "Zuerst das Projekt",
    homeHeading: "So geht es zu Hause",
    downloadHeading: "Dein Download",
    downloadAction: "Kit herunterladen",
    downloadMeta: (size) => `ZIP · ${size}`,
    freeNote: "kostenlos, ohne Anmeldung",
    insideHeading: "Das ist drin",
  },
  en: {
    metaTitleSuffix: "Kit",
    kitKicker: "Kit",
    backToWorkshop: "To the workshop",
    backAria: (title) => `Back to the workshop ${title}`,
    toDownload: "Get the kit",
    home: "Home",
    workshops: "Workshops",
    statsLabel: "The kit in numbers",
    stepperLabel: "The prompts of the kit",
    inLabel: "In",
    claudeLabel: "Claude",
    outLabel: "Out",
    resultLabel: "Your bet",
    fileLabel: "File",
    nextPrompt: (title) => `Next: ${title}`,
    restart: "Start again",
    setupHeading: "The Project first",
    homeHeading: "Replay it at home",
    downloadHeading: "Your download",
    downloadAction: "Download the kit",
    downloadMeta: (size) => `ZIP · ${size}`,
    freeNote: "free, no sign-up",
    insideHeading: "What is inside",
  },
};

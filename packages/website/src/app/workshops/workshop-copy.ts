import type { Locale } from "@/lib/i18n/locale";

export interface WorkshopPageCopy {
  readonly metadata: {
    readonly title: string;
    readonly description: (count: number) => string;
    readonly openGraphDescription: string;
    readonly collectionDescription: string;
    readonly imageAlt: string;
    readonly missingTitle: string;
    readonly detailTitleSuffix: string;
  };
  readonly catalog: {
    readonly kicker: string;
    readonly headingLead: string;
    readonly headingSecond: string;
    readonly introduction: (count: number) => string;
    readonly available: string;
    readonly availableDescription: string;
    readonly empty: string;
    readonly decision: string;
    readonly proofTarget: string;
    readonly proofOutput: string;
    readonly duration: string;
    readonly steps: string;
    readonly materials: string;
    readonly stepCount: (count: number) => string;
    readonly materialCount: (count: number) => string;
    readonly openWorkshop: string;
  };
  readonly detail: {
    readonly navigation: string;
    readonly backAria: string;
    readonly allWorkshops: string;
    readonly format: string;
    readonly duration: string;
    readonly steps: string;
    readonly audiences: string;
    readonly materialsAccess: string;
    readonly forWhom: string;
    readonly materialsHeading: string;
    readonly download: string;
    readonly openInBrowser: string;
    readonly language: string;
    readonly materialLanguageNote: string;
    readonly practiceCase: string;
    readonly syntheticCase: string;
    readonly realCompanyData: string;
    readonly fictionalExplanation: (companyName: string) => string;
    readonly realExplanation: (companyName: string, period: string) => string;
    readonly openDecision: string;
    readonly limitations: string;
    readonly realWorldHeading: string;
    readonly source: string;
    readonly stepsHeading: (count: number) => string;
    readonly stepsIntroduction: string;
    readonly referenceHeading: string;
    readonly referenceIntroduction: string;
    readonly accessBoundary: string;
  };
}

const NUMBER_WORDS: Readonly<Record<Locale, Readonly<Record<number, string>>>> =
  {
    de: { 4: "vier", 5: "fünf", 6: "sechs", 7: "sieben", 8: "acht", 9: "neun" },
    en: { 4: "Four", 5: "Five", 6: "Six", 7: "Seven", 8: "Eight", 9: "Nine" },
  };

export const WORKSHOP_PAGE_COPY: Readonly<Record<Locale, WorkshopPageCopy>> = {
  de: {
    metadata: {
      title: "Workshops für KI im Mittelstand",
      description: (count) =>
        `${count} kostenlose Selbstlern-Workshop${count === 1 ? "" : "s"} mit vollständigen Fällen, klaren Voraussetzungen und Material zum Nachbauen.`,
      openGraphDescription:
        "Selbstlern-Workshops für konkrete Entscheidungen. Browsermaterial und Dateien sind kostenlos und ohne Konto abrufbar.",
      collectionDescription:
        "Selbstlern-Workshops für KI im Mittelstand mit browserbasiertem Material und Dateien zum Nachbauen.",
      imageAlt: "Workshop-Katalog auf loehrning.ai",
      missingTitle: "Workshop nicht gefunden",
      detailTitleSuffix: "Workshop",
    },
    catalog: {
      kicker: "Entscheidungswerkstatt · Selbstgeführt",
      headingLead: "Selbstlern-Workshops",
      headingSecond: "für konkrete Entscheidungen.",
      introduction: (count) =>
        `${count} geführte${count === 1 ? "r Fall" : " Fälle"}. Erst entscheiden, dann Belege prüfen und die Methode auf den eigenen Kontext übertragen.`,
      available: "Wähle die Entscheidung",
      availableDescription: "Jeder Fall beginnt direkt im Entscheidungslabor.",
      empty: "Derzeit ist kein Workshop veröffentlicht.",
      decision: "Deine erste Entscheidung",
      proofTarget: "Ergebnis",
      proofOutput: "Entscheidung + Beleg",
      duration: "Dauer",
      steps: "Schritte",
      materials: "Material",
      stepCount: (count) => `${count} Schritte`,
      materialCount: (count) => `${count} ${count === 1 ? "Datei" : "Dateien"}`,
      openWorkshop: "Workshop öffnen",
    },
    detail: {
      navigation: "Workshopnavigation",
      backAria: "Zurück zu allen Workshops",
      allWorkshops: "Alle Workshops",
      format: "Format",
      duration: "Dauer",
      steps: "Schritte",
      audiences: "Zielgruppen",
      materialsAccess:
        "Kostenlos und ohne Anmeldung abrufbar. Die Sprache steht an jedem Material.",
      forWhom: "Für wen",
      materialsHeading: "Material zum Mitnehmen",
      download: "Download",
      openInBrowser: "Im Browser öffnen",
      language: "Sprache",
      materialLanguageNote:
        "Das Material selbst bleibt in der angegebenen Sprache.",
      practiceCase: "Der Übungsfall",
      syntheticCase: "Synthetisches Fallbeispiel",
      realCompanyData: "Echte Unternehmensdaten",
      fictionalExplanation: (companyName) =>
        `${companyName} ist frei erfunden: kein echtes Unternehmen, keine echten Geschäftszahlen. Die Werte sind realistisch gewählt, damit Berichte, Kennzahlen und die Entscheidung im Workshop einem typischen Analysefall entsprechen.`,
      realExplanation: (companyName, period) =>
        `${companyName}, ${period}: echte, öffentlich zugängliche Zahlen. Du arbeitest mit den Angaben des Unternehmens und den Grenzen seiner Berichterstattung.`,
      openDecision: "Die offene Entscheidung",
      limitations: "Was die Daten nicht beantworten können",
      realWorldHeading: "Anwendung auf reale Daten",
      source: "Quelle:",
      stepsHeading: (count) =>
        `Die ${NUMBER_WORDS.de[count] ?? String(count)} Schritte`,
      stepsIntroduction:
        "Der Ablauf zum Nachbauen: von der ersten Prüfung der Rohdaten bis zur begründeten Entscheidung.",
      referenceHeading: "Referenz",
      referenceIntroduction:
        "Zielgruppe, Fall und Ablauf bleiben greifbar, ohne vor der ersten Entscheidung zu stehen.",
      accessBoundary: "Zugang und Datenfluss",
    },
  },
  en: {
    metadata: {
      title: "Practical AI workshops for business",
      description: (count) =>
        `${count} free self-study workshop${count === 1 ? "" : "s"} with complete cases, explicit requirements, and reusable materials.`,
      openGraphDescription:
        "Self-study workshops for concrete decisions. Browser materials and files are available without payment or an account.",
      collectionDescription:
        "Self-study AI workshops for business, with browser-based exercises and reusable files.",
      imageAlt: "Workshop catalogue on loehrning.ai",
      missingTitle: "Workshop not found",
      detailTitleSuffix: "Workshop",
    },
    catalog: {
      kicker: "Decision workshop · Self-guided",
      headingLead: "Self-study workshops",
      headingSecond: "for concrete decisions.",
      introduction: (count) =>
        `${count} guided case${count === 1 ? "" : "s"}. Decide first, test the evidence, then transfer the method to your own context.`,
      available: "Choose the decision",
      availableDescription: "Every case opens directly in the decision lab.",
      empty: "No workshop is currently published.",
      decision: "Your first decision",
      proofTarget: "Output",
      proofOutput: "Decision + evidence",
      duration: "Duration",
      steps: "Steps",
      materials: "Materials",
      stepCount: (count) => `${count} steps`,
      materialCount: (count) => `${count} file${count === 1 ? "" : "s"}`,
      openWorkshop: "Open workshop",
    },
    detail: {
      navigation: "Workshop navigation",
      backAria: "Back to all workshops",
      allWorkshops: "All workshops",
      format: "Format",
      duration: "Duration",
      steps: "Steps",
      audiences: "Audience groups",
      materialsAccess:
        "Available without payment or an account. The language is stated on each item.",
      forWhom: "Who this is for",
      materialsHeading: "Workshop materials",
      download: "Download",
      openInBrowser: "Open in browser",
      language: "Language",
      materialLanguageNote:
        "The material itself remains in the stated language.",
      practiceCase: "Practice case",
      syntheticCase: "Synthetic case",
      realCompanyData: "Real company data",
      fictionalExplanation: (companyName) =>
        `${companyName} is fictional: it is not a real company and the figures are not real business results. The values are plausible so that the reports, metrics, and decision reflect a typical analysis case.`,
      realExplanation: (companyName, period) =>
        `${companyName}, ${period}: real, publicly available figures. You work with the company's own disclosures and the limitations of that reporting.`,
      openDecision: "Decision to make",
      limitations: "What the data cannot answer",
      realWorldHeading: "Apply the method to real data",
      source: "Source:",
      stepsHeading: (count) =>
        `${NUMBER_WORDS.en[count] ?? String(count)} steps`,
      stepsIntroduction:
        "The sequence to rebuild, from the first check of the raw data to a reasoned decision.",
      referenceHeading: "Reference",
      referenceIntroduction:
        "Audience, case, and sequence remain available without delaying the first decision.",
      accessBoundary: "Access and data flow",
    },
  },
};

export function materialLanguageLabel(
  locale: Locale,
  materialLanguage: Locale,
): string {
  if (locale === "de")
    return materialLanguage === "de" ? "Deutsch" : "Englisch";
  return materialLanguage === "de" ? "German" : "English";
}

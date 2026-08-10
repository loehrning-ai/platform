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
    readonly principles: readonly {
      readonly label: string;
      readonly body: string;
    }[];
    readonly available: string;
    readonly availableDescription: string;
    readonly empty: string;
    readonly learningPathKicker: string;
    readonly learningPathHeading: string;
    readonly learningPathBody: string;
    readonly viewCourses: string;
    readonly duration: string;
    readonly steps: string;
    readonly audiences: string;
    readonly materials: string;
    readonly downloads: string;
    readonly openWorkshop: string;
    readonly cardFacts: (args: {
      format: string;
      duration: string;
      steps: number;
      audiences: number;
      materials: number;
    }) => string;
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
    readonly classification: string;
    readonly classificationHeading: string;
    readonly classificationBodyBeforeEmail: string;
    readonly classificationBodyAfterEmail: string;
  };
}

const NUMBER_WORDS: Readonly<Record<Locale, Readonly<Record<number, string>>>> = {
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
      kicker: "Selbstlern-Workshops · Zum Nachbauen",
      headingLead: "Selbstlern-Workshops",
      headingSecond: "für konkrete Entscheidungen.",
      introduction: (count) =>
        `${count} geführte${count === 1 ? "r Workshop" : " Workshops"} mit vollständigem Fall, nachvollziehbarem Ablauf und Material zum Nachbauen. Benötigte Werkzeuge und Voraussetzungen stehen direkt am Einstieg.`,
      principles: [
        {
          label: "Geführter Ablauf",
          body: "Jeder Schritt benennt Aufgabe, Werkzeug und erwartetes Ergebnis. Es gibt keinen Termin und keine Buchung.",
        },
        {
          label: "Prüfbare Grundlage",
          body: "Fiktive Daten sind als solche markiert. Reale Fallstudien nennen Unternehmen, Zeitraum, Quelle und Grenzen.",
        },
        {
          label: "Wiederverwendbares Material",
          body: "Browserfassung und Dateien sind ohne Konto abrufbar. Sprache und Dateiformat stehen am jeweiligen Material.",
        },
      ],
      available: "Verfügbare Workshops",
      availableDescription:
        "Direkt im Browser, ohne Konto. Benötigte externe Werkzeuge stehen auf der jeweiligen Workshop-Seite.",
      empty: "Derzeit ist kein Workshop veröffentlicht.",
      learningPathKicker: "Workshops im Lernpfad",
      learningPathHeading: "Grundlagen zuerst. Anwendung danach.",
      learningPathBody:
        "Die Kurse erklären Begriffe und Grenzen. Die Workshops wenden sie auf einen abgegrenzten Fall an.",
      viewCourses: "Kurse ansehen",
      duration: "Dauer",
      steps: "Schritte",
      audiences: "Zielgruppen",
      materials: "Material",
      downloads: "Dateien",
      openWorkshop: "Workshop öffnen",
      cardFacts: ({ format, duration, steps, audiences, materials }) =>
        `${format}. Dauer: ${duration}. ${steps} Schritte. ${audiences} Zielgruppen. ${materials} Dateien.`,
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
      materialLanguageNote: "Das Material selbst bleibt in der angegebenen Sprache.",
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
      classification: "Einordnung",
      classificationHeading: "Selbstlern-Material, kein buchbarer Live-Termin.",
      classificationBodyBeforeEmail:
        "Diese Seite enthält eine geführte Übung und Dateien. Es gibt derzeit keinen Terminplan und keine Buchungsfunktion. Sachliche Fehler kannst du per E-Mail an",
      classificationBodyAfterEmail: "melden.",
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
      kicker: "Self-study workshops · Rebuild the method",
      headingLead: "Self-study workshops",
      headingSecond: "for concrete decisions.",
      introduction: (count) =>
        `${count} guided workshop${count === 1 ? "" : "s"} with a complete case, a traceable sequence, and reusable materials. Required tools and prerequisites are stated before you start.`,
      principles: [
        {
          label: "Guided sequence",
          body: "Every step names the task, tool, and expected result. There is no scheduled session and no booking flow.",
        },
        {
          label: "Traceable evidence",
          body: "Fictional data is labelled. Real cases state the company, reporting period, source, and limitations.",
        },
        {
          label: "Reusable materials",
          body: "Browser exercises and files are available without an account. Each item states its language and format.",
        },
      ],
      available: "Available workshops",
      availableDescription:
        "Open them directly in the browser without an account. Each workshop page states any external tool requirements.",
      empty: "No workshop is currently published.",
      learningPathKicker: "Workshops in the learning path",
      learningPathHeading: "Learn the concepts. Then apply them.",
      learningPathBody:
        "The courses explain terms and limitations. The workshops apply them to a bounded decision case.",
      viewCourses: "View courses",
      duration: "Duration",
      steps: "Steps",
      audiences: "Audiences",
      materials: "Materials",
      downloads: "Files",
      openWorkshop: "Open workshop",
      cardFacts: ({ format, duration, steps, audiences, materials }) =>
        `${format}. Duration: ${duration}. ${steps} steps. ${audiences} audience groups. ${materials} files.`,
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
      materialLanguageNote: "The material itself remains in the stated language.",
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
      classification: "Availability",
      classificationHeading: "Self-study material, not a bookable live session.",
      classificationBodyBeforeEmail:
        "This page contains a guided exercise and files. There is currently no schedule and no booking function. Report factual errors by email to",
      classificationBodyAfterEmail: ".",
    },
  },
};

export function materialLanguageLabel(locale: Locale, materialLanguage: Locale): string {
  if (locale === "de") return materialLanguage === "de" ? "Deutsch" : "Englisch";
  return materialLanguage === "de" ? "German" : "English";
}

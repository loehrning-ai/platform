import type { Locale } from "@/lib/i18n/locale";
import type {
  WorkshopMaterialRole,
  WorkshopPhase,
  WorkshopProvenance,
} from "@/lib/workshops";

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
    // Hub (design-direction 7.1, workshop-standard 4.2).
    readonly empty: string;
    /** The band's caps line, e.g. "Workshops · 3 Fälle". Works for any count. */
    readonly hubKicker: (count: number) => string;
    /** The H1. Describes the format; not a slogan. */
    readonly hubHeading: string;
    /** The tail of hubHeading set on the highlight band (HighlightedText). */
    readonly hubHeadingHighlight: string;
    /** Label of the tilted catalogue card beside the H1. */
    readonly catalogueIndex: string;
    /** One-sentence lead at every width. */
    readonly hubLead: string;
    /** The band's one action: into the recommended first workshop. */
    readonly hubStart: (number: string) => string;
    /** Line next to the cover-band button. */
    readonly hubAccess: string;
    readonly listHeading: string;
    /** Right-hand note of the list head: says how the list is ordered. */
    readonly listCaption: string;
    /** "Workshop 03", the start of a row's kicker line. */
    readonly workshopNumber: (number: string) => string;
    readonly leaveWith: string;
    /** Label of the limiting requirement on a row. */
    readonly requirementLabel: string;
    /** Requirement value when the workshop runs without any AI account. */
    readonly requirementBrowserOnly: string;
    /** Label before the material roles caption. */
    readonly materialLabel: string;
    /**
     * Hub nouns for material roles whose detail-page label does not read as
     * a material (the detail label of "builder" names an audience).
     */
    readonly materialNouns: Partial<Readonly<Record<WorkshopMaterialRole, string>>>;
    /** Tail of a capped material list: "3 weitere". */
    readonly moreMaterials: (count: number) => string;
    /**
     * Short hub wording of a workshop's limiting need, keyed by slug, where
     * needs[0] is written for the detail page and reads long in a row.
     */
    readonly requirementShort: Readonly<Record<string, string>>;
    /** "Live 90 Min." */
    readonly minutesLive: (minutes: number) => string;
    /** "Selbstlernen ca. 60 Min." */
    readonly minutesSelfStudy: (minutes: number) => string;
    /** Compact duration line of a phone row: "Live 90 Min. · Selbstlernen 60 Min." */
    readonly rowTimes: (live: number | undefined, self: number) => string;
    /** Takes an already formatted date. */
    readonly liveTested: (date: string) => string;
    readonly newBadge: string;
    /** Phone meta-line marker on the row the cover button recommends. */
    readonly startHere: string;
    readonly viewWorkshop: string;
    readonly teamsHeading: string;
    /** Takes the numbers of the workshops that ship a presenter view. */
    readonly teamsBody: (numbers: readonly string[]) => string;
    /** Keyboard hint after teamsBody; shown from lg only, since phones have no P key. */
    readonly teamsKeyHint: string;
    /** Shown once under the list. */
    readonly boundary: string;
  };
  readonly detail: {
    readonly navigation: string;
    readonly backAria: string;
    readonly allWorkshops: string;
    /** The stage under the band: two action cards (slides or lab, kit or case) and the pause control. */
    readonly stage: {
      /** sr-only h2 of the stage. */
      readonly heading: string;
      /** Titles of the four action cards. */
      readonly slides: string;
      readonly lab: string;
      readonly kit: string;
      readonly case: string;
      /** Card A of a workshop that starts at its demo. */
      readonly demo: string;
      /** CSS-only pause control (WCAG 2.2.2): label while motion plays, and while it is stopped. */
      readonly pauseOff: string;
      readonly pauseOn: string;
      /** The control's one stable accessible name: checked means paused. */
      readonly pauseLabel: string;
    };
    /** Caption facts in the cover band. */
    readonly coverFacts: {
      readonly publicFigures: string;
      readonly materialsInEnglish: string;
      readonly free: string;
    };
    /** Heading of the needs list in "Mehr Details". */
    readonly needLabel: string;
    readonly minutes: (minutes: number) => string;
    readonly minutesLive: (minutes: number) => string;
    readonly minutesSelfStudy: (minutes: number) => string;
    /** The one time fact of a self-study-only workshop: nothing is "alone" without a live option. */
    readonly minutesAbout: (minutes: number) => string;
    readonly optional: string;
    readonly materialHeading: string;
    readonly phaseLabels: Readonly<Record<WorkshopPhase, string>>;
    readonly roleLabels: Readonly<Record<WorkshopMaterialRole, string>>;
    readonly startHere: string;
    readonly openAction: string;
    readonly downloadAction: string;
    /** Action of a kit card that opens the kit page (not the zip), and the cover button to it. */
    readonly kitPageAction: string;
    /** Card A's secondary link to the workshop's practice demo. */
    readonly demoAction: string;
    /** Meta line of a demo card A, before its minutes: what the demo is. */
    readonly demoMeta: string;
    /** Card A's secondary link to the lab when the demo is card A. */
    readonly labAction: string;
    /** Screen-reader prefix of the material language ("Sprache: Englisch"). */
    readonly language: string;
    readonly selfHostHeading: string;
    readonly selfHostBody: string;
    readonly caseHeading: string;
    /** h3 of the result chart in the case section. */
    readonly resultChartHeading: string;
    /** Line under the chart: unit, what the values cover, whether they are invented. */
    readonly resultChartCaption: (unit: string, basis: string, fictional: boolean) => string;
    readonly syntheticCase: string;
    readonly realCompanyData: string;
    readonly realExplanation: (companyName: string, period: string) => string;
    /** Heading of the case facts in "Details" when the case has no heading of its own. */
    readonly limitations: string;
    readonly realWorldHeading: string;
    readonly source: string;
    readonly published: string;
    readonly reviewed: string;
    readonly forWhom: string;
    /** One plain line in the provenance line when the workshop's own note does not say it. */
    readonly inventedNote: string;
    readonly notNeededHeading: string;
    readonly notCoveredHeading: string;
    readonly provenanceHeading: string;
    readonly provenanceLabels: {
      readonly reviewedAt: string;
      readonly aiOutputsRecordedAt: string;
      readonly liveRunAt: string;
    };
    readonly provenanceData: Readonly<Record<WorkshopProvenance["data"], string>>;
  };
}

export const WORKSHOP_PAGE_COPY: Readonly<Record<Locale, WorkshopPageCopy>> = {
  de: {
    metadata: {
      title: "Workshops für KI im Mittelstand",
      description: (count) =>
        `${count} kostenlose Workshop${count === 1 ? "" : "s"} zu KI bei der Arbeit, mit erfundenem Fall und Material zum Herunterladen.`,
      openGraphDescription:
        "Workshops mit erfundenem Fall und einer Vorlage für deine Arbeit. Material kostenlos, ohne Konto.",
      collectionDescription:
        "Workshops zu KI im Mittelstand mit Folien, Laboren im Browser und Dateien zum Nacharbeiten.",
      imageAlt: "Workshop-Katalog auf loehrning.ai",
      missingTitle: "Workshop nicht gefunden",
      detailTitleSuffix: "Workshop",
    },
    catalog: {
      empty: "Derzeit ist kein Workshop veröffentlicht.",
      hubKicker: (count) =>
        `Workshops · ${count} ${count === 1 ? "Fall" : "Fälle"}`,
      hubHeading: "Workshops mit Fall und Vorlage.",
      hubHeadingHighlight: "mit Fall und Vorlage.",
      catalogueIndex: "Im Katalog",
      hubLead:
        "Du rechnest oder prüfst an den Daten einer erfundenen Firma und nimmst eine Vorlage für deine Arbeit mit.",
      hubStart: (number) => `Mit Workshop ${number} beginnen`,
      hubAccess: "Alle Materialien kostenlos, ohne Anmeldung",
      listHeading: "Workshops",
      listCaption: "Neueste zuerst",
      workshopNumber: (number) => `Workshop ${number}`,
      leaveWith: "Du nimmst mit",
      requirementLabel: "Du brauchst",
      requirementBrowserOnly: "Einen Browser, kein KI-Konto",
      materialLabel: "Material",
      materialNouns: { builder: "Bauanleitung" },
      moreMaterials: (count) => `${count} weitere`,
      requirementShort: {
        "geschaeftsberichte-mit-ki-lesen":
          "Claude-Desktop-App und ein Claude-Plan mit Claude Code",
        "esg-berichte-mit-ki": "Zum Nachmachen ein Claude-Plan mit Dateierstellung",
        "audit-vorbereitung-mit-ki": "Zum Nachmachen ein Claude-Konto, jeder Plan",
      },
      minutesLive: (minutes) => `Live ${minutes} Min.`,
      minutesSelfStudy: (minutes) => `Selbstlernen ca. ${minutes} Min.`,
      rowTimes: (live, self) =>
        live === undefined
          ? `Selbstlernen ${self} Min.`
          : `Live ${live} Min. · Selbstlernen ${self} Min.`,
      liveTested: (date) => `Live gehalten am ${date}`,
      newBadge: "Neu",
      startHere: "Einstieg",
      viewWorkshop: "Workshop ansehen",
      teamsHeading: "Mit deinem Team",
      teamsBody: (numbers) => {
        if (numbers.length === 0)
          return "Was du für eine Gruppe brauchst, steht auf der Workshop-Seite.";
        const list =
          numbers.length === 1
            ? `Workshop ${numbers[0]} hat`
            : `Workshops ${numbers.slice(0, -1).join(", ")} und ${numbers.at(-1)} haben`;
        return `${list} eine Moderationsansicht mit Notizen und Abstimmungsfragen.`;
      },
      teamsKeyHint: "Öffne das Deck und drück P.",
      boundary:
        "Alle Übungsfirmen sind erfunden, echte Zahlen tragen eine Quelle. Gezeigte KI-Antworten sind aufgezeichnet oder für die Übung konstruiert, keine Live-Abfragen.",
    },
    detail: {
      navigation: "Workshopnavigation",
      backAria: "Alle Workshops, zurück zur Übersicht",
      allWorkshops: "Alle Workshops",
      stage: {
        heading: "Starten",
        slides: "Folien ansehen",
        lab: "Labor öffnen",
        kit: "Kit herunterladen",
        case: "Fall ansehen",
        demo: "Demo öffnen",
        pauseOff: "Bewegung anhalten",
        pauseOn: "Bewegung starten",
        pauseLabel: "Bewegung pausieren",
      },
      coverFacts: {
        publicFigures: "erfundene Firma, dazu öffentliche Zahlen",
        materialsInEnglish: "Material auf Englisch",
        free: "kostenlos, ohne Anmeldung",
      },
      needLabel: "Du brauchst",
      minutes: (minutes) => `${minutes} Min.`,
      minutesLive: (minutes) => `Live ${minutes} Min.`,
      minutesSelfStudy: (minutes) => `Allein ca. ${minutes} Min.`,
      minutesAbout: (minutes) => `Ca. ${minutes} Min.`,
      optional: "optional",
      materialHeading: "Material",
      phaseLabels: {
        before: "Vor dem Workshop",
        during: "Im Workshop",
        after: "Danach",
      },
      roleLabels: {
        deck: "Deck",
        presenter: "Moderation",
        demo: "Demo",
        guide: "Lernbegleiter",
        lab: "Labor",
        case: "Fall",
        card: "Prüfkarte",
        exercise: "Übung",
        kit: "Kit",
        data: "Datensatz",
        hub: "Übersicht",
        builder: "Für Datenteams",
      },
      startHere: "Hier starten",
      openAction: "Öffnen",
      downloadAction: "Download",
      kitPageAction: "Kit ansehen",
      demoAction: "Demo öffnen",
      demoMeta: "Kit als Demo",
      labAction: "Vertiefung im Labor",
      language: "Sprache",
      selfHostHeading: "Selbst moderieren",
      selfHostBody:
        "Öffne das Deck auf dem Beamer und drück P.",
      caseHeading: "Der Fall",
      resultChartHeading: "Was der Fall zeigt",
      resultChartCaption: (unit, basis, fictional) =>
        [unit, basis, fictional ? "erfundene Zahlen" : null].filter(Boolean).join(", "),
      syntheticCase: "Erfundener Fall",
      realCompanyData: "Echte Unternehmensdaten",
      realExplanation: (companyName, period) =>
        `${companyName}, ${period}: öffentlich zugängliche Zahlen aus den Angaben des Unternehmens.`,
      limitations: "Was die Daten nicht beantworten",
      realWorldHeading: "Dieselbe Methode an echten Zahlen",
      source: "Quelle",
      published: "veröffentlicht",
      reviewed: "geprüft",
      forWhom: "Für wen",
      inventedNote: "Alle Firmen und Zahlen sind erfunden.",
      notNeededHeading: "Das brauchst du nicht",
      notCoveredHeading: "Nicht Teil dieses Workshops",
      provenanceHeading: "Stand und Herkunft",
      provenanceLabels: {
        reviewedAt: "geprüft",
        aiOutputsRecordedAt: "KI-Antworten aufgezeichnet",
        liveRunAt: "live gehalten",
      },
      provenanceData: {
        synthetic: "erfundene Daten",
        "synthetic-and-public": "öffentliche Zahlen mit Quelle",
      },
    },
  },
  en: {
    metadata: {
      title: "Practical AI workshops for business",
      description: (count) =>
        `${count} free workshop${count === 1 ? "" : "s"} on AI at work, with an invented case and materials to download.`,
      openGraphDescription:
        "Workshops with an invented case and a template for your own work. Materials free, no account.",
      collectionDescription:
        "AI workshops for business with slides, browser labs and files to work through.",
      imageAlt: "Workshop catalogue on loehrning.ai",
      missingTitle: "Workshop not found",
      detailTitleSuffix: "Workshop",
    },
    catalog: {
      empty: "No workshop is currently published.",
      hubKicker: (count) =>
        `Workshops · ${count} ${count === 1 ? "case" : "cases"}`,
      hubHeading: "Workshops with a case and a template.",
      hubHeadingHighlight: "with a case and a template.",
      catalogueIndex: "In the catalogue",
      hubLead:
        "You work through an invented company's data and leave with a template for your own work.",
      hubStart: (number) => `Start with Workshop ${number}`,
      hubAccess: "All materials free, no sign-up",
      listHeading: "Workshops",
      listCaption: "Newest first",
      workshopNumber: (number) => `Workshop ${number}`,
      leaveWith: "You leave with",
      requirementLabel: "You need",
      requirementBrowserOnly: "A browser, no AI account",
      materialLabel: "Materials",
      materialNouns: { builder: "Build guide" },
      moreMaterials: (count) => `${count} more`,
      requirementShort: {
        "geschaeftsberichte-mit-ki-lesen":
          "Claude desktop app and a Claude plan that includes Claude Code",
        "esg-berichte-mit-ki": "To replay it, a Claude plan with file creation",
        "audit-vorbereitung-mit-ki": "To replay it, a Claude account on any plan",
      },
      minutesLive: (minutes) => `Live ${minutes} min`,
      minutesSelfStudy: (minutes) => `Self-paced about ${minutes} min`,
      rowTimes: (live, self) =>
        live === undefined ? `Self-paced ${self} min` : `Live ${live} min · self-paced ${self} min`,
      liveTested: (date) => `Run live on ${date}`,
      newBadge: "New",
      startHere: "Start here",
      viewWorkshop: "View workshop",
      teamsHeading: "With your team",
      teamsBody: (numbers) => {
        if (numbers.length === 0) return "What you need for a group is on the workshop page.";
        const list =
          numbers.length === 1
            ? `Workshop ${numbers[0]} has`
            : `Workshops ${numbers.slice(0, -1).join(", ")} and ${numbers.at(-1)} have`;
        return `${list} a presenter view with notes and voting questions.`;
      },
      teamsKeyHint: "Open the deck and press P.",
      boundary:
        "All practice companies are invented, and real figures carry a source. AI answers shown are recorded or constructed for the exercise, not live requests.",
    },
    detail: {
      navigation: "Workshop navigation",
      backAria: "Back to all workshops",
      allWorkshops: "All workshops",
      stage: {
        heading: "Start",
        slides: "View the slides",
        lab: "Open the lab",
        kit: "Download the kit",
        case: "See the case",
        demo: "Open the demo",
        pauseOff: "Stop motion",
        pauseOn: "Start motion",
        pauseLabel: "Pause motion",
      },
      coverFacts: {
        publicFigures: "invented company, plus public figures",
        materialsInEnglish: "materials in English",
        free: "free, no sign-up",
      },
      needLabel: "You need",
      minutes: (minutes) => `${minutes} min`,
      minutesLive: (minutes) => `Live ${minutes} min`,
      minutesSelfStudy: (minutes) => `solo about ${minutes} min`,
      minutesAbout: (minutes) => `About ${minutes} min`,
      optional: "optional",
      materialHeading: "Materials",
      phaseLabels: {
        before: "Before the workshop",
        during: "During the workshop",
        after: "Afterwards",
      },
      roleLabels: {
        deck: "Deck",
        presenter: "Presenter",
        demo: "Demo",
        guide: "Learner guide",
        lab: "Lab",
        case: "Case",
        card: "Field card",
        exercise: "Exercise",
        kit: "Kit",
        data: "Dataset",
        hub: "Overview",
        builder: "For data teams",
      },
      startHere: "Start here",
      openAction: "Open",
      downloadAction: "Download",
      kitPageAction: "View the kit",
      demoAction: "Open the demo",
      demoMeta: "Kit as a demo",
      labAction: "Go further in the lab",
      language: "Language",
      selfHostHeading: "Run it yourself",
      selfHostBody:
        "Open the deck on the projector and press P.",
      caseHeading: "The case",
      resultChartHeading: "What the case shows",
      resultChartCaption: (unit, basis, fictional) =>
        [unit, basis, fictional ? "invented figures" : null].filter(Boolean).join(", "),
      syntheticCase: "Invented case",
      realCompanyData: "Real company data",
      realExplanation: (companyName, period) =>
        `${companyName}, ${period}: publicly available figures from the company's own disclosures.`,
      limitations: "What the data cannot answer",
      realWorldHeading: "The same method on real figures",
      source: "Source",
      published: "published",
      reviewed: "reviewed",
      forWhom: "Who this is for",
      inventedNote: "All companies and figures are invented.",
      notNeededHeading: "What you don't need",
      notCoveredHeading: "Not part of this workshop",
      provenanceHeading: "Provenance",
      provenanceLabels: {
        reviewedAt: "checked",
        aiOutputsRecordedAt: "AI answers recorded",
        liveRunAt: "run live",
      },
      provenanceData: {
        synthetic: "invented data",
        "synthetic-and-public": "public figures with source",
      },
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

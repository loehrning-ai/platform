import type { Locale } from "@/lib/i18n/locale";
import type {
  WorkshopActivity,
  WorkshopMaterialRole,
  WorkshopPhase,
  WorkshopProvenance,
} from "@/lib/workshops";

/** One station of the route on the hub ("So laufen die Workshops 03 und 04"). */
export interface WorkshopRouteStation {
  readonly label: string;
  readonly caption: string;
}

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
    readonly routeHeading: string;
    readonly routeCaption: string;
    /** Five stations, the spine of the workshops the heading names. Static: a description, not progress. */
    readonly routeStations: readonly WorkshopRouteStation[];
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
    /** Phone back link in the cover kicker line. */
    readonly workshopsShort: string;
    /** Label above the q-card in the cover band. */
    readonly questionLabel: string;
    /** Secondary cover-band button that jumps to the material list. */
    readonly seeMaterials: string;
    /** Cover-band buttons, chosen by the role of the material they open. */
    readonly primaryAction: Readonly<Record<WorkshopMaterialRole, string>>;
    /** Caption facts in the cover band. */
    readonly coverFacts: {
      readonly fictionalCase: string;
      readonly publicFigures: string;
      readonly materialsInEnglish: string;
      readonly free: string;
    };
    /** "Du brauchst" in the cover caption, followed by the limiting need. */
    readonly needLabel: string;
    /** Limiting need when the workshop runs without any AI account. */
    readonly browserOnly: string;
    readonly outcomesHeading: string;
    readonly leaveWith: string;
    readonly agendaHeading: string;
    readonly minutes: (minutes: number) => string;
    readonly minutesLive: (minutes: number) => string;
    readonly minutesSelfStudy: (minutes: number) => string;
    /** Caption on where the agenda minutes come from. */
    readonly agendaSource: { readonly deck: string; readonly plan: string };
    /** Station caption for an item that runs only with a group. */
    readonly liveOnly: string;
    /** Extra caption line on the station the decision lab mirrors. */
    readonly labStation: string;
    /** Link under the agenda to the decision lab, naming the station when known. */
    readonly tryBelow: (stationLabel?: string) => string;
    readonly activityLabels: Readonly<Record<WorkshopActivity, string>>;
    readonly optional: string;
    readonly materialHeading: string;
    readonly phaseLabels: Readonly<Record<WorkshopPhase, string>>;
    readonly roleLabels: Readonly<Record<WorkshopMaterialRole, string>>;
    readonly startHere: string;
    readonly openAction: string;
    readonly downloadAction: string;
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
    readonly openDecision: string;
    readonly limitations: string;
    readonly realWorldHeading: string;
    readonly source: string;
    readonly published: string;
    readonly reviewed: string;
    readonly forWhom: string;
    readonly needsHeading: string;
    readonly notNeededHeading: string;
    readonly notCoveredHeading: string;
    readonly provenanceHeading: string;
    readonly provenanceLabels: {
      readonly author: string;
      readonly reviewedAt: string;
      readonly aiOutputsRecordedAt: string;
      readonly liveRunAt: string;
      readonly data: string;
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
      routeHeading: "So laufen die Workshops 03 und 04",
      routeCaption: "Je 90 Minuten live",
      routeStations: [
        { label: "Die Frage", caption: "Ein Fall und eine Frage, die bis zum Schluss bleibt" },
        { label: "Die falsche Antwort", caption: "Eine Antwort, die plausibel klingt und nicht stimmt" },
        { label: "Warum sie falsch ist", caption: "Was in den Daten niemand festgelegt hat" },
        { label: "Die Reparatur", caption: "Was die Antwort richtig macht" },
        { label: "Deine Vorlage", caption: "Eine Seite für deinen eigenen Fall" },
      ],
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
      workshopsShort: "Workshops",
      questionLabel: "Die Frage des Workshops",
      seeMaterials: "Material ansehen",
      primaryAction: {
        deck: "Deck öffnen",
        presenter: "Moderationsansicht öffnen",
        demo: "Demo starten",
        guide: "Lernbegleiter lesen",
        lab: "Labore öffnen",
        case: "Fall öffnen",
        card: "Prüfkarte öffnen",
        exercise: "Übung öffnen",
        kit: "Kit herunterladen",
        data: "Datensatz herunterladen",
        hub: "Übersicht öffnen",
        builder: "Leitfaden öffnen",
      },
      coverFacts: {
        fictionalCase: "erfundener Fall",
        publicFigures: "erfundener Fall und öffentliche Zahlen",
        materialsInEnglish: "Material auf Englisch",
        free: "kostenlos, ohne Anmeldung",
      },
      needLabel: "Du brauchst",
      browserOnly: "einen Browser, kein KI-Konto",
      outcomesHeading: "Nach dem Workshop",
      leaveWith: "Du nimmst mit",
      agendaHeading: "Ablauf",
      minutes: (minutes) => `${minutes} Min.`,
      minutesLive: (minutes) => `Live ${minutes} Min.`,
      minutesSelfStudy: (minutes) => `Selbstlernen ca. ${minutes} Min.`,
      agendaSource: {
        deck: "",
        plan: "Geplante Minuten, noch nicht mit Testpersonen gemessen.",
      },
      liveOnly: "nur live",
      labStation: "Übung unten",
      tryBelow: (stationLabel) =>
        stationLabel
          ? `„${stationLabel}“ unten ausprobieren`
          : "Unten ausprobieren",
      activityLabels: {
        listen: "Zuhören",
        vote: "Abstimmen",
        do: "Mitmachen",
        write: "Schreiben",
      },
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
      openDecision: "Die offene Entscheidung",
      limitations: "Was die Daten nicht beantworten",
      realWorldHeading: "Dieselbe Methode an echten Zahlen",
      source: "Quelle",
      published: "veröffentlicht",
      reviewed: "geprüft",
      forWhom: "Für wen",
      needsHeading: "Das brauchst du",
      notNeededHeading: "Das brauchst du nicht",
      notCoveredHeading: "Nicht Teil dieses Workshops",
      provenanceHeading: "Stand und Herkunft",
      provenanceLabels: {
        author: "Von",
        reviewedAt: "zuletzt geprüft",
        aiOutputsRecordedAt: "KI-Antworten aufgezeichnet",
        liveRunAt: "live gehalten",
        data: "Daten",
      },
      provenanceData: {
        synthetic: "erfunden",
        "synthetic-and-public": "erfunden, dazu öffentliche Zahlen mit Quelle",
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
      routeHeading: "How Workshops 03 and 04 run",
      routeCaption: "90 minutes live each",
      routeStations: [
        { label: "The question", caption: "One case and a question that stays to the end" },
        { label: "The wrong answer", caption: "An answer that sounds plausible and is wrong" },
        { label: "Why it is wrong", caption: "What nobody defined in the data" },
        { label: "The fix", caption: "What makes the answer right" },
        { label: "Your template", caption: "One page for your own case" },
      ],
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
      workshopsShort: "Workshops",
      questionLabel: "The workshop's question",
      seeMaterials: "See materials",
      primaryAction: {
        deck: "Open the deck",
        presenter: "Open the presenter view",
        demo: "Start the demo",
        guide: "Read the learner guide",
        lab: "Open the labs",
        case: "Open the case",
        card: "Open the field card",
        exercise: "Open the exercise",
        kit: "Download the kit",
        data: "Download the dataset",
        hub: "Open the overview",
        builder: "Open the guide",
      },
      coverFacts: {
        fictionalCase: "invented case",
        publicFigures: "invented case plus public figures",
        materialsInEnglish: "materials in English",
        free: "free, no sign-up",
      },
      needLabel: "You need",
      browserOnly: "a browser, no AI account",
      outcomesHeading: "After this you can",
      leaveWith: "You leave with",
      agendaHeading: "Agenda",
      minutes: (minutes) => `${minutes} min`,
      minutesLive: (minutes) => `Live ${minutes} min`,
      minutesSelfStudy: (minutes) => `self-paced about ${minutes} min`,
      agendaSource: {
        deck: "",
        plan: "Planned minutes, not yet measured with test readers.",
      },
      liveOnly: "live only",
      labStation: "Exercise below",
      tryBelow: (stationLabel) =>
        stationLabel ? `Try “${stationLabel}” below` : "Try it below",
      activityLabels: {
        listen: "Listen",
        vote: "Vote",
        do: "Do",
        write: "Write",
      },
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
      openDecision: "Decision to make",
      limitations: "What the data cannot answer",
      realWorldHeading: "The same method on real figures",
      source: "Source",
      published: "published",
      reviewed: "reviewed",
      forWhom: "Who this is for",
      needsHeading: "What you need",
      notNeededHeading: "What you don't need",
      notCoveredHeading: "Not part of this workshop",
      provenanceHeading: "Provenance",
      provenanceLabels: {
        author: "By",
        reviewedAt: "last reviewed",
        aiOutputsRecordedAt: "AI answers recorded",
        liveRunAt: "run live",
        data: "Data",
      },
      provenanceData: {
        synthetic: "invented",
        "synthetic-and-public": "invented, plus public figures with source",
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

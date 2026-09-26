import type { Locale } from "@/lib/i18n/locale";
import type {
  WorkshopActivity,
  WorkshopMaterialRole,
  WorkshopPhase,
  WorkshopProvenance,
} from "@/lib/workshops";

/** One station of the "So läuft jeder Workshop" route on the hub. */
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
    /** Cover-band kicker, e.g. "Workshops · 3 Fälle". Works for any count. */
    readonly hubKicker: (count: number) => string;
    /** The H1. Describes the format; not a slogan. */
    readonly hubHeading: string;
    readonly hubLead: string;
    /** The one Mennige-group action of the page: into the first workshop of the list. */
    readonly hubStart: (number: string) => string;
    /** Line next to the cover-band button. */
    readonly hubAccess: string;
    /** Accessible name of the index row of anchor links in the cover band. */
    readonly hubIndexLabel: string;
    readonly routeHeading: string;
    readonly routeCaption: string;
    /** Five stations, the spine every workshop follows. Static: a description, not progress. */
    readonly routeStations: readonly WorkshopRouteStation[];
    readonly listHeading: string;
    /** Right-hand note of the list head: says how the list is ordered. */
    readonly listCaption: string;
    /** "Workshop 03", the start of a row's kicker line. */
    readonly workshopNumber: (number: string) => string;
    /** Label before the workshop's fixed question on a row. */
    readonly questionLabel: string;
    /** Wraps the fixed question in the locale's quotation marks. */
    readonly quote: (text: string) => string;
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
    /** "Allein ca. 60 Min." */
    readonly minutesSelfStudy: (minutes: number) => string;
    /** Takes an already formatted date. */
    readonly liveTested: (date: string) => string;
    readonly newBadge: string;
    readonly viewWorkshop: string;
    readonly teamsHeading: string;
    /** Takes the numbers of the workshops that ship a presenter view. */
    readonly teamsBody: (numbers: readonly string[]) => string;
    /** Shown once under the list. */
    readonly boundary: string;
  };
  readonly detail: {
    readonly navigation: string;
    readonly backAria: string;
    readonly allWorkshops: string;
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
    readonly activityLabels: Readonly<Record<WorkshopActivity, string>>;
    readonly optional: string;
    readonly materialHeading: string;
    /** Right-hand note of the material section head. */
    readonly materialsAccess: string;
    /** Added when every material of the workshop is in English; null where the page is English. */
    readonly materialsLanguage: string | null;
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
    readonly syntheticCase: string;
    readonly realCompanyData: string;
    readonly fictionalExplanation: (companyName: string) => string;
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
        `${count} kostenlose Workshop${count === 1 ? "" : "s"} zu KI bei der Arbeit, jeder mit einem erfundenen Fall, einem Ablauf in Minuten und Material zum Herunterladen.`,
      openGraphDescription:
        "Workshops mit einem erfundenen Fall, einer festen Frage und einer Vorlage für deine eigene Arbeit. Material kostenlos und ohne Konto.",
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
      hubHeading: "Workshops mit Fall und Vorlage",
      hubLead:
        "Jeder Workshop dreht sich um eine Frage an eine erfundene Firma. Du prüfst eine Antwort an den Daten und schreibst am Ende auf, wie das für deine eigene Arbeit aussieht.",
      hubStart: (number) => `Mit Workshop ${number} beginnen`,
      hubAccess: "Alle Materialien kostenlos, ohne Anmeldung",
      hubIndexLabel: "Workshops auf dieser Seite",
      routeHeading: "So läuft jeder Workshop",
      routeCaption: "60 bis 90 Minuten",
      routeStations: [
        { label: "Die Frage", caption: "Ein Fall und eine Frage, die bis zum Schluss bleibt" },
        { label: "Die falsche Antwort", caption: "Eine Antwort, die plausibel klingt und nicht stimmt" },
        { label: "Warum sie falsch ist", caption: "Was in den Daten niemand festgelegt hat" },
        { label: "Die Reparatur", caption: "Was die Antwort richtig macht, Schritt für Schritt" },
        { label: "Deine Vorlage", caption: "Eine Seite für deinen eigenen Fall" },
      ],
      listHeading: "Workshops",
      listCaption: "Neueste zuerst",
      workshopNumber: (number) => `Workshop ${number}`,
      questionLabel: "Die Frage",
      quote: (text) => `„${text}“`,
      leaveWith: "Du gehst mit",
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
      minutesSelfStudy: (minutes) => `Allein ca. ${minutes} Min.`,
      liveTested: (date) => `Live gehalten am ${date}`,
      newBadge: "Neu",
      viewWorkshop: "Workshop ansehen",
      teamsHeading: "Mit deinem Team",
      teamsBody: (numbers) => {
        const tail =
          "Was du für eine Gruppe brauchst, steht auf der Workshop-Seite.";
        if (numbers.length === 0) return tail;
        const list =
          numbers.length === 1
            ? `Workshop ${numbers[0]} hat`
            : `Workshops ${numbers.slice(0, -1).join(", ")} und ${numbers.at(-1)} haben`;
        return `${list} eine Moderationsansicht mit Notizen und Abstimmungsfragen. Öffne das Deck und drück P. ${tail}`;
      },
      boundary:
        "Alle Übungsfirmen sind erfunden. Wo echte Zahlen vorkommen, nennt die Workshop-Seite die Quelle. Gezeigte KI-Antworten sind Aufzeichnungen mit Datum und keine Live-Abfragen.",
    },
    detail: {
      navigation: "Workshopnavigation",
      backAria: "Zurück zu allen Workshops",
      allWorkshops: "Alle Workshops",
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
      outcomesHeading: "Danach kannst du",
      leaveWith: "Du gehst mit",
      agendaHeading: "Ablauf",
      minutes: (minutes) => `${minutes} Min.`,
      minutesLive: (minutes) => `Live ${minutes} Min.`,
      minutesSelfStudy: (minutes) => `allein ca. ${minutes} Min.`,
      agendaSource: {
        deck: "Die Minuten stammen aus den Zeiten im Deck.",
        plan: "Geplante Minuten, noch nicht mit Testpersonen gemessen.",
      },
      liveOnly: "nur live",
      activityLabels: {
        listen: "Zuhören",
        vote: "Abstimmen",
        do: "Mitmachen",
        write: "Schreiben",
      },
      optional: "optional",
      materialHeading: "Material",
      materialsAccess: "Kostenlos, ohne Anmeldung.",
      materialsLanguage: "Alle Materialien auf Englisch.",
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
      downloadAction: "Laden",
      language: "Sprache",
      selfHostHeading: "Selbst moderieren",
      selfHostBody:
        "Öffne das Deck auf dem Beamer und drück P. Die Moderationsansicht zeigt Notizen, Abstimmungsfragen und eine Uhr.",
      caseHeading: "Der Fall",
      syntheticCase: "Erfundener Fall",
      realCompanyData: "Echte Unternehmensdaten",
      fictionalExplanation: (companyName) =>
        `${companyName} und alle Zahlen sind für diesen Workshop erfunden.`,
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
        `${count} free workshop${count === 1 ? "" : "s"} on AI at work, each with an invented case, an agenda in minutes and materials to download.`,
      openGraphDescription:
        "Workshops with an invented case, one fixed question and a template for your own work. Materials are free and need no account.",
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
      hubHeading: "Workshops with a case and a template",
      hubLead:
        "Each workshop centres on one question about an invented company. You check an answer against the data and finish by writing down how it applies to your own work.",
      hubStart: (number) => `Start with Workshop ${number}`,
      hubAccess: "All materials free, no sign-up",
      hubIndexLabel: "Workshops on this page",
      routeHeading: "How every workshop runs",
      routeCaption: "60 to 90 minutes",
      routeStations: [
        { label: "The question", caption: "One case and a question that stays to the end" },
        { label: "The wrong answer", caption: "An answer that sounds plausible and is wrong" },
        { label: "Why it is wrong", caption: "What nobody fixed in the data" },
        { label: "The fix", caption: "What makes the answer right, step by step" },
        { label: "Your template", caption: "One page for your own case" },
      ],
      listHeading: "Workshops",
      listCaption: "Newest first",
      workshopNumber: (number) => `Workshop ${number}`,
      questionLabel: "The question",
      quote: (text) => `“${text}”`,
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
      minutesSelfStudy: (minutes) => `Alone about ${minutes} min`,
      liveTested: (date) => `Run live on ${date}`,
      newBadge: "New",
      viewWorkshop: "View workshop",
      teamsHeading: "With your team",
      teamsBody: (numbers) => {
        const tail = "What you need for a group is on the workshop page.";
        if (numbers.length === 0) return tail;
        const list =
          numbers.length === 1
            ? `Workshop ${numbers[0]} has`
            : `Workshops ${numbers.slice(0, -1).join(", ")} and ${numbers.at(-1)} have`;
        return `${list} a presenter view with notes and voting questions. Open the deck and press P. ${tail}`;
      },
      boundary:
        "All practice companies are invented. Where real figures appear, the workshop page names the source. AI answers shown are dated recordings, not live requests.",
    },
    detail: {
      navigation: "Workshop navigation",
      backAria: "Back to all workshops",
      allWorkshops: "All workshops",
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
      minutesSelfStudy: (minutes) => `on your own about ${minutes} min`,
      agendaSource: {
        deck: "The minutes come from the timings in the deck.",
        plan: "Planned minutes, not yet measured with test readers.",
      },
      liveOnly: "live only",
      activityLabels: {
        listen: "Listen",
        vote: "Vote",
        do: "Do",
        write: "Write",
      },
      optional: "optional",
      materialHeading: "Materials",
      materialsAccess: "Free, no sign-up.",
      materialsLanguage: null,
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
        "Open the deck on the projector and press P. The presenter view shows notes, room votes and a clock.",
      caseHeading: "The case",
      syntheticCase: "Invented case",
      realCompanyData: "Real company data",
      fictionalExplanation: (companyName) =>
        `${companyName} and every figure are invented for this workshop.`,
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

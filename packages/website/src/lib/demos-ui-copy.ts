import type { Locale } from "@/lib/i18n/locale";
import type {
  DemoEvidenceMode,
  DemoExternalActionMode,
} from "@/lib/demos";

export const DEMOS_PAGE_COPY = {
  de: {
    metadata: {
      title: "KI-Praxisbeispiele im Browser",
      description: (count: number) =>
        `${count} interaktive KI-Praxisbeispiele mit ausgewiesenen Daten, Annahmen und Kontrollschritten.`,
      openGraphDescription: (count: number) =>
        `${count} interaktive Praxisbeispiele für KI-Workflows, Automatisierung, Retrieval, Governance und Betrieb.`,
      missingTitle: "Praxisbeispiel nicht gefunden",
      detailSuffix: "KI-Praxisbeispiel",
    },
    catalog: {
      kicker: "Praxisbeispiele",
      // The poster caps line on the IDEA band reads "kicker · kickerDetail".
      kickerDetail: "im Browser",
      // The soft hyphen lets the poster H1 break "KI-Arbeits-" / "abläufe"
      // on a phone instead of leaving "KI-" alone on the first line.
      heading: "KI-Arbeits\u00adabläufe prüfen",
      // One sentence: the stat line below says what runs and what is
      // simulated.
      introduction:
        "Jedes Beispiel spielt einen KI-Arbeitsablauf mit erfundenen Daten durch.",
      statsLabel: "Umfang der Sammlung",
      // Phone stat line, one item per list entry so a wrap never strands a
      // separator; the StatRow carries the same numbers from sm up.
      statsLine: (examples: number, actions: number) => [
        `${examples} Beispiele`,
        actions === 0
          ? "nichts wird wirklich gesendet"
          : `${actions} echte Außenaktionen`,
      ],
      stats: {
        examples: { label: "Praxisbeispiele", note: "im Browser, ohne Konto" },
        modes: {
          label: "Simulationsarten",
          note: "synthetisch, regelbasiert, aufgezeichnet",
        },
        externalActions: {
          label: "Echte Außenaktionen",
          note: "nichts wird wirklich gesendet oder gebucht",
        },
      },
      galleryHeading: "Alle Beispiele",
      level: "Reifegrad",
      category: "Kategorie",
      all: "Alle",
      result: "Filter-Ergebnis",
      resultSingular: "Praxisbeispiel",
      resultPlural: "Praxisbeispiele",
      industryPrefix: "Arbeitskontext",
      emptyTitle: "Keine Treffer.",
      emptyBody: "Kein Beispiel passt zu dieser Kombination.",
      reset: "Filter zurücksetzen",
      // Phone filter disclosure: one 44px button instead of three selects.
      filterToggle: "Filter",
      activeFilters: (count: number) => `${count} aktiv`,
    },
    tile: {
      kind: "Praxisbeispiel",
      open: "Beispiel öffnen",
      openAria: (title: string) => `Praxisbeispiel öffnen: ${title}`,
    },
    detail: {
      home: "Start",
      catalog: "Praxisbeispiele",
      allExamples: "Alle Praxisbeispiele",
      example: "Praxisbeispiel",
      module: "Modul",
      lesson: "Lektion",
      block: "Block",
      toLesson: "Zur Lektion",
      openCourse: "Zum Kurs",
      aboutHeading: "Worum es geht",
      checksHeading: "Was du prüfen kannst",
      runHeading: "So läuft dieses Beispiel",
      // Phone-only button that folds the checks and the run table.
      notesToggle: "So prüfst du das Beispiel",
      dataLabel: "Daten",
      executionLabel: "Ausführung",
      actionsLabel: "Externe Aktionen",
      stopLabel: "Abbruch",
      noActions: "Keine",
      // Values for the run table's "Externe Aktionen" row. The evidence line
      // above the engine keeps the full DEMO_ACTION_LABELS phrase; in the
      // table the row label already says "Aktionen", so the value is short.
      actionValue: {
        none: "Keine",
        simulated: "Simuliert",
        review_gated: "Simuliert, mit Freigabe-Schritt",
        real_disabled: "Deaktiviert",
      },
      courseHeading: "Im Kurs",
      workContexts: "Arbeitskontexte",
      workContextAria: (context: string) => `Praxisbeispiele im Arbeitskontext ${context}`,
      relatedBooks: "Vertiefende Bücher",
      publicLabel: "Öffentlich",
      nextExample: "Nächstes Praxisbeispiel",
    },
    shell: {
      instrument: "Interaktives Beispiel",
      loading: "Praxisbeispiel wird geladen…",
    },
    evidence: {
      explain: "Was heißt das?",
      explainAria: (mode: string) => `Was heißt das? Ausführung: ${mode}`,
    },
    share: {
      copyPrompt: "Link kopieren:",
      aria: "Link zu diesem Praxisbeispiel kopieren",
      copied: "Kopiert",
      copy: "Link kopieren",
    },
    errors: {
      indexKicker: "Praxisbeispiel-Galerie nicht verfügbar",
      indexHeading: "Die Galerie konnte nicht geladen werden.",
      indexBody: "Lade die Seite neu oder öffne die Kurse.",
      detailKicker: "Praxisbeispiel nicht verfügbar",
      detailHeading: "Dieses Praxisbeispiel konnte nicht geladen werden.",
      detailBody: "Lade das Beispiel neu oder öffne die Galerie.",
      retry: "Erneut laden",
      courses: "Zu den Kursen",
      gallery: "Zur Galerie",
    },
    og: {
      alt: "loehrning.ai KI-Praxisbeispiel",
      fallbackTitle: "KI-Praxisbeispiele · loehrning.ai",
      fallbackSubtitle:
        "Zwölf interaktive Beispiele mit offengelegten Annahmen.",
      gallery: "Praxisbeispiele",
      open: "Praxisbeispiel öffnen",
    },
  },
  en: {
    metadata: {
      title: "Interactive AI practice examples",
      description: (count: number) =>
        `${count} interactive AI practice examples with labelled data, assumptions and control steps.`,
      openGraphDescription: (count: number) =>
        `${count} interactive examples covering AI workflows, automation, retrieval, governance, and operations.`,
      missingTitle: "Practice example not found",
      detailSuffix: "Interactive AI example",
    },
    catalog: {
      kicker: "Practice examples",
      kickerDetail: "in the browser",
      heading: "Inspect AI workflows",
      introduction: "Each example runs one AI workflow on invented data.",
      statsLabel: "What the collection holds",
      statsLine: (examples: number, actions: number) => [
        `${examples} examples`,
        actions === 0 ? "nothing is really sent" : `${actions} real external actions`,
      ],
      stats: {
        examples: { label: "Practice examples", note: "in the browser, no account" },
        modes: {
          label: "Simulation types",
          note: "synthetic, rule-based, recorded",
        },
        externalActions: {
          label: "Real external actions",
          note: "nothing is really sent or posted",
        },
      },
      galleryHeading: "All examples",
      level: "Level",
      category: "Category",
      all: "All",
      result: "Filter result",
      resultSingular: "practice example",
      resultPlural: "practice examples",
      industryPrefix: "Work context",
      emptyTitle: "No matches.",
      emptyBody: "No example matches this combination.",
      reset: "Reset filters",
      filterToggle: "Filters",
      activeFilters: (count: number) => `${count} active`,
    },
    tile: {
      kind: "Example",
      open: "Open example",
      openAria: (title: string) => `Open practice example: ${title}`,
    },
    detail: {
      home: "Home",
      catalog: "Practice examples",
      allExamples: "All practice examples",
      example: "Example",
      module: "Module",
      lesson: "Lesson",
      block: "Block",
      toLesson: "Open lesson",
      openCourse: "Open the course",
      aboutHeading: "What this covers",
      checksHeading: "What you can check",
      runHeading: "How this example runs",
      notesToggle: "How to check this example",
      dataLabel: "Data",
      executionLabel: "Execution",
      actionsLabel: "External actions",
      stopLabel: "Stop point",
      noActions: "None",
      actionValue: {
        none: "None",
        simulated: "Simulated",
        review_gated: "Simulated, with an approval step",
        real_disabled: "Disabled",
      },
      courseHeading: "In the course",
      workContexts: "Work contexts",
      workContextAria: (context: string) => `Practice examples for ${context}`,
      relatedBooks: "Related books",
      publicLabel: "Public",
      nextExample: "Next practice example",
    },
    shell: {
      instrument: "Interactive example",
      loading: "Loading practice example…",
    },
    evidence: {
      explain: "What this means",
      explainAria: (mode: string) => `What this means. Execution: ${mode}`,
    },
    share: {
      copyPrompt: "Copy link:",
      aria: "Copy a link to this practice example",
      copied: "Copied",
      copy: "Copy link",
    },
    errors: {
      indexKicker: "Practice gallery unavailable",
      indexHeading: "The gallery could not be loaded.",
      indexBody: "Reload the page or open the courses.",
      detailKicker: "Practice example unavailable",
      detailHeading: "This practice example could not be loaded.",
      detailBody: "Reload the example or open the gallery.",
      retry: "Reload",
      courses: "View courses",
      gallery: "Open gallery",
    },
    og: {
      alt: "loehrning.ai interactive AI example",
      fallbackTitle: "Interactive AI examples · loehrning.ai",
      fallbackSubtitle:
        "Twelve interactive examples with explicit assumptions.",
      gallery: "Practice examples",
      open: "Open practice example",
    },
  },
} as const;

export const DEMO_EVIDENCE_COPY: Readonly<
  Record<
    Locale,
    Readonly<
      Record<
        DemoEvidenceMode,
        { readonly label: string; readonly tooltip: string }
      >
    >
  >
> = {
  de: {
    synthetic: {
      label: "Synthetisch",
      tooltip:
        "Alle Daten sind erfunden, gemessen wurde nichts, und es läuft kein KI-Modell.",
    },
    rule_based: {
      label: "Regelbasiert",
      tooltip:
        "Feste Regeln laufen in deinem Browser, ohne KI-Modell und ohne externe API. Du siehst, was sie erkennen und was sie übersehen.",
    },
    recorded_trace: {
      label: "Aufgezeichnete Spur",
      tooltip:
        "Spielt einen aufgezeichneten Ablauf ab, ohne ein System anzusprechen.",
    },
    live_api: {
      label: "Live-API",
      tooltip:
        "Sendet echte Anfragen an eine KI-API, nur wenn der Anbieter freigeschaltet und geprüft ist. Gib keine persönlichen Daten ein.",
    },
  },
  en: {
    synthetic: {
      label: "Synthetic",
      tooltip:
        "All data is invented, nothing was measured, and no AI model runs.",
    },
    rule_based: {
      label: "Rule-based",
      tooltip:
        "Fixed rules run in your browser, with no AI model or external API. You see what they catch and what they miss.",
    },
    recorded_trace: {
      label: "Recorded trace",
      tooltip:
        "Replays a recorded run without contacting any system.",
    },
    live_api: {
      label: "Live API",
      tooltip:
        "Sends real requests to an AI API, only when the provider is enabled and verified. Do not enter personal data.",
    },
  },
};

export const DEMO_ACTION_LABELS: Readonly<
  Record<Locale, Readonly<Record<DemoExternalActionMode, string | null>>>
> = {
  de: {
    none: null,
    simulated: "Aktionen simuliert",
    review_gated: "Freigabe-Schritt simuliert",
    real_disabled: "Aktionen deaktiviert",
  },
  en: {
    none: null,
    simulated: "Actions simulated",
    review_gated: "Approval simulated",
    real_disabled: "Actions disabled",
  },
};

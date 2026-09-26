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
        `${count} interaktive KI-Praxisbeispiele mit klar ausgewiesenen Daten, Annahmen, Kontrollschritten und Systemgrenzen.`,
      openGraphDescription: (count: number) =>
        `${count} interaktive Praxisbeispiele für KI-Workflows, Automatisierung, Retrieval, Governance und Betrieb.`,
      missingTitle: "Praxisbeispiel nicht gefunden",
      detailSuffix: "KI-Praxisbeispiel",
    },
    catalog: {
      kicker: "Praxisbeispiele",
      heading: "KI-Arbeitsabläufe prüfen",
      introduction:
        "Jedes Beispiel spielt einen Arbeitsablauf mit erfundenen Daten durch, von der Eingabe bis zur Freigabe. Zu jedem Beispiel steht, woher die Daten kommen, wie es ausgeführt wird und welche Aktionen nur simuliert sind.",
      statsLabel: "Umfang der Sammlung",
      stats: {
        examples: { label: "Praxisbeispiele", note: "im Browser, ohne Konto" },
        modes: {
          label: "Ausführungsarten",
          note: "synthetisch, regelbasiert, aufgezeichnet",
        },
        externalActions: {
          label: "Echte Außenaktionen",
          note: "Versand, Buchung und Bestellung bleiben simuliert",
        },
      },
      scopeLabel: "Was du an jedem Beispiel prüfst",
      scopeItems: [
        "Eingaben und Annahmen",
        "Zwischenschritte und Quellen",
        "Freigaben und Abbruchbedingungen",
      ],
      galleryHeading: "Alle Beispiele",
      level: "Reifegrad",
      category: "Kategorie",
      all: "Alle",
      result: "Filter-Ergebnis",
      resultSingular: "Praxisbeispiel",
      resultPlural: "Praxisbeispiele",
      industryPrefix: "Arbeitskontext",
      emptyTitle: "Keine Treffer.",
      emptyBody:
        "Für diese Kombination ist kein Praxisbeispiel veröffentlicht. Setze einen Filter zurück.",
      reset: "Filter zurücksetzen",
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
      indexBody:
        "Lade die Seite erneut. Die Kursübersicht bleibt unabhängig davon erreichbar.",
      detailKicker: "Praxisbeispiel nicht verfügbar",
      detailHeading: "Dieses Praxisbeispiel konnte nicht geladen werden.",
      detailBody: "Lade das Beispiel erneut oder kehre zur Galerie zurück.",
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
        `${count} interactive AI practice examples with explicit data, assumptions, control steps, and system boundaries.`,
      openGraphDescription: (count: number) =>
        `${count} interactive examples covering AI workflows, automation, retrieval, governance, and operations.`,
      missingTitle: "Practice example not found",
      detailSuffix: "Interactive AI example",
    },
    catalog: {
      kicker: "Practice examples",
      heading: "Inspect AI workflows",
      introduction:
        "Each example runs one workflow on invented data, from the input to the sign-off. Next to it you see where the data comes from, how the example runs and which actions are only simulated.",
      statsLabel: "What the collection holds",
      stats: {
        examples: { label: "Practice examples", note: "in the browser, no account" },
        modes: {
          label: "Execution modes",
          note: "synthetic, rule-based, recorded",
        },
        externalActions: {
          label: "Real external actions",
          note: "Sending, posting and ordering stay simulated",
        },
      },
      scopeLabel: "What you check in each example",
      scopeItems: [
        "Inputs and assumptions",
        "Intermediate steps and sources",
        "Approvals and stopping conditions",
      ],
      galleryHeading: "All examples",
      level: "Level",
      category: "Category",
      all: "All",
      result: "Filter result",
      resultSingular: "practice example",
      resultPlural: "practice examples",
      industryPrefix: "Work context",
      emptyTitle: "No matches.",
      emptyBody:
        "No published example matches this combination. Clear one of the filters.",
      reset: "Reset filters",
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
      indexBody: "Reload this page. The course catalogue remains available.",
      detailKicker: "Practice example unavailable",
      detailHeading: "This practice example could not be loaded.",
      detailBody: "Reload the example or return to the gallery.",
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
        "Alle Daten in diesem Beispiel sind erfunden, und es läuft kein KI-Modell. Die Zahlen sind Beispielwerte, gemessen wurde nichts.",
    },
    rule_based: {
      label: "Regelbasiert",
      tooltip:
        "Dieses Beispiel läuft mit festen Regeln in deinem Browser und ruft weder ein KI-Modell noch eine externe API auf. Du siehst, was die Regeln erkennen und was sie übersehen.",
    },
    recorded_trace: {
      label: "Aufgezeichnete Spur",
      tooltip:
        "Spielt einen aufgezeichneten Ablauf ab. Nichts läuft live, und kein System wird angesprochen.",
    },
    live_api: {
      label: "Live-API",
      tooltip:
        "Dieser Modus würde echte Anfragen an eine KI-API senden. Er ist nur aktiv, wenn der Anbieter freigeschaltet und geprüft ist. Gib keine persönlichen Daten ein.",
    },
  },
  en: {
    synthetic: {
      label: "Synthetic",
      tooltip:
        "All data in this example is invented, and no AI model runs. The figures are sample values; nothing was measured.",
    },
    rule_based: {
      label: "Rule-based",
      tooltip:
        "This example runs on fixed rules in your browser and calls no AI model or external API. You see what the rules catch and what they miss.",
    },
    recorded_trace: {
      label: "Recorded trace",
      tooltip:
        "Replays a recorded run. Nothing runs live, and no system is contacted.",
    },
    live_api: {
      label: "Live API",
      tooltip:
        "This mode would send real API requests. It is available only when the provider is explicitly enabled and verified. Do not enter personal data.",
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

import type { Locale } from "@/lib/i18n/locale";
import type {
  DemoEvidenceMode,
  DemoExternalActionMode,
  DemoLevel,
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
      kicker: "Praxislabor · 12 prüfbare Simulationen",
      headingLead: "Arbeitsabläufe prüfen.",
      headingAccent: "Annahmen sichtbar machen.",
      introduction:
        "Jedes Beispiel bildet einen abgegrenzten Ablauf ab. Datenherkunft, Ausführungsmodus, externe Aktionen und Prüfschritte stehen direkt am Beispiel. Kein Beispiel greift auf Unternehmenssysteme zu.",
      stats: [
        { value: "12", label: "Praxisbeispiele" },
        { value: "4", label: "Ausführungsmodi" },
        { value: "0", label: "reale Außenaktionen" },
      ],
      scopeLabel: "Was hier geprüft wird",
      scopeItems: [
        "Eingaben und Annahmen",
        "Zwischenschritte und Quellen",
        "Freigaben und Abbruchbedingungen",
      ],
      level: "Reifegrad",
      category: "Kategorie",
      all: "Alle",
      result: "Filter-Ergebnis",
      resultSingular: "Praxisbeispiel",
      resultPlural: "Praxisbeispiele",
      industryPrefix: "Arbeitskontext",
      emptyKicker: "Filter-Ergebnis",
      emptyTitle: "Keine Treffer.",
      emptyBody:
        "Für diese Kombination ist kein Praxisbeispiel veröffentlicht. Setze einen Filter zurück.",
      reset: "Filter zurücksetzen",
    },
    tile: {
      kind: "Praxisbeispiel",
      open: "Öffnen",
      openAria: (title: string) => `Praxisbeispiel öffnen: ${title}`,
    },
    detail: {
      home: "Start",
      catalog: "Praxisbeispiele",
      allExamples: "Alle Praxisbeispiele",
      example: "Praxisbeispiel",
      courseContext: "Kurskontext",
      pathway: "KI-Kompetenzweg",
      stages: {
        einstieg: "Stufe 3: Anwenden",
        mittel: "Stufe 4: Umsetzen",
        fortg: "Stufe 5: Gestalten",
      } satisfies Readonly<Record<DemoLevel, string>>,
      module: "Modul",
      lesson: "Lektion",
      block: "Block",
      toLesson: "Zur Lektion",
      toGallery: "Zur Galerie",
      illustrative: "Illustratives Beispiel",
      illustrativeTitle:
        "Zahlen sind illustrativ. Ergebnisse hängen vom Einsatzkontext ab.",
      continueLearning: "Weiterlernen",
      openCourse: (title: string) => `${title} öffnen`,
      openSuitableCourse: "Passenden Kurs öffnen",
      inspectAssumptions: "Annahmen prüfen",
      readBook: "Im Buch vertiefen",
      practiceData: "Übungsdaten",
      outputHeading: "Was das Beispiel liefert",
      learningContext: "Lernkontext",
      sandboxScenario: "Sandbox-Szenario",
      sandboxBoundary: "Sandbox-Grenze",
      workContexts: "Arbeitskontexte",
      relatedBooks: "Vertiefende Bücher",
      publicLabel: "Öffentlich",
      nextExample: "Nächstes Praxisbeispiel",
      next: "Weiter",
    },
    shell: {
      loading: "Praxisbeispiel wird geladen…",
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
      fallbackSubtitle: "Zwölf interaktive Beispiele mit offengelegten Annahmen.",
      gallery: "Praxislabor",
      open: "Praxisbeispiel öffnen →",
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
      kicker: "Practice lab · 12 inspectable simulations",
      headingLead: "Inspect the workflow.",
      headingAccent: "Expose the assumptions.",
      introduction:
        "Each example represents a bounded workflow. Data provenance, execution mode, external actions, and review steps are stated next to the interface. No example connects to company systems.",
      stats: [
        { value: "12", label: "practice examples" },
        { value: "4", label: "execution modes" },
        { value: "0", label: "real external actions" },
      ],
      scopeLabel: "What to inspect",
      scopeItems: [
        "Inputs and assumptions",
        "Intermediate steps and sources",
        "Approvals and stopping conditions",
      ],
      level: "Level",
      category: "Category",
      all: "All",
      result: "Filter result",
      resultSingular: "practice example",
      resultPlural: "practice examples",
      industryPrefix: "Work context",
      emptyKicker: "Filter result",
      emptyTitle: "No matches.",
      emptyBody:
        "No published example matches this combination. Clear one of the filters.",
      reset: "Reset filters",
    },
    tile: {
      kind: "Example",
      open: "Open",
      openAria: (title: string) => `Open practice example: ${title}`,
    },
    detail: {
      home: "Home",
      catalog: "Practice examples",
      allExamples: "All practice examples",
      example: "Example",
      courseContext: "Course context",
      pathway: "AI competency path",
      stages: {
        einstieg: "Stage 3: Apply",
        mittel: "Stage 4: Implement",
        fortg: "Stage 5: Design",
      } satisfies Readonly<Record<DemoLevel, string>>,
      module: "Module",
      lesson: "Lesson",
      block: "Block",
      toLesson: "Open lesson",
      toGallery: "Open gallery",
      illustrative: "Illustrative example",
      illustrativeTitle:
        "Figures are illustrative. Results depend on the deployment context.",
      continueLearning: "Continue learning",
      openCourse: (title: string) => `Open ${title}`,
      openSuitableCourse: "Open related course",
      inspectAssumptions: "Inspect assumptions",
      readBook: "Read the related book",
      practiceData: "Practice data",
      outputHeading: "What the example contains",
      learningContext: "Learning context",
      sandboxScenario: "Sandbox scenario",
      sandboxBoundary: "Sandbox boundary",
      workContexts: "Work contexts",
      relatedBooks: "Related books",
      publicLabel: "Public",
      nextExample: "Next practice example",
      next: "Next",
    },
    shell: {
      loading: "Loading practice example…",
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
      fallbackSubtitle: "Twelve interactive examples with explicit assumptions.",
      gallery: "Practice lab",
      open: "Open practice example →",
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
        "Dieses Praxisbeispiel verwendet vollständig erfundene Beispieldaten. Kein echter Nutzer, kein echtes Unternehmen, keine echte KI-Inferenz laufen im Hintergrund. Die Zahlen zeigen, wie ein Ergebnis aussehen könnte, nicht was ein System tatsächlich gemessen hat.",
    },
    rule_based: {
      label: "Regelbasiert",
      tooltip:
        "Dieses Praxisbeispiel läuft vollständig mit festen If-Else-Regeln im Browser. Kein KI-Modell und keine externe API werden aufgerufen. Das zeigt dir, wie regelbasierte Systeme funktionieren und wo ihre Grenzen liegen.",
    },
    recorded_trace: {
      label: "Aufgezeichnete Spur",
      tooltip:
        "Dieses Praxisbeispiel spielt eine aufgezeichnete Beispielspur ab. Du siehst die Wiederholung einer aufgezeichneten Beispielspur, keine Live-Ausführung. So kannst du den Ablauf in Ruhe studieren, ohne auf echte Systeme zuzugreifen.",
    },
    live_api: {
      label: "Live-API",
      tooltip:
        "Dieses Praxisbeispiel sendet tatsächliche Anfragen an eine KI-API. Ergebnisse variieren bei jeder Ausführung. Kosten entstehen pro Anfrage. Keine persönlichen Daten eingeben.",
    },
  },
  en: {
    synthetic: {
      label: "Synthetic",
      tooltip:
        "This example uses entirely fictional data. No AI inference or company system runs in the background. Values illustrate a possible workflow, not measured impact.",
    },
    rule_based: {
      label: "Rule-based",
      tooltip:
        "This example uses fixed browser-side rules. It calls no AI model or external API. The interface exposes what the rules detect and what they miss.",
    },
    recorded_trace: {
      label: "Recorded trace",
      tooltip:
        "This example replays a fixed recorded execution. It is not a live run and does not connect to external systems.",
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

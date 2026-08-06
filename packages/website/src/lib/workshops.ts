/**
 * Workshops catalog — single in-repo source of truth.
 *
 * Selbstlern-Workshops mit Download-Material: eine Slide-Deck-Anleitung, eine
 * einseitige Field Card und ein Übungs-Kit als ZIP. Die statischen Dateien
 * liegen unter public/workshops/<slug>/ und werden vom Next.js-Server ab
 * Site-Root ausgeliefert (siehe public/book-covers/ für dasselbe Muster).
 *
 * Add a new workshop by appending an entry below; never duplicate this array
 * in a page component.
 */

export interface WorkshopStep {
  /** Zero-padded step number, e.g. "01". */
  readonly n: string;
  readonly title: string;
  readonly description: string;
  /** Short tool/surface label shown as a chip, e.g. "Skill", "Dashboard". */
  readonly tool: string;
}

export interface WorkshopCaseMetric {
  readonly label: string;
  readonly value: string;
}

export interface WorkshopCaseStudy {
  readonly companyName: string;
  /** Always true for this catalog: every case study here is invented teaching data. */
  readonly isFictional: true;
  readonly location: string;
  readonly sector: string;
  readonly period: string;
  readonly narrative: string;
  readonly metrics: readonly WorkshopCaseMetric[];
  readonly decisionQuestion: string;
  /** What the underlying data structurally cannot answer — stated, not glossed over. */
  readonly dataLimitations: readonly string[];
}

export interface WorkshopMaterial {
  readonly label: string;
  readonly href: string;
  readonly kind: "html" | "zip";
  readonly description: string;
}

export interface Workshop {
  readonly slug: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly format: string;
  readonly duration: string;
  readonly audience: readonly string[];
  readonly steps: readonly WorkshopStep[];
  readonly caseStudy: WorkshopCaseStudy;
  readonly materials: readonly WorkshopMaterial[];
}

const WORKSHOP_BASE_PATH = "/workshops/geschaeftsberichte-mit-ki-lesen";

export const WORKSHOPS: readonly Workshop[] = [
  {
    slug: "geschaeftsberichte-mit-ki-lesen",
    title: "Geschäftsberichte mit KI lesen",
    eyebrow: "Selbstlern-Workshop · Business Reports",
    description:
      "Mit einer geführten Selbstlern-Anleitung baust du in der Claude-App einen kleinen KI-Analysten entlang eines roten Fadens: Du arbeitest für ein realistisch aufgebautes synthetisches Unternehmen, bekommst dessen Monatsbericht samt der Rohdaten, aus denen er geschrieben wurde, definierst in fünf Prompts eigene Kennzahlen-Regeln als wiederverwendbaren Skill, befüllst ein Dashboard und triffst eine begründete Entscheidung. In Fall 2 verlässt du die Sandbox: Dieselbe Methode läuft auf einem echten Unternehmen — Metas öffentlich bei der SEC eingereichte Quartalsmitteilung, live abgerufen (im Kit wird nichts davon weiterverteilt). Ohne Programmierung und API-Key; für die Schritte in Claude brauchst du einen passenden Claude-Zugang.",
    format: "Selbstlern-Kit",
    duration: "~90 Minuten",
    audience: [
      "Mitarbeitende, die Monats- oder Quartalsberichte lesen oder erstellen",
      "Controlling- und Finance-Teams im Mittelstand",
      "Alle, die Claude als Analysewerkzeug kennenlernen wollen, ohne selbst zu programmieren",
    ],
    steps: [
      {
        n: "01",
        title: "Verankern — Claude lernt das Unternehmen",
        description:
          "Du öffnest den Kit-Ordner in der Claude-App: der Monatsbericht (8 Seiten), fünf CSV-Rohdaten-Dateien (auch in Excel nutzbar) und ein Unternehmenssteckbrief. Ein Satz genügt: Claude liest Steckbrief und Bericht und benennt, wer das Unternehmen ist und welche Entscheidung der Monat vorbereitet. Der Ordner ist der Kontext — nichts wird hochgeladen oder konfiguriert.",
        tool: "Dateien",
      },
      {
        n: "02",
        title: "Beibringen — den Kennzahlen-Skill selbst schreiben",
        description:
          "Das Herzstück: Der Kennzahlen-Skill liegt halb fertig im Kit. Claude fragt dich die Lücken einzeln ab — was bedeuten Umsatz, Mängel, Marketing HIER? — und schreibt deine Antworten in Klartext in die Skill-Datei. Ab jetzt liest Claude in diesem Ordner immer zuerst deine Regeln. Keine Zeile Code.",
        tool: "Skill",
      },
      {
        n: "03",
        title: "Anwenden — extrahieren und an der Quelle prüfen",
        description:
          "Dein Skill liest den Bericht mit deinen Regeln, extrahiert den Monat in strukturierte Kennzahlen und prüft eine Zahl gegen die Rohdaten-CSV — jede Zahl bleibt auf Datei und Spalte rückführbar. Vorher einmal ohne Skill fragen lohnt sich: Die generische Antwort fällt bei jedem anders aus; mit Skill greifen dieselben Regeln jedes Mal.",
        tool: "Claude Code",
      },
      {
        n: "04",
        title: "Sehen — das Dashboard füllt sich",
        description:
          "Das Dashboard liegt als bewusst leere Vorlage im Kit. Ein Prompt, und Claude schreibt die extrahierten Kennzahlen hinein und öffnet die Seite: Umsatz je Linie mit markierter Problemlinie, Qualitätsmängel, Marketing, offene Eskalationen und die anstehende Entscheidung — der 8-Seiten-Bericht für den Analysten, die eine Seite für den Raum.",
        tool: "Dashboard",
      },
      {
        n: "05",
        title: "Entscheiden — gegen den Vertriebsleiter argumentieren",
        description:
          "Am Ende steht keine Zusammenfassung, sondern eine Entscheidung: Premium-Linie nacharbeiten oder ihr Q3-Marketingbudget erhöhen? Mit der Zahl, die sie stützt, den Kosten eines Irrtums, einer ehrlichen Aussage darüber, was die Daten nicht beantworten können — und der Gegenposition, so überzeugend wie möglich argumentiert.",
        tool: "Entscheidung",
      },
      {
        n: "06",
        title: "Fall 2 — ein echtes Unternehmen: Metas Quartal",
        description:
          "Dieselbe Methode verlässt die Sandbox: Claude ruft Metas öffentlich bei der SEC eingereichte Quartalsmitteilung (Q2 2026) live ab — im Kit wird nichts davon weiterverteilt. Du definierst sechs Kennzahlen in Klartext, extrahierst das Quartal (+28 % Umsatz, −8 % operatives Ergebnis) und lässt Claude diesmal ein Dashboard ohne Vorlage selbst entwerfen. Die Frage auf dem Tisch: 31 Mrd. $ Capex in einem Quartal — Investment oder Leck?",
        tool: "SEC-Filing · live",
      },
      {
        n: "07",
        title: "Wiederholen — dein Unternehmen, dein Analyst",
        description:
          "Weil die Lesart aufgeschrieben ist, wiederholt sie sich: Nächster Monat, neuer Bericht, derselbe Skill. Das Kit enthält beide Fälle, das Arbeitsblatt und eine leere Vorlage, mit der du den Analysten für die Berichte deines eigenen Unternehmens nachbaust.",
        tool: "Wiederholung",
      },
    ],
    caseStudy: {
      companyName: "NORDA Werke GmbH",
      isFictional: true,
      location: "Augsburg",
      sector: "Elektronikfertigung",
      period: "September 2023",
      narrative:
        "NORDA Werke ist ein frei erfundenes Übungsunternehmen für diesen Workshop: ein Elektronikfertiger aus Augsburg, Monatsabschluss September 2023. Die Zahlen des Monats passen nicht auf den ersten Blick zusammen. Die Produktlinie CRAFT (Premium-Küchengeräte) erzielt bei den höchsten Stückpreisen den zweithöchsten Umsatz auf einem der geringsten Absatzvolumen (Rang 6 von 7 Linien), trägt aber auch die meisten Qualitätsmängel im Sortiment — den zweiten Monat in Folge. Die offene Frage: Linie nacharbeiten oder mehr Q3-Marketingbudget dahinterstellen?",
      metrics: [
        { label: "Umsatz gesamt", value: "21,69 Mio. €" },
        { label: "Einheiten gesamt", value: "139.056" },
        { label: "CRAFT-Umsatz", value: "4,12 Mio. €" },
        { label: "CRAFT-Einheiten", value: "9.162" },
      ],
      decisionQuestion:
        "Soll NORDA die Produktlinie CRAFT technisch nacharbeiten — oder, wie der Vertriebsleiter fordert, mehr Q3-Marketingbudget hinter CRAFT stellen?",
      dataLimitations: [
        "Keine echte Bruttomarge je Linie: Es liegen keine Stückkosten pro Produkt vor.",
        "Keine Kundenretouren je Linie: Bestellungen sind nicht mit Produktlinien verknüpft.",
        "Kein exaktes Marketingbudget je Produktlinie: Kampagnenbudgets sind nicht sauber zurechenbar.",
      ],
    },
    materials: [
      {
        label: "Workshop-Walkthrough (Englisch, 17 Slides)",
        href: `${WORKSHOP_BASE_PATH}/slides.html`,
        kind: "html",
        description:
          "Englisches Slide-Deck entlang des roten Fadens: das Unternehmen, der Ordner, die fünf Prompts mit ihren Artefakten, Fall 2 (Meta) — inklusive aller Prompts zum Kopieren. Mit Pfeiltasten blättern.",
      },
      {
        label: "Field Card (Englisch, 1 Seite)",
        href: `${WORKSHOP_BASE_PATH}/field-card.html`,
        kind: "html",
        description:
          "Englische druckbare Übersichtsseite: die fünf Fragen jeder Kennzahlen-Definition, die fünf Prompts und die zwei Vertrauens-Prompts — plus die Grenzen der Daten.",
      },
      {
        label: "NORDA Analyst Kit (Englisch, .zip)",
        href: `${WORKSHOP_BASE_PATH}/norda-analyst-kit.zip`,
        kind: "zip",
        description:
          "Englisches Kit mit beiden Fällen: CSV-Rohdaten, beide Monatsberichte als Markdown, der halb fertige Kennzahlen-Skill, die Dashboard-Vorlage, das Arbeitsblatt, die Meta-Aufgabe (Fall 2) und eine leere Vorlage für das eigene Unternehmen. Reines Textarchiv — den gestalteten Bericht siehst du im Walkthrough.",
      },
    ],
  },
];

export function getWorkshopBySlug(slug: string): Workshop | undefined {
  return WORKSHOPS.find((workshop) => workshop.slug === slug);
}

export function getWorkshopSlugs(): readonly string[] {
  return WORKSHOPS.map((workshop) => workshop.slug);
}

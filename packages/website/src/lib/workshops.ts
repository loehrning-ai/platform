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
      "Mit einer geführten Selbstlern-Anleitung baust du in der Claude-App einen kleinen KI-Analysten für einen realistisch aufgebauten synthetischen Monatsbericht: Rohdaten einlesen, Kennzahlen sauber definieren, ein Dashboard befüllen und am Ende eine begründete Entscheidung treffen. Ohne Programmierung und API-Key; für die Schritte in Claude brauchst du einen passenden Claude-Zugang.",
    format: "Selbstlern-Kit",
    duration: "~75 Minuten",
    audience: [
      "Mitarbeitende, die Monats- oder Quartalsberichte lesen oder erstellen",
      "Controlling- und Finance-Teams im Mittelstand",
      "Alle, die Claude als Analysewerkzeug kennenlernen wollen, ohne selbst zu programmieren",
    ],
    steps: [
      {
        n: "01",
        title: "Die Daten laden",
        description:
          "Du öffnest den Kit-Ordner: fünf einfache CSV-Dateien (auch in Excel nutzbar) und ein einseitiger Unternehmenssteckbrief. Claude liest Steckbrief und Berichte und fasst in zwei Sätzen zusammen, wer das Unternehmen ist und welche Entscheidung der Monatsbericht vorbereitet, das \"Unternehmensgedächtnis\" im Kleinen.",
        tool: "Dateien",
      },
      {
        n: "02",
        title: "Die Berichte lesen",
        description:
          "Das Kit enthält zwei Monatsberichte in einem wiederverwendbaren Format. Claude liest sie für die Geschichte hinter den Zahlen, und du siehst, wie ein Bericht jeden Monat in dieselbe Vorlage eingetragen wird.",
        tool: "Berichte",
      },
      {
        n: "03",
        title: "Den Kennzahlen-Skill nutzen",
        description:
          "Ein Claude-Skill legt fest, was die Zahlen hier bedeuten und wie sie jedes Mal gleich berechnet werden. Claude führt das Skill-Skript aus und zeigt Umsatz und Einheiten insgesamt sowie Umsatz und Fehlerquote je Produktlinie. Die Arithmetik ist exakt: Das Modell schätzt keine Zahl, die sich berechnen lässt.",
        tool: "Skill",
      },
      {
        n: "04",
        title: "Das Unternehmensgedächtnis",
        description:
          "Steckbrief, Kennzahlendefinitionen und Bericht landen gemeinsam in einem Claude-Projekt, sodass jede weitere Frage im Kontext des Unternehmens beantwortet wird, nicht allgemein. Kontext schlägt Promptkunst: Dieselbe Frage wird präziser, sobald Claude das Unternehmen kennt.",
        tool: "Projekt",
      },
      {
        n: "05",
        title: "Verbinden statt kopieren",
        description:
          "Über einen unterstützten und freigegebenen Connector kannst du zugängliche Dateien aus Google Drive oder E-Mail einbinden. Verfügbarkeit und Dateizugriff hängen vom jeweiligen Connector und Claude-Zugang ab; ein API-Key ist nicht nötig.",
        tool: "Connectors",
      },
      {
        n: "06",
        title: "Das Dashboard befüllen",
        description:
          "Claude Code schreibt die berechneten Zahlen in die Dashboard-Vorlage und öffnet sie. Dafür brauchst du die Claude-Desktop-App mit Claude-Code-Oberfläche oder die installierte Claude-Code-CLI sowie einen unterstützten Claude-Zugang. Ein API-Key ist nicht nötig. Am Ende steht ein teilbares Ein-Seiten-Dashboard mit Umsatz und Fehlerquote je Linie, Marketingzahlen und der offenen Entscheidung.",
        tool: "Dashboard",
      },
      {
        n: "07",
        title: "Die Entscheidung treffen",
        description:
          "Am Ende steht keine Zusammenfassung, sondern eine Entscheidung: Linie nacharbeiten oder Marketingbudget umschichten, mit der Zahl, die sie stützt, den Kosten eines Irrtums und einer ehrlichen Aussage darüber, was die Daten nicht beantworten können.",
        tool: "Entscheidung",
      },
    ],
    caseStudy: {
      companyName: "NORDA Werke GmbH",
      isFictional: true,
      location: "Augsburg",
      sector: "Elektronikfertigung",
      period: "September 2023",
      narrative:
        "NORDA Werke ist ein frei erfundenes Übungsunternehmen für diesen Workshop: ein Elektronikfertiger aus Augsburg, Monatsabschluss September 2023. Die Zahlen des Monats passen nicht auf den ersten Blick zusammen. Die Produktlinie CRAFT (Premium-Küchengeräte) erzielt bei den höchsten Stückpreisen den zweithöchsten Umsatz bei gleichzeitig geringstem Absatzvolumen, trägt aber auch die meisten Qualitätsmängel im Sortiment. Die offene Frage: Linie nacharbeiten oder ihr Marketingbudget für das dritte Quartal umschichten?",
      metrics: [
        { label: "Umsatz gesamt", value: "21,7 Mio. €" },
        { label: "Einheiten gesamt", value: "139.056" },
        { label: "CRAFT-Umsatz", value: "4,1 Mio. €" },
        { label: "CRAFT-Einheiten", value: "9.162" },
      ],
      decisionQuestion:
        "Soll NORDA die Produktlinie CRAFT technisch nacharbeiten oder ihr Marketingbudget für Q3 auf eine gesündere Linie umschichten?",
      dataLimitations: [
        "Keine echte Bruttomarge je Linie: Es liegen keine Stückkosten pro Produkt vor.",
        "Keine Kundenretouren je Linie: Bestellungen sind nicht mit Produktlinien verknüpft.",
        "Kein exaktes Marketingbudget je Produktlinie: Kampagnenbudgets sind nicht sauber zurechenbar.",
      ],
    },
    materials: [
      {
        label: "Workshop-Walkthrough (Englisch)",
        href: `${WORKSHOP_BASE_PATH}/slides.html`,
        kind: "html",
        description:
          "Englische Anleitung durch alle sieben Schritte, inklusive der vier Prompts zum Mitgeben.",
      },
      {
        label: "Field Card (Englisch, 1 Seite)",
        href: `${WORKSHOP_BASE_PATH}/field-card.html`,
        kind: "html",
        description:
          "Englische druckbare Übersichtsseite mit vier Prompts, Kennzahlendefinitionen und den Grenzen der Daten.",
      },
      {
        label: "NORDA Analyst Kit (Englisch, .zip)",
        href: `${WORKSHOP_BASE_PATH}/norda-analyst-kit.zip`,
        kind: "zip",
        description:
          "Englisches Kit mit Übungsdaten: CSV-Dateien, Berichte, Kennzahlen-Skill und Dashboard-Vorlage zum Nachbauen mit eigenen Zahlen.",
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

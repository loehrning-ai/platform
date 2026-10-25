/**
 * Workshops catalog, the single in-repo source of truth.
 *
 * Every workshop follows the standard in docs/workshop-standard.md: one fixed
 * question, three or four observable outcomes, an agenda in minutes, exact
 * needs, what the workshop leaves out, and provenance. Welche Dateien ein
 * Workshop mitbringt, entscheidet allein sein materials-Array; jede Datei trägt
 * ihre Rolle (Deck, Lernbegleiter, Kit …) und die Phase, in der sie gebraucht
 * wird. Zähle Materialien nie anderswo auf, sonst veraltet die Liste. Die
 * statischen Dateien liegen unter public/workshops/<slug>/ und werden vom
 * Next.js-Server ab Site-Root ausgeliefert.
 *
 * Add a new workshop by appending an entry below (or a sibling module, as
 * workshops-data-readiness.ts does); never duplicate this array in a page
 * component.
 */

import { demoForWorkshop } from "./demos";
import type { Locale } from "./i18n/locale";
import type { WorkshopKit } from "./workshop-kit";
import { DATA_READINESS_WORKSHOP } from "./workshops-data-readiness";
import { AI_AT_WORK_WORKSHOP } from "./workshops-ai-at-work";
import { ESG_REPORTING_WORKSHOP } from "./workshops-esg-reporting";

/** Two-digit catalogue number. "05" is the audit workshop (Sage palette). */
export type WorkshopNumber = "01" | "02" | "03" | "04" | "05";

/** When a learner uses a material: before, during or after the session. */
export type WorkshopPhase = "before" | "during" | "after";

/**
 * What a material is for. The detail page picks its pictogram, its row order
 * and its primary button from this, never from the label text.
 */
export type WorkshopMaterialRole =
  | "deck"
  | "presenter"
  | "demo"
  | "guide"
  | "lab"
  | "case"
  | "card"
  | "exercise"
  | "kit"
  | "data"
  | "hub"
  | "builder";

/** Which delivery an agenda item belongs to. Omitted means both. */
export type WorkshopAgendaMode = "live" | "self" | "both";

/** What the learner does in an agenda item. Drives the mode mark on the Route. */
export type WorkshopActivity = "listen" | "vote" | "do" | "write";

export interface WorkshopStep {
  /** Zero-padded step number, e.g. "01". */
  readonly n: string;
  readonly title: string;
  readonly description: string;
  /** Short tool/surface label shown as a chip, e.g. "Skill", "Dashboard". */
  readonly tool: string;
}

/**
 * One station of the workshop's agenda. Where a deck exists, the items follow
 * its acts and the minutes come from the deck's own scene timings.
 */
export interface WorkshopAgendaItem {
  /** Written as what happens, e.g. "Die falsche Antwort". */
  readonly label: string;
  readonly minutes: number;
  /** Live group, self-study, or both (the default when omitted). */
  readonly mode?: WorkshopAgendaMode;
  readonly activity?: WorkshopActivity;
  /** One sentence on what the learner does in this item. */
  readonly description?: string;
  /** True for an item a learner may skip without losing an outcome. */
  readonly optional?: boolean;
}

/** Who made the workshop, when it was checked, and what kind of data it uses. */
export interface WorkshopProvenance {
  readonly author: string;
  /** ISO date (YYYY-MM-DD) the page copy and material list were last reviewed. */
  readonly reviewedAt: string;
  /** ISO month or date the AI answers shown in the materials were recorded. */
  readonly aiOutputsRecordedAt?: string;
  /** ISO date of the last live session with a group. */
  readonly liveRunAt?: string;
  /** Invented practice data only, or invented data plus public real figures. */
  readonly data: "synthetic" | "synthetic-and-public";
  /** One or two plain sentences, shown as the provenance caption. */
  readonly note: string;
}

export interface WorkshopCaseMetric {
  readonly label: string;
  readonly value: string;
}

export interface WorkshopCaseStudy {
  readonly companyName: string;
  /**
   * True for invented teaching data (the norm here). False when a workshop works on a real
   * organisation's published figures. The detail page states which, so a reader is never left
   * guessing whether the numbers are real.
   */
  readonly isFictional: boolean;
  readonly location: string;
  readonly sector: string;
  readonly period: string;
  readonly narrative: string;
  readonly metrics: readonly WorkshopCaseMetric[];
  readonly decisionQuestion: string;
  /** What the underlying data structurally cannot answer, stated plainly. */
  readonly dataLimitations: readonly string[];
  /** Optional workshop-specific heading for the expandable case note. */
  readonly limitationsHeading?: string;
  /**
   * The case result as bars on paper (Werkzeichnung v2, SPEC §3.11): the
   * reference value, the unchecked AI answer and the checked answer on one
   * scale from zero. Every `display` string is printed verbatim elsewhere in
   * the workshop's own copy, so the chart never invents a figure.
   */
  readonly resultChart?: WorkshopResultChart;
}

export type WorkshopResultBarKind = "reference" | "answer" | "correct";

export interface WorkshopResultBar {
  readonly label: string;
  readonly value: number;
  /** The value as the workshop prints it ("2.017,5 t"); never recomputed. */
  readonly display: string;
  /** A short direct label under the bar ("sechs Fehler, 7,5 % weniger"). */
  readonly note?: string;
  /** reference and correct are solid bars; answer (unchecked) is hatched. */
  readonly kind: WorkshopResultBarKind;
}

/**
 * The data of a result chart. The page adds the heading and the caption line
 * from workshop-copy.ts and renders it with ResultChart (src/components/plakat).
 */
export interface WorkshopResultChart {
  /** The unit the values share, e.g. "t CO₂e". */
  readonly unit: string;
  /** What the values cover, for the caption: "Scope 1 und 2". */
  readonly basis: string;
  /** One sentence under the bars: what the difference means. */
  readonly note: string;
  readonly bars: readonly WorkshopResultBar[];
}

export interface WorkshopMaterial {
  readonly label: string;
  readonly href: string;
  readonly kind: "html" | "zip" | "csv";
  /** Language of the linked file itself, independent from the page locale. */
  readonly language: Locale;
  readonly description: string;
  readonly role: WorkshopMaterialRole;
  readonly phase: WorkshopPhase;
  /** Download size in the page locale's number format, e.g. "1,1 MB". Downloads only. */
  readonly sizeLabel?: string;
  /** Minutes the material takes, stated only where the material or the agenda gives a number. */
  readonly minutes?: number;
  /**
   * Phone wording of the description (at most 72 characters, a complete
   * clause, no ellipsis). Set it where the description's first sentence is
   * longer than two phone lines; without it the phone row shows that sentence.
   */
  readonly short?: string;
  /** True when the workshop's outcomes can be reached without this material. */
  readonly optional?: boolean;
  /** Exactly one material per workshop is the place to start ("Hier starten"). */
  readonly primary?: boolean;
}

/**
 * A second, real-world case some workshops end on: the same method applied to a real
 * organisation's public reporting. Optional; most workshops have only the practice case.
 */
export interface WorkshopRealWorldCase {
  readonly companyName: string;
  readonly source: string;
  readonly sourceHref: string;
  readonly sourcePublishedAt: string;
  readonly sourceReviewedAt: string;
  readonly sourceLimitation: string;
  readonly narrative: string;
  readonly metrics: readonly WorkshopCaseMetric[];
  readonly decisionQuestion: string;
}

export interface WorkshopStageExplainer {
  readonly heading: string;
  readonly body: string;
  /** Two or three short plain facts ("7 Textdateien"), no sentences. */
  readonly facts?: readonly string[];
}

export interface Workshop {
  readonly slug: string;
  /** Two-digit catalogue number, fixed per workshop and never derived from array position. */
  readonly number: WorkshopNumber;
  /** Short topic used in the eyebrow and the catalogue index, e.g. "Prognosen". */
  readonly topic: string;
  readonly title: string;
  /** Always `Workshop NN · <topic>`. */
  readonly eyebrow: string;
  /** One or two sentences for the listing card and meta description. Keep at or under 160 characters. */
  readonly summary: string;
  /** The longer intro: the case, the wrong answer and the fix, in a few sentences. */
  readonly description: string;
  readonly format: string;
  /** Catalogue label, "~<minutes> Minuten" / "~<minutes> minutes" from minutesLive (or minutesSelfStudy without a live session). The numbers below carry the detail. */
  readonly duration: string;
  /** Two sentences at most: `<access>. <data flow>.` The one place access is stated. */
  readonly accessNote: string;
  /** The artefact the learner leaves with, as a short label ("Du nimmst mit"). */
  readonly outcome: string;
  /**
   * The always-visible block under the stage cards: what the kit (or, for a
   * workshop without a kit zip, the lab) is and what you do with it.
   * Heading as a question, two short sentences (about 35 words), and two or
   * three plain facts. Rendered by components/workshops/stage-explainer.tsx.
   */
  readonly stageExplainer: WorkshopStageExplainer;
  readonly audience: readonly string[];
  /** One sentence naming who should pick another workshop, and why. */
  readonly notForYou: string;
  /** The one question held fixed from the first scene to the last, verbatim. */
  readonly question: string;
  /** Three or four sentences, each starting from an observable verb ("Danach kannst du"). */
  readonly outcomes: readonly string[];
  /**
   * The agenda in taught order. Live items add up to minutesLive; self-study
   * items add up to minutesSelfStudy, rounded up to the next 5 minutes.
   */
  readonly agenda: readonly WorkshopAgendaItem[];
  /** "deck" when the minutes come from the deck's scene timings, "plan" when they are planned values. */
  readonly agendaSource: "deck" | "plan";
  /** Minutes with a group, including questions. Absent for self-study-only workshops. */
  readonly minutesLive?: number;
  /** Minutes alone. Shown with "ca." / "about" because it is not yet measured with test readers. */
  readonly minutesSelfStudy: number;
  /** Optional page wording when a minute count would obscure the useful duration. */
  readonly selfStudyDurationLabel?: string;
  /** Exact requirements, one item each. */
  readonly needs: readonly string[];
  /** What a learner might expect to need but does not. */
  readonly notNeeded: readonly string[];
  /** Two to four things this workshop does not teach. */
  readonly notCovered: readonly string[];
  readonly provenance: WorkshopProvenance;
  readonly steps: readonly WorkshopStep[];
  readonly caseStudy: WorkshopCaseStudy;
  readonly realWorldCase?: WorkshopRealWorldCase;
  readonly materials: readonly WorkshopMaterial[];
  /**
   * Optional kit block. A workshop with one gets the kit page at
   * /workshops/<slug>/kit, and its kit card links there instead of to the zip.
   * See src/lib/workshop-kit.ts.
   */
  readonly kit?: WorkshopKit;
}

const FORECAST_BASE_PATH = "/workshops/ki-prognosen-einschaetzen";
const WORKSHOP_BASE_PATH = "/workshops/geschaeftsberichte-mit-ki-lesen";

const WORKSHOPS_DE: readonly Workshop[] = [
  {
    slug: "ki-prognosen-einschaetzen",
    number: "01",
    topic: "Prognosen",
    title: "Kann KI die Zukunft vorhersagen?",
    eyebrow: "Workshop 01 · Prognosen",
    summary:
      "Du rechnest aus, was eine falsche Prognose kostet und wann ein Mensch freigeben muss.",
    description:
      "Du prüfst, ob ein Modell den Wert vom selben Wochentag der Vorwoche schlägt, und legst aus den Kosten von zu viel und zu wenig Kapazität den Puffer fest. Dann bestimmst du, woran du eine danebenliegende Prognose erkennst und wer freigibt. Die Labore rechnen in US-Dollar, der Launch-Fall in Stück.",
    format: "Selbstlern-Kit",
    duration: "~90 Minuten",
    accessNote:
      "Die Labore rechnen in US-Dollar, der Launch-Fall in Stück.",
    outcome: "Go/No-Go-Regel",
    stageExplainer: {
      heading: "Was ist das Labor?",
      body:
        "Im Browser rechnest du drei kleine Simulationen durch: Kapazität, Puffer und ein Nachfrageschock. Danach verteilst du im Launch‑Fall 1.050 Stück. Kein Konto nötig.",
      facts: ["3 Simulationen", "1 Fall", "ca. 90 Min. allein"],
    },
    audience: [
      "Disponentinnen und Planer, die nach Prognosen Mengen festlegen",
      "Führungskräfte, die eine Prognose verantworten, aber nicht rechnen",
      "Analytics-Teams, die belegen müssen, dass ein Modell besser ist",
    ],
    notForYou:
      "Nicht für dich, wenn du ein Prognosemodell programmieren willst; hier nutzt du fertige Simulationen.",
    question:
      "Nach welcher Regel verteilst du 1.050 Stück auf drei Standorte, und wann muss eine Person freigeben?",
    outcomes: [
      "Du rechnest in Dollar aus, ob eine Prognose die heutige Faustregel schlägt.",
      "Du leitest aus den Fehlerkosten ein Servicelevel und den Puffer ab.",
      "Du legst fest, wann die Prognose allein läuft und wann eine benannte Person entscheidet.",
      "Du nennst vier Arten von Ereignissen, die kein Modell vorhersagt.",
    ],
    agenda: [
      {
        label: "Die erste Entscheidung",
        minutes: 5,
        mode: "self",
        activity: "vote",
        description:
          "Du verteilst 1.050 Stück auf drei Standorte und wählst den stärksten Beleg.",
      },
      {
        label: "Kapazität festlegen",
        minutes: 15,
        mode: "self",
        activity: "do",
        description:
          "Du vergleichst drei Modellstufen in Dollar mit dem Wert der Vorwoche.",
      },
      {
        label: "Puffer in der Lieferkette",
        minutes: 15,
        mode: "self",
        activity: "do",
        description:
          "Du schickst dieselbe Nachfrage zweimal durch die Lieferkette und vergleichst die Schwankung.",
      },
      {
        label: "Freigabe nach einem Nachfrageschock",
        minutes: 15,
        mode: "self",
        activity: "do",
        description:
          "Du löst Schocks aus und siehst, wann eine benannte Person übernimmt.",
      },
      {
        label: "Der Launch-Fall",
        minutes: 30,
        mode: "self",
        activity: "do",
        description:
          "In elf Stationen verteilst du 1.050 Stück und legst vier tägliche Prüfungen fest.",
      },
      {
        label: "Dein Fall",
        minutes: 10,
        mode: "self",
        activity: "write",
        description:
          "Du schreibst in fünf Sätzen die Regel für eine eigene Prognose.",
      },
    ],
    agendaSource: "plan",
    minutesSelfStudy: 90,
    needs: [
      "Ein Browser, für die Labore am besten am Desktop",
    ],
    notNeeded: [
      "Programmierkenntnisse",
      "Ein KI-Konto",
      "Eigene Firmendaten",
    ],
    notCovered: [
      "Die Auswahl von Prognose-Software",
      "Die Herleitung der Formeln",
      "Die Planung für dein eigenes Sortiment",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-09-26",
      data: "synthetic",
      note: "Alle Firmen und Zahlen sind erfunden. Der Workshop zeigt keine KI-Antworten.",
    },
    steps: [
      {
        n: "01",
        title: "Das heutige Verfahren in Dollar schlagen",
        description:
          "Im Schattenbetrieb gegen den Vorwochenwert kostet fehlende Kapazität mehr als überschüssige; einen nicht eingetragenen Aktionstag bekommt eine Person.",
        tool: "Labor 1",
      },
      {
        n: "02",
        title: "Gestapelte Puffer mit einer gemeinsamen Prognose vergleichen",
        description:
          "Du vergleichst einen Puffer je Stufe mit einer gemeinsamen Prognose nach Bestellschwankung, Lieferfähigkeit und Lagerwert.",
        tool: "Labor 2",
      },
      {
        n: "03",
        title: "Die Freigabe nach einem Nachfrageschock prüfen",
        description:
          "Nach einem Schock fährt der blinde Betrieb weiter, der überwachte stoppt, übergibt an eine benannte Person und startet nach dem Nachtrainieren neu.",
        tool: "Labor 3",
      },
      {
        n: "04",
        title: "Den Launch-Fall mit 1.050 Stück durchrechnen",
        description:
          "Du verteilst von Hand, wählst nach Fehlerkosten ein Modell (12 % statt 21 % Abweichung), suchst Datenfehler, testest rückwirkend und legst vier tägliche Prüfungen fest.",
        tool: "Launch-Fall",
      },
      {
        n: "05",
        title: "Auf eine Prognose aus deiner Arbeit übertragen",
        description:
          "Du schreibst in fünf Sätzen die Regel für einen eigenen Fall.",
        tool: "Dein Fall",
      },
    ],
    caseStudy: {
      companyName: "Produktlaunch mit knapper Menge",
      isFictional: true,
      location: "Erfundenes Übungsszenario",
      sector: "Unterhaltungselektronik · Absatz- und Bedarfsplanung",
      period: "Startwoche eines neuen Geräts",
      narrative:
        "Die Nachfrage nach dem neuen Gerät übersteigt die zugesagte Menge, und drei Abteilungen lesen daraus drei verschiedene Zahlen.",
      metrics: [
        { label: "Anmeldung der Standorte", value: "1.370" },
        { label: "Geschätzte Nachfrage (Median)", value: "1.180" },
        { label: "Liefergrenze", value: "1.050" },
        { label: "Abweichung Modell / Baseline", value: "12 % / 21 %" },
      ],
      decisionQuestion:
        "Wer bekommt die 1.050 Stück, wenn 320 angemeldete fehlen, und ab welchem Prognosefehler gibt eine Person frei?",
      dataLimitations: [
        "Verkäufe zeigen keine Fehlmengen; was im Regal fehlte, musst du rekonstruieren.",
        "Ins Modell dürfen nur Merkmale, die zum Prognosezeitpunkt bekannt waren, sonst sieht der Rücktest die Zukunft.",
        "Ein einzelner Genauigkeitswert verbirgt ein Modell, das im Mittel gut aussieht und dauerhaft zu hoch liegt.",
        "Wettbewerber und Wetter bleiben Risiken; das Modell nutzt sie bewusst nicht.",
      ],
    },
    materials: [
      {
        label: "Labore · 3 Simulationen",
        href: `${FORECAST_BASE_PATH}/hands-on.html`,
        kind: "html",
        language: "en",
        role: "lab",
        phase: "during",
        minutes: 45,
        primary: true,
        description:
          "Drei Simulationen zu Kapazität, Puffern und einem Nachfrageschock.",
      },
      {
        label: "Launch-Fall",
        href: `${FORECAST_BASE_PATH}/case-study/index.html`,
        kind: "html",
        language: "en",
        role: "case",
        phase: "during",
        minutes: 30,
        description:
          "Du verteilst 1.050 Stück und legst die täglichen Prüfungen fest.",
      },
    ],
  },
  {
    slug: "geschaeftsberichte-mit-ki-lesen",
    number: "02",
    topic: "Geschäftsberichte",
    title: "Geschäftsberichte mit KI lesen",
    eyebrow: "Workshop 02 · Geschäftsberichte",
    summary:
      "Du legst fest, was die Kennzahlen eines Monatsberichts bedeuten, prüfst eine Zahl bis zur Datenzeile und entscheidest erst dann.",
    description:
      "Der Septemberbericht der erfundenen Firma NORTHWIND begründet mehr Marketing für die Linie CRAFT mit zwei richtig gerechneten Zahlen. Keine sagt, wie sie gezählt wurde. Du legst in Claude Code Zähler, Nenner und Zeitraum fest, verfolgst eine Zahl bis zu ihren Zeilen zurück und entscheidest erst dann. Die Festlegungen landen in einem Skill für jeden weiteren Monatsbericht.",
    format: "Selbstlern-Kit",
    duration: "~60 Minuten",
    accessNote:
      "Die Schritte 1 bis 5 brauchen Claude Code (in Pro und Max), Demo, Skill und Projektanweisungen gehen ohne Bezahlplan. Nimm nur das erfundene Kit: Claude kann Dateien an Anthropic übertragen.",
    outcome: "Kennzahlen-Steckbrief + Skill",
    stageExplainer: {
      heading: "Was ist das Kit?",
      body:
        "Eine Zip mit Rohdaten und zwei Monatsberichten der erfundenen Firma NORTHWIND, Steckbriefen zum Ausfüllen und einem Skill. Du öffnest sie in Claude Code, legst fest, was gezählt wird, und prüfst eine Zahl bis zur Zeile.",
      facts: ["Nur Textdateien", "5 Schritte", "ca. 60 Min. allein"],
    },
    audience: [
      "Controllerinnen und Controller mit Monats- oder Quartalsberichten",
      "Finance-Teams, die jeden Monatsbericht gleich lesen wollen",
      "Alle, die Claude ohne Programmieren für Zahlen testen wollen",
    ],
    notForYou:
      "Ohne Claude-Konto: Die Demo geht ohne Konto, für das Kit brauchst du Claude.",
    question:
      "Soll NORTHWIND die Produktlinie CRAFT nacharbeiten oder mehr Q3-Marketingbudget dahinterstellen?",
    outcomes: [
      "Für drei Kennzahlen eines Monatsberichts Zähler, Nenner, Zeitraum, Quelle und Grenze festlegen und als Skill ablegen.",
      "An einer Datei zeigen, dass dieselbe Kennzahl je nach Zählweise besser, gleich oder schlechter ausfällt, und eine Zählweise begründet wählen.",
      "Eine Zahl, die Claude ausgibt, bis zu Datei, Spalte, Filter und Zeilen zurückverfolgen.",
      "Eine Entscheidung mit einem Auslöser schreiben, der sich nicht durch Umbuchen erfüllen lässt, und den Skill im nächsten Monat wieder anwenden.",
    ],
    agenda: [
      {
        label: "Kit einrichten",
        minutes: 5,
        mode: "self",
        activity: "do",
        description:
          "Du entpackst das Kit und öffnest den Ordner in Claude Code.",
      },
      {
        label: "Das Argument lesen",
        minutes: 5,
        mode: "self",
        activity: "do",
        description:
          "Claude listet die Zahlen des VP Sales mit Abschnitt. Vorher schreibst du auf: besser, gleich oder schlechter?",
      },
      {
        label: "Die Definitionen festlegen",
        minutes: 15,
        mode: "self",
        activity: "write",
        description:
          "Claude rechnet jede Zählweise für August und September aus, du wählst Zähler, Zeitraum und Freigabebedingung.",
      },
      {
        label: "Eine Zahl zurückverfolgen",
        minutes: 10,
        mode: "self",
        activity: "do",
        description:
          "Claude wendet den Skill an und führt den CRAFT-Umsatz auf seine Zeilen zurück.",
      },
      {
        label: "Dashboard und Entscheidung",
        minutes: 15,
        mode: "self",
        activity: "write",
        description:
          "Jede Kachel sagt, wie sie gezählt ist. Du entscheidest über CRAFT und nennst den Steckbrief, der die Entscheidung trägt.",
      },
      {
        label: "Eine eigene Kennzahl",
        minutes: 10,
        mode: "self",
        activity: "write",
        description:
          "Claude fragt dich Feld für Feld nach einer Kennzahl aus deinem Bericht und schreibt den Steckbrief.",
      },
    ],
    agendaSource: "plan",
    minutesSelfStudy: 60,
    needs: [
      "Die Claude-Desktop-App mit Claude Code (in Pro und Max)",
      "Windows oder macOS",
      "Ein Zip-Archiv entpacken; START-HERE.md führt durch die Einrichtung",
    ],
    notNeeded: [
      "Programmierkenntnisse",
      "Einen API-Schlüssel",
      "Eigene Firmendaten: deine Kennzahl beschreibst du nur",
    ],
    notCovered: [
      "API, Datenbank oder Automatisierung",
      "Ein Grundkurs Bilanzanalyse",
      "Ein Vergleich von KI-Anbietern",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-25",
      data: "synthetic",
      note: "NORTHWIND und alle Daten sind erfunden. Die erwarteten Werte in START-HERE.md sind aus den CSV-Dateien des Kits gerechnet.",
    },
    steps: [
      {
        n: "01",
        title: "Das Argument lesen",
        description:
          "Claude listet jede Zahl des VP Sales mit Abschnitt; die Dateien können dabei an den Dienst übertragen werden, also prüf vor echten Daten Produkt-, Vertrags- und Aufbewahrungseinstellungen.",
        tool: "Bericht",
      },
      {
        n: "02",
        title: "Die Definitionen festlegen",
        description:
          "Dieselbe Datei ergibt je nach Zähler besser, gleich oder schlechter. Du wählst Zähler und Zeitraum mit einem Satz Begründung, und Claude schreibt beides in den Skill.",
        tool: "Steckbriefe",
      },
      {
        n: "03",
        title: "Eine Zahl zurückverfolgen",
        description:
          "Claude führt den CRAFT-Umsatz auf Datei, Spalten, Filter, Zeilen und Summe zurück. So zeigt sich auch, was Umsatz hier heißt.",
        tool: "Skill",
      },
      {
        n: "04",
        title: "Dashboard und Entscheidung",
        description:
          "Jede Kachel zeigt ihren Wert und wie er gezählt ist. Du entscheidest in sechs Feldern; das Gegenargument nennt, was die anderen Zählweisen ergeben.",
        tool: "Dashboard",
      },
      {
        n: "05",
        title: "Eine eigene Kennzahl",
        description:
          "Claude fragt Entscheidung, Zähler, Nenner, Zeitraum, Quelle, Grenze und Auslöser ab. Du beschreibst die Kennzahl, ohne Firmendaten einzufügen.",
        tool: "Steckbrief",
      },
      {
        n: "06",
        title: "Im nächsten Monat wiederholen",
        description:
          "Du legst den neuen Bericht dazu und wiederholst Schritt 3 und 4. Die Steckbriefe bleiben, die Zahlen ändern sich.",
        tool: "Wiederholung",
      },
    ],
    caseStudy: {
      companyName: "NORTHWIND GmbH",
      isFictional: true,
      location: "Berlin",
      sector: "Elektronikfertigung",
      period: "September 2023",
      narrative:
        "Das Familienunternehmen hat rund 850 Beschäftigte und sieben liefernde Produktlinien. Die neueste ist CRAFT, zwei Espressomaschinen und eine Mühle für 199 € bis 699 €: Absatzrang 6 von 7, zweithöchster Umsatz.",
      metrics: [
        { label: "Umsatz gesamt", value: "21,69 Mio. €" },
        { label: "Einheiten gesamt", value: "139.056" },
        { label: "CRAFT-Umsatz", value: "4,12 Mio. €" },
        { label: "CRAFT-Einheiten", value: "9.162" },
      ],
      decisionQuestion:
        "Welche Zählweise trägt die Entscheidung, und was zeigen die anderen?",
      dataLimitations: [
        "Keine Bruttomarge je Linie, weil Stückkosten fehlen.",
        "Keine Retouren: Meldungen sind Befunde aus der Fertigung.",
        "Kein Modell je Meldung, deshalb bewertet das Kit Ausschuss zum mittleren Listenpreis.",
      ],
    },
    materials: [
      {
        label: "Deck · 15 Folien",
        href: `${WORKSHOP_BASE_PATH}/slides.html`,
        kind: "html",
        language: "en",
        role: "deck",
        phase: "during",
        primary: true,
        description:
          "Die Folien zeigen Firma, Kit und die Prompts mit Ergebnissen. Jeder Prompt hat einen Kopierknopf.",
        short: "Die Folien führen durch Firma, Kit und Prompts.",
      },
      {
        label: "Analyst-Kit · .zip",
        href: `${WORKSHOP_BASE_PATH}/northwind-analyst-kit-de.zip`,
        kind: "zip",
        language: "de",
        role: "kit",
        phase: "before",
        sizeLabel: "37 KB",
        description:
          "Das Kit enthält START-HERE.md, Rohdaten, beide Monatsberichte, die Steckbriefe zum Ausfüllen, den NORTHWIND-Skill, eine Dashboard-Vorlage, den Skill kennzahlen-steckbrief und Projektanweisungen. Nur Textdateien.",
        short: "Das NORTHWIND-Kit mit Rohdaten, Berichten, Steckbriefen und Skill.",
      },
    ],
  },
];

const WORKSHOPS_EN: readonly Workshop[] = [
  {
    slug: "ki-prognosen-einschaetzen",
    number: "01",
    topic: "Forecasts",
    title: "Can AI predict the future?",
    eyebrow: "Workshop 01 · Forecasts",
    summary:
      "You work out what a wrong forecast costs and when a person must approve.",
    description:
      "You check whether a model beats the value from the same weekday a week earlier, and set the buffer from the cost of too much and too little capacity. Then you decide how you spot a forecast going wrong and who approves. The labs price in US dollars; the launch case counts units.",
    format: "Self-study kit",
    duration: "~90 minutes",
    accessNote:
      "The labs price in US dollars; the launch case counts units.",
    outcome: "Go/no-go rule",
    stageExplainer: {
      heading: "What is the lab?",
      body:
        "In your browser you run three small simulations: capacity, buffers and a demand shock. Then you hand out 1,050 units in the launch case. No account needed.",
      facts: ["3 simulations", "1 case", "about 90 min alone"],
    },
    audience: [
      "Planners who set quantities from forecasts",
      "Managers who own a forecast but do not calculate it",
      "Analytics teams who must prove a model does better",
    ],
    notForYou:
      "Not for you if you want to program a forecasting model; here you use ready-made simulations.",
    question:
      "Which rule allocates 1,050 units among three sites, and when must a person approve?",
    outcomes: [
      "Work out in dollars whether a forecast beats today's rule of thumb.",
      "Derive a service level and the buffer from the error costs.",
      "Set when the forecast runs alone and when a named person decides.",
      "Name four kinds of events that no model predicts.",
    ],
    agenda: [
      {
        label: "The first decision",
        minutes: 5,
        mode: "self",
        activity: "vote",
        description:
          "You allocate 1,050 units among three sites and pick the strongest evidence.",
      },
      {
        label: "Set capacity",
        minutes: 15,
        mode: "self",
        activity: "do",
        description:
          "You compare three model stages in dollars with last week's value.",
      },
      {
        label: "Buffers in the supply chain",
        minutes: 15,
        mode: "self",
        activity: "do",
        description:
          "You send the same demand through the supply chain twice and compare the swings.",
      },
      {
        label: "Release after a demand shock",
        minutes: 15,
        mode: "self",
        activity: "do",
        description:
          "You trigger shocks and see when a named person takes over.",
      },
      {
        label: "The launch case",
        minutes: 30,
        mode: "self",
        activity: "do",
        description:
          "Over eleven stations you allocate 1,050 units and set four daily checks.",
      },
      {
        label: "Your case",
        minutes: 10,
        mode: "self",
        activity: "write",
        description:
          "You write the rule for a forecast of your own in five sentences.",
      },
    ],
    agendaSource: "plan",
    minutesSelfStudy: 90,
    needs: [
      "A browser, ideally on a desktop for the labs",
    ],
    notNeeded: [
      "Programming skills",
      "An AI account",
      "Your own company data",
    ],
    notCovered: [
      "Choosing forecasting software",
      "Deriving the formulas",
      "Planning for your own product range",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-09-26",
      data: "synthetic",
      note: "All companies and figures are invented. The workshop shows no AI answers.",
    },
    steps: [
      {
        n: "01",
        title: "Beat the current process in dollars",
        description:
          "In a shadow test against last week's value, missing capacity costs more than spare; a promotion nobody entered goes to a person.",
        tool: "Lab 1",
      },
      {
        n: "02",
        title: "Compare stacked buffers with a shared forecast",
        description:
          "You compare a buffer per stage with a shared forecast on order swings, delivery rate and stock value.",
        tool: "Lab 2",
      },
      {
        n: "03",
        title: "Test the release after a demand shock",
        description:
          "After a shock the blind mode keeps running; the monitored one stops, hands over to a named person and restarts after retraining.",
        tool: "Lab 3",
      },
      {
        n: "04",
        title: "Work through the launch case with 1,050 units",
        description:
          "You allocate by hand, pick a model by error cost (12% rather than 21% deviation), look for data errors, backtest and set four daily checks.",
        tool: "Launch case",
      },
      {
        n: "05",
        title: "Apply it to a forecast from your work",
        description:
          "You write the rule for a case of your own in five sentences.",
        tool: "Your case",
      },
    ],
    caseStudy: {
      companyName: "Product launch with constrained supply",
      isFictional: true,
      location: "Invented practice scenario",
      sector: "Consumer electronics · Supply and demand planning",
      period: "Launch week for a new device",
      narrative:
        "Demand for the new device exceeds the confirmed quantity, and three departments read three different numbers from it.",
      metrics: [
        { label: "Site requests", value: "1,370" },
        { label: "Estimated demand (median)", value: "1,180" },
        { label: "Supply limit", value: "1,050" },
        { label: "Model / baseline deviation", value: "12% / 21%" },
      ],
      decisionQuestion:
        "Who gets the 1,050 units when 320 requested units are missing, and at what forecast error does a person approve?",
      dataLimitations: [
        "Sales miss stockouts; what was missing from the shelf has to be reconstructed.",
        "Only features known at forecast time may enter the model, or the backtest sees the future.",
        "One accuracy figure hides a model that looks fine on average and runs high every week.",
        "Competitors and weather remain risks; the model deliberately leaves them out.",
      ],
    },
    materials: [
      {
        label: "Labs · 3 simulations",
        href: `${FORECAST_BASE_PATH}/hands-on.html`,
        kind: "html",
        language: "en",
        role: "lab",
        phase: "during",
        minutes: 45,
        primary: true,
        description:
          "Three simulations on capacity, buffers and a demand shock.",
      },
      {
        label: "Launch case",
        href: `${FORECAST_BASE_PATH}/case-study/index.html`,
        kind: "html",
        language: "en",
        role: "case",
        phase: "during",
        minutes: 30,
        description:
          "You allocate 1,050 units and set the daily checks.",
      },
    ],
  },
  {
    slug: "geschaeftsberichte-mit-ki-lesen",
    number: "02",
    topic: "Business reports",
    title: "Read business reports with AI",
    eyebrow: "Workshop 02 · Business reports",
    summary:
      "You pin down what a monthly report's metrics mean, trace one figure to its data rows and only then decide.",
    description:
      "The September report of the invented company NORTHWIND argues for more marketing behind its CRAFT line with two correctly computed numbers. Neither says how it was counted. In Claude Code you pin down numerator, denominator and period, trace one figure to its rows and only then decide. The definitions go into a skill for every later monthly report.",
    format: "Self-study kit",
    duration: "~60 minutes",
    accessNote:
      "Steps 1 to 5 need Claude Code (in Pro and Max), while the demo, the skill and the project instructions need no paid plan. Use only the invented kit: Claude may transfer files to Anthropic.",
    outcome: "Metric card + skill",
    stageExplainer: {
      heading: "What is the kit?",
      body:
        "A zip with raw data and two monthly reports of the invented company NORTHWIND, metric cards to fill in and a skill. You open it in Claude Code, pin down what is counted and trace one figure to its row.",
      facts: ["Text files only", "5 steps", "about 60 min alone"],
    },
    audience: [
      "Controllers who work with monthly or quarterly reports",
      "Finance teams who want to read every monthly report alike",
      "Anyone who wants to test Claude on figures without code",
    ],
    notForYou:
      "Without a Claude account: the demo needs no account, the kit needs Claude.",
    question:
      "Should NORTHWIND rework the CRAFT product line or put more Q3 marketing budget behind it?",
    outcomes: [
      "Pin down numerator, denominator, period, source and limit for three metrics of a monthly report and save them as a skill.",
      "Show on one file that the same metric reads better, the same or worse depending on the count, and choose one with a reason.",
      "Trace a figure Claude gives you back to its file, column, filter and rows.",
      "Write a decision with a trigger that no rebooking can meet, and apply the skill again next month.",
    ],
    agenda: [
      {
        label: "Set up the kit",
        minutes: 5,
        mode: "self",
        activity: "do",
        description:
          "You unzip the kit and open the folder in Claude Code.",
      },
      {
        label: "Read the argument",
        minutes: 5,
        mode: "self",
        activity: "do",
        description:
          "Claude lists the sales director's numbers by section. First you write down: better, same or worse?",
      },
      {
        label: "Pin the definitions down",
        minutes: 15,
        mode: "self",
        activity: "write",
        description:
          "Claude computes every count for August and September; you choose numerator, period and release condition.",
      },
      {
        label: "Trace one figure",
        minutes: 10,
        mode: "self",
        activity: "do",
        description:
          "Claude runs the skill and traces CRAFT revenue to its rows.",
      },
      {
        label: "Dashboard and decision",
        minutes: 15,
        mode: "self",
        activity: "write",
        description:
          "Every tile says how it is counted. You decide on CRAFT and name the card the decision rests on.",
      },
      {
        label: "One metric of your own",
        minutes: 10,
        mode: "self",
        activity: "write",
        description:
          "Claude asks you field by field about one metric from your own report and writes the card.",
      },
    ],
    agendaSource: "plan",
    minutesSelfStudy: 60,
    needs: [
      "The Claude desktop app with Claude Code (in Pro and Max)",
      "Windows or macOS",
      "Unzipping an archive; START-HERE.md walks you through setup",
    ],
    notNeeded: [
      "Programming skills",
      "An API key",
      "Your own company data: you only describe your metric",
    ],
    notCovered: [
      "APIs, databases or automation",
      "An introduction to financial statement analysis",
      "A comparison of AI providers",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-25",
      data: "synthetic",
      note: "NORTHWIND and all its data are invented. The expected values in START-HERE.md are computed from the kit's CSV files.",
    },
    steps: [
      {
        n: "01",
        title: "Read the argument",
        description:
          "Claude lists every number the sales director uses, with its section; the files may be transferred to the service, so check product, contract and retention settings before you use real data.",
        tool: "Report",
      },
      {
        n: "02",
        title: "Pin the definitions down",
        description:
          "The same file comes out better, the same or worse depending on the numerator. You choose numerator and period with one sentence why, and Claude writes both into the skill.",
        tool: "Metric cards",
      },
      {
        n: "03",
        title: "Trace one figure",
        description:
          "Claude traces CRAFT revenue to file, columns, filter, rows and sum. That also shows what revenue means here.",
        tool: "Skill",
      },
      {
        n: "04",
        title: "Dashboard and decision",
        description:
          "Every tile shows its value and how it is counted. You decide in six fields; the counter-argument gives what the other counts produce.",
        tool: "Dashboard",
      },
      {
        n: "05",
        title: "One metric of your own",
        description:
          "Claude asks for decision, numerator, denominator, period, source, limit and trigger. You describe the metric without pasting company data.",
        tool: "Metric card",
      },
      {
        n: "06",
        title: "Repeat next month",
        description:
          "You add the new report and repeat steps 3 and 4. The cards stay; the numbers change.",
        tool: "Repeat",
      },
    ],
    caseStudy: {
      companyName: "NORTHWIND GmbH",
      isFictional: true,
      location: "Berlin",
      sector: "Electronics manufacturing",
      period: "September 2023",
      narrative:
        "The family business has about 850 employees and seven shipping product lines. The newest is CRAFT, two espresso machines and a grinder priced €199 to €699: sixth of seven by units, second by revenue.",
      metrics: [
        { label: "Total revenue", value: "€21.69m" },
        { label: "Total units", value: "139,056" },
        { label: "CRAFT revenue", value: "€4.12m" },
        { label: "CRAFT units", value: "9,162" },
      ],
      decisionQuestion:
        "Which count carries the decision, and what do the others show?",
      dataLimitations: [
        "No gross margin per line, because unit costs are missing.",
        "No returns: NCRs are production findings.",
        "No model per NCR, so the kit values scrap at the mean list price.",
      ],
    },
    materials: [
      {
        label: "Deck · 15 slides",
        href: `${WORKSHOP_BASE_PATH}/slides.html`,
        kind: "html",
        language: "en",
        role: "deck",
        phase: "during",
        primary: true,
        description:
          "The slides show the company, the kit and the prompts with results. Every prompt has a copy button.",
        short: "The slides walk through the company, the kit and the prompts.",
      },
      {
        label: "Analyst kit · .zip",
        href: `${WORKSHOP_BASE_PATH}/northwind-analyst-kit.zip`,
        kind: "zip",
        language: "en",
        role: "kit",
        phase: "before",
        sizeLabel: "36 KB",
        description:
          "The kit holds START-HERE.md, raw data, both monthly reports, the metric cards to fill in, the NORTHWIND skill, a dashboard template, the kennzahlen-steckbrief skill and project instructions. Text files only.",
        short: "The NORTHWIND kit with raw data, reports, metric cards and the skill.",
      },
    ],
  },
];

/**
 * The workshop's practice demo (src/lib/demos.ts) as one more material, in
 * the page's own language: role "demo", during the session, optional, never
 * the place to start. It is a page on this site (/demos/<slug>, or
 * /en/demos/<slug>), not a file under public/workshops/.
 */
export function workshopDemoMaterial(
  slug: string,
  locale: Locale,
): WorkshopMaterial | undefined {
  const demo = demoForWorkshop(slug);
  if (!demo) return undefined;
  const copy = locale === "en" ? demo.en : demo;
  return {
    label: `Demo · ${copy.title.replace(/\.$/, "")}`,
    // ?source=workshop: the demo's back control then returns to this workshop.
    href: `${locale === "en" ? "/en" : ""}/demos/${demo.slug}?source=workshop`,
    kind: "html",
    language: locale,
    description: copy.oneLiner,
    role: "demo",
    phase: "during",
    minutes: demo.minutes,
    optional: true,
  };
}

/**
 * The materials that are files under public/workshops/<slug>/ (deck, kit,
 * guides): everything except the practice demo, which is a site page. File
 * manifests and "material language" facts read this, never the demo.
 */
export function workshopFileMaterials(
  workshop: Pick<Workshop, "materials">,
): readonly WorkshopMaterial[] {
  return workshop.materials.filter((material) => material.role !== "demo");
}

function withDemoMaterial(workshop: Workshop, locale: Locale): Workshop {
  const material = workshopDemoMaterial(workshop.slug, locale);
  return material
    ? { ...workshop, materials: [...workshop.materials, material] }
    : workshop;
}

export const WORKSHOPS_BY_LOCALE: Readonly<
  Record<Locale, readonly Workshop[]>
> = {
  de: [
    ...WORKSHOPS_DE,
    DATA_READINESS_WORKSHOP.de,
    ESG_REPORTING_WORKSHOP.de,
    AI_AT_WORK_WORKSHOP.de,
  ].map((workshop) => withDemoMaterial(workshop, "de")),
  en: [
    ...WORKSHOPS_EN,
    DATA_READINESS_WORKSHOP.en,
    ESG_REPORTING_WORKSHOP.en,
    AI_AT_WORK_WORKSHOP.en,
  ].map((workshop) => withDemoMaterial(workshop, "en")),
};

/** German remains the canonical catalog for machine endpoints and legacy imports. */
export const WORKSHOPS: readonly Workshop[] = WORKSHOPS_BY_LOCALE.de;

export function getWorkshops(locale: Locale = "de"): readonly Workshop[] {
  return WORKSHOPS_BY_LOCALE[locale];
}

export function getWorkshopBySlug(
  slug: string,
  locale: Locale = "de",
): Workshop | undefined {
  return getWorkshops(locale).find((workshop) => workshop.slug === slug);
}

export function getWorkshopSlugs(): readonly string[] {
  return WORKSHOPS.map((workshop) => workshop.slug);
}

/** Slugs of the workshops that have a kit page. */
export function getWorkshopKitSlugs(): readonly string[] {
  return WORKSHOPS.filter((workshop) => workshop.kit).map(
    (workshop) => workshop.slug,
  );
}

/** The kit material (role "kit", a download) of a workshop that has a kit block. */
export function workshopKitMaterial(
  workshop: Workshop,
): WorkshopMaterial | undefined {
  return workshop.kit
    ? workshop.materials.find(
        (material) => material.role === "kit" && material.kind === "zip",
      )
    : undefined;
}

/** The material a learner should open first. Every workshop marks exactly one. */
export function primaryWorkshopMaterial(
  workshop: Workshop,
): WorkshopMaterial | undefined {
  return workshop.materials.find((material) => material.primary);
}

/** Minutes of the agenda items that run in the given delivery. */
export function workshopAgendaMinutes(
  workshop: Workshop,
  mode: Exclude<WorkshopAgendaMode, "both">,
): number {
  return workshop.agenda
    .filter((item) => (item.mode ?? "both") === "both" || item.mode === mode)
    .reduce((total, item) => total + item.minutes, 0);
}

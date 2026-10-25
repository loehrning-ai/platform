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
import { FORECASTING_KIT } from "./workshops-forecasting-kit";
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
    title: "KI-Prognosen prüfen, bevor danach geplant wird",
    eyebrow: "Workshop 01 · Prognosen",
    summary:
      "Du prüfst eine Wochenprognose an ihren alten Fehlern und legst fest, welche Menge du planst und wann eine Person entscheidet.",
    description:
      "Das Tool meldet 94,2 % Prognosegenauigkeit. Die einfache Regel „wie letzte Woche“ kommt mit derselben Formel auf 92,6 %. Du schreibst für jede vergangene Woche Ist minus Prognose auf und liest diese eine Spalte viermal: als Messlatte, als Spanne, als Planzahl aus euren Kosten und als Prüfregel mit vier Lampen. Der Fall ist erfunden: ein Jahr Linsensuppe bei Suppenwerk Feldmark.",
    format: "Selbstlern-Kit",
    duration: "~55 Minuten",
    accessNote:
      "Frei im Browser, ohne Konto. Die Demo und pruefen.py rechnen auf deinem Gerät, mit dem Claude-Skill können die Dateien an Anthropic übertragen werden.",
    outcome: "Prüfregel",
    stageExplainer: {
      heading: "Was ist das Kit?",
      body:
        "Eine Datei mit 104 Wochen Absatz und der damals gespeicherten Prognose, dazu Kosten, vier Aufgaben, Lösungen und eine Prüfregel zum Ausfüllen. Im Browser, mit Python oder mit dem Claude-Skill kommst du auf dieselben Zahlen.",
      facts: ["50 bewertete Wochen", "4 Lampen", "ca. 55 Min. allein"],
    },
    audience: [
      "Disponentinnen und Planer, die nach einer Prognose Mengen festlegen",
      "Führungskräfte, die eine Prognose freigeben, aber nicht selbst rechnen",
      "Analytics-Teams, die zeigen müssen, dass ein Tool besser ist als eine einfache Regel",
    ],
    notForYou:
      "Nicht für dich, wenn du ein Prognosemodell bauen willst; hier prüfst du eines, das es schon gibt.",
    question:
      "Darf die Prognose deines Tools ohne Freigabe in die Planung, und welche Menge planst du?",
    outcomes: [
      "Du vergleichst die Fehler einer Prognose mit „wie letzte Woche“ auf denselben Wochen.",
      "Du zählst, wie oft das Ist in der 80-%-Spanne lag, und findest das Datum, ab dem sie nicht mehr hält.",
      "Du rechnest aus Fehlmenge- und Restkosten die Planzahl für die nächste Woche.",
      "Du schreibst eine Prüfregel mit vier Lampen und der Person, die in roten Wochen entscheidet.",
    ],
    agenda: [
      {
        label: "Schätzen und zusehen",
        minutes: 5,
        mode: "self",
        activity: "vote",
        description:
          "In der Demo schätzt du, wie genau „wie letzte Woche“ ist, und siehst die Fehlerliste entstehen.",
      },
      {
        label: "Die Daten ansehen",
        minutes: 5,
        mode: "self",
        activity: "do",
        description:
          "Du findest die doppelte Zeile, die Woche ohne Prognose und die zwei ausverkauften Wochen.",
      },
      {
        label: "Prüfung 1: Messlatte",
        minutes: 10,
        mode: "self",
        activity: "do",
        description:
          "Du rechnest den mittleren Fehler der Prognose und von „wie letzte Woche“ auf denselben 50 Wochen.",
      },
      {
        label: "Prüfung 2: Spanne",
        minutes: 10,
        mode: "self",
        activity: "do",
        description:
          "Du bildest die Spanne aus den 26 Fehlern davor und zählst die Treffer.",
      },
      {
        label: "Prüfung 3 und 4: Planzahl und Regel",
        minutes: 10,
        mode: "self",
        activity: "do",
        description:
          "Du rechnest die Planzahl aus den Kosten und die vier Lampen für jede Woche.",
      },
      {
        label: "Mit den Lösungen vergleichen",
        minutes: 5,
        mode: "self",
        activity: "do",
        description:
          "Du vergleichst deine Zahlen mit den Lösungen.",
      },
      {
        label: "Deine Reihe",
        minutes: 10,
        mode: "self",
        activity: "write",
        description:
          "Du trägst eine eigene Reihe in die Vorlage ein und füllst die Prüfregel aus.",
      },
    ],
    agendaSource: "plan",
    minutesSelfStudy: 55,
    needs: [
      "Ein Browser; für den eigenen Fall eine Tabelle mit Woche, Ist und der damals gespeicherten Prognose",
    ],
    notNeeded: [
      "Programmierkenntnisse",
      "Ein KI-Konto",
      "Eine Prognose-Software",
    ],
    notCovered: [
      "Wie man ein Prognosemodell baut oder auswählt",
      "Tageswerte, Filialen und mehrere Artikel auf einmal",
      "Die Herleitung der Formeln",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-25",
      data: "synthetic",
      note: "Firma und Zahlen sind erfunden. Die Demo, pruefen.py und der Skill rechnen mit demselben Code und zeigen keine KI-Antworten.",
    },
    steps: [
      {
        n: "01",
        title: "Messlatte: kleinere Fehler als „wie letzte Woche“",
        description:
          "33,3 statt 42,2 Gläser auf denselben 50 Wochen: 21 % kleinere Fehler, näher dran in 30 von 50 Wochen.",
        tool: "Prüfung 1",
      },
      {
        n: "02",
        title: "Spanne: hält sie, was sie verspricht",
        description:
          "36 von 50 Wochen in der 80-%-Spanne statt 40. 11 der 14 Fehltreffer liegen ab der Auslistung am 07.04.",
        tool: "Prüfung 2",
      },
      {
        n: "03",
        title: "Planzahl aus den Kosten",
        description:
          "Ein fehlendes Glas kostet 1,50 €, ein übriges 0,40 €: Anteil 0,79, Planzahl 748 statt 729.",
        tool: "Prüfung 3",
      },
      {
        n: "04",
        title: "Prüfregel mit vier Lampen",
        description:
          "37 Wochen frei, 15 entscheidet eine Person. Du trägst ein, wer das ist.",
        tool: "Prüfung 4",
      },
      {
        n: "05",
        title: "Deine eigene Reihe",
        description:
          "Dieselben vier Prüfungen mit deiner Datei, in der Demo, mit pruefen.py oder mit dem Claude-Skill.",
        tool: "Meine Daten",
      },
    ],
    caseStudy: {
      companyName: "Suppenwerk Feldmark",
      isFictional: true,
      location: "Erfundenes Übungsszenario",
      sector: "Lebensmittel · Wochenplanung",
      period: "Januar 2024 bis Dezember 2025, 104 Wochen",
      narrative:
        "Suppenwerk Feldmark kocht montags Linsensuppe für Bio-Läden. Die Warenwirtschaft meldet 94,2 % Prognosegenauigkeit, und die Planung will die Prognose ohne Freigabe übernehmen.",
      metrics: [
        { label: "Prognosegenauigkeit laut Tool", value: "94,2 %" },
        { label: "„wie letzte Woche“, gleiche Formel", value: "92,6 %" },
        { label: "Wochen in der 80-%-Spanne", value: "36 von 50" },
        { label: "Planzahl Woche ab 29.12.2025", value: "748" },
      ],
      decisionQuestion:
        "Darf die Prognose ohne Freigabe in die Planung, und welche Menge wird für die Woche ab 29. Dezember gekocht?",
      dataLimitations: [
        "Verkäufe zeigen keine Fehlmengen; ausverkaufte Wochen zählen deshalb nicht.",
        "Nur Prognosen, die damals gespeichert wurden, zählen; eine heute nachgerechnete kennt das Ergebnis schon.",
        "50 Wochen sind wenig; ein einzelnes Rot ist ein Anlass nachzusehen, kein Beweis.",
        "Ärger im Laden über ein leeres Regal steht nicht in den Kosten.",
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
          "Vertiefung: drei Simulationen zu Kapazität, Puffern und einem Nachfrageschock.",
      },
      {
        label: "Kit · .zip",
        href: `${FORECAST_BASE_PATH}/forecast-check.zip`,
        kind: "zip",
        language: "en",
        role: "kit",
        phase: "during",
        sizeLabel: "41 KB",
        description:
          "Daten, Tool-Export, Kosten, vier Aufgaben, Lösungen, die Prüfregel, pruefen.py und der Claude-Skill. Nur Textdateien.",
        short: "Die Linsensuppe, vier Aufgaben, Lösungen und die Prüfregel.",
      },
    ],
    kit: FORECASTING_KIT.de,
  },
  {
    slug: "geschaeftsberichte-mit-ki-lesen",
    number: "02",
    topic: "Geschäftsberichte",
    title: "Geschäftsberichte mit KI lesen",
    eyebrow: "Workshop 02 · Geschäftsberichte",
    summary:
      "Du legst fest, was die Kennzahlen eines Monatsberichts bedeuten, und lässt Claude danach ein Dashboard füllen.",
    description:
      "In der Claude-App schreibst du in fünf Prompts auf, was Umsatz, Mängel und Marketing im Monatsbericht der erfundenen Firma NORTHWIND bedeuten. Daraus wird ein Skill für jeden weiteren Monatsbericht. Im zweiten Fall nutzt du dieselbe Methode für Metas öffentliche Quartalszahlen.",
    format: "Selbstlern-Kit",
    duration: "~90 Minuten",
    accessNote:
      "Nimm nur das erfundene Kit: Claude kann Dateien an Anthropic übertragen.",
    outcome: "Kennzahlen-Skill + Dashboard",
    stageExplainer: {
      heading: "Was ist das Kit?",
      body:
        "Eine Zip mit Rohdaten und Monatsberichten der erfundenen Firma NORTHWIND, einem halb fertigen Skill und einer Dashboard-Vorlage. Du öffnest sie in der Claude-Desktop-App und machst die fünf Prompts nach.",
      facts: ["Nur Textdateien", "5 Prompts", "ca. 90 Min. allein"],
    },
    audience: [
      "Controllerinnen und Controller mit Monats- oder Quartalsberichten",
      "Finance-Teams, die jeden Monatsbericht gleich lesen wollen",
      "Alle, die Claude ohne Programmieren für Zahlen testen wollen",
    ],
    notForYou:
      "Ohne Claude-Desktop-App nimm Workshop 01, 03 oder 04; sie laufen ohne KI-Konto.",
    question:
      "Soll NORTHWIND die Produktlinie CRAFT nacharbeiten oder mehr Q3-Marketingbudget dahinterstellen?",
    outcomes: [
      "Du schreibst auf, was fünf Kennzahlen bedeuten, und speicherst das als Skill.",
      "Du prüfst eine von Claude ausgelesene Zahl gegen Datei und Spalte.",
      "Du begründest eine Entscheidung mit der Zahl, die sie trägt, und nennst, was ein Irrtum kostet und was die Daten offenlassen.",
      "Du wendest den Skill auf den nächsten Monatsbericht an.",
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
        label: "Claude liest die Firma",
        minutes: 10,
        mode: "self",
        activity: "do",
        description:
          "Claude liest Steckbrief und Monatsbericht und nennt die Entscheidung des Monats.",
      },
      {
        label: "Den Kennzahlen-Skill schreiben",
        minutes: 20,
        mode: "self",
        activity: "write",
        description:
          "Claude fragt nach Umsatz, Mängeln und Marketing und schreibt deine Antworten in den Skill.",
      },
      {
        label: "Auslesen und an der Quelle prüfen",
        minutes: 15,
        mode: "self",
        activity: "do",
        description:
          "Claude liest den Monat nach deinen Regeln aus, du prüfst eine Zahl gegen die CSV.",
      },
      {
        label: "Das Dashboard füllen",
        minutes: 10,
        mode: "self",
        activity: "do",
        description:
          "Claude trägt die Kennzahlen in die Dashboard-Vorlage ein.",
      },
      {
        label: "Entscheiden",
        minutes: 15,
        mode: "self",
        activity: "write",
        description:
          "Du entscheidest über CRAFT und nennst die Zahl, die trägt, was ein Irrtum kostet und das stärkste Gegenargument.",
      },
      {
        label: "Fall 2: Metas Quartal",
        minutes: 15,
        mode: "self",
        activity: "do",
        optional: true,
        description:
          "Du wendest die Methode auf Metas Quartalsmitteilung Q2 2026 an.",
      },
    ],
    agendaSource: "plan",
    minutesSelfStudy: 90,
    needs: [
      "Die Claude-Desktop-App in einem Plan mit Claude Code",
      "Windows oder macOS",
      "Ein Zip-Archiv entpacken; START-HERE.md führt durch die Einrichtung",
    ],
    notNeeded: [
      "Programmierkenntnisse",
      "Einen API-Schlüssel",
      "Eigene Firmendaten",
    ],
    notCovered: [
      "API, Datenbank oder Automatisierung",
      "Ein Grundkurs Bilanzanalyse",
      "Ein Vergleich von KI-Anbietern",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-09-26",
      data: "synthetic-and-public",
      note: "Fall 2 nutzt nur Metas öffentliche Quartalsmitteilung; der Autor arbeitet als Data Engineer bei Meta.",
    },
    steps: [
      {
        n: "01",
        title: "Claude liest die Firma",
        description:
          "Claude liest Steckbrief und Monatsbericht; die Dateien können dabei an den Dienst übertragen werden, also prüf vor echten Daten Produkt-, Vertrags- und Aufbewahrungseinstellungen.",
        tool: "Dateien",
      },
      {
        n: "02",
        title: "Den Kennzahlen-Skill schreiben",
        description:
          "Claude fragt, was Umsatz, Mängel und Marketing bedeuten, und ergänzt damit den halb fertigen Skill. Prüf in jeder Antwort, ob Claude deine Regeln nennt.",
        tool: "Skill",
      },
      {
        n: "03",
        title: "Auslesen und an der Quelle prüfen",
        description:
          "Du prüfst eine ausgelesene Kennzahl mit Datei und Spalte gegen die CSV und vergleichst mit einer Antwort ohne Skill.",
        tool: "Claude Code",
      },
      {
        n: "04",
        title: "Das Dashboard füllen",
        description:
          "Mit einem Prompt füllt Claude die Dashboard-Vorlage, die das Meeting statt des 8-Seiten-Berichts bekommt.",
        tool: "Dashboard",
      },
      {
        n: "05",
        title: "Gegen den Vertriebsleiter argumentieren",
        description:
          "Du entscheidest über CRAFT und nennst die Zahl, die trägt, was ein Irrtum kostet, welche Daten fehlen und das stärkste Gegenargument.",
        tool: "Entscheidung",
      },
      {
        n: "06",
        title: "Fall 2 mit Metas Quartal",
        description:
          "Claude lädt Metas Quartalsmitteilung Q2 2026 aus dem Netz, und du beurteilst 31 Mrd. $ Investitionen in einem Quartal.",
        tool: "SEC-Mitteilung · live",
      },
      {
        n: "07",
        title: "Mit deinen eigenen Berichten wiederholen",
        description:
          "Im nächsten Monat wendest du den Skill auf den neuen Bericht an.",
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
        "Welche Zahl trägt die Entscheidung, und welche Daten fehlen dafür?",
      dataLimitations: [
        "Keine Bruttomarge je Linie, weil Stückkosten fehlen.",
        "Keine Retouren je Linie, weil Bestellungen nicht mit Linien verknüpft sind.",
        "Kein Marketingbudget je Linie, weil Kampagnen nicht sauber zurechenbar sind.",
      ],
    },
    realWorldCase: {
      companyName: "Meta Platforms, Inc.",
      source: "Meta Q2 2026 Results · SEC Exhibit 99.1",
      sourceHref:
        "https://www.sec.gov/Archives/edgar/data/1326801/000162828026050596/meta-06302026xexhibit991.htm",
      sourcePublishedAt: "2026-07-29",
      sourceReviewedAt: "2026-08-26",
      sourceLimitation:
        "Unternehmensmitteilung mit ungeprüften Quartalszahlen. Freier Cashflow ist eine Non-GAAP-Kennzahl. Die Quelle belegt Werte, nicht die Investitionsentscheidung.",
      narrative:
        "Fast der gesamte operative Cashflow floss in Infrastruktur. Du definierst sechs Kennzahlen, liest das Quartal aus und lässt Claude ein Dashboard ohne Vorlage entwerfen.",
      metrics: [
        { label: "Umsatz", value: "+28 %" },
        { label: "Operatives Ergebnis", value: "−8 %" },
        { label: "Investitionen, ein Quartal", value: "31,1 Mrd. $" },
        { label: "Freier Cashflow", value: "784 Mio. $" },
      ],
      decisionQuestion:
        "Lassen sich 31,1 Mrd. $ Investitionen in einem Quartal mit künftigen Erträgen begründen? Und welche Zahl beschreibt das Quartal besser, das gemeldete Minus oder der Wert ohne Sondereffekte?",
    },
    materials: [
      {
        label: "Deck · 22 Folien",
        href: `${WORKSHOP_BASE_PATH}/slides.html`,
        kind: "html",
        language: "en",
        role: "deck",
        phase: "during",
        primary: true,
        description:
          "Die Folien zeigen Firma, Kit, die fünf Prompts mit Ergebnissen, drei Zusatz-Prompts und Fall 2. Jeder Prompt hat einen Kopierknopf.",
        short: "Die Folien führen durch Firma, Kit, Prompts und Fall 2 mit Meta.",
      },
      {
        label: "Analyst-Kit · .zip",
        href: `${WORKSHOP_BASE_PATH}/northwind-analyst-kit.zip`,
        kind: "zip",
        language: "en",
        role: "kit",
        phase: "before",
        sizeLabel: "60 KB",
        description:
          "Das Kit enthält START-HERE.md, Rohdaten, beide Monatsberichte, den halb fertigen Skill, Dashboard-Vorlage, Arbeitsblatt, Meta-Aufgabe und eine Vorlage für die eigene Firma. Nur Textdateien.",
        short: "Das NORTHWIND-Kit mit Rohdaten, Berichten, Skill und Vorlagen.",
      },
    ],
  },
];

const WORKSHOPS_EN: readonly Workshop[] = [
  {
    slug: "ki-prognosen-einschaetzen",
    number: "01",
    topic: "Forecasts",
    title: "Checking AI forecasts before you plan with them",
    eyebrow: "Workshop 01 · Forecasts",
    summary:
      "You check a weekly forecast against its own past errors and set the quantity you plan and when a person decides.",
    description:
      "The tool reports 94.2 % forecast accuracy. The simple rule \"same as last week\" reaches 92.6 % with the same formula. You write down actual minus forecast for every past week and read that one column four ways: as a baseline, as a range, as a planning number from your costs, and as a release rule with four lamps. The case is invented: one year of lentil soup at Suppenwerk Feldmark.",
    format: "Self-study kit",
    duration: "~55 minutes",
    accessNote:
      "Free in the browser, no account. The demo and pruefen.py compute on your device; with the Claude skill the files may be transferred to Anthropic.",
    outcome: "Release rule",
    stageExplainer: {
      heading: "What is the kit?",
      body:
        "104 weeks of sales with the forecast stored at the time, plus costs, four tasks, solutions and a release rule to fill in. Browser, Python or the Claude skill give the same numbers.",
      facts: ["50 scored weeks", "4 lamps", "about 55 min alone"],
    },
    audience: [
      "Planners who set quantities from a forecast",
      "Managers who sign off a forecast without computing it themselves",
      "Analytics teams who must show that a tool beats a simple rule",
    ],
    notForYou:
      "Not for you if you want to build a forecasting model; here you check one that already exists.",
    question:
      "May your tool's forecast go into planning without sign-off, and what quantity do you plan?",
    outcomes: [
      "You compare a forecast's errors with \"same as last week\" on the same weeks.",
      "You count how often the actual landed inside the 80 % range and find the date it stops holding.",
      "You compute next week's planning number from the cost of a missing and a leftover unit.",
      "You write a release rule with four lamps and the person who decides in red weeks.",
    ],
    agenda: [
      {
        label: "Guess and watch",
        minutes: 5,
        mode: "self",
        activity: "vote",
        description:
          "In the demo you guess how accurate \"same as last week\" is and watch the error list build up.",
      },
      {
        label: "Look at the data",
        minutes: 5,
        mode: "self",
        activity: "do",
        description:
          "You find the duplicate row, the week without a forecast and the two sold-out weeks.",
      },
      {
        label: "Check 1: baseline",
        minutes: 10,
        mode: "self",
        activity: "do",
        description:
          "You compute the mean error of the forecast and of \"same as last week\" on the same 50 weeks.",
      },
      {
        label: "Check 2: range",
        minutes: 10,
        mode: "self",
        activity: "do",
        description:
          "You build the range from the 26 errors before each week and count the hits.",
      },
      {
        label: "Checks 3 and 4: planning number and rule",
        minutes: 10,
        mode: "self",
        activity: "do",
        description:
          "You compute the planning number from the costs and the four lamps for every week.",
      },
      {
        label: "Compare with the solutions",
        minutes: 5,
        mode: "self",
        activity: "do",
        description:
          "You compare your numbers with the solutions.",
      },
      {
        label: "Your series",
        minutes: 10,
        mode: "self",
        activity: "write",
        description:
          "You put a series of your own into the template and fill in the release rule.",
      },
    ],
    agendaSource: "plan",
    minutesSelfStudy: 55,
    needs: [
      "A browser; for your own case a table with week, actual and the forecast stored at the time",
    ],
    notNeeded: [
      "Programming skills",
      "An AI account",
      "Forecasting software",
    ],
    notCovered: [
      "How to build or choose a forecasting model",
      "Daily values, branches and several items at once",
      "Deriving the formulas",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-25",
      data: "synthetic",
      note: "The company and the numbers are invented. The demo, pruefen.py and the skill run the same code and show no AI answers.",
    },
    steps: [
      {
        n: "01",
        title: "Baseline: smaller errors than \"same as last week\"",
        description:
          "33.3 instead of 42.2 jars on the same 50 weeks: 21 % smaller errors, closer in 30 of 50 weeks.",
        tool: "Check 1",
      },
      {
        n: "02",
        title: "Range: does it hold what it promises",
        description:
          "36 of 50 weeks inside the 80 % range instead of 40. 11 of the 14 misses fall from the delisting on 7 April.",
        tool: "Check 2",
      },
      {
        n: "03",
        title: "Planning number from the costs",
        description:
          "A missing jar costs €1.50, a leftover one €0.40: share 0.79, planning number 748 instead of 729.",
        tool: "Check 3",
      },
      {
        n: "04",
        title: "Release rule with four lamps",
        description:
          "37 weeks free, in 15 a person decides. You write down who that is.",
        tool: "Check 4",
      },
      {
        n: "05",
        title: "Your own series",
        description:
          "The same four checks on your file, in the demo, with pruefen.py or with the Claude skill.",
        tool: "My data",
      },
    ],
    caseStudy: {
      companyName: "Suppenwerk Feldmark",
      isFictional: true,
      location: "Invented practice scenario",
      sector: "Food · weekly planning",
      period: "January 2024 to December 2025, 104 weeks",
      narrative:
        "Suppenwerk Feldmark cooks lentil soup for organic shops every Monday. The ERP reports 94.2 % forecast accuracy, and planning wants to take the forecast without sign-off.",
      metrics: [
        { label: "Forecast accuracy, says the tool", value: "94.2 %" },
        { label: "\"Same as last week\", same formula", value: "92.6 %" },
        { label: "Weeks inside the 80 % range", value: "36 of 50" },
        { label: "Planning number, week of 29 Dec 2025", value: "748" },
      ],
      decisionQuestion:
        "May the forecast go into planning without sign-off, and how much is cooked for the week of 29 December?",
      dataLimitations: [
        "Sales do not show shortages, so sold-out weeks do not count.",
        "Only forecasts stored at the time count; one recomputed today already knows the result.",
        "50 weeks are few; a single red is a reason to look, not a proof.",
        "Annoyance in the shop about an empty shelf is not in the costs.",
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
          "Going further: three simulations on capacity, buffers and a demand shock.",
      },
      {
        label: "Kit · .zip",
        href: `${FORECAST_BASE_PATH}/forecast-check.zip`,
        kind: "zip",
        language: "en",
        role: "kit",
        phase: "during",
        sizeLabel: "41 KB",
        description:
          "Data, tool export, costs, four tasks, solutions, the release rule, pruefen.py and the Claude skill. Text files only.",
        short: "The lentil soup, four tasks, solutions and the release rule.",
      },
    ],
    kit: FORECASTING_KIT.en,
  },
  {
    slug: "geschaeftsberichte-mit-ki-lesen",
    number: "02",
    topic: "Business reports",
    title: "Read business reports with AI",
    eyebrow: "Workshop 02 · Business reports",
    summary:
      "You define what a monthly report's metrics mean, then have Claude fill a dashboard by those rules.",
    description:
      "In the Claude app you write down in five prompts what revenue, defects and marketing mean in the monthly report of the invented company NORTHWIND. That becomes a skill for every later monthly report. In the second case you apply the same method to Meta's public quarterly figures.",
    format: "Self-study kit",
    duration: "~90 minutes",
    accessNote:
      "Use only the invented kit: Claude may transfer files to Anthropic.",
    outcome: "Metrics skill + dashboard",
    stageExplainer: {
      heading: "What is the kit?",
      body:
        "A zip with raw data and monthly reports of the invented company NORTHWIND, a half-finished skill and a dashboard template. You open it in the Claude desktop app and follow the five prompts.",
      facts: ["Text files only", "5 prompts", "about 90 min alone"],
    },
    audience: [
      "Controllers who work with monthly or quarterly reports",
      "Finance teams who want to read every monthly report alike",
      "Anyone who wants to test Claude on figures without code",
    ],
    notForYou:
      "Without the Claude desktop app, pick Workshop 01, 03 or 04; they need no AI account.",
    question:
      "Should NORTHWIND rework the CRAFT product line or put more Q3 marketing budget behind it?",
    outcomes: [
      "Write down what five metrics mean and save it as a skill.",
      "Check a figure Claude extracted against its file and column.",
      "Back a decision with its key figure, the cost of error and data gaps.",
      "Apply the skill to the next monthly report.",
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
        label: "Claude reads the company",
        minutes: 10,
        mode: "self",
        activity: "do",
        description:
          "Claude reads the profile and the monthly report and names the month's decision.",
      },
      {
        label: "Write the metrics skill",
        minutes: 20,
        mode: "self",
        activity: "write",
        description:
          "Claude asks about revenue, defects and marketing and writes your answers into the skill.",
      },
      {
        label: "Extract and check the source",
        minutes: 15,
        mode: "self",
        activity: "do",
        description:
          "Claude extracts the month by your rules; you check one figure against the CSV.",
      },
      {
        label: "Fill the dashboard",
        minutes: 10,
        mode: "self",
        activity: "do",
        description:
          "Claude writes the metrics into the dashboard template.",
      },
      {
        label: "Decide",
        minutes: 15,
        mode: "self",
        activity: "write",
        description:
          "You decide on CRAFT, with key figure, cost of error and the strongest counter-argument.",
      },
      {
        label: "Case 2: Meta's quarter",
        minutes: 15,
        mode: "self",
        activity: "do",
        optional: true,
        description:
          "You apply the method to Meta's Q2 2026 quarterly release.",
      },
    ],
    agendaSource: "plan",
    minutesSelfStudy: 90,
    needs: [
      "The Claude desktop app on a plan with Claude Code",
      "Windows or macOS",
      "Unzipping an archive; START-HERE.md walks you through setup",
    ],
    notNeeded: [
      "Programming skills",
      "An API key",
      "Your own company data",
    ],
    notCovered: [
      "APIs, databases or automation",
      "An introduction to financial statement analysis",
      "A comparison of AI providers",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-09-26",
      data: "synthetic-and-public",
      note: "Case 2 uses only Meta's public quarterly release; the author works as a data engineer at Meta.",
    },
    steps: [
      {
        n: "01",
        title: "Claude reads the company",
        description:
          "Claude reads the profile and the monthly report; the files may be transferred to the service, so check product, contract and retention settings before you use real data.",
        tool: "Files",
      },
      {
        n: "02",
        title: "Write the metrics skill",
        description:
          "Claude asks what revenue, defects and marketing mean and completes the half-finished skill with your answers. Check that each answer names your rules.",
        tool: "Skill",
      },
      {
        n: "03",
        title: "Extract the figures and check the source",
        description:
          "You check one extracted metric against the CSV by file and column and compare with an answer without the skill.",
        tool: "Claude Code",
      },
      {
        n: "04",
        title: "Fill the dashboard",
        description:
          "With one prompt Claude fills the dashboard template the meeting gets instead of the eight-page report.",
        tool: "Dashboard",
      },
      {
        n: "05",
        title: "Argue against the sales director",
        description:
          "You decide on CRAFT with key figure, cost of error, data gaps and the strongest counter-argument.",
        tool: "Decision",
      },
      {
        n: "06",
        title: "Case 2 with Meta's quarter",
        description:
          "Claude fetches Meta's Q2 2026 release from the web, and you judge $31 billion of capital expenditure in one quarter.",
        tool: "SEC filing · live",
      },
      {
        n: "07",
        title: "Repeat it on your own reports",
        description:
          "Next month you apply the skill to the new report.",
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
        "Which figure carries the decision, and which data are missing?",
      dataLimitations: [
        "No gross margin per line, because unit costs are missing.",
        "No returns per line, because orders are not linked to lines.",
        "No marketing spend per line, because campaigns are not cleanly allocated.",
      ],
    },
    realWorldCase: {
      companyName: "Meta Platforms, Inc.",
      source: "Meta Q2 2026 Results · SEC Exhibit 99.1",
      sourceHref:
        "https://www.sec.gov/Archives/edgar/data/1326801/000162828026050596/meta-06302026xexhibit991.htm",
      sourcePublishedAt: "2026-07-29",
      sourceReviewedAt: "2026-08-26",
      sourceLimitation:
        "Company release with unaudited quarterly figures. Free cash flow is a non-GAAP measure. The source supports the figures, not the investment decision.",
      narrative:
        "Almost all operating cash flow went into infrastructure. You define six metrics, extract the quarter and have Claude design a dashboard without a template.",
      metrics: [
        { label: "Revenue", value: "+28%" },
        { label: "Operating income", value: "−8%" },
        { label: "Capital expenditure, one quarter", value: "$31.1bn" },
        { label: "Free cash flow", value: "$784m" },
      ],
      decisionQuestion:
        "Can $31.1 billion of capital expenditure in one quarter be justified by future returns? And which figure describes the quarter better, the reported decline or the result excluding special items?",
    },
    materials: [
      {
        label: "Deck · 22 slides",
        href: `${WORKSHOP_BASE_PATH}/slides.html`,
        kind: "html",
        language: "en",
        role: "deck",
        phase: "during",
        primary: true,
        description:
          "The slides show the company, the kit, the five prompts with results, three extra prompts and case 2. Every prompt has a copy button.",
        short: "The slides walk through the company, the kit, the prompts and Meta.",
      },
      {
        label: "Analyst kit · .zip",
        href: `${WORKSHOP_BASE_PATH}/northwind-analyst-kit.zip`,
        kind: "zip",
        language: "en",
        role: "kit",
        phase: "before",
        sizeLabel: "60 KB",
        description:
          "The kit holds START-HERE.md, raw data, both monthly reports, the half-finished skill, dashboard template, worksheet, Meta exercise and a template for your own company. Text files only.",
        short: "The NORTHWIND kit with raw data, reports, the skill and templates.",
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

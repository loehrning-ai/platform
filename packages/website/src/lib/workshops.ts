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

import type { Locale } from "./i18n/locale";
import { DATA_READINESS_WORKSHOP } from "./workshops-data-readiness";
import { ESG_REPORTING_WORKSHOP } from "./workshops-esg-reporting";

/** Two-digit catalogue number. "04" is reserved for the ESG workshop. */
export type WorkshopNumber = "01" | "02" | "03" | "04";

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
  /** Catalogue label, always "~90 Minuten" / "~90 minutes". The numbers below carry the detail. */
  readonly duration: string;
  /** Two sentences at most: `<access>. <data flow>.` The one place access is stated. */
  readonly accessNote: string;
  /** The artefact the learner leaves with, as a short label ("Du nimmst mit"). */
  readonly outcome: string;
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
      "In Browser-Laboren rechnest du aus, was eine falsche Prognose kostet und wann eine Person freigeben muss.",
    description:
      "Du prüfst, ob ein Modell den Wert vom selben Wochentag der Vorwoche schlägt, und legst aus den Kosten von zu viel und zu wenig Kapazität den Puffer fest. Dann bestimmst du, woran du eine danebenliegende Prognose erkennst und wer freigibt. Die Labore rechnen in US-Dollar, der Launch-Fall in Stück.",
    format: "Selbstlern-Kit",
    duration: "~90 Minuten",
    accessNote:
      "Alles läuft im Browser.",
    outcome: "Go/No-Go-Regel",
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
          "Mit der Prüfkarte schreibst du in fünf Sätzen die Regel für eine eigene Prognose.",
      },
    ],
    agendaSource: "plan",
    minutesSelfStudy: 90,
    needs: [
      "Ein Browser, für die Labore am besten am Desktop",
      "Für die optionale Übung ein Tabellenprogramm wie Excel",
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
        title: "Zwei Prognosen selbst rechnen",
        description:
          "Optional, 15 bis 45 Minuten: Du prognostizierst die letzten 14 von 104 Wochen naiv und geglättet und vergleichst mittleren Fehler und systematische Abweichung.",
        tool: "Übung · optional",
      },
      {
        n: "06",
        title: "Auf eine Prognose aus deiner Arbeit übertragen",
        description:
          "Mit der A4-Prüfkarte schreibst du in fünf Sätzen die Regel für einen eigenen Fall.",
        tool: "Prüfkarte",
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
        label: "Übersicht",
        href: `${FORECAST_BASE_PATH}/hub.html`,
        kind: "html",
        language: "en",
        role: "hub",
        phase: "before",
        optional: true,
        description:
          "Die Startseite der Materialien mit Links zu allen Teilen; diese Seite ersetzt sie.",
      },
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
      {
        label: "Prüfkarte · 1 Seite",
        href: `${FORECAST_BASE_PATH}/field-card.html`,
        kind: "html",
        language: "en",
        role: "card",
        phase: "after",
        description:
          "Eine A4-Seite zum Ausdrucken: Newsvendor-Regel, Sicherheitsbestand und fünf Prüfungen, bevor du einer Prognose traust.",
        short: "A4-Seite zum Ausdrucken: Newsvendor-Regel und Sicherheitsbestand.",
      },
      {
        label: "Übungsaufgabe",
        href: `${FORECAST_BASE_PATH}/homework.html`,
        kind: "html",
        language: "en",
        role: "exercise",
        phase: "after",
        minutes: 45,
        optional: true,
        description:
          "Du rechnest zwei Prognosen und schreibst einen Satz zu den vier Zahlen. Mit Zusatzaufgabe dauert es 45 statt 15 Minuten.",
      },
      {
        label: "Datensatz, 104 Wochen · .csv",
        href: `${FORECAST_BASE_PATH}/data/demand-weekly.csv`,
        kind: "csv",
        language: "en",
        role: "data",
        phase: "after",
        optional: true,
        sizeLabel: "1,6 KB",
        description:
          "Die wöchentliche Nachfrage für die Übung (demand-weekly.csv). Öffnet in jedem Tabellenprogramm.",
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
      "Du legst fest, was die Kennzahlen eines Monatsberichts bedeuten, und lässt Claude danach ein Dashboard füllen.",
    description:
      "In der Claude-App schreibst du in fünf Prompts auf, was Umsatz, Mängel und Marketing im Monatsbericht der erfundenen Firma NORTHWIND bedeuten. Daraus wird ein Skill für jeden weiteren Monatsbericht. Im zweiten Fall nutzt du dieselbe Methode für Metas öffentliche Quartalszahlen.",
    format: "Selbstlern-Kit",
    duration: "~90 Minuten",
    accessNote:
      "Nimm nur das erfundene Kit: Claude kann Dateien an Anthropic übertragen.",
    outcome: "Kennzahlen-Skill + Dashboard",
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
        "Das Familienunternehmen hat rund 850 Beschäftigte und acht Produktlinien, sieben davon liefern aus. Die neueste und teuerste ist CRAFT: zwei Espressomaschinen und eine Mühle für 199 € bis 699 €. CRAFT macht bei Absatzrang 6 von 7 den zweithöchsten Umsatz.",
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
        "Unternehmensmitteilung mit ungeprüften Quartalszahlen. Der freie Cashflow ist eine ergänzende Non-GAAP-Kennzahl; die Quelle belegt Werte, nicht die Investitionsentscheidung.",
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
    title: "Can AI predict the future?",
    eyebrow: "Workshop 01 · Forecasts",
    summary:
      "In browser labs you work out what a wrong forecast costs and when a person must approve.",
    description:
      "You check whether a model beats the value from the same weekday a week earlier, and set the buffer from the cost of too much and too little capacity. Then you decide how you spot a forecast going wrong and who approves. The labs price in US dollars; the launch case counts units.",
    format: "Self-study kit",
    duration: "~90 minutes",
    accessNote:
      "Everything runs in the browser.",
    outcome: "Go/no-go rule",
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
          "With the field card you write the rule for a forecast of your own in five sentences.",
      },
    ],
    agendaSource: "plan",
    minutesSelfStudy: 90,
    needs: [
      "A browser, ideally on a desktop for the labs",
      "For the optional exercise, a spreadsheet such as Excel",
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
        title: "Calculate two forecasts yourself",
        description:
          "Optional, 15 to 45 minutes: you forecast the last 14 of 104 weeks naively and with smoothing and compare mean error and systematic bias.",
        tool: "Exercise · optional",
      },
      {
        n: "06",
        title: "Apply it to a forecast from your work",
        description:
          "With the A4 field card you write the rule for a case of your own in five sentences.",
        tool: "Field card",
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
        label: "Overview",
        href: `${FORECAST_BASE_PATH}/hub.html`,
        kind: "html",
        language: "en",
        role: "hub",
        phase: "before",
        optional: true,
        description:
          "The start page of the materials with links to every part; this page replaces it.",
      },
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
      {
        label: "Field card · 1 page",
        href: `${FORECAST_BASE_PATH}/field-card.html`,
        kind: "html",
        language: "en",
        role: "card",
        phase: "after",
        description:
          "One printable A4 page: newsvendor rule, safety stock and five checks before you trust a forecast.",
        short: "One printable A4 page with the newsvendor rule and safety stock.",
      },
      {
        label: "Take-home",
        href: `${FORECAST_BASE_PATH}/homework.html`,
        kind: "html",
        language: "en",
        role: "exercise",
        phase: "after",
        minutes: 45,
        optional: true,
        description:
          "You calculate two forecasts and write one sentence on the four numbers. The extra task takes it from 15 to 45 minutes.",
      },
      {
        label: "Dataset, 104 weeks · .csv",
        href: `${FORECAST_BASE_PATH}/data/demand-weekly.csv`,
        kind: "csv",
        language: "en",
        role: "data",
        phase: "after",
        optional: true,
        sizeLabel: "1.6 KB",
        description:
          "The weekly demand for the exercise (demand-weekly.csv). Opens in any spreadsheet.",
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
      "You define what a monthly report's metrics mean, then have Claude fill a dashboard by those rules.",
    description:
      "In the Claude app you write down in five prompts what revenue, defects and marketing mean in the monthly report of the invented company NORTHWIND. That becomes a skill for every later monthly report. In the second case you apply the same method to Meta's public quarterly figures.",
    format: "Self-study kit",
    duration: "~90 minutes",
    accessNote:
      "Use only the invented kit: Claude may transfer files to Anthropic.",
    outcome: "Metrics skill + dashboard",
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
        "The family business has about 850 employees and eight product lines, seven of them shipping. The newest and most expensive is CRAFT: two espresso machines and a grinder priced €199 to €699. CRAFT ranks sixth of seven by units but second by revenue.",
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
        "Company release with unaudited quarterly figures. Free cash flow is a supplemental non-GAAP measure; the source supports the figures, not the investment decision.",
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

export const WORKSHOPS_BY_LOCALE: Readonly<
  Record<Locale, readonly Workshop[]>
> = {
  de: [...WORKSHOPS_DE, DATA_READINESS_WORKSHOP.de, ESG_REPORTING_WORKSHOP.de],
  en: [...WORKSHOPS_EN, DATA_READINESS_WORKSHOP.en, ESG_REPORTING_WORKSHOP.en],
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

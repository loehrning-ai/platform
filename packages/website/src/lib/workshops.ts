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

export interface WorkshopDecisionOption {
  readonly id: string;
  readonly label: string;
}

export interface WorkshopDecisionFeedback {
  readonly title: string;
  readonly body: string;
}

/**
 * Feedback for one specific non-recommended decision. A wrong pick is
 * answered in terms of what the learner actually chose, so a message about
 * one distractor never appears after another was picked.
 */
export interface WorkshopDecisionChoiceFeedback {
  /** The learner picked this decision together with the strongest evidence. */
  readonly evidenceOnly?: WorkshopDecisionFeedback;
  /** The learner picked this decision with weaker evidence. */
  readonly unsupported?: WorkshopDecisionFeedback;
}

/**
 * One bounded first decision rendered locally on the workshop detail page.
 * The component receives this copy-only configuration and never persists or
 * transmits a learner's selection.
 */
export interface WorkshopDecisionLabConfig {
  readonly kicker: string;
  readonly title: string;
  readonly prompt: string;
  readonly facts: readonly string[];
  readonly decisionLegend: string;
  readonly evidenceLegend: string;
  readonly choices: readonly WorkshopDecisionOption[];
  readonly evidence: readonly WorkshopDecisionOption[];
  readonly recommendedChoiceId: string;
  readonly strongestEvidenceId: string;
  readonly submitLabel: string;
  readonly resetLabel: string;
  readonly privacyNote: string;
  readonly resultLabel: string;
  readonly feedback: {
    readonly aligned: WorkshopDecisionFeedback;
    readonly decisionOnly: WorkshopDecisionFeedback;
    readonly evidenceOnly: WorkshopDecisionFeedback;
    readonly unsupported: WorkshopDecisionFeedback;
    /** Optional overrides keyed by a non-recommended choice id. */
    readonly byChoice?: Readonly<
      Record<string, WorkshopDecisionChoiceFeedback>
    >;
  };
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
  /** The artefact the learner leaves with, as a short label ("Du gehst mit"). */
  readonly outcome: string;
  readonly audience: readonly string[];
  /** One sentence naming who should pick another workshop, and why. */
  readonly notForYou: string;
  /** The one question held fixed from the first scene to the last, verbatim. */
  readonly question: string;
  /** Three or four sentences, each starting from an observable verb ("Danach kannst du"). */
  readonly outcomes: readonly string[];
  /** The agenda in taught order. Minutes add up to minutesLive (live items) or minutesSelfStudy. */
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
  readonly decisionLab: WorkshopDecisionLabConfig;
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
      "Du rechnest aus, was eine falsche Prognose kostet, wie groß der Puffer sein muss und wann eine Person freigibt. Dazu drei Browser-Labore und ein Launch-Fall.",
    description:
      "Zuerst prüfst du, ob ein Modell das heutige Verfahren schlägt, also denselben Wochentag der Vorwoche. Dann rechnest du aus, was zu viel und was zu wenig Kapazität kostet, und legst den Puffer fest. Zum Schluss bestimmst du, woran du im Betrieb merkst, dass eine Prognose danebenliegt, und wer dann freigibt. Die Labore rechnen die Kosten in US-Dollar, der Launch-Fall rechnet in Stück.",
    format: "Selbstlern-Kit",
    duration: "~90 Minuten",
    accessNote:
      "Kein KI-Zugang nötig, alles läuft statisch im Browser. Für die Übung brauchst du ein Tabellenprogramm.",
    outcome: "Go/No-Go-Regel",
    audience: [
      "Disponentinnen und Planer, die Kapazität oder Bestellmengen nach einer Prognose festlegen",
      "Führungskräfte, die eine Prognose verantworten, ohne sie selbst zu rechnen",
      "Analytics-Teams, die zeigen müssen, dass ein Modell das bestehende Verfahren schlägt",
    ],
    notForYou:
      "Eher nicht für dich, wenn du ein Prognosemodell programmieren willst; hier arbeitest du mit fertigen Simulationen.",
    question:
      "Nach welcher Regel verteilst du 1.050 Stück auf drei Standorte, und wann muss eine Person freigeben?",
    outcomes: [
      "Du rechnest in Dollar aus, ob eine Prognose die Faustregel schlägt, die deine Planung heute benutzt.",
      "Du bestimmst aus den Kosten von zu viel und zu wenig Ware ein Servicelevel und daraus einen Puffer.",
      "Du schreibst eine Freigaberegel, die festlegt, wann die Prognose automatisch läuft und wann eine benannte Person entscheidet.",
      "Du nennst vier Arten von Ereignissen, die kein Modell vorhersagt.",
    ],
    agenda: [
      {
        label: "Die erste Entscheidung",
        minutes: 5,
        mode: "self",
        activity: "vote",
        description:
          "Du verteilst 1.050 Stück auf drei Standorte und wählst den stärksten Beleg dafür.",
      },
      {
        label: "Kapazität festlegen",
        minutes: 15,
        mode: "self",
        activity: "do",
        description:
          "Im ersten Labor vergleichst du drei Ausbaustufen eines Modells mit dem Wert der Vorwoche, in Dollar.",
      },
      {
        label: "Puffer in der Lieferkette",
        minutes: 15,
        mode: "self",
        activity: "do",
        description:
          "Im zweiten Labor schickst du dieselbe Nachfrage zweimal durch die Lieferkette und vergleichst die Schwankung.",
      },
      {
        label: "Freigabe nach einem Nachfrageschock",
        minutes: 15,
        mode: "self",
        activity: "do",
        description:
          "Im dritten Labor löst du Schocks aus und siehst, wann eine benannte Person übernimmt.",
      },
      {
        label: "Der Launch-Fall",
        minutes: 30,
        mode: "self",
        activity: "do",
        description:
          "In elf Stationen verteilst du 1.050 Stück und legst vier tägliche Prüfungen vor der Freigabe fest.",
      },
      {
        label: "Dein Fall",
        minutes: 10,
        mode: "self",
        activity: "write",
        description:
          "Mit der Prüfkarte schreibst du in fünf Sätzen auf, wie die Regel für eine Prognose aus deiner Arbeit aussieht.",
      },
    ],
    agendaSource: "plan",
    minutesSelfStudy: 90,
    needs: [
      "Ein Browser, für die Labore am besten auf einem Desktop-Bildschirm",
      "Für die optionale Übung ein Tabellenprogramm wie Excel, LibreOffice Calc oder Google Tabellen",
    ],
    notNeeded: [
      "Programmierkenntnisse",
      "Ein KI-Konto",
      "Eigene Firmendaten, denn alle Zahlen sind erfunden und mitgeliefert",
    ],
    notCovered: [
      "Modellbau und Programmierung",
      "Die Auswahl von Prognose-Software",
      "Die Herleitung der Formeln; du wendest sie an",
      "Die Planung für dein eigenes Sortiment",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-09-26",
      data: "synthetic",
      note: "Alle Firmen und Zahlen in Laboren, Fall und Übung sind für die Lehre erfunden. Der Workshop zeigt keine KI-Antworten.",
    },
    decisionLab: {
      kicker: "Entscheidung 01 · Liefergrenze",
      title: "1.050 Stück. Wer bekommt sie?",
      prompt:
        "Drei Standorte melden 1.370 Stück an. Das Modell schätzt 1.180 Stück Nachfrage, lieferbar sind 1.050. Welche Regel darf jetzt laufen?",
      facts: ["Anmeldungen 1.370", "Nachfrage p50 1.180", "Liefergrenze 1.050"],
      decisionLegend: "Deine erste Entscheidung",
      evidenceLegend: "Der stärkste Beleg",
      choices: [
        {
          id: "controlled-allocation",
          label:
            "Proportional nach geschätzter Nachfrage zuteilen; Ausnahmen gibt eine Person frei.",
        },
        {
          id: "raw-requests",
          label:
            "Nach den 1.370 Standortanmeldungen verteilen und automatisch ausführen.",
        },
        {
          id: "equal-split",
          label:
            "Jeden Standort gleich bedienen, unabhängig von Größe und Nachfrage.",
        },
      ],
      evidence: [
        {
          id: "constraint-and-error",
          label:
            "Die Liefergrenze liegt 130 Stück unter der geschätzten Nachfrage; das Modell weicht trotz Verbesserung noch 12 % ab.",
        },
        {
          id: "accuracy-only",
          label: "12 % Modellabweichung schlagen die Baseline mit 21 %.",
        },
        {
          id: "request-gap",
          label: "320 angeforderte Einheiten bleiben unbedient.",
        },
      ],
      recommendedChoiceId: "controlled-allocation",
      strongestEvidenceId: "constraint-and-error",
      submitLabel: "Entscheidung prüfen",
      resetLabel: "Neu entscheiden",
      privacyNote:
        "Läuft nur auf dieser Seite. Auswahl und Ergebnis werden weder gespeichert noch gesendet.",
      resultLabel: "Auswertung der Entscheidung",
      feedback: {
        aligned: {
          title: "Freigabe mit Tor",
          body: "Bei dieser Knappheit, 1.050 Stück für 1.180 geschätzte Nachfrage, brauchst du eine Zuteilungsregel, die jede Person nachrechnen kann. Bei 12 % Restfehler gibt eine benannte Person jede Ausnahme frei.",
        },
        decisionOnly: {
          title: "Richtige Richtung, zu schwacher Beleg",
          body: "Dass das Modell besser ist als die Baseline, reicht für eine Automatik nicht. Deine Regel stützt sich auf zwei Zahlen: 130 Stück fehlen, und das Modell liegt noch 12 % daneben.",
        },
        evidenceOnly: {
          title: "Der Beleg widerspricht der Freigabe",
          body: "Du hast gesehen, dass 130 Stück fehlen und das Modell 12 % danebenliegt. Wer nach Anmeldungen oder zu gleichen Teilen verteilt, nutzt diese beiden Zahlen nicht.",
        },
        unsupported: {
          title: "Noch nicht freigabefähig",
          body: "Die Standorte melden 1.370 Stück an, die geschätzte Nachfrage liegt bei 1.180, lieferbar sind 1.050. Verteile nach der Nachfrage und lass bei 12 % Restfehler eine benannte Person jede Ausnahme freigeben.",
        },
      },
    },
    steps: [
      {
        n: "01",
        title: "Das heutige Verfahren in Dollar schlagen",
        description:
          "Im ersten Labor laufen sechs Wochen Paketnachfrage im Schattenbetrieb gegen den Wert, den die Planung heute nutzt: denselben Wochentag der Vorwoche. Fehlende Kapazität kostet mehr als überschüssige, deshalb rechnest du beides in Dollar. Du schaltest zwischen drei Ausbaustufen des Modells. Einen Aktionstag, den niemand eingetragen hat, sieht keine Stufe; diesen Fall bekommt eine Person.",
        tool: "Labor 1",
      },
      {
        n: "02",
        title: "Gestapelte Puffer mit einer gemeinsamen Prognose vergleichen",
        description:
          "Im zweiten Labor läuft dieselbe Nachfrage zweimal durch die Lieferkette. Einmal schlägt jede Stufe ihren eigenen Puffer auf, einmal planen alle mit derselben Prognose. Du vergleichst, wie stark die Bestellungen schwanken, wie oft geliefert werden kann und wie viel Geld im Lager liegt.",
        tool: "Labor 2",
      },
      {
        n: "03",
        title: "Die Freigabe nach einem Nachfrageschock prüfen",
        description:
          "Im dritten Labor löst du Nachfrageschocks aus und vergleichst zwei Betriebsarten. Die blinde fährt den Plan vom Starttag unverändert weiter. Die überwachte erkennt die Abweichung, stoppt die Automatik, gibt den Fall an eine benannte Person und startet erst nach dem Nachtrainieren wieder.",
        tool: "Labor 3",
      },
      {
        n: "04",
        title: "Den Launch-Fall mit 1.050 Stück durchrechnen",
        description:
          "Der Fall hat elf Stationen. Du verteilst erst von Hand in einer Tabelle, rechnest die ungleichen Fehlerkosten und wählst ein Modell (12 % statt 21 % Abweichung). Danach suchst du Datenfehler in einer Abfrage, testest rückwirkend über mehrere Startpunkte und legst vier tägliche Prüfungen vor der Freigabe fest.",
        tool: "Launch-Fall",
      },
      {
        n: "05",
        title: "Zwei Prognosen selbst rechnen",
        description:
          "Die Übung liefert 104 Wochen Nachfrage als CSV-Datei. Du hältst die letzten 14 Wochen zurück, prognostizierst sie einmal naiv und einmal geglättet und berechnest für beide den mittleren Fehler und die systematische Abweichung. Aus den vier Zahlen schreibst du einen Satz dazu, ob die geglättete Prognose genauer war. Die Übung ist optional und dauert 15 bis 45 Minuten.",
        tool: "Übung · optional",
      },
      {
        n: "06",
        title: "Auf eine Prognose aus deiner Arbeit übertragen",
        description:
          "Die Prüfkarte passt auf eine A4-Seite: fünf Säulen einer Prognose, die Servicelevel-Formel aus den Kosten von zu viel und zu wenig Ware, eine Faustregel für den Sicherheitsbestand und vier Arten von Ereignissen, die kein Modell vorhersagt. Mit ihr schreibst du in fünf Sätzen auf, wie die Regel für einen Fall aus deiner Arbeit aussieht.",
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
        "Bei diesem Launch ist die Nachfrage größer als die zugesagte Menge. Drei Standorte melden 1.370 Stück an, das Modell schätzt 1.180, zugesagt sind 1.050. Drei Abteilungen lesen daraus drei verschiedene Zahlen. Alle Firmen und Zahlen im Fall und in den Laboren sind erfunden.",
      metrics: [
        { label: "Anmeldung der Standorte", value: "1.370" },
        { label: "Geschätzte Nachfrage (Median)", value: "1.180" },
        { label: "Liefergrenze", value: "1.050" },
        { label: "Abweichung Modell / Baseline", value: "12 % / 21 %" },
      ],
      decisionQuestion:
        "Nach welcher Regel verteilst du 1.050 Stück auf drei unterschiedlich große Standorte, wenn 320 angemeldete Stück fehlen? Und ab welchem Prognosefehler muss eine Person diese Verteilung freigeben?",
      dataLimitations: [
        "Verkäufe zeigen nur, was verkauft wurde. Was im Regal fehlte, taucht in keiner Verkaufsstatistik auf und muss rekonstruiert werden.",
        "Ins Modell dürfen nur Merkmale, die zum Prognosezeitpunkt bekannt waren. Sonst gelangt Wissen aus der Zukunft in den Rücktest.",
        "Ein einzelner Genauigkeitswert verbirgt die systematische Abweichung. Ein Modell kann im Mittel gut aussehen und trotzdem dauerhaft zu hoch liegen.",
        "Wettbewerber und Wetter bleiben auf diesem Horizont Risiken; das Modell führt sie bewusst nicht als Merkmale.",
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
          "Die Startseite der englischen Materialien mit Links zu Laboren, Launch-Fall und Übung. Diese Workshop-Seite erfüllt denselben Zweck.",
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
          "Drei Simulationen auf einer Seite. Du legst Kapazität fest, dämpfst die Schwankung durch gestapelte Puffer und gibst einen plötzlichen Nachfrageanstieg kontrolliert frei.",
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
          "Der Launch-Fall in elf Stationen. Du verteilst 1.050 Stück auf drei Standorte und legst fest, was täglich vor einer Freigabe geprüft wird.",
      },
      {
        label: "Prüfkarte · 1 Seite",
        href: `${FORECAST_BASE_PATH}/field-card.html`,
        kind: "html",
        language: "en",
        role: "card",
        phase: "after",
        description:
          "Eine A4-Seite zum Ausdrucken mit fünf Säulen einer Prognose, der Servicelevel-Formel, dem Sicherheitsbestand und vier Arten von Ereignissen, die kein Modell vorhersagt.",
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
          "Die Anleitung zur Übung mit dem Datensatz. Du rechnest zwei Prognosen, vergleichst vier Zahlen und schreibst einen Satz dazu, in 15 Minuten oder mit Zusatzaufgabe in 45.",
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
          "Die wöchentliche Nachfrage für die Übung (demand-weekly.csv). Erfundene Übungsdaten, die sich in jedem Tabellenprogramm öffnen.",
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
      "Du schreibst auf, was die Kennzahlen eines Monatsberichts bedeuten, lässt Claude damit ein Dashboard füllen und begründest eine Entscheidung mit einer Zahl.",
    description:
      "In der Claude-App arbeitest du für die erfundene Firma NORTHWIND. Du bekommst ihren Monatsbericht und die Rohdaten dahinter und schreibst in fünf Prompts auf, was Umsatz, Mängel und Marketing dort bedeuten. Aus deinen Regeln wird ein Skill, den Claude auch für den nächsten Monatsbericht nutzt. Im zweiten Fall wendest du dieselbe Methode auf Metas öffentliche Quartalszahlen an.",
    format: "Selbstlern-Kit",
    duration: "~90 Minuten",
    accessNote:
      "Du brauchst die Claude-Desktop-App mit Claude Code in einem Plan, der Claude Code enthält. Nimm nur das erfundene Kit, denn Dateien können an den Dienst gehen.",
    outcome: "Kennzahlen-Skill + Dashboard",
    audience: [
      "Controllerinnen und Controller, die Monats- oder Quartalsberichte schreiben oder lesen",
      "Finance-Teams im Mittelstand, die jeden Monatsbericht nach denselben Regeln lesen wollen",
      "Alle, die Claude für Zahlenarbeit ausprobieren wollen, ohne selbst zu programmieren",
    ],
    notForYou:
      "Eher nicht für dich, wenn du keinen Zugang zur Claude-Desktop-App hast; Workshop 01 und 03 laufen ohne KI-Konto.",
    question:
      "Soll NORTHWIND die Produktlinie CRAFT nacharbeiten oder mehr Q3-Marketingbudget dahinterstellen?",
    outcomes: [
      "Du schreibst für fünf Kennzahlen eines Monatsberichts auf, was sie in dieser Firma bedeuten, und speicherst das als Claude-Skill.",
      "Du lässt Claude den Bericht nach diesen Regeln auslesen und prüfst eine Zahl gegen Datei und Spalte der Quelle.",
      "Du begründest eine Entscheidung mit der tragenden Zahl, den Kosten eines Irrtums und dem, was die Daten offenlassen.",
      "Du wendest denselben Skill auf den nächsten Monatsbericht an.",
    ],
    agenda: [
      {
        label: "Kit einrichten",
        minutes: 5,
        mode: "self",
        activity: "do",
        description:
          "Du entpackst das Kit und öffnest den Ordner in der Claude-App unter Claude Code.",
      },
      {
        label: "Claude liest die Firma",
        minutes: 10,
        mode: "self",
        activity: "do",
        description:
          "Mit dem ersten Prompt liest Claude Steckbrief und Monatsbericht und nennt die Entscheidung des Monats.",
      },
      {
        label: "Den Kennzahlen-Skill schreiben",
        minutes: 20,
        mode: "self",
        activity: "write",
        description:
          "Du beantwortest Claudes Fragen zu Umsatz, Mängeln und Marketing; Claude schreibt die Antworten in den Skill.",
      },
      {
        label: "Auslesen und an der Quelle prüfen",
        minutes: 15,
        mode: "self",
        activity: "do",
        description:
          "Claude liest den Monat nach deinen Regeln aus, und du prüfst eine Zahl gegen die Rohdaten-CSV.",
      },
      {
        label: "Das Dashboard füllen",
        minutes: 10,
        mode: "self",
        activity: "do",
        description:
          "Claude trägt die Kennzahlen in die leere Dashboard-Vorlage ein und öffnet die Seite.",
      },
      {
        label: "Entscheiden",
        minutes: 15,
        mode: "self",
        activity: "write",
        description:
          "Du entscheidest über CRAFT und schreibst die tragende Zahl, die Kosten eines Irrtums und das stärkste Gegenargument dazu.",
      },
      {
        label: "Fall 2: Metas Quartal",
        minutes: 15,
        mode: "self",
        activity: "do",
        optional: true,
        description:
          "Du wendest dieselbe Methode auf Metas öffentliche Quartalsmitteilung Q2 2026 an.",
      },
    ],
    agendaSource: "plan",
    minutesSelfStudy: 90,
    needs: [
      "Die Claude-Desktop-App mit Claude Code, in einem Plan, der Claude Code enthält",
      "Windows oder macOS",
      "Ein Zip-Archiv entpacken können; START-HERE.md im Kit führt durch die Einrichtung",
    ],
    notNeeded: [
      "Programmierkenntnisse",
      "Einen API-Schlüssel",
      "Eigene Firmendaten, denn das Kit bringt alle Dateien mit",
    ],
    notCovered: [
      "API, Datenbank oder Automatisierung",
      "Ein Grundkurs Bilanzanalyse",
      "Echte Firmendaten in Claude; im Workshop nutzt du nur das erfundene Kit",
      "Ein Vergleich von KI-Anbietern",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-09-26",
      data: "synthetic-and-public",
      note: "NORTHWIND und alle Zahlen des Übungsfalls sind erfunden. Fall 2 nutzt nur Metas öffentliche Quartalsmitteilung; der Autor arbeitet als Data Engineer bei Meta.",
    },
    decisionLab: {
      kicker: "Entscheidung 01 · CRAFT",
      title: "Mehr Nachfrage oder erst das Produkt reparieren?",
      prompt:
        "CRAFT erzielt 4,12 Mio. € Umsatz bei geringem Volumen, hat aber den zweiten Monat in Folge die meisten Qualitätsmängel. Der Vertrieb fordert mehr Q3-Marketingbudget. Was tust du zuerst?",
      facts: [
        "Umsatz 4,12 Mio. €",
        "Einheiten 9.162",
        "Meiste Mängel · Monat 2",
      ],
      decisionLegend: "Deine erste Entscheidung",
      evidenceLegend: "Der stärkste Beleg",
      choices: [
        {
          id: "quality-gate",
          label:
            "Budgeterhöhung stoppen; Qualitätsursache prüfen und Nacharbeit bewerten.",
        },
        {
          id: "increase-marketing",
          label: "Q3-Marketing sofort erhöhen, weil der Umsatz stark ist.",
        },
        {
          id: "discontinue-line",
          label: "CRAFT sofort einstellen und das Budget umverteilen.",
        },
      ],
      evidence: [
        {
          id: "repeated-defects",
          label:
            "CRAFT hat die meisten Qualitätsmängel im Sortiment, den zweiten Monat in Folge.",
        },
        {
          id: "revenue-rank",
          label: "CRAFT erzielt den zweithöchsten Umsatz der Produktlinien.",
        },
        {
          id: "low-volume",
          label: "CRAFT liegt beim Absatz nur auf Rang 6 von 7 Linien.",
        },
      ],
      recommendedChoiceId: "quality-gate",
      strongestEvidenceId: "repeated-defects",
      submitLabel: "Entscheidung prüfen",
      resetLabel: "Neu entscheiden",
      privacyNote:
        "Läuft nur auf dieser Seite. Auswahl und Ergebnis werden weder gespeichert noch gesendet.",
      resultLabel: "Auswertung der Entscheidung",
      feedback: {
        aligned: {
          title: "Qualität vor zusätzlicher Nachfrage",
          body: "Die Mängel im zweiten Monat in Folge rechtfertigen, das Budget anzuhalten. Für mehr Budget oder das Ende der Linie bräuchtest du Stückkosten, Retouren je Linie und eine Zuordnung des Marketings, und das Kit hat nichts davon.",
        },
        decisionOnly: {
          title: "Richtige Reihenfolge, falscher Hauptbeleg",
          body: "Umsatz und Volumen beschreiben die Linie. Den Prüfauftrag begründen die Qualitätsmängel im zweiten Monat in Folge.",
        },
        evidenceOnly: {
          title: "Der Beleg widerspricht der Entscheidung",
          body: "Wiederholte Mängel sprechen gegen mehr Nachfrage. Für ein sofortiges Aus reichen sie nicht. Prüf zuerst Ursache und Nacharbeit.",
        },
        unsupported: {
          title: "Die Entscheidung springt über die Belege",
          body: "Umsatz (Rang 2) und Absatz (Rang 6 von 7) sagen nichts über die Qualität. Fang mit den Mängeln an: CRAFT führt die Mängelliste den zweiten Monat an.",
        },
      },
    },
    steps: [
      {
        n: "01",
        title: "Claude liest die Firma",
        description:
          "Du öffnest den Kit-Ordner in der Claude-App. Er enthält den Monatsbericht (8 Seiten), fünf CSV-Dateien mit Rohdaten, die auch in Excel aufgehen, und einen Steckbrief der Firma. Claude liest Steckbrief und Bericht und sagt, wer NORTHWIND ist und welche Entscheidung der Monat vorbereitet. Die Dateien können dabei an den Dienst übertragen werden; prüf vor echten Daten die Produkt-, Vertrags- und Aufbewahrungseinstellungen.",
        tool: "Dateien",
      },
      {
        n: "02",
        title: "Den Kennzahlen-Skill schreiben",
        description:
          "Im Kit liegt ein halb fertiger Kennzahlen-Skill. Claude fragt dich nacheinander, was Umsatz, Mängel und Marketing bei NORTHWIND bedeuten, und schreibt deine Antworten in die Skill-Datei. Claude soll ab jetzt zuerst deine Regeln lesen; prüf in jeder Antwort, ob er sie nennt.",
        tool: "Skill",
      },
      {
        n: "03",
        title: "Auslesen und an der Quelle prüfen",
        description:
          "Der Skill liest den Bericht mit deinen Regeln und schreibt die Monatskennzahlen in eine Tabelle. Eine davon prüfst du gegen die Rohdaten-CSV, mit Datei und Spalte. Stell dieselbe Frage einmal ohne Skill und vergleiche die beiden Antworten.",
        tool: "Claude Code",
      },
      {
        n: "04",
        title: "Das Dashboard füllen",
        description:
          "Das Kit enthält eine leere Dashboard-Vorlage. Mit einem Prompt trägt Claude die Kennzahlen ein und öffnet die Seite. Sie zeigt Umsatz je Linie mit CRAFT markiert, Mängel, Marketing, offene Eskalationen und die anstehende Entscheidung. Den 8-Seiten-Bericht behält der Analyst, das Meeting bekommt diese eine Seite.",
        tool: "Dashboard",
      },
      {
        n: "05",
        title: "Gegen den Vertriebsleiter argumentieren",
        description:
          "Zum Schluss entscheidest du, ob CRAFT nachgearbeitet wird oder mehr Q3-Marketingbudget bekommt. Du nennst die Zahl, die das stützt, was ein Irrtum kosten würde, was die Daten offenlassen, und das stärkste Argument des Vertriebsleiters.",
        tool: "Entscheidung",
      },
      {
        n: "06",
        title: "Fall 2 mit Metas Quartal",
        description:
          "Jetzt nimmst du ein echtes Unternehmen. Claude lädt Metas Quartalsmitteilung Q2 2026 direkt aus dem Netz; im Kit liegt sie nicht. Du definierst sechs Kennzahlen, liest das Quartal aus (+28 % Umsatz, −8 % operatives Ergebnis) und lässt Claude ein Dashboard ohne Vorlage entwerfen. Dann beurteilst du, ob sich 31 Mrd. $ Investitionen in einem Quartal rechnen können.",
        tool: "SEC-Mitteilung · live",
      },
      {
        n: "07",
        title: "Mit deinen eigenen Berichten wiederholen",
        description:
          "Deine Regeln stehen in der Skill-Datei, also wendest du sie im nächsten Monat auf den neuen Bericht an. Das Kit enthält beide Fälle, das Arbeitsblatt und eine leere Vorlage für die Berichte deiner eigenen Firma.",
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
        "NORTHWIND ist eine erfundene Firma für diesen Workshop, ein familiengeführter Elektronikhersteller aus Berlin mit rund 850 Beschäftigten und acht Produktlinien, Monatsabschluss September 2023. CRAFT ist die Kaffee-Linie mit zwei Espressomaschinen und einer Mühle zwischen 199 € und 699 €, die neueste und teuerste Linie im Sortiment. Sie macht bei einem der geringsten Absätze (Rang 6 von 7 Linien) den zweithöchsten Umsatz und hat den zweiten Monat in Folge die meisten Qualitätsmängel. Der Vertriebsleiter will mehr Q3-Marketingbudget für CRAFT.",
      metrics: [
        { label: "Umsatz gesamt", value: "21,69 Mio. €" },
        { label: "Einheiten gesamt", value: "139.056" },
        { label: "CRAFT-Umsatz", value: "4,12 Mio. €" },
        { label: "CRAFT-Einheiten", value: "9.162" },
      ],
      decisionQuestion:
        "Soll NORTHWIND die Produktlinie CRAFT technisch nacharbeiten, oder, wie der Vertriebsleiter fordert, mehr Q3-Marketingbudget hinter CRAFT stellen?",
      dataLimitations: [
        "Keine echte Bruttomarge je Linie: Es liegen keine Stückkosten pro Produkt vor.",
        "Keine Kundenretouren je Linie: Bestellungen sind nicht mit Produktlinien verknüpft.",
        "Kein exaktes Marketingbudget je Produktlinie: Kampagnenbudgets sind nicht sauber zurechenbar.",
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
        "Meta meldet für Q2 2026 28 % mehr Umsatz und 8 % weniger operatives Ergebnis. Fast der gesamte operative Cashflow floss in Infrastruktur, der freie Cashflow lag bei 784 Mio. $. Du definierst sechs Kennzahlen für das Quartal, liest die Zahlen aus und lässt Claude das Dashboard ohne Vorlage entwerfen.",
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
          "Die Folien führen durch Firma, Kit-Ordner, die fünf Prompts mit ihren Ergebnissen, drei Zusatz-Prompts und Fall 2 mit Meta. Jeder Prompt hat einen Knopf zum Kopieren. Mit den Pfeiltasten blätterst du.",
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
          "Das NORTHWIND-Kit mit START-HERE.md, CSV-Rohdaten, beiden Monatsberichten als Markdown, dem halb fertigen Kennzahlen-Skill, der Dashboard-Vorlage, dem Arbeitsblatt, der Meta-Aufgabe und einer leeren Vorlage für die eigene Firma. Nur Textdateien; den gestalteten Bericht zeigen die Folien.",
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
      "You work out what a wrong forecast costs, how big the buffer has to be and when a person approves. With three browser labs and one launch case.",
    description:
      "First you check whether a model beats the current method, the same weekday one week earlier. Then you work out what too much and too little capacity cost and set the buffer. Finally you decide how you will notice a forecast going wrong in operation, and who approves then. The labs price costs in US dollars; the launch case counts units.",
    format: "Self-study kit",
    duration: "~90 minutes",
    accessNote:
      "No AI account needed, everything runs statically in the browser. For the exercise you need a spreadsheet program.",
    outcome: "Go/no-go rule",
    audience: [
      "Planners and schedulers who set capacity or order quantities from a forecast",
      "Managers who own a forecast without calculating it themselves",
      "Analytics teams that have to show a model beats the existing process",
    ],
    notForYou:
      "Probably not for you if you want to program a forecasting model; here you work with ready-made simulations.",
    question:
      "Which rule allocates 1,050 units among three sites, and when must a person approve?",
    outcomes: [
      "Work out in dollars whether a forecast beats the rule of thumb your planners use today.",
      "Set a service level from the cost of too much and too little stock, and a buffer from that.",
      "Write a release rule that says when the forecast runs automatically and when a named person decides.",
      "Name four kinds of events that no model predicts.",
    ],
    agenda: [
      {
        label: "The first decision",
        minutes: 5,
        mode: "self",
        activity: "vote",
        description:
          "You allocate 1,050 units among three sites and pick the strongest evidence for it.",
      },
      {
        label: "Set capacity",
        minutes: 15,
        mode: "self",
        activity: "do",
        description:
          "In the first lab you compare three model stages with last week's value, in dollars.",
      },
      {
        label: "Buffers in the supply chain",
        minutes: 15,
        mode: "self",
        activity: "do",
        description:
          "In the second lab you send the same demand through the supply chain twice and compare the swings.",
      },
      {
        label: "Release after a demand shock",
        minutes: 15,
        mode: "self",
        activity: "do",
        description:
          "In the third lab you trigger shocks and see when a named person takes over.",
      },
      {
        label: "The launch case",
        minutes: 30,
        mode: "self",
        activity: "do",
        description:
          "Over eleven stations you allocate 1,050 units and set four daily checks before release.",
      },
      {
        label: "Your case",
        minutes: 10,
        mode: "self",
        activity: "write",
        description:
          "With the field card you write five sentences on how the rule looks for a forecast from your own work.",
      },
    ],
    agendaSource: "plan",
    minutesSelfStudy: 90,
    needs: [
      "A browser, ideally on a desktop screen for the labs",
      "For the optional exercise, a spreadsheet program such as Excel, LibreOffice Calc or Google Sheets",
    ],
    notNeeded: [
      "Programming skills",
      "An AI account",
      "Your own company data, because every figure is invented and supplied",
    ],
    notCovered: [
      "Building or programming a model",
      "Choosing forecasting software",
      "Deriving the formulas; you apply them",
      "Planning for your own product range",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-09-26",
      data: "synthetic",
      note: "Every company and figure in the labs, the case and the exercise is invented for teaching. The workshop shows no AI answers.",
    },
    decisionLab: {
      kicker: "Decision 01 · Supply limit",
      title: "1,050 units. Who gets them?",
      prompt:
        "Three sites request 1,370 units. The model estimates demand at 1,180; only 1,050 can be supplied. Which rule may run now?",
      facts: ["Requests 1,370", "Demand p50 1,180", "Supply limit 1,050"],
      decisionLegend: "Your first decision",
      evidenceLegend: "The strongest evidence",
      choices: [
        {
          id: "controlled-allocation",
          label:
            "Allocate proportionally to estimated demand; send exceptions to a person.",
        },
        {
          id: "raw-requests",
          label:
            "Allocate against the 1,370 site requests and run automatically.",
        },
        {
          id: "equal-split",
          label:
            "Give every site the same amount regardless of size and demand.",
        },
      ],
      evidence: [
        {
          id: "constraint-and-error",
          label:
            "Supply is 130 units below estimated demand, and the improved model still deviates by 12%.",
        },
        {
          id: "accuracy-only",
          label: "The model's 12% deviation beats the 21% baseline.",
        },
        {
          id: "request-gap",
          label: "320 requested units go unserved.",
        },
      ],
      recommendedChoiceId: "controlled-allocation",
      strongestEvidenceId: "constraint-and-error",
      submitLabel: "Check decision",
      resetLabel: "Decide again",
      privacyNote:
        "Runs only on this page. Your selection and result are neither stored nor sent.",
      resultLabel: "Decision feedback",
      feedback: {
        aligned: {
          title: "Release with a gate",
          body: "With 1,050 units for an estimated demand of 1,180, you need an allocation rule anyone can recompute. At a 12% residual error, a named person approves every exception.",
        },
        decisionOnly: {
          title: "Right direction, weak evidence",
          body: "A model that beats the baseline is not enough to automate. Your rule rests on two numbers: 130 units are missing, and the model is still 12% off.",
        },
        evidenceOnly: {
          title: "The evidence contradicts the release",
          body: "You saw that 130 units are missing and the model is 12% off. Allocating by requests or in equal shares does not use either number.",
        },
        unsupported: {
          title: "Not ready for release",
          body: "The sites request 1,370 units, estimated demand is 1,180, and 1,050 can be supplied. Allocate by demand and have a named person approve every exception at a 12% residual error.",
        },
      },
    },
    steps: [
      {
        n: "01",
        title: "Beat the current process in dollars",
        description:
          "In the first lab, six weeks of parcel demand run as a shadow test against the number planning uses today: the same weekday one week earlier. Missing capacity costs more than spare capacity, so you price both in dollars. You switch between three model stages. A promotion nobody entered is invisible to every stage; that case goes to a person.",
        tool: "Lab 1",
      },
      {
        n: "02",
        title: "Compare stacked buffers with a shared forecast",
        description:
          "In the second lab the same demand runs through the supply chain twice. Once every stage adds its own buffer, once everyone plans with the same forecast. You compare how much the orders swing, how often the chain can deliver and how much money sits in stock.",
        tool: "Lab 2",
      },
      {
        n: "03",
        title: "Test the release after a demand shock",
        description:
          "In the third lab you trigger demand shocks and compare two operating modes. The blind one keeps running the plan from launch day. The monitored one detects the deviation, stops the automation, hands the case to a named person and restarts only after retraining.",
        tool: "Lab 3",
      },
      {
        n: "04",
        title: "Work through the launch case with 1,050 units",
        description:
          "The case has eleven stations. You first allocate by hand in a spreadsheet, price the unequal error costs and pick a model (12% rather than 21% deviation). Then you look for data errors in one query, backtest from several start dates and set four daily checks before release.",
        tool: "Launch case",
      },
      {
        n: "05",
        title: "Calculate two forecasts yourself",
        description:
          "The exercise provides 104 weeks of demand as a CSV file. You hold back the final 14 weeks, forecast them once with a naive method and once with smoothing, and calculate mean error and systematic bias for both. From the four numbers you write one sentence on whether smoothing was more accurate. The exercise is optional and takes 15 to 45 minutes.",
        tool: "Exercise · optional",
      },
      {
        n: "06",
        title: "Apply it to a forecast from your work",
        description:
          "The field card fits on one A4 page: five pillars of a forecast, the service-level formula from the costs of too much and too little stock, a rule of thumb for safety stock, and four kinds of events no model predicts. With it you write five sentences on how the rule looks for a case from your own work.",
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
        "At this launch, demand is higher than the confirmed quantity. Three sites request 1,370 units, the model estimates 1,180, and 1,050 are confirmed. Three departments read three different numbers from this. Every company and figure in the case and the labs is invented.",
      metrics: [
        { label: "Site requests", value: "1,370" },
        { label: "Estimated demand (median)", value: "1,180" },
        { label: "Supply limit", value: "1,050" },
        { label: "Model / baseline deviation", value: "12% / 21%" },
      ],
      decisionQuestion:
        "Which rule allocates 1,050 units among three sites of different sizes when 320 requested units are missing? And at what forecast error must a person approve that allocation?",
      dataLimitations: [
        "Sales show only what was sold. Stockouts never appear in sales figures and have to be reconstructed.",
        "Only features known at forecast time may enter the model. Otherwise knowledge from the future leaks into the backtest.",
        "One accuracy measure hides systematic bias. A model can look acceptable on average and still run high every week.",
        "Competitors and weather remain risks at this horizon; the model deliberately leaves them out as features.",
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
          "The start page of the materials, with links to the labs, the launch case and the exercise. This workshop page does the same job.",
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
          "Three simulations on one page. You set capacity, damp the swings caused by stacked buffers and release a sudden rise in demand through a controlled process.",
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
          "The launch case in eleven stations. You allocate 1,050 units among three sites and decide what is checked every day before a release.",
      },
      {
        label: "Field card · 1 page",
        href: `${FORECAST_BASE_PATH}/field-card.html`,
        kind: "html",
        language: "en",
        role: "card",
        phase: "after",
        description:
          "One printable A4 page with five pillars of a forecast, the service-level formula, safety stock and four kinds of events no model predicts.",
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
          "Instructions for the exercise with the dataset. You calculate two forecasts, compare four numbers and write one sentence, in 15 minutes or in 45 with the extra task.",
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
          "The weekly demand for the exercise (demand-weekly.csv). Invented practice data that opens in any spreadsheet.",
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
      "You write down what the metrics in a monthly report mean, have Claude fill a dashboard with them and back a decision with one figure.",
    description:
      "In the Claude app you work for the invented company NORTHWIND. You get its monthly report and the raw data behind it, and in five prompts you write down what revenue, defects and marketing mean there. Your rules become a skill that Claude also uses for the next monthly report. In the second case you apply the same method to Meta's public quarterly figures.",
    format: "Self-study kit",
    duration: "~90 minutes",
    accessNote:
      "Claude steps require suitable Claude access: the Claude desktop app with Claude Code, on a plan that includes it. Use only the fictional kit, because files may reach that service.",
    outcome: "Metrics skill + dashboard",
    audience: [
      "Controllers who write or read monthly and quarterly reports",
      "Finance teams in mid-sized companies that want to read every monthly report by the same rules",
      "Anyone who wants to try Claude for work with figures without writing code",
    ],
    notForYou:
      "Probably not for you if you have no access to the Claude desktop app; Workshops 01 and 03 need no AI account.",
    question:
      "Should NORTHWIND rework the CRAFT product line or put more Q3 marketing budget behind it?",
    outcomes: [
      "Write down what five metrics in a monthly report mean in this company, and save that as a Claude skill.",
      "Have Claude read the report by those rules and check one figure against the source file and column.",
      "Argue a decision with the figure it rests on, the cost of being wrong and what the data leave open.",
      "Apply the same skill to the next monthly report.",
    ],
    agenda: [
      {
        label: "Set up the kit",
        minutes: 5,
        mode: "self",
        activity: "do",
        description:
          "You unzip the kit and open the folder in the Claude app under Claude Code.",
      },
      {
        label: "Claude reads the company",
        minutes: 10,
        mode: "self",
        activity: "do",
        description:
          "With the first prompt Claude reads the profile and the monthly report and names the month's decision.",
      },
      {
        label: "Write the metrics skill",
        minutes: 20,
        mode: "self",
        activity: "write",
        description:
          "You answer Claude's questions on revenue, defects and marketing; Claude writes the answers into the skill.",
      },
      {
        label: "Extract and check the source",
        minutes: 15,
        mode: "self",
        activity: "do",
        description:
          "Claude extracts the month by your rules, and you check one figure against the raw CSV.",
      },
      {
        label: "Fill the dashboard",
        minutes: 10,
        mode: "self",
        activity: "do",
        description:
          "Claude writes the metrics into the empty dashboard template and opens the page.",
      },
      {
        label: "Decide",
        minutes: 15,
        mode: "self",
        activity: "write",
        description:
          "You decide on CRAFT and write down the figure it rests on, the cost of being wrong and the strongest counter-argument.",
      },
      {
        label: "Case 2: Meta's quarter",
        minutes: 15,
        mode: "self",
        activity: "do",
        optional: true,
        description:
          "You apply the same method to Meta's public Q2 2026 quarterly release.",
      },
    ],
    agendaSource: "plan",
    minutesSelfStudy: 90,
    needs: [
      "The Claude desktop app with Claude Code, on a plan that includes Claude Code",
      "Windows or macOS",
      "Being able to unzip an archive; START-HERE.md in the kit walks you through setup",
    ],
    notNeeded: [
      "Programming skills",
      "An API key",
      "Your own company data, because the kit supplies every file",
    ],
    notCovered: [
      "APIs, databases or automation",
      "An introduction to financial statement analysis",
      "Real company data in Claude; in the workshop you use only the invented kit",
      "A comparison of AI providers",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-09-26",
      data: "synthetic-and-public",
      note: "NORTHWIND and every figure in the practice case are invented. Case 2 uses only Meta's public quarterly release; the author works as a data engineer at Meta.",
    },
    decisionLab: {
      kicker: "Decision 01 · CRAFT",
      title: "Create more demand or repair the product first?",
      prompt:
        "CRAFT generates €4.12m of revenue at low volume, but records the most quality defects for a second month. Sales wants more Q3 marketing budget. What happens first?",
      facts: ["Revenue €4.12m", "Units 9,162", "Most defects · month 2"],
      decisionLegend: "Your first decision",
      evidenceLegend: "The strongest evidence",
      choices: [
        {
          id: "quality-gate",
          label:
            "Hold the budget increase; investigate the quality cause and assess rework.",
        },
        {
          id: "increase-marketing",
          label: "Increase Q3 marketing immediately because revenue is strong.",
        },
        {
          id: "discontinue-line",
          label: "Discontinue CRAFT immediately and reallocate its budget.",
        },
      ],
      evidence: [
        {
          id: "repeated-defects",
          label:
            "CRAFT has the most quality defects in the range for the second month in succession.",
        },
        {
          id: "revenue-rank",
          label: "CRAFT generates the second-highest product-line revenue.",
        },
        {
          id: "low-volume",
          label:
            "CRAFT ranks only sixth of seven product lines by unit volume.",
        },
      ],
      recommendedChoiceId: "quality-gate",
      strongestEvidenceId: "repeated-defects",
      submitLabel: "Check decision",
      resetLabel: "Decide again",
      privacyNote:
        "Runs only on this page. Your selection and result are neither stored nor sent.",
      resultLabel: "Decision feedback",
      feedback: {
        aligned: {
          title: "Quality before more demand",
          body: "The repeated defects justify holding the budget. To decide on more budget or closing the line you would need unit costs, returns per line and marketing attribution, and the kit has none of them.",
        },
        decisionOnly: {
          title: "Right sequence, wrong primary evidence",
          body: "Revenue and volume describe the line. The defects in a second month in a row justify the investigation.",
        },
        evidenceOnly: {
          title: "The evidence contradicts the decision",
          body: "Repeated defects argue against creating more demand, and they do not yet prove the line should close. Investigate cause and rework first.",
        },
        unsupported: {
          title: "The decision outruns the evidence",
          body: "Revenue (rank 2) and volume (rank 6 of 7) say nothing about quality. Start with the defects: CRAFT tops the defect list for the second month.",
        },
      },
    },
    steps: [
      {
        n: "01",
        title: "Claude reads the company",
        description:
          "You open the kit folder in the Claude app. It holds the monthly report (eight pages), five raw CSV files that also open in Excel, and a company profile. Claude reads the profile and the report and says who NORTHWIND is and which decision the month prepares. The files may be transferred to the service; check current product, contract and retention settings before you use real data.",
        tool: "Files",
      },
      {
        n: "02",
        title: "Write the metrics skill",
        description:
          "The kit holds a half-finished metrics skill. Claude asks you in turn what revenue, defects and marketing mean at NORTHWIND and writes your answers into the skill file. From now on Claude should read your rules first; check in each answer whether it names them.",
        tool: "Skill",
      },
      {
        n: "03",
        title: "Extract the figures and check the source",
        description:
          "The skill reads the report with your rules and writes the month's metrics into a table. You check one of them against the raw CSV, by file and column. Ask the same question once without the skill and compare the two answers.",
        tool: "Claude Code",
      },
      {
        n: "04",
        title: "Fill the dashboard",
        description:
          "The kit contains an empty dashboard template. With one prompt Claude writes the metrics into it and opens the page. It shows revenue by product line with CRAFT marked, defects, marketing, open escalations and the pending decision. The analyst keeps the eight-page report; the meeting gets this one page.",
        tool: "Dashboard",
      },
      {
        n: "05",
        title: "Argue against the sales director",
        description:
          "Finally you decide whether CRAFT is reworked or gets more Q3 marketing budget. You name the figure that supports it, what being wrong would cost, what the data leave open, and the sales director's strongest argument.",
        tool: "Decision",
      },
      {
        n: "06",
        title: "Case 2 with Meta's quarter",
        description:
          "Now you take a real company. Claude fetches Meta's Q2 2026 quarterly release directly from the web; the kit does not contain it. You define six metrics, extract the quarter (+28% revenue, −8% operating income) and have Claude design a dashboard without a template. Then you judge whether $31 billion of capital expenditure in one quarter can pay off.",
        tool: "SEC filing · live",
      },
      {
        n: "07",
        title: "Repeat it on your own reports",
        description:
          "Your rules live in the skill file, so next month you apply them to the new report. The kit includes both cases, the worksheet and an empty template for your own company's reports.",
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
        "NORTHWIND is a company invented for this workshop, a family-owned electronics manufacturer in Berlin with about 850 employees and eight product lines, closing September 2023. CRAFT is its coffee line with two espresso machines and a grinder priced from €199 to €699, the newest and most expensive line in the range. At one of the lowest unit volumes (sixth of seven lines) it makes the second-highest revenue, and for the second month in a row it has the most quality defects. The sales director wants more Q3 marketing budget for CRAFT.",
      metrics: [
        { label: "Total revenue", value: "€21.69m" },
        { label: "Total units", value: "139,056" },
        { label: "CRAFT revenue", value: "€4.12m" },
        { label: "CRAFT units", value: "9,162" },
      ],
      decisionQuestion:
        "Should NORTHWIND rework the CRAFT product line, or follow the sales director's proposal and increase CRAFT's Q3 marketing budget?",
      dataLimitations: [
        "There is no actual gross margin by product line because unit costs by product are unavailable.",
        "Customer returns cannot be assigned to product lines because orders are not linked to them.",
        "Marketing spend cannot be assigned precisely to individual product lines because campaign budgets are not allocated cleanly.",
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
        "Meta reports 28% more revenue and 8% less operating income for Q2 2026. Almost all operating cash flow went into infrastructure, and free cash flow was $784m. You define six metrics for the quarter, extract the figures and have Claude design the dashboard without a template.",
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
          "The slides walk through the company, the kit folder, the five prompts and their results, three extra prompts and case 2 on Meta. Every prompt has a copy button. Use the arrow keys to move on.",
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
          "The NORTHWIND kit with START-HERE.md, raw CSV data, both monthly reports as Markdown, the half-finished metrics skill, the dashboard template, the worksheet, the Meta exercise and an empty template for your own company. Text files only; the slides show the designed report.",
      },
    ],
  },
];

export const WORKSHOPS_BY_LOCALE: Readonly<
  Record<Locale, readonly Workshop[]>
> = {
  de: [...WORKSHOPS_DE, DATA_READINESS_WORKSHOP.de],
  en: [...WORKSHOPS_EN, DATA_READINESS_WORKSHOP.en],
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

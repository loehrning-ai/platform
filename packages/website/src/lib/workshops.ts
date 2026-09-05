/**
 * Workshops catalog — single in-repo source of truth.
 *
 * Selbstlern-Workshops mit Download-Material. Welche Dateien ein Workshop
 * mitbringt, entscheidet allein sein materials-Array: der Prognose-Workshop
 * liefert fünf, der Analyst-Workshop zwei. Zähle sie nie anderswo auf, sonst
 * veraltet die Liste. Die statischen Dateien liegen unter
 * public/workshops/<slug>/ und werden vom Next.js-Server ab Site-Root
 * ausgeliefert (siehe public/book-covers/ für dasselbe Muster).
 *
 * Add a new workshop by appending an entry below; never duplicate this array
 * in a page component.
 */

import type { Locale } from "./i18n/locale";

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
  /**
   * True for invented teaching data (the norm here). False when a workshop works on a real
   * organisation's published figures — the detail page states which, so a reader is never left
   * guessing whether the numbers are real.
   */
  readonly isFictional: boolean;
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
  /** Language of the linked file itself, independent from the page locale. */
  readonly language: Locale;
  readonly description: string;
}

/**
 * A second, real-world case some workshops end on: the same method applied to a real
 * organisation's public reporting. Optional — most workshops have only the practice case.
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
  };
}

export interface Workshop {
  readonly slug: string;
  readonly title: string;
  readonly eyebrow: string;
  /** One or two sentences for the listing card. Keep under ~220 characters. */
  readonly summary: string;
  /** The longer intro shown on the detail page hero. */
  readonly description: string;
  readonly format: string;
  readonly duration: string;
  /** Concise tool, transfer, or provider boundary shown before materials. */
  readonly accessNote: string;
  readonly audience: readonly string[];
  readonly decisionLab: WorkshopDecisionLabConfig;
  readonly steps: readonly WorkshopStep[];
  readonly caseStudy: WorkshopCaseStudy;
  readonly realWorldCase?: WorkshopRealWorldCase;
  readonly materials: readonly WorkshopMaterial[];
}

const WORKSHOP_BASE_PATH = "/workshops/geschaeftsberichte-mit-ki-lesen";

const WORKSHOPS_DE: readonly Workshop[] = [
  {
    slug: "ki-prognosen-einschaetzen",
    title: "Kann KI die Zukunft vorhersagen?",
    eyebrow: "Selbstlern-Workshop · Prognosen & Entscheidungen",
    summary:
      "Wann darfst du einer Prognose trauen? Du bezifferst die Kosten des Irrtums, bemisst den Puffer und prüfst den Go-live: in drei Entscheidungslaboren und an einem Launch, bei dem die Menge nicht reicht.",
    description:
      "Eine Prognose verdient ihren Aufwand erst, wenn sie eine Entscheidung verändert; deshalb steht die Modellfrage hier ganz hinten. Davor kommt die Frage, ob das Modell das Verfahren schlägt, das heute schon läuft, dann die Kosten: Zu viel kostet anders als zu wenig, und ein Puffer muss beides ausgleichen. Und im Betrieb musst du merken, wann eine Prognose kippt. Drei interaktive Entscheidungslabore und ein durchgerechneter Geschäftsfall führen zu einer Go/No-Go-Entscheidung, die du auch verteidigen kannst. Ohne Programmierung, ohne Installation, ohne KI-Zugang: alles läuft als statische Seite im Browser.",
    format: "Selbstlern-Kit",
    duration: "~90 Minuten",
    accessNote:
      "Kein KI-Zugang nötig. Alles läuft statisch im Browser; Übungsdaten bleiben lokal.",
    audience: [
      "Disponenten, Planer und Operations-Teams, die mit Absatz- oder Kapazitätsprognosen arbeiten",
      "Führungskräfte, die eine Prognose verantworten, ohne sie selbst zu rechnen",
      "Data- und Analytics-Teams, die ein Modell gegen den bestehenden Prozess verteidigen müssen",
    ],
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
            "Proportional nach geschätzter Nachfrage zuteilen; Ausnahmen menschlich freigeben.",
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
        "Läuft nur in dieser Seite. Auswahl und Ergebnis werden weder gespeichert noch gesendet.",
      resultLabel: "Auswertung der Entscheidung",
      feedback: {
        aligned: {
          title: "Freigabe mit Tor",
          body: "Knappheit verlangt eine nachvollziehbare Zuteilungsregel. Und der Restfehler von 12 % verlangt einen Menschen mit Namen, der Ausnahmen freigibt.",
        },
        decisionOnly: {
          title: "Richtige Richtung, zu schwacher Beleg",
          body: "Bessere Modellgüte allein rechtfertigt keine Automatik. Erst Liefergrenze und Restfehler zusammen tragen die Regel.",
        },
        evidenceOnly: {
          title: "Der Beleg widerspricht der Freigabe",
          body: "Knappheit und Restfehler hast du erkannt. Eine rohe oder gleiche Verteilung macht daraus aber keine belastbare Regel.",
        },
        unsupported: {
          title: "Noch nicht freigabefähig",
          body: "Anmeldungen allein sind keine Nachfrage, ein Genauigkeitswert allein ist keine Regel. Verknüpfe Liefergrenze, Nachfrage und Restfehler.",
        },
      },
    },
    steps: [
      {
        n: "01",
        title: "Das bestehende Verfahren in Euro schlagen",
        description:
          "Erster Akt im Entscheidungslabor: Sechs Wochen Paketnachfrage laufen als Schattenlauf gegen den Vergleichswert, den ein Planer heute nutzt (derselbe Wochentag der Vorwoche). Zu wenig Kapazität kostet mehr als zu viel, und genau diese Schieflage entscheidet. Du schaltest zwischen drei Ausbaustufen und liest ab, welche ihren Aufwand verdient. Ein nicht eingetragener Aktionstag bleibt für jede Stufe unsichtbar, und geht an einen Menschen.",
        tool: "Labor · Akt 1",
      },
      {
        n: "02",
        title: "Gestapelte Puffer gegen ein geteiltes Signal",
        description:
          "Zweiter Akt: Dieselbe Nachfrage läuft zweimal durch die Lieferkette, einmal mit lokalen Sicherheitsaufschlägen auf jeder Stufe, einmal mit einer Prognose, die alle Beteiligten teilen. Darunter stehen Aufschaukelungsgrad, Lieferfähigkeit und gebundenes Kapital. Sie trennen, was echter Prognosefehler ist und was reine Verstärkung durch aufeinandergestapelte Puffer.",
        tool: "Labor · Akt 2",
      },
      {
        n: "03",
        title: "Den Freigabe-Loop unter Druck setzen",
        description:
          "Dritter Akt: Du löst Nachfrageschocks aus und vergleichst zwei Betriebsarten. Die blinde fährt den Plan vom Starttag unverändert weiter. Die überwachte erkennt die Abweichung, schließt das Tor, gibt den Fall an eine benannte Person und lässt die Automatik erst nach dem Nachtrainieren wieder laufen. Der Wert steckt im geregelten Ablauf, nicht in der schöneren Kurve.",
        tool: "Labor · Akt 3",
      },
      {
        n: "04",
        title: "Der Geschäftsfall: eine knappe Menge, drei Zahlen",
        description:
          "Elf Stationen zu einem Produktlaunch: Aus 1.370 angemeldeten Stück werden 1.180 ehrliche Nachfrage, während die Lieferzusage hart bei 1.050 liegt. Der Fall führt von der manuellen Tabellenrunde über die Kostenasymmetrie und die Modellwahl (12 % statt 21 % Abweichung) zu den Datenfallen einer einzigen Abfrage, dem rollierenden Rücktest und einem täglichen Tor aus vier Prüfungen.",
        tool: "Geschäftsfall",
      },
      {
        n: "05",
        title: "Selbst rechnen: zwei Prognosen, vier Zahlen",
        description:
          "Das Übungsblatt liefert 104 Wochen Nachfrage als CSV-Datei. Du hältst die letzten 14 Wochen zurück, prognostizierst sie einmal naiv und einmal geglättet und bewertest beides mit mittlerem Fehler und systematischer Abweichung. Vier Zahlen und ein Satz beantworten die eigentliche Frage: Hat die Glättung ihren Aufwand verdient? Ein Tabellenblatt genügt, Code ist nicht nötig.",
        tool: "Übung",
      },
      {
        n: "06",
        title: "Auf die eigene Domäne übertragen",
        description:
          "Die einseitige Field Card fasst zusammen, was bleibt: die fünf Säulen, die Formel für das Servicelevel aus den Kosten beider Fehlerrichtungen, die Faustregel für den Sicherheitsbestand und die vier Klassen von Ereignissen, die grundsätzlich nicht prognostizierbar sind. Zum Schluss überträgst du die Logik in fünf Sätzen auf einen eigenen Fall.",
        tool: "Field Card",
      },
    ],
    caseStudy: {
      companyName: "Produktlaunch mit knapper Menge",
      isFictional: true,
      location: "Konstruiertes Übungsszenario",
      sector: "Consumer Electronics · Supply and Demand Management",
      period: "Startwoche eines neuen Geräts",
      narrative:
        "Der Geschäftsfall stellt eine Lage nach, die in jeder Launchplanung vorkommt: Die Nachfrage liegt über der Menge, die tatsächlich zugesagt ist. Drei Standorte melden zusammen 1.370 Stück an, ein Modell rechnet daraus 1.180 ehrliche Nachfrage, und die Lieferzusage liegt hart bei 1.050. Drei Abteilungen schauen auf dieselbe Woche und ziehen drei verschiedene Zahlen daraus. Die im Übungslabor genannten Unternehmen dienen als Blickwinkel auf typische Abläufe: sämtliche Zahlen sind für die Lehre konstruiert und stammen aus keinem echten Geschäftsbericht.",
      metrics: [
        { label: "Anmeldung der Standorte", value: "1.370" },
        { label: "Ehrliche Nachfrage (p50)", value: "1.180" },
        { label: "Harte Liefergrenze", value: "1.050" },
        { label: "Abweichung Modell vs. Baseline", value: "12 % / 21 %" },
      ],
      decisionQuestion:
        "Nach welcher Regel werden 1.050 Einheiten auf drei unterschiedlich große Standorte verteilt, wenn 320 Stück der Anmeldung unbedient bleiben, und ab welchem Prognosefehler darf diese Aufteilung überhaupt ohne menschliche Freigabe laufen?",
      dataLimitations: [
        "Verkäufe sind nicht Nachfrage: Was im Regal fehlte, taucht in keiner Verkaufsstatistik auf und muss rekonstruiert werden.",
        "Nur Merkmale, die zum Prognosezeitpunkt bekannt waren, dürfen ins Modell: sonst leckt Zukunftswissen in den Rücktest.",
        "Ein einzelner Genauigkeitswert verbirgt die systematische Abweichung: Ein Modell kann im Mittel gut aussehen und trotzdem dauerhaft zu hoch liegen.",
        "Wettbewerbszüge und Wetter bleiben auf diesem Horizont Risiken und werden bewusst nicht als Merkmale geführt.",
      ],
    },
    materials: [
      {
        label: "Workshop-Hub (Englisch)",
        href: "/workshops/ki-prognosen-einschaetzen/hub.html",
        kind: "html",
        language: "en",
        description:
          "Die Startseite. Von hier aus öffnest du die drei Labore, den Geschäftsfall und die Blätter zum Mitnehmen, in der vorgesehenen Reihenfolge.",
      },
      {
        label: "Entscheidungslabor (Englisch, 3 Akte)",
        href: "/workshops/ki-prognosen-einschaetzen/hands-on.html",
        kind: "html",
        language: "en",
        description:
          "Drei interaktive Akte auf einer Seite: Kapazität festlegen, Aufschaukelung stoppen, schnelle Nachfrage kontrolliert freigeben, jeweils mit Simulation zum Mitspielen.",
      },
      {
        label: "Geschäftsfall (Englisch)",
        href: "/workshops/ki-prognosen-einschaetzen/case-study/index.html",
        kind: "html",
        language: "en",
        description:
          "Ein Launch, drei Zahlen, eine knappe Menge: Zuteilungsentscheidung, Systemkarte, Kostenasymmetrie und das tägliche Freigabe-Tor.",
      },
      {
        label: "Field Card (Englisch, 1 Seite)",
        href: "/workshops/ki-prognosen-einschaetzen/field-card.html",
        kind: "html",
        language: "en",
        description:
          "Die druckbare Prüfliste für jede Prognose: fünf Säulen, Servicelevel-Formel, Sicherheitsbestand und die vier nicht prognostizierbaren Ereignisklassen.",
      },
      {
        label: "Übungsaufgabe (Englisch)",
        href: "/workshops/ki-prognosen-einschaetzen/homework.html",
        kind: "html",
        language: "en",
        description:
          "104 Wochen Nachfrage als CSV plus Anleitung: zwei Prognosen rechnen, vier Zahlen vergleichen, eine Frage beantworten. Tabellenblatt genügt.",
      },
    ],
  },
  {
    slug: "geschaeftsberichte-mit-ki-lesen",
    title: "Geschäftsberichte mit KI lesen",
    eyebrow: "Selbstlern-Workshop · Business Reports",
    summary:
      "Lies einen Monatsbericht wie ein Analyst: Kennzahlen in Klartext definieren, als Skill festhalten, ein Dashboard befüllen, eine Entscheidung begründen. Danach dieselbe Methode an einem echten Quartalsbericht.",
    description:
      "Fünf Prompts, ein Analyst. In der Claude-App arbeitest du für ein synthetisches Unternehmen, bekommst dessen Monatsbericht samt der Rohdaten, aus denen er geschrieben wurde, und hältst in Klartext fest, was die Zahlen hier bedeuten. Aus diesen Regeln wird ein wiederverwendbarer Skill: Er liest den Bericht aus, füllt ein Dashboard und stützt eine begründete Entscheidung. In Fall 2 verlässt du die Sandbox und wendest dieselbe Methode auf die öffentlichen Quartalszahlen eines echten Unternehmens an. Ohne Programmierung und ohne API-Key; für die Schritte in Claude brauchst du einen passenden Claude-Zugang.",
    format: "Selbstlern-Kit",
    duration: "~90 Minuten",
    accessNote:
      "Claude-Zugang nötig. Nimm nur das fiktive Kit, Dateien können an den Dienst gehen.",
    audience: [
      "Controllerinnen und Controller, die Monats- oder Quartalsberichte schreiben oder lesen",
      "Controlling- und Finance-Teams im Mittelstand",
      "Alle, die Claude als Analysewerkzeug ausprobieren wollen, ohne selbst zu programmieren",
    ],
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
        "Läuft nur in dieser Seite. Auswahl und Ergebnis werden weder gespeichert noch gesendet.",
      resultLabel: "Auswertung der Entscheidung",
      feedback: {
        aligned: {
          title: "Qualität vor zusätzlicher Nachfrage",
          body: "Wiederholte Mängel sind ein belastbarer Stopp-Grund. Mehr Budget oder das Ende der Linie belegen die Daten nicht: Stückkosten, Retourenzuordnung und Marketingattribution fehlen.",
        },
        decisionOnly: {
          title: "Richtige Reihenfolge, falscher Hauptbeleg",
          body: "Umsatz und Volumen beschreiben die Linie. Den Prüfauftrag begründet der wiederholte Qualitätsbefund.",
        },
        evidenceOnly: {
          title: "Der Beleg widerspricht der Entscheidung",
          body: "Wiederholte Mängel sprechen gegen mehr Nachfrage. Für ein sofortiges Aus reichen sie nicht. Erst Ursache und Nacharbeit prüfen.",
        },
        unsupported: {
          title: "Die Entscheidung springt über die Evidenz",
          body: "Ein starker Umsatz ist kein Qualitätsbeleg; geringes Volumen ist kein Einstellungsgrund. Beginne mit dem wiederholten Mängelsignal.",
        },
      },
    },
    steps: [
      {
        n: "01",
        title: "Verankern: Claude lernt das Unternehmen",
        description:
          "Du wählst den Kit-Ordner in der Claude-App aus: den Monatsbericht (8 Seiten), fünf CSV-Rohdaten-Dateien (auch in Excel nutzbar) und einen Unternehmenssteckbrief. Claude liest Steckbrief und Bericht und benennt, wer das Unternehmen ist und welche Entscheidung der Monat vorbereitet. Die Übungsdateien können dabei an den konfigurierten Dienst übertragen werden; verwende ausschließlich das bereitgestellte fiktive Material und prüfe vor realen Daten die aktuellen Produkt-, Vertrags- und Aufbewahrungseinstellungen.",
        tool: "Dateien",
      },
      {
        n: "02",
        title: "Beibringen: den Kennzahlen-Skill selbst schreiben",
        description:
          "Das Herzstück: Der Kennzahlen-Skill liegt halb fertig im Kit. Claude fragt dich die Lücken einzeln ab (was bedeuten Umsatz, Mängel, Marketing HIER?) und schreibt deine Antworten in Klartext in die Skill-Datei. Ab jetzt liest Claude in diesem Ordner immer zuerst deine Regeln. Keine Zeile Code.",
        tool: "Skill",
      },
      {
        n: "03",
        title: "Anwenden: extrahieren und an der Quelle prüfen",
        description:
          "Dein Skill liest den Bericht mit deinen Regeln, extrahiert den Monat in strukturierte Kennzahlen und prüft eine Zahl gegen die Rohdaten-CSV: jede Zahl bleibt auf Datei und Spalte rückführbar. Vorher einmal ohne Skill fragen lohnt sich: Die generische Antwort fällt bei jedem anders aus; mit Skill greifen dieselben Regeln jedes Mal.",
        tool: "Claude Code",
      },
      {
        n: "04",
        title: "Sehen: das Dashboard füllt sich",
        description:
          "Das Dashboard liegt als bewusst leere Vorlage im Kit. Ein Prompt, und Claude schreibt die extrahierten Kennzahlen hinein und öffnet die Seite: Umsatz je Linie mit markierter Problemlinie, Qualitätsmängel, Marketing, offene Eskalationen und die anstehende Entscheidung: der 8-Seiten-Bericht für den Analysten, die eine Seite für den Raum.",
        tool: "Dashboard",
      },
      {
        n: "05",
        title: "Entscheiden: gegen den Vertriebsleiter argumentieren",
        description:
          "Am Ende steht keine Zusammenfassung, sondern eine Entscheidung: Premium-Linie nacharbeiten oder ihr Q3-Marketingbudget erhöhen? Mit der Zahl, die sie stützt, den Kosten eines Irrtums, einer ehrlichen Aussage darüber, was die Daten nicht beantworten können, und der Gegenposition, so überzeugend wie möglich argumentiert.",
        tool: "Entscheidung",
      },
      {
        n: "06",
        title: "Fall 2, ein echtes Unternehmen: Metas Quartal",
        description:
          "Dieselbe Methode verlässt die Sandbox: Claude ruft Metas öffentlich bei der SEC eingereichte Quartalsmitteilung (Q2 2026) live ab, im Kit wird nichts davon weiterverteilt. Du definierst sechs Kennzahlen in Klartext, extrahierst das Quartal (+28 % Umsatz, −8 % operatives Ergebnis) und lässt Claude diesmal ein Dashboard ohne Vorlage selbst entwerfen. Die Frage auf dem Tisch: 31 Mrd. $ Capex in einem Quartal, Investment oder Leck?",
        tool: "SEC-Filing · live",
      },
      {
        n: "07",
        title: "Wiederholen: dein Unternehmen, dein Analyst",
        description:
          "Weil die Lesart aufgeschrieben ist, wiederholt sie sich: Nächster Monat, neuer Bericht, derselbe Skill. Das Kit enthält beide Fälle, das Arbeitsblatt und eine leere Vorlage, mit der du den Analysten für die Berichte deines eigenen Unternehmens nachbaust.",
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
        "NORTHWIND ist ein frei erfundenes Übungsunternehmen für diesen Workshop: ein familiengeführter Elektronikhersteller aus Berlin mit rund 850 Beschäftigten und acht Produktlinien, Monatsabschluss September 2023. Die Zahlen des Monats passen nicht auf den ersten Blick zusammen. CRAFT ist die Kaffee-Linie des Hauses: zwei Espressomaschinen und eine Mühle zwischen 199 € und 699 €, die neueste und teuerste Linie im Sortiment. Sie erzielt bei den höchsten Stückpreisen den zweithöchsten Umsatz auf einem der geringsten Absatzvolumen (Rang 6 von 7 Linien), trägt aber auch die meisten Qualitätsmängel im Sortiment, den zweiten Monat in Folge. Die offene Frage: Linie nacharbeiten oder mehr Q3-Marketingbudget dahinterstellen?",
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
        "Dasselbe Muster wie im Übungsfall, nur in echt: eine starke Schlagzeile mit einer Frage darunter. Der Umsatz wächst deutlich, das operative Ergebnis fällt trotzdem, und praktisch der gesamte operative Cashflow des Quartals fließt in Infrastruktur. Du definierst sechs Kennzahlen für ein Quartal, extrahierst die Zahlen und lässt Claude diesmal ein Dashboard ohne Vorlage selbst entwerfen.",
      metrics: [
        { label: "Umsatz", value: "+28 %" },
        { label: "Operatives Ergebnis", value: "−8 %" },
        { label: "Investitionen, ein Quartal", value: "31,1 Mrd. $" },
        { label: "Freier Cashflow", value: "784 Mio. $" },
      ],
      decisionQuestion:
        "31 Mrd. $ Investitionen in einem einzigen Quartal: eine Wette, die sich verzinst, oder ein Leck? Und welche Lesart ist ehrlicher: das gemeldete Minus oder die Zahl ohne Sondereffekte?",
    },
    materials: [
      {
        label: "Workshop-Walkthrough (Englisch, 21 Slides)",
        href: `${WORKSHOP_BASE_PATH}/slides.html`,
        kind: "html",
        language: "en",
        description:
          "Englisches Slide-Deck entlang des roten Fadens: das Unternehmen, das Zip-Verzeichnis, die fünf Prompts mit ihren Artefakten, drei anspruchsvollere Zusatz-Prompts und Fall 2 (Meta). Jeder Prompt steht mit Kopier-Knopf auf der Folie. Mit Pfeiltasten blättern.",
      },
      {
        label: "NORTHWIND Analyst Kit (Englisch, .zip)",
        href: `${WORKSHOP_BASE_PATH}/northwind-analyst-kit.zip`,
        kind: "zip",
        language: "en",
        description:
          "Englisches Kit mit beiden Fällen: CSV-Rohdaten, beide Monatsberichte als Markdown, der halb fertige Kennzahlen-Skill, die Dashboard-Vorlage, das Arbeitsblatt, die Meta-Aufgabe (Fall 2) und eine leere Vorlage für das eigene Unternehmen. Reines Textarchiv: den gestalteten Bericht siehst du im Walkthrough.",
      },
    ],
  },
];

const WORKSHOPS_EN: readonly Workshop[] = [
  {
    slug: "ki-prognosen-einschaetzen",
    title: "Can AI predict the future?",
    eyebrow: "Self-study workshop · Forecasts and decisions",
    summary:
      "Decide when a forecast is useful: price the two error directions, set buffers, and define a release gate. Three decision labs end with a launch whose demand exceeds supply.",
    description:
      "A forecast earns its cost only when it changes a decision. This workshop therefore starts before model selection: does the model beat the process already in use? What does excess capacity cost, what does insufficient capacity cost, and which buffer balances the two? How does a team detect that a live forecast is failing? Three interactive decision labs and one worked business case lead to a defensible go or no-go decision. No programming, installation, or AI account is required; the material runs as static pages in the browser.",
    format: "Self-study kit",
    duration: "About 90 minutes",
    accessNote:
      "No AI account is required. Everything runs statically in the browser; practice data stays local.",
    audience: [
      "Planning, supply-chain, and operations teams that work with demand or capacity forecasts",
      "Specialists and managers who are accountable for forecasts but do not build the models",
      "Data and analytics teams that must compare a model with the existing process",
    ],
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
          label: "Three hundred and twenty requested units cannot be supplied.",
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
          body: "Scarcity requires a traceable allocation rule. The remaining model error also requires a named human release for exceptions.",
        },
        decisionOnly: {
          title: "Right direction, weak evidence",
          body: "Better model accuracy alone does not justify automation. The hard supply limit and residual error matter together.",
        },
        evidenceOnly: {
          title: "The evidence contradicts the release",
          body: "You identified scarcity and residual error. A raw or equal split does not translate that evidence into a defensible rule.",
        },
        unsupported: {
          title: "Not ready for release",
          body: "Neither requests nor one accuracy number determines allocation on its own. Connect supply, demand, and residual error.",
        },
      },
    },
    steps: [
      {
        n: "01",
        title: "Beat the existing process in euros",
        description:
          "In the first decision lab, six weeks of parcel demand run as a shadow test against the planner's current baseline: the same weekday one week earlier. Insufficient capacity costs more than excess capacity, so that asymmetry determines the result. Switch among three model stages and identify which one earns its cost. A promotion that was never entered remains invisible to every stage and is escalated to a person.",
        tool: "Lab · Act 1",
      },
      {
        n: "02",
        title: "Compare stacked buffers with a shared signal",
        description:
          "The second lab sends the same demand through the supply chain twice: once with local safety uplifts at every stage, once with a forecast shared by all participants. The amplification ratio, service level, and working capital show what is forecast error and what is simply the result of stacked buffers.",
        tool: "Lab · Act 2",
      },
      {
        n: "03",
        title: "Test the release loop under pressure",
        description:
          "The third lab introduces demand shocks and compares two operating modes. The blind mode keeps running the plan from launch day. The monitored mode detects the deviation, closes the gate, assigns the case to a named person, and resumes automation only after retraining. The value lies in the controlled process, not in a smoother chart.",
        tool: "Lab · Act 3",
      },
      {
        n: "04",
        title: "Business case: one constrained supply, three numbers",
        description:
          "Eleven stations follow a product launch. Site requests total 1,370 units, the estimate of underlying demand is 1,180, and confirmed supply is fixed at 1,050. The case moves from a manual spreadsheet round through error-cost asymmetry and model choice (12% rather than 21% deviation) to one-query data traps, rolling backtests, and a daily four-check release gate.",
        tool: "Business case",
      },
      {
        n: "05",
        title: "Calculate two forecasts and four measures",
        description:
          "The exercise provides 104 weeks of demand as a CSV file. Hold back the final 14 weeks, forecast them once with a naive method and once with smoothing, then assess both with mean error and systematic bias. Four numbers and one sentence answer the relevant question: did smoothing earn its cost? A spreadsheet is sufficient; no code is required.",
        tool: "Exercise",
      },
      {
        n: "06",
        title: "Transfer the method to your domain",
        description:
          "A one-page field card records the durable parts of the method: five pillars, the service-level formula based on both error costs, a safety-stock rule of thumb, and four classes of events that cannot be forecast reliably. Finish by describing how the logic applies to one of your own cases in five sentences.",
        tool: "Field card",
      },
    ],
    caseStudy: {
      companyName: "Product launch with constrained supply",
      isFictional: true,
      location: "Constructed practice scenario",
      sector: "Consumer electronics · Supply and demand management",
      period: "Launch week for a new device",
      narrative:
        "The case reconstructs a common launch-planning problem: estimated demand is higher than confirmed supply. Three sites request 1,370 units in total, a model estimates underlying demand at 1,180, and confirmed supply is fixed at 1,050. Three departments review the same week and use three different numbers. Companies mentioned in the exercise represent typical operating perspectives. All figures were constructed for teaching and do not come from a real company report.",
      metrics: [
        { label: "Site requests", value: "1,370" },
        { label: "Underlying demand (p50)", value: "1,180" },
        { label: "Confirmed supply", value: "1,050" },
        { label: "Model / baseline deviation", value: "12% / 21%" },
      ],
      decisionQuestion:
        "Which rule should allocate 1,050 units among three sites of different sizes when 320 requested units cannot be supplied, and at what forecast error must that allocation require human approval?",
      dataLimitations: [
        "Sales are not demand. Stockouts never appear as sales and must be reconstructed.",
        "Only features known at forecast time may enter the model; otherwise the backtest leaks future information.",
        "One accuracy measure hides systematic bias. A model can look acceptable on average while remaining consistently high.",
        "Competitor actions and weather remain risks at this horizon and are deliberately not treated as model features.",
      ],
    },
    materials: [
      {
        label: "Workshop hub",
        href: "/workshops/ki-prognosen-einschaetzen/hub.html",
        kind: "html",
        language: "en",
        description:
          "Starting page for the three labs, business case, and take-away sheets in the intended order.",
      },
      {
        label: "Decision lab · three acts",
        href: "/workshops/ki-prognosen-einschaetzen/hands-on.html",
        kind: "html",
        language: "en",
        description:
          "Three interactive acts on one page: set capacity, stop supply-chain amplification, and release fast demand through a controlled process.",
      },
      {
        label: "Business case",
        href: "/workshops/ki-prognosen-einschaetzen/case-study/index.html",
        kind: "html",
        language: "en",
        description:
          "One launch, three numbers, and constrained supply: allocation decision, system map, asymmetric error costs, and the daily release gate.",
      },
      {
        label: "Field card · one page",
        href: "/workshops/ki-prognosen-einschaetzen/field-card.html",
        kind: "html",
        language: "en",
        description:
          "Printable checklist for any forecast: five pillars, the service-level formula, safety stock, and four classes of events that cannot be forecast reliably.",
      },
      {
        label: "Forecast exercise",
        href: "/workshops/ki-prognosen-einschaetzen/homework.html",
        kind: "html",
        language: "en",
        description:
          "A 104-week demand CSV and instructions to calculate two forecasts, compare four measures, and answer one decision question. A spreadsheet is sufficient.",
      },
    ],
  },
  {
    slug: "geschaeftsberichte-mit-ki-lesen",
    title: "Read business reports with AI",
    eyebrow: "Self-study workshop · Business reports",
    summary:
      "Read a monthly report as an analyst: define metrics in plain language, record the rules as a reusable skill, populate a dashboard, and defend a decision. Then apply the method to a real quarterly report.",
    description:
      "Five prompts in the Claude app build a small AI analyst. You work with a synthetic company's monthly report and the raw data from which it was written, then define what its metrics mean in plain language. Those rules become a reusable skill that extracts the report, populates a dashboard, and supports a reasoned decision. In the second case, apply the same method to a real company's public quarterly figures. No programming or API key is required. The Claude steps require access to a suitable Claude product.",
    format: "Self-study kit",
    duration: "About 90 minutes",
    accessNote:
      "Claude steps require suitable Claude access. Use only the fictional kit; files may reach that service.",
    audience: [
      "People who read or prepare monthly and quarterly business reports",
      "Controlling and finance teams in small and medium-sized companies",
      "People evaluating Claude as an analysis tool without writing code",
    ],
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
          body: "Repeated defects are a defensible stop signal. Without unit costs, assigned returns, or marketing attribution, neither more budget nor discontinuing the line is supported.",
        },
        decisionOnly: {
          title: "Right sequence, wrong primary evidence",
          body: "Revenue and volume describe the line, but the repeated quality result justifies the immediate investigation.",
        },
        evidenceOnly: {
          title: "The evidence contradicts the decision",
          body: "Repeated defects argue against creating more demand and do not yet prove the line should close. Investigate cause and rework first.",
        },
        unsupported: {
          title: "The decision outruns the evidence",
          body: "Strong revenue is not quality evidence; low volume is not a closure case. Start with the repeated defect signal.",
        },
      },
    },
    steps: [
      {
        n: "01",
        title: "Establish the company context",
        description:
          "Select the kit folder in the Claude app. It contains an eight-page monthly report, five raw CSV files that also work in Excel, and a company profile. Claude reads the profile and report, identifies the company, and states the decision for which the month is being reviewed. The exercise files may be transferred to the configured service; use only the supplied fictional material and check current product, contract, and retention settings before using real data.",
        tool: "Files",
      },
      {
        n: "02",
        title: "Write the metric rules",
        description:
          "The metric skill in the kit is deliberately incomplete. Claude asks for each missing definition in turn: what revenue, defects, and marketing mean in this company. It records the answers in plain language in the skill file. Claude then reads those rules first whenever it works in the folder. No code is required.",
        tool: "Skill",
      },
      {
        n: "03",
        title: "Extract the figures and check the source",
        description:
          "The skill reads the report using your definitions, extracts the month into structured metrics, and checks one figure against the source CSV. Every number remains traceable to a file and column. Running the question once without the skill provides a useful comparison: the generic answer varies, while the recorded rules remain consistent.",
        tool: "Claude Code",
      },
      {
        n: "04",
        title: "Populate the dashboard",
        description:
          "The kit contains an intentionally empty dashboard template. One prompt writes the extracted metrics into it and opens the page: revenue by product line, the problem line, quality defects, marketing, unresolved escalations, and the pending decision. The analyst retains the eight-page report; the meeting gets one page.",
        tool: "Dashboard",
      },
      {
        n: "05",
        title: "Argue the decision against the sales position",
        description:
          "The output is a decision rather than a summary: should NORTHWIND rework the premium product line or increase its Q3 marketing budget? State the supporting figure, the cost of being wrong, what the data cannot answer, and the strongest version of the opposing position.",
        tool: "Decision",
      },
      {
        n: "06",
        title: "Case 2: a real company quarter",
        description:
          "Apply the same method outside the synthetic case. Claude retrieves Meta's Q2 2026 quarterly release filed with the SEC; the kit does not redistribute it. Define six quarterly metrics, extract the figures (+28% revenue and −8% operating income), and have Claude design a dashboard without a supplied template. The decision question is whether $31 billion of quarterly capital expenditure is productive investment or a leak.",
        tool: "SEC filing · live",
      },
      {
        n: "07",
        title: "Repeat the method on your own reports",
        description:
          "Because the interpretation rules are written down, the process can be repeated for the next month and the next report. The kit includes both cases, the worksheet, and an empty template for rebuilding the analyst around reports from your own organisation.",
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
        "NORTHWIND is a fictional company created for this workshop: a family-owned electronics manufacturer in Berlin with about 850 employees and eight product lines, closing September 2023. The month's figures do not align at first glance. CRAFT is its coffee line: two espresso machines and a grinder priced from €199 to €699, and the newest, most expensive line in the range. It produces the second-highest revenue despite one of the lowest unit volumes (sixth of seven lines), but it also records the most quality defects for the second month in succession. The decision is whether to rework the line or increase its Q3 marketing budget.",
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
        "Use the same pattern with real disclosures: a strong headline with an unresolved question underneath. Revenue rises materially, operating income falls, and almost all quarterly operating cash flow is spent on infrastructure. Define six quarterly metrics, extract the figures, and ask Claude to design the dashboard without a template.",
      metrics: [
        { label: "Revenue", value: "+28%" },
        { label: "Operating income", value: "−8%" },
        { label: "Capital expenditure, one quarter", value: "$31.1bn" },
        { label: "Free cash flow", value: "$784m" },
      ],
      decisionQuestion:
        "$31 billion of capital expenditure in one quarter: an investment expected to earn a return, or a leak? Which reading is more informative: the reported decline or the result excluding special effects?",
    },
    materials: [
      {
        label: "Workshop walkthrough · 21 slides",
        href: `${WORKSHOP_BASE_PATH}/slides.html`,
        kind: "html",
        language: "en",
        description:
          "English slide deck covering the company, the kit directory, five prompts and their outputs, three advanced follow-up prompts, and case 2 on Meta. Every prompt has a copy control. Navigate with the arrow keys.",
      },
      {
        label: "NORTHWIND analyst kit · .zip",
        href: `${WORKSHOP_BASE_PATH}/northwind-analyst-kit.zip`,
        kind: "zip",
        language: "en",
        description:
          "English kit containing both cases: raw CSV data, both monthly reports as Markdown, the incomplete metric skill, dashboard template, worksheet, Meta exercise, and an empty template for another company. It is a text-only archive; the rendered report appears in the walkthrough.",
      },
    ],
  },
];

export const WORKSHOPS_BY_LOCALE: Readonly<
  Record<Locale, readonly Workshop[]>
> = {
  de: WORKSHOPS_DE,
  en: WORKSHOPS_EN,
};

/** German remains the canonical catalog for machine endpoints and legacy imports. */
export const WORKSHOPS: readonly Workshop[] = WORKSHOPS_DE;

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

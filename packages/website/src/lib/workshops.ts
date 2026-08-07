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
  readonly description: string;
}

/**
 * A second, real-world case some workshops end on: the same method applied to a real
 * organisation's public reporting. Optional — most workshops have only the practice case.
 */
export interface WorkshopRealWorldCase {
  readonly companyName: string;
  readonly source: string;
  readonly narrative: string;
  readonly metrics: readonly WorkshopCaseMetric[];
  readonly decisionQuestion: string;
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
  readonly audience: readonly string[];
  readonly steps: readonly WorkshopStep[];
  readonly caseStudy: WorkshopCaseStudy;
  readonly realWorldCase?: WorkshopRealWorldCase;
  readonly materials: readonly WorkshopMaterial[];
}

const WORKSHOP_BASE_PATH = "/workshops/geschaeftsberichte-mit-ki-lesen";

export const WORKSHOPS: readonly Workshop[] = [
  {
    slug: "ki-prognosen-einschaetzen",
    title: "Kann KI die Zukunft vorhersagen?",
    eyebrow: "Selbstlern-Workshop · Prognosen & Entscheidungen",
    summary:
      "Wann darf man einer Prognose trauen? Kosten des Irrtums beziffern, Puffer bemessen, Go-live prüfen: an drei Entscheidungslaboren und einem Launch, bei dem die Menge nicht reicht.",
    description:
      "Eine Prognose verdient ihren Aufwand erst, wenn sie eine Entscheidung verändert. Dieses Material lässt die Modellfrage bewusst hinten an und arbeitet an dem, was davor kommt: Schlägt das Modell überhaupt das Verfahren, das heute schon im Einsatz ist? Was kostet zu viel, was kostet zu wenig, und welcher Puffer bringt beides ins Gleichgewicht? Woran erkennt man im Betrieb, dass eine Prognose kippt? Drei interaktive Entscheidungslabore und ein durchgerechneter Geschäftsfall führen zu einer Go/No-Go-Entscheidung, die man auch verteidigen kann. Ohne Programmierung, ohne Installation, ohne KI-Zugang: alles läuft als statische Seite im Browser.",
    format: "Selbstlern-Kit",
    duration: "~90 Minuten",
    audience: [
      "Planung, Supply Chain und Operations, die mit Absatz- oder Kapazitätsprognosen arbeiten",
      "Fach- und Führungskräfte, die Prognosen verantworten, ohne sie selbst zu rechnen",
      "Data- und Analytics-Teams, die ein Modell gegen den bestehenden Prozess verteidigen müssen",
    ],
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
        description:
          "Die Startseite: von hier öffnest du die drei Labore, den Geschäftsfall und die Blätter zum Mitnehmen in der vorgesehenen Reihenfolge.",
      },
      {
        label: "Entscheidungslabor (Englisch, 3 Akte)",
        href: "/workshops/ki-prognosen-einschaetzen/hands-on.html",
        kind: "html",
        description:
          "Drei interaktive Akte auf einer Seite: Kapazität festlegen, Aufschaukelung stoppen, schnelle Nachfrage kontrolliert freigeben, jeweils mit Simulation zum Mitspielen.",
      },
      {
        label: "Geschäftsfall (Englisch)",
        href: "/workshops/ki-prognosen-einschaetzen/case-study/index.html",
        kind: "html",
        description:
          "Ein Launch, drei Zahlen, eine knappe Menge: Zuteilungsentscheidung, Systemkarte, Kostenasymmetrie und das tägliche Freigabe-Tor.",
      },
      {
        label: "Field Card (Englisch, 1 Seite)",
        href: "/workshops/ki-prognosen-einschaetzen/field-card.html",
        kind: "html",
        description:
          "Die druckbare Prüfliste für jede Prognose: fünf Säulen, Servicelevel-Formel, Sicherheitsbestand und die vier nicht prognostizierbaren Ereignisklassen.",
      },
      {
        label: "Übungsaufgabe (Englisch)",
        href: "/workshops/ki-prognosen-einschaetzen/homework.html",
        kind: "html",
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
      "Einen Monatsbericht wie ein Analyst lesen: Kennzahlen in Klartext definieren, als wiederverwendbaren Skill festhalten, ein Dashboard befüllen und eine Entscheidung begründen. Zum Schluss dieselbe Methode auf einem echten Quartalsbericht.",
    description:
      "In fünf Prompts baust du in der Claude-App einen kleinen KI-Analysten: Du arbeitest für ein synthetisches Unternehmen, bekommst dessen Monatsbericht samt der Rohdaten, aus denen er geschrieben wurde, und hältst in Klartext fest, was die Zahlen hier bedeuten. Aus diesen Regeln wird ein wiederverwendbarer Skill, der den Bericht ausliest, ein Dashboard befüllt und eine begründete Entscheidung stützt. In Fall 2 verlässt du die Sandbox und wendest dieselbe Methode auf die öffentlichen Quartalszahlen eines echten Unternehmens an. Ohne Programmierung und API-Key; für die Schritte in Claude brauchst du einen passenden Claude-Zugang.",
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
        title: "Verankern: Claude lernt das Unternehmen",
        description:
          "Du öffnest den Kit-Ordner in der Claude-App: der Monatsbericht (8 Seiten), fünf CSV-Rohdaten-Dateien (auch in Excel nutzbar) und ein Unternehmenssteckbrief. Ein Satz genügt: Claude liest Steckbrief und Bericht und benennt, wer das Unternehmen ist und welche Entscheidung der Monat vorbereitet. Der Ordner ist der Kontext: nichts wird hochgeladen oder konfiguriert.",
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
      source:
        "Quartalsmitteilung Q2 2026, veröffentlicht am 29. Juli 2026 und als SEC-Filing eingereicht. Claude ruft sie im Workshop live ab; im Kit wird nichts davon weiterverteilt.",
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
        description:
          "Englisches Slide-Deck entlang des roten Fadens: das Unternehmen, das Zip-Verzeichnis, die fünf Prompts mit ihren Artefakten, drei anspruchsvollere Zusatz-Prompts und Fall 2 (Meta). Jeder Prompt steht mit Kopier-Knopf auf der Folie. Mit Pfeiltasten blättern.",
      },
      {
        label: "NORTHWIND Analyst Kit (Englisch, .zip)",
        href: `${WORKSHOP_BASE_PATH}/northwind-analyst-kit.zip`,
        kind: "zip",
        description:
          "Englisches Kit mit beiden Fällen: CSV-Rohdaten, beide Monatsberichte als Markdown, der halb fertige Kennzahlen-Skill, die Dashboard-Vorlage, das Arbeitsblatt, die Meta-Aufgabe (Fall 2) und eine leere Vorlage für das eigene Unternehmen. Reines Textarchiv: den gestalteten Bericht siehst du im Walkthrough.",
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

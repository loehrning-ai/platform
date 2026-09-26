import type { Locale } from "./i18n/locale";
import type { Workshop, WorkshopMaterial } from "./workshops";

const base = "/workshops/esg-berichte-mit-ki";

/**
 * Workshop 04. Every number in this copy comes from
 * public/workshops/esg-berichte-mit-ki/data/w04-data.json, built by
 * scripts/workshop04/build_dataset.py; the company, its bills and the factors
 * are invented teaching data. The agenda follows the deck's seven acts: the
 * act minutes 4.0 / 7.5 / 16.0 / 16.5 / 15.5 / 7.0 / 10.0 are rounded half to
 * even (4 / 8 / 16 / 16 / 16 / 7 / 10 = 77), plus 13 minutes of questions in a
 * live session. The raw-folder AI answer is constructed from documented
 * failure modes; no run has been recorded yet, so provenance carries no
 * aiOutputsRecordedAt.
 */

/** Size of kellbrunn-esg-kit.zip (92,262 bytes), in the page locale's number format. */
const KIT_SIZE_LABEL = "90 KB";

type MaterialFrame = Omit<WorkshopMaterial, "label" | "description" | "sizeLabel">;

/** Shared href, kind, language, role and phase: both locales list the same files in the same order. */
const MATERIALS: readonly MaterialFrame[] = [
  { href: `${base}/slides.html`, kind: "html", language: "en", role: "deck", phase: "during", minutes: 77, primary: true },
  { href: `${base}/presenter.html`, kind: "html", language: "en", role: "presenter", phase: "during", optional: true },
  { href: `${base}/demo.html`, kind: "html", language: "en", role: "demo", phase: "during", minutes: 10, optional: true },
  { href: `${base}/kellbrunn-esg-kit.zip`, kind: "zip", language: "en", role: "kit", phase: "during" },
  { href: `${base}/transfer.html`, kind: "html", language: "en", role: "exercise", phase: "during" },
  { href: `${base}/guide.html`, kind: "html", language: "en", role: "guide", phase: "after" },
  { href: `${base}/field-card.html`, kind: "html", language: "en", role: "card", phase: "after" },
];

function materials(copy: readonly (readonly [label: string, description: string])[]): readonly WorkshopMaterial[] {
  if (copy.length !== MATERIALS.length) throw new Error("Workshop 04: material copy does not match the material list");
  return MATERIALS.map((frame, index) => {
    const [label, description] = copy[index];
    return frame.kind === "zip" ? { ...frame, label, description, sizeLabel: KIT_SIZE_LABEL } : { ...frame, label, description };
  });
}

export const ESG_REPORTING_WORKSHOP: Readonly<Record<Locale, Workshop>> = {
  de: {
    slug: "esg-berichte-mit-ki",
    number: "04",
    topic: "ESG-Berichte",
    title: "ESG-Berichte mit KI: Von Rohdaten zu klaren Erkenntnissen",
    eyebrow: "Workshop 04 · ESG-Berichte",
    summary:
      "Dieselbe Scope-1-und-2-Frage geht an einen Rechnungsordner und an eine Belegtabelle. Du findest sechs Fehler in einer Summe, die plausibel aussieht.",
    description:
      "Die erfundene Kellbrunn Präzisionsteile GmbH (180 Beschäftigte, drei Standorte) will wissen, wie hoch ihre Scope-1- und Scope-2-Emissionen 2025 waren und ob sie gegenüber 2024 gesunken sind. Auf einen Ordner mit 22 Rechnungen und Exporten antwortet die KI mit 1.866,5 t CO₂e, 7,5 % weniger als im Vorjahr. Diese Antwort ist aus dokumentierten Fehlerarten konstruiert. Die Summe liegt nur 2,5 % neben der richtigen Zahl, obwohl sechs Fehler darin stecken: eine doppelte Märzrechnung, ein fehlender Oktober, die Rechnung eines Gemeinschaftsunternehmens, „1.240 MWh“ als 1.240 kWh gelesen, ein Gasfaktor auf der falschen Basis und AdBlue als Diesel gezählt. Mit einer Belegtabelle, sechs Regeln und festen Faktoren lautet die Antwort auf dieselbe Frage 1.915,2 t standortbasiert (−5,1 %) und 1.893,2 t marktbasiert (−29,2 %). Vom standortbasierten Rückgang kommen 72,2 t vom niedrigeren Netzfaktor und 30,1 t aus geringerem eigenem Verbrauch; vom marktbasierten kommen 744,0 t aus Herkunftsnachweisen für einen Standort. Alle Zahlen sind erfunden, die Faktoren sind Lehrwerte.",
    format: "Live-Workshop mit Deck",
    duration: "~90 Minuten",
    accessNote:
      "Für Deck, Lernbegleiter und Demo brauchst du nur einen Browser; das Material ist auf Englisch, die Rechnungen im Kit sind deutsche Belege. Die gezeigte KI-Antwort auf den Rohordner ist aus dokumentierten Fehlerarten konstruiert und keine Live-Abfrage.",
    outcome: "Fünf-Felder-Blatt für eine eigene Rechnung",
    audience: [
      "Nachhaltigkeits-, Finanz- und Controlling-Teams im Mittelstand, die Scope 1 und 2 an Bank oder Kunden liefern",
      "Betriebs- und Energieverantwortliche, bei denen die Rechnungen liegen",
      "Moderatorinnen und Moderatoren, die den Fall mit einer Gruppe durchgehen wollen",
    ],
    notForYou:
      "Eher nicht für dich, wenn du eine vollständige Treibhausgasbilanz mit Scope 3 oder eine Einführung in CSRD und ESRS suchst.",
    question:
      "Wie hoch waren unsere Scope-1- und Scope-2-Emissionen 2025, und sind sie gegenüber 2024 gesunken?",
    outcomes: [
      "Du baust für einen Standort eine Monatstabelle und findest doppelte, fehlende und zweimonatige Rechnungen, bevor jemand summiert.",
      "Du schreibst eine Zeile einer Belegtabelle mit zitierter Quelle, Zeitraum, Wert und Einheit wie gedruckt, Gesellschaft, Bilanzgrenze und Faktor mit Jahr.",
      "Du rechnest Scope 2 standortbasiert und marktbasiert aus und nennst, für welche Kilowattstunden ein Herkunftsnachweis gilt.",
      "Du zerlegst die Veränderung zum Vorjahr in Netzfaktor, Herkunftsnachweise und eigenen Verbrauch und schreibst einen Satz, der jede Zahl belegt.",
    ],
    agenda: [
      {
        label: "Die Frage und der Fall",
        minutes: 4,
        activity: "listen",
        description:
          "Du lernst Kellbrunn und die eine Frage kennen, die bis zum Schluss gleich bleibt.",
      },
      {
        label: "Die falsche Antwort",
        minutes: 8,
        activity: "vote",
        description:
          "Die KI meldet aus 22 Belegen 1.866,5 t, 7,5 % weniger als 2024, und du stimmst ab, ob du das an die Bank schickst.",
      },
      {
        label: "Warum sie falsch ist",
        minutes: 16,
        activity: "vote",
        description:
          "Du prüfst Monate, Einheit und Bilanzgrenze in drei Abstimmungen und siehst, wie sich sechs Fehler bis auf 48,7 t aufheben.",
      },
      {
        label: "Die Reparatur",
        minutes: 16,
        activity: "do",
        description:
          "Du füllst mit der Gruppe Zeilen einer Belegtabelle, entscheidest, woher der Netzfaktor kommt, und rechnest beide Scope-2-Zahlen.",
      },
      {
        label: "Noch einmal fragen und nachrechnen",
        minutes: 16,
        activity: "do",
        description:
          "Du verfolgst zu zweit drei Zahlen bis zum Beleg und zerlegst den Rückgang in Netzfaktor, Nachweise und eigenen Verbrauch.",
      },
      {
        label: "Grenzen",
        minutes: 7,
        activity: "do",
        description:
          "Du sortierst fünf Aufträge an die KI in „rechnen“, „nachfragen“ und „ablehnen oder umschreiben“, darunter „Schreib, dass wir klimaneutral sind“.",
      },
      {
        label: "Dein Fall",
        minutes: 10,
        activity: "write",
        description:
          "Du füllst fünf Felder für eine erfundene oder anonymisierte eigene Rechnung und stimmst noch einmal über die Antwort vom Anfang ab.",
      },
      {
        label: "Fragen",
        minutes: 13,
        mode: "live",
        activity: "listen",
        description:
          "Fragen aus der Gruppe; der Anhang des Decks hat Folien dafür.",
      },
    ],
    agendaSource: "deck",
    minutesLive: 90,
    minutesSelfStudy: 60,
    needs: [
      "Ein Browser, für das Deck am besten ein großer Bildschirm im Querformat",
      "Papier und Stift für die fünf Felder und die Übung mit drei Zahlen",
      "Ein Taschenrechner oder das Handy",
      "Optional ein KI-Konto für den 20-Minuten-Versuch im Lernbegleiter",
    ],
    notNeeded: [
      "Programmierkenntnisse",
      "Vorwissen zur Treibhausgasbilanz über die Begriffe Scope 1 und Scope 2 hinaus",
      "Ein KI-Konto für Deck, Demo und Übungen",
      "Eigene Firmendaten, denn Kellbrunn ist erfunden",
    ],
    notCovered: [
      "Rechtsberatung und eine Prüfung durch Wirtschaftsprüfer",
      "Eine Einführung in CSRD, ESRS oder VSME",
      "Eine vollständige Scope-3-Bilanz; ein Stahl-Beispiel steht im Anhang des Decks",
      "Amtliche Emissionsfaktoren; der Workshop rechnet mit Lehrwerten",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-09-26",
      data: "synthetic",
      note: "Kellbrunn, alle Belege und alle Mengen sind erfunden, die Faktoren sind Lehrwerte. Die KI-Antwort auf den Rohordner ist konstruiert; aufgezeichnete Läufe werden mit Datum und Modell nachgetragen.",
    },
    decisionLab: {
      kicker: "Entscheidung 01 · Rohdaten",
      title: "1.866,5 Tonnen, 7,5 % weniger als 2024. Weiterschicken?",
      prompt:
        "Die KI hat alle Rechnungen im Ordner gelesen und meldet für 2025 Scope 1 und 2 von 1.866,5 t CO₂e, 7,5 % unter dem Vorjahr. Die Bank wartet auf die Zahl. Was tust du?",
      facts: [
        "KI-Antwort 2025: 1.866,5 t CO₂e",
        "Vorjahr 2024: 2.017,5 t CO₂e",
        "Ordner Werk Nord: 12 Stromrechnungen",
      ],
      decisionLegend: "Deine erste Entscheidung",
      evidenceLegend: "Der stärkste Beleg",
      choices: [
        {
          id: "check-coverage",
          label:
            "Erst je Standort eine Monatstabelle bauen und jede Rechnung einmal zählen, dann rechnen.",
        },
        {
          id: "send-total",
          label:
            "Die Zahl schicken, weil sie nah am Vorjahr liegt und die KI ihre Summen zeigt.",
        },
        {
          id: "ask-again",
          label:
            "Die KI bitten, noch einmal genauer zu rechnen, und die zweite Zahl schicken.",
        },
      ],
      evidence: [
        {
          id: "files-not-months",
          label:
            "Zwölf Dateien zeigen nicht, dass zwölf Monate abgedeckt sind. Eine Rechnung kann doppelt sein, eine zwei Monate umfassen, eine einer anderen Firma gehören.",
        },
        {
          id: "close-to-last-year",
          label:
            "Die Zahl liegt nur 7,5 % unter dem Vorjahr, das ist ein normales Jahr.",
        },
        {
          id: "shown-sums",
          label: "Die KI hat jede Summe Schritt für Schritt gezeigt.",
        },
      ],
      recommendedChoiceId: "check-coverage",
      strongestEvidenceId: "files-not-months",
      submitLabel: "Entscheidung prüfen",
      resetLabel: "Neu entscheiden",
      privacyNote:
        "Läuft nur auf dieser Seite. Auswahl und Ergebnis werden weder gespeichert noch gesendet.",
      resultLabel: "Auswertung der Entscheidung",
      feedback: {
        aligned: {
          title: "Zwölf Rechnungen, elf Monate.",
          body: "Im Ordner steckt der März doppelt, der Oktober fehlt, und eine Rechnung gehört einem Gemeinschaftsunternehmen. Die Monatstabelle zeigt das, bevor jemand summiert. Richtig sind 1.915,2 t standortbasiert.",
        },
        decisionOnly: {
          title: "Richtiger Schritt, schwacher Grund.",
          body: "Eine Zahl nah am Vorjahr und gezeigte Summen belegen nicht, dass jede Rechnung einmal zählt. Der Beleg ist die Monatstabelle: 12 Dateien decken hier 11 Monate ab.",
        },
        evidenceOnly: {
          title: "Dein Beleg spricht gegen deine Entscheidung.",
          body: "Wenn zwölf Dateien keine zwölf Monate belegen, darf die Summe so nicht raus. Erst die Monatstabelle, dann die Zahl.",
        },
        unsupported: {
          title: "Plausibel ist noch nicht geprüft.",
          body: "Sechs Fehler heben sich hier fast auf: Die Summe liegt nur 48,7 t neben der richtigen. Der Vorjahresvergleich findet die doppelte Märzrechnung nicht.",
        },
        byChoice: {
          "send-total": {
            evidenceOnly: {
              title: "Dein Beleg spricht gegen das Abschicken.",
              body: "Zwölf Dateien decken elf Monate ab, und eine Rechnung gehört einer anderen Firma. Die Summe stimmt nur zufällig fast. Richtig sind 1.915,2 t standortbasiert, und die Begründung der KI ist falsch.",
            },
            unsupported: {
              title: "Nah am Vorjahr heißt nicht richtig.",
              body: "Die Summe liegt 48,7 t neben der richtigen, weil sich Fehler aufheben. Im nächsten Jahr können sich dieselben Fehler addieren statt aufheben.",
            },
          },
          "ask-again": {
            evidenceOnly: {
              title: "Eine zweite Rechnung ändert den Ordner nicht.",
              body: "Die KI rechnet mit denselben Dateien noch einmal. Den fehlenden Oktober und die fremde Rechnung findest du mit der Monatstabelle.",
            },
            unsupported: {
              title: "Genauer rechnen hilft hier nicht.",
              body: "Die Fehler stecken in den Belegen: doppelter März, fehlender Oktober, fremde Rechnung. Eine zweite Summe über denselben Ordner zählt sie wieder mit.",
            },
          },
        },
      },
    },
    steps: [
      {
        n: "01",
        title: "Eine Frage stellen",
        description:
          "Kellbrunn will wissen, wie hoch Scope 1 und 2 im Jahr 2025 waren und ob sie gegenüber 2024 gesunken sind. Diese Frage bleibt im ganzen Workshop dieselbe.",
        tool: "Deck · Die Frage",
      },
      {
        n: "02",
        title: "Die plausible falsche Antwort prüfen",
        description:
          "Auf 22 Belege antwortet die KI mit 1.866,5 t, 7,5 % unter dem Vorjahr. Die Antwort ist konstruiert und zeigt, was passiert, wenn sechs Fehler zusammentreffen. Die Summe liegt trotzdem nur 48,7 t neben der richtigen Zahl.",
        tool: "Deck · Der Fehler",
      },
      {
        n: "03",
        title: "Belegtabelle und Regeln aufschreiben",
        description:
          "Du legst eine Zeile je Menge mit zitierter Quelle an, füllst eine Tabelle Standort mal Monat und hältst sechs Regeln und feste Faktoren schriftlich fest. Du rechnest beide Scope-2-Zahlen: 1.444,0 t standortbasiert und 1.422,0 t marktbasiert.",
        tool: "Deck · Die Reparatur",
      },
      {
        n: "04",
        title: "Drei Zahlen bis zum Beleg verfolgen",
        description:
          "Zu zweit verfolgst du drei Zahlen auf Papier bis zur Rechnung und zerlegst den Rückgang: 72,2 t kommen vom Netzfaktor, 30,1 t vom eigenen Verbrauch.",
        tool: "Übung · Noch einmal fragen",
      },
      {
        n: "05",
        title: "Rechnen, nachfragen, ablehnen",
        description:
          "Du sortierst fünf Aufträge an die KI und siehst, was die Zahlen nicht belegen, etwa Kältemittel ohne Wartungsrechnung. Keine Rechtsberatung.",
        tool: "Deck · Grenzen",
      },
      {
        n: "06",
        title: "Deine fünf Felder ausfüllen",
        description:
          "Du überträgst das Vorgehen auf eine erfundene oder anonymisierte eigene Rechnung: Quelle, Zeitraum, Einheit, Bilanzgrenze, Faktor. Neben jedem Feld steht das Beispiel aus Werk Süd.",
        tool: "Transferblatt",
      },
      {
        n: "07",
        title: "Optional: die Fallen selbst schalten",
        description:
          "In der interaktiven Demo schaltest du jede Falle einzeln ein, öffnest jede Rechnung und siehst die Zeile, die daraus in der Belegtabelle wird.",
        tool: "Interaktive Demo · etwa 10 Minuten",
      },
    ],
    caseStudy: {
      companyName: "Kellbrunn Präzisionsteile GmbH",
      isFictional: true,
      location: "Erfundener Standort in Hessen",
      sector: "Metallteile für Autoindustrie und Maschinenbau (Stanzen, CNC-Fertigung)",
      period: "Geschäftsjahr 2025, Vergleich mit 2024",
      narrative:
        "Kellbrunn hat 180 Beschäftigte, zwei Werke und ein gemietetes Lager. Die Bank und ein Autohersteller fragen nach Scope 1 und 2 für 2025 und nach der Veränderung zum Vorjahr. Dieselbe Frage geht an einen Ordner mit 22 Belegen und an eine Belegtabelle mit sechs Regeln. Die Faktoren sind Lehrwerte.",
      metrics: [
        { label: "Beschäftigte", value: "180" },
        { label: "Belege 2025", value: "22" },
        { label: "Abstand der KI-Summe zur richtigen", value: "48,7 t" },
        { label: "Anteil des Netzfaktors am standortbasierten Rückgang", value: "71 %" },
      ],
      decisionQuestion:
        "Welche Prüfungen brauchst du, bevor du eine Emissionszahl aus einem Rechnungsordner an Bank oder Kunden schickst?",
      dataLimitations: [
        "Firma, Rechnungen und Mengen sind erfunden; die Emissionsfaktoren sind Lehrwerte und keine amtlichen Werte.",
        "Die Antwort der KI auf den Rohordner ist aus dokumentierten Fehlerarten konstruiert, bis aufgezeichnete Läufe mit Datum vorliegen.",
        "Die Zahlen für 2024 stammen aus einer Zusammenfassung ohne Einzelrechnungen, mit derselben Grenze und denselben Faktoren.",
        "Ohne Produktionsmengen lässt sich nicht sagen, ob der geringere Verbrauch aus Effizienz oder aus weniger Produktion kommt.",
      ],
    },
    materials: materials([
      [
        "Deck · 20 Szenen",
        "Etwa 77 Minuten Programm und 13 Minuten Fragen; die Demo ist optional (10 Min.). Pfeiltasten führen weiter, P öffnet die Moderationsansicht. Am besten auf einem großen Bildschirm im Querformat.",
      ],
      [
        "Moderationsansicht",
        "Für die Person, die moderiert: Notizen, Abstimmungsfragen, Pflichtsätze und eine Uhr für die 77 Minuten. Die Ansicht verbindet sich mit dem Deck, sobald du dort P drückst.",
      ],
      [
        "Interaktive Demo · 10 Min.",
        "Schalte jede Falle einzeln ein, öffne jede Rechnung und sieh die Zeile, die daraus in der Belegtabelle wird.",
      ],
      [
        "ESG-Kit · .zip",
        "Alle Rechnungen als Text, Faktoren, leere und erwartete Belegtabelle, fünf Prompts und Vorlagen für Datenanfragen. Nur CSV- und Markdown-Dateien; START-HERE.md sagt, womit du anfängst.",
      ],
      [
        "Transferblatt",
        "Fünf Felder für eine eigene Rechnung, mit dem Beispiel aus Werk Süd daneben. Zum Ausdrucken.",
      ],
      [
        "Lernbegleiter",
        "Der Workshop zum Nachlesen, mit Fragen, deren Antwort du aufklappst, einer Wiederholung nach einer Woche und einem Glossar. Funktioniert auch auf dem Smartphone.",
      ],
      [
        "Merkkarte",
        "Sieben Prüfungen auf einer A4-Seite, bevor du einer ESG-Zahl traust.",
      ],
    ]),
  },
  en: {
    slug: "esg-berichte-mit-ki",
    number: "04",
    topic: "ESG reporting",
    title: "ESG Reporting with AI: From Raw Inputs to Clearer Insights",
    eyebrow: "Workshop 04 · ESG reporting",
    summary:
      "You ask an AI the same Scope 1 and 2 question twice, once with a folder of bills and once with a ledger, and find six errors in a total that looks right.",
    description:
      "The invented company Kellbrunn Präzisionsteile GmbH (180 staff, three sites) wants to know its Scope 1 and 2 emissions for 2025 and whether they went down compared with 2024. From a folder of 22 bills and exports, the AI answers 1,866.5 t CO₂e, 7.5% below last year. This answer is constructed from documented failure modes. The total is only 2.5% from the right figure, although six errors are inside it: a duplicate March bill, a missing October, a joint venture's bill, \"1.240 MWh\" read as 1,240 kWh, a gas factor on the wrong basis and AdBlue counted as diesel. With a ledger, six rules and pinned factors, the answer to the same question is 1,915.2 t location-based (−5.1%) and 1,893.2 t market-based (−29.2%). Of the location-based decrease, 72.2 t comes from a lower grid factor and 30.1 t from lower own use; of the market-based decrease, 744.0 t comes from guarantees of origin for one site. All numbers are invented; the factors are teaching values.",
    format: "Live workshop with deck",
    duration: "~90 minutes",
    accessNote:
      "The deck, learner guide and demo need only a browser; materials are in English and the bills in the kit are German documents. The AI answer on the raw folder is constructed from documented failure modes; it is not a live request.",
    outcome: "Five-box sheet for one of your own bills",
    audience: [
      "Sustainability, finance and controlling teams in mid-sized companies who send Scope 1 and 2 to a bank or customers",
      "Operations and energy managers who hold the bills",
      "Facilitators who want to take a group through the case",
    ],
    notForYou:
      "Probably not for you if you are looking for a full greenhouse gas inventory including Scope 3, or a walk-through of CSRD and ESRS.",
    question:
      "What were our Scope 1 and 2 emissions in 2025, and did they go down compared with 2024?",
    outcomes: [
      "Build a month grid for one site and spot duplicate, missing and two-month bills before anyone adds them up.",
      "Write one ledger row with the quoted source, period, value and unit as printed, legal entity, boundary and factor with its year.",
      "Work out Scope 2 location-based and market-based, and name the kilowatt hours a guarantee of origin covers.",
      "Split the change against last year into grid factor, certificates and own use, and write one sentence that cites every number.",
    ],
    agenda: [
      {
        label: "The question and the case",
        minutes: 4,
        activity: "listen",
        description:
          "You meet Kellbrunn and the one question that stays the same to the end.",
      },
      {
        label: "The wrong answer",
        minutes: 8,
        activity: "vote",
        description:
          "The AI reports 1,866.5 t from 22 documents, 7.5% below 2024, and you vote on whether it goes to the bank.",
      },
      {
        label: "Why it is wrong",
        minutes: 16,
        activity: "vote",
        description:
          "You check months, unit and boundary in three votes and see how six errors cancel down to 48.7 t.",
      },
      {
        label: "The fix",
        minutes: 16,
        activity: "do",
        description:
          "You fill ledger rows with the group, decide where the grid factor comes from and work out both Scope 2 numbers.",
      },
      {
        label: "Ask again and trace it",
        minutes: 16,
        activity: "do",
        description:
          "In pairs you trace three figures to their bills and split the decrease into grid factor, certificates and own use.",
      },
      {
        label: "Limits",
        minutes: 7,
        activity: "do",
        description:
          "You sort five requests to the AI into calculate, ask back, and refuse or rewrite, including \"Write that we are climate-neutral\".",
      },
      {
        label: "Your case",
        minutes: 10,
        activity: "write",
        description:
          "You fill five boxes for an invented or anonymised bill of your own and vote again on the opening answer.",
      },
      {
        label: "Questions",
        minutes: 13,
        mode: "live",
        activity: "listen",
        description:
          "Questions from the group; the deck's appendix has slides for them.",
      },
    ],
    agendaSource: "deck",
    minutesLive: 90,
    minutesSelfStudy: 60,
    needs: [
      "A browser, ideally a large landscape screen for the deck",
      "Paper and a pen for the five boxes and the three-figure exercise",
      "A calculator or a phone",
      "Optionally an AI account for the 20-minute try in the learner guide",
    ],
    notNeeded: [
      "Programming skills",
      "Greenhouse gas accounting knowledge beyond the terms Scope 1 and Scope 2",
      "An AI account for the deck, demo and exercises",
      "Your own company data, because Kellbrunn is invented",
    ],
    notCovered: [
      "Legal advice or an audit",
      "A walk-through of CSRD, ESRS or VSME",
      "A full Scope 3 inventory; one steel example is in the deck's appendix",
      "Official emission factors; the workshop uses teaching values",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-09-26",
      data: "synthetic",
      note: "Kellbrunn and all its documents and quantities are invented; the factors are teaching values. The AI answer on the raw folder is constructed; recorded runs will be added with date and model.",
    },
    decisionLab: {
      kicker: "Decision 01 · Raw data",
      title: "1,866.5 tonnes, 7.5% below 2024. Send it?",
      prompt:
        "The AI read every bill in the folder and reports Scope 1 and 2 of 1,866.5 t CO₂e for 2025, 7.5% below last year. The bank is waiting for the number. What do you do?",
      facts: [
        "AI answer 2025: 1,866.5 t CO₂e",
        "Last year 2024: 2,017.5 t CO₂e",
        "Werk Nord folder: 12 electricity bills",
      ],
      decisionLegend: "Your first decision",
      evidenceLegend: "The strongest evidence",
      choices: [
        {
          id: "check-coverage",
          label:
            "Build a month grid per site and count each bill once, then calculate.",
        },
        {
          id: "send-total",
          label:
            "Send it, because it is close to last year and the AI shows its sums.",
        },
        {
          id: "ask-again",
          label:
            "Ask the AI to calculate more carefully and send the second number.",
        },
      ],
      evidence: [
        {
          id: "files-not-months",
          label:
            "Twelve files do not show that twelve months are covered. A bill can be in twice, cover two months or belong to another company.",
        },
        {
          id: "close-to-last-year",
          label:
            "The number is only 7.5% below last year, which is a normal year.",
        },
        {
          id: "shown-sums",
          label: "The AI showed every sum step by step.",
        },
      ],
      recommendedChoiceId: "check-coverage",
      strongestEvidenceId: "files-not-months",
      submitLabel: "Check decision",
      resetLabel: "Decide again",
      privacyNote:
        "Runs only on this page. Your selection and result are neither stored nor sent.",
      resultLabel: "Decision feedback",
      feedback: {
        aligned: {
          title: "Twelve bills, eleven months.",
          body: "March is in the folder twice, October is missing, and one bill belongs to a joint venture. A month grid shows this before anyone adds up. The right total is 1,915.2 t location-based.",
        },
        decisionOnly: {
          title: "Right step, weak reason.",
          body: "A number close to last year and neatly shown sums do not prove each bill counts once. The evidence is the month grid: here 12 files cover 11 months.",
        },
        evidenceOnly: {
          title: "Your evidence argues against your decision.",
          body: "If twelve files do not prove twelve months, the total cannot go out yet. Month grid first, then the number.",
        },
        unsupported: {
          title: "Plausible is not the same as checked.",
          body: "Six errors almost cancel here: the total is only 48.7 t from the right one. Comparing with last year does not find the duplicate March bill.",
        },
        byChoice: {
          "send-total": {
            evidenceOnly: {
              title: "Your evidence argues against sending.",
              body: "Twelve files cover eleven months, and one bill belongs to another company. The total is nearly right by accident. The right total is 1,915.2 t location-based, and the AI's explanation is wrong.",
            },
            unsupported: {
              title: "Close to last year does not mean correct.",
              body: "The total is 48.7 t from the right one because errors cancel. Next year the same errors can add up instead of cancelling.",
            },
          },
          "ask-again": {
            evidenceOnly: {
              title: "A second calculation does not change the folder.",
              body: "The AI calculates again from the same files. The month grid finds the missing October and the other company's bill.",
            },
            unsupported: {
              title: "Calculating more carefully does not help here.",
              body: "The errors are in the documents: a doubled March, a missing October, another company's bill. A second sum over the same folder counts them again.",
            },
          },
        },
      },
    },
    steps: [
      {
        n: "01",
        title: "Ask one question",
        description:
          "Kellbrunn wants its Scope 1 and 2 emissions for 2025 and whether they went down compared with 2024. The question stays the same for the whole workshop.",
        tool: "Deck · The question",
      },
      {
        n: "02",
        title: "Check the plausible wrong answer",
        description:
          "From 22 documents the AI answers 1,866.5 t, 7.5% below last year. The answer is constructed and shows what happens when six errors meet. The total is still only 48.7 t from the right figure.",
        tool: "Deck · The mistake",
      },
      {
        n: "03",
        title: "Write down a ledger and rules",
        description:
          "You write one row per quantity with a quoted source, fill a site-by-month grid, and write down six rules and a pinned factor table. You work out both Scope 2 numbers: 1,444.0 t location-based and 1,422.0 t market-based.",
        tool: "Deck · The fix",
      },
      {
        n: "04",
        title: "Trace three figures to the bill",
        description:
          "In pairs you trace three figures on paper to their bills and split the decrease: 72.2 t comes from the grid factor, 30.1 t from own use.",
        tool: "Exercise · Ask again",
      },
      {
        n: "05",
        title: "Calculate, ask back, refuse",
        description:
          "You sort five requests to the AI and see what the numbers do not support, such as refrigerants with no service invoice. Not legal advice.",
        tool: "Deck · Limits",
      },
      {
        n: "06",
        title: "Fill your five boxes",
        description:
          "You apply the method to an invented or anonymised bill of your own: source, period, unit, boundary, factor. The Werk Süd example is next to each box.",
        tool: "Transfer sheet",
      },
      {
        n: "07",
        title: "Optional: switch the traps yourself",
        description:
          "In the interactive demo you switch each trap on alone, open every bill and see the ledger row it becomes.",
        tool: "Interactive demo · about 10 minutes",
      },
    ],
    caseStudy: {
      companyName: "Kellbrunn Präzisionsteile GmbH",
      isFictional: true,
      location: "Invented site in Hesse, Germany",
      sector: "Metal parts for automotive and machinery (stamping, CNC machining)",
      period: "Financial year 2025, compared with 2024",
      narrative:
        "Kellbrunn has 180 staff, two plants and a leased warehouse. The bank and a car maker ask for Scope 1 and 2 for 2025 and the change against last year. The same question goes to a folder of 22 documents and to a ledger with six rules. The factors are teaching values.",
      metrics: [
        { label: "Staff", value: "180" },
        { label: "Documents 2025", value: "22" },
        { label: "Gap between the AI total and the right total", value: "48.7 t" },
        { label: "Share of the location-based decrease from the grid factor", value: "71%" },
      ],
      decisionQuestion:
        "Which checks do you need before you send an emissions figure from a folder of bills to a bank or customer?",
      dataLimitations: [
        "Company, bills and quantities are invented; the emission factors are teaching values, not official ones.",
        "The AI answer on the raw folder is constructed from documented failure modes until recorded runs with a date exist.",
        "The 2024 figures come from a summary without individual bills, with the same boundary and the same factors.",
        "Without production volumes nobody can say whether lower use came from efficiency or from lower output.",
      ],
    },
    materials: materials([
      [
        "Deck · 20 scenes",
        "About 77 minutes of content and 13 minutes of questions; the demo is optional (10 min). Use the arrow keys; P opens the presenter view. Best on a large screen in landscape.",
      ],
      [
        "Presenter view",
        "For whoever presents: notes, room votes, must-say lines and a clock for the 77 minutes. The view pairs with the deck as soon as you press P there.",
      ],
      [
        "Interactive demo · 10 min",
        "Switch each trap on alone, open every bill and see the ledger row it becomes.",
      ],
      [
        "ESG kit · .zip",
        "Every bill as text, factors, empty and expected ledgers, five prompts and data-request templates. CSV and Markdown only; START-HERE.md tells you where to begin.",
      ],
      [
        "Transfer sheet",
        "Five boxes for one of your own bills, with the Werk Süd example beside each. For printing.",
      ],
      [
        "Learner guide",
        "The workshop to read at your own pace, with reveal questions, a one-week recall and a glossary. Works on a phone too.",
      ],
      [
        "Field card",
        "Seven checks on one A4 page before you trust an ESG number.",
      ],
    ]),
  },
};

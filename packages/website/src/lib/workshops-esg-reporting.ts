import type { Locale } from "./i18n/locale";
import type { Workshop, WorkshopMaterial } from "./workshops";

const base = "/workshops/esg-berichte-mit-ki";

/**
 * Workshop 04. Every number in this copy comes from
 * scripts/workshop04/data/w04-data.json (repository root), built by
 * scripts/workshop04/build_dataset.py; the company, its bills and the factors
 * are invented teaching data. The agenda follows the deck's seven acts: the
 * act minutes 4.0 / 7.5 / 16.0 / 16.5 / 15.5 / 7.0 / 10.0 are rounded half to
 * even (4 / 8 / 16 / 16 / 16 / 7 / 10 = 77), plus 13 minutes of questions in a
 * live session. The raw-folder AI answer is constructed from documented
 * failure modes; no run has been recorded yet, so provenance carries no
 * aiOutputsRecordedAt.
 */

/** Size of kellbrunn-esg-kit.zip (92,968 bytes), in the page locale's number format. */
const KIT_SIZE_LABEL = "91 KB";

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

/** Label, description and, where the first sentence runs long on a phone, its short phone wording. */
type MaterialCopy = readonly [label: string, description: string, short?: string];

function materials(copy: readonly MaterialCopy[]): readonly WorkshopMaterial[] {
  if (copy.length !== MATERIALS.length) throw new Error("Workshop 04: material copy does not match the material list");
  return MATERIALS.map((frame, index) => {
    const [label, description, short] = copy[index];
    const text = short === undefined ? { label, description } : { label, description, short };
    return frame.kind === "zip" ? { ...frame, ...text, sizeLabel: KIT_SIZE_LABEL } : { ...frame, ...text };
  });
}

export const ESG_REPORTING_WORKSHOP: Readonly<Record<Locale, Workshop>> = {
  de: {
    slug: "esg-berichte-mit-ki",
    number: "04",
    topic: "ESG-Berichte",
    title: "ESG-Berichte mit KI",
    eyebrow: "Workshop 04 · ESG-Berichte",
    summary:
      "Du findest sechs Fehler in der plausiblen Scope-1-und-2-Summe einer KI.",
    description:
      "Die erfundene Kellbrunn Präzisionsteile GmbH will wissen, wie hoch ihre Scope-1- und Scope-2-Emissionen 2025 waren und ob sie gegenüber 2024 gesunken sind. Eine aus dokumentierten Fehlerarten konstruierte KI-Antwort auf 22 Rechnungen und Exporte meldet 1.866,5 t CO₂e (7,5 % weniger) und liegt trotz sechs Fehlern nur 2,5 % neben der richtigen Zahl: doppelte Märzrechnung, fehlender Oktober, Rechnung eines Gemeinschaftsunternehmens, „1.240 MWh“ als 1.240 kWh gelesen, Gasfaktor auf falscher Basis, AdBlue als Diesel. Mit Belegtabelle, sechs Regeln und festen Faktoren ergeben sich 1.915,2 t standortbasiert (−5,1 %) und 1.893,2 t marktbasiert (−29,2 %). Vom standortbasierten Rückgang kommen 72,2 t vom Netzfaktor und 30,1 t aus geringerem Verbrauch, vom marktbasierten 744,0 t aus Herkunftsnachweisen für einen Standort.",
    format: "Live-Workshop mit Deck",
    duration: "~90 Minuten",
    accessNote:
      "Das Material ist englisch, die Rechnungen im Kit sind deutsche Belege. Die KI-Antwort auf den Rohordner ist konstruiert, keine Live-Abfrage.",
    outcome: "Fünf-Felder-Blatt für eine eigene Rechnung",
    audience: [
      "Nachhaltigkeits-, Finanz- und Controlling-Teams, die Scope 1 und 2 liefern",
      "Betriebs- und Energieverantwortliche, bei denen die Rechnungen liegen",
      "Moderierende, die den Fall mit einer Gruppe durchgehen",
    ],
    notForYou:
      "Nicht für dich, wenn du eine Scope-3-Bilanz oder eine Einführung in CSRD, ESRS oder VSME suchst.",
    question:
      "Wie hoch waren unsere Scope-1- und Scope-2-Emissionen 2025, und sind sie gegenüber 2024 gesunken?",
    outcomes: [
      "Du findest in einer Monatstabelle doppelte, fehlende und zweimonatige Rechnungen.",
      "Du schreibst eine vollständige Belegzeile mit Faktor und Faktorjahr.",
      "Du rechnest Scope 2 standort- und marktbasiert und nennst, für welche Kilowattstunden ein Herkunftsnachweis gilt.",
      "Du zerlegst die Vorjahresveränderung in Netzfaktor, Herkunftsnachweise und Verbrauch.",
    ],
    agenda: [
      {
        label: "Die Frage und der Fall",
        minutes: 4,
        activity: "listen",
        description:
          "Kellbrunn stellt die eine Frage, die bis zum Schluss bleibt.",
      },
      {
        label: "Die falsche Antwort",
        minutes: 8,
        activity: "vote",
        description:
          "Die KI meldet aus 22 Belegen 1.866,5 t, 7,5 % weniger als 2024; du stimmst ab, ob das an die Bank geht.",
      },
      {
        label: "Warum sie falsch ist",
        minutes: 16,
        activity: "vote",
        description:
          "In drei Abstimmungen prüfst du Monate, Einheit und Grenze und siehst sechs Fehler, die sich bis auf 48,7 t aufheben.",
      },
      {
        label: "Die Reparatur",
        minutes: 16,
        activity: "do",
        description:
          "Du füllst Belegzeilen, wählst die Quelle des Netzfaktors und rechnest beide Scope-2-Zahlen.",
      },
      {
        label: "Neu fragen und nachrechnen",
        minutes: 16,
        activity: "do",
        description:
          "Zu zweit verfolgst du drei Zahlen bis zum Beleg und zerlegst den Rückgang.",
      },
      {
        label: "Grenzen",
        minutes: 7,
        activity: "do",
        description:
          "Du sortierst fünf Aufträge an die KI in „rechnen“, „nachfragen“ und „ablehnen oder umschreiben“, etwa „Schreib, dass wir klimaneutral sind“.",
      },
      {
        label: "Dein Fall",
        minutes: 10,
        activity: "write",
        description:
          "Du füllst fünf Felder für eine erfundene oder anonymisierte eigene Rechnung und stimmst erneut über die Antwort vom Anfang ab.",
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
    minutesSelfStudy: 80,
    needs: [
      "Ein Browser, fürs Deck am besten ein großer Querformat-Bildschirm",
      "Papier und Stift",
      "Ein Taschenrechner oder das Handy",
      "Optional ein KI-Konto für den Versuch im Lernbegleiter (20 Min.)",
    ],
    notNeeded: [
      "Programmierkenntnisse",
      "Vorwissen über die Begriffe Scope 1 und 2 hinaus",
      "Ein KI-Konto für Deck, Praxisbeispiel und Übungen",
      "Eigene Firmendaten",
    ],
    notCovered: [
      "Rechtsberatung und Wirtschaftsprüfung",
      "Scope 3; ein Stahl-Beispiel steht im Anhang des Decks",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-09-26",
      data: "synthetic",
      note: "Aufgezeichnete KI-Läufe werden mit Datum und Modell nachgetragen.",
    },
    decisionLab: {
      kicker: "Entscheidung 01 · Rohdaten",
      title: "1.866,5 Tonnen, 7,5 % weniger als 2024. Weiterschicken?",
      prompt:
        "Die KI meldet für 2025 Scope 1 und 2 von 1.866,5 t CO₂e, 7,5 % unter dem Vorjahr. Die Bank wartet. Was tust du?",
      facts: [
        "KI-Antwort 2025 (konstruiert): 1.866,5 t CO₂e",
        "Vorjahr 2024: 2.017,5 t CO₂e",
        "Ordner Werk Nord: 12 Dateien",
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
            "Zwölf Dateien belegen keine zwölf Monate: Rechnungen können doppelt, zweimonatig oder fremd sein.",
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
          title: "Zwölf Dateien im Ordner decken nur elf Monate ab.",
          body: "Der März steckt doppelt im Ordner, der Oktober fehlt, eine Rechnung gehört einem Gemeinschaftsunternehmen; die Monatstabelle zeigt das vor dem Summieren. Richtig sind 1.915,2 t standortbasiert.",
        },
        decisionOnly: {
          title: "Der Schritt stimmt, aber dein Beleg trägt ihn nicht.",
          body: "Eine Zahl nah am Vorjahr und gezeigte Summen belegen nicht, dass jede Rechnung einmal zählt. Der Beleg ist die Monatstabelle: 12 Dateien decken hier 11 Monate ab.",
        },
        evidenceOnly: {
          title: "Dein Beleg spricht gegen deine Entscheidung.",
          body: "Wenn zwölf Dateien keine zwölf Monate belegen, darf die Summe so nicht raus. Erst die Monatstabelle, dann die Zahl.",
        },
        unsupported: {
          title: "Die Summe sieht plausibel aus und ist trotzdem falsch.",
          body: "Sechs Fehler heben sich hier fast auf, deshalb weicht die Summe nur um 48,7 t von der richtigen ab. Der Vorjahresvergleich findet die doppelte Märzrechnung nicht.",
        },
        byChoice: {
          "send-total": {
            evidenceOnly: {
              title: "Dein Beleg spricht gegen das Abschicken.",
              body: "Zwölf Dateien decken elf Monate ab, eine Rechnung gehört einer anderen Firma, und die Summe stimmt nur zufällig fast. Richtig sind 1.915,2 t standortbasiert.",
            },
            unsupported: {
              title: "Die Nähe zum Vorjahr belegt die Summe nicht.",
              body: "Die Summe weicht nur um 48,7 t von der richtigen ab, weil sich Fehler aufheben. Im nächsten Jahr können sich dieselben Fehler addieren statt aufheben.",
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
          "Die Frage nach Scope 1 und 2 für 2025 und dem Vergleich mit 2024 bleibt den ganzen Workshop über gleich.",
        tool: "Deck · Die Frage",
      },
      {
        n: "02",
        title: "Die plausible falsche Antwort prüfen",
        description:
          "Die konstruierte KI-Antwort meldet 1.866,5 t und liegt trotz sechs Fehlern nur 48,7 t neben der richtigen Zahl.",
        tool: "Deck · Der Fehler",
      },
      {
        n: "03",
        title: "Belegtabelle und Regeln aufschreiben",
        description:
          "Du schreibst Belegzeilen mit zitierter Quelle, sechs Regeln und feste Faktoren; Scope 2 ergibt 1.444,0 t standortbasiert und 1.422,0 t marktbasiert.",
        tool: "Deck · Die Reparatur",
      },
      {
        n: "04",
        title: "Drei Zahlen bis zum Beleg verfolgen",
        description:
          "Zu zweit verfolgst du drei Zahlen bis zur Rechnung: 72,2 t des Rückgangs kommen vom Netzfaktor, 30,1 t vom eigenen Verbrauch.",
        tool: "Übung · Noch einmal fragen",
      },
      {
        n: "05",
        title: "Rechnen, nachfragen, ablehnen",
        description:
          "Du sortierst fünf Aufträge an die KI und siehst, was die Zahlen nicht belegen, etwa Kältemittel ohne Wartungsrechnung.",
        tool: "Deck · Grenzen",
      },
      {
        n: "06",
        title: "Deine fünf Felder ausfüllen",
        description:
          "Für eine erfundene oder anonymisierte eigene Rechnung füllst du Quelle, Zeitraum, Einheit, Bilanzgrenze und Faktor, neben jedem Feld das Beispiel aus Werk Süd.",
        tool: "Transferblatt",
      },
      {
        n: "07",
        title: "Optional: die Fallen selbst schalten",
        description:
          "Du schaltest jede Falle einzeln ein und siehst, welche Belegzeile aus jeder Rechnung wird.",
        tool: "Praxisbeispiel · etwa 10 Minuten",
      },
    ],
    caseStudy: {
      companyName: "Kellbrunn Präzisionsteile GmbH",
      isFictional: true,
      location: "Erfundener Standort in Hessen",
      sector: "Metallteile für Auto- und Maschinenbau",
      period: "Geschäftsjahr 2025, Vergleich mit 2024",
      narrative:
        "Kellbrunn hat zwei Werke und ein gemietetes Lager. Bank und ein Autohersteller fragen nach Scope 1 und 2 für 2025 samt Vorjahresvergleich; die Frage geht an einen Ordner mit 22 Belegen und an eine Belegtabelle mit sechs Regeln.",
      metrics: [
        { label: "Beschäftigte", value: "180" },
        { label: "Belege 2025", value: "22" },
        { label: "Abweichung der KI-Summe", value: "48,7 t" },
        { label: "Netzfaktor-Anteil am standortbasierten Rückgang", value: "71 %" },
      ],
      decisionQuestion:
        "Welche Prüfungen brauchst du, bevor du eine Emissionszahl aus einem Rechnungsordner an Bank oder Kunden schickst?",
      dataLimitations: [
        "Die Emissionsfaktoren sind Lehrwerte, keine amtlichen Werte.",
        "2024 stammt aus einer Zusammenfassung ohne Einzelrechnungen, mit gleicher Grenze und den Faktoren von 2024.",
        "Ohne Produktionsmengen bleibt offen, ob weniger Verbrauch aus Effizienz oder aus weniger Produktion kommt.",
      ],
      resultChart: {
        unit: "t CO₂e",
        basis: "Scope 1 und 2",
        note: "Trotz sechs Fehlern weicht die KI-Summe nur um 48,7 t ab.",
        bars: [
          { label: "Vorjahr 2024", value: 2017.5, display: "2.017,5 t", kind: "reference" },
          {
            label: "KI-Antwort 2025",
            value: 1866.5,
            display: "1.866,5 t",
            note: "sechs Fehler, 7,5 % weniger",
            kind: "answer",
          },
          {
            label: "Belegtabelle 2025, standortbasiert",
            value: 1915.2,
            display: "1.915,2 t",
            kind: "correct",
          },
        ],
      },
    },
    materials: materials([
      [
        "Deck · 20 Szenen",
        "Für den Beamer. Pfeiltasten blättern, P öffnet die Moderationsansicht.",
      ],
      [
        "Moderationsansicht",
        "Für die Person, die moderiert: Notizen, Abstimmungsfragen, Pflichtsätze und eine Uhr. Verbindet sich mit dem Deck, sobald du dort P drückst.",
        "Für die Person, die moderiert: Notizen, Abstimmungsfragen und eine Uhr.",
      ],
      [
        "Praxisbeispiel · 10 Min.",
        "Schalte jede Falle einzeln ein, öffne jede Rechnung und sieh die Zeile, die daraus in der Belegtabelle wird.",
        "Schalte jede Falle einzeln ein und sieh, was aus jeder Rechnung wird.",
      ],
      [
        "ESG-Kit · .zip",
        "Rechnungen als Text, Faktoren, leere und erwartete Belegtabelle, fünf Prompts und Vorlagen für Datenanfragen, als CSV und Markdown. START-HERE.md sagt, womit du anfängst.",
        "Rechnungen, Faktoren, Belegtabellen und Prompts als CSV und Markdown.",
      ],
      [
        "Transferblatt",
        "Fünf Felder für eine eigene Rechnung, daneben das Beispiel aus Werk Süd. Zum Ausdrucken.",
      ],
      [
        "Lernbegleiter",
        "Der Workshop zum Nachlesen, mit Aufklappfragen, Wiederholung nach einer Woche und Glossar. Auch auf dem Smartphone.",
        "Der Workshop zum Nachlesen, mit Glossar, auch auf dem Smartphone.",
      ],
      [
        "Prüfkarte",
        "Sieben Prüfungen auf einer A4-Seite, bevor du einer ESG-Zahl traust.",
      ],
    ]),
  },
  en: {
    slug: "esg-berichte-mit-ki",
    number: "04",
    topic: "ESG reporting",
    title: "ESG reports with AI",
    eyebrow: "Workshop 04 · ESG reporting",
    summary:
      "You find six errors in an AI's plausible Scope 1 and 2 total.",
    description:
      "The invented company Kellbrunn Präzisionsteile GmbH wants to know its Scope 1 and 2 emissions for 2025 and whether they went down compared with 2024. An AI answer on 22 bills and exports, constructed from documented failure modes, reports 1,866.5 t CO₂e (7.5% lower) and is only 2.5% off despite six errors: a duplicate March bill, a missing October, a joint venture's bill, \"1.240 MWh\" read as 1,240 kWh, a gas factor on the wrong basis and AdBlue counted as diesel. With a ledger, six rules and pinned factors the answer is 1,915.2 t location-based (−5.1%) and 1,893.2 t market-based (−29.2%). Of the location-based decrease, 72.2 t comes from the grid factor and 30.1 t from lower use; of the market-based one, 744.0 t comes from guarantees of origin for one site.",
    format: "Live workshop with deck",
    duration: "~90 minutes",
    accessNote:
      "Materials are in English; the bills in the kit are German documents. The AI answer on the raw folder is constructed, not a live request.",
    outcome: "Five-box sheet for one of your own bills",
    audience: [
      "Sustainability, finance and controlling teams who report Scope 1 and 2",
      "Operations and energy managers who hold the bills",
      "Facilitators taking a group through the case",
    ],
    notForYou:
      "Not for you if you want a Scope 3 inventory or a walk-through of CSRD, ESRS or VSME.",
    question:
      "What were our Scope 1 and 2 emissions in 2025, and did they go down compared with 2024?",
    outcomes: [
      "Spot duplicate, missing and two-month bills in a month grid.",
      "Write a complete ledger row, including the factor and its year.",
      "Work out Scope 2 location- and market-based and name which kilowatt hours a guarantee of origin covers.",
      "Split the change against last year into grid factor, guarantees of origin and use.",
    ],
    agenda: [
      {
        label: "The question and the case",
        minutes: 4,
        activity: "listen",
        description:
          "Kellbrunn asks the one question that stays to the end.",
      },
      {
        label: "The wrong answer",
        minutes: 8,
        activity: "vote",
        description:
          "The AI reports 1,866.5 t from 22 documents, 7.5% below 2024; you vote on whether it goes to the bank.",
      },
      {
        label: "Why it is wrong",
        minutes: 16,
        activity: "vote",
        description:
          "In three votes you check months, unit and boundary and see six errors cancel down to 48.7 t.",
      },
      {
        label: "The fix",
        minutes: 16,
        activity: "do",
        description:
          "You fill ledger rows, pick the grid factor's source and work out both Scope 2 numbers.",
      },
      {
        label: "Ask again and trace it",
        minutes: 16,
        activity: "do",
        description:
          "In pairs you trace three figures to their bills and split the decrease.",
      },
      {
        label: "Limits",
        minutes: 7,
        activity: "do",
        description:
          "You sort five requests to the AI into calculate, ask back, and refuse or rewrite, such as \"Write that we are climate-neutral\".",
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
    minutesSelfStudy: 80,
    needs: [
      "A browser, ideally a large landscape screen for the deck",
      "Paper and a pen",
      "A calculator or a phone",
      "Optionally an AI account for the learner-guide try (20 min)",
    ],
    notNeeded: [
      "Programming skills",
      "Knowledge beyond the terms Scope 1 and 2",
      "An AI account for the deck, demo and exercises",
      "Your own company data",
    ],
    notCovered: [
      "Legal advice or an audit",
      "Scope 3; one steel example is in the deck's appendix",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-09-26",
      data: "synthetic",
      note: "Recorded AI runs will be added with date and model.",
    },
    decisionLab: {
      kicker: "Decision 01 · Raw data",
      title: "1,866.5 tonnes, 7.5% below 2024. Send it?",
      prompt:
        "The AI reports Scope 1 and 2 of 1,866.5 t CO₂e for 2025, 7.5% below last year. The bank is waiting. What do you do?",
      facts: [
        "AI answer 2025 (constructed): 1,866.5 t CO₂e",
        "Last year 2024: 2,017.5 t CO₂e",
        "Werk Nord folder: 12 files",
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
            "Twelve files do not prove twelve months: bills can be filed twice, span two months or belong to another company.",
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
          title: "The twelve files in the folder cover only eleven months.",
          body: "March is in the folder twice, October is missing, one bill belongs to a joint venture; a month grid shows this before anyone adds up. The right total is 1,915.2 t location-based.",
        },
        decisionOnly: {
          title: "The step is right, but your evidence does not support it.",
          body: "A number close to last year and neatly shown sums do not prove each bill counts once. The evidence is the month grid: here 12 files cover 11 months.",
        },
        evidenceOnly: {
          title: "Your evidence argues against your decision.",
          body: "If twelve files do not prove twelve months, the total cannot go out yet. Month grid first, then the number.",
        },
        unsupported: {
          title: "The total looks plausible and is still wrong.",
          body: "Six errors almost cancel here, so the total is only 48.7 t off the right one. Comparing with last year does not find the duplicate March bill.",
        },
        byChoice: {
          "send-total": {
            evidenceOnly: {
              title: "Your evidence argues against sending.",
              body: "Twelve files cover eleven months, one bill belongs to another company, and the total is nearly right by accident. The right total is 1,915.2 t location-based.",
            },
            unsupported: {
              title: "Being close to last year does not prove the total.",
              body: "The total is only 48.7 t off the right one because errors cancel. Next year the same errors can add up instead of cancelling.",
            },
          },
          "ask-again": {
            evidenceOnly: {
              title: "A second calculation does not change the folder.",
              body: "The AI calculates again from the same files. The month grid finds the missing October and the other company's bill.",
            },
            unsupported: {
              title: "Calculating more carefully does not help here.",
              body: "The errors are in the documents: a March bill filed twice, a missing October, another company's bill. A second sum over the same folder counts them again.",
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
          "The question about Scope 1 and 2 for 2025 against 2024 stays the same for the whole workshop.",
        tool: "Deck · The question",
      },
      {
        n: "02",
        title: "Check the plausible wrong answer",
        description:
          "The constructed AI answer reports 1,866.5 t and is only 48.7 t off despite six errors.",
        tool: "Deck · The mistake",
      },
      {
        n: "03",
        title: "Write down a ledger and rules",
        description:
          "You write ledger rows with quoted sources, six rules and pinned factors; Scope 2 comes to 1,444.0 t location-based and 1,422.0 t market-based.",
        tool: "Deck · The fix",
      },
      {
        n: "04",
        title: "Trace three figures to the bill",
        description:
          "In pairs you trace three figures to their bills: 72.2 t of the decrease comes from the grid factor, 30.1 t from own use.",
        tool: "Exercise · Ask again",
      },
      {
        n: "05",
        title: "Calculate, ask back, refuse",
        description:
          "You sort five requests to the AI and see what the numbers do not support, such as refrigerants with no service invoice.",
        tool: "Deck · Limits",
      },
      {
        n: "06",
        title: "Fill your five boxes",
        description:
          "For an invented or anonymised bill of your own you fill source, period, unit, boundary and factor, with the Werk Süd example next to each box.",
        tool: "Transfer sheet",
      },
      {
        n: "07",
        title: "Optional: switch the traps yourself",
        description:
          "You switch each trap on alone and see the ledger row each bill becomes.",
        tool: "Interactive demo · about 10 minutes",
      },
    ],
    caseStudy: {
      companyName: "Kellbrunn Präzisionsteile GmbH",
      isFictional: true,
      location: "Invented site in Hesse, Germany",
      sector: "Metal parts for cars and machinery",
      period: "Financial year 2025, compared with 2024",
      narrative:
        "Kellbrunn has two plants and a leased warehouse. The bank and a car maker ask for Scope 1 and 2 for 2025 against last year; the question goes to a folder of 22 documents and to a ledger with six rules.",
      metrics: [
        { label: "Staff", value: "180" },
        { label: "Documents 2025", value: "22" },
        { label: "AI total off by", value: "48.7 t" },
        { label: "Grid factor share of location-based decrease", value: "71%" },
      ],
      decisionQuestion:
        "Which checks do you need before you send an emissions figure from a folder of bills to a bank or customer?",
      dataLimitations: [
        "The emission factors are teaching values, not official ones.",
        "2024 comes from a summary without individual bills, with the same boundary and 2024 factors.",
        "Without production volumes it stays open whether lower use came from efficiency or lower output.",
      ],
      resultChart: {
        unit: "t CO₂e",
        basis: "Scope 1 and 2",
        note: "Despite six errors, the AI total is only 48.7 t off.",
        bars: [
          { label: "Last year 2024", value: 2017.5, display: "2,017.5 t", kind: "reference" },
          {
            label: "AI answer 2025",
            value: 1866.5,
            display: "1,866.5 t",
            note: "six errors, 7.5% lower",
            kind: "answer",
          },
          {
            label: "Ledger 2025, location-based",
            value: 1915.2,
            display: "1,915.2 t",
            kind: "correct",
          },
        ],
      },
    },
    materials: materials([
      [
        "Deck · 20 scenes",
        "For the projector. Arrow keys move on; P opens the presenter view.",
      ],
      [
        "Presenter view",
        "For whoever presents: notes, room votes, must-say lines and a clock. Pairs with the deck when you press P there.",
        "For whoever presents: notes, room votes and a clock.",
      ],
      [
        "Interactive demo · 10 min",
        "Switch each trap on alone, open every bill and see the ledger row it becomes.",
        "Switch each trap on alone and see the ledger row each bill becomes.",
      ],
      [
        "ESG kit · .zip",
        "Every bill as text, factors, empty and expected ledgers, five prompts and data-request templates, as CSV and Markdown. START-HERE.md tells you where to begin.",
        "Bills, factors, ledgers and prompts as CSV and Markdown files.",
      ],
      [
        "Transfer sheet",
        "Five boxes for your own bill, with the Werk Süd example beside each. For printing.",
      ],
      [
        "Learner guide",
        "The workshop to read at your own pace, with reveal questions, a one-week recall and a glossary. Works on a phone.",
        "The workshop to read at your own pace, with a glossary, on a phone too.",
      ],
      [
        "Field card",
        "Seven checks on one A4 page before you trust an ESG number.",
      ],
    ]),
  },
};

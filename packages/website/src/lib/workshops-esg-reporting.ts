import type { Locale } from "./i18n/locale";
import type { Workshop, WorkshopMaterial } from "./workshops";
import { ESG_REPORTING_KIT } from "./workshops-esg-reporting-kit";

const base = "/workshops/esg-berichte-mit-ki";

/**
 * Workshop 04, "Answer ESG by Friday". The published deck and kit are written by
 * scripts/workshop04/export-esg-passport.mjs (repository root); every number in this copy is
 * printed in that deck or kit, and the company, its files and its certificates are invented.
 * The agenda follows the deck's 17 slides and the session clock (8 / 4 / 4 / 8 / 7 / 7 / 10 /
 * 6 / 6 = 60 minutes). The session is presenter-led: Tim runs the five prompts in Claude while
 * the room watches; the kit lets a learner replay the same steps at home.
 */

/** Size of crvena-zemja-esg-kit.zip (891,029 bytes), in the page locale's number format. */
const KIT_SIZE_LABEL = "870 KB";

type MaterialFrame = Omit<WorkshopMaterial, "label" | "description" | "sizeLabel">;

/** Shared href, kind, language, role and phase: both locales list the same files in the same order. */
const MATERIALS: readonly MaterialFrame[] = [
  { href: `${base}/slides.html`, kind: "html", language: "en", role: "deck", phase: "during", minutes: 60, primary: true },
  { href: `${base}/crvena-zemja-esg-kit.zip`, kind: "zip", language: "en", role: "kit", phase: "after" },
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
    topic: "ESG",
    title: "ESG-Anfragen bis Freitag beantworten",
    eyebrow: "Workshop 04 · ESG",
    summary:
      "Eine erfundene nordmazedonische Weinkellerei bekommt drei ESG-Anfragen in einer Woche. Claude beantwortet alle aus denselben Dateien und benennt, was fehlt.",
    description:
      "Vinarija Crvena Zemja, eine erfundene Familienkellerei in der Gemeinde Kavadarci in Nordmazedonien, bekommt in einer Woche drei ESG-Anfragen: den Lieferantenfragebogen ihres schwedischen Importeurs, sieben grüne Werbeaussagen des eigenen Marketings für Deutschland und Polen und das Prüfformular der Bank für einen Solarkredit, auf Mazedonisch. Tim beantwortet alle drei live in einem Claude-Projekt, mit fünf Prompts und drei Regeln: nur unsere Dateien, jede Antwort mit Quelle, NOT FOUND oder NEEDS CHECK statt einer Schätzung. Im Fragebogen sind 5 Antworten OK, 1 NEEDS CHECK und 2 NOT FOUND, denn 279,7 MWh Strom sind nur elf Monate und das Bio-Zertifikat ist am 31. August 2026 abgelaufen. Vier von sieben Werbeaussagen fallen durch. Für die Bank rechnet Claude die Amortisation in Code: 8.550.000 MKD / (180.000 kWh × 9,50 MKD/kWh) = 5,0 Jahre. Dann kommt das Foto der fehlenden Septemberrechnung, und das Jahr hat 320,9 MWh.",
    format: "Live-Workshop mit Deck",
    duration: "~60 Minuten",
    accessNote:
      "Das Material ist englisch, und live bedient Tim Claude, während du zuschaust. Zu Hause spielst du die fünf Schritte mit dem Kit nach, auf jedem Claude-Plan mit eingeschalteter Codeausführung und Dateierstellung, und die Dateien werden dabei an Claude übertragen.",
    outcome: "Kit mit fünf Prompts und drei Regeln",
    audience: [
      "Geschäftsführung und Verwaltung kleiner Firmen, bei denen ESG-Fragebögen landen",
      "Vertrieb und Marketing, die grüne Aussagen über Produkte machen wollen",
      "Finanzteams, die Banken ESG-Angaben zu Krediten liefern",
    ],
    notForYou:
      "Nicht für dich, wenn du einen vollständigen CSRD- oder VSME-Bericht erstellen oder eine Treibhausgasbilanz von Grund auf lernen willst.",
    question:
      "Wie beantworten wir drei ESG-Anfragen bis Freitag aus einem Satz Fakten, ohne etwas zu behaupten, das wir nicht belegen können?",
    outcomes: [
      "Du richtest ein Claude-Projekt mit eigenen Dateien und drei Regeln ein.",
      "Du lässt Claude einen Fragebogen und ein Bankformular mit Quelle und Status je Antwort füllen.",
      "Du sortierst Werbeaussagen in rot, gelb und grün und schreibst belegbare Fassungen.",
      "Du erkennst, welche Antworten sich mit einem nachgereichten Beleg ändern, und lässt Claude sie nachziehen.",
    ],
    agenda: [
      {
        label: "Warum ESG bei dir landet",
        minutes: 8,
        activity: "listen",
        description:
          "Von freiwilligen Berichten zum EU-Gesetz, warum die Fragen nach der Kürzung von 2026 bleiben und wie sie über Käufer, Banken und Regale bei Exporteuren in Nordmazedonien ankommen.",
      },
      {
        label: "Darf ich das, und wie Claude arbeitet",
        minutes: 4,
        activity: "listen",
        description:
          "Zwei Regeln, die bei dir bleiben, und was in Claude läuft: das Projekt, Code, das Lesen von Fotos und die Dateien, die Claude schreibt.",
      },
      {
        label: "Fall und Projekt",
        minutes: 4,
        activity: "do",
        description:
          "Vinarija Crvena Zemja hat 42 Beschäftigte und exportiert 74 % des Umsatzes; ein Claude-Projekt bekommt 13 Dateien und drei Regeln.",
      },
      {
        label: "Schritt 1: der Fragebogen des Importeurs",
        minutes: 8,
        activity: "do",
        description:
          "Claude beantwortet acht Fragen mit Quelle und Status: 5 OK, 1 NEEDS CHECK, 2 NOT FOUND.",
      },
      {
        label: "Schritt 2: Werbeaussagen",
        minutes: 7,
        activity: "vote",
        description:
          "Sieben Aussagen gegen die EU-Regeln: Du entscheidest mit, welche rot, gelb oder grün sind.",
      },
      {
        label: "Schritt 3: das Bankformular",
        minutes: 7,
        activity: "do",
        description:
          "Claude füllt ein mazedonisches Prüfformular und rechnet die Amortisation der Solaranlage in Code: 5,0 Jahre.",
      },
      {
        label: "Schritt 4: der ESG-Pass",
        minutes: 10,
        activity: "do",
        description:
          "Claude schreibt alles Bekannte auf die elf Überschriften des VSME-Basismoduls, als Dashboard und als Word-Datei, und benennt die Lücken.",
      },
      {
        label: "Schritt 5: die späte Rechnung",
        minutes: 6,
        activity: "do",
        description:
          "Das Foto der Septemberrechnung kommt, und Claude aktualisiert jede Antwort, die am Strom hängt.",
      },
      {
        label: "Was bleibt, und deine Fragen",
        minutes: 6,
        activity: "listen",
        description:
          "Einmal sammeln, oft antworten, nur behaupten, was du belegen kannst; das Kit nimmst du mit.",
      },
    ],
    agendaSource: "deck",
    minutesLive: 60,
    minutesSelfStudy: 60,
    needs: [
      "Live nur einen Bildschirm, auf dem du das Deck siehst",
      "Zum Nachmachen die Claude-Desktop-App oder claude.ai, jeder Plan",
      "In den Claude-Einstellungen eingeschaltet: Codeausführung und Dateierstellung",
      "Zu Hause etwa 45 Minuten für die fünf Schritte",
    ],
    notNeeded: [
      "Programmierkenntnisse",
      "Einen API-Schlüssel",
      "Vorwissen zu CSRD, VSME oder Treibhausgasbilanzen",
      "Eigene Firmendaten",
    ],
    notCovered: [
      "Rechtsberatung und Prüfung eines echten Berichts",
      "Eine vollständige Treibhausgasbilanz",
      "Echte Stromtarife; das Kit rechnet mit einem erfundenen Tarif",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-12",
      data: "synthetic",
      note: "Firma, Personen, Zahlen, Zertifikate und das Rechnungsfoto sind erfunden. Die fünf Prompts liefen vor der Veröffentlichung mehrfach auf Claude-Modellen gegen das Kit.",
    },
    steps: [
      {
        n: "01",
        title: "Das Projekt anlegen",
        description:
          "Ein Claude-Projekt bekommt 13 Firmendateien und drei Regeln: nur unsere Dateien, Quelle nennen, NOT FOUND oder NEEDS CHECK statt Schätzung.",
        tool: "Schritt 0 · Claude-Projekt",
      },
      {
        n: "02",
        title: "Den Importeur beantworten",
        description:
          "Claude beantwortet die acht Fragen von Nordvik Vin AB mit Quelle und Status: 5 OK, 1 NEEDS CHECK, 2 NOT FOUND. 279,7 MWh sind elf Monate, der September fehlt.",
        tool: "Prompt 1 · Excel-Datei",
      },
      {
        n: "03",
        title: "Werbeaussagen prüfen",
        description:
          "Von sieben Aussagen sind vier rot, eine gelb und zwei grün, jede mit Quelle und einer Fassung, die sich heute belegen lässt.",
        tool: "Prompt 2",
      },
      {
        n: "04",
        title: "Das Bankformular füllen",
        description:
          "Das Formular der Banka Povardarie, auf Mazedonisch (kyrillisch): 8.550.000 MKD / (180.000 kWh × 9,50 MKD/kWh) = 5,0 Jahre, in Code gerechnet und als Schätzung markiert.",
        tool: "Prompt 3",
      },
      {
        n: "05",
        title: "Den ESG-Pass bauen",
        description:
          "Auf den elf Überschriften des VSME-Basismoduls sind etwa 5 OK, 4 teilweise belegt und 2 NOT FOUND: B4 und B5. Dazu ein klickbares Dashboard.",
        tool: "Prompt 4 · Dashboard und Word-Datei",
      },
      {
        n: "06",
        title: "Die späte Rechnung einarbeiten",
        description:
          "Das Foto der Septemberrechnung macht das Jahr zu 320,9 MWh, 15,8 MWh mehr als ein Schnitt aus elf Monaten, und der Solaranteil sinkt von 64 % auf 56 %.",
        tool: "Prompt 5 · Foto",
      },
    ],
    caseStudy: {
      companyName: "Vinarija Crvena Zemja DOO",
      isFictional: true,
      location: "Erfundene Firma in der Gemeinde Kavadarci, Nordmazedonien",
      sector: "Stillwein von 40 ha eigenen Weinbergen",
      period: "Geschäftsjahr 2025, Anfragen im Oktober 2026",
      narrative:
        "Crvena Zemja exportiert 74 % des Umsatzes, nach Deutschland, an den schwedischen Importeur Nordvik Vin AB und nach Polen. Importeur, Marketing und Bank fragen in einer Woche nach denselben Fakten; die Antworten kommen aus 13 Dateien, die so unordentlich sind wie echte.",
      metrics: [
        { label: "Beschäftigte", value: "42" },
        { label: "Fragebogen", value: "5 von 8 OK" },
        { label: "Werbeaussagen", value: "4 von 7 rot" },
        { label: "Amortisation", value: "5,0 Jahre" },
      ],
      decisionQuestion:
        "Was darfst du einem Importeur, deiner Bank oder in einem Regal behaupten, wenn deine Dateien es nur zum Teil belegen?",
      dataLimitations: [
        "Den Stromrechnungen 2025 fehlt der September; er kommt in Schritt 5 als Foto, mit Absicht.",
        "Der Tarif von 9,50 MKD pro kWh ist erfunden, kein echter Preis.",
        "Die Solaranlage ist geplant; 180 MWh im Jahr sind eine Schätzung aus einem nicht unterschriebenen Angebot.",
      ],
    },
    materials: materials([
      [
        "Deck · 17 Folien",
        "Für den Beamer. Die Pfeiltaste nach rechts zeigt den nächsten Schritt einer Folie, nach links geht es zurück; jeder Prompt hat einen Kopierknopf.",
      ],
      [
        "ESG-Kit · .zip",
        "START-HERE.md mit Einrichtung und den fünf Prompts, die drei Regeln, 13 Firmendateien, die drei Anfragen und das Foto der späten Rechnung.",
        "Einrichtung, fünf Prompts, 13 Firmendateien, drei Anfragen, ein Foto.",
      ],
    ]),
    kit: ESG_REPORTING_KIT.de,
  },
  en: {
    slug: "esg-berichte-mit-ki",
    number: "04",
    topic: "ESG",
    title: "Answer ESG by Friday",
    eyebrow: "Workshop 04 · ESG",
    summary:
      "An invented North Macedonian winery gets three ESG requests in one week. Claude answers all of them from the same files and names what is missing.",
    description:
      "Vinarija Crvena Zemja, an invented family winery in Kavadarci municipality, North Macedonia, gets three ESG requests in one week: a supplier questionnaire from its Swedish importer, seven green claims from its own marketing team for Germany and Poland, and its bank's screening form for a solar loan, in Macedonian. Tim answers all three live in one Claude Project, with five prompts and three rules: only our files, cite the source, say NOT FOUND or NEEDS CHECK instead of guessing. The questionnaire comes back with 5 answers OK, 1 NEEDS CHECK and 2 NOT FOUND, because 279.7 MWh of electricity is only eleven months and the organic certificate expired on 31 August 2026. Four of seven claims fail. For the bank, Claude works out the payback in code: 8,550,000 MKD / (180,000 kWh × 9.50 MKD/kWh) = 5.0 years. Then a photo of the missing September invoice arrives, and the year has 320.9 MWh.",
    format: "Live workshop with deck",
    duration: "~60 minutes",
    accessNote:
      "Materials are in English, and in the live session Tim drives Claude while you watch. At home you replay the five steps with the kit on any Claude plan with code execution and file creation switched on, and the files are transferred to Claude as you do.",
    outcome: "Kit with five prompts and three rules",
    audience: [
      "Owners and office staff of small firms who receive ESG questionnaires",
      "Sales and marketing teams who want to make green product claims",
      "Finance teams who give banks ESG information for loans",
    ],
    notForYou:
      "Not for you if you want to write a full CSRD or VSME report or learn greenhouse gas accounting from scratch.",
    question:
      "How do we answer three ESG requests by Friday from one set of facts, without claiming anything we cannot prove?",
    outcomes: [
      "Set up a Claude Project with your own files and three rules.",
      "Have Claude fill a questionnaire and a bank form with a source and a status for every answer.",
      "Sort marketing claims into red, amber and green and write versions you can prove.",
      "Spot which answers change when a late document arrives, and have Claude update them.",
    ],
    agenda: [
      {
        label: "Why ESG lands on your desk",
        minutes: 8,
        activity: "listen",
        description:
          "From voluntary reports to EU law, why the questions stayed after the 2026 cut, and how they reach North Macedonian exporters through buyers, banks and shelves.",
      },
      {
        label: "Is it allowed, and how Claude works",
        minutes: 4,
        activity: "listen",
        description:
          "Two rules that stay with you, and what runs inside Claude: the Project, code, reading photos and the files Claude writes.",
      },
      {
        label: "The case and the Project",
        minutes: 4,
        activity: "do",
        description:
          "Vinarija Crvena Zemja has 42 employees and exports 74% of its revenue; a Claude Project gets 13 files and three rules.",
      },
      {
        label: "Step 1: the importer's questionnaire",
        minutes: 8,
        activity: "do",
        description:
          "Claude answers eight questions with source and status: 5 OK, 1 NEEDS CHECK, 2 NOT FOUND.",
      },
      {
        label: "Step 2: green claims",
        minutes: 7,
        activity: "vote",
        description:
          "Seven claims against the EU rules: you help decide which are red, amber or green.",
      },
      {
        label: "Step 3: the bank form",
        minutes: 7,
        activity: "do",
        description:
          "Claude fills a Macedonian screening form and works out the solar payback in code: 5.0 years.",
      },
      {
        label: "Step 4: the ESG passport",
        minutes: 10,
        activity: "do",
        description:
          "Claude puts everything known under the eleven headings of the VSME Basic module, as a dashboard and a Word file, and names the gaps.",
      },
      {
        label: "Step 5: the late invoice",
        minutes: 6,
        activity: "do",
        description:
          "A photo of the September invoice arrives, and Claude updates every answer that depends on electricity.",
      },
      {
        label: "What to keep, and your questions",
        minutes: 6,
        activity: "listen",
        description:
          "Collect once, answer many, claim only what you can prove; you leave with the kit.",
      },
    ],
    agendaSource: "deck",
    minutesLive: 60,
    minutesSelfStudy: 60,
    needs: [
      "Live, only a screen where you can see the deck",
      "To replay it, the Claude desktop app or claude.ai, any plan",
      "Switched on in Claude's settings: code execution and file creation",
      "About 45 minutes at home for the five steps",
    ],
    notNeeded: [
      "Programming skills",
      "An API key",
      "Prior knowledge of CSRD, VSME or greenhouse gas accounting",
      "Your own company data",
    ],
    notCovered: [
      "Legal advice or an audit of a real report",
      "A full greenhouse gas inventory",
      "Real electricity tariffs; the kit uses one invented tariff",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-12",
      data: "synthetic",
      note: "The company, people, numbers, certificates and the invoice photo are invented. The five prompts were run against the kit several times on Claude models before publication.",
    },
    steps: [
      {
        n: "01",
        title: "Set up the Project",
        description:
          "A Claude Project gets 13 company files and three rules: only our files, cite the source, NOT FOUND or NEEDS CHECK instead of a guess.",
        tool: "Step 0 · Claude Project",
      },
      {
        n: "02",
        title: "Answer the importer",
        description:
          "Claude answers Nordvik Vin AB's eight questions with source and status: 5 OK, 1 NEEDS CHECK, 2 NOT FOUND. 279.7 MWh is eleven months; September is missing.",
        tool: "Prompt 1 · Excel file",
      },
      {
        n: "03",
        title: "Check the green claims",
        description:
          "Of seven claims, four are red, one amber and two green, each with its source and a version you can prove today.",
        tool: "Prompt 2",
      },
      {
        n: "04",
        title: "Fill the bank form",
        description:
          "Banka Povardarie's form, in Macedonian (Cyrillic): 8,550,000 MKD / (180,000 kWh × 9.50 MKD/kWh) = 5.0 years, worked out in code and marked as an estimate.",
        tool: "Prompt 3",
      },
      {
        n: "05",
        title: "Build the ESG passport",
        description:
          "Under the eleven headings of the VSME Basic module, about 5 are OK, 4 partial and 2 NOT FOUND: B4 and B5. It comes with a clickable dashboard.",
        tool: "Prompt 4 · dashboard and Word file",
      },
      {
        n: "06",
        title: "Add the late invoice",
        description:
          "A photo of the September invoice makes the year 320.9 MWh, 15.8 MWh more than an 11-month average, and the solar share drops from 64% to 56%.",
        tool: "Prompt 5 · photo",
      },
    ],
    caseStudy: {
      companyName: "Vinarija Crvena Zemja DOO",
      isFictional: true,
      location: "Invented company in Kavadarci municipality, North Macedonia",
      sector: "Still wine from 40 ha of its own vineyards",
      period: "Financial year 2025, requests in October 2026",
      narrative:
        "Crvena Zemja exports 74% of its revenue, to Germany, to the Swedish importer Nordvik Vin AB and to Poland. Importer, marketing and bank ask for the same facts in one week; the answers come from 13 files that are as messy as real ones.",
      metrics: [
        { label: "Employees", value: "42" },
        { label: "Questionnaire", value: "5 of 8 OK" },
        { label: "Marketing claims", value: "4 of 7 red" },
        { label: "Payback", value: "5.0 years" },
      ],
      decisionQuestion:
        "What may you tell an importer, your bank or a shop shelf when your files only partly prove it?",
      dataLimitations: [
        "The 2025 electricity bills lack September; it arrives in step 5 as a photo, on purpose.",
        "The tariff of 9.50 MKD per kWh is invented, not a real price.",
        "The solar plant is planned; 180 MWh a year is an estimate from an unsigned offer.",
      ],
    },
    materials: materials([
      [
        "Deck · 17 slides",
        "For the projector. The right arrow key shows the next step of a slide and the left one goes back; every prompt has a copy button.",
      ],
      [
        "ESG kit · .zip",
        "START-HERE.md with the setup and the five prompts, the three rules, 13 company files, the three requests and the photo of the late invoice.",
        "Setup, five prompts, 13 company files, three requests, one photo.",
      ],
    ]),
    kit: ESG_REPORTING_KIT.en,
  },
};

import type { Locale } from "./i18n/locale";
import type { Workshop, WorkshopMaterial } from "./workshops";

const base = "/workshops/esg-berichte-mit-ki";

/**
 * Workshop 04, "Answer ESG by Friday". The published deck and kit are written by
 * scripts/workshop04/export-esg-passport.mjs (repository root); every number in this copy is
 * printed in that deck or kit, and the company, its files and its certificates are invented.
 * The agenda follows the deck's 13 slides and the session clock (6 / 4 / 8 / 8 / 6 / 8 / 8 /
 * 6 / 6 = 60 minutes). The session is presenter-led: Tim runs the five prompts in Claude while
 * the room watches; the kit lets a learner replay the same steps at home.
 */

/** Size of vardar-oak-esg-kit.zip (22,960 bytes), in the page locale's number format. */
const KIT_SIZE_LABEL = "22 KB";

type MaterialFrame = Omit<WorkshopMaterial, "label" | "description" | "sizeLabel">;

/** Shared href, kind, language, role and phase: both locales list the same files in the same order. */
const MATERIALS: readonly MaterialFrame[] = [
  { href: `${base}/slides.html`, kind: "html", language: "en", role: "deck", phase: "during", minutes: 60, primary: true },
  { href: `${base}/vardar-oak-esg-kit.zip`, kind: "zip", language: "en", role: "kit", phase: "after" },
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
      "Eine erfundene Möbelfirma bekommt drei ESG-Anfragen auf einmal. Claude beantwortet alle aus denselben Dateien und benennt, was fehlt.",
    description:
      "Vardar Oak, ein erfundener Möbelhersteller aus Veles in Nordmazedonien, bekommt an einem Montag drei ESG-Anfragen: den Lieferantenfragebogen des größten Kunden, grüne Werbeaussagen des eigenen Marketings und das ESG-Formular der Bank. Tim beantwortet alle drei live in einem Claude-Projekt, mit fünf Prompts und drei Regeln: nur unsere Dateien, jede Antwort mit Quelle, NOT FOUND oder NEEDS CHECK statt einer Schätzung. Im Fragebogen sind 13 von 16 Zeilen beantwortet und 3 offen, denn 653,7 MWh Strom sind nur elf Monate und das FSC-Zertifikat ist am 31. August 2026 abgelaufen. Vier von sieben Werbeaussagen fallen durch. Für die Bank rechnet Claude die Solaranlage vor: 320.000 kWh × 0,75 kg = 240 t CO₂e im Jahr.",
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
      "Du lässt Claude einen Fragebogen mit Quelle und Status je Zeile füllen.",
      "Du lässt Claude zwei Zahlen nachrechnen und findest die offenen Antworten.",
      "Du sortierst Werbeaussagen in rot, gelb und grün und schreibst belegbare Fassungen.",
    ],
    agenda: [
      {
        label: "Drei Anfragen an einem Montag",
        minutes: 6,
        activity: "listen",
        description:
          "Ein Kunde, das eigene Marketing und die Bank fragen nach ESG-Daten, mit Fristen von heute bis nächste Woche.",
      },
      {
        label: "Warum das bei dir landet",
        minutes: 4,
        activity: "listen",
        description:
          "Die CSRD gilt nur noch für sehr große Firmen, doch Kunden und Banken fragen weiter, und unbelegte grüne Aussagen sind in EU-Shops verboten.",
      },
      {
        label: "Fall und Projekt",
        minutes: 8,
        activity: "do",
        description:
          "Vardar Oak hat 86 Beschäftigte und macht 41 % des Umsatzes mit einem Kunden; ein Claude-Projekt bekommt elf Dateien und drei Regeln.",
      },
      {
        label: "Schritt 1: der Fragebogen",
        minutes: 8,
        activity: "do",
        description:
          "Claude füllt 16 Zeilen mit Antwort, Quelle und Status: 13 beantwortet, 3 mit NEEDS CHECK.",
      },
      {
        label: "Schritt 2: nachprüfen",
        minutes: 6,
        activity: "do",
        description:
          "Claude zeigt die Rechnung hinter zwei Antworten: die Dezemberrechnung fehlt, das FSC-Zertifikat ist abgelaufen.",
      },
      {
        label: "Schritt 3: Werbeaussagen",
        minutes: 8,
        activity: "vote",
        description:
          "Sieben Aussagen gegen die EU-Regeln: Du entscheidest mit, welche rot, gelb oder grün sind.",
      },
      {
        label: "Schritt 4: der ESG-Pass",
        minutes: 8,
        activity: "do",
        description:
          "Claude schreibt alles Bekannte auf die elf Überschriften des VSME-Basismoduls und benennt die Lücken.",
      },
      {
        label: "Schritt 5: die Bank",
        minutes: 6,
        activity: "do",
        description:
          "Das Bankformular kommt aus dem ESG-Pass, mit der Rechnung für die Solaranlage.",
      },
      {
        label: "Was bleibt",
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
      "Eine vollständige Treibhausgasbilanz mit Scope 3",
      "Amtliche Emissionsfaktoren; das Kit nutzt Lehrwerte",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-11",
      data: "synthetic",
      note: "Firma, Personen, Zahlen und Zertifikate sind erfunden. Die fünf Prompts liefen vor der Veröffentlichung mehrfach auf Claude-Modellen gegen das Kit.",
    },
    steps: [
      {
        n: "01",
        title: "Das Projekt anlegen",
        description:
          "Ein Claude-Projekt bekommt elf Firmendateien und drei Regeln: nur unsere Dateien, Quelle nennen, NOT FOUND oder NEEDS CHECK statt Schätzung.",
        tool: "Schritt 0 · Claude-Projekt",
      },
      {
        n: "02",
        title: "Den Fragebogen füllen",
        description:
          "Claude füllt die 16 Fragen des Kunden mit Antwort, Quelle und Status: 13 beantwortet, 3 mit NEEDS CHECK.",
        tool: "Prompt 1 · Excel-Datei",
      },
      {
        n: "03",
        title: "Zwei Zahlen nachprüfen",
        description:
          "653,7 MWh Strom sind elf Monate, die Dezemberrechnung fehlt. Das FSC-Zertifikat galt 2025 für 78 % der Eiche und ist am 31. August 2026 abgelaufen.",
        tool: "Prompt 2",
      },
      {
        n: "04",
        title: "Werbeaussagen prüfen",
        description:
          "Von sieben Aussagen sind vier rot, eine gelb und zwei grün, jede mit Quelle und einer Fassung, die sich heute belegen lässt.",
        tool: "Prompt 3",
      },
      {
        n: "05",
        title: "Den ESG-Pass schreiben",
        description:
          "Auf den elf Überschriften des VSME-Basismoduls sind 9 aus den Dateien gefüllt, 2 bleiben zu erheben: B4 und B5.",
        tool: "Prompt 4 · Word-Datei",
      },
      {
        n: "06",
        title: "Die Bank beantworten",
        description:
          "Das Formular kommt aus dem ESG-Pass: 320.000 kWh × 0,75 kg CO₂e pro kWh = 240 t CO₂e im Jahr.",
        tool: "Prompt 5",
      },
    ],
    caseStudy: {
      companyName: "Vardar Oak Furniture",
      isFictional: true,
      location: "Erfundene Firma in Veles, Nordmazedonien",
      sector: "Tische und Stühle aus massiver Eiche",
      period: "Geschäftsjahr 2025, Anfragen im Oktober 2026",
      narrative:
        "Vardar Oak verkauft 72 % in die EU und 41 % an einen Kunden, den Möbelhändler Hausfeld. Kunde, Marketing und Bank fragen in einer Woche nach denselben Fakten; die Antworten kommen aus elf Dateien, die so unordentlich sind wie echte.",
      metrics: [
        { label: "Beschäftigte", value: "86" },
        { label: "Fragebogen", value: "13 von 16 beantwortet" },
        { label: "Werbeaussagen", value: "4 von 7 rot" },
        { label: "ESG-Pass", value: "9 von 11 Überschriften" },
      ],
      decisionQuestion:
        "Was darfst du einem Kunden, deiner Bank oder in einem Onlineshop behaupten, wenn deine Dateien es nur zum Teil belegen?",
      dataLimitations: [
        "Die Stromrechnungen reichen von Januar bis November 2025; die fehlende Dezemberrechnung ist Absicht.",
        "Der Netzfaktor von 0,75 kg CO₂e pro kWh ist ein Lehrwert, kein amtlicher Wert.",
        "Die Solaranlage ist geplant; 320.000 kWh im Jahr sind eine Schätzung des Anbieters.",
      ],
    },
    materials: materials([
      [
        "Deck · 13 Folien",
        "Für den Beamer. Die Pfeiltaste nach rechts zeigt den nächsten Schritt einer Folie, nach links geht es zurück; jeder Prompt hat einen Kopierknopf.",
      ],
      [
        "ESG-Kit · .zip",
        "START-HERE.md mit Einrichtung und den fünf Prompts, die drei Regeln, elf Firmendateien und die drei Anfragen, als Markdown und CSV.",
        "Einrichtung, fünf Prompts, elf Firmendateien und drei Anfragen.",
      ],
    ]),
  },
  en: {
    slug: "esg-berichte-mit-ki",
    number: "04",
    topic: "ESG",
    title: "Answer ESG by Friday",
    eyebrow: "Workshop 04 · ESG",
    summary:
      "An invented furniture maker gets three ESG requests at once. Claude answers all of them from the same files and names what is missing.",
    description:
      "Vardar Oak, an invented furniture maker in Veles, North Macedonia, gets three ESG requests on one Monday: its biggest customer's supplier questionnaire, green claims from its own marketing team and its bank's ESG form. Tim answers all three live in one Claude Project, with five prompts and three rules: only our files, cite the source, say NOT FOUND or NEEDS CHECK instead of guessing. The questionnaire comes back with 13 of 16 rows answered and 3 open, because 653.7 MWh of electricity is only eleven months and the FSC certificate expired on 31 August 2026. Four of seven marketing claims fail. For the bank, Claude shows the solar sum: 320,000 kWh × 0.75 kg = 240 t CO₂e a year.",
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
      "Have Claude fill a questionnaire with a source and a status for every row.",
      "Have Claude show the sums behind two numbers and list the open answers.",
      "Sort marketing claims into red, amber and green and write versions you can prove.",
    ],
    agenda: [
      {
        label: "Three requests on one Monday",
        minutes: 6,
        activity: "listen",
        description:
          "A customer, your own marketing team and the bank ask for ESG data, due between today and next week.",
      },
      {
        label: "Why this lands on your desk",
        minutes: 4,
        activity: "listen",
        description:
          "The CSRD now covers only very large firms, yet customers and banks keep asking, and unproven green claims are banned in EU shops.",
      },
      {
        label: "The case and the Project",
        minutes: 8,
        activity: "do",
        description:
          "Vardar Oak has 86 employees and makes 41% of its sales with one customer; a Claude Project gets eleven files and three rules.",
      },
      {
        label: "Step 1: the questionnaire",
        minutes: 8,
        activity: "do",
        description:
          "Claude fills 16 rows with answer, source and status: 13 answered, 3 NEEDS CHECK.",
      },
      {
        label: "Step 2: check",
        minutes: 6,
        activity: "do",
        description:
          "Claude shows the sums behind two answers: December's bill is missing and the FSC certificate has expired.",
      },
      {
        label: "Step 3: green claims",
        minutes: 8,
        activity: "vote",
        description:
          "Seven claims against the EU rules: you help decide which are red, amber or green.",
      },
      {
        label: "Step 4: the ESG passport",
        minutes: 8,
        activity: "do",
        description:
          "Claude puts everything known under the eleven headings of the VSME Basic module and names the gaps.",
      },
      {
        label: "Step 5: the bank",
        minutes: 6,
        activity: "do",
        description:
          "The bank form is answered from the ESG passport, with the sum for the solar plant.",
      },
      {
        label: "What to keep",
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
      "A full greenhouse gas inventory with Scope 3",
      "Official emission factors; the kit uses teaching values",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-11",
      data: "synthetic",
      note: "The company, people, numbers and certificates are invented. The five prompts were run against the kit several times on Claude models before publication.",
    },
    steps: [
      {
        n: "01",
        title: "Set up the Project",
        description:
          "A Claude Project gets eleven company files and three rules: only our files, cite the source, NOT FOUND or NEEDS CHECK instead of a guess.",
        tool: "Step 0 · Claude Project",
      },
      {
        n: "02",
        title: "Fill the questionnaire",
        description:
          "Claude fills the customer's 16 questions with answer, source and status: 13 answered, 3 NEEDS CHECK.",
        tool: "Prompt 1 · Excel file",
      },
      {
        n: "03",
        title: "Check two numbers",
        description:
          "653.7 MWh of electricity is eleven months; December's bill is missing. The FSC certificate covered 78% of the oak in 2025 and expired on 31 August 2026.",
        tool: "Prompt 2",
      },
      {
        n: "04",
        title: "Check the green claims",
        description:
          "Of seven claims, four are red, one amber and two green, each with its source and a version you can prove today.",
        tool: "Prompt 3",
      },
      {
        n: "05",
        title: "Write the ESG passport",
        description:
          "Under the eleven headings of the VSME Basic module, 9 are filled from the files and 2 are still to collect: B4 and B5.",
        tool: "Prompt 4 · Word file",
      },
      {
        n: "06",
        title: "Answer the bank",
        description:
          "The form comes from the ESG passport: 320,000 kWh × 0.75 kg CO₂e per kWh = 240 t CO₂e a year.",
        tool: "Prompt 5",
      },
    ],
    caseStudy: {
      companyName: "Vardar Oak Furniture",
      isFictional: true,
      location: "Invented company in Veles, North Macedonia",
      sector: "Solid oak tables and chairs",
      period: "Financial year 2025, requests in October 2026",
      narrative:
        "Vardar Oak sells 72% to the EU and 41% to one customer, the furniture retailer Hausfeld. Customer, marketing and bank ask for the same facts in one week; the answers come from eleven files that are as messy as real ones.",
      metrics: [
        { label: "Employees", value: "86" },
        { label: "Questionnaire", value: "13 of 16 answered" },
        { label: "Marketing claims", value: "4 of 7 red" },
        { label: "ESG passport", value: "9 of 11 headings" },
      ],
      decisionQuestion:
        "What may you tell a customer, your bank or an online shop when your files only partly prove it?",
      dataLimitations: [
        "The electricity bills run from January to November 2025; the missing December bill is deliberate.",
        "The grid factor of 0.75 kg CO₂e per kWh is a teaching value, not an official one.",
        "The solar plant is planned; 320,000 kWh a year is the supplier's estimate.",
      ],
    },
    materials: materials([
      [
        "Deck · 13 slides",
        "For the projector. The right arrow key shows the next step of a slide and the left one goes back; every prompt has a copy button.",
      ],
      [
        "ESG kit · .zip",
        "START-HERE.md with the setup and the five prompts, the three rules, eleven company files and the three requests, as Markdown and CSV.",
        "Setup, five prompts, eleven company files and three requests.",
      ],
    ]),
  },
};

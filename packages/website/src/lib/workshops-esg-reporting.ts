import type { Locale } from "./i18n/locale";
import type { Workshop, WorkshopMaterial } from "./workshops";
import { ESG_REPORTING_KIT } from "./workshops-esg-reporting-kit";

const base = "/workshops/esg-berichte-mit-ki";

/**
 * Workshop 04, "Answer ESG by Friday". The published deck and kit are written by
 * scripts/workshop04/export-esg-passport.mjs (repository root); every number in this copy is
 * printed in that deck or kit, and the company, its files and its certificates are invented.
 * The agenda follows the deck's 19 slides and the 16 October run sheet. Tim demos Claude while
 * the room plays; the kit is the take-home assignment.
 */

/** Size of crvena-zemja-esg-kit.zip (896,622 bytes), rounded down to the displayed KB. */
const KIT_SIZE_LABEL = "875 KB";

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
      "Vinarija Crvena Zemja, eine erfundene Familienkellerei in der Gemeinde Kavadarci in Nordmazedonien, bekommt in einer Woche drei ESG-Anfragen: den Lieferantenfragebogen ihres schwedischen Importeurs, sieben grüne Werbeaussagen des eigenen Marketings für Deutschland und Polen und das Prüfformular der Bank für einen Solarkredit. Tim demonstriert Claude live auf dem Beamer, während der Raum auf Papier oder dem Handy mitspielt: Die Gruppe sucht Fallen in den Dateien, tippt vor jeder Antwort auf das Ergebnis und stimmt über die Werbeaussagen ab. Zu Hause ist das Kit die selbstgeführte Aufgabe mit einer zehnminütigen Fallensuche, fünf Schritten und einem Lösungsschlüssel zur eigenen Kontrolle.",
    format: "Live-Workshop mit Deck",
    duration: "~60 Minuten",
    accessNote:
      "Das gesamte Material ist auf Englisch. Live führt Tim Claude auf dem Beamer vor und der Raum spielt mit: Ihr sucht Fallen in den Dateien, tippt vor jeder Antwort auf das Ergebnis und stimmt über Werbeaussagen ab, mit Daumen, Karten, Papier oder dem Handy. Kein Laptop und kein Claude-Konto nötig. Zu Hause ist das Kit deine selbstgeführte Aufgabe: zehn Minuten Fallensuche, dann fünf Schritte mit jedem Claude-Plan einschließlich Free und ein Lösungsschlüssel zur Selbstkontrolle. Die Kit-Dateien werden in Claude hochgeladen; alle sind erfunden.",
    outcome: "Selbstgeführtes Kit mit Fallensuche, fünf Prompts und Lösungsschlüssel sowie einer Methode für den nächsten Fragebogen, grünen Claim oder Bankformular aus einem Ordner, mit Quelle und Status je Antwort",
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
      { label: "Kaltstart: Daumen hoch oder runter", minutes: 1, activity: "vote", description: "Würdest du diese Antwort an die Bank schicken?" },
      { label: "Hände, Vermutungen und Setup", minutes: 10, activity: "do", description: "Warum die Anfrage hier landet, der Fall und das Claude-Projekt." },
      { label: "Fallensuche", minutes: 3.5, activity: "do", description: "In Paaren Fallen in den Dateien finden und eine saubere Datei erkennen." },
      { label: "Tipp: der Fragebogen", minutes: 6.5, activity: "vote", description: "Erst tippen, wie viele Antworten belegt sind, dann Claude prüfen." },
      { label: "Abstimmung: die grünen Claims", minutes: 7, activity: "vote", description: "Die Gruppe ordnet sieben Claims Rot, Gelb oder Grün zu." },
      { label: "Wettrennen: das Bankformular", minutes: 4, activity: "do", description: "Die Amortisation zuerst selbst mit dem Handy ausrechnen." },
      { label: "Tipp: der ESG-Pass", minutes: 9, activity: "do", description: "Vor der Auswertung tippen, welche Belege fehlen und wie lange Claude braucht." },
      { label: "Tipp und Prüfung: die Überraschung", minutes: 8, activity: "vote", description: "Vorhersagen, was sich mit dem neuen Dokument ändert, dann den Beleg prüfen." },
      { label: "Exit-Ticket und Abschluss", minutes: 11, activity: "write", description: "Die Methode in drei Karten zusammenfassen und einen eigenen nächsten Schritt festhalten." },
    ],
    agendaSource: "deck",
    minutesLive: 60,
    minutesSelfStudy: 120,
    selfStudyDurationLabel: "Selbstlernen etwa 2 Stunden (etwa 30 Minuten, sobald du Claude kennst)",
    needs: [
      "Live: nichts zu installieren. Ein Stift oder dein Handy für die Abstimmungen.",
      "Zum Nachmachen die Claude-Desktop-App oder claude.ai, jeder Plan",
      "Zu Hause: Codeausführung und Dateierstellung in Claude eingeschaltet (Settings > Capabilities; standardmäßig an)",
      "Zu Hause etwa 2 Stunden für die Fallensuche und fünf Schritte. Du kannst nach jedem Schritt aufhören.",
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
      reviewedAt: "2026-10-15",
      data: "synthetic",
      note: "Firma, Personen, Zahlen, Zertifikate und Dokumente sind erfunden.",
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
          "Claude beantwortet die acht Fragen von Nordvik Vin AB mit Quelle und Status. Prüfe jede Antwort gegen die Dateien.",
        tool: "Prompt 1 · Excel-Datei",
      },
      {
        n: "03",
        title: "Werbeaussagen prüfen",
        description:
          "Prüfe sieben Aussagen gegen die Dateien und finde für jede eine belegbare Fassung.",
        tool: "Prompt 2",
      },
      {
        n: "04",
        title: "Das Bankformular füllen",
        description:
          "Das englische Formular der Banka Povardarie als eine Tabelle ausfüllen, mit Quelle und Status je Feld, und die Amortisation in Code berechnen.",
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
        title: "Eine Überraschung einarbeiten",
        description:
          "Prüfe, welche Antworten das neue Dokument ändert und welche gleich bleiben.",
        tool: "Prompt 5",
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
        { label: "Anfragen", value: "3" },
        { label: "Firmendateien", value: "13" },
        { label: "Versteckte Fallen", value: "7" },
      ],
      decisionQuestion:
        "Was darfst du einem Importeur, deiner Bank oder in einem Regal behaupten, wenn deine Dateien es nur zum Teil belegen?",
      limitationsHeading: "Bevor du startest",
      dataLimitations: [
        "Sieben Fallen und eine saubere Datei sind in den 13 Dateien versteckt. Finde sie, bevor Claude es tut.",
        "Der Tarif von 9,50 MKD pro kWh ist erfunden, kein echter Preis.",
      ],
    },
    materials: materials([
      [
        "Deck · 19 Folien",
        "Für den Beamer. Die Pfeiltaste nach rechts zeigt den nächsten Schritt einer Folie, nach links geht es zurück; jeder Prompt hat einen Kopierknopf.",
      ],
      [
        "ESG-Kit · .zip",
        "START-HERE.md (Fallensuche zum Aufwärmen, Einrichtung, fünf Prompts), ANSWERS.md (Lösungsschlüssel: erst nach jedem Schritt öffnen), project-instructions.md (die drei Regeln), 13 Firmendateien, drei Anfragen und eine Überraschung für Schritt 5.",
        "Aufwärmen, Einrichtung, fünf Prompts, Lösungsschlüssel, 13 Firmendateien, drei Anfragen, eine Überraschung.",
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
      "Vinarija Crvena Zemja, an invented family winery in Kavadarci municipality, North Macedonia, gets three ESG requests in one week: a supplier questionnaire from its Swedish importer, seven green claims from its own marketing team for Germany and Poland, and its bank's screening form for a solar loan. Tim demos Claude live on a projector while the room plays along on paper or phones: the group hunts traps in the files, bets on each result before Claude shows it, and votes on the marketing claims. At home, the kit is a self-guided assignment with a 10-minute trap hunt, five steps and an answer key for checking your work.",
    format: "Live workshop with deck",
    duration: "~60 minutes",
    accessNote:
      "All material is in English. Live, Tim runs Claude on the projector and the room plays along: you hunt traps in the files, bet on each result before Claude shows it, and vote on the marketing claims, with thumbs, cards, paper or your phone. No laptop, no Claude account. At home, the kit is your take-home assignment: a 10-minute trap hunt, then the five steps on any Claude plan, including Free, and an answer key to check yourself. The kit's files are uploaded to Claude; all of them are fictional.",
    outcome: "A self-guided kit (trap hunt, five prompts, answer key) and a method to answer your next questionnaire, green claim or bank form from one folder, with a source and a status for every answer.",
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
      { label: "Cold open: thumbs", minutes: 1, activity: "vote", description: "Would you send this answer to the bank?" },
      { label: "Hands, guesses and setup", minutes: 10, activity: "do", description: "Why the request lands here, the case and the Claude Project." },
      { label: "Trap hunt", minutes: 3.5, activity: "do", description: "Find traps in the files in pairs and identify one clean file." },
      { label: "Bet: the questionnaire", minutes: 6.5, activity: "vote", description: "Predict how many answers are supported, then check Claude's work." },
      { label: "Vote: the green claims", minutes: 7, activity: "vote", description: "Classify seven claims as RED, AMBER or GREEN." },
      { label: "Race: the bank form", minutes: 4, activity: "do", description: "Work out the payback with your phone calculator first." },
      { label: "Bet: the ESG passport", minutes: 9, activity: "do", description: "Predict which evidence is missing and how long Claude will take." },
      { label: "Bet and audit: one more surprise", minutes: 8, activity: "vote", description: "Predict what changes with the new document, then check it." },
      { label: "Exit ticket and close", minutes: 11, activity: "write", description: "Summarize the method on three cards and name your next step." },
    ],
    agendaSource: "deck",
    minutesLive: 60,
    minutesSelfStudy: 120,
    selfStudyDurationLabel: "self-paced about 2 hours (about 30 min once you know Claude)",
    needs: [
      "Live: nothing to install. A pen, or your phone for the votes.",
      "To replay it, the Claude desktop app or claude.ai, any plan",
      "At home: code execution and file creation switched on in Claude (Settings > Capabilities; on by default)",
      "About 2 hours at home for the warm-up and five steps. You can stop after any step.",
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
      reviewedAt: "2026-10-15",
      data: "synthetic",
      note: "The company, people, numbers, certificates and documents are invented.",
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
          "Claude answers Nordvik Vin AB's eight questions with source and status. Check each answer against the files.",
        tool: "Prompt 1 · Excel file",
      },
      {
        n: "03",
        title: "Check the green claims",
        description:
          "Check seven claims against the files and find a version you can prove today.",
        tool: "Prompt 2",
      },
      {
        n: "04",
        title: "Fill the bank form",
        description:
          "Fill in Banka Povardarie's English form as one table, with a source and status for each field, and work out the payback in code.",
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
        title: "Add one more surprise",
        description:
          "Check which answers change with the new document and which stay the same.",
        tool: "Prompt 5",
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
        { label: "Requests", value: "3" },
        { label: "Company files", value: "13" },
        { label: "Hidden traps", value: "7" },
      ],
      decisionQuestion:
        "What may you tell an importer, your bank or a shop shelf when your files only partly prove it?",
      limitationsHeading: "Before you start",
      dataLimitations: [
        "Seven traps and one clean file are hidden in the 13 files. Find them before Claude does.",
        "The tariff of 9.50 MKD per kWh is invented, not a real price.",
      ],
    },
    materials: materials([
      [
        "Deck · 19 slides",
        "For the projector. The right arrow key shows the next step of a slide and the left one goes back; every prompt has a copy button.",
      ],
      [
        "ESG kit · .zip",
        "START-HERE.md (warm-up trap hunt, setup, five prompts), ANSWERS.md (the answer key: open it only after each step), project-instructions.md (the three rules), 13 project files, three requests and one surprise for step 5.",
        "Warm-up, setup, five prompts, answer key, 13 company files, three requests, one surprise.",
      ],
    ]),
    kit: ESG_REPORTING_KIT.en,
  },
};

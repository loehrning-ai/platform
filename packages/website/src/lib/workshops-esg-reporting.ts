import type { Locale } from "./i18n/locale";
import type { Workshop, WorkshopMaterial } from "./workshops";
import { ESG_REPORTING_KIT } from "./workshops-esg-reporting-kit";

const base = "/workshops/esg-berichte-mit-ki";

/**
 * Workshop 04, "ESG Reporting with AI: From Raw Inputs to Clearer Insights". The published deck is
 * written by scripts/workshop04/export-esg-passport.mjs, the two kit editions (v3, "Nachweisprobe")
 * by scripts/workshop04/kit-v3.mjs (repository root). Every number in this copy is printed in the
 * deck or the kit, and the company, its files and its certificates are invented. The agenda follows
 * the deck's 19 slides and the 16 October run sheet. Tim demos Claude while the room plays; the kit
 * is the take-home assignment.
 */

/**
 * Size of crvena-zemja-esg-kit.zip, rounded down to whole KB; workshops-esg-reporting.test.ts checks it
 * against the file. The workshop ran in English, so the page lists the English edition; the German
 * edition (crvena-zemja-nachweisprobe.zip) is named in the kit text and handed out by the demo.
 */
const KIT_SIZE_LABEL = "897 KB";

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
    title: "ESG-Berichte mit KI",
    eyebrow: "Workshop 04 · ESG",
    summary:
      "Drei ESG-Anfragen an ein Weingut. Claude beantwortet sie aus einem Ordner: mit Datei und Zeile oder mit dem Dokument, das fehlt.",
    description:
      "Vinarija Crvena Zemja, ein erfundenes Familienweingut in der Gemeinde Kavadarci in Nordmazedonien, hat drei ESG-Anfragen offen: den Fragebogen seines schwedischen Importeurs, sieben Umweltaussagen des eigenen Marketings für deutsche Regale und die Website und das Prüfformular der Bank für einen Solarkredit. Tim zeigt Claude live auf dem Beamer, der Raum arbeitet auf Papier oder dem Handy mit: Die Gruppe sucht Mängel in den Dateien, sagt vor jeder Antwort das Ergebnis voraus und entscheidet über die Werbeaussagen.",
    format: "Live-Workshop mit Deck",
    duration: "~60 Minuten",
    accessNote:
      "Live reicht ein Handy oder Papier. Zu Hause gehen nur die erfundenen Dateien in Claude.",
    outcome:
      "Ein Nachweisregister: jede Antwort mit Datei und Zeile oder dem fehlenden Dokument. Dazu ein Claude-Skill, der die Nachweisprobe bei jeder neuen Anfrage anwendet.",
    stageExplainer: {
      heading: "Was ist das Kit?",
      body:
        "Eine Zip mit 13 erfundenen Firmendateien, drei Anfragen, fünf Prompts und der Nachweisprobe auf einer Seite. Du legst sie in ein Claude-Projekt und prüfst jede Antwort gegen die Dateien. Beim ersten Mal etwa 90 Minuten.",
      facts: ["13 Dateien", "5 Prompts", "ca. 90 Min. allein"],
    },
    audience: [
      "Geschäftsführung und Verwaltung kleiner Firmen, bei denen ESG-Fragebögen landen",
      "Vertrieb und Marketing, die grüne Aussagen über Produkte machen wollen",
      "Finanzteams, die Banken ESG-Angaben zu Krediten liefern",
    ],
    notForYou:
      "Nicht für dich, wenn du einen vollständigen CSRD- oder VSME-Bericht erstellen oder eine Treibhausgasbilanz von Grund auf lernen willst.",
    question:
      "Welche unserer ESG-Antworten belegen unsere Dateien, und welches Dokument fehlt für den Rest?",
    outcomes: [
      "Du prüfst jede Antwort mit der Nachweisprobe: Zitat, Zeitraum, Umfang, Stand.",
      "Du lässt Claude einen Fragebogen und ein Bankformular füllen, jede Antwort BELEGT, SCHWACH oder LÜCKE.",
      "Du prüfst Werbeaussagen zuerst gegen die Verbotsliste der EU und streichst, was keine Datei trägt.",
      "Du erkennst, welche Antworten sich mit einem nachgereichten Dokument ändern, und lässt Claude sie nachziehen.",
    ],
    agenda: [
      { label: "Kaltstart: Daumen hoch oder runter", minutes: 1, activity: "vote", description: "Würdest du diese Antwort an die Bank schicken?" },
      { label: "Hände, Vermutungen und Setup", minutes: 10, activity: "do", description: "Warum die Anfrage hier landet, der Fall und das Claude-Projekt." },
      { label: "Durchsicht der Dateien", minutes: 3.5, activity: "do", description: "In Paaren Mängel in den Dateien finden und die saubere Datei erkennen." },
      { label: "Vorhersage: der Fragebogen", minutes: 6.5, activity: "vote", description: "Erst vorhersagen, wie viele Antworten belegt sind, dann Claude prüfen." },
      { label: "Abstimmung: die Werbeaussagen", minutes: 7, activity: "vote", description: "Die Gruppe entscheidet für sieben Aussagen: darf raus oder streichen." },
      { label: "Selbst rechnen: das Bankformular", minutes: 4, activity: "do", description: "Die Amortisation zuerst selbst mit dem Handy ausrechnen." },
      { label: "Vorhersage: das Nachweisregister", minutes: 9, activity: "do", description: "Vor der Auswertung vorhersagen, welche Dokumente fehlen." },
      { label: "Die nachgereichte Rechnung", minutes: 8, activity: "vote", description: "Vorhersagen, was sich mit dem neuen Dokument ändert, dann die Rechnung prüfen." },
      { label: "Exit-Ticket und Abschluss", minutes: 11, activity: "write", description: "Die Methode in drei Karten zusammenfassen und einen eigenen nächsten Schritt festhalten." },
    ],
    agendaSource: "deck",
    minutesLive: 60,
    minutesSelfStudy: 90,
    selfStudyDurationLabel: "Allein ca. 90 Min.",
    needs: [
      "Live: nichts zu installieren, ein Stift oder dein Handy für die Abstimmungen",
      "Zu Hause: Claude (App oder claude.ai, jeder Plan) mit Codeausführung und Dateierstellung („Settings“, „Capabilities“, standardmäßig an)",
    ],
    notNeeded: [
      "Programmierkenntnisse",
      "Einen API-Schlüssel",
      "Vorwissen zu CSRD oder VSME",
      "Eigene Firmendaten",
    ],
    notCovered: [
      "Rechtsberatung und Prüfung eines echten Berichts",
      "Eine vollständige Treibhausgasbilanz",
      "Echte Stromtarife",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-25",
      data: "synthetic",
      note: "Auch Zertifikate und Dokumente sind erfunden; zitierte Gesetze und Regeln sind echt. Keine Rechtsberatung.",
    },
    steps: [
      {
        n: "01",
        title: "Das Projekt anlegen",
        description:
          "Ein Claude-Projekt bekommt 13 Firmendateien und drei Regeln: nur unsere Dateien, Datei und Zeile nennen, LÜCKE oder SCHWACH statt Schätzung.",
        tool: "Schritt 0 · Claude-Projekt",
      },
      {
        n: "02",
        title: "Den Importeur beantworten",
        description:
          "Claude beantwortet die acht Fragen von Nordvik Vin AB mit Datei, Zeile und Status. Prüfe jede Antwort gegen die Dateien.",
        tool: "Prompt 1",
      },
      {
        n: "03",
        title: "Werbeaussagen prüfen",
        description:
          "Prüfe sieben Aussagen zuerst gegen die Verbotsliste, dann gegen die Dateien. Was keine Datei trägt, wird gestrichen.",
        tool: "Prompt 2",
      },
      {
        n: "04",
        title: "Das Bankformular füllen",
        description:
          "Das Formular der Banka Povardarie als eine Tabelle ausfüllen, mit Datei, Zeile und Status je Feld, und die Amortisation in Code berechnen.",
        tool: "Prompt 3",
      },
      {
        n: "05",
        title: "Das Nachweisregister bauen",
        description:
          "Alle 21 Antworten in einer Tabelle, dazu die elf Angaben des VSME-Basismoduls und eine Liste der Dokumente, die du anfordern musst.",
        tool: "Prompt 4 · Excel-Datei",
      },
      {
        n: "06",
        title: "Ein nachgereichtes Dokument einarbeiten",
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
        "Crvena Zemja exportiert 74 % des Umsatzes, nach Deutschland, an den schwedischen Importeur Nordvik Vin AB und nach Polen. Importeur, Marketing und Bank fragen nach denselben Fakten; die Antworten kommen aus 13 Dateien, die so unordentlich sind wie echte.",
      metrics: [
        { label: "Beschäftigte", value: "42" },
        { label: "Anfragen", value: "3" },
        { label: "Firmendateien", value: "13" },
        { label: "Mängel in den Dateien", value: "8" },
      ],
      decisionQuestion:
        "Was darfst du einem Importeur, deiner Bank oder in einem Regal sagen, wenn deine Dateien es nur zum Teil belegen?",
      limitationsHeading: "Bevor du startest",
      dataLimitations: [
        "Acht Mängel stecken in den Dateien, eine Datei ist sauber. Finde sie vor Claude.",
        "Der Tarif von 9,50 MKD pro kWh ist erfunden.",
      ],
    },
    materials: materials([
      [
        "Deck · 19 Folien",
        "Für den Beamer. Die Pfeiltaste nach rechts zeigt den nächsten Schritt einer Folie, nach links geht es zurück; jeder Prompt hat einen Kopierknopf.",
      ],
      [
        "Nachweisprobe-Kit · .zip",
        "START-HERE.md (Durchsicht, Einrichtung, fünf Prompts), evidence-check.md (die Nachweisprobe auf einer Seite), project-instructions.md (die drei Regeln), 13 Firmendateien, drei Anfragen, eine nachgereichte Rechnung für Schritt 5, ANSWERS.md und der Skill esg-nachweise mit Vorlagen.",
        "Fünf Prompts, Lösungen, 13 Dateien, drei Anfragen, Skill.",
      ],
    ]),
    kit: ESG_REPORTING_KIT.de,
  },
  en: {
    slug: "esg-berichte-mit-ki",
    number: "04",
    topic: "ESG",
    title: "ESG reports with AI",
    eyebrow: "Workshop 04 · ESG",
    summary:
      "Three ESG requests to one winery. Claude answers from one folder: with a file and a line, or with the document that is missing.",
    description:
      "Vinarija Crvena Zemja, an invented family winery in Kavadarci municipality, North Macedonia, has three ESG requests open: a questionnaire from its Swedish importer, seven environmental claims from its own marketing team for German shelves and the website, and its bank's screening form for a solar loan. Tim demos Claude live on a projector while the room works along on paper or phones: the group finds defects in the files, predicts each result before Claude shows it, and decides on the marketing claims.",
    format: "Live workshop with deck",
    duration: "~60 minutes",
    accessNote:
      "Live, a phone or paper is enough. At home, only the invented files go into Claude.",
    outcome:
      "An evidence register: every answer with a file and line, or with the missing document. Plus a Claude skill that applies the evidence check to every new request.",
    stageExplainer: {
      heading: "What is the kit?",
      body:
        "A zip with 13 invented company files, three requests, five prompts and the evidence check on one page. You put them into a Claude Project and check every answer against the files. About 90 minutes the first time.",
      facts: ["13 files", "5 prompts", "about 90 min alone"],
    },
    audience: [
      "Owners and office staff of small firms who receive ESG questionnaires",
      "Sales and marketing teams who want to make green product claims",
      "Finance teams who give banks ESG information for loans",
    ],
    notForYou:
      "Not for you if you want to write a full CSRD or VSME report or learn greenhouse gas accounting from scratch.",
    question:
      "Which of our ESG answers do our files prove, and which document is missing for the rest?",
    outcomes: [
      "Check every answer with the evidence check: quote, period, scope, final.",
      "Have Claude fill a questionnaire and a bank form, every answer COVERED, WEAK or GAP.",
      "Check marketing claims against the EU ban list first, and drop what no file carries.",
      "Spot which answers change when a late document arrives, and have Claude update them.",
    ],
    agenda: [
      { label: "Cold open: thumbs", minutes: 1, activity: "vote", description: "Would you send this answer to the bank?" },
      { label: "Hands, guesses and setup", minutes: 10, activity: "do", description: "Why the request lands here, the case and the Claude Project." },
      { label: "Review of the files", minutes: 3.5, activity: "do", description: "Find defects in the files in pairs and identify the clean file." },
      { label: "Prediction: the questionnaire", minutes: 6.5, activity: "vote", description: "Predict how many answers are covered, then check Claude's work." },
      { label: "Vote: the marketing claims", minutes: 7, activity: "vote", description: "Decide for each of seven claims: send or drop." },
      { label: "Work it out: the bank form", minutes: 4, activity: "do", description: "Work out the payback with your phone calculator first." },
      { label: "Prediction: the evidence register", minutes: 9, activity: "do", description: "Predict which documents are missing before the result." },
      { label: "The late invoice", minutes: 8, activity: "vote", description: "Predict what changes with the new document, then check the invoice." },
      { label: "Exit ticket and close", minutes: 11, activity: "write", description: "Summarize the method on three cards and name your next step." },
    ],
    agendaSource: "deck",
    minutesLive: 60,
    minutesSelfStudy: 90,
    selfStudyDurationLabel: "solo about 90 min",
    needs: [
      "Live: nothing to install, a pen or your phone for the votes",
      "At home: Claude (app or claude.ai, any plan) with code execution and file creation on (“Settings”, “Capabilities”, on by default)",
    ],
    notNeeded: [
      "Programming skills",
      "An API key",
      "Prior knowledge of CSRD or VSME",
      "Your own company data",
    ],
    notCovered: [
      "Legal advice or an audit of a real report",
      "A full greenhouse gas inventory",
      "Real electricity tariffs",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-25",
      data: "synthetic",
      note: "Certificates and documents are invented too; the laws and rules cited are real. Not legal advice.",
    },
    steps: [
      {
        n: "01",
        title: "Set up the Project",
        description:
          "A Claude Project gets 13 company files and three rules: only our files, name file and line, GAP or WEAK instead of a guess.",
        tool: "Step 0 · Claude Project",
      },
      {
        n: "02",
        title: "Answer the importer",
        description:
          "Claude answers Nordvik Vin AB's eight questions with file, line and status. Check each answer against the files.",
        tool: "Prompt 1",
      },
      {
        n: "03",
        title: "Check the green claims",
        description:
          "Check seven claims against the ban list first, then against the files. What no file carries is dropped.",
        tool: "Prompt 2",
      },
      {
        n: "04",
        title: "Fill the bank form",
        description:
          "Fill in Banka Povardarie's form as one table, with file, line and status for each field, and work out the payback in code.",
        tool: "Prompt 3",
      },
      {
        n: "05",
        title: "Build the evidence register",
        description:
          "All 21 answers in one table, plus the eleven disclosures of the VSME Basic Module and a list of the documents you need to request.",
        tool: "Prompt 4 · Excel file",
      },
      {
        n: "06",
        title: "Work in a late document",
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
        "Crvena Zemja exports 74% of its revenue, to Germany, to the Swedish importer Nordvik Vin AB and to Poland. Importer, marketing and bank ask for the same facts; the answers come from 13 files that are as messy as real ones.",
      metrics: [
        { label: "Employees", value: "42" },
        { label: "Requests", value: "3" },
        { label: "Company files", value: "13" },
        { label: "Defects in the files", value: "8" },
      ],
      decisionQuestion:
        "What may you tell an importer, your bank or a shop shelf when your files only partly prove it?",
      limitationsHeading: "Before you start",
      dataLimitations: [
        "Eight defects are in the files, and one file is clean. Find them before Claude does.",
        "The tariff of 9.50 MKD per kWh is invented.",
      ],
    },
    materials: materials([
      [
        "Deck · 19 slides",
        "For the projector. The right arrow key shows the next step of a slide and the left one goes back; every prompt has a copy button.",
      ],
      [
        "Evidence check kit · .zip",
        "START-HERE.md (review, setup, five prompts), evidence-check.md (the evidence check on one page), project-instructions.md (the three rules), 13 company files, three requests, a late invoice for step 5, ANSWERS.md and the skill esg-nachweise with templates.",
        "Five prompts, answers, 13 files, three requests, skill.",
      ],
    ]),
    kit: ESG_REPORTING_KIT.en,
  },
};

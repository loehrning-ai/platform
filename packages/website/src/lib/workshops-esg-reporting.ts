import type { Locale } from "./i18n/locale";
import type { Workshop, WorkshopMaterial } from "./workshops";
import { ESG_REPORTING_KIT } from "./workshops-esg-reporting-kit";
import { DECK_KEYS } from "./deck-keys-copy";

const base = "/workshops/esg-berichte-mit-ki";

/**
 * Workshop 04, "ESG Reporting with AI: From Raw Inputs to Clearer Insights". The published deck is
 * written by scripts/workshop04/export-esg-passport.mjs, the two kit editions (v3, "Nachweisprobe")
 * by scripts/workshop04/kit-v3.mjs (repository root). Every number in this copy is printed in the
 * deck or the kit, and the company, its files and its certificates are invented. The deck has a German
 * edition (slides.html) and an English one (en/slides.html), 20 slides each (17 main slides plus an appendix of 3); the
 * agenda follows the planned time in its speaker notes. Tim drives Claude Desktop on the projector while the room
 * predicts and checks; the kit is the take-home assignment.
 */

/**
 * Sizes of the two kit editions, rounded down to whole KB; workshops-esg-reporting.test.ts checks them
 * against the files. Each locale links its own edition: crvena-zemja-nachweisprobe.zip (German) on the
 * German page, crvena-zemja-esg-kit.zip (English) on the English one, the same kit the demo hands out.
 */
const KIT_SIZE_LABEL: Readonly<Record<Locale, string>> = { de: "838 KB", en: "901 KB" };

type MaterialFrame = Omit<WorkshopMaterial, "label" | "description" | "sizeLabel">;

/** Href, kind, language, role and phase: each locale links its own deck edition and its own kit edition. */
const MATERIALS: Readonly<Record<Locale, readonly MaterialFrame[]>> = {
  de: [
    { href: `${base}/slides.html`, kind: "html", language: "de", role: "deck", phase: "during", minutes: 60, primary: true },
    { href: `${base}/crvena-zemja-nachweisprobe.zip`, kind: "zip", language: "de", role: "kit", phase: "after" },
  ],
  en: [
    { href: `${base}/en/slides.html`, kind: "html", language: "en", role: "deck", phase: "during", minutes: 60, primary: true },
    { href: `${base}/crvena-zemja-esg-kit.zip`, kind: "zip", language: "en", role: "kit", phase: "after" },
  ],
};

/** Label, description and, where the first sentence runs long on a phone, its short phone wording. */
type MaterialCopy = readonly [label: string, description: string, short?: string];

function materials(locale: Locale, copy: readonly MaterialCopy[]): readonly WorkshopMaterial[] {
  const frames = MATERIALS[locale];
  if (copy.length !== frames.length) throw new Error("Workshop 04: material copy does not match the material list");
  return frames.map((frame, index) => {
    const [label, description, short] = copy[index];
    const text = short === undefined ? { label, description } : { label, description, short };
    return frame.kind === "zip" ? { ...frame, ...text, sizeLabel: KIT_SIZE_LABEL[locale] } : { ...frame, ...text };
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
      "Das erfundene Weingut Crvena Zemja muss Importeur, Marketing und Bank antworten. Welche der 21 Aussagen tragen die 13 Dateien?",
    lede: "Ein Weingut muss drei ESG-Anfragen beantworten: Tim prüft 13 Dateien live in Claude, der Raum schätzt und prüft mit.",
    description:
      "Seit dem 27.09.2026 darf in Deutschland kein Produkt mehr wegen gekaufter CO₂-Zertifikate als klimaneutral oder emissionsärmer beworben werden, und Banken in Nordmazedonien vergeben grüne Kredite der EBRD. Vinarija Crvena Zemja, ein erfundenes Familienweingut in der Gemeinde Kavadarci in Nordmazedonien, hat drei ESG-Anfragen offen: den Fragebogen seines schwedischen Importeurs, sieben Umweltaussagen des eigenen Marketings für deutsche Regale und die Website und das Prüfformular der Bank für einen Solarkredit. Tim zeigt Claude live auf dem Beamer, der Raum arbeitet auf Papier oder dem Handy mit: Die Gruppe sucht Mängel in den Dateien, sagt vor jeder Antwort das Ergebnis voraus und entscheidet über die Werbeaussagen.",
    format: "Live-Workshop mit Deck",
    duration: "~60 Minuten",
    accessNote:
      "Live reicht ein Handy oder Papier. Zu Hause gehen nur die erfundenen Dateien in Claude.",
    outcome:
      "Ein Nachweisregister: jede Antwort mit Datei und Zeile oder dem fehlenden Dokument. Dazu ein Claude-Skill, der die Nachweisprobe bei jeder neuen Anfrage anwendet.",
    stageExplainer: {
      heading: "Was prüfen wir?",
      body:
        "ESG steht für Umwelt, Soziales und Unternehmensführung. Importeur, Marketing und Bank wollen Belege. Das Kit enthält 13 erfundene Dateien, drei Anfragen und fünf Prompts zum Nacharbeiten in Claude oder Codex.",
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
      "Du prüfst jede Antwort mit der Nachweisprobe: Zitat, Zeitraum, Umfang, Freigabe.",
      "Du lässt Claude einen Fragebogen und ein Bankformular füllen, jede Antwort BELEGT, SCHWACH oder LÜCKE.",
      "Du prüfst Werbeaussagen zuerst gegen die Verbotsliste der EU und streichst, was keine Datei trägt.",
      "Du erkennst, welche Antworten sich mit einem nachgereichten Dokument ändern, und lässt Claude sie nachziehen.",
    ],
    agenda: [
      { label: "Der Fall", minutes: 7, activity: "listen", description: "Das Weingut, drei Anfragen und die Entscheidung; danach die Regeln für deutsche Werbung, grüne Kredite und norwegische Verpackungen." },
      { label: "Heute und die Regel", minutes: 6, activity: "do", description: "Ein Satz gegen seine Datei: Zitat, Zeitraum, Umfang und Freigabe prüfen." },
      { label: "Kit und Durchsicht auf Papier", minutes: 12, activity: "do", description: "Was im Kit liegt, dann zu zweit auf Papier: Datei, Zeile und welche Prüfung scheitert." },
      { label: "Das Claude-Projekt, live", minutes: 4, activity: "listen", description: "Tim legt das Projekt in Claude Desktop an: Anweisungen, 13 Dateien, Codeausführung." },
      { label: "Schritt 1: der Fragebogen", minutes: 7, activity: "do", description: "Die Stromdaten auf Vollständigkeit prüfen, dann Claudes Antworten an den zitierten Zeilen kontrollieren." },
      { label: "Schritt 2: die Werbeaussagen", minutes: 6, activity: "do", description: "Werbeaussagen zuerst gegen die Verbotsliste, dann gegen ihre Belege prüfen." },
      { label: "Schritt 3: das Bankformular", minutes: 5, activity: "do", description: "Eine Zeile selbst mit dem Handy nachrechnen, dann rechnet Claude." },
      { label: "Schritt 4: das Register", minutes: 4, activity: "do", description: "Alle 21 Antworten in einer Excel-Datei, und welches Dokument zuerst fehlt." },
      { label: "Schritt 5: die Nachreichung", minutes: 5, activity: "do", description: "Die fehlende Rechnung kommt. Stromverbrauch nachrechnen und betroffene Antworten prüfen." },
      { label: "Gemessen und Mitnehmen", minutes: 4, activity: "listen", description: "Was wir mit Claude gemessen haben, dann Kit, Skill und Demo für zu Hause." },
    ],
    agendaSource: "deck",
    minutesLive: 60,
    minutesSelfStudy: 90,
    selfStudyDurationLabel: "Allein ca. 90 Min.",
    needs: [
      "Live: Tim bedient Claude. Du prüfst die Quellen und rechnest mit; ein Stift und ein Handy reichen.",
      "Zu Hause: Claude (App oder claude.ai, jeder Plan) mit Codeausführung und Dateierstellung, oder Codex mit dem entpackten Kit-Ordner; Anleitung in START-HIER.md",
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
      reviewedAt: "2026-10-29",
      aiOutputsRecordedAt: "2026-10-26",
      data: "synthetic",
      note: "Das Weingut, seine Zertifikate und Dokumente sind erfunden; zitierte Gesetze und Regeln sind echt. Keine Rechtsberatung.",
    },
    steps: [
      {
        n: "01",
        title: "Das Projekt anlegen",
        description:
          "Ein Claude-Projekt bekommt 13 Firmendateien und drei Regeln: nur unsere Dateien, Datei und Zeile nennen, LÜCKE oder SCHWACH statt Schätzung.",
        tool: "Einrichtung · Claude-Projekt",
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
    materials: materials("de", [
      [
        "Deck · 17 Folien",
        `Für den Beamer. Jeder Prompt hat einen Kopierknopf. ${DECK_KEYS.de}`,
      ],
      [
        "Nachweisprobe-Kit · .zip",
        "START-HIER.md (Durchsicht, Einrichtung, fünf Prompts), nachweisprobe.md (die Nachweisprobe auf einer Seite), projektanweisungen.md (die drei Regeln), 13 Firmendateien, drei Anfragen, eine nachgereichte Rechnung für Schritt 5, LOESUNGEN.md und der Skill esg-nachweise mit Vorlagen.",
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
      "The invented winery Crvena Zemja must answer an importer, marketing and a bank. Which of its 21 answers do the 13 files support?",
    lede: "A winery must answer three ESG requests: Tim checks 13 files live in Claude while the room predicts and checks the evidence.",
    description:
      "Since 27.09.2026 no product in Germany may be advertised as climate neutral or lower-emission because of bought carbon credits, and banks in North Macedonia lend green money from the EBRD. Vinarija Crvena Zemja, an invented family winery in Kavadarci municipality, North Macedonia, has three ESG requests open: a questionnaire from its Swedish importer, seven environmental claims from its own marketing team for German shelves and the website, and its bank's screening form for a solar loan. Tim demos Claude live on a projector while the room works along on paper or phones: the group finds defects in the files, predicts each result before Claude shows it, and decides on the marketing claims.",
    format: "Live workshop with deck",
    duration: "~60 minutes",
    accessNote:
      "Live, a phone or paper is enough. At home, only the invented files go into Claude.",
    outcome:
      "An evidence register: every answer with a file and line, or with the missing document. Plus a Claude skill that applies the evidence check to every new request.",
    stageExplainer: {
      heading: "What do we check?",
      body:
        "ESG means environment, social matters and governance. An importer, marketing and a bank need evidence. The kit has 13 invented files, three requests and five prompts to work through at home in Claude or Codex.",
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
      "Check every answer with the evidence check: quote, period, scope, approval.",
      "Have Claude fill a questionnaire and a bank form, every answer COVERED, WEAK or GAP.",
      "Check marketing claims against the EU ban list first, and drop what no file carries.",
      "Spot which answers change when a late document arrives, and have Claude update them.",
    ],
    agenda: [
      { label: "The case", minutes: 7, activity: "listen", description: "The winery, three requests and the decision; then the rules for German marketing, green loans and Norwegian packaging." },
      { label: "Today and the rule", minutes: 6, activity: "do", description: "One sentence against its file: check quote, period, scope and approval." },
      { label: "Kit and review on paper", minutes: 12, activity: "do", description: "What is in the kit, then in pairs on paper: file, line and which check fails." },
      { label: "The Claude project, live", minutes: 4, activity: "listen", description: "Tim sets up the project in Claude Desktop: instructions, 13 files, code execution." },
      { label: "Step 1: the questionnaire", minutes: 7, activity: "do", description: "Check whether the electricity records are complete, then check Claude’s answers against the cited lines." },
      { label: "Step 2: the marketing claims", minutes: 6, activity: "do", description: "Check marketing claims against the ban list first, then against their evidence." },
      { label: "Step 3: the bank form", minutes: 5, activity: "do", description: "Work out one line on your phone yourself, then Claude calculates." },
      { label: "Step 4: the register", minutes: 4, activity: "do", description: "All 21 answers in one Excel file, and which document is missing first." },
      { label: "Step 5: the late document", minutes: 5, activity: "do", description: "The missing invoice arrives. Recalculate electricity use and check the affected answers." },
      { label: "Measured and take home", minutes: 4, activity: "listen", description: "What we measured with Claude, then kit, skill and demo for home." },
    ],
    agendaSource: "deck",
    minutesLive: 60,
    minutesSelfStudy: 90,
    selfStudyDurationLabel: "solo about 90 min",
    needs: [
      "Live: Tim operates Claude. You check the sources and calculations; a pen and a phone are enough.",
      "At home: Claude (app or claude.ai, any plan) with code execution and file creation, or Codex with the unzipped kit folder; setup in START-HERE.md",
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
      reviewedAt: "2026-10-29",
      aiOutputsRecordedAt: "2026-10-26",
      data: "synthetic",
      note: "The winery, its certificates and its documents are invented; the laws and rules cited are real. Not legal advice.",
    },
    steps: [
      {
        n: "01",
        title: "Set up the Project",
        description:
          "A Claude Project gets 13 company files and three rules: only our files, name file and line, GAP or WEAK instead of a guess.",
        tool: "Setup · Claude Project",
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
    materials: materials("en", [
      [
        "Deck · 17 slides",
        `For the projector. Every prompt has a copy button. ${DECK_KEYS.en}`,
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

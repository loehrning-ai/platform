import type { Locale } from "./i18n/locale";
import type { WorkshopKit } from "./workshop-kit";

/**
 * The kit block of workshop 04 (the page /workshops/esg-berichte-mit-ki/kit), kit v3
 * "Nachweisprobe". Each locale offers its own edition: crvena-zemja-nachweisprobe.zip (German) and
 * crvena-zemja-esg-kit.zip (English), the same kit; howTo names the other one. The rules repeat project-instructions.md (EN) and
 * projektanweisungen.md (DE); workshops-esg-reporting.test.ts checks that against the zips.
 */
export const ESG_REPORTING_KIT: Readonly<Record<Locale, WorkshopKit>> = {
  de: {
    fileName: "crvena-zemja-nachweisprobe.zip",
    title: "Das Nachweisprobe-Kit",
    lead: "Prüfe ESG-Antworten an den Quelldateien und erstelle ein Excel-Nachweisregister. Du übst denselben Weingut-Fall, den Tim in Claude Desktop zeigt.",
    stats: [
      { value: "13", label: "Dateien" },
      { value: "5", label: "Prompts" },
      { value: "3", label: "Regeln" },
    ],
    rulesHeading: "Regeln",
    rules: [
      "Nur unsere Dateien. Erfinde keine Zahl, schätze nicht, ergänze nichts aus dem Internet.",
      "Nenne für jede Angabe Datei und Zeile (Zeilen wie im Texteditor, jede Zeile zählt). Rechne im Code, mit Einheiten. Zähle vor jeder Jahressumme die eindeutigen Monate: Gleiche Rechnungsnummer zählt einmal.",
      "Nachweisprobe für jede Antwort: Zitat, Zeitraum, Umfang, Freigabe. BELEGT, wenn alle vier halten. SCHWACH, wenn die Datei abgelaufen, geschätzt, ein Entwurf, nicht freigegeben oder im Widerspruch zu einer anderen Datei ist. LÜCKE, wenn keine Datei es sagt oder ein Teil keine Datei hat, mit dem Dokument, das es belegen würde. Der schwächste Teil zählt.",
    ],
    rulesShort: [
      "Nur unsere Dateien. Keine erfundene Zahl.",
      "Zu jeder Angabe Datei und Zeile. Jede Rechnung im Code, mit Einheiten.",
      "BELEGT, SCHWACH oder LÜCKE. Der schwächste Teil entscheidet.",
    ],
    stepsHeading: "Die Prompts",
    steps: [
      {
        tag: "Prompt 1",
        title: "Der Fragebogen",
        input: "Der Nachhaltigkeitsfragebogen von Nordvik Vin AB mit acht Fragen.",
        action: "Zählt die Strommonate im Code und beantwortet jede Frage mit Datei, Zeile und Status.",
        output: "Eine Tabelle mit genau einer Zeile je Frage und dem fehlenden Dokument, wo eines fehlt.",
        note: "Wie viele der 8 Fragen sind belegt? Sag es zuerst voraus, dann prüf es in LOESUNGEN.md.",
      },
      {
        tag: "Prompt 2",
        title: "Die Werbeaussagen",
        input: "Sieben Umweltaussagen des Marketings für deutsche Regale und die Website.",
        action: "Prüft jede Aussage zuerst gegen die Verbotsliste der EU, dann mit der Nachweisprobe.",
        output: "Eine Tabelle: Verbotsliste, Status, darf raus oder nicht, und eine sichere Fassung, wo eine Datei sie trägt.",
        note: "Entscheide für jede Aussage zuerst selbst: darf raus oder streichen.",
      },
      {
        tag: "Prompt 3",
        title: "Das Bankformular",
        input: "Das Prüfformular der Banka Povardarie für den Solarkredit.",
        action: "Füllt das Formular als eine Tabelle aus, mit Datei, Zeile und Status für jedes Feld, und rechnet die Amortisation im Code.",
        output: "Das ausgefüllte Formular, jede Schätzung ist markiert.",
        note: "Rechne die Amortisation zuerst selbst mit dem Taschenrechner deines Handys aus.",
      },
      {
        tag: "Prompt 4",
        title: "Das Nachweisregister",
        input: "Die drei Anfragen noch einmal, dazu die elf Angaben des VSME-Basismoduls.",
        action: "Legt alle 21 Antworten in ein Register, ordnet sie den VSME-Angaben zu und listet jedes fehlende Dokument einmal.",
        output: "Eine Excel-Datei mit den Blättern Register, VSME und Anfordern.",
        file: "nachweisregister.xlsx",
        note: "Lücken werden benannt, nicht gefüllt.",
      },
      {
        tag: "Prompt 5",
        title: "Die nachgereichte Rechnung",
        input: "Ein Dokument, das die Buchhaltung nachreicht, als Foto.",
        action: "Liest das Dokument, prüft es in sich, prüft jede davon betroffene Antwort neu und aktualisiert das Register.",
        output: "Eine Tabelle mit Wo, vorher, jetzt und warum.",
        note: "Deine Schätzung: Welche Status ändern sich, und welche bleiben gleich?",
      },
    ],
    howTo:
      "Im Workshop führt Tim seinen Claude vor; du schätzt und prüfst die Quellen. Zu Hause: Kit entpacken, START-HIER.md lesen und die fünf Prompts in Claude ausführen. Eine Anleitung für Codex oder Claude Code steht ebenfalls dort. Etwa 90 Minuten. Englische Ausgabe: crvena-zemja-esg-kit.zip.",
    fictionalNote:
      "Alles im Kit ist erfunden, nur die zitierten Gesetze, Standards und Regeln sind echt.",
    contents: [
      { name: "START-HIER.md", description: "Einrichtung in Claude oder Codex, Durchsicht und fünf Prompts." },
      { name: "nachweisprobe.md", description: "Die vier Prüfungen und drei Status auf einer Seite." },
      { name: "projektanweisungen.md", description: "Der Stichtag und die drei Regeln für Claude." },
      { name: "ordner/", description: "13 Firmendateien, so unordentlich wie eine echte Ablage." },
      { name: "anfragen/", description: "Fragebogen, Werbeaussagen und Bankformular." },
      { name: "loesungen/LOESUNGEN.md", description: "Die Lösungen mit Datei und Zeile. Erst nach jedem Schritt öffnen." },
      { name: "mitnehmen/", description: "Vorlagen und Checkliste für deine Firma." },
      { name: "claude/", description: "Der Skill esg-nachweise." },
    ],
  },
  en: {
    fileName: "crvena-zemja-esg-kit.zip",
    title: "The evidence check kit",
    lead: "Check ESG answers against source files and build an Excel evidence register. Practise the same winery case Tim demonstrates in Claude Desktop.",
    stats: [
      { value: "13", label: "files" },
      { value: "5", label: "prompts" },
      { value: "3", label: "rules" },
    ],
    rulesHeading: "Rules",
    rules: [
      "Only our files. Do not invent a number, do not estimate, add nothing from the internet.",
      "Give file and line for every figure (lines as in a text editor, every line counts). Calculate in code, with units. Before any annual total, count the distinct months: the same invoice number counts once.",
      "Evidence check for every answer: quote, period, scope, approval. COVERED when all four hold. WEAK when the file is expired, estimated, a draft, unapproved or contradicts another file. GAP when no file says it or a part has no file, with the document that would prove it. The weakest part counts.",
    ],
    rulesShort: [
      "Only our files. Never invent a number.",
      "File and line for every figure. Every calculation in code, with units.",
      "COVERED, WEAK or GAP. The weakest part decides.",
    ],
    stepsHeading: "The prompts",
    steps: [
      {
        tag: "Prompt 1",
        title: "The questionnaire",
        input: "The sustainability questionnaire from Nordvik Vin AB, with eight questions.",
        action: "Counts the electricity months in code and answers every question with file, line and status.",
        output: "A table with exactly one row per question, and the missing document where one is missing.",
        note: "How many of the 8 questions are covered? Predict first, then check ANSWERS.md.",
      },
      {
        tag: "Prompt 2",
        title: "The marketing claims",
        input: "Seven environmental claims from marketing for German shelves and the website.",
        action: "Checks every claim against the EU ban list first, then with the evidence check.",
        output: "A table: ban list, status, send or not, and a safe wording where a file carries one.",
        note: "Decide for each claim yourself first: send or drop.",
      },
      {
        tag: "Prompt 3",
        title: "The bank form",
        input: "Banka Povardarie's screening form for the solar loan.",
        action: "Fills in the form as one table, with file, line and status for each field, and works out the payback in code.",
        output: "The filled form, every estimate marked.",
        note: "Work out the payback with your phone calculator first.",
      },
      {
        tag: "Prompt 4",
        title: "The evidence register",
        input: "The three requests again, plus the eleven disclosures of the VSME Basic Module.",
        action: "Puts all 21 answers into one register, maps them to the VSME disclosures and lists every missing document once.",
        output: "An Excel file with the sheets Register, VSME and Request.",
        file: "evidence_register.xlsx",
        note: "Gaps are named, not filled.",
      },
      {
        tag: "Prompt 5",
        title: "The late invoice",
        input: "A document accounting hands in late, as a photo.",
        action: "Reads the document, checks it against itself, rechecks every answer it affects and updates the register.",
        output: "A table with where, before, now and why.",
        note: "Your prediction: which statuses change, and which stay the same?",
      },
    ],
    howTo:
      "In the workshop Tim runs his Claude; you predict and check the sources. At home: unzip the kit, read START-HERE.md and run the five prompts in Claude. It also includes a route for Codex or Claude Code. About 90 minutes. German edition: crvena-zemja-nachweisprobe.zip.",
    fictionalNote:
      "Everything in the kit is invented; only the laws, standards and rules quoted are real.",
    contents: [
      { name: "START-HERE.md", description: "Setup in Claude or Codex, review and five prompts." },
      { name: "evidence-check.md", description: "The four checks and three statuses on one page." },
      { name: "project-instructions.md", description: "The reference date and the three rules for Claude." },
      { name: "files/", description: "13 company files, as messy as a real filing system." },
      { name: "requests/", description: "Questionnaire, marketing claims and bank form." },
      { name: "answers/ANSWERS.md", description: "The answers with file and line. Open only after each step." },
      { name: "take-home/", description: "Templates and a checklist for your company." },
      { name: "claude/", description: "The English skill esg-evidence." },
    ],
  },
};

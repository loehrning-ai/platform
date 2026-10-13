import type { Locale } from "./i18n/locale";
import type { WorkshopKit } from "./workshop-kit";

/**
 * The kit block of workshop 04 (the page /workshops/esg-berichte-mit-ki/kit).
 * Every figure below is printed in the published deck or in START-HERE.md of
 * crvena-zemja-esg-kit.zip ("What good looks like"); workshops-esg-reporting.test.ts
 * checks that. The zip's path and size come from the workshop's kit material.
 */
export const ESG_REPORTING_KIT: Readonly<Record<Locale, WorkshopKit>> = {
  de: {
    fileName: "crvena-zemja-esg-kit.zip",
    title: "Das ESG-Kit",
    lead: "So spielst du die fünf Schritte des Workshops zu Hause nach: dieselben drei ESG-Anfragen, dieselben Dateien, dein eigenes Claude.",
    stats: [
      { value: "13", label: "Dateien" },
      { value: "5", label: "Prompts" },
      { value: "3", label: "Regeln" },
    ],
    rulesHeading: "Die drei Regeln im Projekt",
    rules: [
      "Nur unsere Dateien. Keine erfundene Zahl.",
      "Zu jedem Fakt Datei und Zeile nennen, jede Rechnung in Code mit Einheit.",
      "Fehlt ein Beleg: NOT FOUND. Ist er abgelaufen, geschätzt oder widersprüchlich: NEEDS CHECK.",
    ],
    stepsHeading: "Fünf Prompts, fünf Ergebnisse",
    steps: [
      {
        tag: "Prompt 1",
        title: "Der Fragebogen",
        input: "Der Lieferantenfragebogen von Nordvik Vin AB mit acht Fragen.",
        action: "Zählt die Strommonate in Code und beantwortet jede Frage mit Quelle und Status.",
        output: "Eine Tabelle mit einer Zeile je Frage, dazu eine Excel-Datei.",
        file: "nordvik-answers.xlsx",
        segments: [
          { tone: "ok", label: "OK", value: 5 },
          { tone: "check", label: "NEEDS CHECK", value: 1 },
          { tone: "missing", label: "NOT FOUND", value: 2 },
        ],
        note: "279,7 MWh sind nur elf Monate, der September fehlt. Claude sagt das, statt ein Jahr zu behaupten.",
      },
      {
        tag: "Prompt 2",
        title: "Die Werbeaussagen",
        input: "Sieben grüne Werbeaussagen des Marketings für Deutschland und Polen.",
        action: "Prüft jede Aussage gegen die Dateien und die EU-Regeln im Projekt.",
        output: "Eine Tabelle mit Ampel, Grund, Quelle und einer Fassung, die sich heute belegen lässt.",
        segments: [
          { tone: "missing", label: "ROT", value: 4 },
          { tone: "check", label: "GELB", value: 1 },
          { tone: "ok", label: "GRÜN", value: 2 },
        ],
        note: "Die roten Aussagen stehen zuerst.",
      },
      {
        tag: "Prompt 3",
        title: "Das Bankformular",
        input: "Das Prüfformular der Banka Povardarie für den Solarkredit, auf Mazedonisch (kyrillisch).",
        action: "Füllt das Formular auf Mazedonisch aus und rechnet die Amortisation in Code.",
        output: "Das ausgefüllte Formular, jede Schätzung ist markiert.",
        line: {
          text: "8.550.000 MKD / (180.000 kWh × 9,50 MKD/kWh)",
          result: "= 5,0 Jahre",
        },
        note: "Der Solaranteil am Verbrauch bleibt vorläufig, solange der September fehlt.",
      },
      {
        tag: "Prompt 4",
        title: "Der ESG-Pass",
        input: "Die drei Anfragen noch einmal, dazu die elf Überschriften des VSME-Basismoduls.",
        action: "Ordnet alles Bekannte den Überschriften zu und benennt jede Lücke.",
        output: "Ein klickbares Dashboard und eine versandfertige Word-Datei.",
        file: "esg-passport.docx",
        segments: [
          { tone: "ok", label: "OK", value: 5 },
          { tone: "partial", label: "TEILWEISE", value: 4 },
          { tone: "missing", label: "NOT FOUND", value: 2 },
        ],
        note: "Etwa so sieht die Bilanz aus. Nicht gefunden: B4 und B5. Lücken werden benannt, nicht gefüllt.",
      },
      {
        tag: "Prompt 5",
        title: "Die späte Rechnung",
        input: "Das Foto der Septemberrechnung.",
        action: "Liest das Foto, prüft jede Antwort, die am Strom hängt, und zieht Dashboard und Word-Datei nach.",
        output: "Eine Tabelle mit Wo, vorher, jetzt und warum.",
        segments: [
          { tone: "ink", label: "11 Monate", value: 279.7, display: "279,7 MWh" },
          { tone: "accent", label: "September", value: 41.2, display: "41,2 MWh" },
        ],
        line: { text: "279,7 + 41,2", result: "= 320,9 MWh" },
        note: "Ein Schnitt aus elf Monaten hätte 15,8 MWh zu wenig ergeben, und der Solaranteil sinkt von 64 % auf 56 %.",
      },
    ],
    howTo:
      "Du brauchst Claude (claude.ai oder die Desktop-App, jeder Plan) mit eingeschalteter Codeausführung und Dateierstellung. Die Dateien werden dabei an Claude übertragen. Etwa 45 Minuten.",
    fictionalNote:
      "Alles darin ist erfunden: die Firma, die Personen, die Zahlen und das Rechnungsfoto. Echt sind nur die zitierten Gesetze und Regeln.",
    contents: [
      { name: "START-HERE.md", description: "Einrichtung und die fünf Prompts zum Kopieren" },
      { name: "project-instructions.md", description: "Das Datum und die drei Regeln für Claude" },
      { name: "project-files/", description: "13 Firmendateien, ein bisschen unordentlich wie echte" },
      { name: "inbox/", description: "Die drei Anfragen und das Foto der späten Rechnung" },
    ],
  },
  en: {
    fileName: "crvena-zemja-esg-kit.zip",
    title: "The ESG kit",
    lead: "Replay the workshop's five steps at home: the same three ESG requests, the same files, your own Claude.",
    stats: [
      { value: "13", label: "files" },
      { value: "5", label: "prompts" },
      { value: "3", label: "rules" },
    ],
    rulesHeading: "The three rules in the Project",
    rules: [
      "Only our files. Never invent a number.",
      "Cite the file and row for every fact, and do every calculation in code, with units.",
      "A document is missing: NOT FOUND. It is expired, an estimate or in conflict: NEEDS CHECK.",
    ],
    stepsHeading: "Five prompts, five results",
    steps: [
      {
        tag: "Prompt 1",
        title: "The questionnaire",
        input: "The supplier questionnaire from Nordvik Vin AB, with eight questions.",
        action: "Counts the electricity months in code and answers every question with a source and a status.",
        output: "A table with one row per question, plus an Excel file.",
        file: "nordvik-answers.xlsx",
        segments: [
          { tone: "ok", label: "OK", value: 5 },
          { tone: "check", label: "NEEDS CHECK", value: 1 },
          { tone: "missing", label: "NOT FOUND", value: 2 },
        ],
        note: "279.7 MWh is only eleven months; September is missing. Claude says so instead of claiming a full year.",
      },
      {
        tag: "Prompt 2",
        title: "The green claims",
        input: "Seven green marketing claims for Germany and Poland.",
        action: "Checks every claim against the files and the EU rules in the Project.",
        output: "A table with a light, the reason, the source and a version you can prove today.",
        segments: [
          { tone: "missing", label: "RED", value: 4 },
          { tone: "check", label: "AMBER", value: 1 },
          { tone: "ok", label: "GREEN", value: 2 },
        ],
        note: "The red claims come first.",
      },
      {
        tag: "Prompt 3",
        title: "The bank form",
        input: "Banka Povardarie's screening form for the solar loan, in Macedonian.",
        action: "Fills the form in Macedonian and works out the payback in code.",
        output: "The filled form, every estimate marked.",
        line: {
          text: "8,550,000 MKD / (180,000 kWh × 9.50 MKD/kWh)",
          result: "= 5.0 years",
        },
        note: "The solar share of consumption stays provisional while September is missing.",
      },
      {
        tag: "Prompt 4",
        title: "The ESG passport",
        input: "The three requests again, plus the eleven headings of the VSME Basic module.",
        action: "Puts everything known under the headings and names every gap.",
        output: "A clickable dashboard and a Word file, ready to send.",
        file: "esg-passport.docx",
        segments: [
          { tone: "ok", label: "OK", value: 5 },
          { tone: "partial", label: "PARTIAL", value: 4 },
          { tone: "missing", label: "NOT FOUND", value: 2 },
        ],
        note: "Roughly this balance. Not found: B4 and B5. Gaps are named, not filled.",
      },
      {
        tag: "Prompt 5",
        title: "The late invoice",
        input: "The photo of the September invoice.",
        action: "Reads the photo, rechecks every answer that depends on electricity and updates the dashboard and the Word file.",
        output: "A table with where, before, now and why.",
        segments: [
          { tone: "ink", label: "11 months", value: 279.7, display: "279.7 MWh" },
          { tone: "accent", label: "September", value: 41.2, display: "41.2 MWh" },
        ],
        line: { text: "279.7 + 41.2", result: "= 320.9 MWh" },
        note: "An 11-month average would have been 15.8 MWh too low, and the solar share drops from 64% to 56%.",
      },
    ],
    howTo:
      "You need Claude (claude.ai or the desktop app, any plan) with code execution and file creation switched on. The files are transferred to Claude as you work. About 45 minutes.",
    fictionalNote:
      "Everything in it is invented: the company, the people, the numbers and the invoice photo. Only the laws and rules quoted are real.",
    contents: [
      { name: "START-HERE.md", description: "Setup and the five prompts to copy" },
      { name: "project-instructions.md", description: "The date and the three rules for Claude" },
      { name: "project-files/", description: "13 company files, a little messy like real ones" },
      { name: "inbox/", description: "The three requests and the photo of the late invoice" },
    ],
  },
};

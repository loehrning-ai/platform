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
    lead: "Dieselben drei ESG-Anfragen, dieselben Dateien, dein eigenes Claude.",
    stats: [
      { value: "13", label: "Dateien" },
      { value: "5", label: "Prompts" },
      { value: "3", label: "Regeln" },
    ],
    rulesHeading: "Regeln",
    rules: [
      "Nur unsere Dateien. Keine erfundene Zahl.",
      "Zu jedem Fakt Datei und Zeile nennen (Zeilennummern wie im Texteditor, jede Zeile zählt). Jede Rechnung in Code mit Einheiten.",
      "Fehlt ein Dokument: NOT FOUND und nenne das Dokument, das den Beleg liefern würde. Gibt es das Dokument, aber es ist abgelaufen, eine Schätzung oder im Konflikt mit einer anderen Datei: NEEDS CHECK und begründe es in einem Satz. Fehlt ein Dokument und eine andere Datei widerspricht ebenfalls, schreibe NOT FOUND und nenne den Konflikt in der Begründung. Bei mehreren Teilfragen gilt der Status des schwächsten Teils.",
    ],
    rulesShort: [
      "Nur unsere Dateien. Keine erfundene Zahl.",
      "Zu jedem Fakt Datei und Zeile nennen. Jede Rechnung in Code, mit Einheiten.",
      "Fehlt ein Beleg: NOT FOUND. Abgelaufen, geschätzt oder im Konflikt: NEEDS CHECK. Der schwächste Teil entscheidet.",
    ],
    stepsHeading: "Die Prompts",
    steps: [
      {
        tag: "Prompt 1",
        title: "Der Fragebogen",
        input: "Der Lieferantenfragebogen von Nordvik Vin AB mit acht Fragen.",
        action: "Zählt die Strommonate in Code und beantwortet jede Frage mit Quelle und Status.",
        output: "Eine Tabelle mit einer Zeile je Frage, dazu eine Excel-Datei.",
        file: "nordvik-answers.xlsx",
        note: "Wie viele der 8 Fragen kommen mit OK zurück? Rate zuerst, dann prüfe es in ANSWERS.md.",
      },
      {
        tag: "Prompt 2",
        title: "Die Werbeaussagen",
        input: "Sieben grüne Werbeaussagen des Marketings für Deutschland und Polen.",
        action: "Prüft jede Aussage gegen die Dateien und die EU-Regeln im Projekt.",
        output: "Eine Tabelle mit Ampel, Grund, Quelle und einer Fassung, die sich heute belegen lässt.",
        note: "Ordne jeden Claim zuerst selbst als RED, AMBER oder GREEN ein. Die roten Aussagen stehen zuerst.",
      },
      {
        tag: "Prompt 3",
        title: "Das Bankformular",
        input: "Das Prüfformular der Banka Povardarie für den Solarkredit.",
        action: "Füllt das Formular als eine Tabelle aus, mit Quelle und Status für jedes Feld, und rechnet die Amortisation in Code.",
        output: "Das ausgefüllte Formular, jede Schätzung ist markiert.",
        note: "Tritt gegen Claude an: Rechne die Amortisation zuerst mit dem Taschenrechner deines Handys aus.",
      },
      {
        tag: "Prompt 4",
        title: "Der ESG-Pass",
        input: "Die drei Anfragen noch einmal, dazu die elf Überschriften des VSME-Basismoduls.",
        action: "Ordnet alles Bekannte den Überschriften zu und benennt jede Lücke.",
        output: "Ein klickbares Dashboard und eine versandfertige Word-Datei.",
        file: "esg-passport.docx",
        note: "Lücken werden benannt, nicht gefüllt.",
      },
      {
        tag: "Prompt 5",
        title: "Die Überraschung",
        input: "Ein weiteres Dokument.",
        action: "Liest das neue Dokument, prüft jede davon betroffene Antwort erneut und aktualisiert Dashboard und Word-Datei.",
        output: "Eine Tabelle mit Wo, vorher, jetzt und warum.",
        note: "Dein Tipp: Welche Antworten ändern sich und welche bleiben gleich?",
      },
    ],
    howTo:
      "Du brauchst Claude mit Codeausführung und Dateierstellung, jeder Plan. Beim ersten Mal etwa 2 Stunden, danach 30 Minuten.",
    fictionalNote:
      "Alles im Kit ist erfunden, nur die zitierten Gesetze und Regeln sind echt.",
    contents: [
      { name: "START-HERE.md", description: "Fallensuche, Einrichtung und fünf Prompts zum Kopieren." },
      { name: "ANSWERS.md", description: "Der Lösungsschlüssel. Erst nach jedem Schritt öffnen." },
      { name: "project-instructions.md", description: "Das Datum und die drei Regeln für Claude" },
      { name: "project-files/", description: "13 Firmendateien, ein bisschen unordentlich wie echte" },
      { name: "inbox/", description: "Die drei Anfragen plus eine Überraschung für Schritt 5" },
    ],
  },
  en: {
    fileName: "crvena-zemja-esg-kit.zip",
    title: "The ESG kit",
    lead: "The same three ESG requests, the same files, your own Claude.",
    stats: [
      { value: "13", label: "files" },
      { value: "5", label: "prompts" },
      { value: "3", label: "rules" },
    ],
    rulesHeading: "Rules",
    rules: [
      "Only our files. Never invent a number.",
      "Cite the file and line for every fact (line numbers as in a text editor, counting every line). Do every calculation in code, with units.",
      "Missing document: write NOT FOUND and name the document that would prove it. Document exists but is expired, an estimate or in conflict with another file: write NEEDS CHECK and give the reason in one sentence. If a document is missing and another file also conflicts, write NOT FOUND and name the conflict in the reason. A question with several parts gets the status of its weakest part.",
    ],
    rulesShort: [
      "Only our files. Never invent a number.",
      "Name file and line for every fact. Every calculation in code, with units.",
      "No proof: NOT FOUND. Expired, estimated or conflicting: NEEDS CHECK. The weakest part decides.",
    ],
    stepsHeading: "The prompts",
    steps: [
      {
        tag: "Prompt 1",
        title: "The questionnaire",
        input: "The supplier questionnaire from Nordvik Vin AB, with eight questions.",
        action: "Counts the electricity months in code and answers every question with a source and a status.",
        output: "A table with one row per question, plus an Excel file.",
        file: "nordvik-answers.xlsx",
        note: "How many of the 8 questions come back OK? Guess first, then check ANSWERS.md.",
      },
      {
        tag: "Prompt 2",
        title: "The green claims",
        input: "Seven green marketing claims for Germany and Poland.",
        action: "Checks every claim against the files and the EU rules in the Project.",
        output: "A table with a light, the reason, the source and a version you can prove today.",
        note: "Mark each claim RED, AMBER or GREEN yourself first. The red claims come first.",
      },
      {
        tag: "Prompt 3",
        title: "The bank form",
        input: "Banka Povardarie's screening form for the solar loan.",
        action: "Fills in the form as one table, with a source and a status for each field, and works out the payback in code.",
        output: "The filled form, every estimate marked.",
        note: "Race Claude: work out the payback with your phone calculator first.",
      },
      {
        tag: "Prompt 4",
        title: "The ESG passport",
        input: "The three requests again, plus the eleven headings of the VSME Basic module.",
        action: "Puts everything known under the headings and names every gap.",
        output: "A clickable dashboard and a Word file, ready to send.",
        file: "esg-passport.docx",
        note: "Gaps are named, not filled.",
      },
      {
        tag: "Prompt 5",
        title: "The surprise",
        input: "One more document.",
        action: "Reads the new document, rechecks every answer it affects, and updates the dashboard and the Word file.",
        output: "A table with where, before, now and why.",
        note: "Your bet: which answers change, and which stay the same?",
      },
    ],
    howTo:
      "You need Claude with code execution and file creation, any plan. About 2 hours the first time, 30 minutes after that.",
    fictionalNote:
      "Everything in the kit is invented; only the laws and rules quoted are real.",
    contents: [
      { name: "START-HERE.md", description: "Trap hunt, setup and five prompts to copy." },
      { name: "ANSWERS.md", description: "The answer key. Open it only after each step." },
      { name: "project-instructions.md", description: "The date and the three rules for Claude" },
      { name: "project-files/", description: "13 company files, a little messy like real ones" },
      { name: "inbox/", description: "The three requests, plus one surprise for step 5" },
    ],
  },
};

import type { Locale } from "./i18n/locale";
import type { WorkshopKit } from "./workshop-kit";

/**
 * The kit block of workshop 05 (the page /workshops/audit-vorbereitung-mit-ki/kit).
 * Every figure below is printed in the start file and the answer key of the kit edition of its
 * locale (gradba-audit-kit-de.zip, gradba-audit-kit.zip); scripts/workshop05/verify-kit.mjs checks
 * the figures against the kit's source files and workshops-audit.test.ts checks this block against
 * the kit. The rules equal rules 4 to 7 of the project instructions of each edition without their
 * number; the page numbers them 1 to 4, so its heading names the real range (rules 4 to 7 of 13). The zip's path and size come from the workshop's kit material. The kit has 41 files in
 * 10 top-level entries per edition: the core path, plus one folder extras/ with everything optional.
 */
export const AUDIT_KIT: Readonly<Record<Locale, WorkshopKit>> = {
  de: {
    fileName: "gradba-audit-kit-de.zip",
    title: "Gradba-Audit-Kit",
    lead: "Lerne, mit Claude zu arbeiten, an einem erfundenen Audit-Fall: ein Projekt mit Anweisungen und 19 Dateien, vier Prompts und ein Lösungsschlüssel für jede Antwort.",
    stats: [
      { value: "41", label: "Dateien" },
      { value: "4", label: "Schritte" },
      { value: "13", label: "Regeln für Claude" },
    ],
    rulesHeading: "Die vier Prüfungen (Regeln 4 bis 7 von 13)",
    rules: [
      "ZITAT: Wörtlich aus der Datei kopierte Worte beantworten die Zeile. „Geplant“ ist kein Protokoll.",
      "ZEITRAUM: Das Datum passt zur Regel (vor der ersten Schicht, binnen 15 Tagen, binnen 24 Monaten).",
      "UMFANG: Jede Person und jeder Arbeitsplatz, den die Zeile nennt. Nenne, wer fehlt.",
      "FREIGABE: Eine benannte Person hat mit Datum unterschrieben oder ist zuständig. Ein leeres Feld ist keine Freigabe.",
    ],
    rulesShort: [
      "ZITAT: wörtlich aus der Datei. Ohne Zitat kein BELEGT.",
      "ZEITRAUM: das Datum passt zur Regel, etwa vor der ersten Schicht.",
      "UMFANG: jede Person und jeder Arbeitsplatz, den die Zeile nennt.",
      "FREIGABE: eine benannte Person hat mit Datum unterschrieben.",
    ],
    stepsHeading: "Vier Schritte",
    steps: [
      {
        tag: "Schritt 1",
        title: "Tabelle bauen",
        input: "Die drei Prüflisten und der Ordnerplan",
        action: "Claude ordnet jeder Frage ein Papier zu",
        output: "Tabelle mit 13 Zeilen und 5 Spalten",
        note: "Füge den Prompt aus START-HIER.md ein und sende ihn, dann vergleiche die Antwort mit LOESUNGEN.md.",
      },
      {
        tag: "Schritt 2",
        title: "Check laufen lassen",
        input: "Die Papiere der Firma in ordner/",
        action: "Claude schreibt und führt einen Check aus",
        output: "10 Funde und mindestens 8 geprüft ohne Befund",
        note: "Braucht die Codeausführung. Ohne sie gibt dir Claude check.py für deinen eigenen Rechner.",
      },
      {
        tag: "Schritt 3",
        title: "Status, Plan, Briefing",
        input: "Tabelle, Funde, die Mitteilung und drei Vorlagen",
        action: "Status je Frage, Plan, Briefing",
        output: "2 BELEGT, 1 SCHWACH, 10 LÜCKE und ein Briefing",
        note: "Füge vorher die Mitteilung und drei Vorlagen zum Projekt hinzu. Claude unterschreibt nichts, eine benannte Person liest und unterschreibt.",
      },
      {
        tag: "Schritt 4",
        title: "Register bauen",
        input: "Die CSV-Dateien in ordner/ und vorlagen/register.csv",
        action: "Claude baut das Register und einen Check",
        output: "register.csv mit 98 Zeilen, 4 abgelaufen, 1 läuft ab, 4 fehlen",
        note: "Im selben Chat. Frag danach das Register nach E-07. Das Register hält nur Datumsangaben, nie Gesundheitsinhalte.",
      },
    ],
    howTo:
      "Getestet in claude.ai am 13. Nov. 2026 mit zwei vollen Läufen. Die Dateien sind erfunden, darum dürfen sie in Claude. Mit echten Dateien deiner Firma bleiben die Personendaten auf deinem eigenen Rechner: Claude schreibt das Skript, du führst es aus. Alles in extras/ ist freiwillig, für nach dem Workshop.",
    setup: [
      "Lade gradba-audit-kit-de.zip auf dieser Seite herunter und entpacke es.",
      "Öffne Claude (claude.ai oder die Desktop-App). Wähle „Projects“, dann „New project“. Nenne es Gradba-Audit.",
      "Öffne projektanweisungen.md, kopiere den ganzen Text und füge ihn in die Anweisungen des Projekts ein. Speichere.",
      "Füge dem Projekt Dateien hinzu: alle Dateien in listen/ (3) und ordner/ (14), dazu faelle/fall-A-arbeit.md und vorlagen/register.csv. Das sind 19 Dateien. Das Projekt zeigt sie in einer flachen Liste, das ist in Ordnung.",
      "Schalte unter „Settings“, „Capabilities“ den Schalter „Code execution and file creation“ ein. Schritt 2 startet ein Skript. Ohne den Schalter bitte Claude um check.py und führe es auf deinem eigenen Rechner aus.",
      "Starte einen Chat im Projekt. Füge für jeden Schritt seinen Prompt aus START-HIER.md ein und sende ihn; vergleiche danach die Antwort mit LOESUNGEN.md.",
      "Füge vor Schritt 3 vier weitere Dateien zum Projekt hinzu: mitteilung_DIT_2026-11-23.md, vorlagen/evidence-index.csv, vorlagen/clock.csv und vorlagen/neues-papier.md.",
      "Schritt 4 läuft im selben Chat. Stell dann dem Register die Frage zu E-07 (der zweite Prompt von Schritt 4).",
    ],
    fictionalNote: "Alle Dateien sind für die Übung erfunden. Keine Rechtsberatung.",
    labels: { result: "So läuft es" },
    contents: [
      { name: "START-HIER.md", description: "Einrichtung und die vier Prompts" },
      { name: "LOESUNGEN.md", description: "Der Schlüssel, aus den Dateien gerechnet" },
      { name: "projektanweisungen.md", description: "13 Regeln fürs Claude-Projekt" },
      { name: "AENDERUNGEN.md", description: "Was sich wann geändert hat" },
      { name: "mitteilung_DIT_2026-11-23.md", description: "Der Brief vom Inspektorat" },
      { name: "listen/", description: "Dreizehn Fragen in drei Auszügen" },
      { name: "ordner/", description: "Papiere der Firma, CSV und Text" },
      { name: "faelle/", description: "Fall A, die Arbeitsinspektion" },
      { name: "vorlagen/", description: "Papier, Uhr, Nachweisindex, Register" },
      { name: "extras/", description: "Freiwillig, für nach dem Workshop" },
    ],
  },
  en: {
    fileName: "gradba-audit-kit.zip",
    title: "Gradba audit kit",
    lead: "Learn to use Claude on an invented audit case: one project with instructions and 19 files, four prompts and an answer key for every reply.",
    stats: [
      { value: "41", label: "files" },
      { value: "4", label: "steps" },
      { value: "13", label: "rules for Claude" },
    ],
    rulesHeading: "The four tests (rules 4 to 7 of 13)",
    rules: [
      "QUOTE: words copied exactly from the file answer the line. “Planned” is not a record.",
      "PERIOD: the date fits the rule (before the first shift, within 15 days, within 24 months).",
      "SCOPE: every person and every workplace the line names. Name who is missing.",
      "APPROVAL: a named person signed or owns it, with a date. A blank field is no approval.",
    ],
    rulesShort: [
      "QUOTE: word for word from the file. No quote, no COVERED.",
      "PERIOD: the date fits the rule, such as before the first shift.",
      "SCOPE: every person and every workplace the line names.",
      "APPROVAL: a named person signed or owns it, with a date.",
    ],
    stepsHeading: "Four steps",
    steps: [
      {
        tag: "Step 1",
        title: "Make the table",
        input: "The three checklists and the folder map",
        action: "Claude maps each question to a paper",
        output: "A table with 13 rows and 5 columns",
        note: "Paste the prompt from START-HERE.md and send it, then compare the answer with ANSWERS.md.",
      },
      {
        tag: "Step 2",
        title: "Run the check",
        input: "The firm's papers in folder/",
        action: "Claude writes and runs a check",
        output: "10 findings and at least 8 checked with no problem",
        note: "Needs code execution. Without it, Claude gives you check.py to run on your own computer.",
      },
      {
        tag: "Step 3",
        title: "Status, plan, briefing",
        input: "The table, the findings, the notice and three templates",
        action: "A status per question, a plan, a briefing",
        output: "2 COVERED, 1 WEAK, 10 GAP and a briefing",
        note: "Add the notice and three templates to the project first. Claude signs nothing; a named person reads and signs.",
      },
      {
        tag: "Step 4",
        title: "Build the register",
        input: "The CSV files in folder/ and templates/register.csv",
        action: "Claude builds the register and a check",
        output: "register.csv with 98 rows, 4 expired, 1 expiring, 4 missing",
        note: "Same chat. Then ask the register about E-07. The register holds dates only, never health content.",
      },
    ],
    howTo:
      "Tested in claude.ai on 13 Nov 2026 with two full runs. The files are invented, so they may go into Claude. With your own firm's real files, personal data stays on your own computer: Claude writes the script, you run it. Everything in extras/ is optional, for after the session.",
    setup: [
      "Download gradba-audit-kit.zip from this page and unzip it.",
      "Open Claude (claude.ai or the desktop app). Choose “Projects”, then “New project”. Call it Gradba audit.",
      "Open project-instructions.md, copy all of it and paste it into the project's instructions. Save.",
      "Add files to the project: all files inside checklists/ (3) and folder/ (14), plus cases/case-A-labour.md and templates/register.csv. That is 19 files. The project shows them in one flat list; that is fine.",
      "In “Settings”, “Capabilities”, switch on “Code execution and file creation”. Step 2 runs a script. Without it, ask Claude for check.py and run it on your own computer.",
      "Start a chat inside the project. For each step, paste that step's prompt from START-HERE.md and send it; then compare the answer with ANSWERS.md.",
      "Before Step 3, add four more files to the project: notice_DIT_2026-11-23.md, templates/evidence-index.csv, templates/clock.csv and templates/new-paper-note.md.",
      "Step 4 runs in the same chat. Then ask the register the E-07 question (the second prompt of Step 4).",
    ],
    fictionalNote: "All files are invented for the exercise. Not legal advice.",
    labels: { result: "How to run it" },
    contents: [
      { name: "START-HERE.md", description: "Setup and the four prompts" },
      { name: "ANSWERS.md", description: "The answer key, computed from files" },
      { name: "project-instructions.md", description: "13 rules for the Claude Project" },
      { name: "CHANGELOG.md", description: "What changed, by date" },
      { name: "notice_DIT_2026-11-23.md", description: "The letter from the inspectorate" },
      { name: "checklists/", description: "Thirteen questions in three excerpts" },
      { name: "folder/", description: "The firm's papers, CSV and text" },
      { name: "cases/", description: "Case A, the labour inspection" },
      { name: "templates/", description: "Paper, clock, evidence index, register" },
      { name: "extras/", description: "Optional, for after the session" },
    ],
  },
};

import type { Locale } from "./i18n/locale";
import type { WorkshopKit } from "./workshop-kit";

/**
 * The kit block of workshop 05 (the page /workshops/audit-vorbereitung-mit-ki/kit).
 * Every figure below is printed in the start file and the answer key of the kit edition of its
 * locale (gradba-audit-kit-de.zip, gradba-audit-kit.zip); scripts/workshop05/verify-kit.mjs checks
 * the figures against the kit's source files and workshops-audit.test.ts checks this block against
 * the kit. The rules equal rules 4 to 7 of the project instructions of each edition without their
 * number; the page numbers them 1 to 4, so its heading names the real range (rules 4 to 7 of 13). The zip's path and size come from the workshop's kit material. The kit has 41 files in
 * 12 top-level entries per edition.
 */
export const AUDIT_KIT: Readonly<Record<Locale, WorkshopKit>> = {
  de: {
    fileName: "gradba-audit-kit-de.zip",
    title: "Gradba-Audit-Kit",
    lead: "Eine erfundene Arbeitsinspektion, dreizehn Fragen und ein Schlüssel, der aus den Dateien gerechnet ist.",
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
        input: "Drei Prüflisten und der Ordnerplan",
        action: "Schritt 1 im Claude-Projekt ausführen",
        output: "Tabelle mit 13 Zeilen und 5 Spalten",
        note: "Sag es voraus, dann prüf es in LOESUNGEN.md.",
      },
      {
        tag: "Schritt 2",
        title: "Check laufen lassen",
        input: "Die CSV-Dateien in ordner/",
        action: "Claude schreibt und führt einen Check aus",
        output: "10 Funde und mindestens 8 geprüft ohne Befund",
        note: "Sag es zuerst voraus: Wie viele Funde? Dann prüf es in LOESUNGEN.md.",
      },
      {
        tag: "Schritt 3",
        title: "Status und Briefing",
        input: "Tabelle und Funde",
        action: "Status je Frage, Plan, Briefing",
        output: "2 BELEGT, 1 SCHWACH, 10 LÜCKE und ein Briefing",
        note: "Claude unterschreibt nichts. Eine benannte Person liest und unterschreibt. Echte Dateien: Stufe 3, das Skript läuft bei dir.",
      },
      {
        tag: "Schritt 4",
        title: "Register bauen",
        input: "Die CSV-Dateien in ordner/ und vorlagen/register.csv",
        action: "Claude baut das Register und einen Check",
        output: "register.csv mit 98 Zeilen, 4 abgelaufen, 1 läuft ab, 4 fehlen",
        note: "Sag es voraus, dann prüf es in LOESUNGEN.md. Nur Daten, keine Gesundheitsinhalte.",
      },
    ],
    howTo:
      "Entpacke das Kit, öffne Claude, lege ein Projekt an, füge projektanweisungen.md ein und füge listen/ und ordner/ hinzu. Die Dateien sind erfunden. Deine echten Dateien gehen erst in ein Werkzeug, wenn du die Datenstufen kennst: Folie 11 im Deck und START-HIER.md.",
    fictionalNote: "Alle Dateien sind für die Übung erfunden. Keine Rechtsberatung.",
    contents: [
      { name: "START-HIER.md", description: "Einrichtung und die vier Prompts" },
      { name: "LOESUNGEN.md", description: "Der Schlüssel, aus den Dateien gerechnet" },
      { name: "projektanweisungen.md", description: "13 Regeln fürs Claude-Projekt" },
      { name: "AENDERUNGEN.md", description: "Was sich wann geändert hat" },
      { name: "mitteilung_DIT_2026-11-23.md", description: "Der Brief vom Inspektorat" },
      { name: "listen/", description: "Dreizehn Fragen in drei Auszügen" },
      { name: "ordner/", description: "Papiere der Firma, CSV und Text" },
      { name: "faelle/", description: "Feldkarten für drei Prüfungen" },
      { name: "inspektor/", description: "Verlangen und Protokoll, später öffnen" },
      { name: "vorlagen/", description: "Papier, Uhr, Nachweisindex, Register" },
      { name: "bereit-bleiben/", description: "Wochencheck, Quellen, Sicherheitskarte" },
      { name: "claude/", description: "Skill, auch unter /skills/audit-nachweise.zip" },
    ],
  },
  en: {
    fileName: "gradba-audit-kit.zip",
    title: "Gradba audit kit",
    lead: "An invented labour inspection, thirteen questions and a key computed from the files.",
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
        input: "Three checklist excerpts and the folder map",
        action: "Run Step 1 in your Claude Project",
        output: "A table with 13 rows and 5 columns",
        note: "Predict first, then check ANSWERS.md.",
      },
      {
        tag: "Step 2",
        title: "Run the check",
        input: "The CSV files in folder/",
        action: "Claude writes and runs a check",
        output: "10 findings and at least 8 checked with no problem",
        note: "Predict first: how many findings? Then check ANSWERS.md.",
      },
      {
        tag: "Step 3",
        title: "Status and briefing",
        input: "The table and the findings",
        action: "A status per question, a plan, a briefing",
        output: "2 COVERED, 1 WEAK, 10 GAP and a briefing",
        note: "Claude signs nothing. A named person reads and signs. Real files: Level 3, the script runs on your side.",
      },
      {
        tag: "Step 4",
        title: "Build the register",
        input: "The CSV files in folder/ and templates/register.csv",
        action: "Claude builds the register and a check",
        output: "register.csv with 98 rows, 4 expired, 1 expiring, 4 missing",
        note: "Predict first, then check ANSWERS.md. Dates only, no health content.",
      },
    ],
    howTo:
      "Unzip the kit, open Claude, make a Project, paste project-instructions.md, then add checklists/ and folder/. The files are invented. Your real files go into a tool only after you know the data levels: slide 11 in the deck and START-HERE.md.",
    fictionalNote: "All files are invented for the exercise. Not legal advice.",
    contents: [
      { name: "START-HERE.md", description: "Setup and the four prompts" },
      { name: "ANSWERS.md", description: "The answer key, computed from files" },
      { name: "project-instructions.md", description: "13 rules for the Claude Project" },
      { name: "CHANGELOG.md", description: "What changed, by date" },
      { name: "notice_DIT_2026-11-23.md", description: "The letter from the inspectorate" },
      { name: "checklists/", description: "Thirteen questions in three excerpts" },
      { name: "folder/", description: "The firm's papers, CSV and text" },
      { name: "cases/", description: "Field cards for three audits" },
      { name: "inspector/", description: "Request and minutes, opened later" },
      { name: "templates/", description: "Paper, clock, evidence index, register" },
      { name: "keep-watch/", description: "Weekly check, sources, safety card" },
      { name: "claude/", description: "Skill, also at /skills/audit-nachweise.zip" },
    ],
  },
};

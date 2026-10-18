import type { Locale } from "./i18n/locale";
import type { WorkshopKit } from "./workshop-kit";

/**
 * The kit block of workshop 05 (the page /workshops/audit-vorbereitung-mit-ki/kit).
 * Every figure below is printed in the published deck or in START-HERE.md and ANSWERS.md of
 * termin-health-audit-kit.zip; scripts/workshop05/verify-kit.mjs checks the figures against the
 * kit's source files and workshops-audit-prep.test.ts checks this block against the kit.
 * The zip's path and size come from the workshop's kit material.
 */
export const AUDIT_PREP_KIT: Readonly<Record<Locale, WorkshopKit>> = {
  de: {
    fileName: "termin-health-audit-kit.zip",
    title: "Das Audit-Kit",
    lead: "So spielst du die fünf Schritte des Workshops zu Hause nach: dieselben drei Audit-Anfragen, dieselben Dateien, dein eigenes Claude.",
    stats: [
      { value: "13", label: "Dateien" },
      { value: "5", label: "Prompts" },
      { value: "3", label: "Regeln" },
    ],
    rulesHeading: "Die drei Regeln im Projekt",
    rules: [
      "Nur unsere Dateien. Keine erfundene Tatsache, kein erfundenes Datum, keine erfundene Zahl.",
      "Zu jedem Fakt den Dateinamen und den Eintrag nennen (zum Beispiel E03, INC-04, adm-06) oder die zitierten Worte. Nie Zeilennummern nennen. Jede Zählung und jede Datumsrechnung in Code.",
      "COVERED: Eine aktuelle Datei beantwortet die Anfrage vollständig, auch wenn die Antwort eine schlechte Nachricht ist; dann kommt eine Maßnahme dazu. WEAK: Eine Datei antwortet, ist aber alt, hat eine leere oder „not recorded“-Zelle oder widerspricht einer anderen Datei; sage, was davon zutrifft. GAP: Keine Datei beantwortet es, oder die Datei sagt nur „pending“, „none“ oder „not done“; nenne das Dokument, das die Lücke schließen würde. Bei mehreren Teilen bestimmt der fehlende oder alte Teil den Status; nenne ihn. Beispiel: Der AVV von Nordgrid ist pending, also ist D2 GAP, obwohl vier Lieferanten in Ordnung sind. Aussagen: RED (eine Datei sagt das Gegenteil), AMBER (fehlt, pending oder nicht vollständig belegt), GREEN (eine Datei belegt jedes Wort, für alle Systeme mit Gesundheitsdaten); „all“ oder „every“ scheitert an einer Ausnahme. Ein genannter Verantwortlicher oder Freigeber zählt als unterschrieben; „accepted online“ zählt als unterschrieben.",
    ],
    stepsHeading: "Fünf Prompts, fünf Ergebnisse",
    steps: [
      {
        tag: "Prompt 1",
        title: "Die Dokumentenanfrage",
        input: "Die Anfrage von Rheinland Praxisverbund AG mit acht Punkten.",
        action: "Zählt die Schulungsdaten in Code und beantwortet jeden Punkt mit Quelle und Status.",
        output: "Eine Tabelle mit einer Zeile je Punkt.",
        note: "Dein Tipp zuerst: Wie viele der 8 Punkte kommen mit COVERED zurück? Prüfe es in ANSWERS.md.",
      },
      {
        tag: "Prompt 2",
        title: "Die Trust-Page-Aussagen",
        input: "Sieben Sicherheitsaussagen für die Website und eine Krankenhaus-Ausschreibung.",
        action: "Prüft jede Aussage gegen die Dateien und die Themenliste im Projekt.",
        output: "Eine Tabelle mit Ampel, Grund, Quelle und einer Fassung, die sich belegen lässt.",
        note: "Ordne jede Aussage zuerst selbst als RED, AMBER oder GREEN ein. Die roten stehen zuerst.",
      },
      {
        tag: "Prompt 3",
        title: "Einen Datensatz verfolgen",
        input: "Ein Löschantrag, den die Auditorin als Stichprobe zieht.",
        action: "Verfolgt Patient P-48213 durch jede Stelle, an der seine Daten liegen könnten, und rechnet Fristen in Code.",
        output: "Eine Tabelle mit Ort, Land, Löschnachweis und Status je Stelle.",
        note: "Tippe zuerst: Wo reißt der Faden? Ein KI-Werkzeug ist auch ein Ort, an dem Daten liegen.",
      },
      {
        tag: "Prompt 4",
        title: "Der Audit-Readiness-Pass",
        input: "Die drei Anfragen noch einmal, dazu die zwölf Audit-Themen A1 bis A12.",
        action: "Ordnet alles Bekannte den Themen zu und benennt jede Lücke mit dem Dokument, das sie schließt.",
        output: "Eine Tabelle mit zwölf Themen, Status, Quelle und fehlendem Dokument. Dashboard und Word-Datei sind ein freiwilliger Bonus.",
        note: "Lücken werden benannt, nicht gefüllt. Dein Tipp zuerst: Wie viele der 12 Themen kommen mit COVERED zurück?",
      },
      {
        tag: "Prompt 5",
        title: "Eine weitere Überraschung",
        input: "Ein Foto einer Rechnung.",
        action: "Liest das Foto und prüft jede davon betroffene Antwort erneut.",
        output: "Eine Tabelle mit Wo, vorher, jetzt und warum.",
        note: "Dein Tipp: Ändert sich ein Status oder nur eine Begründung?",
      },
    ],
    howTo:
      "Du brauchst Claude (claude.ai oder die Desktop-App, jeder Plan einschließlich Free) mit eingeschalteter Codeausführung. Die Dateien werden dabei an Claude übertragen. Beim ersten Mal etwa 2 Stunden, beim zweiten Durchlauf etwa 1 Stunde. Du kannst nach jedem Schritt aufhören und an einem anderen Tag weitermachen.",
    fictionalNote:
      "Alles darin ist erfunden: die Firma, die Personen, die Zahlen und die Dokumente. Echt sind nur die zitierten Gesetze und Standards. Das Kit enthält keine Rechtsberatung und bescheinigt nichts.",
    contents: [
      { name: "START-HERE.md", description: "Fallensuche und die Übung Daten, Ort, Vertrag zum Aufwärmen, Einrichtung, fünf Prompts zum Kopieren, eine Vorhersage vor jedem Schritt und eine Vorlage für die eigene Firma" },
      { name: "ANSWERS.md", description: "Der Lösungsschlüssel. Erst nach jedem Schritt öffnen." },
      { name: "project-instructions.md", description: "Die beiden Daten und die drei Regeln für Claude" },
      { name: "project-files/", description: "13 Firmendateien, ein bisschen unordentlich wie echte" },
      { name: "inbox/", description: "Die drei Anfragen plus ein Rechnungsfoto für Schritt 5" },
    ],
  },
  en: {
    fileName: "termin-health-audit-kit.zip",
    title: "The audit kit",
    lead: "Replay the workshop's five steps at home: the same three audit requests, the same files, your own Claude.",
    stats: [
      { value: "13", label: "files" },
      { value: "5", label: "prompts" },
      { value: "3", label: "rules" },
    ],
    rulesHeading: "The three rules in the Project",
    rules: [
      "Only our files. Never invent a fact, a date or a number.",
      "Cite the file name and the row (such as E03, INC-04, adm-06) or the quoted words. Never cite line numbers. Do every count and date calculation in code.",
      "COVERED: a current file answers the request in full, even when the answer is bad news; then add an action. WEAK: a file answers, but it is old, has an empty or \"not recorded\" cell, or disagrees with another file; say which. GAP: no file answers it, or the file only says \"pending\", \"none\" or \"not done\"; name the document that would close it. Several parts: the part that is missing or old sets the status; name it. Example: Nordgrid's DPA is pending, so D2 is GAP though four suppliers are fine. Claims: RED (a file says the opposite), AMBER (missing, pending or not fully proven), GREEN (a file proves every word, for all systems with health data); \"all\" or \"every\" fails on one exception. A named owner or approver counts as signed; \"accepted online\" counts as signed.",
    ],
    stepsHeading: "Five prompts, five results",
    steps: [
      {
        tag: "Prompt 1",
        title: "The document request",
        input: "The request from Rheinland Praxisverbund AG, with eight items.",
        action: "Counts the training records in code and answers every item with a source and a status.",
        output: "A table with one row per item.",
        note: "Your bet first: how many of the 8 items come back COVERED? Check it in ANSWERS.md.",
      },
      {
        tag: "Prompt 2",
        title: "The Trust page claims",
        input: "Seven security claims for the website and a hospital tender.",
        action: "Checks every claim against the files and the topic list in the Project.",
        output: "A table with a light, the reason, the source and a version you can prove.",
        note: "Mark each claim RED, AMBER or GREEN yourself first. The red claims come first.",
      },
      {
        tag: "Prompt 3",
        title: "Trace one record",
        input: "An erasure request that the auditor samples.",
        action: "Follows patient P-48213 through every place that could hold their data and calculates the deadlines in code.",
        output: "A table with place, country, proof of deletion and status for each place.",
        note: "Bet first: where does the thread break? An AI tool is a place where data lives.",
      },
      {
        tag: "Prompt 4",
        title: "The Audit Readiness Passport",
        input: "The three requests again, plus the twelve audit topics A1 to A12.",
        action: "Puts everything known under the topics and names every gap with the document that closes it.",
        output: "A table with twelve topics, status, source and the missing document. A dashboard and a Word file are an optional bonus.",
        note: "Gaps are named, not filled. Your bet first: how many of the 12 topics come back COVERED?",
      },
      {
        tag: "Prompt 5",
        title: "One more surprise",
        input: "A photo of an invoice.",
        action: "Reads the photo and rechecks every answer it affects.",
        output: "A table with where, before, now and why.",
        note: "Your bet: does a status change, or only a reason?",
      },
    ],
    howTo:
      "You need Claude (claude.ai or the desktop app, any plan, including Free) with code execution switched on. The files are transferred to Claude as you work. About 2 hours the first time, about 1 hour on a second run. You can stop after any step and continue another day.",
    fictionalNote:
      "Everything in it is invented: the company, the people, the numbers and the documents. Only the laws and standards quoted are real. The kit is not legal advice and certifies nothing.",
    contents: [
      { name: "START-HERE.md", description: "Trap hunt and the Data, Place, Paper exercise as warm-ups, setup, five prompts to copy, a prediction before each step, and a template for your own company" },
      { name: "ANSWERS.md", description: "The answer key. Open it only after each step." },
      { name: "project-instructions.md", description: "The two dates and the three rules for Claude" },
      { name: "project-files/", description: "13 company files, a little messy like real ones" },
      { name: "inbox/", description: "The three requests, plus an invoice photo for step 5" },
    ],
  },
};

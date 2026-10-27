import type { Locale } from "./i18n/locale";
import type { WorkshopKit } from "./workshop-kit";

/**
 * The kit block of workshop 05 (the page /workshops/audit-vorbereitung-mit-ki/kit).
 * Every figure below is printed in the start file and the answer key of the kit edition of its
 * locale (vardar-audit-kit-de.zip, vardar-audit-kit.zip); scripts/workshop05/verify-kit.mjs checks
 * the figures against the kit's source files and workshops-audit.test.ts checks this block against
 * the kit. The rules equal rules 4 to 7 of the project instructions of each edition without their
 * number. The zip's path and size come from the
 * workshop's kit material.
 */
export const AUDIT_KIT: Readonly<Record<Locale, WorkshopKit>> = {
  de: {
    fileName: "vardar-audit-kit-de.zip",
    title: "Das Audit-Kit von Vardar Works",
    lead: "Elf Dateien, acht Anforderungen, drei Schritte in deinem eigenen Claude-Konto.",
    stats: [
      { value: "19", label: "Dateien" },
      { value: "3", label: "Schritte" },
      { value: "13", label: "Regeln" },
    ],
    rulesHeading: "Die vier Prüfungen",
    rules: [
      "ZITAT: Worte, wörtlich aus der Datei kopiert, beantworten die Anforderung. Eine RICHTLINIE oder AUSSAGE zeigt Absicht; fragt die Anforderung nach Praxis, zählt nur ein PROTOKOLL. \"Geplant\" oder \"machen wir\" ist kein Protokoll.",
      "ZEITRAUM: ein PROTOKOLL oder REGISTER ist ab Beginn des Prüfzeitraums datiert. Eine RICHTLINIE wurde ab dann freigegeben oder überprüft. Die Datei gilt für den ganzen Zeitraum: Gilt eine Regel erst ab einem späteren Tag, haben die Tage davor keinen Nachweis.",
      "UMFANG: Sie deckt die Systeme und Personen ab, nach denen die Anforderung fragt. Prüf Systeme gegen die Systemliste. Nenne, was nicht gedeckt ist.",
      "FREIGABE: Eine RICHTLINIE nennt, wer sie mit Datum freigegeben hat. Ein PROTOKOLL oder REGISTER nennt, wer es führt oder erstellt hat. Eine Anbieterseite nennt Anbieter und Datum der Seite. DRAFT, \"(open)\", ein leeres Feld oder \"FINAL\" im Dateinamen ist keine Freigabe.",
    ],
    rulesShort: [
      "ZITAT: wörtlich aus der Datei. Ohne Zitat kein BELEGT.",
      "ZEITRAUM: im Prüfzeitraum und für den ganzen Zeitraum.",
      "UMFANG: alle Systeme und Personen, nach denen gefragt ist.",
      "FREIGABE: Name und Datum im Dokument, nie aus dem Dateinamen.",
    ],
    stepsHeading: "Die Schritte",
    steps: [
      {
        tag: "Schritt 1",
        title: "Die Nachweisliste",
        input: "Die elf Dateien in ordner/.",
        action: "Claude liest Zeitraum und Freigabe aus dem Text.",
        output: "Eine Nachweisliste mit elf Zeilen.",
        segments: [
          { tone: "ok", label: "hält", value: 8 },
          { tone: "missing", label: "SCHEITERT", value: 3 },
        ],
        note: "Drei Dateien fallen durch, und ihr Name verrät nicht, welche.",
      },
      {
        tag: "Schritt 2",
        title: "Acht Anforderungen",
        input: "request_tannwald.md und die Liste aus Schritt 1.",
        action: "Claude sucht wörtliche Zitate und rechnet im Code.",
        output: "Eine Tabelle mit Zitat und Status.",
        segments: [
          { tone: "ok", label: "BELEGT", value: 2 },
          { tone: "partial", label: "SCHWACH", value: 1 },
          { tone: "missing", label: "LÜCKE", value: 5 },
        ],
        note: "Belegt heißt belegt, nicht gut: R1 belegt, dass Daten in den USA liegen.",
      },
      {
        tag: "Schritt 3",
        title: "Lücken und Antwort",
        input: "Die Vorlage und der Antwortentwurf.",
        action: "Claude schreibt Anfragen und prüft den Entwurf.",
        output: "Lückenliste und Antwort, höchstens 150 Wörter.",
        note: "Einen Satz änderst du von Hand. Unterschreiben tust du, nicht Claude.",
      },
    ],
    howTo:
      "Du brauchst claude.ai oder die Claude-Desktop-App, jeder Plan, mit Codeausführung, und etwa 60 Minuten.",
    fictionalNote:
      "Alles im Kit ist erfunden, bis auf zwei Zeilen von Anthropics öffentlicher Datenschutzseite. Keine Rechtsberatung.",
    contents: [
      { name: "START-HIER.md", description: "Einrichtung, Schritte, Skill installieren." },
      { name: "LOESUNGEN.md", description: "Die Lösungen pro Schritt." },
      { name: "projektanweisungen.md", description: "13 Regeln fürs Claude-Projekt." },
      { name: "request_tannwald.md", description: "Die acht Anforderungen des Kunden." },
      { name: "draft-reply.md", description: "Der Entwurf der Geschäftsführung." },
      { name: "ordner/", description: "Elf erfundene Dateien, auf Englisch." },
      { name: "vorlagen/", description: "Nachweisliste und Lückenanfrage." },
      { name: "claude/", description: "Der Skill audit-nachweise." },
    ],
  },
  en: {
    fileName: "vardar-audit-kit.zip",
    title: "The Vardar audit kit",
    lead: "Eleven files, eight requests, three steps in your own Claude account.",
    stats: [
      { value: "19", label: "files" },
      { value: "3", label: "steps" },
      { value: "13", label: "rules" },
    ],
    rulesHeading: "The four tests",
    rules: [
      "QUOTE: words copied exactly from the file answer the item. A POLICY or STATEMENT shows intent; for an item about practice only a RECORD counts. \"Planned\" or \"we do\" is not a record.",
      "PERIOD: a RECORD or REGISTER dated on or after the window start. A POLICY approved or reviewed on or after it. The file holds for the whole window: a rule valid only from a later day leaves the days before it without evidence.",
      "SCOPE: it covers the systems and people the request names. Check systems against the system list. Name what is not covered.",
      "APPROVAL: a POLICY names its approver with a date. A RECORD or REGISTER names its owner or maker. A vendor page names the vendor and the page date. DRAFT, \"(open)\", a blank field, or \"FINAL\" in a file name is no approval.",
    ],
    rulesShort: [
      "QUOTE: word for word from the file. No quote, no COVERED.",
      "PERIOD: inside the window, and for the whole window.",
      "SCOPE: every system and every person the request names.",
      "APPROVAL: a name and a date inside the file, never from its name.",
    ],
    stepsHeading: "The steps",
    steps: [
      {
        tag: "Step 1",
        title: "The evidence index",
        input: "The eleven files in folder/.",
        action: "Claude reads period and approval from the text.",
        output: "An index with eleven rows.",
        segments: [
          { tone: "ok", label: "pass", value: 8 },
          { tone: "missing", label: "FAIL", value: 3 },
        ],
        note: "Three files fail, and their names do not tell you which.",
      },
      {
        tag: "Step 2",
        title: "Eight requests",
        input: "request_tannwald.md and the index from step 1.",
        action: "Claude finds exact quotes and computes in code.",
        output: "A table with quote and status.",
        segments: [
          { tone: "ok", label: "COVERED", value: 2 },
          { tone: "partial", label: "WEAK", value: 1 },
          { tone: "missing", label: "GAP", value: 5 },
        ],
        note: "COVERED means proven, not good: R1 proves the data sits in the US.",
      },
      {
        tag: "Step 3",
        title: "Gaps and reply",
        input: "The template and the draft reply.",
        action: "Claude writes requests and checks the draft.",
        output: "A gap list and a reply, at most 150 words.",
        note: "You edit one sentence by hand. You sign it, not Claude.",
      },
    ],
    howTo:
      "You need claude.ai or the Claude desktop app, any plan, with code execution on, and about 60 minutes.",
    fictionalNote:
      "Everything in the kit is invented, except two lines from Anthropic's public privacy page. Not legal advice.",
    contents: [
      { name: "START-HERE.md", description: "Setup, steps, installing the skill." },
      { name: "ANSWERS.md", description: "The answers, step by step." },
      { name: "project-instructions.md", description: "13 rules for the Claude Project." },
      { name: "request_tannwald.md", description: "The customer's eight requests." },
      { name: "draft-reply.md", description: "The managing director's draft." },
      { name: "folder/", description: "Eleven invented files from Vardar Works." },
      { name: "templates/", description: "Evidence index and gap request." },
      { name: "claude/", description: "The audit-nachweise skill." },
    ],
  },
};

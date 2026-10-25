import type { Locale } from "./i18n/locale";
import type { WorkshopKit } from "./workshop-kit";

/**
 * The kit block of workshop 05 (the page /workshops/audit-vorbereitung-mit-ki/kit).
 * Every figure below is printed in START-HERE.md or ANSWERS.md of vardar-audit-kit.zip;
 * scripts/workshop05/verify-kit.mjs checks the figures against the kit's source files and
 * workshops-audit.test.ts checks this block against the kit. The English rules equal rules 4
 * to 7 of project-instructions.md without their number. The zip's path and size come from the
 * workshop's kit material.
 */
export const AUDIT_KIT: Readonly<Record<Locale, WorkshopKit>> = {
  de: {
    fileName: "vardar-audit-kit.zip",
    title: "Das Audit-Kit von Vardar Works",
    lead: "Elf Dateien, acht Anforderungen, drei Missionen in deinem eigenen Claude-Konto.",
    stats: [
      { value: "18", label: "Dateien" },
      { value: "3", label: "Missionen" },
      { value: "13", label: "Regeln" },
    ],
    rulesHeading: "Die vier Prüfungen",
    rules: [
      "DATUM: Ein Protokoll oder Register ist ab Beginn des Prüfzeitraums datiert. Eine Richtlinie wurde ab dann freigegeben oder überprüft.",
      "FREIGABE: Eine Richtlinie nennt, wer sie mit Datum freigegeben hat. Ein Protokoll oder Register nennt, wer es führt oder erstellt hat. Eine Anbieterseite nennt Anbieter und Datum der Seite. DRAFT, „(open)“, ein leeres Feld oder „FINAL“ im Dateinamen ist keine Freigabe.",
      "UMFANG: Es deckt die Systeme, Personen und den Zeitraum ab, nach denen gefragt ist. Prüf die Systeme gegen die Systemliste und nenn, was fehlt.",
      "ZITAT: Wörtlich aus der Datei kopierte Worte beantworten die Anforderung. Eine Richtlinie oder Aussage zeigt Absicht; wo nach Praxis gefragt ist, zählt nur ein Protokoll.",
    ],
    rulesShort: [
      "DATUM: im Prüfzeitraum. Bei Richtlinien zählt die letzte Freigabe.",
      "FREIGABE: Name und Datum im Dokument, nie aus dem Dateinamen.",
      "UMFANG: alle Systeme, Personen und der ganze Zeitraum.",
      "ZITAT: wörtlich aus der Datei. Ohne Zitat kein BELEGT.",
    ],
    stepsHeading: "Die Missionen",
    steps: [
      {
        tag: "Mission 1",
        title: "Die Nachweisliste",
        input: "Die elf Dateien in folder/.",
        action: "Claude liest Datum und Freigabe aus dem Text.",
        output: "Eine Nachweisliste mit elf Zeilen.",
        segments: [
          { tone: "ok", label: "pass", value: 8 },
          { tone: "missing", label: "FAIL", value: 3 },
        ],
        note: "Drei Dateien fallen durch, und ihr Name verrät nicht, welche.",
      },
      {
        tag: "Mission 2",
        title: "Acht Anforderungen",
        input: "request_tannwald.md und die Liste aus Mission 1.",
        action: "Claude sucht wörtliche Zitate und rechnet im Code.",
        output: "Eine Tabelle mit Zitat und Status.",
        segments: [
          { tone: "ok", label: "COVERED", value: 2 },
          { tone: "partial", label: "WEAK", value: 4 },
          { tone: "missing", label: "GAP", value: 2 },
        ],
        note: "Belegt heißt belegt, nicht gut: R1 belegt, dass Daten in den USA liegen.",
      },
      {
        tag: "Mission 3",
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
      { name: "START-HERE.md", description: "Einrichtung, Missionen, Skill installieren." },
      { name: "ANSWERS.md", description: "Die Lösungen pro Mission." },
      { name: "project-instructions.md", description: "13 Regeln fürs Claude-Projekt." },
      { name: "request_tannwald.md", description: "Die acht Anforderungen des Kunden." },
      { name: "draft-reply.md", description: "Der Entwurf der Geschäftsführung." },
      { name: "folder/", description: "Elf erfundene Dateien von Vardar Works." },
      { name: "templates/", description: "Nachweisliste und Lückenanfrage." },
    ],
  },
  en: {
    fileName: "vardar-audit-kit.zip",
    title: "The Vardar audit kit",
    lead: "Eleven files, eight requests, three missions in your own Claude account.",
    stats: [
      { value: "18", label: "files" },
      { value: "3", label: "missions" },
      { value: "13", label: "rules" },
    ],
    rulesHeading: "The four tests",
    rules: [
      "DATE: a RECORD or REGISTER dated on or after the window start. A POLICY approved or reviewed on or after it.",
      "APPROVAL: a POLICY names its approver with a date. A RECORD or REGISTER names its owner or maker. A vendor page names the vendor and the page date. DRAFT, \"(open)\", a blank field, or \"FINAL\" in a file name is no approval.",
      "SCOPE: it covers the systems, people and period the request names. Check systems against the system list. Name what is not covered.",
      "QUOTE: words copied exactly from the file answer the item. A POLICY or STATEMENT shows intent; for an item about practice only a RECORD counts. \"Planned\" or \"we do\" is not a record.",
    ],
    rulesShort: [
      "DATE: inside the window. For a policy, its last approval counts.",
      "APPROVAL: a name and a date inside the file, never from its name.",
      "SCOPE: every system, every person, the whole period.",
      "QUOTE: word for word from the file. No quote, no COVERED.",
    ],
    stepsHeading: "The missions",
    steps: [
      {
        tag: "Mission 1",
        title: "The evidence index",
        input: "The eleven files in folder/.",
        action: "Claude reads date and approval from the text.",
        output: "An index with eleven rows.",
        segments: [
          { tone: "ok", label: "pass", value: 8 },
          { tone: "missing", label: "FAIL", value: 3 },
        ],
        note: "Three files fail, and their names do not tell you which.",
      },
      {
        tag: "Mission 2",
        title: "Eight requests",
        input: "request_tannwald.md and the index from Mission 1.",
        action: "Claude finds exact quotes and computes in code.",
        output: "A table with quote and status.",
        segments: [
          { tone: "ok", label: "COVERED", value: 2 },
          { tone: "partial", label: "WEAK", value: 4 },
          { tone: "missing", label: "GAP", value: 2 },
        ],
        note: "COVERED means proven, not good: R1 proves the data sits in the US.",
      },
      {
        tag: "Mission 3",
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
      { name: "START-HERE.md", description: "Setup, missions, installing the skill." },
      { name: "ANSWERS.md", description: "The answers, mission by mission." },
      { name: "project-instructions.md", description: "13 rules for the Claude Project." },
      { name: "request_tannwald.md", description: "The customer's eight requests." },
      { name: "draft-reply.md", description: "The managing director's draft." },
      { name: "folder/", description: "Eleven invented files from Vardar Works." },
      { name: "templates/", description: "Evidence index and gap request." },
    ],
  },
};

import type { Locale } from "@/lib/i18n/locale";
import { ESG_REPORTING_KIT } from "@/lib/workshops-esg-reporting-kit";

/**
 * The three copy cards of "Zum Mitnehmen" (spec section 8). The copied text
 * is the same for everyone; today's misses are marked on screen only.
 *
 * DE card 1 takes rules 1 to 3 verbatim from the kit registry and translates
 * the frame of START-HERE "Your Monday". EN cards 1 and 2 are the kit's own
 * template and prompt, verbatim (data.test.ts checks them against the zip).
 */
export interface Takeaway {
  readonly text: string;
  /** True when the text is the kit's own, verbatim. */
  readonly fromKit: boolean;
}

const [rule1, rule2, rule3] = ESG_REPORTING_KIT.de.rules;

const INSTRUCTIONS_DE = [
  "Heute ist der [Datum, z. B. 9. November 2026]. Berichtsjahr: [2025].",
  "",
  "Du bist die ESG-Belegassistenz von [Firma und Rechtsform], [Branche] in [Land]. Antworte kurz und klar auf Deutsch.",
  "",
  "Drei Regeln:",
  `1. ${rule1}`,
  `2. ${rule2}`,
  `3. ${rule3}`,
  "",
  "Personendaten nur als Summen: keine Namen, keine Einzeldatensätze.",
].join("\n");

const INSTRUCTIONS_EN = [
  "Today is [date, for example 9 November 2026]. Reporting year: [2025].",
  "",
  "You are the ESG evidence assistant of [company name and legal form], a [type of business] in [country]. Answer in plain, short English unless I ask for another language.",
  "",
  "Three rules:",
  "1. Only our files. Never invent a number.",
  "2. Cite the file and line for every fact (line numbers as in a text editor, counting every line). Do every calculation in code, with units.",
  "3. Missing document: write NOT FOUND and name the document that would prove it. Document exists but is expired, an estimate or in conflict with another file: write NEEDS CHECK and give the reason in one sentence. If a document is missing and another file also conflicts, write NOT FOUND and name the conflict in the reason. A question with several parts gets the status of its weakest part.",
  "",
  "People data stays aggregated: no names, no individual records.",
].join("\n");

const PROMPT_DE = [
  "Beantworte den Fragebogen von [Kunde oder Bank] in der angehängten Datei.",
  "Gib eine Tabelle zurück, genau eine Zeile je Frage: # | Frage | Antwort | Quelldatei und Zeile | Status (OK, NEEDS CHECK oder NOT FOUND).",
  "Zähl vor jeder Summe die Monate in Code.",
  "Liste danach jedes NOT FOUND mit dem Dokument, das die Lücke schließt.",
].join("\n");

const PROMPT_EN = [
  "Answer the questionnaire from [customer or bank name] in the attached file.",
  "Return one table with exactly one row per question: # | Question | Answer | Source file and line | Status (OK, NEEDS CHECK or NOT FOUND).",
  "Before any total, count the months in code.",
  "Then list every NOT FOUND with the document that would close it.",
].join("\n");

/** The checklist: a title, six numbered checks, one closing line. */
export const CHECKLIST: Readonly<
  Record<Locale, { readonly title: string; readonly lines: readonly string[]; readonly close: string }>
> = {
  de: {
    title: "Gegenprobe vor dem Unterschreiben",
    lines: [
      "Prüf, ob die Belege das ganze Jahr lückenlos abdecken. Zeiträume zählen, nicht Dokumente.",
      "Prüf jedes Datum gegen heute und jede Zahl darauf, ob sie geschätzt ist. Abgelaufen, geschätzt oder im Widerspruch zu einer anderen Datei heißt NEEDS CHECK.",
      "Fehlt das Dokument: NOT FOUND, auch wenn eine andere Datei widerspricht. Nenne das Dokument, das fehlt.",
      "Zitier die Zeile, die die Antwort trägt, nicht die auffälligste.",
      "OK heißt belegt, nicht gut. Bricht ein belegter Wert eine Regel, wird daraus eine Aufgabe.",
      "Mehrere Teile: Der schwächste Teil entscheidet.",
    ],
    close: "Claude bereitet vor. Ein Mensch prüft und unterschreibt.",
  },
  en: {
    title: "Check before you sign",
    lines: [
      "Check that the documents cover the whole year without a gap. Count periods, not documents.",
      "Check every date against today and every number for whether it is an estimate. Expired, estimated or in conflict with another file means NEEDS CHECK.",
      "No document: NOT FOUND, even if another file conflicts. Name the document that is missing.",
      "Cite the line that carries the answer, not the one that stands out.",
      "OK means proven, not good. When a proven value breaks a rule, it becomes an action.",
      "Several parts: the weakest part decides.",
    ],
    close: "Claude prepares. A person checks and signs.",
  },
};

function checklistText(locale: Locale): string {
  const { title, lines, close } = CHECKLIST[locale];
  return [title, ...lines.map((line, index) => `${index + 1}. ${line}`), close].join("\n");
}

export const TAKEAWAYS: Readonly<Record<Locale, readonly [Takeaway, Takeaway, Takeaway]>> = {
  de: [
    { text: INSTRUCTIONS_DE, fromKit: false },
    { text: PROMPT_DE, fromKit: false },
    { text: checklistText("de"), fromKit: false },
  ],
  en: [
    { text: INSTRUCTIONS_EN, fromKit: true },
    { text: PROMPT_EN, fromKit: true },
    { text: checklistText("en"), fromKit: false },
  ],
};

import "server-only";

import type { Fact, L10n } from "./types";

/**
 * The facts this demo uses, mirrored from the kit's facts.md
 * (public/workshops/ki-im-unternehmen-sicher-nutzen/ai-at-work-kit.zip,
 * checked 18 Oct 2026). statementEn, source and dates are verbatim; a test
 * reads facts.md out of the zip and finds every line. statementDe is a
 * faithful translation for the German page. Server only: the sources block
 * renders them, the client never carries them.
 */
export const W05_FACTS: readonly Fact[] = [
  {
    id: 4,
    statementEn:
      "A deleted chat leaves your history now and the back end within 30 days, and is not used for future training. With training on, new chats can be kept de-identified for up to 5 years. The page does not say if deleting shortens that.",
    statementDe:
      "Ein gelöschter Chat verschwindet sofort aus deinem Verlauf und innerhalb von 30 Tagen aus dem Back-end und wird nicht für künftiges Training genutzt. Bei eingeschaltetem Training können neue Chats bis zu 5 Jahre de-identifiziert gespeichert bleiben. Die Seite sagt nicht, ob Löschen das verkürzt.",
    source: "Anthropic privacy 10023548",
    sourceDe: "Anthropic Datenschutz 10023548",
    dates: ["2026-07-01"],
  },
  {
    id: 6,
    statementEn:
      "Enterprise adds an owner delete timer (minimum 30 days), audit logs, a Compliance API, SCIM.",
    statementDe:
      "Enterprise ergänzt einen Lösch-Timer für Inhaber (mindestens 30 Tage), Audit-Logs, eine Compliance-API und SCIM.",
    source: "Anthropic help 10440198, 9797531",
    sourceDe: "Anthropic Hilfe 10440198, 9797531",
    dates: ["undated", "2026-09-01"],
  },
  {
    id: 7,
    statementEn:
      "Chat data is stored in the US. Processing may run in the US, Europe, Asia and Australia. The page offers no EU-only option.",
    statementDe:
      "Chat-Daten werden in den USA gespeichert. Die Verarbeitung kann in den USA, in Europa, Asien und Australien laufen. Die Seite bietet keine reine EU-Option an.",
    source: "Anthropic privacy 7996890",
    sourceDe: "Anthropic Datenschutz 7996890",
    dates: ["2026-06-15"],
  },
  {
    id: 10,
    statementEn: "A personal plan has no company admin tools and no company contract.",
    statementDe: "Ein privater Plan hat keine Firmen-Admin-Werkzeuge und keinen Firmenvertrag.",
    source: "Derived from the plan pages on claude.com/pricing",
    sourceDe: "Abgeleitet aus den Tarifseiten auf claude.com/pricing",
    dates: ["read 2026-10-18"],
  },
  {
    id: 13,
    statementEn:
      "From 2 Dec 2027: high-risk uses such as ranking applicants or rating staff (moved from 2 Aug 2026). A normal chat assistant for drafting or summarising is not high-risk.",
    statementDe:
      "Ab 2. Dez. 2027: hochriskante Nutzungen wie Bewerbungen ranken oder Personal bewerten (verschoben vom 2. Aug. 2026). Ein normaler Chat-Assistent zum Entwerfen oder Zusammenfassen ist nicht hochriskant.",
    source: "Regulation (EU) 2026/1744; Commission FAQ",
    sourceDe: "Verordnung (EU) 2026/1744; FAQ der Kommission",
    dates: ["2026-07-24", "2026-08-07"],
  },
];

/** The workshop's own rule lines this demo applies (slide 7, ANSWERS.md mission 3 and 5). */
export const RULE_LINES: readonly { readonly id: string; readonly text: L10n }[] = [
  {
    id: "deck07",
    text: {
      de: "Folie 7: GRÜN öffentlich, jedes Werkzeug. AMBER Firmenwerkzeug, Namen raus, eine Checkliste und keine Erlaubnis. ROT Schlüssel überall, Kundendaten auf einem Privatkonto.",
      en: "Slide 7: GREEN public, any tool. AMBER company tool, names out, a to-do list and not a permission. RED secrets anywhere, customer data on a personal account.",
    },
  },
  {
    id: "answers3",
    text: {
      de: "Antwortschlüssel Mission 3: Ein Schlüssel ist ein Geheimnis, tausche ihn. Enterprise macht Rot nicht grün. Namen und IBANs raus, dann Vertrag prüfen.",
      en: "Answer key, mission 3: A key is a secret, change it. Enterprise does not turn red into green. Take names and IBANs out, then check the contract.",
    },
  },
];

/** The last line of facts.md, its "Nicht in den Dateien" sentence. */
export const NOT_IN_FILES: L10n = {
  de: "Nicht in den Dateien: Standard des Trainingsschalters für neue private Konten, Aufbewahrungsfrist bei Team, EU-Speicher für die Chat-Apps, ob Team automatisch einen Auftragsverarbeitungsvertrag bekommt, was Desktop genau sendet.",
  en: "Not in the files: default of the training switch for new personal accounts, Team retention period, EU storage for the chat apps, whether Team gets a data processing agreement automatically, what Desktop sends exactly.",
};

export const FACTS_AS_OF: L10n = {
  de: "Stand 18. Oktober 2026. Keine Rechtsberatung.",
  en: "As of 18 October 2026. Not legal advice.",
};

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const germanDate = (iso: string) => iso.replace(ISO, "$3.$2.$1");

/** One date entry of a fact for the page language. English stays verbatim (the zip is the source); German reads "ohne Datum", "gelesen 18.10.2026", "01.07.2026". */
export function formatFactDate(entry: string, locale: "de" | "en"): string {
  if (locale === "en") return entry;
  if (entry === "undated") return "ohne Datum";
  if (entry.startsWith("read ")) return `gelesen ${germanDate(entry.slice(5))}`;
  return germanDate(entry);
}

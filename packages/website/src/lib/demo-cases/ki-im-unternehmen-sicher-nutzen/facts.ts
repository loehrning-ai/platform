import type { Cite, Fact, FactId, L10n } from "./types";

/**
 * The facts this demo uses, mirrored from the kit's facts.md
 * (public/workshops/ki-im-unternehmen-sicher-nutzen/ai-at-work-kit.zip,
 * checked 18 Oct 2026). statementEn, source and dates are verbatim; a test
 * reads facts.md out of the zip and finds every line. statementDe is a
 * faithful translation for the German page.
 */
export const W05_FACTS: readonly Fact[] = [
  {
    id: 1,
    statementEn:
      "Free, Pro, Max follow the Consumer Terms. Team, Enterprise follow the Commercial Terms.",
    statementDe:
      "Free, Pro und Max folgen den Verbraucherbedingungen. Team und Enterprise folgen den Geschäftsbedingungen.",
    source: "Anthropic privacy 10023580, 7996868",
    dates: ["2026-03-16", "2026-08-18"],
  },
  {
    id: 2,
    statementEn:
      "On Free, Pro, Max training is a setting you control. The page does not state the default: look at yours.",
    statementDe:
      "Bei Free, Pro und Max ist das Training eine Einstellung, die du steuerst. Die Seite nennt den Standard nicht: Sieh bei dir nach.",
    source: "Anthropic privacy 12109829",
    dates: ["2026-08-03"],
  },
  {
    id: 3,
    statementEn:
      "Team and Enterprise chats are not used for training by default. Thumbs feedback is an exception.",
    statementDe:
      "Team- und Enterprise-Chats werden standardmäßig nicht fürs Training genutzt. Daumen-Feedback ist eine Ausnahme.",
    source: "Anthropic privacy 7996868",
    dates: ["2026-08-18"],
  },
  {
    id: 5,
    statementEn: "Team: saved chats have no fixed period stated. Deleted chats go within 30 days.",
    statementDe:
      "Team: Für gespeicherte Chats ist keine feste Frist genannt. Gelöschte Chats verschwinden innerhalb von 30 Tagen.",
    source: "Anthropic privacy 7996866",
    dates: ["2026-07-01"],
  },
  {
    id: 6,
    statementEn:
      "Enterprise adds an owner delete timer (minimum 30 days), audit logs, a Compliance API, SCIM.",
    statementDe:
      "Enterprise ergänzt einen Lösch-Timer für Inhaber (mindestens 30 Tage), Audit-Logs, eine Compliance-API und SCIM.",
    source: "Anthropic help 10440198, 9797531",
    dates: ["undated", "2026-09-01"],
  },
  {
    id: 7,
    statementEn:
      "Chat data is stored in the US. Processing may run in the US, Europe, Asia and Australia. The page offers no EU-only option.",
    statementDe:
      "Chat-Daten werden in den USA gespeichert. Die Verarbeitung kann in den USA, in Europa, Asien und Australien laufen. Die Seite bietet keine reine EU-Option an.",
    source: "Anthropic privacy 7996890",
    dates: ["2026-06-15"],
  },
  {
    id: 9,
    statementEn:
      "The Desktop app is a window onto your cloud account. With Cowork you connect folders. In cloud sessions, files Claude opens are processed on Anthropic's servers. Admins can switch Cowork off and limit it. This is our reading: check the vendor page.",
    statementDe:
      "Die Desktop-App ist ein Fenster auf dein Cloud-Konto. Mit Cowork verbindest du Ordner. In Cloud-Sitzungen werden Dateien, die Claude öffnet, auf Servern von Anthropic verarbeitet. Admins können Cowork abschalten und einschränken. Das ist unsere Lesart: Prüfe die Seite des Anbieters.",
    source: "support.claude.com/en/articles/14479288",
    dates: ["undated", "read 2026-10-18"],
  },
  {
    id: 10,
    statementEn: "A personal plan has no company admin tools and no company contract.",
    statementDe: "Ein privater Plan hat keine Firmen-Admin-Werkzeuge und keinen Firmenvertrag.",
    source: "Derived from the plan pages on claude.com/pricing",
    dates: ["read 2026-10-18"],
  },
  {
    id: 13,
    statementEn:
      "From 2 Dec 2027: high-risk uses such as ranking applicants or rating staff (moved from 2 Aug 2026). A normal chat assistant for drafting or summarising is not high-risk.",
    statementDe:
      "Ab 2. Dez. 2027: hochriskante Nutzungen wie Bewerbungen ranken oder Personal bewerten (verschoben vom 2. Aug. 2026). Ein normaler Chat-Assistent zum Entwerfen oder Zusammenfassen ist nicht hochriskant.",
    source: "Regulation (EU) 2026/1744; Commission FAQ",
    dates: ["2026-07-24", "2026-08-07"],
  },
];

/** Deck slide 05, the one route row that is not a facts.md line. */
export const DECK05: L10n = {
  de: "Workshop-Folie 05: Team-Inhaber verwalten Mitglieder und Einstellungen.",
  en: "Workshop slide 05: Team owners manage members and settings.",
};

/** The last line of facts.md, its "Nicht in den Dateien" sentence. */
export const NOT_IN_FILES: L10n = {
  de: "Nicht in den Dateien: Standard des Trainingsschalters für neue private Konten, Aufbewahrungsfrist bei Team, EU-Speicher für die Chat-Apps, ob Team automatisch einen Auftragsverarbeitungsvertrag bekommt, was Desktop genau sendet.",
  en: "Not in the files: default of the training switch for new personal accounts, Team retention period, EU storage for the chat apps, whether Team gets a data processing agreement automatically, what Desktop sends exactly.",
};

export const FACTS_AS_OF: L10n = {
  de: "Stand 18. Oktober 2026. Keine Rechtsberatung.",
  en: "As of 18 October 2026. Not legal advice.",
};

export function factById(id: FactId): Fact {
  const fact = W05_FACTS.find((entry) => entry.id === id);
  if (!fact) throw new Error(`Unknown fact F${id}`);
  return fact;
}

export function citeExists(cite: Cite): boolean {
  return cite === "deck05" || W05_FACTS.some((fact) => fact.id === cite);
}

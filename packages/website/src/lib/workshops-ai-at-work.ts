import type { Locale } from "./i18n/locale";
import type { Workshop, WorkshopMaterial } from "./workshops";
import { AI_AT_WORK_KIT } from "./workshops-ai-at-work-kit";

const base = "/workshops/ki-im-unternehmen-sicher-nutzen";

/**
 * Workshop 05, "Where Your Data Goes: Using Claude at Work". The published deck and kit live in
 * public/workshops/ki-im-unternehmen-sicher-nutzen; the kit's source files and the checks that tie every
 * figure to them are in scripts/workshop05 (build-kit.mjs, verify-kit.mjs). The company, its customer and
 * its survey are invented; the vendor and law lines are real and dated 18 October 2026. The agenda follows the
 * deck's 12 main slides (the detail page does not show it; tests and machine surfaces read it). The workshop
 * ships a deck and a kit page with one download, nothing else. Registered in WORKSHOPS_BY_LOCALE with the Sage
 * poster palette (docs/workshop-standard.md, section 5.1).
 */

/** Size of ai-at-work-kit.zip (14,581 bytes), rounded to the nearest KB (1024 bytes). */
const KIT_SIZE_LABEL = "14 KB";

type MaterialFrame = Omit<WorkshopMaterial, "label" | "description" | "sizeLabel">;

/** Shared href, kind, language, role and phase: both locales list the same files in the same order. */
const MATERIALS: readonly MaterialFrame[] = [
  { href: `${base}/slides.html`, kind: "html", language: "en", role: "deck", phase: "during", minutes: 75, primary: true },
  { href: `${base}/ai-at-work-kit.zip`, kind: "zip", language: "en", role: "kit", phase: "after" },
];

/** Label, description and, where the first sentence runs long on a phone, its short phone wording. */
type MaterialCopy = readonly [label: string, description: string, short?: string];

function materials(copy: readonly MaterialCopy[]): readonly WorkshopMaterial[] {
  if (copy.length !== MATERIALS.length) throw new Error("Workshop 05: material copy does not match the material list");
  return MATERIALS.map((frame, index) => {
    const [label, description, short] = copy[index];
    const text = short === undefined ? { label, description } : { label, description, short };
    return frame.kind === "zip" ? { ...frame, ...text, sizeLabel: KIT_SIZE_LABEL } : { ...frame, ...text };
  });
}

export const AI_AT_WORK_WORKSHOP: Readonly<Record<Locale, Workshop>> = {
  de: {
    slug: "ki-im-unternehmen-sicher-nutzen",
    number: "05",
    topic: "KI im Unternehmen",
    title: "Wohin gehen deine Daten?",
    eyebrow: "Workshop 05 · KI im Unternehmen",
    summary:
      "Ein Kunde fragt nach seinen Daten. Du prüfst dein Konto, sortierst Einfügungen und schreibst eine Seite.",
    description:
      "Vardar Works, eine erfundene Support-Firma in Skopje, bekommt am Montag eine Mail ihres größten Kunden: Welche KI-Werkzeuge nutzt ihr mit unseren Daten, und wo liegen sie? Der Raum stimmt über die drei Entwurfssätze des Chefs ab, prüft das eigene Claude-Konto, sortiert Einfügungen in Grün, Gelb und Rot, ordnet fünf KI-Nutzungen den vier Kästen des EU AI Act zu und schreibt eine Seite für den Kunden. Zu Hause spielt das Kit alles in fünf Aufgaben mit deinem eigenen Claude nach.",
    format: "Live-Workshop mit Deck",
    duration: "~90 Minuten",
    accessNote:
      "Du prüfst dein eigenes Claude-Konto oder schaust der Nachbarin zu. In Claude gehen nur erfundene Dateien, nie Firmendaten.",
    outcome: "Eine Seite: drei wahre Sätze für einen Kunden, drei Regeln für dein Team",
    audience: [
      "Mitarbeitende in Firmen mit 50 bis 500 Beschäftigten",
      "Teamleitungen, die gefragt werden: „Wie nutzt ihr KI mit unseren Daten?“",
      "Junior-Kräfte in IT und Marketing bei Firmen, die deutsche oder EU-Kunden bedienen",
    ],
    notForYou:
      "Nicht für dich, wenn du Rechtsberatung brauchst oder Claude für eine ganze Firma einrichtest.",
    question:
      "Was können wir unserem Kunden bis Freitag wahrheitsgemäß sagen, wohin seine Daten gehen, wenn wir KI nutzen?",
    outcomes: [
      "Du prüfst dein eigenes Claude-Konto: Du nennst Plan und Trainings-Einstellung und sagst, wo deine Chats gespeichert sind.",
      "Du sortierst Einfügungen in Grün, Gelb oder Rot und fünf KI-Nutzungen in die vier Kästen des EU AI Act.",
      "Du schreibst eine Seite mit drei wahren Sätzen für einen Kunden und drei Regeln für dein Team.",
    ],
    agenda: [
      { label: "Kaltstart: Die Mail des Kunden", minutes: 5, activity: "vote" },
      { label: "Was im Alltag wirklich passiert", minutes: 3, activity: "vote" },
      { label: "Einen Prompt senden, Konto prüfen", minutes: 9, activity: "do" },
      { label: "Zwei Regelwerke, ein Chat gelöscht", minutes: 8, activity: "do" },
      { label: "Wo deine Chats liegen", minutes: 7, activity: "vote" },
      { label: "Grün, Gelb, Rot: sechs Einfügungen", minutes: 9, activity: "vote" },
      { label: "Von Hand bereinigen", minutes: 5, activity: "do" },
      { label: "Der EU AI Act in vier Kästen", minutes: 9, activity: "vote" },
      { label: "Schriftlich nachfragen", minutes: 4, activity: "write" },
      { label: "Deine Seite: drei Sätze, drei Regeln", minutes: 11, activity: "write" },
      { label: "Die Abschlussabstimmung und Montag", minutes: 5, activity: "vote" },
      { label: "Fragen und Luft", minutes: 15, activity: "listen" },
    ],
    agendaSource: "deck",
    minutesLive: 90,
    minutesSelfStudy: 75,
        needs: [
      "Live: ein Handy für die Abstimmungen und claude.ai oder die Claude-Desktop-App, jeder Plan",
      "Zu Hause: dasselbe und das Kit",
    ],
    notNeeded: [
      "Programmierkenntnisse",
      "Einen API-Schlüssel",
      "Vorwissen zur DSGVO oder zum AI Act",
      "Firmendaten",
    ],
    notCovered: [
      "Rechtsberatung oder ein Gütesiegel für deine Firma",
      "Ein Vergleich von KI-Anbietern; die Fakten gelten für Claude",
      "Die Admin-Einrichtung eines Team- oder Enterprise-Kontos",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-18",
      data: "synthetic",
      note: "Quellen der echten Zahlen: Bitkom 2025, Microsoft 2024.",
    },
    steps: [
      {
        n: "01",
        title: "Einen Prompt senden, drei Dinge prüfen",
        description:
          "Du sendest einen erfundenen Kunden-Prompt und findest deinen Plan, deine Trainings-Einstellung und den Chat auf dem Handy.",
        tool: "Aufgabe 1 · Claude-Chat",
      },
      {
        n: "02",
        title: "Von Hand bereinigen, dann fragen",
        description:
          "Du ersetzt Name, Bestellnummer, Adresse und E-Mail von Hand durch Platzhalter und lässt Claude eine Antwort schreiben.",
        tool: "Aufgabe 2 · Claude-Chat",
      },
      {
        n: "03",
        title: "Acht Einfügungen bewerten",
        description:
          "Du gibst acht Einfügungen erst selbst eine Ampel, dann prüft Claude sie, nur mit den Dateien des Projekts.",
        tool: "Aufgabe 3 · Claude-Projekt",
      },
      {
        n: "04",
        title: "Fünf KI-Nutzungen, vier Kästen",
        description:
          "Du ordnest fünf KI-Nutzungen den Kästen des EU AI Act zu, mit Datum und Grund aus der Faktendatei.",
        tool: "Aufgabe 4 · Claude-Projekt",
      },
      {
        n: "05",
        title: "Deine Seite schreiben",
        description:
          "Du beantwortest die drei Fragen des Kunden und schreibst drei Teamregeln. Wo die Dateien sich widersprechen, sagst du das.",
        tool: "Aufgabe 5 · Claude-Projekt",
      },
    ],
    caseStudy: {
      companyName: "Vardar Works DOOEL",
      isFictional: true,
      location: "Skopje",
      sector: "Support und Backoffice für kleine deutsche Firmen",
      period: "Eine Woche im November 2026",
      narrative:
        "Am Montag fragt ihr größter Kunde, welche KI-Werkzeuge sie nutzt und wohin die Daten des Kunden gehen. Der Chef entwirft drei Sätze. Nicht alle sind wahr.",
      metrics: [
        { label: "Beschäftigte", value: "120" },
        { label: "Claude-Team-Plätze", value: "25" },
        { label: "Laptops mit Claude Desktop", value: "9" },
        { label: "Tage bis zur Antwort", value: "4" },
      ],
      decisionQuestion:
        "Was können wir unserem Kunden bis Freitag wahrheitsgemäß sagen, wohin seine Daten gehen, wenn wir KI nutzen?",
      limitationsHeading: "Zuerst lesen",
      dataLimitations: [
        "Jeder Name, jede Zahl und jedes Umfrageergebnis ist erfunden.",
        "Die Zeilen zu Anbieter und Gesetz sind echt, Stand 18. Oktober 2026, und ändern sich oft. Das ist keine Rechtsberatung.",
      ],
    },
    materials: materials([
      [
        "Deck · 12 Folien",
        "Für den Beamer. Pfeil nach rechts zeigt den nächsten Schritt, Pfeil nach links geht zurück.",
      ],
      [
        "Claude-Daten-Kit · .zip",
        "Sieben Textdateien: fünf Aufgaben, Antworten und erfundene Daten.",
      ],
    ]),
    kit: AI_AT_WORK_KIT.de,
  },
  en: {
    slug: "ki-im-unternehmen-sicher-nutzen",
    number: "05",
    topic: "AI at work",
    title: "Where does your data go?",
    eyebrow: "Workshop 05 · AI at work",
    summary:
      "A customer asks about their data. You check your account, sort pastes and write one page.",
    description:
      "Vardar Works, an invented support firm in Skopje, gets an email on Monday from its biggest customer: which AI tools do you use with our data, and where is it stored? The room votes on the boss's three draft sentences, checks its own Claude account, sorts what people paste into green, amber and red, places five AI uses in the four boxes of the EU AI Act and writes one page for the customer. At home, the kit replays all of it in five missions with your own Claude.",
    format: "Live workshop with deck",
    duration: "~90 minutes",
    accessNote:
      "You check your own Claude account or watch your neighbour. Only invented files go into Claude, never company data.",
    outcome: "One page: three true sentences for a customer, three rules for your team",
    audience: [
      "Staff at companies with 50 to 500 employees",
      "Team leads who are asked \"how do you use AI with our data?\"",
      "Junior IT and marketing staff at firms that serve German or EU customers",
    ],
    notForYou:
      "Not for you if you need legal advice or want to set up Claude for a whole company.",
    question:
      "What can we truthfully tell our customer by Friday about where their data goes when we use AI?",
    outcomes: [
      "Check your own Claude account: name its plan and training setting, and say where your chats are stored.",
      "Sort pastes into green, amber or red and five AI uses into the four boxes of the EU AI Act.",
      "Write one page with three true sentences for a customer and three rules for your team.",
    ],
    agenda: [
      { label: "Cold open: the customer's email", minutes: 5, activity: "vote" },
      { label: "What really happens at work", minutes: 3, activity: "vote" },
      { label: "Send one prompt, check your account", minutes: 9, activity: "do" },
      { label: "Two rulebooks, one chat deleted", minutes: 8, activity: "do" },
      { label: "Where your chats live", minutes: 7, activity: "vote" },
      { label: "Green, amber, red: six pastes", minutes: 9, activity: "vote" },
      { label: "Clean it by hand", minutes: 5, activity: "do" },
      { label: "The EU AI Act in four boxes", minutes: 9, activity: "vote" },
      { label: "Ask in writing", minutes: 4, activity: "write" },
      { label: "Your page: three sentences, three rules", minutes: 11, activity: "write" },
      { label: "The end vote and Monday", minutes: 5, activity: "vote" },
      { label: "Questions and slack", minutes: 15, activity: "listen" },
    ],
    agendaSource: "deck",
    minutesLive: 90,
    minutesSelfStudy: 75,
        needs: [
      "Live: a phone for the votes, and claude.ai or the Claude desktop app, any plan",
      "At home: the same, plus the kit",
    ],
    notNeeded: [
      "Coding skills",
      "An API key",
      "Knowledge of the GDPR or the AI Act",
      "Company data",
    ],
    notCovered: [
      "Legal advice or a seal of approval for your company",
      "A comparison of AI providers; the facts hold for Claude",
      "Admin setup of a Team or Enterprise account",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-18",
      data: "synthetic",
      note: "Sources of the real figures: Bitkom 2025, Microsoft 2024.",
    },
    steps: [
      {
        n: "01",
        title: "Send one prompt, check three things",
        description:
          "Send one invented customer prompt, then find your plan, your training setting and your chat on your phone.",
        tool: "Mission 1 · Claude chat",
      },
      {
        n: "02",
        title: "Clean it by hand, then ask",
        description:
          "Replace the name, order number, address and email with placeholders by hand, then ask Claude for a reply.",
        tool: "Mission 2 · Claude chat",
      },
      {
        n: "03",
        title: "Rate eight pastes",
        description:
          "Give eight pastes a light on paper first, then let Claude check them, using only the project files.",
        tool: "Mission 3 · Claude Project",
      },
      {
        n: "04",
        title: "Five AI uses, four boxes",
        description:
          "Put five AI uses into the boxes of the EU AI Act, with a date and a reason from the facts file.",
        tool: "Mission 4 · Claude Project",
      },
      {
        n: "05",
        title: "Write your one page",
        description:
          "Answer the customer's three questions and write three team rules. Where the files disagree, say so.",
        tool: "Mission 5 · Claude Project",
      },
    ],
    caseStudy: {
      companyName: "Vardar Works DOOEL",
      isFictional: true,
      location: "Skopje",
      sector: "support and back office for small German firms",
      period: "One week in November 2026",
      narrative:
        "On Monday its biggest customer asks which AI tools it uses and where the customer's data goes. The boss drafts three sentences. Not all are true.",
      metrics: [
        { label: "Staff", value: "120" },
        { label: "Claude Team seats", value: "25" },
        { label: "Laptops with Claude Desktop", value: "9" },
        { label: "Days to answer", value: "4" },
      ],
      decisionQuestion:
        "What can we truthfully tell our customer by Friday about where their data goes when we use AI?",
      limitationsHeading: "Read this first",
      dataLimitations: [
        "Every name, number and survey result is invented.",
        "Vendor and law lines are real, dated 18 October 2026, and change often. This is not legal advice.",
      ],
    },
    materials: materials([
      [
        "Deck · 12 slides",
        "For the projector. The right arrow shows the next step, the left arrow goes back.",
      ],
      [
        "Claude data kit · .zip",
        "Seven text files: five missions, the answers and invented data.",
      ],
    ]),
    kit: AI_AT_WORK_KIT.en,
  },
};

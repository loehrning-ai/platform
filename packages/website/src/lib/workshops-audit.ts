import type { Locale } from "./i18n/locale";
import type { Workshop, WorkshopMaterial } from "./workshops";
import { AUDIT_KIT } from "./workshops-audit-kit";

const base = "/workshops/audit-vorbereitung-mit-ki";

/** One deck in two editions, built from one copy source by scripts/workshop05/deck-src/build.mjs. */
const DECK_FILE: Readonly<Record<Locale, string>> = { de: "slides.html", en: "en/slides.html" };

/** The kit edition in the page's language; both hold the same English case files. */
const KIT_FILE: Readonly<Record<Locale, string>> = { de: "vardar-audit-kit-de.zip", en: "vardar-audit-kit.zip" };

/**
 * Workshop 05, "Audit Preparation with AI: Organize Evidence and Find Gaps". The kit's source files and
 * the checks that tie every figure to them are in scripts/workshop05 (build-kit.mjs, verify-kit.mjs); the
 * demo at /demos/audit-vorbereitung-mit-ki runs the same folder. Vardar Works, Tannwald Haustechnik and
 * every file are invented; two lines quote Anthropic's public privacy page. The agenda follows the deck
 * plan's 11 main slides, one block per slide (the detail page does not show it; tests and machine
 * surfaces read it). Registered in WORKSHOPS_BY_LOCALE with the Sage poster palette.
 */

/** Sizes of the two kit zips (40,908 and 43,656 bytes), rounded to the nearest KB (1024 bytes). */
const KIT_SIZE_LABEL: Readonly<Record<Locale, string>> = { de: "43 KB", en: "40 KB" };

type MaterialFrame = Omit<WorkshopMaterial, "label" | "description" | "sizeLabel">;

/** Both locales list the same materials in the same order; deck and kit are the editions in the page's language. */
function materialFrames(locale: Locale): readonly MaterialFrame[] {
  return [
    { href: `${base}/${DECK_FILE[locale]}`, kind: "html", language: locale, role: "deck", phase: "during", minutes: 90, primary: true },
    { href: `${base}/${KIT_FILE[locale]}`, kind: "zip", language: locale, role: "kit", phase: "after" },
  ];
}

/** Label, description and, where the first sentence runs long on a phone, its short phone wording. */
type MaterialCopy = readonly [label: string, description: string, short?: string];

function materials(locale: Locale, copy: readonly MaterialCopy[]): readonly WorkshopMaterial[] {
  const frames = materialFrames(locale);
  if (copy.length !== frames.length) throw new Error("Workshop 05: material copy does not match the material list");
  return frames.map((frame, index) => {
    const [label, description, short] = copy[index];
    const text = short === undefined ? { label, description } : { label, description, short };
    return frame.kind === "zip" ? { ...frame, ...text, sizeLabel: KIT_SIZE_LABEL[locale] } : { ...frame, ...text };
  });
}

export const AUDIT_WORKSHOP: Readonly<Record<Locale, Workshop>> = {
  de: {
    slug: "audit-vorbereitung-mit-ki",
    number: "05",
    topic: "Audit-Vorbereitung",
    title: "Audit-Vorbereitung mit KI: Nachweise ordnen, Lücken finden",
    eyebrow: "Workshop 05 · Audit-Vorbereitung",
    summary: "Wie KI hilft, Unterlagen für ein Audit zu ordnen.",
    lede: "Du prüfst elf Dateien gegen acht Anforderungen und schreibst die Lückenliste mit zuständiger Person.",
    description:
      "Vardar Works, eine erfundene Support-Firma in Skopje, bekommt von ihrem Kunden Tannwald Haustechnik eine Dokumentenanfrage mit acht Anforderungen für ein Lieferantenaudit. Im Ordner liegen elf Dateien, und zu jeder Anforderung passt ein Dateiname. Du prüfst jede Datei auf Zitat, Zeitraum, Umfang und Freigabe, gibst Claude diese vier Prüfungen als Regeln und bekommst eine Lückenliste, die du vertreten kannst. Zu Hause spielt das Kit alles in drei Schritten mit deinem eigenen Claude nach.",
    format: "Live-Workshop mit Deck",
    duration: "~90 Minuten",
    accessNote:
      "In Claude gehen nur die erfundenen Dateien des Kits. Firmenunterlagen lädst du nur in das Firmenkonto, das deine Firma freigegeben hat.",
    outcome: "Eine Lückenliste mit zuständiger Person pro Lücke und eine Antwort, die nur belegte Sätze enthält",
    stageExplainer: {
      heading: "Was ist das Kit?",
      body:
        "Eine Zip mit 19 Textdateien: die Anfrage des Kunden, elf erfundene Dateien, Regeln für Claude, den Skill, zwei Vorlagen und die Lösungen. Du gehst drei Schritte in deinem eigenen Claude-Konto.",
      facts: ["19 Textdateien", "3 Schritte", "ca. 60 Min. allein"],
    },
    audience: [
      "Mitarbeitende, die Unterlagen für ein Kunden- oder Lieferantenaudit zusammenstellen",
      "Teamleitungen in IT, Qualität oder Datenschutz, die Fragebögen von Kunden beantworten",
      "Junior-Kräfte, die zum ersten Mal einen Nachweisordner vorbereiten",
    ],
    notForYou: "Nicht für dich, wenn du Rechtsberatung brauchst oder selbst ein Zertifizierungsaudit durchführst.",
    question: "Welche Dateien im Ordner sind ein Nachweis?",
    outcomes: [
      "Du prüfst jede Datei auf Zitat, Zeitraum, Umfang und Freigabe und nennst die Prüfung, an der sie scheitert.",
      "Du gibst Claude die vier Prüfungen als Regeln und prüfst jedes Zitat gegen seine Datei.",
      "Du schreibst eine Lückenliste mit zuständigen Personen und eine Antwort, die nur belegte Sätze enthält.",
    ],
    agenda: [
      { label: "Eine Anfrage, elf Dateien, vier Prüfungen", minutes: 1, activity: "listen" },
      { label: "Die Anfrage: acht Anforderungen schätzen", minutes: 4, activity: "vote" },
      { label: "Der Antwortentwurf: vier Sätze", minutes: 3, activity: "vote" },
      { label: "Der Ordner und das Claude-Projekt", minutes: 8, activity: "do" },
      { label: "Die vier Prüfungen", minutes: 6, activity: "listen" },
      { label: "Schritt 1: die Nachweisliste", minutes: 15, activity: "do" },
      { label: "Schritt 2: erst das Zitat, dann der Status", minutes: 20, activity: "do" },
      { label: "Wo Claude bei diesem Ordner danebenliegt", minutes: 5, activity: "listen" },
      { label: "Schritt 3: jede Lücke mit zuständiger Person", minutes: 12, activity: "do" },
      { label: "Die Antwort an Tannwald", minutes: 10, activity: "write" },
      { label: "Deine Schätzung und das Ergebnis", minutes: 6, activity: "vote" },
    ],
    agendaSource: "deck",
    minutesLive: 90,
    minutesSelfStudy: 60,
    needs: [
      "Live: ein Handy für die Abstimmungen und claude.ai oder die Claude-Desktop-App, jeder Plan, mit Codeausführung",
      "Zu Hause: dasselbe und das Kit",
    ],
    notNeeded: ["Programmierkenntnisse", "Einen API-Schlüssel", "Vorwissen zu ISO 27001", "Firmenunterlagen"],
    notCovered: [
      "Rechtsberatung oder eine Zertifizierung",
      "Die Vorbereitung auf ein Zertifizierungsaudit nach ISO 27001",
      "Die Einrichtung eines Team- oder Enterprise-Kontos",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-25",
      data: "synthetic",
      note: "Alle Firmen, Personen und Dateien sind erfunden. Zwei Zeilen zitieren Anthropics öffentliche Datenschutzseite. Die vier Prüfungen fassen ISO 19011 und ISO/IEC 27001 7.5.2 zusammen. Keine Rechtsberatung.",
    },
    steps: [
      {
        n: "01",
        title: "Das Projekt einrichten",
        description:
          "Du legst ein Claude-Projekt an, fügst die 13 Regeln als Anweisungen ein und lädst die Anfrage und die elf Dateien hoch.",
        tool: "Einrichtung · Claude-Projekt",
      },
      {
        n: "02",
        title: "Die Nachweisliste",
        description:
          "Claude liest Typ, Datum und Freigabe jeder Datei aus dem Text, nie aus dem Dateinamen. Drei von elf Dateien fallen durch.",
        tool: "Schritt 1 · Claude-Projekt",
      },
      {
        n: "03",
        title: "Erst das Zitat, dann der Status",
        description: "Claude sucht pro Anforderung ein wörtliches Zitat und rechnet im Code. Belegt sind zwei von acht.",
        tool: "Schritt 2 · Claude-Projekt",
      },
      {
        n: "04",
        title: "Die Lückenliste",
        description: "Jede der sechs Lücken bekommt eine zuständige Person, ein Datum und eine Anfrage aus der Vorlage.",
        tool: "Schritt 3 · Claude-Projekt",
      },
      {
        n: "05",
        title: "Die Antwort an Tannwald",
        description:
          "Claude prüft die vier Sätze des Entwurfs gegen die Dateien. Die Antwort enthält nur Sätze, die eine Datei belegt, und einen Satz änderst du von Hand.",
        tool: "Schritt 3 · Claude-Projekt",
      },
    ],
    caseStudy: {
      companyName: "Vardar Works DOOEL",
      isFictional: true,
      location: "Skopje",
      sector: "Kundenservice für Tannwald Haustechnik GmbH, Hamburg",
      period: "Anfrage vom 9. November 2026, Remote-Audit am 10. Dezember 2026",
      narrative:
        "Tannwald nutzt das Auditrecht aus dem Auftragsverarbeitungsvertrag und schickt acht Anforderungen. Im Ordner liegt zu jeder eine Datei, deren Name passt. Die Geschäftsführung hat schon vier Sätze als Antwort entworfen.",
      metrics: [
        { label: "Beschäftigte", value: "120" },
        { label: "Anforderungen", value: "8" },
        { label: "Dateien im Ordner", value: "11" },
        { label: "Prüfzeitraum", value: "12 Monate" },
      ],
      decisionQuestion: "Welche Dateien im Ordner sind ein Nachweis?",
      limitationsHeading: "Zuerst lesen",
      dataLimitations: [
        "Jede Firma, jede Person und jede Datei ist erfunden.",
        "Zwei Zeilen zitieren Anthropics öffentliche Datenschutzseite. Das ist keine Rechtsberatung.",
      ],
    },
    materials: materials("de", [
      ["Deck", "Für den Beamer. Pfeil nach rechts zeigt den nächsten Schritt, Pfeil nach links geht zurück."],
      ["Vardar-Audit-Kit · .zip", "19 Textdateien auf Deutsch: Anfrage, elf erfundene Dateien, Regeln, Skill, Vorlagen und Lösungen."],
    ]),
    kit: AUDIT_KIT.de,
  },
  en: {
    slug: "audit-vorbereitung-mit-ki",
    number: "05",
    topic: "Audit preparation",
    title: "Audit Preparation with AI: Organize Evidence and Find Gaps",
    eyebrow: "Workshop 05 · Audit preparation",
    summary: "Explore how AI can support audit preparation by organizing documentation.",
    lede: "You test eleven files against eight request items and write the gap list with an owner for each gap.",
    description:
      "Vardar Works, an invented support firm in Skopje, gets a document request with eight items from its customer Tannwald Haustechnik for a supplier audit. The folder holds eleven files, and every item has a file whose name fits. You test each file for quote, period, scope and approval, give Claude those four tests as rules and get a gap list you can defend. At home, the kit replays all of it in three steps with your own Claude.",
    format: "Live workshop with deck",
    duration: "~90 minutes",
    accessNote:
      "Only the kit's invented files go into Claude. Company documents go only into the company account your firm approved.",
    outcome: "A gap list with an owner for every gap and a reply that holds only proven sentences",
    stageExplainer: {
      heading: "What is the kit?",
      body:
        "A zip with 19 text files: the customer's request, eleven invented files, rules for Claude, the skill, two templates and the answers. You take three steps in your own Claude account.",
      facts: ["19 text files", "3 steps", "about 60 min alone"],
    },
    audience: [
      "Staff who put together documents for a customer or supplier audit",
      "Team leads in IT, quality or data protection who answer customer questionnaires",
      "Junior staff preparing an evidence folder for the first time",
    ],
    notForYou: "Not for you if you need legal advice or run a certification audit yourself.",
    question: "Which files in the folder are evidence?",
    outcomes: [
      "Test each file for quote, period, scope and approval, and name the test it fails.",
      "Give Claude the four tests as rules and check every quote against its file.",
      "Write a gap list with owners and a reply that holds only proven sentences.",
    ],
    agenda: [
      { label: "One request, eleven files, four tests", minutes: 1, activity: "listen" },
      { label: "The request: estimate eight items", minutes: 4, activity: "vote" },
      { label: "The draft reply: four sentences", minutes: 3, activity: "vote" },
      { label: "The folder and the Claude Project", minutes: 8, activity: "do" },
      { label: "Four tests", minutes: 6, activity: "listen" },
      { label: "Step 1: the evidence index", minutes: 15, activity: "do" },
      { label: "Step 2: quote first, then status", minutes: 20, activity: "do" },
      { label: "Where Claude goes wrong on this folder", minutes: 5, activity: "listen" },
      { label: "Step 3: every gap gets an owner", minutes: 12, activity: "do" },
      { label: "The reply to Tannwald", minutes: 10, activity: "write" },
      { label: "Your estimate, the folder's answer", minutes: 6, activity: "vote" },
    ],
    agendaSource: "deck",
    minutesLive: 90,
    minutesSelfStudy: 60,
    needs: [
      "Live: a phone for the votes, and claude.ai or the Claude desktop app, any plan, with code execution on",
      "At home: the same, plus the kit",
    ],
    notNeeded: ["Coding skills", "An API key", "Knowledge of ISO 27001", "Company documents"],
    notCovered: [
      "Legal advice or a certification",
      "Preparing for an ISO 27001 certification audit",
      "Setting up a Team or Enterprise account",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-25",
      data: "synthetic",
      note: "Every company, person and file is invented. Two lines quote Anthropic's public privacy page. The four tests summarise ISO 19011 and ISO/IEC 27001 7.5.2. Not legal advice.",
    },
    steps: [
      {
        n: "01",
        title: "Set up the Project",
        description:
          "Create a Claude Project, paste the 13 rules as its instructions and upload the request and the eleven files.",
        tool: "Setup · Claude Project",
      },
      {
        n: "02",
        title: "The evidence index",
        description:
          "Claude reads each file's type, date and approval from its text, never from its name. Three of eleven files fail.",
        tool: "Step 1 · Claude Project",
      },
      {
        n: "03",
        title: "Quote first, then status",
        description: "Claude finds an exact quote for each item and computes in code. Two of eight are covered.",
        tool: "Step 2 · Claude Project",
      },
      {
        n: "04",
        title: "The gap list",
        description: "Each of the six gaps gets an owner, a date and a request from the template.",
        tool: "Step 3 · Claude Project",
      },
      {
        n: "05",
        title: "The reply to Tannwald",
        description:
          "Claude checks the draft's four sentences against the files. The reply holds only sentences a file proves, and you edit one by hand.",
        tool: "Step 3 · Claude Project",
      },
    ],
    caseStudy: {
      companyName: "Vardar Works DOOEL",
      isFictional: true,
      location: "Skopje",
      sector: "customer service for Tannwald Haustechnik GmbH, Hamburg",
      period: "Request of 9 November 2026, remote audit on 10 December 2026",
      narrative:
        "Tannwald uses the audit right in its data processing agreement and sends eight items. The folder holds a file whose name fits each one. The managing director has already drafted four sentences as a reply.",
      metrics: [
        { label: "Staff", value: "120" },
        { label: "Request items", value: "8" },
        { label: "Files in the folder", value: "11" },
        { label: "Evidence window", value: "12 months" },
      ],
      decisionQuestion: "Which files in the folder are evidence?",
      limitationsHeading: "Read this first",
      dataLimitations: [
        "Every company, person and file is invented.",
        "Two lines quote Anthropic's public privacy page. This is not legal advice.",
      ],
    },
    materials: materials("en", [
      ["Deck", "For the projector. The right arrow shows the next step, the left arrow goes back."],
      ["Vardar audit kit · .zip", "19 text files: the request, eleven invented files, rules, the skill, templates and the answers."],
    ]),
    kit: AUDIT_KIT.en,
  },
};

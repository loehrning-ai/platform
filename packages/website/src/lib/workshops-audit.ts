import type { Locale } from "./i18n/locale";
import type { Workshop, WorkshopMaterial } from "./workshops";
import { AUDIT_KIT } from "./workshops-audit-kit";
import { DECK_KEYS } from "./deck-keys-copy";

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
 * plan's 16 main slides, one block per slide (the detail page does not show it; tests and machine
 * surfaces read it). Registered in WORKSHOPS_BY_LOCALE with the Sage poster palette.
 */

/** Sizes of the two kit zips, rounded to the nearest KB (1024 bytes). */
const KIT_SIZE_LABEL: Readonly<Record<Locale, string>> = { de: "45 KB", en: "42 KB" };

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
    summary:
      "Vardar Works hat elf Dateien für acht Anforderungen eines Kundenaudits. Welche halten einer Prüfung stand, welches Dokument fehlt?",
    lede: "Ein Kunde fordert acht Audit-Nachweise: Tim prüft elf Dateien live in Claude, der Raum schätzt und prüft mit.",
    description:
      "Vardar Works, eine erfundene Support-Firma in Skopje, bekommt von ihrem Kunden Tannwald Haustechnik eine Dokumentenanfrage mit acht Anforderungen für ein Lieferantenaudit. Im Ordner liegen elf Dateien, und zu jeder Anforderung passt ein Dateiname. Tim bedient Claude live, der Raum sagt das Ergebnis voraus und prüft die Zitate gegen die Dateien. Du lernst, Zitat, Zeitraum, Umfang und Freigabe zu prüfen und aus jeder Lücke eine konkrete Anfrage zu machen. Zu Hause wiederholst du die drei Schritte mit dem Kit in Claude oder Codex.",
    format: "Live-Workshop mit Deck",
    duration: "~90 Minuten",
    accessNote:
      "In Claude gehen nur die erfundenen Dateien des Kits. Firmenunterlagen lädst du nur in das Firmenkonto, das deine Firma freigegeben hat.",
    outcome: "Eine Lückenliste mit zuständiger Person pro Lücke und eine Antwort, die nur belegte Sätze enthält",
    stageExplainer: {
      heading: "Was prüfen wir?",
      body:
        "Ein Kundenaudit prüft, ob zugesagte Kontrollen belegt sind. Elf erfundene Dateien sollen acht Anforderungen erfüllen. Das Kit enthält die Anfrage, Regeln, Vorlagen und Lösungen. Zu Hause prüfst du sie in Claude oder Codex.",
      facts: ["19 Textdateien", "3 Schritte", "ca. 60 Min. allein"],
    },
    audience: [
      "Mitarbeitende, die Unterlagen für ein Kunden- oder Lieferantenaudit zusammenstellen",
      "Teamleitungen in IT, Qualität oder Datenschutz, die Fragebögen von Kunden beantworten",
      "Junior-Kräfte, die zum ersten Mal einen Nachweisordner vorbereiten",
    ],
    notForYou: "Nicht für dich, wenn du Rechtsberatung brauchst oder selbst ein Zertifizierungsaudit durchführst.",
    question: "Welche Anforderung ist belegt, welches Dokument fehlt?",
    outcomes: [
      "Du prüfst jede Datei auf Zitat, Zeitraum, Umfang und Freigabe und nennst die Prüfung, an der sie scheitert.",
      "Du gibst Claude die vier Prüfungen als Regeln und prüfst jedes Zitat gegen seine Datei.",
      "Du schreibst eine Lückenliste mit zuständigen Personen und eine Antwort, die nur belegte Sätze enthält.",
    ],
    agenda: [
      { label: "Eine Anfrage, elf Dateien, vier Prüfungen", minutes: 1, activity: "listen" },
      { label: "Vardar Works und sein Kunde Tannwald", minutes: 3, activity: "listen" },
      { label: "Gastgeber", minutes: 1, activity: "listen" },
      { label: "Der Fall: 440.000 A$ für einen Bericht", minutes: 3, activity: "listen" },
      { label: "Tannwald will acht Nachweise: schätzen", minutes: 4, activity: "vote" },
      { label: "Der Entwurf behauptet vier Dinge", minutes: 3, activity: "vote" },
      { label: "Heute: die Frage, der Weg, die Rollen", minutes: 3, activity: "listen" },
      { label: "Elf Dateien, acht Treffer", minutes: 4, activity: "listen" },
      { label: "Die vier Prüfungen pro Datei", minutes: 6, activity: "vote" },
      { label: "Live: das Projekt in Claude", minutes: 3, activity: "listen" },
      { label: "Schritt 1: welche Dateien halten?", minutes: 13, activity: "vote" },
      { label: "Schritt 2: erst das Zitat, dann der Status", minutes: 20, activity: "vote" },
      { label: "Vier falsche Zeilen, vier Regeln", minutes: 5, activity: "vote" },
      { label: "Schritt 3: jede Lücke wird eine Aufgabe", minutes: 10, activity: "vote" },
      { label: "Nur belegte Sätze gehen raus", minutes: 6, activity: "write" },
      { label: "Das Ergebnis: der Ordner belegt 2 von 8", minutes: 5, activity: "vote" },
    ],
    agendaSource: "deck",
    minutesLive: 90,
    minutesSelfStudy: 60,
    needs: [
      "Live: nichts. Abgestimmt wird per Handzeichen; am Ende ein Handy für die QR-Codes",
      "Zu Hause: Claude (App oder claude.ai, jeder Plan) mit Codeausführung, oder Codex mit dem entpackten Kit-Ordner; Anleitung in START-HIER.md",
    ],
    notNeeded: ["Programmierkenntnisse", "Einen API-Schlüssel", "Vorwissen zu ISO 27001", "Firmenunterlagen"],
    notCovered: [
      "Rechtsberatung oder eine Zertifizierung",
      "Die Vorbereitung auf ein Zertifizierungsaudit nach ISO 27001",
      "Die Einrichtung eines Team- oder Enterprise-Kontos",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-29",
      data: "synthetic",
      note: "Alle Firmen, Personen und Dateien sind erfunden. Zwei Zeilen zitieren Anthropics öffentliche Datenschutzseite. Die vier Prüfungen sind Arbeitsregeln dieses Falls; Zeiträume und Schwellenwerte kommen aus der Kundenanfrage. ISO 19011 und ISO/IEC 27001 liefern den fachlichen Hintergrund. Keine Rechtsberatung.",
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
          "Claude liest Typ, Datum und Freigabe jeder Datei aus dem Text, nie aus dem Dateinamen. Vier von elf Dateien fallen durch.",
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
        description:
          "Jede der sechs offenen Anforderungen (einmal SCHWACH, fünfmal LÜCKE) bekommt eine zuständige Person, ein Datum und eine Anfrage aus der Vorlage.",
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
      decisionQuestion: "Welche Anforderung ist belegt, welches Dokument fehlt?",
      limitationsHeading: "Zuerst lesen",
      dataLimitations: [
        "Jede Firma, jede Person und jede Datei ist erfunden.",
        "Zwei Zeilen zitieren Anthropics öffentliche Datenschutzseite. Das ist keine Rechtsberatung.",
      ],
    },
    materials: materials("de", [
      ["Deck · 16 Folien", `Für den Beamer. ${DECK_KEYS.de}`],
      ["Vardar-Audit-Kit · .zip", "19 Textdateien: Anleitung, Regeln, Skill, Vorlagen und Lösungen auf Deutsch; die Anfrage, der Entwurf und die elf erfundenen Dateien auf Englisch, wie im Workshop."],
    ]),
    kit: AUDIT_KIT.de,
  },
  en: {
    slug: "audit-vorbereitung-mit-ki",
    number: "05",
    topic: "Audit preparation",
    title: "Audit Preparation with AI: Organize Evidence and Find Gaps",
    eyebrow: "Workshop 05 · Audit preparation",
    summary:
      "Vardar Works has eleven files for eight customer audit requirements. Which stand up to scrutiny, and which document is missing?",
    lede: "A customer wants eight audit items proven: Tim checks eleven files live in Claude while the room predicts and checks the evidence.",
    description:
      "Vardar Works, an invented support firm in Skopje, gets a document request with eight items from its customer Tannwald Haustechnik for a supplier audit. The folder holds eleven files, and every item has a file whose name fits. Tim runs Claude live; the room predicts the result and checks the quotes against the files. You learn to test quote, period, scope and approval and turn each gap into a specific request. At home, repeat the three steps with the kit in Claude or Codex.",
    format: "Live workshop with deck",
    duration: "~90 minutes",
    accessNote:
      "Only the kit's invented files go into Claude. Company documents go only into the company account your firm approved.",
    outcome: "A gap list with an owner for every gap and a reply that holds only proven sentences",
    stageExplainer: {
      heading: "What do we check?",
      body:
        "A customer audit checks whether promised controls have evidence. Eleven invented files must support eight requirements. The kit contains the request, rules, templates and answers. At home, check them in Claude or Codex.",
      facts: ["19 text files", "3 steps", "about 60 min alone"],
    },
    audience: [
      "Staff who put together documents for a customer or supplier audit",
      "Team leads in IT, quality or data protection who answer customer questionnaires",
      "Junior staff preparing an evidence folder for the first time",
    ],
    notForYou: "Not for you if you need legal advice or run a certification audit yourself.",
    question: "Which item is proven, which document is missing?",
    outcomes: [
      "Test each file for quote, period, scope and approval, and name the test it fails.",
      "Give Claude the four tests as rules and check every quote against its file.",
      "Write a gap list with owners and a reply that holds only proven sentences.",
    ],
    agenda: [
      { label: "One request, eleven files, four tests", minutes: 1, activity: "listen" },
      { label: "Vardar Works and its customer Tannwald", minutes: 3, activity: "listen" },
      { label: "Your host", minutes: 1, activity: "listen" },
      { label: "The case: a report worth A$440,000", minutes: 3, activity: "listen" },
      { label: "Tannwald wants eight documents: estimate", minutes: 4, activity: "vote" },
      { label: "The draft makes four claims", minutes: 3, activity: "vote" },
      { label: "Today: the question, the route, the roles", minutes: 3, activity: "listen" },
      { label: "Eleven files, eight matches", minutes: 4, activity: "listen" },
      { label: "Four tests per file", minutes: 6, activity: "vote" },
      { label: "Live: the Project in Claude", minutes: 3, activity: "listen" },
      { label: "Step 1: which files hold?", minutes: 13, activity: "vote" },
      { label: "Step 2: quote first, then the status", minutes: 20, activity: "vote" },
      { label: "Four wrong lines, four rules", minutes: 5, activity: "vote" },
      { label: "Step 3: every gap becomes a task", minutes: 10, activity: "vote" },
      { label: "Only proven sentences go out", minutes: 6, activity: "write" },
      { label: "The result: the folder proves 2 of 8", minutes: 5, activity: "vote" },
    ],
    agendaSource: "deck",
    minutesLive: 90,
    minutesSelfStudy: 60,
    needs: [
      "Live: nothing. You vote by show of hands; a phone for the QR codes at the end",
      "At home: Claude (app or claude.ai, any plan) with code execution, or Codex with the unzipped kit folder; setup in START-HERE.md",
    ],
    notNeeded: ["Coding skills", "An API key", "Knowledge of ISO 27001", "Company documents"],
    notCovered: [
      "Legal advice or a certification",
      "Preparing for an ISO 27001 certification audit",
      "Setting up a Team or Enterprise account",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-29",
      data: "synthetic",
      note: "Every company, person and file is invented. Two lines quote Anthropic's public privacy page. The four tests are working rules for this case; the customer request sets the periods and thresholds. ISO 19011 and ISO/IEC 27001 provide background. Not legal advice.",
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
          "Claude reads each file's type, date and approval from its text, never from its name. Four of eleven files fail.",
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
        description: "Each of the six open requests (one WEAK, five GAP) gets an owner, a date and a request from the template.",
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
      decisionQuestion: "Which item is proven, which document is missing?",
      limitationsHeading: "Read this first",
      dataLimitations: [
        "Every company, person and file is invented.",
        "Two lines quote Anthropic's public privacy page. This is not legal advice.",
      ],
    },
    materials: materials("en", [
      ["Deck · 16 slides", `For the projector. ${DECK_KEYS.en}`],
      ["Vardar audit kit · .zip", "19 text files: the request, eleven invented files, rules, the skill, templates and the answers."],
    ]),
    kit: AUDIT_KIT.en,
  },
};

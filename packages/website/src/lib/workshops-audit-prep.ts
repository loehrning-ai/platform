import type { Locale } from "./i18n/locale";
import type { Workshop, WorkshopMaterial } from "./workshops";
import { AUDIT_PREP_KIT } from "./workshops-audit-prep-kit";

const base = "/workshops/audit-vorbereitung-mit-ki";

/**
 * Workshop 05, "Audit Preparation with AI: Organize Evidence and Find Gaps". The published deck, game sheet and kit
 * live in public/workshops/audit-vorbereitung-mit-ki; the kit's source files and the checks that tie every
 * figure to them are in scripts/workshop05 (build-kit.mjs, verify-kit.mjs). The company, its files, its invoice and
 * its auditor are invented. The agenda follows the deck's 19 slides. Tim demos Claude while the room plays; the kit
 * is the take-home assignment. Registered in WORKSHOPS_BY_LOCALE with the Sage poster palette
 * (docs/workshop-standard.md, section 5.1).
 */

/** Size of termin-health-audit-kit.zip (706,392 bytes), rounded to the nearest KB (1024 bytes). */
const KIT_SIZE_LABEL = "690 KB";

type MaterialFrame = Omit<WorkshopMaterial, "label" | "description" | "sizeLabel">;

/** Shared href, kind, language, role and phase: both locales list the same files in the same order. */
const MATERIALS: readonly MaterialFrame[] = [
  { href: `${base}/slides.html`, kind: "html", language: "en", role: "deck", phase: "during", minutes: 60, primary: true },
  { href: `${base}/termin-health-audit-kit.zip`, kind: "zip", language: "en", role: "kit", phase: "after" },
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

export const AUDIT_PREP_WORKSHOP: Readonly<Record<Locale, Workshop>> = {
  de: {
    slug: "audit-vorbereitung-mit-ki",
    number: "05",
    topic: "Audit",
    title: "Audit-Vorbereitung mit KI: Belege ordnen und Lücken finden",
    eyebrow: "Workshop 05 · Audit",
    summary:
      "Eine erfundene Softwarefirma bekommt drei Audit-Anfragen in einer Woche. Claude beantwortet alle aus denselben Dateien und benennt, was fehlt.",
    description:
      "Termin Health DOOEL, eine erfundene Softwarefirma in Skopje, speichert Gesundheitsdaten für private Kliniken und wird in 20 Tagen von ihrem größten Kunden geprüft. Es gibt drei Anfragen: eine Dokumentenanfrage mit acht Punkten, sieben Sicherheitsaussagen für die Website und einen Löschantrag, den die Auditorin als Stichprobe verfolgt. Tim demonstriert Claude live auf dem Beamer, während der Raum auf Papier oder dem Handy mitspielt: Die Gruppe sucht Fallen in den Dateien, tippt vor jeder Antwort auf das Ergebnis, stimmt über die Aussagen ab und sortiert, welche Datei in welches KI-Werkzeug darf. Zu Hause ist das Kit die selbstgeführte Aufgabe mit einer zehnminütigen Fallensuche, fünf Schritten und einem Lösungsschlüssel zur eigenen Kontrolle.",
    format: "Live-Workshop mit Deck",
    duration: "~60 Minuten",
    accessNote:
      "Das Material ist auf Englisch; Tim demonstriert Claude live am Beamer, während der Raum per Handy oder Papier mitspielt, vor jeder Antwort tippt und abstimmt; Laptop oder Claude-Konto sind nicht nötig. Zu Hause ist das Kit deine Aufgabe für etwa zwei Stunden beim ersten Mal: fünf Schritte und ein Lösungsschlüssel zur Selbstkontrolle, mit jedem Claude-Plan einschließlich Free; die erfundenen Dateien werden in Claude hochgeladen.",
    outcome:
      "Selbstgeführtes Kit mit Fallensuche, fünf Prompts und Lösungsschlüssel sowie einer Methode, um die nächste Audit-Anfrage aus einem Ordner zu beantworten, mit Quelle und Status je Antwort",
    audience: [
      "Qualitäts- und Sicherheitsverantwortliche kleiner Firmen, die ein Kundenaudit vorbereiten",
      "Geschäftsführung und Vertrieb, die Sicherheitsaussagen für Website und Ausschreibungen freigeben",
      "Teams, die KI-Werkzeuge mit personenbezogenen Daten einsetzen und dafür Belege brauchen",
    ],
    notForYou:
      "Nicht für dich, wenn du eine ISO-27001-Zertifizierung von Grund auf einführen oder Rechtsberatung zur DSGVO suchst.",
    question:
      "Wie beantworten wir die Audit-Anfragen bis Freitag aus einem Satz Belege, ohne etwas zu behaupten, das wir nicht belegen können?",
    outcomes: [
      "Du richtest ein Claude-Projekt mit eigenen Dateien und drei Regeln ein und lässt Claude eine Dokumentenanfrage mit Quelle und Status je Antwort beantworten.",
      "Du sortierst Sicherheitsaussagen in rot, gelb und grün und schreibst belegbare Fassungen.",
      "Du entscheidest für jede Datei, ob sie ohne Änderung, bereinigt oder gar nicht in ein KI-Werkzeug darf.",
      "Du verfolgst einen Datensatz durch alle Systeme und erkennst, wo der Nachweis endet.",
    ],
    agenda: [
      { label: "Kaltstart: Daumen hoch oder runter", minutes: 1, activity: "vote", description: "Würdest du diese Antwort an die Auditorin schicken?" },
      { label: "Hände, Vermutungen und Setup", minutes: 9, activity: "do", description: "Warum Audits kommen, wie eine Stichprobe läuft, die fünf Fragen an einen Beleg und das Claude-Projekt." },
      { label: "Fallensuche", minutes: 3, activity: "do", description: "In Paaren Fallen in den Dateien finden und eine saubere Datei erkennen." },
      { label: "Tipp: die Dokumentenanfrage", minutes: 7, activity: "vote", description: "Erst tippen, wie viele Punkte belegt sind, dann Claude prüfen." },
      { label: "Abstimmung: die Trust-Page-Aussagen", minutes: 6, activity: "vote", description: "Die Gruppe ordnet sieben Aussagen Rot, Gelb oder Grün zu." },
      { label: "Sortieren: Daten, Ort, Vertrag", minutes: 5, activity: "vote", description: "Sechs Dateien den Spuren Go, Bereinigen und Draußen zuordnen." },
      { label: "Tipp: den Datensatz verfolgen", minutes: 8, activity: "do", description: "Vor der Auswertung tippen, wo der Faden reißt, dann die Spur prüfen." },
      { label: "Tipp: der Audit-Pass", minutes: 6, activity: "do", description: "Vorhersagen, wie viele Themen belegt sind und wie lange Claude braucht." },
      { label: "Tipp und Prüfung: die Überraschung", minutes: 7, activity: "vote", description: "Vorhersagen, was sich mit dem neuen Dokument ändert, dann den Beleg prüfen." },
      { label: "Fünf Fakten, Exit-Ticket und Abschluss", minutes: 8, activity: "write", description: "Die fünf Fakten je KI-Werkzeug festhalten und einen eigenen nächsten Schritt notieren." },
    ],
    agendaSource: "deck",
    minutesLive: 60,
    minutesSelfStudy: 120,
    selfStudyDurationLabel: "Beim ersten Mal etwa 2 Stunden",
    needs: [
      "Live: nichts zu installieren. Ein Stift oder dein Handy für die Abstimmungen.",
      "Zum Nachmachen die Claude-Desktop-App oder claude.ai, jeder Plan",
      "Zu Hause: Codeausführung in Claude eingeschaltet (Settings > Capabilities)",
      "Zu Hause etwa 2 Stunden für die Fallensuche, die Sortierübung und fünf Schritte. Du kannst nach jedem Schritt aufhören.",
    ],
    notNeeded: [
      "Programmierkenntnisse",
      "Einen API-Schlüssel",
      "Vorwissen zu ISO 27001, DSGVO oder dem AI Act",
      "Eigene Firmendaten",
    ],
    notCovered: [
      "Rechtsberatung und eine Zertifizierung oder Bescheinigung",
      "Eine vollständige Einführung von ISO 27001",
      "Der Betrieb eines eigenen Sprachmodells; es geht darum, was du darüber aufschreibst",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-18",
      data: "synthetic",
      note: "Firma, Personen, Zahlen, Verträge, Rechnung und Dokumente sind erfunden. Die zitierten Gesetze und Standards sind echt und mit Stand Oktober 2026 zusammengefasst.",
    },
    steps: [
      {
        n: "01",
        title: "Das Projekt anlegen",
        description:
          "Ein Claude-Projekt bekommt 13 Firmendateien und drei Regeln: nur unsere Dateien, Quelle nennen, GAP oder WEAK statt einer Schätzung.",
        tool: "Schritt 0 · Claude-Projekt",
      },
      {
        n: "02",
        title: "Die Dokumentenanfrage beantworten",
        description:
          "Claude beantwortet die acht Punkte von Rheinland Praxisverbund AG mit Quelle und Status. Prüfe jede Antwort gegen die Dateien.",
        tool: "Prompt 1",
      },
      {
        n: "03",
        title: "Sicherheitsaussagen prüfen",
        description:
          "Prüfe sieben Aussagen gegen die Dateien und finde für jede eine Fassung, die du belegen kannst.",
        tool: "Prompt 2",
      },
      {
        n: "04",
        title: "Einen Datensatz verfolgen",
        description:
          "Claude folgt einem Löschantrag durch jede Stelle, an der die Daten liegen könnten, und rechnet die Fristen in Code.",
        tool: "Prompt 3",
      },
      {
        n: "05",
        title: "Den Audit-Pass bauen",
        description:
          "Zwölf Themen bekommen je einen Status und das Dokument, das die Lücke schließt. Alles steht in einer Tabelle im Chat.",
        tool: "Prompt 4",
      },
      {
        n: "06",
        title: "Eine Überraschung einarbeiten",
        description:
          "Prüfe, welche Antworten das neue Dokument ändert und welche gleich bleiben.",
        tool: "Prompt 5",
      },
    ],
    caseStudy: {
      companyName: "Termin Health DOOEL",
      isFictional: true,
      location: "Erfundene Firma in Skopje, Nordmazedonien",
      sector: "Terminportal für private Kliniken, mit Gesundheitsdaten",
      period: "Audit in 20 Tagen, Anfragen im November 2026",
      narrative:
        "Termin Health speichert Termine und Laborbefunde für Kliniken in drei Ländern, nutzt einen Claude-Arbeitsbereich für den Support und betreibt ein eigenes Open-Weights-Modell auf einem gemieteten Server. Der größte Kunde, ein deutscher Klinikverbund, prüft die Firma. Die Antworten kommen aus 13 Dateien, die so unordentlich sind wie echte.",
      metrics: [
        { label: "Beschäftigte", value: "31" },
        { label: "Kliniken", value: "46" },
        { label: "Firmendateien", value: "13" },
        { label: "Versteckte Fallen", value: "7" },
      ],
      decisionQuestion:
        "Was darfst du einer Auditorin, einem Kunden oder auf der Website behaupten, wenn deine Dateien es nur zum Teil belegen?",
      limitationsHeading: "Bevor du startest",
      dataLimitations: [
        "Sieben Fallen und eine saubere Datei sind in den 13 Dateien versteckt. Finde sie, bevor Claude es tut.",
        "Alle Zahlen, Verträge und Dokumente sind erfunden. Das Kit bescheinigt nichts und ersetzt keine Rechtsberatung.",
      ],
    },
    materials: materials([
      [
        "Deck · 19 Folien",
        "Für den Beamer. Die Pfeiltaste nach rechts zeigt den nächsten Schritt einer Folie, nach links geht es zurück; jeder Prompt hat einen Kopierknopf.",
      ],
      [
        "Audit-Kit · .zip",
        "START-HERE.md (Fallensuche und Sortierübung zum Aufwärmen, Einrichtung, fünf Prompts), ANSWERS.md (Lösungsschlüssel: erst nach jedem Schritt öffnen), project-instructions.md (die drei Regeln), 13 Firmendateien, drei Anfragen und ein Rechnungsfoto für Schritt 5.",
        "Fünf Prompts, Antworten, 13 Dateien, drei Anfragen, Rechnungsfoto.",
      ],
    ]),
    kit: AUDIT_PREP_KIT.de,
  },
  en: {
    slug: "audit-vorbereitung-mit-ki",
    number: "05",
    topic: "Audit",
    title: "Audit Preparation with AI: Organize Evidence and Find Gaps",
    eyebrow: "Workshop 05 · Audit",
    summary:
      "An invented software company gets three audit requests in one week. Claude answers all of them from the same files and names what is missing.",
    description:
      "Termin Health DOOEL, an invented software company in Skopje, stores health data for private clinics and is audited by its largest customer in 20 days. Three requests arrive: a document request with eight items, seven security claims for the website, and an erasure request that the auditor will follow as a sample. Tim demos Claude live on a projector while the room plays along on paper or phones: the group hunts traps in the files, bets on each result before Claude shows it, votes on the claims and sorts which file may go into which AI tool. At home, the kit is a self-guided assignment with a 10-minute trap hunt, five steps and an answer key for checking your work.",
    format: "Live workshop with deck",
    duration: "~60 minutes",
    accessNote:
      "Tim demos Claude live on the projector while the room plays along on a phone or paper, bets before each answer and votes on the claims; no laptop or Claude account needed. The kit is the take-home assignment: about 2 hours the first time, with five steps and an answer key, on any Claude plan including Free; its fictional files are uploaded to Claude.",
    outcome:
      "A self-guided kit (trap hunt, five prompts, answer key) and a method to answer your next audit request from one folder, with a source and a status for every answer.",
    audience: [
      "Quality and security leads of small firms preparing a customer audit",
      "Owners and sales teams who approve security claims for websites and tenders",
      "Teams that use AI tools with personal data and need evidence for it",
    ],
    notForYou:
      "Not for you if you want to introduce ISO 27001 from scratch or need legal advice on the GDPR.",
    question:
      "How do we answer the audit requests by Friday from one set of evidence, without claiming anything we cannot prove?",
    outcomes: [
      "Set up a Claude Project with your files and three rules, and get a sourced, status-marked answer to a document request.",
      "Sort security claims into red, amber and green and write versions you can prove.",
      "Decide for each file whether it may go into an AI tool as it is, cleaned first, or not at all.",
      "Trace one record through every system and spot where the proof ends.",
    ],
    agenda: [
      { label: "Cold open: thumbs", minutes: 1, activity: "vote", description: "Would you send this answer to the auditor?" },
      { label: "Hands, guesses and setup", minutes: 9, activity: "do", description: "Why audits come, how a sample works, the five questions for evidence and the Claude Project." },
      { label: "Trap hunt", minutes: 3, activity: "do", description: "Find traps in the files in pairs and identify one clean file." },
      { label: "Bet: the document request", minutes: 7, activity: "vote", description: "Predict how many items are supported, then check Claude's work." },
      { label: "Vote: the Trust page claims", minutes: 6, activity: "vote", description: "Classify seven claims as RED, AMBER or GREEN." },
      { label: "Sort: Data, Place, Paper", minutes: 5, activity: "vote", description: "Put six files into the lanes GO, CLEAN FIRST and STAY OUT." },
      { label: "Bet: trace one record", minutes: 8, activity: "do", description: "Predict where the thread breaks, then check the trail." },
      { label: "Bet: the audit passport", minutes: 6, activity: "do", description: "Predict how many topics are covered and how long Claude will take." },
      { label: "Bet and check: the surprise", minutes: 7, activity: "vote", description: "Predict what changes with the new document, then check it." },
      { label: "Five facts, exit ticket and close", minutes: 8, activity: "write", description: "Write down the five facts for every AI tool and name your next step." },
    ],
    agendaSource: "deck",
    minutesLive: 60,
    minutesSelfStudy: 120,
    selfStudyDurationLabel: "about 2 hours the first time",
    needs: [
      "Live: nothing to install. A pen, or your phone for the votes.",
      "To replay it, the Claude desktop app or claude.ai, any plan",
      "At home: code execution switched on in Claude (Settings > Capabilities)",
      "About 2 hours at home for the warm-ups and five steps. You can stop after any step.",
    ],
    notNeeded: [
      "Programming skills",
      "An API key",
      "Prior knowledge of ISO 27001, the GDPR or the AI Act",
      "Your own company data",
    ],
    notCovered: [
      "Legal advice, a certification or any other attestation",
      "A full ISO 27001 implementation",
      "Running your own language model; the workshop covers what you write down about it",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-18",
      data: "synthetic",
      note: "The company, people, numbers, contracts, invoice and documents are invented. The laws and standards quoted are real and summarised as of October 2026.",
    },
    steps: [
      {
        n: "01",
        title: "Set up the Project",
        description:
          "A Claude Project gets 13 company files and three rules: only our files, cite the source, GAP or WEAK instead of a guess.",
        tool: "Step 0 · Claude Project",
      },
      {
        n: "02",
        title: "Answer the document request",
        description:
          "Claude answers the eight items from Rheinland Praxisverbund AG with source and status. Check each answer against the files.",
        tool: "Prompt 1",
      },
      {
        n: "03",
        title: "Check the security claims",
        description:
          "Check seven claims against the files and find a version you can prove today.",
        tool: "Prompt 2",
      },
      {
        n: "04",
        title: "Trace one record",
        description:
          "Claude follows an erasure request through every place that could hold the data and calculates the deadlines in code.",
        tool: "Prompt 3",
      },
      {
        n: "05",
        title: "Build the audit passport",
        description:
          "Twelve topics each get a status and the document that closes the gap. It is one table in the chat.",
        tool: "Prompt 4",
      },
      {
        n: "06",
        title: "Add one more surprise",
        description:
          "Check which answers change with the new document and which stay the same.",
        tool: "Prompt 5",
      },
    ],
    caseStudy: {
      companyName: "Termin Health DOOEL",
      isFictional: true,
      location: "Invented company in Skopje, North Macedonia",
      sector: "Appointment portal for private clinics, holding health data",
      period: "Audit in 20 days, requests in November 2026",
      narrative:
        "Termin Health stores appointments and lab results for clinics in three countries, uses a Claude workspace for support and runs its own open-weights model on a rented server. Its largest customer, a German clinic group, audits it. The answers come from 13 files that are as messy as real ones.",
      metrics: [
        { label: "Employees", value: "31" },
        { label: "Clinics", value: "46" },
        { label: "Company files", value: "13" },
        { label: "Hidden traps", value: "7" },
      ],
      decisionQuestion:
        "What may you tell an auditor, a customer or your website visitors when your files only partly prove it?",
      limitationsHeading: "Before you start",
      dataLimitations: [
        "Seven traps and one clean file are hidden in the 13 files. Find them before Claude does.",
        "All numbers, contracts and documents are invented. The kit certifies nothing and is not legal advice.",
      ],
    },
    materials: materials([
      [
        "Deck · 19 slides",
        "For the projector. The right arrow key shows the next step of a slide and the left one goes back; every prompt has a copy button.",
      ],
      [
        "Audit kit · .zip",
        "START-HERE.md (warm-up trap hunt and sorting exercise, setup, five prompts), ANSWERS.md (the answer key: open it only after each step), project-instructions.md (the three rules), 13 project files, three requests and an invoice photo for step 5.",
        "Five prompts, answer key, 13 files, three requests, invoice photo.",
      ],
    ]),
    kit: AUDIT_PREP_KIT.en,
  },
};

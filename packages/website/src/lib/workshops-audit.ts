import type { Locale } from "./i18n/locale";
import type { Workshop, WorkshopMaterial } from "./workshops";
import { AUDIT_KIT } from "./workshops-audit-kit";
import { DECK_KEYS } from "./deck-keys-copy";

const base = "/workshops/audit-vorbereitung-mit-ki";

/** One deck in two editions, built from one copy source by scripts/workshop05/deck-src/build.mjs. */
const DECK_FILE: Readonly<Record<Locale, string>> = { de: "slides.html", en: "en/slides.html" };

/** The kit edition in the page's language; both hold the same 41 files, one per language. */
const KIT_FILE: Readonly<Record<Locale, string>> = { de: "gradba-audit-kit-de.zip", en: "gradba-audit-kit.zip" };

/**
 * Workshop 05, "Audit Preparation with AI: Organize Evidence and Find Gaps". The kit's source files and
 * the checks that tie every figure to them are in scripts/workshop05 (build-kit.mjs, verify-kit.mjs,
 * oracle/); the demo at /demos/audit-vorbereitung-mit-ki runs the same folder. Gradba-Pro and every
 * file are invented; laws and public numbers come from official texts. The agenda follows the deck's
 * 16 main slides, one block per slide (the detail page does not show it; tests and machine surfaces
 * read it); workshops-audit.test.ts holds it equal to the deck's labels and minutes, so a slide edit
 * fails there until this array is edited too. Registered in WORKSHOPS_BY_LOCALE with the Sage poster
 * palette.
 */

/** Sizes of the two kit zips, rounded to the nearest KB (1024 bytes): 117940 and 108496 bytes. */
const KIT_SIZE_LABEL: Readonly<Record<Locale, string>> = { de: "115 KB", en: "106 KB" };

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
      "Eine erfundene Firma bekommt Besuch vom Arbeitsinspektor. Du sammelst ihre Papiere mit KI, findest die Lücken und baust ein Register für die nächste Prüfung.",
    lede:
      "Am Montag kommt ein Brief: In vier Tagen kommt der Arbeitsinspektor, und die Papiere liegen an fünf Orten. Claude sucht und prüft. Eine Person liest und unterschreibt.",
    description:
      "Prüfungen kommen oft und in mehreren Formen. Bereite dich mit KI vor: ein Ordner, klare Regeln, ein Register, das du wieder nutzt. Kostenlos, mit Kit.",
    format: "Live-Workshop mit Deck",
    duration: "~90 Minuten",
    accessNote:
      "Alles läuft mit erfundenen Dateien, echte Daten sind nicht nötig. Schritt 2 startet ein kleines Skript: Schalte in Claude die Codeausführung an (jeder Tarif) oder lass check.py auf deinem eigenen Rechner laufen.",
    outcome: "Ein Status je Frage und ein Register, das du wieder nutzt",
    stageExplainer: {
      heading: "Was ist das Kit?",
      body:
        "Ein Brief, ein erfundener Ordner und ein Lösungsschlüssel. Vier Schritte in Claude, zu jedem zeigt das Deck einen aufgezeichneten Lauf. Etwa 90 Minuten am Schreibtisch (unsere Schätzung).",
      facts: ["41 Dateien", "4 Schritte", "13 Fragen"],
    },
    audience: [
      "Büroleitungen, Buchhaltung und Inhaber kleiner Firmen in Nordmazedonien, die geprüft werden: vom Arbeitsinspektor, von der Steuerbehörde (UJP) oder von einer ISO-Zertifizierungsstelle.",
    ],
    notForYou: "Du brauchst Rechtsberatung für einen echten Fall, oder ein Werkzeug, das Papiere für dich ausfüllt.",
    question: "Welche Kontrolle könnte zu dir kommen, und halten deine Papiere?",
    outcomes: [
      "Nenne die Prüfungen, die zu einer kleinen Firma kommen können, und warum es sich lohnt, vor dem Brief bereit zu sein.",
      "Lass Claude die Papiere in einem Ordner prüfen und markiere jede Frage als BELEGT, SCHWACH oder LÜCKE, mit Zitat.",
      "Baue ein Register, das du für die nächste Prüfung wieder nutzt, und sage, was KI tun darf und was eine Person unterschreibt.",
    ],
    agenda: [
      { label: "Titel", minutes: 1, activity: "listen" },
      { label: "Heute", minutes: 3, activity: "listen" },
      { label: "Hier wird oft kontrolliert", minutes: 5, activity: "vote" },
      { label: "Welche Firmen und warum", minutes: 4, activity: "vote" },
      { label: "Wir sind Gradba-Pro", minutes: 4, activity: "listen" },
      { label: "Besuch in vier Tagen", minutes: 7, activity: "vote" },
      { label: "Wo sind unsere Daten?", minutes: 4, activity: "listen" },
      { label: "Unser Kit", minutes: 5, activity: "do" },
      { label: "Schritt 1: die Tabelle bauen", minutes: 6, activity: "do" },
      { label: "Schritt 2: den Check laufen lassen", minutes: 9, activity: "do" },
      { label: "Vier Prüfungen, drei Status", minutes: 5, activity: "vote" },
      { label: "Schritt 3: Status, Plan, Briefing", minutes: 8, activity: "do" },
      { label: "Schritt 4: das Register bauen", minutes: 11, activity: "do" },
      { label: "Bereit bleiben", minutes: 8, activity: "write" },
      { label: "Sicherheit: was hinein darf, wer unterschreibt", minutes: 6, activity: "vote" },
      { label: "Welche Kontrolle jetzt", minutes: 4, activity: "vote" },
    ],
    agendaSource: "deck",
    minutesLive: 90,
    minutesSelfStudy: 90,
    needs: [
      "Einen Browser und Claude, in jedem Tarif (Codeausführung an)",
      "Schritt 2 schreibt und startet ein kleines Skript",
    ],
    notNeeded: [
      "Programmierkenntnisse",
      "Echte Dokumente",
    ],
    notCovered: [
      "Rechtsberatung",
      "Lebensmittelkontrollen im Detail",
      "Zoll",
      "Die Daten deiner eigenen Firma",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-11-07",
      data: "synthetic",
      note: "Nordmazedonien, Stand 7. November 2026: Gesetze und Jahresberichte der Behörden, dazu Pressemeldungen, Anbieterseiten und Bedingungen, jeweils mit Quelle und Vertrauensstufe. Die Seiten der Beobachtungsliste wurden am 8. November 2026 geprüft. Die Firma, ihre Papiere und ihre Daten sind erfunden. Keine Rechtsberatung.",
    },
    steps: [
      {
        n: "01",
        title: "Brief lesen",
        description:
          "Im Deck, vor dem Kit: Der Brief lässt vier Tage, und die Papiere liegen an fünf Orten. Von Hand heißt das zwei lange Abende.",
        tool: "Das Deck",
      },
      {
        n: "02",
        title: "Tabelle bauen",
        description:
          "Eine Zeile pro Frage des Inspektors: welches Papier sie beantwortet, wer zuständig ist, wo es liegt.",
        tool: "Claude-Projekt",
      },
      {
        n: "03",
        title: "Check laufen lassen",
        description:
          "Ein Skript zählt jede Zeile. Es findet 10 echte Probleme und schließt 8 Grenzfälle aus. Mit echten Dateien läuft das Skript auf deinem eigenen Rechner.",
        tool: "Claude-Projekt",
      },
      {
        n: "04",
        title: "Status, Plan, Briefing",
        description:
          "Jede Frage bekommt BELEGT, SCHWACH oder LÜCKE, mit Zitat. Der Plan legt neue Papiere mit Datum an und ändert nie ein altes. Dazu ein kurzes Briefing für den Besuch.",
        tool: "Claude-Projekt",
      },
      {
        n: "05",
        title: "Register bauen",
        description:
          "Eine Tabelle mit jedem Papier, seinem Datum, der zuständigen Person und dem Ablageort. Ein regelmäßiger Check sagt, was abgelaufen ist und was fehlt. Der Ordner und die vier Schritte taugen auch für die nächste Prüfung.",
        tool: "Claude-Projekt",
      },
    ],
    caseStudy: {
      companyName: "Gradba-Pro DOOEL",
      isFictional: true,
      location: "Bitola, Nordmazedonien",
      sector: "Baustoffhandel mit 24 Beschäftigten",
      period: "November 2026",
      narrative:
        "Gradba-Pro verkauft Baustoffe in Bitola und hat 24 Beschäftigte. Die letzte Kontrolle war im Frühjahr 2024, und seitdem hat niemand die Ordner geöffnet. Am Montag, dem 23. November, kündigt das Arbeitsinspektorat einen Besuch für den 27. November an, und die Büroleiterin hat vier Tage und Papiere an fünf Orten.",
      metrics: [
        { label: "Fragen geprüft", value: "13" },
        { label: "Funde", value: "10" },
        { label: "Geprüft, in Ordnung", value: "8" },
        { label: "Tage bis zum Besuch", value: "4" },
      ],
      decisionQuestion: "Welche Kontrolle könnte zu dir kommen, und halten deine Papiere?",
      limitationsHeading: "Was dieser Fall nicht zeigt",
      dataLimitations: [
        "Die Firma und jede Datei sind erfunden.",
        "Echte Inspektoren folgen keinem Drehbuch, und ein echter Lösungsschlüssel braucht eine Juristin, die die Branche kennt.",
      ],
    },
    materials: materials("de", [
      ["Deck · 16 Folien", `Für den Beamer. ${DECK_KEYS.de}`],
      ["Gradba-Audit-Kit · .zip", "41 Textdateien auf Deutsch: der Brief, der erfundene Ordner, die vier Prompts, der Lösungsschlüssel und Karten für drei Prüfungen (Arbeit, Steuer, ISO)."],
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
      "An invented firm gets a visit from the labour inspector. You gather its papers with AI, find the gaps and build a register for the next audit.",
    lede:
      "On Monday a letter arrives: the labour inspector comes in four days, and the papers are in five places. Claude does the searching and checking. A person reads and signs.",
    description:
      "Audits come often and in several kinds. Prepare with AI: one folder, clear rules and a register you can reuse. Free workshop with kit.",
    format: "Live workshop with deck",
    duration: "~90 minutes",
    accessNote:
      "Everything runs on invented files, so no real data is needed. Step 2 runs a small script: turn on code execution in Claude (any plan) or run check.py on your own computer.",
    outcome: "A status for each question and a register you can reuse",
    stageExplainer: {
      heading: "What is the kit?",
      body:
        "A letter, an invented folder and an answer key. Four steps in Claude, and the deck shows a recorded run of each. About 90 minutes at your desk (our estimate).",
      facts: ["41 files", "4 steps", "13 questions"],
    },
    audience: [
      "Office managers, accountants and owners of small firms in North Macedonia who get audited: by the labour inspector, the tax authority (UJP) or an ISO certifier.",
    ],
    notForYou: "You need legal advice for a real case, or a tool that fills in papers for you.",
    question: "Which check could come to you, and would your papers hold up?",
    outcomes: [
      "Name the audits a small firm can get, and why it pays to be ready before the letter comes.",
      "Let Claude check the papers in one folder and mark each question COVERED, WEAK or GAP, with a quote.",
      "Build a register you can reuse for the next audit, and say what AI may do and what a person signs.",
    ],
    agenda: [
      { label: "Cover", minutes: 1, activity: "listen" },
      { label: "Today", minutes: 3, activity: "listen" },
      { label: "Audits happen here", minutes: 5, activity: "vote" },
      { label: "Which firms and why", minutes: 4, activity: "vote" },
      { label: "We are Gradba-Pro", minutes: 4, activity: "listen" },
      { label: "A visit in four days", minutes: 7, activity: "vote" },
      { label: "Where is our data?", minutes: 4, activity: "listen" },
      { label: "Our kit", minutes: 5, activity: "do" },
      { label: "Step 1: make the table", minutes: 6, activity: "do" },
      { label: "Step 2: run the check", minutes: 9, activity: "do" },
      { label: "Four tests, three statuses", minutes: 5, activity: "vote" },
      { label: "Step 3: status, plan, briefing", minutes: 8, activity: "do" },
      { label: "Step 4: build the register", minutes: 11, activity: "do" },
      { label: "Stay ready", minutes: 8, activity: "write" },
      { label: "Safety: what goes in, who signs", minutes: 6, activity: "vote" },
      { label: "Which check now", minutes: 4, activity: "vote" },
    ],
    agendaSource: "deck",
    minutesLive: 90,
    minutesSelfStudy: 90,
    needs: [
      "A browser and Claude, on any plan (code execution on)",
      "Step 2 writes and runs a small script",
    ],
    notNeeded: [
      "Coding skills",
      "Real documents",
    ],
    notCovered: [
      "Legal advice",
      "Food safety inspections in depth",
      "Customs",
      "Your own firm's data",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-11-07",
      data: "synthetic",
      note: "North Macedonia, as of 7 November 2026: laws and annual reports of the authorities, plus press reports, vendor pages and terms, each labelled with its source and confidence. The sites of the watch list were checked on 8 November 2026. The firm, its papers and its dates are invented. Not legal advice.",
    },
    steps: [
      {
        n: "01",
        title: "Read the letter",
        description:
          "In the deck, before the kit: the letter gives four days, and the papers are in five places. By hand that means two late evenings.",
        tool: "The deck",
      },
      {
        n: "02",
        title: "Make the table",
        description:
          "One row per inspector question: which paper answers it, who owns it, where it lives.",
        tool: "Claude Project",
      },
      {
        n: "03",
        title: "Run the check",
        description:
          "A script counts every row. It finds 10 real problems and rules out 8 near misses. With real files the script runs on your own computer.",
        tool: "Claude Project",
      },
      {
        n: "04",
        title: "Status, plan, briefing",
        description:
          "Each question gets COVERED, WEAK or GAP, with a quote. The plan adds new dated papers and never changes an old one. Then a short briefing for the visit.",
        tool: "Claude Project",
      },
      {
        n: "05",
        title: "Build the register",
        description:
          "One table of every paper, its date, its owner and where it lives. A regular check says what ran out and what is missing. The same folder and the same four steps work for the next audit.",
        tool: "Claude Project",
      },
    ],
    caseStudy: {
      companyName: "Gradba-Pro DOOEL",
      isFictional: true,
      location: "Bitola, North Macedonia",
      sector: "building materials trade with 24 staff",
      period: "November 2026",
      narrative:
        "Gradba-Pro sells building materials in Bitola and has 24 employees. Its last inspection was in spring 2024, and nobody has opened the binders since. On Monday 23 November the labour inspectorate announces a visit for 27 November, and the office manager has four days and papers in five places.",
      metrics: [
        { label: "Questions checked", value: "13" },
        { label: "Findings", value: "10" },
        { label: "Checked, no problem", value: "8" },
        { label: "Days to the visit", value: "4" },
      ],
      decisionQuestion: "Which check could come to you, and would your papers hold up?",
      limitationsHeading: "What this case does not show",
      dataLimitations: [
        "The firm and every file are invented.",
        "Real inspectors do not follow a script, and a real answer key needs a lawyer who knows the sector.",
      ],
    },
    materials: materials("en", [
      ["Deck · 16 slides", `For the projector. ${DECK_KEYS.en}`],
      ["Gradba audit kit · .zip", "41 text files: the letter, the invented folder, the four prompts, the answer key and cards for three audits (labour, tax, ISO)."],
    ]),
    kit: AUDIT_KIT.en,
  },
};

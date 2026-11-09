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

/** Sizes of the two kit zips, rounded to the nearest KB (1024 bytes): 115944 and 106762 bytes. */
const KIT_SIZE_LABEL: Readonly<Record<Locale, string>> = { de: "114 KB", en: "105 KB" };

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
      "Eine erfundene Firma bekommt Besuch vom Arbeitsinspektor. Du ordnest ihre Papiere mit KI, findest die Lücken und baust ein Register, das aktuell bleibt.",
    lede:
      "Am Montag kommt ein Brief: Am 27. November kommt der Arbeitsinspektor. Du hast vier Tage und dreizehn Fragen. Du bereitest die Papiere mit KI vor, eine Person unterschreibt.",
    description:
      "Bereite dich mit KI auf eine Arbeitsinspektion vor: Papiere ordnen, Lücken finden, Register bauen. Dazu Steuerprüfung und ISO. Kostenlos, mit Kit.",
    format: "Live-Workshop mit Deck",
    duration: "~90 Minuten",
    accessNote:
      "Alles läuft mit erfundenen Dateien, echte Daten sind nicht nötig. Für Schritt 2 brauchst du einen Claude-Tarif, der Code ausführen kann.",
    outcome: "Eine Tabelle mit 13 Fragen, ein Status je Frage und ein Briefing für den Besuch",
    stageExplainer: {
      heading: "Was ist das Kit?",
      body:
        "Ein Brief, erfundene Unterlagen, ein Lösungsschlüssel. Vier Kit-Schritte in Claude, im Deck mit aufgezeichneten Läufen zum Vergleichen. Etwa 90 Minuten am Schreibtisch (unsere Schätzung).",
      facts: ["41 Dateien", "4 Schritte", "13 Fragen"],
    },
    audience: [
      "Büroleitungen, Buchhaltung und Inhaber kleiner Firmen in Nordmazedonien, die ein Inspektor, die Steuerbehörde (UJP) oder eine Zertifizierungsstelle prüft.",
    ],
    notForYou: "Du brauchst Rechtsberatung für einen echten Fall, oder ein Werkzeug, das Papiere für dich ausfüllt.",
    question: "Welche Kontrolle könnte zu dir kommen, und halten deine Papiere?",
    outcomes: [
      "Nenne, wonach ein Inspektor zuerst fragt, und zähle die Fristen ab einer Mitteilung.",
      "Prüfe die Papiere hinter dreizehn Fragen des Inspektors mit vier Tests und sage BELEGT, SCHWACH oder LÜCKE.",
      "Baue ein Register, das aktuell bleibt, und schreibe auf, was KI sortieren darf und was eine Person unterschreibt.",
    ],
    agenda: [
      { label: "Titel", minutes: 1, activity: "listen" },
      { label: "Heute", minutes: 3, activity: "listen" },
      { label: "Was passiert", minutes: 5, activity: "vote" },
      { label: "Welche Firmen und warum", minutes: 4, activity: "vote" },
      { label: "Wir sind Gradba-Pro", minutes: 4, activity: "listen" },
      { label: "Der Brief und die Fristen", minutes: 7, activity: "vote" },
      { label: "Von Hand oder mit Claude", minutes: 4, activity: "listen" },
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
      "Einen Browser und einen Claude-Tarif, der Code ausführen kann",
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
      note: "Nordmazedonien, Stand 7. November 2026: Gesetze und Jahresberichte der Behörden, dazu Pressemeldungen, Anbieterseiten und Bedingungen, jeweils mit Quelle und Vertrauensstufe. Die Firma, ihre Papiere und ihre Daten sind erfunden. Keine Rechtsberatung.",
    },
    steps: [
      {
        n: "01",
        title: "Tage zählen",
        description:
          "Zum Aufwärmen im Deck, noch vor dem Kit: von der Mitteilung bis zum Besuch zählen, Folie 6.",
        tool: "Abstimmung und Wochenlinie im Deck",
      },
      {
        n: "02",
        title: "Tabelle bauen",
        description:
          "Eine Zeile pro Frage der Prüfliste: Papier, Zuständige, Ablageort.",
        tool: "Claude-Projekt",
      },
      {
        n: "03",
        title: "Check laufen lassen",
        description:
          "Ein Skript zählt jede Zeile und nennt die Regel: 10 Funde, mindestens 8 geprüft ohne Befund (ein sorgfältiger Lauf darf mehr ausschließen). Mit echten Dateien läuft das Skript auf deinem Rechner (Stufe 3), Claude-Projekt mit erfundenen Dateien (Stufe 2).",
        tool: "Claude-Projekt",
      },
      {
        n: "04",
        title: "Status vergeben",
        description:
          "BELEGT, SCHWACH oder LÜCKE mit Zitat und vier Prüfungen, dazu neue Papiere mit echtem Datum, nie eine Änderung am alten.",
        tool: "Claude-Projekt",
      },
      {
        n: "05",
        title: "Register bauen",
        description:
          "Eine lebende Tabelle: ein Papier pro Zeile mit Datum, gültig bis, Zuständigem und Ablageort, dazu ein wöchentlicher Check (Free-Tarif: monatlich von Hand) und eine Frage ans Register.",
        tool: "Claude-Projekt, erfundene Dateien (Stufe 2)",
      },
    ],
    caseStudy: {
      companyName: "Gradba-Pro DOOEL",
      isFictional: true,
      location: "Bitola, Nordmazedonien",
      sector: "Baustoffhandel mit 24 Beschäftigten",
      period: "November 2026",
      narrative:
        "Gradba-Pro verkauft Baustoffe in Bitola und hat 24 Beschäftigte. Die letzte Kontrolle war im Frühjahr 2024 und seitdem hat niemand die Ordner geöffnet, obwohl das Arbeitsinspektorat auf dem Papier etwa eine reguläre Kontrolle im Jahr auf 13 aktive Firmen macht (eigene Rechnung, grob) und Kontrollen nach einer Beschwerde oder einer Anordnung in der Regel ohne Ankündigung kommen. Am Montag, dem 23. November, kündigt das Arbeitsinspektorat einen Besuch für den 27. November an, und die Büroleiterin hat vier Tage und Papiere an fünf verschiedenen Orten.",
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
      ["Gradba-Audit-Kit · .zip", "41 Textdateien: Anleitung, Regeln, Skill, Vorlagen, Feldkarten, Lösungen, der erfundene Ordner und bereit-bleiben/, alles auf Deutsch."],
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
      "An invented firm gets a visit from the labour inspector. You organize its papers with AI, find the gaps and build a register that stays current.",
    lede:
      "On Monday a letter arrives: on 27 November the labour inspector comes. You have four days and thirteen questions. You prepare the papers with AI, a person signs.",
    description:
      "Prepare for a labour inspection with AI: organize papers, find gaps, build a register. Plus tax control and ISO audits. Free workshop with kit.",
    format: "Live workshop with deck",
    duration: "~90 minutes",
    accessNote:
      "Everything runs on invented files, so no real data is needed. For Step 2 you need a Claude plan that can run code.",
    outcome: "A table of 13 questions, a status for each and a briefing for the visit",
    stageExplainer: {
      heading: "What is the kit?",
      body:
        "A letter, invented records and an answer key. Four kit steps in Claude, with recorded runs to compare in the deck. About 90 minutes at your desk (our estimate).",
      facts: ["41 files", "4 steps", "13 questions"],
    },
    audience: [
      "Office managers, accountants and owners of small firms in North Macedonia who get checked by an inspector, the tax authority (UJP) or a certifier.",
    ],
    notForYou: "You need legal advice for a real case, or a tool that fills in papers for you.",
    question: "Which check could come to you, and would your papers hold up?",
    outcomes: [
      "Name what an inspector asks for first and count the clocks from a notice.",
      "Check the papers behind thirteen inspector questions with four tests and say COVERED, WEAK or GAP.",
      "Build a register that stays current and write down what AI may sort and what a person signs.",
    ],
    agenda: [
      { label: "Cover", minutes: 1, activity: "listen" },
      { label: "Today", minutes: 3, activity: "listen" },
      { label: "What happens", minutes: 5, activity: "vote" },
      { label: "Which firms and why", minutes: 4, activity: "vote" },
      { label: "We are Gradba-Pro", minutes: 4, activity: "listen" },
      { label: "The letter and the clock", minutes: 7, activity: "vote" },
      { label: "By hand or with Claude", minutes: 4, activity: "listen" },
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
      "A browser and a Claude plan that can run code",
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
      note: "North Macedonia, as of 7 November 2026: laws and annual reports of the authorities, plus press reports, vendor pages and terms, each labelled with its source and confidence. The firm, its papers and its dates are invented. Not legal advice.",
    },
    steps: [
      {
        n: "01",
        title: "Count the days",
        description:
          "A warm-up in the deck, before the kit: count from the notice to the visit, slide 6.",
        tool: "Poll and week line in the deck",
      },
      {
        n: "02",
        title: "Make the table",
        description:
          "One row per checklist question: paper, owner, where it lives.",
        tool: "Claude Project",
      },
      {
        n: "03",
        title: "Run the check",
        description:
          "A script counts every row and names the rule: 10 findings, at least 8 checked with no problem (a careful run may clear more). With real files the script runs on your own computer (Level 3), Claude Project with invented files (Level 2).",
        tool: "Claude Project",
      },
      {
        n: "04",
        title: "Give a status",
        description:
          "COVERED, WEAK or GAP with a quote and the four tests, plus new papers with real dates, never a change to an old one.",
        tool: "Claude Project",
      },
      {
        n: "05",
        title: "Build the register",
        description:
          "One living table: one paper per row with date, valid until, owner and where it lives, plus a weekly check (Free plan: monthly by hand) and a question to the register.",
        tool: "Claude Project, invented files (Level 2)",
      },
    ],
    caseStudy: {
      companyName: "Gradba-Pro DOOEL",
      isFictional: true,
      location: "Bitola, North Macedonia",
      sector: "building materials trade with 24 staff",
      period: "November 2026",
      narrative:
        "Gradba-Pro sells building materials in Bitola and has 24 employees. Its last inspection was in spring 2024 and nobody has opened the binders since, although on paper the labour inspectorate does roughly one regular inspection a year for every 13 active firms (own calculation, rough), and inspections after a complaint or an order usually come without notice. On Monday 23 November the labour inspectorate announces a visit for 27 November, and the office manager has four days and papers in five different places.",
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
      ["Gradba audit kit · .zip", "41 text files: the letter, the invented folder, rules, field cards, the skill, templates, the answer key and keep-watch/."],
    ]),
    kit: AUDIT_KIT.en,
  },
};

import type { Locale } from "./i18n/locale";
import type { Workshop, WorkshopMaterial } from "./workshops";
import { AUDIT_KIT } from "./workshops-audit-kit";
import { DECK_KEYS } from "./deck-keys-copy";

const base = "/workshops/audit-vorbereitung-mit-ki";

/** One deck in two editions, built from one copy source by scripts/workshop05/deck-src/build.mjs. */
const DECK_FILE: Readonly<Record<Locale, string>> = { de: "slides.html", en: "en/slides.html" };

/** The kit edition in the page's language; both hold the same 34 files, one per language. */
const KIT_FILE: Readonly<Record<Locale, string>> = { de: "gradba-audit-kit-de.zip", en: "gradba-audit-kit.zip" };

/**
 * Workshop 05, "Audit Preparation with AI: Four Days Until the Inspection". The kit's source files and
 * the checks that tie every figure to them are in scripts/workshop05 (build-kit.mjs, verify-kit.mjs,
 * oracle/); the demo at /demos/audit-vorbereitung-mit-ki runs the same folder. Gradba-Pro and every
 * file are invented; laws and public numbers come from official texts. The agenda follows the deck's
 * 26 main slides, one block per slide (the detail page does not show it; tests and machine surfaces
 * read it); workshops-audit.test.ts holds it equal to the deck's labels and minutes, so a slide edit
 * fails there until this array is edited too. Registered in WORKSHOPS_BY_LOCALE with the Sage poster
 * palette.
 */

/** Sizes of the two kit zips, rounded to the nearest KB (1024 bytes): 97422 and 90735 bytes. */
const KIT_SIZE_LABEL: Readonly<Record<Locale, string>> = { de: "95 KB", en: "89 KB" };

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
    title: "Audit-Vorbereitung mit KI: Vier Tage bis zur Kontrolle",
    eyebrow: "Workshop 05 · Audit-Vorbereitung",
    summary:
      "Drei Arten von Kontrollen in Nordmazedonien. Eine erfundene Firma bekommt in vier Tagen den Arbeitsinspektor. Du bereitest ihre Papiere mit KI vor.",
    lede:
      "Am Montag kommt ein Brief: Am 27. November kommt der Arbeitsinspektor. Du hast vier Tage und dreizehn Fragen. Du bereitest die Papiere mit KI vor, eine Person unterschreibt.",
    description:
      "Bereite eine Arbeitsinspektion mit KI in vier Tagen vor: dreizehn Fragen, vier Prüfungen, ein Schlüssel. Dazu Steuerprüfung und ISO. Kostenlos, mit Kit.",
    format: "Live-Workshop mit Deck",
    duration: "~90 Minuten",
    accessNote:
      "Alles läuft mit erfundenen Dateien, echte Daten sind nicht nötig. Für Schritt 2 brauchst du einen Claude-Tarif, der Code ausführen kann.",
    outcome: "Eine Tabelle mit 13 Fragen, ein Status je Frage und ein Briefing für den Besuch",
    stageExplainer: {
      heading: "Was ist das Kit?",
      body:
        "Ein Brief vom Inspektorat, ein Ordner mit erfundenen Unterlagen und ein Lösungsschlüssel. Du führst drei Prompts in Claude oder Codex aus, etwa 70 Minuten.",
      facts: ["34 Dateien", "3 Schritte", "13 Fragen"],
    },
    audience: [
      "Büroleitungen, Buchhaltung und Inhaber kleiner Firmen in Nordmazedonien, die ein Inspektor, die Steuerbehörde (UJP) oder eine Zertifizierungsstelle prüft.",
    ],
    notForYou: "Du brauchst Rechtsberatung für einen echten Fall, oder ein Werkzeug, das Papiere für dich ausfüllt.",
    question: "Welche Kontrolle könnte zu dir kommen, und halten deine Papiere?",
    outcomes: [
      "Zähle die Tage von der Mitteilung bis zum Besuch und nenne die gesetzlichen Fristen.",
      "Prüfe die Papiere hinter dreizehn Fragen des Inspektors mit vier Tests und sage BELEGT, SCHWACH oder LÜCKE.",
      "Schreibe für deinen Fall auf, was KI sortieren darf und was eine Person unterschreibt.",
    ],
    agenda: [
      { label: "Titel", minutes: 1, activity: "listen" },
      { label: "Drei Türen", minutes: 2, activity: "listen" },
      { label: "Papiere und Abstimmung", minutes: 2, activity: "vote" },
      { label: "Der Brief", minutes: 2, activity: "listen" },
      { label: "Die Uhr", minutes: 3, activity: "vote" },
      { label: "Elenas Plan", minutes: 3, activity: "vote" },
      { label: "Ein Datum ändern", minutes: 3, activity: "vote" },
      { label: "Die anderen 54 Prozent", minutes: 3, activity: "listen" },
      { label: "Die Liste des Inspektors", minutes: 3, activity: "listen" },
      { label: "Wo jedes Papier liegt", minutes: 1, activity: "listen" },
      { label: "Vier Prüfungen pro Papier", minutes: 3, activity: "listen" },
      { label: "BELEGT, SCHWACH oder LÜCKE", minutes: 3, activity: "listen" },
      { label: "Nach vorne reparieren", minutes: 3, activity: "vote" },
      { label: "Dienstag, Schritt 1: die Tabelle bauen", minutes: 5, activity: "do" },
      { label: "Mittwoch, Schritt 2: den Check laufen lassen", minutes: 7, activity: "do" },
      { label: "Mittwoch: Röntgenbild des Ordners", minutes: 4, activity: "listen" },
      { label: "Donnerstag, Schritt 3: Plan und Briefing", minutes: 6, activity: "write" },
      { label: "Die Datenleiter", minutes: 4, activity: "vote" },
      { label: "Zwei Anwälte und eine KI", minutes: 2, activity: "listen" },
      { label: "Der Besuch", minutes: 3, activity: "listen" },
      { label: "Nach dem Besuch", minutes: 3, activity: "vote" },
      { label: "Fall B: die Steuerprüfung", minutes: 4, activity: "vote" },
      { label: "Fall C: ISO-Audits", minutes: 4, activity: "vote" },
      { label: "Wofür wir keine Zahl fanden", minutes: 2, activity: "vote" },
      { label: "Dein eigenes Blatt", minutes: 6, activity: "write" },
      { label: "Welche Kontrolle jetzt", minutes: 8, activity: "vote" },
    ],
    agendaSource: "deck",
    minutesLive: 90,
    minutesSelfStudy: 60,
    needs: [
      "Einen Browser und einen Claude-Tarif mit Codeausführung oder die Desktop-App von Codex oder Claude",
      "Schritt 2 schreibt und startet ein kleines Skript",
    ],
    notNeeded: [
      "Programmierkenntnisse",
      "Echte Dokumente",
    ],
    notCovered: [
      "Rechtsberatung",
      "Lebensmittel- und Datenschutzkontrollen",
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
          "Von der Mitteilung bis zum Besuch zählen.",
        tool: "Uhr im Deck",
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
          "Ein Skript zählt jede Zeile und nennt die Regel: 10 Funde, mindestens 8 geprüft ohne Befund. Mit echten Dateien läuft das Skript auf deinem Rechner (Stufe 3), Claude-Projekt mit erfundenen Dateien (Stufe 2).",
        tool: "Claude-Projekt",
      },
      {
        n: "04",
        title: "Status vergeben",
        description:
          "BELEGT, SCHWACH oder LÜCKE mit Zitat und vier Prüfungen.",
        tool: "Claude-Projekt",
      },
      {
        n: "05",
        title: "Nach vorne reparieren",
        description:
          "Neue Papiere mit echtem Datum, Briefing für die anwesende Person, Unterschrift einer benannten Person.",
        tool: "Vorlagen",
      },
    ],
    caseStudy: {
      companyName: "Gradba-Pro DOOEL",
      isFictional: true,
      location: "Bitola, Nordmazedonien",
      sector: "Baustoffhandel mit 24 Beschäftigten",
      period: "November 2026",
      narrative:
        "Gradba-Pro verkauft Baustoffe in Bitola und hat 24 Beschäftigte. Am Montag, dem 23. November, kündigt das Arbeitsinspektorat einen Besuch für den 27. November an. In unserer erfundenen Firma hat die Büroleiterin vier Tage und Papiere an fünf verschiedenen Orten.",
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
      ["Deck · 26 Folien", `Für den Beamer. ${DECK_KEYS.de}`],
      ["Gradba-Audit-Kit · .zip", "34 Textdateien: Anleitung, Regeln, Skill, Vorlagen, Feldkarten, Lösungen und der erfundene Ordner, alles auf Deutsch."],
    ]),
    kit: AUDIT_KIT.de,
  },
  en: {
    slug: "audit-vorbereitung-mit-ki",
    number: "05",
    topic: "Audit preparation",
    title: "Audit Preparation with AI: Four Days Until the Inspection",
    eyebrow: "Workshop 05 · Audit preparation",
    summary:
      "Three kinds of checks in North Macedonia. An invented firm gets a labour inspector in four days. You prepare its papers with AI.",
    lede:
      "On Monday a letter arrives: on 27 November the labour inspector comes. You have four days and thirteen questions. You prepare the papers with AI, a person signs.",
    description:
      "Prepare a labour inspection with AI in four days: thirteen questions, four tests, one answer key. Plus tax control and ISO audits. Free workshop with kit.",
    format: "Live workshop with deck",
    duration: "~90 minutes",
    accessNote:
      "Everything runs on invented files, so no real data is needed. For Step 2 you need a Claude plan that can run code.",
    outcome: "A table of 13 questions, a status for each and a briefing for the visit",
    stageExplainer: {
      heading: "What is the kit?",
      body:
        "A letter from the inspectorate, a folder of invented records and an answer key. You run three prompts in Claude or Codex, about 70 minutes.",
      facts: ["34 files", "3 steps", "13 questions"],
    },
    audience: [
      "Office managers, accountants and owners of small firms in North Macedonia who get checked by an inspector, the tax authority (UJP) or a certifier.",
    ],
    notForYou: "You need legal advice for a real case, or a tool that fills in papers for you.",
    question: "Which check could come to you, and would your papers hold up?",
    outcomes: [
      "Count the days from the notice to the visit and name the legal clocks.",
      "Check the papers behind thirteen inspector questions with four tests and say COVERED, WEAK or GAP.",
      "Write down for your own case what AI may sort and what a person signs.",
    ],
    agenda: [
      { label: "Cover", minutes: 1, activity: "listen" },
      { label: "Three doors", minutes: 2, activity: "listen" },
      { label: "Papers and a vote", minutes: 2, activity: "vote" },
      { label: "The letter", minutes: 2, activity: "listen" },
      { label: "The clock", minutes: 3, activity: "vote" },
      { label: "Elena's plan", minutes: 3, activity: "vote" },
      { label: "Edit a date", minutes: 3, activity: "vote" },
      { label: "The other 54 percent", minutes: 3, activity: "listen" },
      { label: "The inspector's list", minutes: 3, activity: "listen" },
      { label: "Where each paper lives", minutes: 1, activity: "listen" },
      { label: "Four tests per paper", minutes: 3, activity: "listen" },
      { label: "COVERED, WEAK or GAP", minutes: 3, activity: "listen" },
      { label: "Fix forward", minutes: 3, activity: "vote" },
      { label: "Tuesday, step 1: make the table", minutes: 5, activity: "do" },
      { label: "Wednesday, step 2: run the check", minutes: 7, activity: "do" },
      { label: "Wednesday: X-ray of the folder", minutes: 4, activity: "listen" },
      { label: "Thursday, step 3: plan and briefing", minutes: 6, activity: "write" },
      { label: "The data ladder", minutes: 4, activity: "vote" },
      { label: "Two lawyers and an AI", minutes: 2, activity: "listen" },
      { label: "The visit", minutes: 3, activity: "listen" },
      { label: "After the visit", minutes: 3, activity: "vote" },
      { label: "Case B: the tax control", minutes: 4, activity: "vote" },
      { label: "Case C: ISO audits", minutes: 4, activity: "vote" },
      { label: "What we found no number for", minutes: 2, activity: "vote" },
      { label: "Your own sheet", minutes: 6, activity: "write" },
      { label: "Which check now", minutes: 8, activity: "vote" },
    ],
    agendaSource: "deck",
    minutesLive: 90,
    minutesSelfStudy: 60,
    needs: [
      "A browser and a Claude plan with code execution, or the Codex or Claude desktop app",
      "Step 2 writes and runs a small script",
    ],
    notNeeded: [
      "Coding skills",
      "Real documents",
    ],
    notCovered: [
      "Legal advice",
      "Food safety and data protection inspections",
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
          "From the notice to the visit.",
        tool: "Clock in the deck",
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
          "A script counts every row and names the rule: 10 findings, at least 8 checked with no problem. With real files the script runs on your own computer (Level 3), Claude Project with invented files (Level 2).",
        tool: "Claude Project",
      },
      {
        n: "04",
        title: "Give a status",
        description:
          "COVERED, WEAK or GAP with a quote and the four tests.",
        tool: "Claude Project",
      },
      {
        n: "05",
        title: "Fix forward",
        description:
          "New papers with real dates, a briefing for the person present, a signature from a named person.",
        tool: "Templates",
      },
    ],
    caseStudy: {
      companyName: "Gradba-Pro DOOEL",
      isFictional: true,
      location: "Bitola, North Macedonia",
      sector: "building materials trade with 24 staff",
      period: "November 2026",
      narrative:
        "Gradba-Pro sells building materials in Bitola and has 24 employees. On Monday 23 November the labour inspectorate announces a visit for 27 November. In our invented firm the office manager has four days and papers in five different places.",
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
      ["Deck · 26 slides", `For the projector. ${DECK_KEYS.en}`],
      ["Gradba audit kit · .zip", "34 text files: the letter, the invented folder, rules, field cards, the skill, templates and the answer key."],
    ]),
    kit: AUDIT_KIT.en,
  },
};

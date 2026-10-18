import type { Locale } from "./i18n/locale";
import type { WorkshopKit } from "./workshop-kit";

/**
 * The kit block of workshop 05 (the page /workshops/ki-im-unternehmen-sicher-nutzen/kit).
 * Every figure below is printed in the published deck or in START-HERE.md and ANSWERS.md of
 * ai-at-work-kit.zip; scripts/workshop05/verify-kit.mjs checks the figures against the
 * kit's source files and workshops-ai-at-work.test.ts checks this block against the kit.
 * The three rules equal the three lines of project-instructions.md, without their "Rule N." lead-in.
 * The zip's path and size come from the workshop's kit material.
 */
export const AI_AT_WORK_KIT: Readonly<Record<Locale, WorkshopKit>> = {
  de: {
    fileName: "ai-at-work-kit.zip",
    title: "Das Claude-Daten-Kit",
    lead: "Spiele den Workshop in deinem eigenen Claude-Konto nach: Prompt senden, Einstellungen prüfen, Einfügungen bewerten und eine Seite schreiben.",
    stats: [
      { value: "7", label: "Dateien" },
      { value: "5", label: "Aufgaben" },
      { value: "3", label: "Regeln" },
    ],
    rulesHeading: "Die drei Regeln im Projekt",
    rules: [
      "Nur die Dateien in diesem Projekt. Steht es nicht darin, schreibe NOT IN FILES. Nie raten.",
      "Nenne nach jeder Antwort die Datei, aus der sie stammt. Bewerte Einfügungen und Aussagen mit einer Ampel: GREEN öffentlich, jedes Werkzeug; AMBER nur im Firmenwerkzeug, Namen und Zahlen entfernt, eine Person prüft; RED nicht ohne schriftliches Okay.",
      "Einfache Wörter, kurze Sätze. Schreibe nie „compliant“ oder „certified“. Ende mit einer Sache, die eine Person vor dem Senden prüfen muss.",
    ],
    stepsHeading: "Drei Schritte, fünf Aufgaben",
    steps: [
      {
        tag: "Schritt 1",
        title: "Konto prüfen",
        input: "Ein erfundener Prompt.",
        action: "Du sendest ihn und prüfst Plan, Schalter und Handy.",
        output: "Eine Karte mit deinen drei Antworten.",
      },
      {
        tag: "Schritt 2",
        title: "Bewerten, was Leute einfügen",
        input: "scenes.md und facts.md.",
        action: "Claude bewertet acht Einfügungen und fünf KI-Nutzungen.",
        output: "Zwei Tabellen, in jeder Zeile eine Quelle.",
      },
      {
        tag: "Schritt 3",
        title: "Deine Seite schreiben",
        input: "Die drei Fragen des Kunden.",
        action: "Claude entwirft drei Sätze und drei Regeln.",
        output: "Eine Seite für Kunde und Team.",
        note: "Die EU-Aussage darf nicht GREEN werden.",
      },
    ],
    howTo:
      "Du brauchst claude.ai oder die Claude-Desktop-App mit jedem Plan, auch Free, und etwa 75 Minuten. Nur das erfundene Kit geht in Claude.",
    fictionalNote:
      "Alles im Kit ist erfunden; die Zeilen zu Anbieter und Gesetz sind echt, Stand 18. Oktober 2026, und keine Rechtsberatung.",
    contents: [
      { name: "START-HERE.md", description: "Fünf Aufgaben mit Prompts." },
      { name: "ANSWERS.md", description: "So sieht gut aus." },
      { name: "project-instructions.md", description: "Drei Regeln fürs Projekt." },
      { name: "customer-email.md", description: "Kundenfragen, Entwurf des Chefs." },
      { name: "company-notes.md", description: "Erfundene IT-Notizen, eine Falle." },
      { name: "scenes.md", description: "Acht Einfügungen, eine Mail." },
      { name: "facts.md", description: "Datierte Plan- und Gesetzeszeilen." },
    ],
  },
  en: {
    fileName: "ai-at-work-kit.zip",
    title: "The Claude data kit",
    lead: "Replay the workshop in your own Claude account: send one prompt, check your settings, rate what people paste and write one page.",
    stats: [
      { value: "7", label: "files" },
      { value: "5", label: "missions" },
      { value: "3", label: "rules" },
    ],
    rulesHeading: "The three rules in the Project",
    rules: [
      "Use only the files in this project. If the files do not say it, write NOT IN FILES. Never guess.",
      "After every answer, name the file it comes from. Rate pastes and claims with a light. GREEN: public, fine on any tool. AMBER: only on the company tool, names and numbers removed, a named person must check. RED: not without a written okay.",
      "Plain English, short sentences. Never write \"compliant\" or \"certified\". End with one thing a person must check before it is sent.",
    ],
    stepsHeading: "Three steps, five missions",
    steps: [
      {
        tag: "Step 1",
        title: "Check your account",
        input: "One invented prompt.",
        action: "You send it and check plan, switch and phone.",
        output: "A card with your three answers.",
      },
      {
        tag: "Step 2",
        title: "Rate what people paste",
        input: "scenes.md and facts.md.",
        action: "Claude rates eight pastes and five AI uses.",
        output: "Two tables, a source in every row.",
      },
      {
        tag: "Step 3",
        title: "Write your page",
        input: "The customer's three questions.",
        action: "Claude drafts three sentences and three rules.",
        output: "One page for the customer and the team.",
        note: "The EU claim must not come back GREEN.",
      },
    ],
    howTo:
      "You need claude.ai or the Claude Desktop app on any plan, Free included, and about 75 minutes. Only the invented kit goes into Claude.",
    fictionalNote:
      "Everything in the kit is invented; the vendor and law lines are real, dated 18 October 2026, and not legal advice.",
    contents: [
      { name: "START-HERE.md", description: "Five missions with prompts." },
      { name: "ANSWERS.md", description: "What good looks like." },
      { name: "project-instructions.md", description: "Three rules for the Project." },
      { name: "customer-email.md", description: "Customer questions, boss's draft." },
      { name: "company-notes.md", description: "Invented IT notes, one trap." },
      { name: "scenes.md", description: "Eight pastes, one email." },
      { name: "facts.md", description: "Dated plan and law lines." },
    ],
  },
};

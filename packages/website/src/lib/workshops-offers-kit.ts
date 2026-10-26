import type { Locale } from "./i18n/locale";
import type { WorkshopKit } from "./workshop-kit";

/**
 * The kit block of workshop 06 (the page /workshops/angebote-mit-ki-vergleichen/kit).
 * Every figure below is printed in the kit (angebote-vergleichen-kit.zip: schritte.md, ANSWERS.md,
 * kostenzeilen.csv, karten/feldkarte.md); workshops-offers.test.ts checks this block against the zip.
 * The rules are the three method lines of karten/feldkarte.md and of take-home/projekt-anweisungen.md.
 * The kit is German only, so the English page describes the German files.
 */
export const OFFERS_KIT: Readonly<Record<Locale, WorkshopKit>> = {
  de: {
    fileName: "angebote-vergleichen-kit.zip",
    title: "Das Kit zum Angebotsvergleich",
    lead: "Drei Angebote für 40.000 Versandkartons, eine Basis, vier Schritte. Den letzten machst du mit deinem eigenen Claude.",
    stats: [
      { value: "19", label: "Dateien" },
      { value: "4", label: "Schritte" },
      { value: "5", label: "Felder der Basis" },
    ],
    rulesHeading: "Die Methode in drei Zeilen",
    rules: [
      "Lege die Basis fest, bevor du vergleichst: Menge im Jahr, Preis je Stück, bis ins Werk, einmalige Kosten, Skonto.",
      "Rechne jedes Angebot auf diese Basis um und schreib zu jeder Zahl, wo sie steht.",
      "Nenne die Zeile, die entscheidet, und frag nach jeder Zahl, die fehlt.",
    ],
    rulesShort: [
      "Erst die Basis: Menge, je Stück, bis ins Werk, einmalig, Skonto.",
      "Jedes Angebot auf die Basis, jede Zahl mit ihrer Stelle.",
      "Die Zeile nennen, die entscheidet. Was fehlt, erfragen.",
    ],
    stepsHeading: "Vier Schritte, drei Angebote",
    steps: [
      {
        tag: "Schritt 1",
        title: "Angebot A, vorgerechnet",
        input: "fall/angebot-a-nuernberg.md, frei Werk (DAP).",
        action: "Du liest jede Zeile nach, mit der Stelle im Angebot.",
        output: "A geliefert und bezahlt.",
        line: { text: "26.400 € Ware − 528 € Skonto =", result: "25.872 €" },
        note: "Der Staffelpreis von 0,62 € gilt erst ab 60.000 Stück. Es zählen 0,66 €.",
      },
      {
        tag: "Schritt 2",
        title: "Angebot B, halb ausgefüllt",
        input: "fall/angebot-b-poznan.md und fall/kosten-intern.md.",
        action: "Du füllst Fracht, Lager und Skonto.",
        output: "B geliefert und bezahlt.",
        line: { text: "20.800 + 2.800 + 1.450 + 1.920 − 416 =", result: "26.554 €" },
        note: "EXW heißt: Brandtwerk zahlt die Fahrt ab Poznań.",
      },
      {
        tag: "Schritt 3",
        title: "Angebot C, allein",
        input: "fall/angebot-c-brno.md.",
        action: "Du bringst C allein auf die Basis und suchst den Punkt, an dem es kippt.",
        output: "C geliefert und bezahlt, dazu die Schwelle des Papierzuschlags.",
        line: { text: "23.000 + 2.600 − 690 =", result: "24.910 €" },
        note: "Ab 6,97 % Anstieg des Papierindex liegt A vorn.",
      },
      {
        tag: "Schritt 4",
        title: "Claude prüfen",
        input: "take-home/prompt.md und der Ordner fall/.",
        action: "Claude rechnet im Code. Du legst seine Tabelle neben deine.",
        output: "Dieselbe Reihenfolge, zu jeder Zahl eine Stelle.",
        note: "Ohne kosten-intern.md ist richtig: kein Urteil, Fracht und Lager offen, eine Frage nach den Sätzen.",
      },
    ],
    howTo:
      "Du brauchst claude.ai oder die Claude-Desktop-App, jeder Plan, mit Codeausführung. Die Dateien gehen dabei an Anthropic.",
    fictionalNote: "Brandtwerk, die drei Lieferanten und jede Zahl im Kit sind erfunden.",
    contents: [
      { name: "START-HERE.md", description: "Fünf Schritte, in dieser Reihenfolge." },
      { name: "schritte.md", description: "Die vier Schritte und der zweite Fall." },
      { name: "ANSWERS.md", description: "Die Lösungen, aus einem Skript gerechnet." },
      { name: "fall/", description: "Anfrage, drei Angebote, interne Sätze, zweiter Fall." },
      { name: "kostenzeilen.csv", description: "Jede Kostenzeile mit ihrer Stelle." },
      { name: "karten/", description: "Die Feldkarte: die Methode auf einer Seite." },
      { name: "vorlagen/", description: "Vergleichsbasis und Verhandlungsmail." },
      { name: "take-home/", description: "Projektanweisungen, Prompt, Skill und Einrichtung." },
    ],
  },
  en: {
    fileName: "angebote-vergleichen-kit.zip",
    title: "The offer comparison kit",
    lead: "Three offers for 40,000 shipping boxes, one basis, four steps. You take the last one with your own Claude. The files are in German.",
    stats: [
      { value: "19", label: "files" },
      { value: "4", label: "steps" },
      { value: "5", label: "fields of the basis" },
    ],
    rulesHeading: "The method in three lines",
    rules: [
      "Fix the basis before you compare: quantity per year, price per unit, delivered to the plant, one-off costs, early-payment discount.",
      "Bring every offer onto that basis and write down where each number stands.",
      "Name the line that decides, and ask for every number that is missing.",
    ],
    rulesShort: [
      "Basis first: quantity, per unit, delivered, one-off, discount.",
      "Every offer on the basis, every number with its source.",
      "Name the line that decides. Ask for what is missing.",
    ],
    stepsHeading: "Four steps, three offers",
    steps: [
      {
        tag: "Step 1",
        title: "Offer A, worked for you",
        input: "fall/angebot-a-nuernberg.md, delivered (DAP).",
        action: "You check each line against its place in the offer.",
        output: "A delivered and paid.",
        line: { text: "€26,400 goods − €528 discount =", result: "€25,872" },
        note: "The volume price of €0.62 starts at 60,000 units. €0.66 counts.",
      },
      {
        tag: "Step 2",
        title: "Offer B, half filled in",
        input: "fall/angebot-b-poznan.md and fall/kosten-intern.md.",
        action: "You fill in freight, storage and discount.",
        output: "B delivered and paid.",
        line: { text: "20,800 + 2,800 + 1,450 + 1,920 − 416 =", result: "€26,554" },
        note: "EXW means Brandtwerk pays the trip from Poznań.",
      },
      {
        tag: "Step 3",
        title: "Offer C, on your own",
        input: "fall/angebot-c-brno.md.",
        action: "You bring C onto the basis alone and find the point where it flips.",
        output: "C delivered and paid, plus the threshold of the paper surcharge.",
        line: { text: "23,000 + 2,600 − 690 =", result: "€24,910" },
        note: "From a 6.97% rise in the paper index, A leads.",
      },
      {
        tag: "Step 4",
        title: "Check Claude",
        input: "take-home/prompt.md and the folder fall/.",
        action: "Claude computes in code. You lay its table next to yours.",
        output: "The same order, a source for every number.",
        note: "Without kosten-intern.md the right answer is no verdict, freight and storage open, and a question for the rates.",
      },
    ],
    howTo:
      "You need claude.ai or the Claude desktop app, any plan, with code execution on. The files go to Anthropic.",
    fictionalNote: "Brandtwerk, the three suppliers and every number in the kit are invented.",
    contents: [
      { name: "START-HERE.md", description: "Five steps, in this order." },
      { name: "schritte.md", description: "The four steps and the second case." },
      { name: "ANSWERS.md", description: "The answers, computed by a script." },
      { name: "fall/", description: "Request, three offers, internal rates, second case." },
      { name: "kostenzeilen.csv", description: "Every cost line with its source." },
      { name: "karten/", description: "The field card: the method on one page." },
      { name: "vorlagen/", description: "Comparison basis and negotiation email." },
      { name: "take-home/", description: "Project instructions, prompt, skill and setup." },
    ],
  },
};

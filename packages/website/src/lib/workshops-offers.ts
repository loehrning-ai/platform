import type { Locale } from "./i18n/locale";
import type { Workshop, WorkshopMaterial } from "./workshops";
import { OFFERS_KIT } from "./workshops-offers-kit";
import { DECK_KEYS } from "./deck-keys-copy";

const base = "/workshops/angebote-mit-ki-vergleichen";

/**
 * Workshop 06, "Welches Angebot ist günstiger?". Deck, kit and demo were built with rotfaden (example
 * angebote-mit-ki-vergleichen); scripts/workshop06 holds the kit's files, the build log of that run
 * (source/BUILD-LOG.md), the changes made for this site (PORT-LOG.md), build-kit.mjs, which writes the zip,
 * and build-deck.mjs, which writes slides.html from rotfaden's deck.html plus PORT-LOG items 6 to 9. The
 * deck is German only, so both locales link the German deck and the German kit. Brandtwerk Gerätebau and the three suppliers are
 * invented. The agenda follows the seven acts of the deck (75 minutes) plus 15 minutes of questions.
 * Registered in WORKSHOPS_BY_LOCALE with the Kraft poster palette.
 */

/**
 * The kit zip is 34,269 bytes, so 34 KB by the rule of the demo's take-home block (formatBytes: whole KB of
 * 1024 bytes, rounded up), and the pages and the demo print the same size; workshops-offers.test.ts checks it.
 */
const KIT_SIZE_LABEL: Readonly<Record<Locale, string>> = { de: "34 KB", en: "34 KB" };

/**
 * Places changed by hand: 9 in the rotfaden run (scripts/workshop06/source/BUILD-LOG.md) and 10 for this
 * site (scripts/workshop06/PORT-LOG.md). workshops-offers.test.ts counts both lists.
 */
export const OFFERS_HAND_EDITS = 20;

type MaterialFrame = Omit<WorkshopMaterial, "label" | "description" | "sizeLabel">;

/** Both locales list the same German files in the same order. */
const MATERIAL_FRAMES: readonly MaterialFrame[] = [
  { href: `${base}/slides.html`, kind: "html", language: "de", role: "deck", phase: "during", minutes: 90, primary: true },
  { href: `${base}/angebote-vergleichen-kit.zip`, kind: "zip", language: "de", role: "kit", phase: "after" },
];

type MaterialCopy = readonly [label: string, description: string];

function materials(locale: Locale, copy: readonly MaterialCopy[]): readonly WorkshopMaterial[] {
  if (copy.length !== MATERIAL_FRAMES.length) throw new Error("Workshop 06: material copy does not match the material list");
  return MATERIAL_FRAMES.map((frame, index) => {
    const [label, description] = copy[index];
    return frame.kind === "zip"
      ? { ...frame, label, description, sizeLabel: KIT_SIZE_LABEL[locale] }
      : { ...frame, label, description };
  });
}

export const OFFERS_WORKSHOP: Readonly<Record<Locale, Workshop>> = {
  de: {
    slug: "angebote-mit-ki-vergleichen",
    number: "06",
    topic: "Angebotsvergleich",
    title: "Welches Angebot ist günstiger?",
    eyebrow: "Workshop 06 · Angebotsvergleich",
    summary: "Wie du Angebote auf einer Basis vergleichst, statt nach dem Stückpreis.",
    lede: "Du bringst drei Angebote auf eine Basis und findest das günstigste, geliefert und bezahlt.",
    description:
      "Brandtwerk Gerätebau, ein erfundener Gerätebauer in Nordhessen, braucht 40.000 Versandkartons im Jahr und hat drei Angebote. Ein Assistent vergleicht nur die Ware, schätzt die Fracht und hält B für das günstigste. Du legst zuerst eine Basis fest: Menge, Preis je Stück, bis ins Werk, Einmalkosten und Skonto. Auf dieser Basis ist B das teuerste Angebot und C das günstigste. Zu Hause spielt das Kit alles mit deinem eigenen Claude nach.",
    format: "Live-Workshop mit Deck",
    duration: "~90 Minuten",
    accessNote:
      "In Claude gehen nur die erfundenen Dateien des Kits. Echte Angebote lädst du nur in das Konto, das deine Firma freigegeben hat.",
    outcome: "Eine Vergleichsbasis für deinen nächsten Einkauf und eine Tabelle, in der jede Zahl ihre Stelle hat",
    stageExplainer: {
      heading: "Was ist das Kit?",
      body:
        "Eine Zip mit 19 Dateien: die Anfrage, drei Angebote, die internen Sätze für Fracht und Lager, vier Schritte, die Lösungen und alles für deinen eigenen Claude. Du rechnest zuerst selbst, dann prüfst du Claude.",
      facts: ["19 Dateien", "4 Schritte", "3 Angebote"],
    },
    audience: [
      "Teamleitungen und Sachbearbeitung, die Angebote von Lieferanten vergleichen",
      "Alle, die dafür einen Chat-Assistenten nutzen und keine Einkaufsausbildung haben",
      "Firmen mit 50 bis 500 Leuten ohne eigene Einkaufsabteilung",
    ],
    notForYou: "Nicht für dich, wenn du Ausschreibungen nach Vergaberecht machst oder Lieferanten nach Qualität bewertest.",
    question: "Welches Angebot ist günstiger?",
    outcomes: [
      "Du legst die Basis fest, bevor du vergleichst: Menge, Preis je Stück, bis ins Werk, Einmalkosten und Skonto.",
      "Du bringst jedes Angebot auf diese Basis und nennst zu jeder Zahl die Stelle im Dokument.",
      "Du nennst die Zeile, die entscheidet, und den Punkt, ab dem eine Preisklausel die Reihenfolge dreht.",
    ],
    agenda: [
      { label: "Der Fall und die Frage", minutes: 5, activity: "listen" },
      { label: "Die plausible falsche Antwort", minutes: 9, activity: "vote" },
      { label: "Warum sie falsch ist", minutes: 8, activity: "vote" },
      { label: "Die Basis in fünf Feldern", minutes: 16, activity: "write" },
      { label: "Selbst rechnen: B und C", minutes: 14, activity: "do" },
      { label: "Grenzen: der Papierzuschlag", minutes: 12, activity: "vote" },
      { label: "Dein eigener Einkauf", minutes: 11, activity: "write" },
      { label: "Fragen", minutes: 15, activity: "listen" },
    ],
    agendaSource: "deck",
    minutesLive: 90,
    minutesSelfStudy: 45,
    needs: [
      "Live: claude.ai oder die Claude-Desktop-App, jeder Plan, mit Codeausführung. Abgestimmt wird per Handzeichen.",
      "Zu Hause: dasselbe und das Kit",
    ],
    notNeeded: ["Programmierkenntnisse", "Einen API-Schlüssel", "Eine Einkaufsausbildung", "Echte Angebote"],
    notCovered: [
      "Qualität, Termintreue und die Abhängigkeit von einem Lieferanten",
      "Zoll und Währung",
      "Kosten je Wareneingang und Bestellung",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-26",
      aiOutputsRecordedAt: "2026-10-25",
      data: "synthetic",
      note: `Deck, Kit und Demo mit rotfaden gebaut, von Tim Löhr geprüft und an ${OFFERS_HAND_EDITS} Stellen geändert. Brandtwerk, die drei Lieferanten und jede Zahl sind erfunden.`,
    },
    steps: [
      {
        n: "01",
        title: "Die plausible falsche Antwort",
        description:
          "Ein Assistent vergleicht die Ware, schätzt die Fracht und empfiehlt B. Du stimmst ab, ob du die Antwort weitergibst.",
        tool: "Deck · Abstimmung",
      },
      {
        n: "02",
        title: "Die Basis in fünf Feldern",
        description: "Menge, Preis je Stück, bis ins Werk, Einmalkosten, Skonto. Angebot A rechnest du gemeinsam: 25.872 €.",
        tool: "Deck · Feldkarte",
      },
      {
        n: "03",
        title: "Selbst rechnen",
        description:
          "Du rechnest B und C mit dem Prompt in Claude und prüfst gegen die Lösungen. C kostet 24.910 €, B 26.554 €.",
        tool: "Kit · Claude",
      },
      {
        n: "04",
        title: "Der Papierzuschlag",
        description: "Du bewegst den Papierindex und siehst, wo die Reihenfolge kippt: ab 6,97 % liegt A vor C.",
        tool: "Deck · Abstimmung",
      },
      {
        n: "05",
        title: "Dein eigener Einkauf",
        description: "Du füllst die Vergleichsbasis für einen eigenen Einkauf, mit erfundenen oder allgemeinen Zahlen.",
        tool: "Vorlage · Vergleichsbasis",
      },
    ],
    caseStudy: {
      companyName: "Brandtwerk Gerätebau GmbH",
      isFictional: true,
      location: "Nordhessen",
      sector: "Gerätebau, Einkauf von Versandkartons",
      period: "Anfrage vom 5. Oktober 2026, Laufzeit ein Jahr ab Januar 2027",
      narrative:
        "Brandtwerk fragt drei Hersteller nach 40.000 Versandkartons im Jahr. Nürnberg liefert frei Werk, Poznań ab Werk mit einer Stanzform, Brno frei Frachtführer mit einem Papierzuschlag. Der Stückpreis allein spricht für Poznań.",
      metrics: [
        { label: "Kartons im Jahr", value: "40.000" },
        { label: "Angebote", value: "3" },
        { label: "Stückpreis B, der niedrigste", value: "0,52 €" },
        { label: "C vor A, geliefert und bezahlt", value: "962 €" },
      ],
      decisionQuestion: "Welches Angebot ist günstiger?",
      limitationsHeading: "Zuerst lesen",
      dataLimitations: [
        "Brandtwerk, die drei Lieferanten und jede Zahl sind erfunden.",
        "Der Vergleich rechnet nur Kosten. Qualität und Termintreue stehen neben der Tabelle.",
      ],
    },
    materials: materials("de", [
      ["Deck", `Für den Beamer. ${DECK_KEYS.de}`],
      ["Kit zum Angebotsvergleich · .zip", "19 Dateien: Anfrage, drei Angebote, interne Sätze, vier Schritte, Lösungen, Skill und Vorlagen."],
    ]),
    kit: OFFERS_KIT.de,
  },
  en: {
    slug: "angebote-mit-ki-vergleichen",
    number: "06",
    topic: "Comparing offers",
    title: "Which offer costs less?",
    eyebrow: "Workshop 06 · Comparing offers",
    summary: "How to compare offers on one basis instead of by unit price.",
    lede: "You bring three offers onto one basis and find the cheapest, delivered and paid.",
    description:
      "Brandtwerk Gerätebau, an invented equipment maker in northern Hesse, needs 40,000 shipping boxes a year and holds three offers. An assistant compares only the goods, guesses the freight and picks B. You first fix a basis: quantity, price per unit, delivered to the plant, one-off costs and early-payment discount. On that basis B is the most expensive offer and C the cheapest. At home, the kit replays all of it with your own Claude.",
    format: "Live workshop with deck",
    duration: "~90 minutes",
    accessNote:
      "Only the kit's invented files go into Claude. Real offers go only into the account your firm approved.",
    outcome: "A comparison basis for your next purchase and a table in which every number has its source",
    stageExplainer: {
      heading: "What is the kit?",
      body:
        "A zip with 19 files in German: the request, three offers, the internal rates for freight and storage, four steps, the answers and everything for your own Claude. You compute first, then you check Claude.",
      facts: ["19 files", "4 steps", "3 offers"],
    },
    audience: [
      "Team leads and clerks who compare offers from suppliers",
      "Anyone who uses a chat assistant for it and has no purchasing training",
      "Firms of 50 to 500 people without their own purchasing department",
    ],
    notForYou: "Not for you if you run public tenders or rate suppliers on quality.",
    question: "Which offer costs less?",
    outcomes: [
      "You fix the basis before you compare: quantity, price per unit, delivered to the plant, one-off costs and discount.",
      "You bring every offer onto that basis and name the place in the document for every number.",
      "You name the line that decides, and the point from which a price clause flips the order.",
    ],
    agenda: [
      { label: "The case and the question", minutes: 5, activity: "listen" },
      { label: "The plausible wrong answer", minutes: 9, activity: "vote" },
      { label: "Why it is wrong", minutes: 8, activity: "vote" },
      { label: "The basis in five fields", minutes: 16, activity: "write" },
      { label: "Compute it yourself: B and C", minutes: 14, activity: "do" },
      { label: "Limits: the paper surcharge", minutes: 12, activity: "vote" },
      { label: "Your own purchase", minutes: 11, activity: "write" },
      { label: "Questions", minutes: 15, activity: "listen" },
    ],
    agendaSource: "deck",
    minutesLive: 90,
    minutesSelfStudy: 45,
    needs: [
      "Live: claude.ai or the Claude desktop app, any plan, with code execution on. Votes are a show of hands.",
      "At home: the same and the kit",
    ],
    notNeeded: ["Programming skills", "An API key", "Purchasing training", "Real offers"],
    notCovered: [
      "Quality, delivery reliability and depending on one supplier",
      "Customs and currency",
      "Costs per goods receipt and per order",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-10-26",
      aiOutputsRecordedAt: "2026-10-25",
      data: "synthetic",
      note: `Deck, kit and demo built with rotfaden, reviewed by Tim Löhr and changed in ${OFFERS_HAND_EDITS} places. Brandtwerk, the three suppliers and every number are invented.`,
    },
    steps: [
      {
        n: "01",
        title: "The plausible wrong answer",
        description: "An assistant compares the goods, guesses the freight and recommends B. You vote on whether you pass it on.",
        tool: "Deck · vote",
      },
      {
        n: "02",
        title: "The basis in five fields",
        description:
          "Quantity, price per unit, delivered to the plant, one-off costs, discount. You compute offer A together: €25,872.",
        tool: "Deck · field card",
      },
      {
        n: "03",
        title: "Compute it yourself",
        description: "You compute B and C with the prompt in Claude and check against the answers. C costs €24,910, B €26,554.",
        tool: "Kit · Claude",
      },
      {
        n: "04",
        title: "The paper surcharge",
        description: "You move the paper index and see where the order flips: from 6.97%, A leads C.",
        tool: "Deck · vote",
      },
      {
        n: "05",
        title: "Your own purchase",
        description: "You fill in the comparison basis for a purchase of your own, with invented or general numbers.",
        tool: "Template · comparison basis",
      },
    ],
    caseStudy: {
      companyName: "Brandtwerk Gerätebau GmbH",
      isFictional: true,
      location: "Northern Hesse",
      sector: "equipment maker, buying shipping boxes",
      period: "Request of 5 October 2026, one year from January 2027",
      narrative:
        "Brandtwerk asks three makers for 40,000 shipping boxes a year. Nuremberg delivers to the plant, Poznań ex works with a cutting die, Brno free carrier with a paper surcharge. The unit price alone speaks for Poznań.",
      metrics: [
        { label: "Boxes per year", value: "40,000" },
        { label: "Offers", value: "3" },
        { label: "Unit price of B, the lowest", value: "€0.52" },
        { label: "C ahead of A, delivered and paid", value: "€962" },
      ],
      decisionQuestion: "Which offer costs less?",
      limitationsHeading: "Read this first",
      dataLimitations: [
        "Brandtwerk, the three suppliers and every number are invented.",
        "The comparison counts costs only. Quality and delivery reliability stand next to the table.",
      ],
    },
    materials: materials("en", [
      ["Deck", `For the projector, in German. ${DECK_KEYS.en}`],
      ["Offer comparison kit · .zip", "19 files in German: request, three offers, internal rates, four steps, answers, skill and templates."],
    ]),
    kit: OFFERS_KIT.en,
  },
};

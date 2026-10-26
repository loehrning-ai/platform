import "server-only";

import DEMO from "./demo.json";

const KIT_HREF = "/workshops/angebote-mit-ki-vergleichen/angebote-vergleichen-kit.zip";

/**
 * The words of the demo in both languages; index.tsx hands the browser one of them. The German
 * captions, levers, method lines and the take-home line are rotfaden's demo.json word for word
 * (config.test.ts checks it); the English ones say the same. Placeholders in braces are filled from
 * the model on the stage, so no number is typed here.
 */
const beat = (id: string) => {
  const found = DEMO.beats.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`demo.json has no beat "${id}"`);
  return found as {
    readonly caption: string;
    readonly lever?: string;
    readonly lines?: readonly string[];
    readonly apply?: { readonly index: { readonly label: string } };
  };
};

const de = {
  locale: "de",
  stageLabel: "Drei Angebote, Zeile für Zeile auf einer Basis",
  question: DEMO.question,
  caseLine: DEMO.case_line,
  lineNames: { Ware: "Ware", Fracht: "Fracht", Einmalig: "Einmalig", Lager: "Lager", Skonto: "Skonto" } as Record<string, string>,
  headlineNote: "nur der Warenpreis",
  perRecurring: "im Jahr",
  perOnce: "einmalig",
  open: "offen",
  winner: "am günstigsten",
  yourBet: "dein Tipp",
  suggested: "Vorschlag übernommen",
  tipp: { caption: beat("tipp").caption, lever: beat("tipp").lever ?? "" },
  kipp: { caption: beat("kipp").caption, running: "Fracht, Einmalkosten, Lager und Skonto kommen dazu." },
  sources: {
    head: "Woher die Zahlen von {option} kommen",
    hint: "Tipp auf ein Angebot: Zu jeder Zahl steht die Stelle im Dokument.",
    none: "ohne Stelle",
    missingCell: "fehlt",
    total: "Summe",
    quoteNote: "",
  },
  methode: {
    caption: beat("methode").caption,
    lines: beat("methode").lines ?? [],
    file: "karten/feldkarte.md",
    download: "Kit herunterladen",
    kitHref: KIT_HREF,
  },
  papier: {
    caption: beat("papier").caption,
    lever: beat("papier").lever ?? "",
    label: beat("papier").apply?.index.label ?? "",
    flip: "{rival} vorn ab {v} %",
    stops: "Anstieg des Papierindex",
    stop: "+{v} %",
  },
  deins: {
    caption: beat("deins").caption,
    lever: "Deine Zeilen eintragen",
    heading: "Deine Angebote",
    stays: "Bleibt auf diesem Gerät.",
    hint: DEMO.own.hint,
    field: "Eine Zeile pro Posten",
    load: "Zweiten Fall einsetzen",
    apply: "Rechnen",
    clear: "Eigene Eingaben löschen",
    kitShown: "Auf der Bühne stehen noch die Zahlen des Kits.",
    ownShown: "Auf der Bühne stehen deine Zeilen.",
    missing: "{option} nennt keine Zeile {line}. Sie bleibt offen, bis du die Zahl nennst.",
    missingMore: "Dazu {n} weitere offene Zeilen.",
    errors: {
      empty: "Keine Zeilen. Trag mindestens zwei Angebote ein.",
      long: "Zu lang: höchstens {max} Zeichen.",
      column: "Die Spalte {column} fehlt.",
      option: "Zeile {n}: Es fehlt der Name des Angebots.",
      line: "Zeile {n}: Es fehlt der Posten.",
      name: "Zeile {n}: Angebot oder Posten ist länger als 40 Zeichen.",
      amount: "Zeile {n}: „{value}“ ist kein Betrag.",
      decimals: "Zeile {n}: „{value}“ hat mehr als zwei Nachkommastellen.",
      per: "Zeile {n}: „{value}“ ist weder einmalig noch jährlich.",
      source: "Zeile {n}: Die Stelle ist länger als {max} Zeichen.",
      rows: "Höchstens {max} Zeilen.",
      options: "Höchstens {max} Angebote.",
      lines: "Höchstens {max} Posten.",
      two: "Es braucht mindestens zwei Angebote.",
    },
  },
  mitnehmen: {
    caption: beat("mitnehmen").caption,
    lever: "Zu „Für deinen Claude“",
    items: [
      ["vorlagen/vergleichsbasis.md", "Die Vergleichsbasis, gefüllt mit den Zahlen auf der Bühne"],
      ["take-home/projekt-anweisungen.md", "Die Methode als Anweisung für ein Claude-Projekt"],
      ["take-home/skill/angebote-vergleichen", "Der Skill: erst die Basis, nie eine fehlende Zeile als 0"],
      ["vorlagen/verhandlungsmail.md", "Die Mail an das Angebot vorn: Index, Deckel, Preisbindung"],
    ] as [string, string][],
    basisDownload: "Vergleichsbasis mit diesen Zahlen",
    basisNote: "Die Vorlage aus dem Kit, in diesem Tab gefüllt. Eine Markdown-Datei auf Deutsch.",
    fromKit: "Gefüllt mit den Zahlen des Kits.",
    fromYours: "Gefüllt mit deinen Zeilen.",
    line: DEMO.takehome.line,
  },
  objective: DEMO.promise,
};

export type Pack = typeof de;

const en: Pack = {
  locale: "en",
  stageLabel: "Three offers, line by line on one basis",
  question: "Which offer costs less?",
  caseLine: "Invented case. Brandtwerk Gerätebau needs shipping boxes and holds three offers: Nürnberg, Poznań, Brno.",
  lineNames: { Ware: "Goods", Fracht: "Freight", Einmalig: "One-off", Lager: "Storage", Skonto: "Discount" },
  headlineNote: "the goods price only",
  perRecurring: "per year",
  perOnce: "one-off",
  open: "open",
  winner: "cheapest",
  yourBet: "your guess",
  suggested: "suggestion taken",
  tipp: {
    caption: "By the goods price, {headline_winner} is cheaper, by {headline_gap}.",
    lever: "What costs least, delivered and paid?",
  },
  kipp: {
    caption:
      "Your guess: {bet}. Delivered and paid for a year, {last} is the most expensive offer: {last_total}. {winner} costs least, {gap} less than {runner}.",
    running: "Freight, one-off costs, storage and discount come in.",
  },
  sources: {
    head: "Where the numbers of {option} come from",
    hint: "Tap an offer: every number names its place in the document.",
    none: "no source",
    missingCell: "missing",
    total: "Total",
    quoteNote: "Quoted from the German documents of the kit.",
  },
  methode: {
    caption: "Three lines from the field card. That is the method.",
    lines: [
      "Fix the basis before you compare: quantity per year, price per unit, delivered to the plant, one-off costs, early-payment discount.",
      "Bring every offer onto that basis and write down where each number stands.",
      "Name the line that decides, and ask for every number that is missing.",
    ],
    file: "karten/feldkarte.md",
    download: "Download the kit",
    kitHref: KIT_HREF,
  },
  papier: {
    caption: "{factor}: {winner} is cheaper, by {gap}. The line that decides: {decider}.",
    lever: "Offer C's paper surcharge follows an index. How far does it rise?",
    label: "Paper +{v}%",
    flip: "{rival} leads from {v}%",
    stops: "Rise of the paper index",
    stop: "+{v}%",
  },
  deins: {
    caption: "Paste the lines of your own offers. Invented or general numbers will do.",
    lever: "Enter your lines",
    heading: "Your offers",
    stays: "Stays on this device.",
    hint: "One row per item: offer, line, amount, one-off or yearly, and if you like the source. For example: Offer A, Freight, 1400, yearly",
    field: "One row per item",
    load: "Use the second case",
    apply: "Compute",
    clear: "Clear my input",
    kitShown: "The stage still shows the kit's numbers.",
    ownShown: "The stage shows your lines.",
    missing: "{option} has no line {line}. It stays open until you give the number.",
    missingMore: "{n} more lines are open.",
    errors: {
      empty: "No rows. Enter at least two offers.",
      long: "Too long: at most {max} characters.",
      column: "The column {column} is missing.",
      option: "Row {n}: the offer's name is missing.",
      line: "Row {n}: the line is missing.",
      name: "Row {n}: offer or line is longer than 40 characters.",
      amount: "Row {n}: \"{value}\" is not an amount.",
      decimals: "Row {n}: \"{value}\" has more than two decimals.",
      per: "Row {n}: \"{value}\" is neither one-off nor yearly.",
      source: "Row {n}: the source is longer than {max} characters.",
      rows: "At most {max} rows.",
      options: "At most {max} offers.",
      lines: "At most {max} lines.",
      two: "It takes at least two offers.",
    },
  },
  mitnehmen: {
    caption: "The files you just moved, and the method for your own Claude.",
    lever: "To \"For your Claude\"",
    items: [
      ["vorlagen/vergleichsbasis.md", "The comparison basis, filled with the numbers on the stage"],
      ["take-home/projekt-anweisungen.md", "The method as instructions for a Claude Project"],
      ["take-home/skill/angebote-vergleichen", "The skill: basis first, never a missing line as 0"],
      ["vorlagen/verhandlungsmail.md", "The email to the leading offer: index, cap, price validity"],
    ],
    basisDownload: "Comparison basis with these numbers",
    basisNote: "The kit's template, filled in this tab. A Markdown file in German.",
    fromKit: "Filled with the kit's numbers.",
    fromYours: "Filled with your lines.",
    line: "Delivered and paid, {winner} costs less per year, by {gap}. Before you sign, ask about the line {decider}.",
  },
  objective:
    "Afterwards you can compare offers on one shared basis: same quantity, per unit, delivered to the plant, with one-off costs and discount.",
};

export const COPY = { de, en } as const;

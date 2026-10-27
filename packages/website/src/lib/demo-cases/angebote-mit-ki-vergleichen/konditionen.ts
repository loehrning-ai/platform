/**
 * The terms of the three offers and Brandtwerk's own rates, each with the words of the kit file it
 * comes from. Two jobs: the stage quotes them (printed price, lot size, delivery term, footnote), and
 * `derivedCells()` rebuilds all fifteen cost cells of kostenzeilen.csv from them. konditionen.test.ts
 * checks that every quote is a substring of its file in the zip and that the derived cells equal the
 * CSV, so the CSV stays the source and the terms cannot drift from it.
 *
 * Money is in cents. No imports apart from types.
 */

export type OfferKey = "A" | "B" | "C";
export const OFFER_KEYS: readonly OfferKey[] = ["A", "B", "C"];

const FALL = "angebote-vergleichen-kit/fall";
export const FILES = {
  request: `${FALL}/anfrage.md`,
  A: `${FALL}/angebot-a-nuernberg.md`,
  B: `${FALL}/angebot-b-poznan.md`,
  C: `${FALL}/angebot-c-brno.md`,
  internal: `${FALL}/kosten-intern.md`,
  fieldCard: "angebote-vergleichen-kit/karten/feldkarte.md",
} as const;

export interface Quote {
  readonly file: string;
  readonly text: string;
}

export type Payer = "supplier" | "buyer";

export interface OfferTerms {
  readonly key: OfferKey;
  /** The offer's name in kostenzeilen.csv. */
  readonly option: string;
  readonly file: string;
  /** The price as printed: cents for `per` boxes. */
  readonly price: { readonly cents: number; readonly per: number; readonly quote: Quote };
  /** A lower price for a larger quantity, if the offer names one. */
  readonly volume?: { readonly cents: number; readonly from: number; readonly quote: Quote };
  readonly delivery: { readonly term: "DAP" | "EXW" | "FCA"; readonly place: string; readonly payer: Payer; readonly quote: Quote };
  /** Boxes per delivery (A: the smallest call-off, B: the minimum order, C: the lot size). */
  readonly lot: { readonly boxes: number; readonly quote: Quote };
  readonly oneOff: { readonly cents: number; readonly quote: Quote };
  /** Early-payment discount in per cent of the goods. */
  readonly discount: { readonly pct: number; readonly quote: Quote };
  /** C only: the share of the goods price the paper surcharge applies to. */
  readonly paper?: { readonly share: number; readonly quote: Quote };
}

const q = (file: string, text: string): Quote => ({ file, text });

export const REQUEST = {
  qty: 40000,
  qtyQuote: q(FILES.request, "40.000 Stück, Abruf nach Bedarf über das Jahr verteilt"),
  qtyChip: q(FILES.request, "40.000 Stück"),
  place: q(FILES.request, "Werk Brandtwerk, Nordhessen, Rampe 3"),
} as const;

export const TERMS: Readonly<Record<OfferKey, OfferTerms>> = {
  A: {
    key: "A",
    option: "A Nürnberg",
    file: FILES.A,
    price: { cents: 66, per: 1, quote: q(FILES.A, "**0,66 €**") },
    volume: { cents: 62, from: 60000, quote: q(FILES.A, "Staffel ab 60.000 Stück / Jahr | | 0,62 €") },
    delivery: { term: "DAP", place: "Brandtwerk", payer: "supplier", quote: q(FILES.A, "frei Werk Brandtwerk (DAP Incoterms® 2020)") },
    lot: { boxes: 3000, quote: q(FILES.A, "Abrufe ab 3.000 Stück") },
    oneOff: { cents: 0, quote: q(FILES.A, "Stanzform und Klischee: vorhanden aus Ihrem Muster, ohne Berechnung.") },
    discount: { pct: 2, quote: q(FILES.A, "innerhalb 14 Tagen mit 2 % Skonto") },
  },
  B: {
    key: "B",
    option: "B Poznań",
    file: FILES.B,
    price: { cents: 52000, per: 1000, quote: q(FILES.B, "520,00 EUR / 1000 szt. (Stück)") },
    delivery: { term: "EXW", place: "Poznań", payer: "buyer", quote: q(FILES.B, "EXW Poznań (Incoterms® 2020)") },
    lot: { boxes: 20000, quote: q(FILES.B, "20.000 Stück je Auftrag") },
    oneOff: { cents: 145000, quote: q(FILES.B, "¹ Für die Stanzform berechnen wir einmalig 1.450,00 EUR netto") },
    discount: { pct: 2, quote: q(FILES.B, "2 % Skonto bei Zahlung in 10 Tagen") },
  },
  C: {
    key: "C",
    option: "C Brno",
    file: FILES.C,
    price: { cents: 5750, per: 100, quote: q(FILES.C, "**57,50 EUR**") },
    delivery: { term: "FCA", place: "Brno", payer: "buyer", quote: q(FILES.C, "FCA Brno, Lager Kartovka (Incoterms® 2020)") },
    lot: { boxes: 10000, quote: q(FILES.C, "Losgröße: 10.000 Stück je Lieferung (10 Paletten).") },
    oneOff: { cents: 0, quote: q(FILES.C, "Stanzform und Klischee übernehmen wir, ohne Berechnung.") },
    discount: { pct: 3, quote: q(FILES.C, "3 % Skonto innerhalb 10 Tagen") },
    paper: { share: 0.6, quote: q(FILES.C, "Der Papieranteil an unserem Preis beträgt 60 %.") },
  },
};

/** The printed price as the letter shows it, without markdown stars. */
export function printedPrice(key: OfferKey): string {
  return TERMS[key].price.quote.text.replace(/\*/g, "");
}

/** Brandtwerk's own rates (kosten-intern.md): in no offer, from the buyer's list. */
export const INTERNAL = {
  boxesPerPallet: 1000,
  boxesQuote: q(FILES.internal, "Eine Palette trägt 1.000 Kartons"),
  freePlaces: 10,
  freeQuote: q(FILES.internal, "Im eigenen Lager sind 10 Palettenplätze für Kartons frei."),
  placeMonthCents: 1600,
  placeQuote: q(FILES.internal, "16 € je Palettenplatz und Monat"),
  months: 12,
  trip: {
    A: { cents: 41000, quote: q(FILES.internal, "| Nürnberg ins Werk | Teilladung, bis 12 Paletten | 410 € |") },
    B: { cents: 140000, quote: q(FILES.internal, "| Poznań ins Werk | Komplettladung, bis 33 Paletten, mit Verladung beim Lieferanten | 1.400 € |") },
    C: { cents: 65000, quote: q(FILES.internal, "| Brno ins Werk | Teilladung, bis 12 Paletten | 650 € |") },
  } as Readonly<Record<OfferKey, { readonly cents: number; readonly quote: Quote }>>,
  discountQuote: q(FILES.internal, "Wir ziehen Skonto immer"),
} as const;

/** The field card's sentences the stage quotes (karten/feldkarte.md, German as written). */
export const FIELD_CARD = {
  DAP: q(FILES.fieldCard, "Der Lieferant liefert bis zu dir. Die Fahrt ist im Preis."),
  EXW: q(FILES.fieldCard, "Du holst ab und verlädst. Fracht und Verladung zahlst du."),
  FCA: q(FILES.fieldCard, "Der Lieferant übergibt an deinen Frachtführer. Die Fahrt zahlst du."),
} as const;

/** Price of one box in cents (may be fractional: C is 57,5 cents). */
export function unitCents(key: OfferKey): number {
  const { cents, per } = TERMS[key].price;
  return cents / per;
}

/** Trips Brandtwerk pays for in a year: none when the supplier delivers. */
export function trips(key: OfferKey, qty = REQUEST.qty): number {
  const terms = TERMS[key];
  return terms.delivery.payer === "buyer" ? qty / terms.lot.boxes : 0;
}

/** Pallets one delivery brings. */
export function pallets(key: OfferKey): number {
  return TERMS[key].lot.boxes / INTERNAL.boxesPerPallet;
}

/** Pallets of one delivery that do not fit the free places. */
export function externalPallets(key: OfferKey): number {
  return Math.max(0, pallets(key) - INTERNAL.freePlaces);
}

export interface Cells {
  readonly Ware: number;
  readonly Fracht: number;
  readonly Einmalig: number;
  readonly Lager: number;
  readonly Skonto: number;
}

/** The five cost cells of one offer for a year at the request's quantity, in cents. */
export function derivedCells(key: OfferKey, qty = REQUEST.qty): Cells {
  const terms = TERMS[key];
  const ware = Math.round(unitCents(key) * qty);
  return {
    Ware: ware,
    Fracht: trips(key, qty) * INTERNAL.trip[key].cents,
    Einmalig: terms.oneOff.cents,
    Lager: externalPallets(key) * INTERNAL.placeMonthCents * INTERNAL.months,
    Skonto: -Math.round((ware * terms.discount.pct) / 100),
  };
}

/** The offer key of a name in kostenzeilen.csv ("C Brno" → "C"), or null for own offers. */
export function keyOf(option: string): OfferKey | null {
  return OFFER_KEYS.find((key) => TERMS[key].option === option) ?? null;
}

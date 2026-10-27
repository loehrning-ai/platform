import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readZipText } from "@/lib/zip/read";
import { kitRows } from "./config";
import {
  derivedCells,
  externalPallets,
  FIELD_CARD,
  INTERNAL,
  keyOf,
  OFFER_KEYS,
  pallets,
  printedPrice,
  REQUEST,
  TERMS,
  trips,
  unitCents,
  type Quote,
} from "./konditionen";

const ZIP = new Uint8Array(readFileSync(path.join(process.cwd(), "public/workshops/angebote-mit-ki-vergleichen/angebote-vergleichen-kit.zip")));
const file = (name: string) => {
  const text = readZipText(ZIP, name);
  if (text === null) throw new Error(`${name} is not in the kit zip`);
  return text;
};

function allQuotes(): Quote[] {
  const quotes: Quote[] = [REQUEST.qtyQuote, REQUEST.qtyChip, REQUEST.place, INTERNAL.boxesQuote, INTERNAL.freeQuote, INTERNAL.placeQuote, INTERNAL.discountQuote];
  quotes.push(...Object.values(FIELD_CARD));
  for (const key of OFFER_KEYS) {
    const terms = TERMS[key];
    quotes.push(terms.price.quote, terms.delivery.quote, terms.lot.quote, terms.oneOff.quote, terms.discount.quote, INTERNAL.trip[key].quote);
    if (terms.volume) quotes.push(terms.volume.quote);
    if (terms.paper) quotes.push(terms.paper.quote);
  }
  return quotes;
}

describe("the offers' terms, quoted from the kit", () => {
  it("quotes every term word for word from its kit file", () => {
    for (const quote of allQuotes()) expect(file(quote.file), quote.text).toContain(quote.text);
  });

  it("shows the printed prices as the letters print them", () => {
    expect(OFFER_KEYS.map(printedPrice)).toEqual(["0,66 €", "520,00 EUR / 1000 szt. (Stück)", "57,50 EUR"]);
  });

  it("derives price per box, trips and pallets from the terms", () => {
    expect(OFFER_KEYS.map(unitCents)).toEqual([66, 52, 57.5]);
    expect(OFFER_KEYS.map((key) => trips(key))).toEqual([0, 2, 4]);
    expect(OFFER_KEYS.map(pallets)).toEqual([3, 20, 10]);
    expect(OFFER_KEYS.map(externalPallets)).toEqual([0, 10, 0]);
    expect(TERMS.A.volume).toMatchObject({ cents: 62, from: 60000 });
    expect(REQUEST.qty).toBeLessThan(TERMS.A.volume?.from ?? 0);
  });

  it("rebuilds all fifteen cells of kostenzeilen.csv exactly", () => {
    const rows = kitRows("de");
    expect(rows).toHaveLength(15);
    for (const row of rows) {
      const key = keyOf(row.option);
      if (!key) throw new Error(`unknown offer ${row.option}`);
      const cells = derivedCells(key) as unknown as Record<string, number>;
      expect(cells[row.line], `${row.option} ${row.line}`).toBe(row.cents);
    }
  });

  it("knows the offers by their CSV names only", () => {
    expect(keyOf("C Brno")).toBe("C");
    expect(keyOf("X Kassel")).toBeNull();
  });
});

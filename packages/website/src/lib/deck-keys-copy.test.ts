import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DECK_KEYS } from "./deck-keys-copy";
import { getWorkshops } from "./workshops";

describe("one deck key sentence", () => {
  it.each(["de", "en"] as const)("every %s deck material ends with it", (locale) => {
    const decks = getWorkshops(locale).flatMap((workshop) => workshop.materials.filter((material) => material.role === "deck"));
    expect(decks.length).toBeGreaterThanOrEqual(4);
    for (const deck of decks) expect(deck.description, deck.href).toMatch(new RegExp(`${DECK_KEYS[locale].replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")}$`));
  });

  it("names exactly the keys the shared deck contract binds", () => {
    const contract = readFileSync(resolve(process.cwd(), "../../scripts/workshops/deck-keys.js"), "utf8");
    expect(contract).toMatch(/r or Shift\+R\s+back to the cover/);
    expect(contract).toMatch(/P\s+opens the presenter view/);
    expect(DECK_KEYS.de).toContain("r führt zum Anfang");
    expect(DECK_KEYS.en).toContain("P opens the presenter view");
  });
});

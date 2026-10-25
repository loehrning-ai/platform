import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { figures } from "./demo-cases/esg-berichte-mit-ki/figures";
import { LEDGER, ledgerCounts, VSME } from "./demo-cases/esg-berichte-mit-ki/ledger";

/*
 * The deck is the kit and the demo on a projector: every number it binds with data-v must be the
 * number the demo computes from the same files. A deck rebuild that drifts fails here.
 */
const root = resolve(process.cwd(), "public/workshops/esg-berichte-mit-ki");
const EDITIONS = { de: "slides.html", en: "en/slides.html" } as const;

const bound = (html: string) => {
  const values = new Map<string, string>();
  for (const [, key, value] of html.matchAll(/data-v="([A-Za-z0-9]+)">([^<]*)</g)) {
    const seen = values.get(key);
    expect(seen === undefined || seen === value, `${key} is bound to one value`).toBe(true);
    values.set(key, value);
  }
  return values;
};

describe.each(Object.entries(EDITIONS))("deck figures (%s)", (locale, file) => {
  const html = readFileSync(resolve(root, file), "utf8");
  const deck = bound(html);
  const demo = figures(locale as "de" | "en");

  it("binds every figure the demo also computes to the demo's value", () => {
    const shared = [...deck.keys()].filter((key) => key in demo);
    expect(shared.length).toBeGreaterThanOrEqual(10);
    for (const key of shared) expect(deck.get(key), key).toBe(demo[key]);
  });

  it("counts the register after the late invoice from the ledger", () => {
    const after = ledgerCounts("after");
    expect(deck.get("afterBelegt")).toBe(String(after.belegt));
    expect(deck.get("afterSchwach")).toBe(String(after.schwach));
    expect(deck.get("afterLuecke")).toBe(String(after.luecke));
  });

  it("shows one register tile per ledger row and per VSME disclosure", () => {
    const register = html.slice(html.indexOf('id="register"'), html.indexOf('id="nachreichung"'));
    for (const row of LEDGER) expect(register, row.id).toContain(`>${row.id}<`);
    for (const tile of VSME) expect(register, tile.id).toContain(`>${tile.id}<`);
  });
});

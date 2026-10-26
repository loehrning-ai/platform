import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readZipText } from "@/lib/zip/read";
import { COPY, COPY_SOURCE } from "./copy";
import { LEDGER } from "./ledger";

/*
 * No number is typed into the copy pack: every digit a sentence prints comes
 * from a {slot} (kit facts, figures or a scene's live value). What may stay
 * is a name, never a quantity: a register row (F2), a ban-list point (4b)
 * and the directive's number, each checked against the kit.
 */
const ZIP = {
  de: { href: "/workshops/esg-berichte-mit-ki/crvena-zemja-nachweisprobe.zip", rules: "crvena-zemja-nachweisprobe/ordner/regeln_werbeaussagen.md" },
  en: { href: "/workshops/esg-berichte-mit-ki/crvena-zemja-esg-kit.zip", rules: "crvena-zemja-esg-kit/files/green_claims_rules.md" },
} as const;

function strings(value: unknown, at: string, out: Array<[string, string]>): Array<[string, string]> {
  if (typeof value === "string") out.push([at, value]);
  else if (Array.isArray(value)) value.forEach((item, index) => strings(item, `${at}[${index}]`, out));
  else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) strings(item, `${at}.${key}`, out);
  return out;
}

describe.each(["de", "en"] as const)("copy digits (%s)", (locale) => {
  const rules = readZipText(new Uint8Array(readFileSync(path.join(process.cwd(), "public", ZIP[locale].href))), ZIP[locale].rules) ?? "";
  const rowIds = new Set<string>(LEDGER.map((row) => row.id));

  it("types no quantity: every digit is a slot or a name the kit uses", () => {
    const typed: string[] = [];
    for (const [at, text] of strings(COPY_SOURCE[locale], locale, [])) {
      for (const token of text.replace(/\{=?\w+\}/g, " ").match(/[A-Za-z]*\d[\w/]*/g) ?? []) {
        const name = rowIds.has(token) || ((/^[24][a-c]$/.test(token) || token === "2024/825") && rules.includes(token));
        if (!name) typed.push(`${at}: ${token} in "${text}"`);
      }
    }
    expect(typed).toEqual([]);
  });

  it("fills every kit fact slot", () => {
    expect(JSON.stringify(COPY[locale])).not.toContain("{=");
  });
});

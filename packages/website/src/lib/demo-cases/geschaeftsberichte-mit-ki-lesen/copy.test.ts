import { describe, expect, it } from "vitest";
import { COPY } from "./copy";

/** Every number on screen comes from data.ts and definitions.ts; copy carries only placeholders. */
function strings(value: unknown, path: string): readonly [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((item, index) => strings(item, `${path}.${index}`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, item]) => strings(item, `${path}.${key}`));
  return [];
}

// Rule texts quote fixed facts (28 to 31 days), the source line cites guideline numbers, placeholders are examples.
const ALLOWED = /^\.(own\.rules\.|own\.cite$|own\.fields\.\w+\.placeholder$)/;

describe.each(["de", "en"] as const)("the %s pack", (locale) => {
  it("holds no number of two or more digits outside the rule texts", () => {
    const offenders = strings(COPY[locale], "")
      .filter(([path]) => !ALLOWED.test(path))
      .filter(([, text]) => /\d{2,}/.test(text.replace(/\{[^}]*\}/g, "")));
    expect(offenders).toEqual([]);
  });

  it("names the line only through {line}, so the voice lint reads normal case", () => {
    const offenders = strings(COPY[locale], "").filter(([, text]) => /\bCRAFT\b|\bNORTHWIND\b/.test(text));
    expect(offenders).toEqual([]);
  });

  it("uses one word for a unit and one for a record (glossary)", () => {
    const all = strings(COPY[locale], "")
      .map(([, text]) => text)
      .join("\n");
    if (locale === "de") expect(all).not.toMatch(/\bTeile\b/);
    else expect(all).not.toMatch(/\bpieces\b|\bparts\b/i);
  });
});

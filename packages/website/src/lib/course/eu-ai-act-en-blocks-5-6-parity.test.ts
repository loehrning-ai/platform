import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

const BLOCK_FILES = [
  "block-5-governance-lessons.json",
  "block-6-praxis-lessons.json",
] as const;

const TRANSLATABLE_KEYS = new Set([
  "caption",
  "content",
  "explanation",
  "hint",
  "keyConcepts",
  "keyTakeaway",
  "prompt",
  "questionText",
  "subtitle",
  "text",
  "title",
]);

const ALLOWED_UNCHANGED_VISIBLE_VALUES = new Set([
  "AI Office",
  "BfDI",
  "BNetzA",
  "BaFin",
  "CC BY 4.0",
  "DAkkS",
  "ISO 42001",
  "ISO/IEC 23894:2023",
  "ISO/IEC 27001:2022",
  "ISO/IEC 42001:2023",
  "Logging",
  "prEN 18286",
]);

const MONTHS: Record<string, string> = {
  august: "08",
  december: "12",
  dezember: "12",
  februar: "02",
  february: "02",
  july: "07",
  juli: "07",
  june: "06",
  juni: "06",
  october: "10",
  oktober: "10",
};

function loadJson(relativePath: string): JsonValue {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), relativePath), "utf8"),
  ) as JsonValue;
}

function invariantProjection(value: JsonValue, parentKey = ""): JsonValue {
  if (typeof value === "string") {
    return TRANSLATABLE_KEYS.has(parentKey) ? "<translated>" : value;
  }

  if (Array.isArray(value)) {
    return value.map((child) => invariantProjection(child, parentKey));
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        invariantProjection(child, key),
      ]),
    );
  }

  return value;
}

function collectStrings(value: JsonValue, result: string[] = []): string[] {
  if (typeof value === "string") {
    result.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((child) => collectStrings(child, result));
  } else if (value !== null && typeof value === "object") {
    Object.values(value).forEach((child) => collectStrings(child, result));
  }
  return result;
}

function collectVisibleStrings(
  value: JsonValue,
  parentKey = "",
  result: string[] = [],
): string[] {
  if (typeof value === "string") {
    if (TRANSLATABLE_KEYS.has(parentKey)) result.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((child) => collectVisibleStrings(child, parentKey, result));
  } else if (value !== null && typeof value === "object") {
    Object.entries(value).forEach(([key, child]) =>
      collectVisibleStrings(child, key, result),
    );
  }
  return result;
}

function uniqueMatches(text: string, expression: RegExp): string[] {
  return [...text.matchAll(expression)]
    .map((match) => match[1])
    .filter((match): match is string => Boolean(match))
    .filter((match, index, matches) => matches.indexOf(match) === index)
    .sort();
}

function legalInventory(value: JsonValue) {
  const text = collectStrings(value).join("\n");
  return {
    annexes: uniqueMatches(
      text,
      /\b(?:Anhang|Annex)[ -]?(I{1,3}|IV|V|VI|VII|VIII)\b/giu,
    ),
    articles: uniqueMatches(
      text,
      /\b(?:Art(?:ikel)?\.?|Article(?:s)?)\s*(\d+)/giu,
    ),
    directives: uniqueMatches(
      text,
      /(?:Richtlinie|Directive)(?:\s*\(EU\))?\s*(\d{4}\/\d{4})/giu,
    ),
    regulations: uniqueMatches(
      text,
      /(?:Verordnung|Regulation)\s*\(EU\)\s*(\d{4}\/\d{4})/giu,
    ),
    statutorySections: uniqueMatches(text, /(?:§|section)\s*(\d+)/giu),
    standards: uniqueMatches(
      text,
      /\b((?:ISO\/IEC|prEN)\s*\d+(?::\d{4})?)\b/giu,
    ),
    yearSpans: uniqueMatches(text, /\b(20\d{2}\/20\d{2})\b/gu),
  };
}

function calendarDates(value: JsonValue): string[] {
  const dates = new Set<string>();
  const monthNames = Object.keys(MONTHS).join("|");
  const fullDatePattern = new RegExp(
    `\\b(\\d{1,2})\\.?\\s+(${monthNames})\\s+(\\d{4})\\b`,
    "giu",
  );

  for (const text of collectStrings(value)) {
    if (/^\d{4}-\d{2}-\d{2}$/u.test(text)) dates.add(text);
    for (const match of text.matchAll(fullDatePattern)) {
      const [, day, month, year] = match;
      dates.add(
        `${year}-${MONTHS[month.toLocaleLowerCase("de-DE")]}-${day.padStart(2, "0")}`,
      );
    }
  }

  return [...dates].sort();
}

function urls(value: JsonValue): string[] {
  return collectStrings(value)
    .flatMap((text) => text.match(/https?:\/\/[^\s)\]|]+/gu) ?? [])
    .sort();
}

describe("EU AI Act English blocks 5 and 6", () => {
  for (const filename of BLOCK_FILES) {
    it(`${filename} preserves structure and every non-prose value`, () => {
      const source = loadJson(`content/eu-ai-act-kurs/${filename}`);
      const translation = loadJson(`content/eu-ai-act-kurs/en/${filename}`);

      expect(invariantProjection(translation)).toEqual(
        invariantProjection(source),
      );
      expect(urls(translation)).toEqual(urls(source));
      expect(legalInventory(translation)).toEqual(legalInventory(source));
      expect(calendarDates(translation)).toEqual(calendarDates(source));
      expect(translation).not.toEqual(source);
    });

    it(`${filename} translates every visible sentence while retaining identifiers`, () => {
      const source = collectVisibleStrings(
        loadJson(`content/eu-ai-act-kurs/${filename}`),
      );
      const translation = collectVisibleStrings(
        loadJson(`content/eu-ai-act-kurs/en/${filename}`),
      );

      expect(translation).toHaveLength(source.length);
      translation.forEach((text, index) => {
        expect(text.trim()).not.toBe("");
        if (text === source[index]) {
          expect(ALLOWED_UNCHANGED_VISIBLE_VALUES).toContain(text);
        }
      });
    });
  }

  it("retains the statutory dates, reporting periods, and fine ceilings", () => {
    const english = BLOCK_FILES.map((filename) =>
      collectStrings(
        loadJson(`content/eu-ai-act-kurs/en/${filename}`),
      ).join("\n"),
    ).join("\n");

    for (const deadline of [
      "29 July 2026",
      "2 August 2027",
      "2 December 2027",
      "2 August 2028",
    ]) {
      expect(english).toContain(deadline);
    }

    for (const period of [
      "15 working days",
      "15 days",
      "10 days",
      "two days",
      "three months",
      "six months",
    ]) {
      expect(english).toContain(period);
    }

    for (const amount of [
      "EUR 7.5 million",
      "EUR 15 million",
      "EUR 35 million",
      "EUR 50 million",
    ]) {
      expect(english).toContain(amount);
    }
  });

  it("labels implementation controls separately from statutory duties", () => {
    const english = BLOCK_FILES.map((filename) =>
      collectStrings(
        loadJson(`content/eu-ai-act-kurs/en/${filename}`),
      ).join("\n"),
    ).join("\n");

    expect(english).toContain(
      "an implementation control, not a statutory five-step format",
    );
    expect(english).toContain(
      "implementation choices rather than a statutory clause list",
    );
    expect(english).toContain(
      "implementation tools, not statutory forms",
    );
    expect(english).toContain(
      "an implementation option, not a substitute for the applicable legal duties",
    );
  });
});

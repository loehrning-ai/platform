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
  "block-1-grundlagen-lessons.json",
  "block-2-risikoklassen-lessons.json",
] as const;

const IMMUTABLE_KEYS = new Set([
  "_claimRef",
  "blockId",
  "blockLastVerified",
  "claimId",
  "courseSlug",
  "cpId",
  "durationMinutes",
  "id",
  "isCorrect",
  "kind",
  "lastReviewed",
  "lessonId",
  "nextReview",
  "number",
  "owner",
  "placement",
  "readTimeMinutes",
  "reviewCadence",
  "riskClass",
  "triggerEvents",
  "url",
]);

const LEARNER_PROSE_KEYS = new Set([
  "caption",
  "content",
  "explanation",
  "hint",
  "keyTakeaway",
  "prompt",
  "questionText",
  "subtitle",
  "text",
  "title",
]);

const MONTHS: Record<string, string> = {
  april: "04",
  august: "08",
  december: "12",
  dezember: "12",
  februar: "02",
  february: "02",
  january: "01",
  januar: "01",
  july: "07",
  juli: "07",
  june: "06",
  juni: "06",
  march: "03",
  märz: "03",
  may: "05",
  mai: "05",
  november: "11",
  october: "10",
  oktober: "10",
  september: "09",
};

function loadJson(relativePath: string): JsonValue {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), relativePath), "utf8"),
  ) as JsonValue;
}

function structuralShape(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(structuralShape);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, structuralShape(child)]),
    );
  }

  return typeof value;
}

function collectImmutableValues(
  value: JsonValue,
  path = "$",
  result: Record<string, JsonValue> = {},
): Record<string, JsonValue> {
  if (Array.isArray(value)) {
    value.forEach((child, index) => {
      collectImmutableValues(child, `${path}[${index}]`, result);
    });
    return result;
  }

  if (value === null || typeof value !== "object") {
    return result;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (IMMUTABLE_KEYS.has(key)) {
      result[childPath] = child;
    }
    collectImmutableValues(child, childPath, result);
  }

  return result;
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

function collectUrls(value: JsonValue): string[] {
  return collectStrings(value)
    .flatMap((text) => text.match(/https?:\/\/[^\s)\]|]+/g) ?? [])
    .sort();
}

function collectLearnerProse(
  value: JsonValue,
  path = "$",
  result: Record<string, string> = {},
): Record<string, string> {
  if (Array.isArray(value)) {
    value.forEach((child, index) => {
      collectLearnerProse(child, `${path}[${index}]`, result);
    });
    return result;
  }

  if (value === null || typeof value !== "object") {
    return result;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (LEARNER_PROSE_KEYS.has(key) && typeof child === "string") {
      result[childPath] = child;
    }
    collectLearnerProse(child, childPath, result);
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

function collectLegalReferenceInventory(value: JsonValue) {
  const text = collectStrings(value).join("\n");
  const instruments = uniqueMatches(text, /\b(\d{4}\/\d{2,4})\b/gu).filter(
    (reference) => Number(reference.split("/")[1]) < 2000,
  );

  return {
    annexes: uniqueMatches(text, /\b(?:Anhang|Annex)[ -]?(I{1,3}|IV|V|VI|VII|VIII)\b/giu),
    articles: uniqueMatches(
      text,
      /\b(?:Art(?:ikel)?\.?|Article(?:s)?)\s*(\d+)/giu,
    ),
    instruments,
    recitals: uniqueMatches(
      text,
      /\b(?:Erwägungsgrund|Recital)\s+(\d+)/giu,
    ),
  };
}

function collectCalendarDates(value: JsonValue): string[] {
  const dates = new Set<string>();
  const monthNames = Object.keys(MONTHS).join("|");
  const fullDatePattern = new RegExp(
    `\\b(\\d{1,2})\\.?\\s+(${monthNames})\\s+(\\d{4})\\b`,
    "giu",
  );
  const monthYearPattern = new RegExp(
    `\\b(${monthNames})\\s+(\\d{4})\\b`,
    "giu",
  );

  for (const text of collectStrings(value)) {
    for (const match of text.matchAll(fullDatePattern)) {
      const [, day, month, year] = match;
      dates.add(`${year}-${MONTHS[month.toLocaleLowerCase("de-DE")]}-${day.padStart(2, "0")}`);
    }
    for (const match of text.matchAll(monthYearPattern)) {
      const [, month, year] = match;
      dates.add(`${year}-${MONTHS[month.toLocaleLowerCase("de-DE")]}`);
    }
  }

  return [...dates].sort();
}

function collectPercentages(value: JsonValue): string[] {
  return [
    ...new Set(
      collectStrings(value).flatMap((text) =>
        [...text.matchAll(/\b(\d+(?:[.,]\d+)?)\s*%/gu)].map((match) =>
          match[1].replace(",", "."),
        ),
      ),
    ),
  ].sort();
}

describe("EU AI Act English blocks 1 and 2", () => {
  for (const filename of BLOCK_FILES) {
    it(`${filename} preserves structure, identity, sources, and legal anchors`, () => {
      const source = loadJson(`content/eu-ai-act-kurs/${filename}`);
      const translation = loadJson(`content/eu-ai-act-kurs/en/${filename}`);

      expect(structuralShape(translation)).toEqual(structuralShape(source));
      expect(collectImmutableValues(translation)).toEqual(
        collectImmutableValues(source),
      );
      expect(collectUrls(translation)).toEqual(collectUrls(source));
      expect(collectLegalReferenceInventory(translation)).toEqual(
        collectLegalReferenceInventory(source),
      );
      expect(collectCalendarDates(translation)).toEqual(
        collectCalendarDates(source),
      );
      expect(collectPercentages(translation)).toEqual(
        collectPercentages(source),
      );
      expect(translation).not.toEqual(source);

      const sourceProse = collectLearnerProse(source);
      const translatedProse = collectLearnerProse(translation);
      expect(Object.keys(translatedProse)).toEqual(Object.keys(sourceProse));
      for (const [path, translatedText] of Object.entries(translatedProse)) {
        expect(translatedText.trim(), `${path} must not be empty`).not.toBe("");
        expect(translatedText, `${path} must be translated`).not.toBe(
          sourceProse[path],
        );
      }
    });
  }

  it("retains every deadline and fine amount stated in the two source blocks", () => {
    const english = BLOCK_FILES.map((filename) =>
      collectStrings(
        loadJson(`content/eu-ai-act-kurs/en/${filename}`),
      ).join("\n"),
    ).join("\n");

    for (const deadline of [
      "1 August 2024",
      "2 February 2025",
      "2 August 2025",
      "27 July 2026",
      "2 August 2026",
      "2 December 2027",
      "2 August 2028",
    ]) {
      expect(english).toContain(deadline);
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
});

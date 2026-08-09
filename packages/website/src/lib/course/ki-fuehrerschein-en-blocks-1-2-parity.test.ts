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
  "block-1-entdeckung-lessons.json",
  "block-2-datenschutz-lessons.json",
] as const;

const IMMUTABLE_KEYS = new Set([
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
  "lastVerified",
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
  "content",
  "explanation",
  "keyTakeaway",
  "questionText",
  "scenario",
  "subtitle",
  "text",
  "title",
]);

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

function collectUrls(value: JsonValue, result: string[] = []): string[] {
  if (typeof value === "string") {
    result.push(...(value.match(/https?:\/\/[^\s)\]|]+/g) ?? []));
  } else if (Array.isArray(value)) {
    value.forEach((child) => collectUrls(child, result));
  } else if (value !== null && typeof value === "object") {
    Object.values(value).forEach((child) => collectUrls(child, result));
  }

  return result;
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

describe("KI-Führerschein English blocks 1 and 2", () => {
  for (const filename of BLOCK_FILES) {
    it(`${filename} preserves the German source structure and invariants`, () => {
      const source = loadJson(`content/ki-fuehrerschein/${filename}`);
      const translation = loadJson(`content/ki-fuehrerschein/en/${filename}`);

      expect(structuralShape(translation)).toEqual(structuralShape(source));
      expect(collectImmutableValues(translation)).toEqual(
        collectImmutableValues(source),
      );
      expect(collectUrls(translation).sort()).toEqual(collectUrls(source).sort());
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
});

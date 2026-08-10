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
  "block-3-hochrisiko-lessons.json",
  "block-4-gpai-transparenz-lessons.json",
] as const;

const LEARNER_COPY_KEYS = new Set([
  "content",
  "desc",
  "explanation",
  "keyConcepts",
  "keyTakeaway",
  "label",
  "output",
  "prompt",
  "questionText",
  "scenario",
  "subtitle",
  "text",
  "title",
  "why",
]);

function load(locale: "de" | "en", filename: string): JsonValue {
  const relativePath =
    locale === "de"
      ? `content/eu-ai-act-kurs/${filename}`
      : `content/eu-ai-act-kurs/en/${filename}`;

  return JSON.parse(
    readFileSync(resolve(process.cwd(), relativePath), "utf8"),
  ) as JsonValue;
}

function replaceLearnerCopy(value: JsonValue, key?: string): JsonValue {
  if (key && LEARNER_COPY_KEYS.has(key)) {
    if (Array.isArray(value)) {
      return value.map(() => "<learner-copy>");
    }
    return "<learner-copy>";
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceLearnerCopy(item));
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        replaceLearnerCopy(entryValue, entryKey),
      ]),
    );
  }

  return value;
}

function collectLearnerCopy(
  value: JsonValue,
  path = "$",
  result: Record<string, string> = {},
): Record<string, string> {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectLearnerCopy(item, `${path}[${index}]`, result),
    );
    return result;
  }

  if (value === null || typeof value !== "object") {
    return result;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (LEARNER_COPY_KEYS.has(key)) {
      result[childPath] =
        typeof child === "string" ? child : JSON.stringify(child);
    }
    collectLearnerCopy(child, childPath, result);
  }

  return result;
}

describe("EU AI Act English blocks 3 and 4", () => {
  for (const filename of BLOCK_FILES) {
    it(`${filename} preserves exact structural and machine-data parity`, () => {
      const german = load("de", filename);
      const english = load("en", filename);

      expect(replaceLearnerCopy(english)).toEqual(replaceLearnerCopy(german));
      expect(english).not.toEqual(german);
    });

    it(`${filename} translates every learner-facing field`, () => {
      const german = collectLearnerCopy(load("de", filename));
      const english = collectLearnerCopy(load("en", filename));

      expect(Object.keys(english)).toEqual(Object.keys(german));
      for (const [path, text] of Object.entries(english)) {
        expect(text.trim(), `${path} must not be empty`).not.toBe("");
        expect(text, `${path} must be translated`).not.toBe(german[path]);
      }
    });
  }

  it("keeps implementation examples distinct from statutory duties", () => {
    const block3 = JSON.stringify(
      load("en", "block-3-hochrisiko-lessons.json"),
    );
    const block4 = JSON.stringify(
      load("en", "block-4-gpai-transparenz-lessons.json"),
    );

    expect(block3).toContain("does not prescribe that interval");
    expect(block3).toContain("not automatically a substantial modification");
    expect(block3).toContain("does not prescribe a universal interval");
    expect(block4).toContain("not proof of compliance or a general quality rating");
    expect(block4).toContain("not a statutory checklist");
    expect(block4).toContain("does not mandate one technology");
  });
});
